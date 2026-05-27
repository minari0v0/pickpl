import os
import sys
import json
import argparse
import logging
from dotenv import load_dotenv

# 내부 모듈 로드
from scraper.portal_scraper import PortalScraper
from analyzer.gemini_client import GeminiAnalyzer
from loader.batch_loader import BatchLoader

# 루트 폴더 및 현재 폴더의 .env 파일 로드
# 윈도우 한글 깨짐 우회를 위해 UTF-8 명시 수동 파싱 적용
dotenv_path = os.path.join(os.path.dirname(__file__), "..", ".env")
if os.path.exists(dotenv_path):
    with open(dotenv_path, "r", encoding="utf-8") as f:
        for line in f:
            if "=" in line and not line.strip().startswith("#"):
                k, v = line.strip().split("=", 1)
                # 따옴표 제거 처리
                val = v.strip().strip("'").strip('"')
                os.environ[k.strip()] = val

load_dotenv(dotenv_path=dotenv_path)
load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

RAW_DATA_DIR = os.path.join(os.path.dirname(__file__), "raw_data")
OUTPUT_FILE = os.path.join(RAW_DATA_DIR, "analyzed_places.json")

def ensure_directory():
    if not os.path.exists(RAW_DATA_DIR):
        os.makedirs(RAW_DATA_DIR)

def run_analysis(query: str = None, source: str = "naver"):
    logger.info("=========================================")
    logger.info("1단계: 공간 정보 크롤링 및 AI 감성 분석 시작")
    logger.info("=========================================")
    
    ensure_directory()
    
    # 윈도우 터미널 인자 깨짐 및 빈 문자열을 대비한 하이브리드 검색어 설정 로직
    # 영문(로마자) 검색어를 한글 맵 쿼리로 자동 치환하는 번역 사전 구축 (인코딩 버그 원천 봉쇄)
    QUERY_MAP = {
        "mangwon": "망원동 카페",
        "hongdae": "홍대 카페",
        "hapjeong": "합정 카페",
        "sinchon": "신촌 카페",
        "sinsa": "신사역 카페",
        "gangnam": "강남역 카페",
        "seodaemun": "서대문역 카페",
        "itaewon": "이태원 카페"
    }

    # 1. 인자값 유효성 체크
    if query:
        query = query.strip()
        if query == "" or "\ufffd" in query or "?" in query:
            query = None
            
    # 2. .env의 SEARCH_QUERY 체크
    if not query:
        env_query = os.getenv("SEARCH_QUERY")
        if env_query and "\ufffd" not in env_query:
            query = env_query.strip()
        
    # 3. 미지정 시 대화형 입력 (바이트 기반 디코딩 안전 우회)
    if not query:
        try:
            print("\n[안내] 검색어를 입력해 주세요 (영문/한글 모두 지원)")
            sys.stdout.flush()
            # 원시 바이트 스트림으로 한 줄 읽기
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
                logger.info(f"대화형 입력 접수: '{query}'")
        except Exception as e:
            logger.warning(f"대화형 입력 오류: {e}")
            
    if not query:
        logger.info("검색어가 제공되지 않았습니다. 기본 테스트 키워드('합정 카페')로 진행합니다.")
        query = "합정 카페"

    # 로마자 검색어 매핑 번역 적용
    query_lower = query.lower().replace(" ", "").replace("_", "").replace("-", "")
    if query_lower in QUERY_MAP:
        translated_query = QUERY_MAP[query_lower]
        logger.info(f"로마자 검색어 번역 적용: '{query}' -> '{translated_query}'")
        query = translated_query
        
    # 소스(naver/kakao) 결정 (.env 또는 인자)
    if not source or source == "naver":
        env_source = os.getenv("SEARCH_SOURCE", "naver")
        if env_source in ["naver", "kakao"]:
            source = env_source

    scraper = PortalScraper(use_mock=False) # 실제 실시간 크롤러 작동 활성화
    
    logger.info(f"지도 서비스로부터 데이터 수집을 시도합니다. (검색어: '{query}', 포털: '{source}')")
    raw_places = scraper.scrape_by_query(query=query, source=source, limit=3)
    logger.info(f"성공적으로 {len(raw_places)}개의 장소 실시간 데이터를 수집했습니다.")
    
    # 2. Gemini API 분석 진행
    api_key = os.getenv("GEMINI_API_KEY")
    model_name = os.getenv("GEMINI_MODEL", "gemini-3-flash-preview")
    
    if not api_key:
        logger.error("에러: .env 파일에 GEMINI_API_KEY가 존재하지 않습니다.")
        sys.exit(1)
        
    analyzer = GeminiAnalyzer(api_key=api_key, model_name=model_name)
    logger.info("Gemini API 감성 큐레이션 분석 작업을 요청합니다...")
    analyzed_places = analyzer.analyze_places_batch(raw_places, batch_size=3)
    
    # 3. 로컬 JSON 저장
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(analyzed_places, f, ensure_ascii=False, indent=2)
        
    logger.info("=========================================")
    logger.info("크롤링 및 AI 분석 단계가 정상적으로 종료되었습니다.")
    logger.info(f"결과 파일 저장 위치: {OUTPUT_FILE}")
    logger.info("이 파일을 눈으로 직접 검토하신 후, 필요에 따라 태그나 요약글을 직접 가공하실 수 있습니다.")
    logger.info("만족스러우시다면, 다음 명령을 실행하여 백엔드 DB에 적재하세요:")
    logger.info(" => make pipe-load")
    logger.info("=========================================")

def run_loading():
    logger.info("=========================================")
    logger.info("2단계: 가공 데이터 백엔드 DB 벌크 주입 시작")
    logger.info("=========================================")
    
    if not os.path.exists(OUTPUT_FILE):
        logger.error(f"에러: 분석 결과 파일({OUTPUT_FILE})이 존재하지 않습니다.")
        logger.error("먼저 'make pipe-analyze'를 통해 데이터를 분석 및 생성하십시오.")
        sys.exit(1)
        
    # 1. 파일 데이터 로드
    with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
        places_to_load = json.load(f)
        
    logger.info(f"로컬 파일에서 {len(places_to_load)}개의 장소 정보를 로드했습니다.")
    
    # 2. 백엔드 적재 진행
    admin_key = os.getenv("ADMIN_SECRET_KEY")
    backend_url = os.getenv("BACKEND_URL", "http://localhost:8080")
    
    if not admin_key:
        logger.error("에러: .env 파일에 ADMIN_SECRET_KEY가 존재하지 않습니다.")
        sys.exit(1)
        
    loader = BatchLoader(backend_url=backend_url, admin_key=admin_key)
    success = loader.load_to_backend(places_to_load)
    
    if success:
        logger.info("=========================================")
        logger.info("데이터 적재가 완전히 완료되었습니다! DB 및 홈 피드에서 확인해 보세요.")
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
    
    parser.add_argument("--query", type=str, default=None, help="네이버/카카오 지도에서 검색할 키워드 (예: '홍대 카페')")
    parser.add_argument("--source", type=str, default="naver", choices=["naver", "kakao"], help="크롤링 대상 포털 소스")
    
    args = parser.parse_args()
    
    if args.analyze:
        run_analysis(query=args.query, source=args.source)
    elif args.load:
        run_loading()

if __name__ == "__main__":
    main()
