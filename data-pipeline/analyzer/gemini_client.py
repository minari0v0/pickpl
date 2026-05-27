import os
import time
import logging
import requests
from typing import List, Dict, Any
from pydantic import BaseModel, Field
from google import genai
from google.genai import types

from analyzer.prompts import SYSTEM_PROMPT, RECOMMENDED_TAGS

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# Pydantic을 활용한 Gemini Structured Output 스키마 정의
class PlaceAnalysis(BaseModel):
    externalId: str = Field(description="장소의 고유 식별자(externalId)")
    aiMoodSummary: str = Field(description="장소의 분위기를 트렌디하게 요약한 1~2줄 글 (최대 100자)")
    tags: List[str] = Field(description="추천 태그 풀에서 선정한 2~5개 태그 리스트")

class BatchAnalysisResponse(BaseModel):
    places: List[PlaceAnalysis] = Field(description="분석된 장소 결과 목록")

class GeminiAnalyzer:
    """
    최신 gemini-2.5-flash 또는 gemini-3-flash-preview 모델을 활용하여
    공간 이미지와 리뷰 데이터를 일괄 분석하고 구조화된 JSON 데이터로 요약하는 감성 분석기.
    """
    
    def __init__(self, api_key: str, model_name: str = "gemini-3-flash-preview"):
        if not api_key:
            raise ValueError("Gemini API Key가 누락되었습니다. .env 파일을 확인해 주세요.")
        self.client = genai.Client(api_key=api_key)
        self.model_name = model_name
        logger.info(f"Gemini Analyzer 초기화 완료. 모델: {self.model_name}")

    def download_image_as_part(self, image_url: str) -> types.Part:
        """
        이미지 URL에서 바이너리를 다운로드해 Gemini API 전송 규격(Part)으로 변환합니다.
        Gemini API가 지원하지 않는 SVG 이미지(image/svg+xml)는 안전하게 패스합니다.
        """
        try:
            # URL 기반 SVG 필터링
            if image_url.lower().endswith(".svg") or "svg" in image_url.lower():
                logger.warning(f"SVG 형식 또는 로고 이미지 감지하여 다운로드 생략: {image_url}")
                return None

            logger.info(f"이미지 다운로드 중: {image_url}")
            response = requests.get(image_url, timeout=10)
            response.raise_for_status()
            
            # Content-Type 판정 (기본값 image/jpeg)
            content_type = response.headers.get("Content-Type", "image/jpeg").lower()
            if "svg" in content_type or "xml" in content_type:
                logger.warning(f"응답 헤더가 SVG로 판정되어 다운로드 생략: {content_type}")
                return None

            if "image" not in content_type:
                content_type = "image/jpeg"
                
            return types.Part.from_bytes(
                data=response.content,
                mime_type=content_type
            )
        except Exception as e:
            logger.warning(f"이미지({image_url}) 다운로드 실패 (텍스트 위주 분석으로 진행): {e}")
            return None

    def analyze_places_batch(self, places: List[Dict[str, Any]], batch_size: int = 3) -> List[Dict[str, Any]]:
        """
        무료 쿼타 한도를 효율적으로 사용하기 위해 다수 장소를 묶어 1회의 API 호출로 일괄 분석합니다.
        """
        analyzed_results = []
        
        # 장소 목록을 batch_size 단위로 쪼개어 루프 수행
        for i in range(0, len(places), batch_size):
            batch = places[i:i + batch_size]
            logger.info(f"일괄 분석 배치 실행 중 ({i // batch_size + 1}번째 배치, 크기: {len(batch)})")
            
            contents = []
            prompt_parts = []
            
            # 배치 내 장소 데이터 가공 및 이미지 다운로드
            for idx, p in enumerate(batch):
                ext_id = p.get("externalId")
                name = p.get("name")
                reviews = p.get("reviews", [])
                thumbnail_url = p.get("thumbnailUrl")
                
                # 프롬프트 빌드
                place_prompt = f"### 장소 [{idx+1}]\n"
                place_prompt += f"- 장소명: {name}\n"
                place_prompt += f"- externalId: {ext_id}\n"
                place_prompt += f"- 리뷰 내용:\n"
                for rev in reviews[:5]: # 최대 5개 리뷰만 전달하여 컨텍스트 효율화
                    place_prompt += f"  * {rev}\n"
                
                prompt_parts.append(place_prompt)
                
                # 이미지 멀티모달 요소 추가
                if thumbnail_url:
                    img_part = self.download_image_as_part(thumbnail_url)
                    if img_part:
                        # 이미지와 externalId 매칭을 위해 각 이미지 파트 뒤에 텍스트 설명을 추가
                        contents.append(img_part)
                        contents.append(f"위 이미지는 장소 {name} (externalId: {ext_id})의 대표 사진입니다.")
            
            # 최종 텍스트 요구사항 결합
            combined_prompt = "\n".join(prompt_parts)
            combined_prompt += "\n\n위 장소들의 이미지와 리뷰를 분석하여 스키마 형태의 JSON으로 반환하세요."
            contents.append(combined_prompt)
            
            # API 호출
            try:
                system_instr = SYSTEM_PROMPT.format(tags_pool=", ".join(RECOMMENDED_TAGS))
                
                try:
                    response = self.client.models.generate_content(
                        model=self.model_name,
                        contents=contents,
                        config=types.GenerateContentConfig(
                            response_mime_type="application/json",
                            response_schema=BatchAnalysisResponse,
                            system_instruction=system_instr,
                            temperature=0.2
                        )
                    )
                except Exception as api_err:
                    # 429 또는 RESOURCE_EXHAUSTED 에러 감지 시 gemini-2.5-flash 모델로 자동 폴백 재시도
                    err_str = str(api_err)
                    if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                        fallback_model = "gemini-2.5-flash"
                        if self.model_name != fallback_model:
                            logger.warning(f"모델 {self.model_name}의 API 쿼터 한도가 초과되어 fallback 모델 {fallback_model}로 재시도합니다. 에러: {api_err}")
                            response = self.client.models.generate_content(
                                model=fallback_model,
                                contents=contents,
                                config=types.GenerateContentConfig(
                                    response_mime_type="application/json",
                                    response_schema=BatchAnalysisResponse,
                                    system_instruction=system_instr,
                                    temperature=0.2
                                )
                            )
                        else:
                            raise api_err
                    else:
                        raise api_err
                
                # 파싱 결과 파싱 및 맵 구성
                res_text = response.text
                logger.info(f"Gemini API 응답 수신 성공.")
                
                # Pydantic을 활용한 안전한 역직렬화
                batch_response = BatchAnalysisResponse.model_validate_json(res_text)
                
                # 결과 맵핑
                analysis_map = {item.externalId: item for item in batch_response.places}
                
                for p in batch:
                    ext_id = p.get("externalId")
                    matched = analysis_map.get(ext_id)
                    if matched:
                        p["aiMoodSummary"] = matched.aiMoodSummary
                        p["tags"] = matched.tags
                        logger.info(f"장소 [{p['name']}] 분석 매핑 완료 -> 요약: {matched.aiMoodSummary}, 태그: {matched.tags}")
                    else:
                        # 매칭 실패 시 기본값 세팅
                        p["aiMoodSummary"] = f"{p['name']}은(는) 분위기 좋은 아늑한 공간입니다."
                        p["tags"] = ["코지한", "데이트코스"]
                        logger.warning(f"장소 [{p['name']}] 에 대한 AI 분석 매핑 결과가 없어 기본값으로 대체합니다.")
                    
                    analyzed_results.append(p)
                    
            except Exception as e:
                logger.error(f"Gemini 일괄 분석 API 호출 실패 (배치 {i // batch_size + 1}): {e}")
                # 배치 통째로 에러 시 Fallback 처리
                for p in batch:
                    p["aiMoodSummary"] = f"{p['name']}은(는) 매력적인 분위기의 감성 공간입니다."
                    p["tags"] = ["코지한", "조용한"]
                    analyzed_results.append(p)
            
            # RPM 쿼타 제한 우회를 위해 다음 배치 실행 전 대기 (5초)
            if i + batch_size < len(places):
                logger.info("RPM Rate Limit을 우회하기 위해 5초간 대기합니다...")
                time.sleep(5.0)
                
        return analyzed_results
