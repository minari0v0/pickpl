import os
import sys
import json
import argparse
import logging
import time
from dotenv import load_dotenv

# 내부 모듈 로드
from scraper.portal_scraper import PortalScraper
from analyzer.gemini_client import GeminiAnalyzer
from loader.batch_loader import BatchLoader

# 루트 폴더 및 현재 폴더의 .env 파일 로드
dotenv_path = os.path.join(os.path.dirname(__file__), "..", ".env")
if os.path.exists(dotenv_path):
    with open(dotenv_path, "r", encoding="utf-8") as f:
        for line in f:
            if "=" in line and not line.strip().startswith("#"):
                k, v = line.strip().split("=", 1)
                val = v.strip().strip("'").strip('"')
                os.environ[k.strip()] = val

load_dotenv(dotenv_path=dotenv_path)
load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

RAW_DATA_DIR = os.path.join(os.path.dirname(__file__), "raw_data")
OUTPUT_FILE = os.path.join(RAW_DATA_DIR, "analyzed_places.json")
REGIONS_FILE = os.path.join(os.path.dirname(__file__), "regions.json")

def ensure_directory():
    if not os.path.exists(RAW_DATA_DIR):
        os.makedirs(RAW_DATA_DIR)

def load_regions():
    if not os.path.exists(REGIONS_FILE):
        logger.warning(f"regions.json 파일이 존재하지 않습니다: {REGIONS_FILE}")
        return {}
    try:
        with open(REGIONS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get("regions", {})
    except Exception as e:
        logger.error(f"regions.json 로드 중 오류 발생: {e}")
        return {}

def save_and_merge_results(new_places: list):
    ensure_directory()
    existing_places = []
    if os.path.exists(OUTPUT_FILE):
        try:
            with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
                existing_places = json.load(f)
                if not isinstance(existing_places, list):
                    existing_places = []
        except Exception as e:
            logger.warning(f"기존 분석 결과 읽기 오류 (무시하고 새로 작성): {e}")
            existing_places = []

    # externalId 기준 중복 제거 병합
    existing_ids = {p.get("externalId") for p in existing_places if p.get("externalId")}
    merged_places = list(existing_places)
    added_count = 0
    for p in new_places:
        ext_id = p.get("externalId")
        if ext_id not in existing_ids:
            merged_places.append(p)
            existing_ids.add(ext_id)
            added_count += 1
            
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(merged_places, f, ensure_ascii=False, indent=2)
    logger.info(f"병합 완료. 기존 장소에 신규 {added_count}개 추가됨. (총 {len(merged_places)}개 저장 위치: {OUTPUT_FILE})")

def process_single_query(query: str, source: str, limit: int, scraper: PortalScraper, analyzer: GeminiAnalyzer) -> list:
    logger.info(f"==> 쿼리 실행: '{query}' (출처: {source}, 개수 한도: {limit})")
    
    # 1. 크롤링 수행 (샘플링 활성화 인자 전달 - 2단계에서 고도화 예정)
    raw_places = scraper.scrape_by_query(query=query, source=source, limit=limit)
    logger.info(f"수집 성공: {len(raw_places)}개 장소 확보")
    if not raw_places:
        return []
        
    # 2. Gemini 감성 분석 수행
    logger.info("Gemini AI 감성/시설 분석 요청 중...")
    analyzed = analyzer.analyze_places_batch(raw_places, batch_size=3)
    return analyzed

def run_analysis(query: str = None, source: str = "naver", limit: int = 3, region: str = None, category: str = None, query_all: bool = False):
    logger.info("=========================================")
    logger.info("1단계: 공간 정보 크롤링 및 AI 감성/시설 분석 시작")
    logger.info("=========================================")
    
    REGIONS_MAP = load_regions()
    KEYWORDS = ["맛집", "술집", "카페", "핫플레이스"]
    
    api_key = os.getenv("GEMINI_API_KEY")
    model_name = os.getenv("GEMINI_MODEL", "gemini-3-flash-preview")
    if not api_key:
        logger.error("에러: .env 파일에 GEMINI_API_KEY가 존재하지 않습니다.")
        sys.exit(1)
        
    scraper = PortalScraper(use_mock=False)
    analyzer = GeminiAnalyzer(api_key=api_key, model_name=model_name)
    
    queries_to_run = []
    
    # 1. --query-all 플래그 처리
    if query_all:
        if not REGIONS_MAP:
            logger.error("에러: regions.json에서 지역 정보를 찾을 수 없어 --query-all을 수행할 수 없습니다.")
            sys.exit(1)
        logger.info(f"전체 지역({len(REGIONS_MAP)}개) x 카테고리({len(KEYWORDS)}개) 조합 순회 시작...")
        for reg_val in REGIONS_MAP.values():
            for kw in KEYWORDS:
                queries_to_run.append(f"{reg_val} {kw}")
                
    # 2. --region 및 --category 조합 처리
    elif region or category:
        reg_name = ""
        cat_name = category.strip() if category else "카페"
        
        if region:
            reg_key = region.strip().lower()
            if reg_key in REGIONS_MAP:
                reg_name = REGIONS_MAP[reg_key]
            else:
                reg_name = region.strip() # 매핑 없으면 그대로 사용
        else:
            reg_name = "합정"
            
        queries_to_run.append(f"{reg_name} {cat_name}")
        
    # 3. --query (다중 쿼리 혹은 단일 쿼리) 처리
    else:
        # 쿼리가 지정되지 않은 경우의 폴백 처리
        if not query:
            env_query = os.getenv("SEARCH_QUERY")
            if env_query:
                query = env_query.strip()
                
        # 대화형 입력 처리
        if not query:
            try:
                print("\n[안내] 검색어를 입력해 주세요 (쉼표 구분으로 다중 입력 가능. 예: 홍대 카페, 망원 술집)")
                sys.stdout.flush()
                line_bytes = sys.stdin.buffer.readline()
                user_input = None
                for enc in ["cp949", "utf-8", "utf-16", "euc-kr"]:
                    try:
                        candidate = line_bytes.decode(enc).strip()
                        candidate.encode("utf-8")
                        user_input = candidate
                        break
                    except Exception:
                        continue
                if not user_input:
                    user_input = line_bytes.decode("utf-8", errors="ignore").strip()
                if user_input:
                    query = user_input
            except Exception as e:
                logger.warning(f"대화형 입력 오류: {e}")
                
        if not query:
            logger.info("검색어가 제공되지 않았습니다. 기본 테스트 키워드('합정 카페')로 진행합니다.")
            query = "합정 카페"
            
        # 쉼표 구분 다중 쿼리 파싱 및 로마자 치환 매핑
        parts = [p.strip() for p in query.split(",") if p.strip()]
        for part in parts:
            part_lower = part.lower().replace(" ", "").replace("_", "").replace("-", "")
            # 영문 번역 치환 적용 (예: hongdae -> 홍대 카페)
            if part_lower in REGIONS_MAP:
                translated = f"{REGIONS_MAP[part_lower]} 카페"
                logger.info(f"영문 지역 치환 적용: '{part}' -> '{translated}'")
                queries_to_run.append(translated)
            else:
                queries_to_run.append(part)
                
    # 소스(naver/kakao) 결정 (.env 또는 인자)
    if not source or source == "naver":
        env_source = os.getenv("SEARCH_SOURCE", "naver")
        if env_source in ["naver", "kakao"]:
            source = env_source

    total_new_places = []
    logger.info(f"실행할 총 쿼리 개수: {len(queries_to_run)}개")
    
    # 쿼리 순회 실행
    for idx, q in enumerate(queries_to_run):
        if idx > 0:
            logger.info("쿼리간 간섭 방지 및 봇 차단 우회를 위해 5초간 대기합니다...")
            time.sleep(5.0)
        try:
            places = process_single_query(q, source, limit, scraper, analyzer)
            total_new_places.extend(places)
        except Exception as e:
            logger.error(f"쿼리 '{q}' 실행 실패: {e}")
            
    # 최종 결과 병합 저장
    if total_new_places:
        save_and_merge_results(total_new_places)
        
    logger.info("=========================================")
    logger.info("대량 크롤링 및 AI 분석 완료!")
    logger.info("=========================================")

def run_loading():
    logger.info("=========================================")
    logger.info("2단계: 가공 데이터 백엔드 DB 벌크 주입 시작")
    logger.info("=========================================")
    
    if not os.path.exists(OUTPUT_FILE):
        logger.error(f"에러: 분석 결과 파일({OUTPUT_FILE})이 존재하지 않습니다.")
        logger.error("먼저 'make pipe-analyze'를 통해 데이터를 분석 및 생성하십시오.")
        sys.exit(1)
        
    with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
        places_to_load = json.load(f)
        
    logger.info(f"로컬 파일에서 {len(places_to_load)}개의 장소 정보를 로드했습니다.")
    
    admin_key = os.getenv("ADMIN_SECRET_KEY")
    backend_url = os.getenv("BACKEND_URL", "http://localhost:8080")
    if not admin_key:
        logger.error("에러: .env 파일에 ADMIN_SECRET_KEY가 존재하지 않습니다.")
        sys.exit(1)
        
    loader = BatchLoader(backend_url=backend_url, admin_key=admin_key)
    success = loader.load_to_backend(places_to_load)
    
    if success:
        logger.info("=========================================")
        logger.info("데이터 적재가 완전히 완료되었습니다!")
        logger.info("=========================================")
    else:
        logger.error("=========================================")
        logger.error("데이터 적재 실패. 백엔드 서버 상태 및 로그를 확인하십시오.")
        logger.error("=========================================")
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="PickPl Data Pipeline Engine")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--analyze", action="store_true", help="크롤링 및 Gemini 감성 분석 수행 후 로컬 JSON으로 저장")
    group.add_argument("--load", action="store_true", help="분석 결과 로컬 JSON을 읽어 스프링 백엔드 DB에 적재")
    
    parser.add_argument("--query", type=str, default=None, help="네이버/카카오 지도에서 검색할 키워드 (쉼표 구분 다중 지원)")
    parser.add_argument("--source", type=str, default="naver", choices=["naver", "kakao"], help="크롤링 대상 포털 소스")
    parser.add_argument("--limit", type=int, default=3, help="검색당 수집할 최대 장소 개수 (기본 3)")
    parser.add_argument("--region", type=str, default=None, help="지역명 필터 (영문/한글 매핑 지원)")
    parser.add_argument("--category", type=str, default=None, choices=["맛집", "술집", "카페", "핫플레이스"], help="수집 대상 카테고리")
    parser.add_argument("--query-all", action="store_true", help="regions.json의 모든 지역과 4대 업종 키워드 조합 순회 수집")
    
    args = parser.parse_args()
    
    if args.analyze:
        run_analysis(
            query=args.query,
            source=args.source,
            limit=args.limit,
            region=args.region,
            category=args.category,
            query_all=args.query_all
        )
    elif args.load:
        run_loading()

if __name__ == "__main__":
    main()
