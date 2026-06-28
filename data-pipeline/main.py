import os
import sys
import json
import argparse
import logging
import time
import re
import glob
import random
from datetime import datetime
from dotenv import load_dotenv

# 내부 모듈 로드
from scraper.portal_scraper import PortalScraper
from analyzer.gemini_client import GeminiAnalyzer
from loader.batch_loader import BatchLoader
from utils.gui_monitor import GuiMonitor

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
REGIONS_FILE = os.path.join(os.path.dirname(__file__), "regions.json")

def ensure_directory():
    if not os.path.exists(RAW_DATA_DIR):
        os.makedirs(RAW_DATA_DIR)

def get_raw_output_path(file_arg=None, default_to_latest=False):
    ensure_directory()
    if file_arg:
        if re.match(r"^\d{4}-\d{2}-\d{2}$", file_arg):
            return os.path.join(RAW_DATA_DIR, f"raw_places_{file_arg}.json")
        if os.path.isabs(file_arg) or "/" in file_arg or "\\" in file_arg:
            return file_arg
        if not file_arg.startswith("raw_"):
            return os.path.join(RAW_DATA_DIR, f"raw_places_{file_arg}.json")
        return os.path.join(RAW_DATA_DIR, file_arg)
    
    if default_to_latest:
        pattern = os.path.join(RAW_DATA_DIR, "raw_places_*.json")
        files = glob.glob(pattern)
        if files:
            files.sort(key=os.path.getmtime, reverse=True)
            return files[0]
            
    today_str = datetime.now().strftime("%Y-%m-%d")
    return os.path.join(RAW_DATA_DIR, f"raw_places_{today_str}.json")

def get_analyzed_output_path(file_arg=None, default_to_latest=False):
    ensure_directory()
    if file_arg:
        if re.match(r"^\d{4}-\d{2}-\d{2}$", file_arg):
            return os.path.join(RAW_DATA_DIR, f"analyzed_places_{file_arg}.json")
        if os.path.isabs(file_arg) or "/" in file_arg or "\\" in file_arg:
            return file_arg
        if not file_arg.startswith("analyzed_"):
            return os.path.join(RAW_DATA_DIR, f"analyzed_places_{file_arg}.json")
        return os.path.join(RAW_DATA_DIR, file_arg)
    
    if default_to_latest:
        pattern = os.path.join(RAW_DATA_DIR, "analyzed_places_*.json")
        files = glob.glob(pattern)
        if files:
            files.sort(key=os.path.getmtime, reverse=True)
            return files[0]
            
    today_str = datetime.now().strftime("%Y-%m-%d")
    return os.path.join(RAW_DATA_DIR, f"analyzed_places_{today_str}.json")

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

def save_and_merge_results(new_places: list, output_file: str):
    ensure_directory()
    existing_places = []
    if os.path.exists(output_file):
        try:
            with open(output_file, "r", encoding="utf-8") as f:
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
            
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(merged_places, f, ensure_ascii=False, indent=2)
    logger.info(f"병합 완료. 기존 장소에 신규 {added_count}개 추가됨. (총 {len(merged_places)}개 저장 위치: {output_file})")

def run_scraping(query: str = None, source: str = "naver", limit: int = 3, region: str = None, category: str = None, query_all: bool = False, output_file: str = None, delay: float = 5.0, delay_random: bool = False, gui: bool = False, curation_theme: str = None):
    logger.info("=========================================")
    logger.info("1단계: 공간 정보 크롤링 (No AI) 시작")
    logger.info("=========================================")
    
    REGIONS_MAP = load_regions()
    KEYWORDS = ["맛집", "술집", "카페", "핫플레이스", "디저트", "명소"]
    
    scraper = PortalScraper(use_mock=False)
    queries_to_run = []
    query_to_theme_map = {}
    
    # 0. --curation-theme 플래그 처리
    if curation_theme:
        curation_file = os.path.join(os.path.dirname(__file__), "curation_queries.json")
        if not os.path.exists(curation_file):
            logger.error(f"에러: curation_queries.json 파일이 존재하지 않습니다: {curation_file}")
            sys.exit(1)
        try:
            with open(curation_file, "r", encoding="utf-8") as f:
                curation_data = json.load(f)
            
            themes = []
            if curation_theme == "all":
                themes = list(curation_data.keys())
            else:
                # 쉼표 구분 지원
                requested_themes = [t.strip() for t in curation_theme.split(",") if t.strip()]
                for rt in requested_themes:
                    if rt in curation_data:
                        themes.append(rt)
                    else:
                        logger.warning(f"경고: 알 수 없는 큐레이션 테마 건너뜀: {rt}")
            
            for theme in themes:
                theme_queries = curation_data[theme].get("queries", [])
                logger.info(f"큐레이션 테마 '{theme}' ({curation_data[theme].get('title')}) 에서 {len(theme_queries)}개 쿼리 로드")
                for tq in theme_queries:
                    queries_to_run.append(tq)
                    query_to_theme_map[tq] = theme
        except Exception as e:
            logger.error(f"curation_queries.json 로드 중 오류 발생: {e}")
            sys.exit(1)
            
    # 1. --query-all 플래그 처리
    elif query_all:
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
                reg_name = region.strip()
        else:
            reg_name = "합정"
            
        queries_to_run.append(f"{reg_name} {cat_name}")
        
    # 3. --query 처리
    else:
        if not query:
            env_query = os.getenv("SEARCH_QUERY")
            if env_query:
                query = env_query.strip()
                
        if not query:
            logger.info("검색어가 제공되지 않았습니다. 기본 테스트 키워드('합정 카페')로 진행합니다.")
            query = "합정 카페"
            
        parts = [p.strip() for p in query.split(",") if p.strip()]
        for part in parts:
            part_lower = part.lower().replace(" ", "").replace("_", "").replace("-", "")
            if part_lower in REGIONS_MAP:
                translated = f"{REGIONS_MAP[part_lower]} 카페"
                logger.info(f"영문 지역 치환 적용: '{part}' -> '{translated}'")
                queries_to_run.append(translated)
            else:
                queries_to_run.append(part)
                
    existing_ids = set()
    completed_queries = set()
    if output_file and os.path.exists(output_file):
        try:
            with open(output_file, "r", encoding="utf-8") as f:
                existing_data = json.load(f)
                if isinstance(existing_data, list):
                    for p in existing_data:
                        ext_id = p.get("externalId")
                        if ext_id:
                            existing_ids.add(ext_id)
                        sq = p.get("searchQuery")
                        if sq:
                            completed_queries.add(sq)
            logger.info(f"이어서 수집 활성화: 기존 완료된 검색어 {len(completed_queries)}개 스킵 | 기존 수집 장소 {len(existing_ids)}개 감지")
        except Exception as e:
            logger.warning(f"기존 수집 정보 로드 중 실패 (처음부터 수집): {e}")

    logger.info(f"실행할 총 쿼리 개수: {len(queries_to_run)}개")
    
    # GUI 모니터 초기화
    monitor = None
    if gui:
        monitor = GuiMonitor(
            title="PickPl Data Pipeline - 1단계 공간 수집",
            task_name="네이버 지도 정보 수집",
            total_steps=len(queries_to_run)
        )
    
    def scrape_worker():
        active_idx = 0
        for q in queries_to_run:
            if q in completed_queries:
                logger.info(f"검색어 '{q}'는 이미 이전에 수집 완료되어 통째로 스킵합니다.")
                active_idx += 1
                if monitor:
                    monitor.update_progress(active_idx, f"스킵됨: {q}")
                continue
                
            if active_idx > 0:
                if delay_random:
                    sleep_time = random.uniform(delay, delay * 2.5)
                else:
                    sleep_time = delay
                logger.info(f"쿼리간 간섭 방지 및 봇 차단 우회를 위해 {sleep_time:.1f}초간 대기합니다...")
                time.sleep(sleep_time)
                
            active_idx += 1
            try:
                logger.info(f"==> 쿼리 실행: '{q}' (개수 한도: {limit})")
                if monitor:
                    monitor.update_progress(active_idx, f"수집 진행 중: '{q}'")
                raw_places = scraper.scrape_by_query(query=q, source=source, limit=limit, monitor=monitor)
                logger.info(f"수집 성공: {len(raw_places)}개 장소 확보")
                if raw_places:
                    filtered_places = [p for p in raw_places if p.get("externalId") not in existing_ids]
                    skipped_count = len(raw_places) - len(filtered_places)
                    if skipped_count > 0:
                        logger.info(f"이미 파일에 존재하는 장소 {skipped_count}개 수집 생략 (스킵)")
                    
                    for p in filtered_places:
                        p["searchQuery"] = q
                        p["curationTheme"] = query_to_theme_map.get(q, None)
                    
                    if filtered_places:
                        save_and_merge_results(filtered_places, output_file)
                        for p in filtered_places:
                            if p.get("externalId"):
                                existing_ids.add(p.get("externalId"))
            except Exception as e:
                logger.error(f"쿼리 '{q}' 실행 실패: {e}")
                if monitor:
                    monitor.update_progress(active_idx, f"⚠️ '{q}' 수집 실패")
                    time.sleep(0.5)
            
        logger.info("=========================================")
        logger.info("대량 크롤링 완료!")
        logger.info("=========================================")
        if scraper.skipped_queries:
            logger.warning(f"⚠️ 수집 중 건너뛴(실패한) 검색어 목록: {scraper.skipped_queries}")
        if monitor:
            monitor.finish(success=True, final_message="🎉 모든 지역 공간 수집이 완료되었습니다!")

    if monitor:
        import threading
        t = threading.Thread(target=scrape_worker, daemon=True)
        monitor.set_worker_thread(t)
        monitor.start_loop()
    else:
        scrape_worker()

from analyzer.gemini_client import QuotaExhaustedError

def run_analysis_pipeline(raw_file: str, analyzed_file: str, gui: bool = False):
    logger.info("=========================================")
    logger.info("2단계: Gemini AI 감성 및 카테고리 분석 시작")
    logger.info("=========================================")
    
    if not os.path.exists(raw_file):
        logger.error(f"에러: 크롤링 원본 파일({raw_file})이 존재하지 않습니다.")
        logger.error("먼저 'python main.py --scrape'를 통해 데이터를 크롤링하십시오.")
        sys.exit(1)
        
    with open(raw_file, "r", encoding="utf-8") as f:
        raw_places = json.load(f)
        
    if not isinstance(raw_places, list) or not raw_places:
        logger.info("크롤링 원본 데이터가 비어있습니다. 분석을 진행하지 않습니다.")
        return
        
    existing_analyzed = []
    existing_ids = set()
    if os.path.exists(analyzed_file):
        try:
            with open(analyzed_file, "r", encoding="utf-8") as f:
                existing_analyzed = json.load(f)
                if not isinstance(existing_analyzed, list):
                    existing_analyzed = []
                for p in existing_analyzed:
                    if p.get("externalId"):
                        existing_ids.add(p.get("externalId"))
            logger.info(f"이어서 분석하기 활성화: 이미 분석 완료된 {len(existing_ids)}개 장소 스킵")
        except Exception as e:
            logger.warning(f"기존 분석 결과 파일 읽기 오류: {e}")
            existing_analyzed = []

    to_analyze = [p for p in raw_places if p.get("externalId") not in existing_ids]
    logger.info(f"총 {len(raw_places)}개 장소 중 분석할 신규 장소: {len(to_analyze)}개")
    
    if not to_analyze:
        logger.info("이미 모든 장소의 분석이 완료되었습니다!")
        return
        
    api_key = os.getenv("GEMINI_API_KEY")
    model_name = os.getenv("GEMINI_MODEL", "gemini-3-flash-preview")
    if not api_key:
        logger.error("에러: .env 파일에 GEMINI_API_KEY가 존재하지 않습니다.")
        sys.exit(1)
        
    analyzer = GeminiAnalyzer(api_key=api_key, model_name=model_name)
    
    batch_size = 3
    quota_exhausted = False
    total_batches = (len(to_analyze) + batch_size - 1) // batch_size
    
    # GUI 초기화
    monitor = None
    if gui:
        monitor = GuiMonitor(
            title="PickPl Data Pipeline - 2단계 AI 분석",
            task_name="Gemini 감성 분석",
            total_steps=total_batches
        )
            
    def analyze_worker():
        quota_exhausted = False
        for i in range(0, len(to_analyze), batch_size):
            batch = to_analyze[i:i + batch_size]
            batch_num = i // batch_size + 1
            logger.info(f"배치 분석 실행 중 ({batch_num}/{total_batches})")
            
            # GUI 실시간 업데이트
            if monitor:
                monitor.update_progress(batch_num)
                    
            try:
                analyzed_batch = analyzer.analyze_places_batch(batch, batch_size=batch_size)
                if analyzed_batch:
                    save_and_merge_results(analyzed_batch, analyzed_file)
            except QuotaExhaustedError:
                logger.warning("⚠️ Gemini API 429 일일 쿼터 한도가 모두 소진되었습니다.")
                logger.warning("현재까지 성공한 분석 데이터를 안전하게 저장하고 작업을 중단합니다.")
                quota_exhausted = True
                if monitor:
                    monitor.finish(success=False, final_message="⚠️ Gemini API 429 일일 쿼터 한도가 모두 소진되었습니다.")
                break
            except Exception as e:
                logger.error(f"배치 분석 중 에러 발생: {e}")
                if monitor:
                    monitor.finish(success=False, final_message=f"⚠️ 배치 분석 중 에러 발생: {e}")
                break
                
        if quota_exhausted:
            logger.info("분석이 조기 중단되었습니다. 쿼터 리셋 후 다시 --analyze를 실행하여 재개할 수 있습니다.")
            if not monitor:
                os._exit(2)
        else:
            logger.info("=========================================")
            logger.info("모든 장소에 대한 AI 분석이 완료되었습니다!")
            logger.info("=========================================")
            if monitor:
                monitor.finish(success=True, final_message="🎉 모든 장소에 대한 AI 분석이 완료되었습니다!")

    if monitor:
        import threading
        t = threading.Thread(target=analyze_worker, daemon=True)
        monitor.set_worker_thread(t)
        monitor.start_loop()
    else:
        analyze_worker()


def run_loading(output_file: str, gui: bool = False):
    logger.info("=========================================")
    logger.info("3단계: 가공 데이터 백엔드 DB 벌크 주입 시작")
    logger.info("=========================================")
    
    if not os.path.exists(output_file):
        logger.error(f"에러: 분석 결과 파일({output_file})이 존재하지 않습니다.")
        logger.error("먼저 '--analyze'를 통해 데이터를 분석 및 생성하십시오.")
        sys.exit(1)
        
    with open(output_file, "r", encoding="utf-8") as f:
        places_to_load = json.load(f)
        
    logger.info(f"로컬 파일에서 {len(places_to_load)}개의 장소 정보를 로드했습니다.")
    
    # GUI 초기화
    monitor = None
    if gui:
        monitor = GuiMonitor(
            title="PickPl Data Pipeline - 3단계 DB 적재",
            task_name="백엔드 DB 주입",
            total_steps=100
        )
        monitor.update_progress(10, "백엔드 전송 준비 중...")
    
    def load_worker():
        admin_key = os.getenv("ADMIN_SECRET_KEY")
        backend_url = os.getenv("BACKEND_URL", "http://localhost:8080")
        if not admin_key:
            logger.error("에러: .env 파일에 ADMIN_SECRET_KEY가 존재하지 않습니다.")
            if monitor:
                monitor.finish(success=False, final_message="⚠️ ADMIN_SECRET_KEY 누락")
            else:
                os._exit(1)
            
        loader = BatchLoader(backend_url=backend_url, admin_key=admin_key)
        
        if monitor:
            monitor.update_progress(50, f"백엔드로 벌크 전송 중... (총 {len(places_to_load)}개 장소)")
            
        success = loader.load_to_backend(places_to_load)
        
        if success:
            logger.info("=========================================")
            logger.info("데이터 적재가 완전히 완료되었습니다!")
            logger.info("=========================================")
            if monitor:
                monitor.finish(success=True, final_message="🎉 백엔드 데이터 적재가 완료되었습니다!")
        else:
            logger.error("=========================================")
            logger.error("데이터 적재 실패. 백엔드 서버 상태 및 로그를 확인하십시오.")
            logger.error("=========================================")
            if monitor:
                monitor.finish(success=False, final_message="⚠️ 백엔드 데이터 적재 실패")
            else:
                os._exit(1)

    if monitor:
        import threading
        t = threading.Thread(target=load_worker, daemon=True)
        monitor.set_worker_thread(t)
        monitor.start_loop()
    else:
        load_worker()
def main():
    parser = argparse.ArgumentParser(description="PickPl Data Pipeline Engine")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--scrape", action="store_true", help="네이버 지도에서 Playwright 크롤링만 고속 진행하고 로컬 raw JSON으로 저장")
    group.add_argument("--analyze", action="store_true", help="raw JSON 파일을 읽어 Gemini AI 분석 수행 후 analyzed JSON으로 저장")
    group.add_argument("--load", action="store_true", help="분석 결과 로컬 JSON을 읽어 스프링 백엔드 DB에 적재")
    
    parser.add_argument("--query", type=str, default=None, help="네이버 지도에서 검색할 키워드 (쉼표 구분 다중 지원)")
    parser.add_argument("--query-file", type=str, default=None, help="한 줄에 하나씩 수집 키워드가 적힌 텍스트 파일 경로")
    parser.add_argument("--source", type=str, default="naver", choices=["naver"], help="크롤링 대상 포털 소스")
    parser.add_argument("--limit", type=int, default=3, help="검색당 수집할 최대 장소 개수 (기본 3)")
    parser.add_argument("--region", type=str, default=None, help="지역명 필터 (영문/한글 매핑 지원)")
    parser.add_argument("--category", type=str, default=None, choices=["맛집", "술집", "카페", "핫플레이스", "디저트", "명소"], help="수집 대상 카테고리")
    parser.add_argument("--query-all", action="store_true", help="regions.json의 모든 지역 x 6대 업종 키워드 조합 순회 수집")
    parser.add_argument("--curation-theme", type=str, default=None, help="큐레이션 테마 수집 사전 지정 (쉼표 구분 다중 지정 가능)")
    parser.add_argument("--file", type=str, default=None, help="저장하거나 로드할 파일명 또는 날짜(YYYY-MM-DD)")
    parser.add_argument("--delay", type=float, default=5.0, help="쿼리 간 대기 시간 (초)")
    parser.add_argument("--delay-random", action="store_true", help="대기 시간을 지정한 delay값 기반으로 무작위화")
    parser.add_argument("--gui", action="store_true", help="분석 진행률을 그래픽 팝업 창(GUI)으로 시각화")
    
    args = parser.parse_args()
    
    if args.query_file:
        if not os.path.exists(args.query_file):
            logger.error(f"에러: 지정한 쿼리 파일이 존재하지 않습니다: {args.query_file}")
            sys.exit(1)
        with open(args.query_file, "r", encoding="utf-8-sig") as f:
            lines = [line.strip() for line in f if line.strip() and not line.strip().startswith("#")]
        args.query = ",".join(lines)
    
    if args.scrape:
        output_file = get_raw_output_path(file_arg=args.file, default_to_latest=False)
        run_scraping(
            query=args.query,
            source=args.source,
            limit=args.limit,
            region=args.region,
            category=args.category,
            query_all=args.query_all,
            output_file=output_file,
            delay=args.delay,
            delay_random=args.delay_random,
            gui=args.gui,
            curation_theme=args.curation_theme
        )
    elif args.analyze:
        raw_file = get_raw_output_path(file_arg=args.file, default_to_latest=True)
        analyzed_file = get_analyzed_output_path(file_arg=args.file, default_to_latest=False)
        run_analysis_pipeline(raw_file=raw_file, analyzed_file=analyzed_file, gui=args.gui)
    elif args.load:
        output_file = get_analyzed_output_path(file_arg=args.file, default_to_latest=True)
        run_loading(output_file=output_file, gui=args.gui)

if __name__ == "__main__":
    main()
