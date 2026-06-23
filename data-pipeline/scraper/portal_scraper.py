import os
import re
import time
import logging
import urllib.parse
import requests
from typing import List, Dict, Any

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

class PortalScraper:
    """
    네이버 플레이스 및 카카오 플레이스로부터 키워드 검색 기반 장소 정보와 리뷰 데이터를 실시간 크롤링하는 고도화 수집기.
    포털의 잦은 UI 리뉴얼(난독화 클래스명 변경)에 대응하기 위해 시맨틱 태그 파싱과 
    Gemini API 전송 시 400 Bad Request 오류를 유발하는 SVG 로고 이미지를 완벽히 차단하는 필터링을 탑재했습니다.
    """

    def __init__(self, use_mock: bool = False):
        self.use_mock = use_mock
        self.skipped_queries = []

    def _extract_coords(self, content: str) -> tuple:
        coord_match = re.search(r'"coordinate"\s*:\s*\{\s*"x"\s*:\s*"([\d\.]+)"\s*,\s*"y"\s*:\s*"([\d\.]+)"\s*\}', content)
        if not coord_match:
            coord_match = re.search(r'"coordinate"\s*:\s*\{\s*"x"\s*:\s*([\d\.]+)\s*,\s*"y"\s*:\s*([\d\.]+)\s*\}', content)
            
        if coord_match:
            lng = float(coord_match.group(1))
            lat = float(coord_match.group(2))
            return lat, lng

        dlat_match = re.search(r'dlat=([\d\.]+)', content)
        dlng_match = re.search(r'dlng=([\d\.]+)', content)
        if dlat_match and dlng_match:
            lat = float(dlat_match.group(1))
            lng = float(dlng_match.group(1))
            return lat, lng
            
        return 37.55, 126.92

    def _sample_ids(self, ids: List[str], limit: int) -> List[str]:
        """
        상위 랭킹(핫플)과 중하위 랭킹(Cozy 공간)을 고루 섞어 샘플링합니다.
        """
        if len(ids) <= limit:
            return ids
            
        # 핫플 우선 확보: 상위 2개는 무조건 픽업 (limit가 1이나 2면 그만큼만 픽업)
        top_count = min(2, limit)
        selected = ids[:top_count]
        
        if len(selected) >= limit:
            return selected
            
        # 나머지 개수는 중하위권(최대 15위)에서 고루 듬성듬성 샘플링
        remaining_count = limit - len(selected)
        candidates = ids[top_count:15] # 15위보다 뒤는 매칭 품질을 위해 제외
        
        if len(candidates) <= remaining_count:
            selected.extend(candidates)
        else:
            step = len(candidates) / remaining_count
            for i in range(remaining_count):
                idx = int(i * step)
                if idx < len(candidates):
                    item = candidates[idx]
                    if item not in selected:
                        selected.append(item)
                        
        # 듬성듬성 수집 후 개수가 여전히 부족하면 앞서 수집된 전체 목록에서 보충
        for item in ids:
            if len(selected) >= limit:
                break
            if item not in selected:
                selected.append(item)
                
        return selected

    def scrape_by_query(self, query: str, source: str = "naver", limit: int = 3, monitor: Any = None) -> List[Dict[str, Any]]:
        """
        검색어(query)를 기반으로 실시간 네이버 플레이스 수집을 진행합니다.
        (카카오 맵은 단일화 정책에 따라 더 이상 지원하지 않습니다.)
        """
        if self.use_mock:
            logger.info("Mock 모드로 작동합니다. 테스트 더미 데이터를 반환합니다.")
            return self.get_mock_places()

        logger.info(f"검색어: '{query}' | 수집 제한: {limit}개 (네이버 단일 수집)")
        res = self._scrape_naver(query, limit, monitor=monitor)
        if not res and query not in self.skipped_queries:
            self.skipped_queries.append(query)
        return res

    def _fetch_place_ids(self, q: str, is_place_list: bool = False, skip_ad_filter: bool = False) -> List[str]:
        """
        주어진 검색어(q)를 이용하여 모바일 통합검색 또는 플레이스 리스트 페이지에서 플레이스 ID들을 파싱합니다.
        """
        encoded_query = urllib.parse.quote(q)
        if is_place_list:
            url = f"https://m.place.naver.com/place/list?query={encoded_query}"
        else:
            url = f"https://m.search.naver.com/search.naver?query={encoded_query}"
            
        headers = {
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_8 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1"
        }
        
        raw_ids = []
        ad_ids = set()
        try:
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code != 200:
                return []
                
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(response.text, "html.parser")
            
            # 1. a 태그 href 파싱
            for a_tag in soup.find_all("a", href=True):
                href = a_tag["href"]
                match = re.search(r'(?:place\.naver\.com/|/)(?:place|restaurant|accommodation|cafe|spa|hospital|pharmacy|entry/place|entry)/(\d+)', href)
                if match:
                    p_id = match.group(1)
                    if len(p_id) < 6:
                        continue
                    
                    # 광고 뱃지 여부 검사 (탐색 범위를 2단계 부모로 제한하고 클래스명 단독 일치 검사로 오탐지 차단)
                    is_ad = False
                    curr = a_tag
                    for _ in range(2):
                        if curr is None:
                            break
                        
                        # 1) 정확한 광고 지시 텍스트 검출
                        ad_elements = curr.find_all(text=lambda t: t and t.strip() in ["광고", "광고i", "광고ⓘ", "AD"])
                        if ad_elements:
                            is_ad = True
                            break
                            
                        # 2) 광고 전용 스타일 클래스 검출
                        classes = curr.get("class", [])
                        if classes:
                            valid_ad_class = any(
                                c.lower() in ["ad", "ads", "advert", "advertisement", "sp_advert", "txt_ad", "ad_badge", "sp_ad"] 
                                for c in classes
                            )
                            if valid_ad_class:
                                is_ad = True
                                break
                        curr = curr.parent
                        
                    if is_ad and not skip_ad_filter:
                        ad_ids.add(p_id)
                        continue
                        
                    if p_id not in raw_ids:
                        raw_ids.append(p_id)
                        
            # 2. BeautifulSoup 파싱 실패/미획득 시 혹은 전반적 정규식 폴백
            place_ids = re.findall(r'place\.naver\.com/(?:place|restaurant|accommodation|cafe|spa|hospital|pharmacy|entry/place|entry)/(\d+)', response.text)
            if not place_ids:
                place_ids = re.findall(r'(?:place|restaurant|accommodation|cafe|spa|hospital|pharmacy|entry/place|entry)/(\d+)', response.text)
            if not place_ids:
                place_ids = re.findall(r'"id"\s*:\s*"(\d{6,})"', response.text)
                
            for p_id in place_ids:
                if p_id not in raw_ids and len(p_id) >= 6:
                    if skip_ad_filter or p_id not in ad_ids:
                        raw_ids.append(p_id)
                        
            if ad_ids:
                logger.info(f"네이버 광고 플레이스 감지 및 배제 완료 (총 {len(ad_ids)}개 ID: {list(ad_ids)})")
                
        except Exception as e:
            logger.warning(f"ID 획득 시도 중 오류 발생 ({url}): {e}")
            
        return raw_ids

    def _clean_review_text(self, text: str) -> str:
        if not text:
            return ""
        
        lines = text.split('\n')
        cleaned_lines = []
        
        for line in lines:
            line_strip = line.strip()
            if line_strip:
                cleaned_lines.append(line_strip)
            
        return " ".join(cleaned_lines).strip()


    def _clean_target_name(self, target: str) -> str:
        if not target:
            return ""
        # 1. 괄호 및 기호 공백 치환
        clean = re.sub(r'[\(\)\[\]\{\}\-\_]', ' ', target)
        tokens = clean.split()
        
        # 노이즈 단어 구분
        geo_stop_words = {
            "서울", "경기", "인천", "부산", "대구", "대전", "광주", "울산", "세종", "제주", "강원", "경남", "경북", "전남", "전북", "충남", "충북",
            "강릉", "광교", "한남동", "한남", "성수동", "성수", "판교", "분당", "해운대", "경주", "여수", "용산", "유성", "춘천", "홍대", "신촌", "강남", "종로", "마포", "합정"
        }
        general_stop_words = {
            "본점", "지점", "분점", "점",
            "카페", "맛집", "식당", "한우", "짬뽕", "순두부", "스튜디오", "공간", "심야식당", "야키니쿠", "이자카야", "요리주점", "주점", "술집", "디저트", "베이커리", "갈비", "숯불갈비"
        }
        all_stop_words = geo_stop_words.union(general_stop_words)
        
        filtered = []
        for t in tokens:
            if t in all_stop_words:
                continue
            
            cleaned_token = t
            # 일반 stop_words(카테고리 등)로 시작하는 경우 접두사 제거 (예: "심야식당후라후라" -> "후라후라")
            changed = True
            while changed:
                changed = False
                for sw in general_stop_words:
                    if len(sw) >= 2 and cleaned_token.startswith(sw) and len(cleaned_token) > len(sw):
                        cleaned_token = cleaned_token[len(sw):]
                        changed = True
                        break
            
            # 일반 stop_words(본점, 점 등)로 끝나는 경우 접미사 제거 (예: "동화가든본점" -> "동화가든")
            changed = True
            while changed:
                changed = False
                for sw in general_stop_words:
                    if len(sw) >= 1 and cleaned_token.endswith(sw) and len(cleaned_token) > len(sw):
                        cleaned_token = cleaned_token[:-len(sw)]
                        changed = True
                        break
                        
            if cleaned_token and cleaned_token not in all_stop_words and len(cleaned_token) >= 2:
                filtered.append(cleaned_token)
                
        if filtered:
            return " ".join(filtered)
            
        fallback = [t for t in tokens if len(t) >= 2]
        if fallback:
            return " ".join(fallback)
            
        return target

    def _is_region_matched(self, address: str, query: str) -> bool:
        if not address or address == "주소 정보 없음":
            return True
        if "-" not in query:
            return True
            
        region_prefix = query.split("-", 1)[0].strip()
        if not region_prefix:
            return True
            
        # REGION_SYNONYMS mapping
        REGION_SYNONYMS = {
            "광교": ["수원", "영통", "용인", "수지", "광교"],
            "판교": ["성남", "분당", "판교"],
            "분당": ["성남", "분당"],
            "송도": ["인천", "송도", "연수"],
            "부평": ["인천", "부평"],
            "일산": ["고양", "일산"],
            "행궁": ["수원", "행궁"],
            "수원 행궁동": ["수원", "행궁"],
            "대전": ["대전", "유성"],
            "대구": ["대구"],
            "광주": ["광주"],
            "부산": ["부산", "해운대", "수영", "기장", "전포", "동래", "금정", "사하", "진구", "연제", "남구", "북구", "사상", "영도", "중구", "서구", "동구", "강서"],
            "해운대": ["부산", "해운대"],
            "부산 해운대": ["부산", "해운대"],
            "부산 전포동": ["부산", "진구", "전포"],
            "전포동": ["부산", "진구", "전포"],
            "경주": ["경주"],
            "여수": ["여수"],
            "강릉": ["강릉"],
            "강릉 안목해변": ["강릉", "안목"],
            "제주": ["제주", "서귀포", "애월"],
            "제주 애월": ["제주", "서귀포", "애월"],
            "애월": ["제주", "서귀포", "애월"],
            "서울": ["서울"],
            "성수": ["성동", "성수", "서울"],
            "성수동": ["성동", "성수", "서울"],
            "문래": ["영등포", "문래", "서울"],
            "문래동": ["영등포", "문래", "서울"],
            "망원": ["마포", "망원", "서울"],
            "망원동": ["마포", "망원", "서울"],
            "연남": ["마포", "연남", "서울"],
            "연남동": ["마포", "연남", "서울"],
            "을지로": ["중구", "을지로", "서울"],
            "익선": ["종로", "익선", "서울"],
            "익선동": ["종로", "익선", "서울"],
            "삼청": ["종로", "삼청", "서울"],
            "삼청동": ["종로", "삼청", "서울"],
            "서촌": ["종로", "누하", "체부", "통의", "필운", "옥인", "서울"],
            "한남": ["용산", "한남", "서울"],
            "한남동": ["용산", "한남", "서울"],
            "해방촌": ["용산", "용산동2가", "신흥로", "서울"],
            "성북": ["성북", "서울"],
            "성북동": ["성북", "서울"],
            "상수": ["마포", "상수", "서울"],
            "상수동": ["마포", "상수", "서울"],
            "서교": ["마포", "서교", "서울"],
            "서교동": ["마포", "서교", "서울"],
            "홍대": ["마포", "서교", "동교", "창전", "상수", "서울"],
            "합정": ["마포", "합정", "서울"],
            "신촌": ["서대문", "창천", "서울"],
            "신림": ["관악", "신림", "서울"],
            "이태원": ["용산", "이태원", "서울"],
            "혜화": ["종로", "혜화", "명륜", "서울"],
            "건대": ["광진", "화양", "자양", "서울"],
            "삼성역": ["강남", "삼성", "서울"],
            "역삼역": ["강남", "역삼", "서울"],
            "강남역": ["강남", "서울", "서초"],
            "신사역": ["강남", "신사", "잠원", "서울"],
            "압구정": ["강남", "압구정", "서울"],
            "가로수길": ["강남", "신사", "서울"],
            "광화문": ["종로", "신문로", "당주", "도렴", "세종로", "적선", "서울"],
            "용산": ["용산", "서울"]
        }
        
        keywords = REGION_SYNONYMS.get(region_prefix, [])
        if not keywords:
            clean_prefix = region_prefix
            if len(clean_prefix) >= 3:
                for suffix in ["동", "시", "구", "역", "길"]:
                    if clean_prefix.endswith(suffix):
                        clean_prefix = clean_prefix[:-1]
                        break
            keywords = [region_prefix, clean_prefix]
            
        clean_addr = re.sub(r'\s+', '', address)
        for kw in keywords:
            if kw in clean_addr or clean_addr in kw:
                return True
        return False


    def _scrape_naver(self, query: str, limit: int, monitor: Any = None) -> List[Dict[str, Any]]:
        """
        네이버 모바일 통합 검색 우회 방식으로 플레이스 ID 획득 후 Playwright 리뷰 파싱
        """
        results = []
        is_manually_selected = False
        
        # 특정 장소 지정을 위한 진짜 장소명 타겟 추출
        target_name = None
        pure_target_name = None
        if "-" in query:
            target_name = query.split("-", 1)[1].strip()
            pure_target_name = self._clean_target_name(target_name)

        def is_name_matched(scraped: str, target: str) -> bool:
            if not target:
                return True
            def clean(t):
                return re.sub(r'[^a-zA-Z0-9가-힣]', '', t).lower()
            c_scraped = clean(scraped)
            c_target = clean(target)
            
            # 0. 랜드마크 접미사 오매칭 방지 (예: target "동화가든 본점" -> scraped "동화가든 본점입구" 매칭 방지)
            landmark_suffixes = ["입구", "삼거리", "사거리", "교차로", "방향", "정류장", "정류소", "정류장입구"]
            for suffix in landmark_suffixes:
                if c_scraped.endswith(suffix) and not c_target.endswith(suffix):
                    return False
            
            # 1. 완전 일치
            if c_scraped == c_target:
                return True
                
            # 2. 포함 관계 검사
            if c_target in c_scraped:
                return True
                
            if c_scraped in c_target:
                # 너무 짧은 단어 단독 매칭으로 인한 오매칭 방지 (예: 수집 "후라" -> 타겟 "심야식당 후라후라" 배제)
                if len(c_scraped) >= 3 or len(c_scraped) >= len(c_target) * 0.5:
                    return True
                
            # 3. 부분 단어 일치 검사 (예: "강릉짬뽕순두부 동화가든 본점" -> "동화가든" 매칭)
            tokens = [re.sub(r'[^a-zA-Z0-9가-힣]', '', w).lower() for w in re.split(r'[\s\-]+', target)]
            stop_words = {"본점", "지점", "분점", "서울", "경기", "인천", "부산", "대구", "대전", "광주", "울산", "세종", "제주", "강원", "경남", "경북", "전남", "전북", "충남", "충북", "카페", "맛집", "식당", "한우", "짬뽕", "순두부", "스튜디오", "공간"}
            meaningful_tokens = [t for t in tokens if len(t) >= 2 and t not in stop_words]
            
            for token in meaningful_tokens:
                if token in c_scraped:
                    return True
                    
            if not meaningful_tokens:
                for t in tokens:
                    if len(t) >= 2 and t in c_scraped:
                        return True
                        
            return False
        try:
            # 네이버 검색 연산자 오류를 막기 위해 하이픈을 공백으로 치환하고 다중 공백을 단일 공백으로 정제
            search_query = re.sub(r'\s+', ' ', query.replace("-", " ")).strip()
            
            # 5단계 점진적 ID 획득 시도 및 누적 (대상명 단독 및 정제된 상호명 검색을 최우선 배치)
            raw_ids = []
            
            # 1. pure_target_name이 있을 경우, 정제된 상호명 검색 최우선 배치 (매칭률 100% 극대화)
            if pure_target_name:
                logger.info(f"1단계: 정제된 상호명 단독 모바일 통합검색 시도: '{pure_target_name}' (원본: '{target_name}')")
                for p_id in self._fetch_place_ids(pure_target_name, is_place_list=False, skip_ad_filter=(target_name is not None)):
                    if p_id not in raw_ids:
                        raw_ids.append(p_id)
            
            # 2. target_name이 있을 경우, 대상명 단독 검색 (매칭률 2위)
            if target_name:
                logger.info(f"2단계: 대상명 단독 모바일 통합검색 시도: '{target_name}'")
                for p_id in self._fetch_place_ids(target_name, is_place_list=False, skip_ad_filter=(target_name is not None)):
                    if p_id not in raw_ids:
                        raw_ids.append(p_id)
                        
            # 3. 원래 검색어 전체로 모바일 통합검색 시도
            logger.info(f"3단계: 검색어 기본 모바일 통합검색 시도: '{search_query}'")
            for p_id in self._fetch_place_ids(search_query, is_place_list=False, skip_ad_filter=(target_name is not None)):
                if p_id not in raw_ids:
                    raw_ids.append(p_id)
                    
            # 4. pure_target_name 단독 플레이스 리스트 검색 시도
            if pure_target_name and len(raw_ids) < 10:
                logger.info(f"4단계: 정제된 상호명 단독 모바일 플레이스 리스트 검색 시도: '{pure_target_name}'")
                for p_id in self._fetch_place_ids(pure_target_name, is_place_list=True, skip_ad_filter=(target_name is not None)):
                    if p_id not in raw_ids:
                        raw_ids.append(p_id)
                        
            # 5. 원래 검색어 전체로 플레이스 리스트 검색 시도
            if len(raw_ids) < 10:
                logger.info(f"5단계: 검색어 기본 모바일 플레이스 리스트 검색 시도: '{search_query}'")
                for p_id in self._fetch_place_ids(search_query, is_place_list=True, skip_ad_filter=(target_name is not None)):
                    if p_id not in raw_ids:
                        raw_ids.append(p_id)
            
            # 랭킹 샘플링 및 특정 타겟 필터 적용
            if target_name:
                unique_ids = raw_ids[:10]  # 검증용 후보군을 최대 10개까지 넉넉하게 확보
                logger.info(f"특정 장소 타겟 감지 ('{target_name}'). 매칭 검증을 위해 상위 {len(unique_ids)}개 ID 후보 확보: {unique_ids}")
            else:
                unique_ids = self._sample_ids(raw_ids, limit)
                logger.info(f"일반 검색. 샘플링 필터 적용 전 전체 ID 수: {len(raw_ids)} | 샘플링 후 선택된 네이버 플레이스 ID 목록: {unique_ids}")

            if not unique_ids:
                if target_name:
                    logger.warning(f"⚠️ 특정 장소 '{target_name}'의 플레이스 ID를 네이버 검색 결과에서 찾을 수 없습니다. (Mock 데이터 대체 배제)")
                    return []
                else:
                    logger.warning("네이버 플레이스 ID를 찾지 못했습니다. Mock 데이터로 대체합니다.")
                    return self.get_mock_places()

            # 2. Playwright를 기동하여 모바일 상세 페이지에서 상호명, 주소, 리뷰 텍스트 파싱
            from playwright.sync_api import sync_playwright
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                # 네이버의 모바일 봇 탐지를 회피하기 위해 최신 Safari 모바일 UA 적용
                modern_ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1"
                context = browser.new_context(
                    user_agent=modern_ua,
                    viewport={"width": 375, "height": 812},
                    is_mobile=True
                )
                page = context.new_page()
                # 웹드라이버 감지 우회 스크립트 실행
                page.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
                # Playwright 광속 로딩 설정 (이미지/미디어/폰트 차단으로 텍스트 DOM만 광속 파싱)
                page.route("**/*.{png,jpg,jpeg,gif,webp,svg,mp4,mp3,woff,ttf}", lambda route: route.abort())

                # 만약 target_name이 지정되어 있다면, 1위 후보의 일치 여부를 초고속 체크 (패스트트랙)
                fast_track_success = False
                if target_name and unique_ids:
                    first_id = unique_ids[0]
                    first_url = f"https://m.place.naver.com/place/{first_id}/home"
                    logger.info(f"🎯 1순위 매칭 패스트트랙 시도: {first_url}")
                    try:
                        page.goto(first_url, timeout=12000)
                        page.wait_for_selector("h1, h2, [class*='Fc1yf'], [class*='GHAhO'], [class*='bh9OH']", state="attached", timeout=6000)
                        
                        first_name = ""
                        name_els = page.locator("[class*='bh9OH'], [class*='GHAhO'], [class*='Fc1yf']").all()
                        for el in name_els:
                            txt = el.text_content()
                            if txt and txt.strip() and "네이버" not in txt:
                                first_name = txt.strip()
                                break
                        if not first_name:
                            for el in page.locator("h1, h2").all():
                                txt = el.text_content()
                                if txt and txt.strip() and "네이버" not in txt:
                                    first_name = txt.strip()
                                    break
                                    
                        first_addr = ""
                        addr_els = page.locator("[class*='PkgBl'], [class*='pz7wy'], [class*='LDgXM'], [class*='nNn1j'], [class*='IHcha'], .PkgBl, .pz7wy, .LDgXM, .nNn1j").all()
                        for el in addr_els:
                            txt = el.text_content()
                            if txt and txt.strip():
                                clean_txt = txt.strip()
                                if "지도보기" in clean_txt:
                                    clean_txt = clean_txt.split("지도보기")[0].strip()
                                if "복사" in clean_txt:
                                    clean_txt = clean_txt.replace("복사", "").strip()
                                if any(x in clean_txt for x in ["서울", "경기", "인천", "부산", "대구", "대전", "광주", "울산", "세종", "제주", "경남", "경북", "전남", "전북", "충남", "충북", "강원"]):
                                    first_addr = clean_txt
                                    break
                                    
                        if is_name_matched(first_name, target_name) and self._is_region_matched(first_addr, query):
                            logger.info(f"✨ 1순위 상호명 및 지역 일치 성공! ('{first_name}' | '{first_addr}') -> 자동 패스트트랙 수집을 개시합니다.")
                            fast_track_success = True
                            unique_ids = [first_id]
                        else:
                            logger.info(f"⚠️ 1순위 매칭 실패 또는 지역 불일치 (상호명: '{first_name}', 주소: '{first_addr}') -> 대화형 선택 모드로 전환합니다.")
                    except Exception as fe:
                        logger.warning(f"1순위 패스트트랙 확인 중 예외 (대화형 선택 모드 전환): {fe}")

                # 1순위 매치 실패 또는 모호한 경우 ➡️ 대화형 선택 모드(Interactive Selector) 가동 (후보 최대 10개로 확장)
                if target_name and not fast_track_success and len(unique_ids) > 0:
                    logger.info("⚠️ 1순위 매치 실패 또는 모호함 감지 ➡️ 대화형 선택 모드를 시작합니다.")
                    candidates = []
                    for place_id in unique_ids[:10]:
                        temp_url = f"https://m.place.naver.com/place/{place_id}/home"
                        try:
                            page.goto(temp_url, timeout=10000)
                            page.wait_for_selector("h1, h2, [class*='Fc1yf'], [class*='GHAhO'], [class*='bh9OH']", state="attached", timeout=5000)
                            
                            t_name = "알 수 없음"
                            name_els = page.locator("[class*='bh9OH'], [class*='GHAhO'], [class*='Fc1yf']").all()
                            for el in name_els:
                                txt = el.text_content()
                                if txt and txt.strip() and "네이버" not in txt:
                                    t_name = txt.strip()
                                    break
                            
                            t_addr = "주소 정보 없음"
                            addr_els = page.locator("[class*='PkgBl'], [class*='pz7wy'], [class*='LDgXM'], [class*='nNn1j']").all()
                            for el in addr_els:
                                txt = el.text_content()
                                if txt and txt.strip():
                                    clean_txt = txt.strip().split("지도보기")[0].strip().replace("복사", "").strip()
                                    if any(x in clean_txt for x in ["서울", "경기", "인천", "부산", "대구", "대전", "광주", "울산", "세종", "제주", "경남", "경북", "전남", "전북", "충남", "충북", "강원"]):
                                        t_addr = clean_txt
                                        break
                                        
                            if not self._is_region_matched(t_addr, query):
                                logger.info(f"후보 배제 (지역 불일치) -> 상호명: '{t_name}' | 주소: '{t_addr}'")
                                continue
                                
                            t_cat = "공간"
                            cat_els = page.locator("span.lnJFt, [class*='lnJFt'], span[class*='category']").all()
                            for el in cat_els:
                                txt = el.text_content()
                                if txt and txt.strip() and len(txt.strip()) < 15:
                                    t_cat = txt.strip()
                                    break
                                    
                            candidates.append({
                                "id": place_id,
                                "name": t_name,
                                "address": t_addr,
                                "category": t_cat
                            })
                            logger.info(f"후보 [{len(candidates)}] -> 상호명: '{t_name}' | 업종: '{t_cat}' | 주소: '{t_addr}'")
                        except Exception as ce:
                            logger.warning(f"후보 ID {place_id} 사전 정보 추출 실패: {ce}")

                    if not candidates:
                        logger.warning(f"⚠️ 특정 장소 '{target_name}'의 후보 장소를 네이버에서 획득하지 못했습니다. 수집을 건너뜁니다.")
                        unique_ids = []
                    else:
                        selected_id = None
                        if monitor and hasattr(monitor, "show_selection_dialog") and monitor.root:
                            logger.info("GUI 모니터 창 상에 선택 대화상자를 표시합니다. 사용자의 선택 입력을 대기합니다...")
                            selected_id = monitor.show_selection_dialog(query, candidates)
                            if selected_id:
                                chosen = next((c for c in candidates if c["id"] == selected_id), None)
                                if chosen:
                                    logger.info(f"GUI 선택 완료: '{chosen['name']}' (ID: {selected_id}) 수집 개시")
                            else:
                                logger.info("GUI에서 수집 건너뛰기가 선택되었거나 창이 닫혔습니다.")
                                if query not in self.skipped_queries:
                                    self.skipped_queries.append(query)
                        else:
                            print("\n" + "="*70)
                            print(f"🔍 '{query}' 검색 결과가 1순위와 일치하지 않거나 모호합니다.")
                            print("아래 후보 리스트 중 진짜 매장 번호를 선택해주세요:")
                            for i, cand in enumerate(candidates):
                                print(f" [{i+1}] {cand['name']} ({cand['category']}) - {cand['address']} [ID: {cand['id']}]")
                            print(f" [{len(candidates)+1}] 건너뛰기 (이 장소 수집 안 함)")
                            print("="*70)
                            
                            while True:
                                try:
                                    sel_str = input(f"👉 번호 입력 (1~{len(candidates)+1}): ").strip()
                                    if not sel_str:
                                        sel_idx = 1
                                    else:
                                        sel_idx = int(sel_str)
                                        
                                    if 1 <= sel_idx <= len(candidates):
                                        selected_id = candidates[sel_idx - 1]["id"]
                                        logger.info(f"선택 완료: '{candidates[sel_idx - 1]['name']}' (ID: {selected_id}) 수집 개시")
                                        break
                                    elif sel_idx == len(candidates) + 1:
                                        logger.info("수집을 취소하고 건너뜁니다.")
                                        if query not in self.skipped_queries:
                                            self.skipped_queries.append(query)
                                        break
                                    else:
                                        print(f"1부터 {len(candidates)+1} 사이의 숫자를 입력해주세요.")
                                except ValueError:
                                    print("숫자 형식으로 올바르게 입력해주세요.")
                                except KeyboardInterrupt:
                                    logger.info("입력 대기 중단. 건너뜁니다.")
                                    if query not in self.skipped_queries:
                                        self.skipped_queries.append(query)
                                    break
                                    
                        if selected_id:
                            unique_ids = [selected_id]
                            is_manually_selected = True
                        else:
                            unique_ids = []

                for place_id in unique_ids:
                    detail_url = f"https://m.place.naver.com/place/{place_id}/home"
                    review_url = f"https://m.place.naver.com/place/{place_id}/review/visitor"
                    
                    logger.info(f"네이버 플레이스 수집 시작 (ID: {place_id})")
                    name = "네이버 공간"
                    addr = "서울 마포구"
                    photo_url = "/default_place.png"
                    category = "공간"
                    reviews = []
                    lat, lng = 37.55, 126.92
                    place_images = []
                    
                    # --- 1. 리뷰 텍스트 파싱 (Isolated Context) - 최우선 실행 ---
                    is_bot_blocked = False
                    has_raw_elements = False
                    
                    rev_context = browser.new_context(
                        user_agent=modern_ua,
                        viewport={"width": 375, "height": 812},
                        is_mobile=True
                    )
                    rev_page = rev_context.new_page()
                    rev_page.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
                    rev_page.route("**/*.{png,jpg,jpeg,gif,webp,svg,mp4,mp3,woff,ttf}", lambda route: route.abort())
                    
                    try:
                        logger.info(f"네이버 플레이스 리뷰 로드 중: {review_url}")
                        rev_page.goto(review_url, timeout=20000)
                        rev_page.wait_for_timeout(3000) # SPA 라우팅 및 렌더링 물리 대기
                        
                        # 1단계: 레이지 로딩 활성화를 위해 고정 픽셀 단위로 다단계 스크롤 수행 (화면 밖 리뷰 요소를 뷰포트 내로 강제 인입)
                        for i in range(3):
                            rev_page.evaluate(f"window.scrollTo(0, {1200 + i * 1000})")
                            rev_page.wait_for_timeout(1000)
                        
                        logger.info(f"[DEBUG] rev_page Loaded URL: {rev_page.url} | Title: {rev_page.title()}")
                        if not is_bot_blocked:
                            # 리뷰를 충분히(20-30개) 확보하기 위해 "더보기" 버튼 1-2회 클릭 시도
                            try:
                                for _ in range(2):
                                    more_btn = rev_page.locator("a:has-text('더보기'), button:has-text('더보기'), [class*='fvw7F'], .lf7jh").first
                                    if more_btn.is_visible():
                                        more_btn.click(force=True, timeout=2000)
                                        rev_page.wait_for_timeout(1000) # 로딩 대기
                                    else:
                                        break
                            except Exception as btn_err:
                                logger.debug(f"리뷰 더보기 버튼 클릭 시도 중 건너뜀 (이미 끝이거나 없음): {btn_err}")
                            
                            review_elements = rev_page.query_selector_all("li.place_apply_pui")
                            logger.info(f"[DEBUG] First-pass Found review elements: {len(review_elements)}")
                            
                            # [재시도 메커니즘] 만약 리뷰 요소가 0개 검출되었을 경우, 탭 클릭을 통해 강제 진입 시도
                            if not review_elements:
                                logger.info("⚠️ 리뷰가 0개 검출되었습니다. 탭 리다이렉트 Glitch 해소를 위해 리뷰 탭 강제 클릭 후 재수집을 시도합니다.")
                                tab_selectors = [
                                    "a[role='tab']:has-text('리뷰')",
                                    "a:has-text('리뷰')",
                                    "span:has-text('리뷰')",
                                    "div:has-text('리뷰')"
                                ]
                                clicked = False
                                for sel in tab_selectors:
                                    try:
                                        locator = rev_page.locator(sel).first
                                        if locator.is_visible(timeout=1500):
                                            logger.info(f"-> 셀렉터 '{sel}' 클릭 시도...")
                                            locator.click(force=True, timeout=2000)
                                            clicked = True
                                            break
                                    except Exception as click_err:
                                        logger.debug(f"셀렉터 '{sel}' 클릭 실패: {click_err}")
                                
                                if not clicked:
                                    try:
                                        logger.info("-> Playwright 클릭 실패. 자바스크립트 직접 클릭 시도...")
                                        rev_page.evaluate("""
                                            () => {
                                                const elList = document.querySelectorAll('a, span, div');
                                                for (const el of elList) {
                                                    if (el.textContent && el.textContent.trim() === '리뷰') {
                                                        el.click();
                                                        const parentA = el.closest('a');
                                                        if (parentA) parentA.click();
                                                        break;
                                                    }
                                                }
                                            }
                                        """)
                                        clicked = True
                                    except Exception as js_err:
                                        logger.warning(f"자바스크립트 직접 클릭 실패: {js_err}")
                                
                                if clicked:
                                    rev_page.wait_for_timeout(3000) # 탭 전환 렌더링 대기
                                    # 다시 스크롤 수행
                                    for i in range(3):
                                        rev_page.evaluate(f"window.scrollTo(0, {1200 + i * 1000})")
                                        rev_page.wait_for_timeout(1000)
                                    # 다시 리뷰 엘리먼트 획득 시도
                                    review_elements = rev_page.query_selector_all("li.place_apply_pui")
                                    logger.info(f"[DEBUG] Retry-pass Found review elements: {len(review_elements)}")
                            
                            if review_elements:
                                has_raw_elements = True
                                for el in review_elements:
                                    # Playwright evaluate를 사용해 예약 정보 및 불필요한 메타 데이터를 모두 제거하고 순수 리뷰 본문 추출
                                    try:
                                        txt = el.evaluate("""
                                            (liElement) => {
                                                const clone = liElement.cloneNode(true);
                                                
                                                // 1. 클래스명 및 태그 기반으로 불필요한 메타/예약 정보 일괄 제거
                                                const selectorsToRemove = [
                                                    "[class*='pui__q2fg8o']", ".pui__q2fg8o", // Profile wrapper
                                                    "[class*='pui__F2t42c']", ".pui__F2t42c", // Booking ticket title
                                                    "[class*='pui__-0Ter1']", ".pui__-0Ter1", // Booking keywords/tags
                                                    "[class*='pui__HLNvmI']", ".pui__HLNvmI", // Badges/keywords ("아이와 가기 좋아요")
                                                    "[class*='pui__QztK4Q']", ".pui__QztK4Q", // Date/visit/reactions
                                                    "[class*='lazyload']", ".lazyload-wrapper", // Thumbnail/media container
                                                    "[class*='pui__sRNfrm']", ".pui__sRNfrm", // Owner response container
                                                    "svg", "img", "time", "button"
                                                ];
                                                
                                                selectorsToRemove.forEach(sel => {
                                                    clone.querySelectorAll(sel).forEach(child => child.remove());
                                                });
                                                
                                                // 2. "더보기" (More) 및 "접기" (Fold) 버튼 제거
                                                clone.querySelectorAll('a').forEach(a => {
                                                    const txt = (a.textContent || '').trim();
                                                    if (txt === '더보기' || txt === '접기') {
                                                        a.remove();
                                                    }
                                                });
                                                
                                                return clone.textContent ? clone.textContent.trim() : "";
                                            }
                                        """)
                                    except Exception:
                                        txt = el.text_content()
                                    if txt:
                                        # 사장님 답글(답글/답변 영역) 텍스트가 포함되어 있다면 본문에서 제거
                                        try:
                                            for div in el.locator("div").all():
                                                has_svg = div.locator("svg").count() > 0
                                                has_time = div.locator("time").count() > 0
                                                has_fold = False
                                                for a_tag in div.locator("a").all():
                                                    if a_tag.text_content() == "접기":
                                                        has_fold = True
                                                        break
                                                if has_svg and has_time and has_fold:
                                                    r_txt = div.text_content()
                                                    if r_txt:
                                                        txt = txt.replace(r_txt, "")
                                        except Exception:
                                            pass

                                        clean_rev = self._clean_review_text(txt)
                                        # '더보기' 꼬리말 제거
                                        if clean_rev.endswith("더보기"):
                                            clean_rev = clean_rev[:-3].strip()

                                        # 디버깅 파일에 원본 및 스킵 과정 기록
                                        debug_path = os.path.join(os.path.dirname(__file__), "..", "skipped_reviews_debug.log")
                                        try:
                                            with open(debug_path, "a", encoding="utf-8") as df:
                                                df.write(f"\n[{name}] Raw text: {repr(txt.strip())}\n")
                                                df.write(f"[{name}] Cleaned: {repr(clean_rev)}\n")
                                        except Exception:
                                            pass

                                        # 사장님 답글 단독 노출 필터링
                                        if clean_rev.startswith("안녕하세요") and (name in clean_rev or "저희" in clean_rev or "방문해" in clean_rev or "답글" in clean_rev or "답변" in clean_rev):
                                            try:
                                                with open(debug_path, "a", encoding="utf-8") as df:
                                                    df.write(" => Skip: Owner response\n")
                                            except Exception: pass
                                            continue

                                        if not (15 < len(clean_rev) < 600):
                                            try:
                                                with open(debug_path, "a", encoding="utf-8") as df:
                                                    df.write(f" => Skip: Length filter fail ({len(clean_rev)} chars)\n")
                                            except Exception: pass
                                            continue

                                        if any(x in clean_rev for x in ["게스트하우스", "체험단", "무료숙박", "무료 숙박", "이벤트중", "제공받아", "포스팅", "서이추", "협찬"]):
                                            try:
                                                with open(debug_path, "a", encoding="utf-8") as df:
                                                    df.write(" => Skip: Sponsored pattern\n")
                                            except Exception: pass
                                            continue

                                        # 2. 탭 이동 문구, 날짜, 태그, 방문 옵션 등 노이즈 제외 필터링
                                        if any(x in clean_rev for x in ["방문자리뷰", "블로그리뷰", "펼쳐보기", "다녀오셨나요", "경험을 남겨보세요"]):
                                            try:
                                                with open(debug_path, "a", encoding="utf-8") as df:
                                                    df.write(" => Skip: Tab noise\n")
                                            except Exception: pass
                                            continue

                                        # 띄어쓰기가 충분하여 완전한 문장 구조를 갖추고 있는지 체크 (태그 나열 필터링)
                                        if len(clean_rev.split()) < 3:
                                            try:
                                                with open(debug_path, "a", encoding="utf-8") as df:
                                                    df.write(f" => Skip: Split count fail ({len(clean_rev.split())} words)\n")
                                            except Exception: pass
                                            continue

                                        if clean_rev in reviews:
                                            try:
                                                with open(debug_path, "a", encoding="utf-8") as df:
                                                    df.write(" => Skip: Duplicate review\n")
                                            except Exception: pass
                                            continue

                                        reviews.append(clean_rev)
                                        try:
                                            with open(debug_path, "a", encoding="utf-8") as df:
                                                df.write(" => OK (Added)\n")
                                        except Exception: pass
                                        if len(reviews) >= 5: # 최대 5개 리뷰 수집
                                            break
                            else:
                                logger.warning(f"리뷰 엘리먼트 획득 실패 (0개 검출 - 봇 차단 의심): {review_url}")
                                is_bot_blocked = True
                                try:
                                    debug_ss_path = os.path.join(os.path.dirname(__file__), "..", "raw_data", f"debug_review_fail_{place_id}.png")
                                    rev_page.screenshot(path=debug_ss_path)
                                    logger.info(f"디버그 실패 스크린샷 저장 완료: {debug_ss_path}")
                                except Exception as ss_err:
                                    logger.warning(f"디버그 스크린샷 저장 실패: {ss_err}")
                        else:
                            logger.warning(f"리뷰 엘리먼트 획득 실패 (0개 검출 - 봇 차단 의심): {review_url}")
                            is_bot_blocked = True
                            try:
                                debug_ss_path = os.path.join(os.path.dirname(__file__), "..", "raw_data", f"debug_review_fail_{place_id}.png")
                                rev_page.screenshot(path=debug_ss_path)
                                logger.info(f"디버그 실패 스크린샷 저장 완료: {debug_ss_path}")
                            except Exception as ss_err:
                                logger.warning(f"디버그 스크린샷 저장 실패: {ss_err}")
                    except Exception as err:
                        logger.warning(f"ID {place_id} 리뷰 파싱 중 예외 발생: {err}")
                        is_bot_blocked = True
                        try:
                            debug_ss_path = os.path.join(os.path.dirname(__file__), "..", "raw_data", f"debug_review_fail_{place_id}.png")
                            rev_page.screenshot(path=debug_ss_path)
                            logger.info(f"디버그 실패 스크린샷 저장 완료: {debug_ss_path}")
                        except Exception as ss_err:
                            logger.warning(f"디버그 스크린샷 저장 실패: {ss_err}")
                        try: rev_context.close()
                        except: pass

                    if not reviews:
                        if is_bot_blocked or not has_raw_elements:
                            reviews = [
                                "네이버 정책으로 봇 차단(또는 네트워크 오류)되어 이 디폴트 리뷰가 삽입되었습니다.",
                                "네이버 정책으로 봇 차단되어 수집이 실패한 상태입니다."
                            ]
                        else:
                            reviews = [
                                "필터값으로 인해 이 디폴트 리뷰가 삽입되었습니다.",
                                "수집된 모든 리뷰가 필터값(길이 제한 및 노이즈 필터)에 의해 제외되었습니다."
                            ]
                            
                    # --- 2. 상세정보 파싱 (Isolated Context) - 후순위 실행 ---
                    det_context = browser.new_context(
                        user_agent=modern_ua,
                        viewport={"width": 375, "height": 812},
                        is_mobile=True
                    )
                    det_page = det_context.new_page()
                    det_page.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
                    det_page.route("**/*.{png,jpg,jpeg,gif,webp,svg,mp4,mp3,woff,ttf}", lambda route: route.abort())
                    
                    try:
                        logger.info(f"네이버 플레이스 상세 로드 중: {detail_url}")
                        det_page.goto(detail_url, timeout=20000)
                        det_page.wait_for_selector("h1, h2, [class*='Fc1yf'], [class*='GHAhO'], [class*='bh9OH']", state="attached", timeout=10000)
                        det_page.wait_for_timeout(1500)
                        
                        # 상호명 셀렉터 (정밀 클래스 매칭 우선 후 h1/h2 결합)
                        name_els = det_page.locator("[class*='bh9OH'], [class*='GHAhO'], [class*='Fc1yf']").all()
                        for el in name_els:
                            txt = el.text_content()
                            if txt and txt.strip() and "네이버" not in txt and "플레이스" not in txt:
                                name = txt.strip()
                                break
                        else:
                            for el in det_page.locator("h1, h2").all():
                                txt = el.text_content()
                                if txt and txt.strip() and "네이버" not in txt and "플레이스" not in txt:
                                    name = txt.strip()
                                    break
                            else:
                                title = det_page.title()
                                if title and "네이버" not in title:
                                    name = title.split(" - ")[0].strip() if " - " in title else title
                            
                        # 주소 셀렉터 (시맨틱 & 정규식 하이브리드 파싱)
                        addr_els = det_page.locator("[class*='PkgBl'], [class*='pz7wy'], [class*='LDgXM'], [class*='nNn1j'], [class*='IHcha'], .PkgBl, .pz7wy, .LDgXM, .nNn1j").all()
                        for el in addr_els:
                            txt = el.text_content()
                            if txt and txt.strip():
                                clean_txt = txt.strip()
                                if "지도보기" in clean_txt:
                                    clean_txt = clean_txt.split("지도보기")[0].strip()
                                if "복사" in clean_txt:
                                    clean_txt = clean_txt.replace("복사", "").strip()
                                if any(x in clean_txt for x in ["서울", "경기", "인천", "부산", "대구", "대전", "광주", "울산", "세종", "제주", "경남", "경북", "전남", "전북", "충남", "충북", "강원"]):
                                    addr = clean_txt
                                    break
                        else:
                            # 전국 주소 정규식 폴백 검색 (지번/도로명 모두 포함)
                            body_text = det_page.locator("body").text_content() or ""
                            match = re.search(r'((?:서울|인천|부산|대구|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주)[가-힣\s\d~\-\(\),]+(?:동|읍|면|길|로|리)\s\d+)', body_text)
                            if match:
                                addr = match.group(1).strip()

                        # 대표 이미지 1장만 파싱 (썸네일용)
                        all_imgs = det_page.locator("img").all()
                        for img in all_imgs:
                            src = img.get_attribute("src") or ""
                            if "naver.net" in src or "navercdn" in src or "pstatic.net" in src:
                                if ".svg" in src or "img_logo" in src or "ico_" in src or "icon_" in src:
                                    continue
                                photo_url = src
                                break

                        # 업체 등록 공식 이미지 수집으로 이동 (동적 개수 수집)
                        photo_owner_url = f"https://m.place.naver.com/place/{place_id}/photo?filterType=owner"
                        try:
                            det_page.goto(photo_owner_url, timeout=15000)
                            det_page.wait_for_selector("img", state="attached", timeout=8000)
                            det_page.wait_for_timeout(1000)
                            
                            owner_imgs = det_page.locator("img").all()
                            for img in owner_imgs:
                                src = img.get_attribute("src") or ""
                                if "naver.net" in src or "navercdn" in src or "pstatic.net" in src:
                                    if ".svg" in src or "img_logo" in src or "ico_" in src or "icon_" in src:
                                        continue
                                    if "type=f" in src or "type=s" in src: # 작은 아이콘/프로필 제외
                                        continue
                                    if src not in place_images:
                                        place_images.append(src)
                                        if len(place_images) >= 4: # 최대 4장 제한
                                            break
                        except Exception as pe:
                            logger.warning(f"ID {place_id} 업체 공식 이미지 파싱 실패: {pe}")

                        if not place_images:
                            place_images = [photo_url]
                            
                        image_urls_str = ",".join(place_images)

                        # 카테고리 업종명 파싱
                        cat_els = det_page.locator("span.lnJFt, [class*='lnJFt'], span[class*='category']").all()
                        for el in cat_els:
                            txt = el.text_content()
                            if txt and txt.strip() and len(txt.strip()) < 15:
                                category = txt.strip()
                                break

                        # 위경도 좌표 추출
                        try:
                            lat_extracted, lng_extracted = self._extract_coords(det_page.content())
                            if not (lat_extracted == 37.55 and lng_extracted == 126.92):
                                lat, lng = lat_extracted, lng_extracted
                        except Exception:
                            pass

                        det_context.close()
                    except Exception as e:
                        logger.warning(f"ID {place_id} 상세 기본정보 파싱 중 예외 발생: {e}")
                        try: det_context.close()
                        except: pass
                        if not place_images:
                            place_images = [photo_url]
                        image_urls_str = ",".join(place_images)

                    # 장소명 일치 검증
                    if target_name and not is_manually_selected and not is_name_matched(name, target_name):
                        logger.warning(f"⚠️ 장소명 미스매치 배제 -> 수집명: '{name}' vs 대상명: '{target_name}' (ID: {place_id}). 다음 후보로 넘어갑니다.")
                        continue
                        
                    # 지역/주소 일치 검증
                    if target_name and not is_manually_selected and not self._is_region_matched(addr, query):
                        logger.warning(f"⚠️ 지역/주소 미스매치 배제 -> 주소: '{addr}' vs 검색어: '{query}' (ID: {place_id}). 다음 후보로 넘어갑니다.")
                        continue

                    results.append({
                        "name": name,
                        "address": addr,
                        "externalId": f"naver_place_{place_id}",
                        "latitude": lat,
                        "longitude": lng,
                        "category": category,
                        "thumbnailUrl": photo_url,
                        "imageUrls": image_urls_str,
                        "reviews": reviews[:5]
                    })
                    logger.info(f"수집 성공 및 추가 완료 -> 장소명: '{name}', 주소: '{addr}', 이미지 개수: {len(place_images)}, 리뷰 개수: {len(reviews)}")
                    
                    if len(results) >= limit:
                        logger.info(f"요청한 수집 한도({limit}개)에 도달하여 수집을 종료합니다.")
                        break
                        
                    time.sleep(0.5)

                browser.close()

        except Exception as e:
            logger.error(f"네이버 맵 실시간 우회 크롤링 중 예외 발생: {e}")
            return self.get_mock_places()

        return results if results else self.get_mock_places()

    def get_mock_places(self) -> List[Dict[str, Any]]:
        """
        수집 실패 시 동작을 유지하기 위한 Mock 데이터
        """
        return [
            {
                "name": "카페 오아시스 합정",
                "address": "서울 마포구 독막로5길 12",
                "externalId": "naver_place_10203040",
                "latitude": 37.5489,
                "longitude": 126.9182,
                "category": "mood",
                "thumbnailUrl": "/default_place.png",
                "imageUrls": "/default_place.png",
                "reviews": [
                    "매장 내부에 식물이 가득해서 힐링되는 기분이에요. 완전 플랜테리어 정석!",
                    "햇살이 엄청 잘 들어오는 햇살맛집입니다. 통창 뷰가 예술이에요.",
                    "음악 소리가 잔잔하고 식물들이 많아서 친구랑 조용하게 대화 나누기 좋았습니다."
                ]
            }
        ]
