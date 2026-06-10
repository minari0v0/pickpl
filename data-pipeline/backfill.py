import os
import sys
import json
import argparse
import logging
from dotenv import load_dotenv

# 내부 모듈 로드
from analyzer.gemini_client import GeminiAnalyzer

# 환경변수 로드
dotenv_path = os.path.join(os.path.dirname(__file__), "..", ".env")
load_dotenv(dotenv_path=dotenv_path)
load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

RAW_DATA_DIR = os.path.join(os.path.dirname(__file__), "raw_data")

def is_dummy_place(place: dict) -> bool:
    summary = place.get("aiMoodSummary", "")
    tags = place.get("tags", [])
    
    # 더미 판단 조건
    dummy_summaries = [
        "매력적인 분위기의 감성 공간입니다.",
        "분위기 좋은 아늑한 공간입니다.",
        "공간에 대한 설명이 없습니다."
    ]
    
    # 1) 더미 서머리 패턴 매치
    if any(ds in summary for ds in dummy_summaries):
        return True
    if summary.endswith("은(는) 분위기 좋은 아늑한 공간입니다.") or summary.endswith("은(는) 매력적인 분위기의 감성 공간입니다."):
        return True
        
    # 2) 태그가 기본 폴백 상태인 경우
    if tags == ["코지한", "조용한"] or tags == ["코지한", "데이트코스"]:
        return True
        
    return False

def backfill(file_path: str):
    if not os.path.exists(file_path):
        logger.error(f"파일이 존재하지 않습니다: {file_path}")
        return
        
    with open(file_path, "r", encoding="utf-8") as f:
        places = json.load(f)
        
    # 복구할 장소와 정상 장소 분리
    to_backfill = []
    normal_places = []
    
    for p in places:
        if is_dummy_place(p):
            to_backfill.append(p)
        else:
            normal_places.append(p)
            
    logger.info(f"전체 장소: {len(places)}개 | 정상 장소: {len(normal_places)}개 | 복구 대상(더미 데이터): {len(to_backfill)}개")
    
    if not to_backfill:
        logger.info("복구할 더미 데이터가 없습니다! 모든 데이터가 이미 정상 상태입니다.")
        return
        
    api_key = os.getenv("GEMINI_API_KEY")
    model_name = os.getenv("GEMINI_MODEL", "gemini-3-flash-preview")
    if not api_key:
        logger.error("에러: GEMINI_API_KEY가 없습니다.")
        return
        
    logger.info(f"Gemini API를 사용하여 {len(to_backfill)}개의 장소를 복구합니다...")
    analyzer = GeminiAnalyzer(api_key=api_key, model_name=model_name)
    
    # 복구 수행 (이미 패치된 analyze_places_batch를 타기 때문에 429 쿼터 초과 시 알아서 25초 대기하고 재시도함)
    analyzed = analyzer.analyze_places_batch(to_backfill, batch_size=3)
    
    # 복구 성공한 장소와 정상 장소 합치기
    merged_places = normal_places + analyzed
    
    # 파일 덮어쓰기
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(merged_places, f, ensure_ascii=False, indent=2)
        
    logger.info(f"복구 완료! 복구된 파일 저장 위치: {file_path}")

def main():
    parser = argparse.ArgumentParser(description="PickPl Data Pipeline Backfiller")
    parser.add_argument("--file", type=str, default=None, help="복구할 JSON 파일명 또는 날짜 (예: YYYY-MM-DD)")
    args = parser.parse_args()
    
    # 파일 경로 결정
    import re
    import glob
    file_arg = args.file
    
    if file_arg:
        if re.match(r"^\d{4}-\d{2}-\d{2}$", file_arg):
            target_file = os.path.join(RAW_DATA_DIR, f"analyzed_places_{file_arg}.json")
        elif os.path.isabs(file_arg) or "/" in file_arg or "\\" in file_arg:
            target_file = file_arg
        else:
            target_file = os.path.join(RAW_DATA_DIR, file_arg)
    else:
        # 가장 최근에 수정된 analyzed_places_*.json 자동 선택
        pattern = os.path.join(RAW_DATA_DIR, "analyzed_places_*.json")
        files = glob.glob(pattern)
        old_file = os.path.join(RAW_DATA_DIR, "analyzed_places.json")
        if os.path.exists(old_file):
            files.append(old_file)
        if files:
            files.sort(key=os.path.getmtime, reverse=True)
            target_file = files[0]
        else:
            logger.error("복구할 JSON 파일을 찾을 수 없습니다.")
            sys.exit(1)
            
    logger.info(f"복구 대상 파일: {target_file}")
    backfill(target_file)

if __name__ == "__main__":
    main()
