import os
import json
import logging
import requests
from typing import List, Dict, Any

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

class BatchLoader:
    """
    가공이 끝난 공간 데이터를 Spring Boot 백엔드 어드민 API를 통해 데이터베이스에 벌크 주입하는 로더 클래스.
    """
    
    def __init__(self, backend_url: str = "http://localhost:8080", admin_key: str = None):
        self.backend_url = backend_url.rstrip("/")
        self.admin_key = admin_key
        logger.info(f"Batch Loader 초기화 완료. 대상 API: {self.backend_url}/api/v1/internal/places/batch")

    def load_to_backend(self, places: List[Dict[str, Any]]) -> bool:
        """
        수집/분석된 장소 목록을 백엔드 서버에 벌크 전송하여 DB에 저장합니다.
        """
        if not self.admin_key:
            logger.error("Admin Secret Key가 설정되지 않았습니다. 전송을 중단합니다.")
            return False

        # 백엔드 API 포맷 구조화
        # category 매핑 처리 (백엔드에는 '카페', '음식점' 등 실제 카테고리가 들어감)
        # imageUrls는 리스트가 아니라 string(콤마 구분) 형태로 백엔드에서 받음
        formatted_places = []
        for p in places:
            cat = p.get("category", "공간")
            if not cat or cat.strip() == "":
                cat = "공간"

            formatted_places.append({
                "name": p.get("name"),
                "address": p.get("address"),
                "externalId": p.get("externalId"),
                "latitude": float(p.get("latitude", 0.0)),
                "longitude": float(p.get("longitude", 0.0)),
                "category": cat,
                "subCategory": p.get("subCategory"),
                "thumbnailUrl": p.get("thumbnailUrl"),
                "imageUrls": p.get("imageUrls"),
                "aiMoodSummary": p.get("aiMoodSummary"),
                "tags": p.get("tags", [])
            })

        payload = {"places": formatted_places}
        headers = {
            "Content-Type": "application/json",
            "X-Admin-Secret-Key": self.admin_key
        }

        try:
            url = f"{self.backend_url}/api/v1/internal/places/batch"
            logger.info(f"백엔드로 벌크 전송 중... 전송 장소 개수: {len(formatted_places)}개")
            
            response = requests.post(url, headers=headers, data=json.dumps(payload), timeout=30)
            
            if response.status_code == 200:
                logger.info(f"백엔드 데이터 주입 성공! 응답: {response.text}")
                return True
            else:
                logger.error(f"백엔드 데이터 주입 실패. HTTP {response.status_code} - {response.text}")
                return False
        except Exception as e:
            logger.error(f"백엔드 연결 실패: {e}")
            return False
