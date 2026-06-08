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

    def scrape_by_query(self, query: str, source: str = "naver", limit: int = 3) -> List[Dict[str, Any]]:
        """
        검색어(query)와 수집 채널(source)을 기반으로 실시간 수집을 진행합니다.
        """
        if self.use_mock:
            logger.info("Mock 모드로 작동합니다. 테스트 더미 데이터를 반환합니다.")
            return self.get_mock_places()

        logger.info(f"검색어: '{query}' | 수집 채널: '{source}' | 수집 제한: {limit}개")
        
        if source == "kakao":
            return self._scrape_kakao(query, limit)
        else:
            return self._scrape_naver(query, limit)

    def _scrape_kakao(self, query: str, limit: int) -> List[Dict[str, Any]]:
        """
        Daum 모바일 통합 검색 우회를 통한 카카오 플레이스 ID 확보 후 Playwright 브라우저 기반 상세/리뷰 파싱
        """
        results = []
        try:
            # 1. Daum 모바일 통합 검색 우회 방식으로 카카오 플레이스 고유 ID 획득
            logger.info("Daum 모바일 통합검색을 우회하여 카카오 플레이스 ID 목록을 획득합니다.")
            encoded_query = urllib.parse.quote(query)
            search_url = f"https://m.search.daum.net/search?w=tot&q={encoded_query}"
            headers = {
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_8 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1"
            }
            response = requests.get(search_url, headers=headers, timeout=10)
            
            # ID 정규식 매칭
            place_ids = re.findall(r'place\.map\.kakao\.com/(\d+)', response.text)
            if not place_ids:
                place_ids = re.findall(r'kakaomap://place\?id=(\d+)', response.text)
            if not place_ids:
                place_ids = re.findall(r'confirmId=(\d+)', response.text)
                
            raw_ids = []
            for p_id in place_ids:
                if p_id not in raw_ids:
                    raw_ids.append(p_id)
            
            # 랭킹 샘플링 적용
            unique_ids = self._sample_ids(raw_ids, limit)
            logger.info(f"샘플링 필터 적용 전 전체 ID 수: {len(raw_ids)} | 샘플링 후 선택된 카카오 플레이스 ID 목록: {unique_ids}")

            if not unique_ids:
                logger.warning("카카오 플레이스 ID를 찾지 못했습니다. Mock 데이터로 대체합니다.")
                return self.get_mock_places()

            # 2. Playwright 브라우저를 기동하여 카카오 플레이스 상세 페이지 웹 파싱
            from playwright.sync_api import sync_playwright
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                page = browser.new_page()

                for place_id in unique_ids:
                    detail_url = f"https://place.map.kakao.com/{place_id}"
                    logger.info(f"카카오 플레이스 상세 페이지 로드 중: {detail_url}")
                    
                    name = "카카오 공간"
                    addr = "서울 마포구"
                    photo_url = "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=500"
                    category = "공간"
                    reviews = []

                    try:
                        page.goto(detail_url, timeout=20000)
                        
                        #attached 조건으로 DOM 대기 및 텍스트 렌더링을 위한 1.5초 물리적 대기 추가
                        page.wait_for_selector(".tit_head, h3.tit_place", state="attached", timeout=10000)
                        page.wait_for_timeout(1500)
                        
                        # 상호명 파싱 (시맨틱 태그 우선 매칭)
                        name_els = page.locator("h3.tit_place, .tit_head, h2.tit_location, h2").all()
                        for el in name_els:
                            txt = el.text_content()
                            if txt and txt.strip() and "카카오" not in txt:
                                name = txt.strip()
                                if "\n" in name:
                                    name = name.split("\n")[0].strip()
                                break
                        else:
                            title = page.title()
                            if title and "카카오" not in title:
                                name = title.split(" | ")[0].strip()

                        # 주소 파싱 (span.txt_detail 중 우편번호 또는 서울/경기 등 주소 포맷 검출)
                        addr_els = page.locator("span.txt_detail, .txt_address, .txt_addr").all()
                        for el in addr_els:
                            txt = el.text_content()
                            if txt and txt.strip():
                                clean_txt = txt.strip()
                                if "지번" in clean_txt:
                                    clean_txt = clean_txt.split("지번")[0].strip()
                                if any(x in clean_txt for x in ["서울", "경기", "인천", "부산", "대구", "대전", "광주", "울산", "세종", "제주", "강원", "충북", "충남", "전북", "전남", "경북", "경남"]):
                                    addr = clean_txt
                                    break

                        # 대표 및 상세 이미지 파싱 (최대 5개 수집)
                        thumb_els = page.locator("img.img-thumb, .board_photo img, img").all()
                        place_images = []
                        for img in thumb_els:
                            src = img.get_attribute("src") or ""
                            if "daumcdn" in src or "kakaocdn" in src or "kakao" in src:
                                # SVG 및 로고 차단
                                if ".svg" in src or "img_logo" in src or "ico_" in src or "icon_" in src:
                                    continue
                                if src.startswith("//"):
                                    src = "https:" + src
                                if src not in place_images:
                                    place_images.append(src)
                                    if len(place_images) >= 3:
                                        break
                                        
                        if place_images:
                            photo_url = place_images[0]
                            image_urls_str = ",".join(place_images)
                        else:
                            photo_url = "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=500"
                            image_urls_str = photo_url

                        # 카테고리 업종명 파싱
                        cat_els = page.locator("span.txt_tab, .txt_tab, .txt_category").all()
                        for el in cat_els:
                            txt = el.text_content()
                            if txt and txt.strip() and len(txt.strip()) < 15:
                                category = txt.strip()
                                break

                        # 리뷰 렌더링 대기 및 최신 코멘트 클래스 (.desc_review) 우선 수집
                        try:
                            page.wait_for_selector(".desc_review, .txt_comment, .comment_info p", state="attached", timeout=5000)
                        except Exception:
                            pass

                        comment_elements = page.locator(".desc_review, .txt_comment, .comment_info p, .comment_list p").all()
                        for el in comment_elements:
                            txt = el.text_content()
                            if txt and len(txt.strip()) > 5:
                                clean_rev = txt.strip()
                                if clean_rev not in reviews:
                                    reviews.append(clean_rev)

                    except Exception as e:
                        logger.warning(f"ID {place_id} 상세 브라우저 파싱 중 예외 발생: {e}")

                    if not reviews:
                        logger.warning(f"ID {place_id} 실제 리뷰 수집 불가. 기본 리뷰로 대체.")
                        reviews = [
                            "커피 맛이 깊고 매장 인테리어가 매우 아늑하고 조용한 편입니다.",
                            "노트북으로 혼자 작업하거나 책 읽기 완벽한 장소입니다."
                        ]

                    results.append({
                        "name": name,
                        "address": addr,
                        "externalId": f"kakao_place_{place_id}",
                        "latitude": 37.55,
                        "longitude": 126.92,
                        "category": category,
                        "thumbnailUrl": photo_url,
                        "imageUrls": image_urls_str,
                        "reviews": reviews[:5] # 최대 5개 리뷰 제한
                    })
                    logger.info(f"수집 완료 -> 장소명: '{name}', 주소: '{addr}', 이미지 개수: {len(place_images)}, 리뷰 개수: {len(reviews)}")
                    time.sleep(0.5)

                browser.close()

        except Exception as e:
            logger.error(f"카카오 맵 실시간 우회 크롤링 중 예외 발생: {e}")
            return self.get_mock_places()

        return results if results else self.get_mock_places()

    def _scrape_naver(self, query: str, limit: int) -> List[Dict[str, Any]]:
        """
        네이버 모바일 통합 검색 우회 방식으로 플레이스 ID 획득 후 Playwright 리뷰 파싱
        """
        results = []
        try:
            # 1. 네이버 모바일 통합 검색 우회
            logger.info("Naver 모바일 통합검색을 우회하여 플레이스 ID 목록을 획득합니다.")
            encoded_query = urllib.parse.quote(query)
            search_url = f"https://m.search.naver.com/search.naver?query={encoded_query}"
            headers = {
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_8 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1"
            }
            response = requests.get(search_url, headers=headers, timeout=10)
            
            # 다각도 정규식 매칭 패턴 적용
            place_ids = re.findall(r'place\.naver\.com/place/(\d+)', response.text)
            if not place_ids:
                place_ids = re.findall(r'place/(\d+)', response.text)
            if not place_ids:
                place_ids = re.findall(r'data-cid="(\d+)"', response.text)
            if not place_ids:
                place_ids = re.findall(r'entry/place/(\d+)', response.text)

            raw_ids = []
            for p_id in place_ids:
                if p_id not in raw_ids and len(p_id) >= 6:
                    raw_ids.append(p_id)
            
            # 랭킹 샘플링 적용
            unique_ids = self._sample_ids(raw_ids, limit)
            logger.info(f"샘플링 필터 적용 전 전체 ID 수: {len(raw_ids)} | 샘플링 후 선택된 네이버 플레이스 ID 목록: {unique_ids}")

            if not unique_ids:
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
                page.add_init_script("delete navigator.__proto__.webdriver;")

                for place_id in unique_ids:
                    detail_url = f"https://m.place.naver.com/place/{place_id}/home"
                    review_url = f"https://m.place.naver.com/place/{place_id}/review/visitor"
                    
                    logger.info(f"네이버 플레이스 상세 로드 중: {detail_url}")
                    name = "네이버 공간"
                    addr = "서울 마포구"
                    photo_url = "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=500"
                    category = "공간"
                    reviews = []
                    
                    try:
                        # 기본 정보 파싱
                        page.goto(detail_url, timeout=20000)
                        # attached로 DOM 안착 대기 후 1.5초간 React hydration 물리 대기
                        page.wait_for_selector("h1, h2, [class*='Fc1yf'], [class*='GHAhO'], [class*='bh9OH']", state="attached", timeout=10000)
                        page.wait_for_timeout(1500)
                        
                        # 상호명 셀렉터 (정밀 클래스 매칭 우선 후 h1/h2 결합)
                        name_els = page.locator("[class*='bh9OH'], [class*='GHAhO'], [class*='Fc1yf']").all()
                        for el in name_els:
                            txt = el.text_content()
                            if txt and txt.strip() and "네이버" not in txt and "플레이스" not in txt:
                                name = txt.strip()
                                break
                        else:
                            for el in page.locator("h1, h2").all():
                                txt = el.text_content()
                                if txt and txt.strip() and "네이버" not in txt and "플레이스" not in txt:
                                    name = txt.strip()
                                    break
                            else:
                                title = page.title()
                                if title and "네이버" not in title:
                                    name = title.split(" - ")[0].strip() if " - " in title else title
                            
                        # 주소 셀렉터 (시맨틱 & 정규식 하이브리드 파싱)
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
                                    addr = clean_txt
                                    break
                        else:
                            # 전국 주소 정규식 폴백 검색 (지번/도로명 모두 포함)
                            body_text = page.locator("body").text_content() or ""
                            match = re.search(r'((?:서울|인천|부산|대구|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주)[가-힣\s\d~\-\(\),]+(?:동|읍|면|길|로|리)\s\d+)', body_text)
                            if match:
                                addr = match.group(1).strip()

                        # 대표 이미지 1장만 파싱 (썸네일용)
                        all_imgs = page.locator("img").all()
                        for img in all_imgs:
                            src = img.get_attribute("src") or ""
                            if "naver.net" in src or "navercdn" in src or "pstatic.net" in src:
                                if ".svg" in src or "img_logo" in src or "ico_" in src or "icon_" in src:
                                    continue
                                photo_url = src
                                break

                        # 업체 등록 공식 이미지 수집으로 이동 (동적 개수 수집)
                        photo_owner_url = f"https://m.place.naver.com/place/{place_id}/photo?filterType=owner"
                        place_images = []
                        try:
                            # 15초 타임아웃으로 안정성 확보 후 이동
                            page.goto(photo_owner_url, timeout=15000)
                            page.wait_for_selector("img", state="attached", timeout=8000)
                            page.wait_for_timeout(1000)
                            
                            owner_imgs = page.locator("img").all()
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
                        cat_els = page.locator("span.lnJFt, [class*='lnJFt'], span[class*='category']").all()
                        for el in cat_els:
                            txt = el.text_content()
                            if txt and txt.strip() and len(txt.strip()) < 15:
                                category = txt.strip()
                                break

                    except Exception as e:
                        logger.warning(f"ID {place_id} 상세 기본정보 파싱 중 예외 발생: {e}")

                    # 리뷰 텍스트 파싱
                    try:
                        page.goto(review_url, timeout=20000)
                        # 최신 네이버 PUI 컴포넌트(class*=pui__) 및 zPfyi / LwUKe 멀티 대기
                        page.wait_for_selector("[class*='pui__'], [class*='zPfyi'], [class*='LwUKe'], .zPfyi", state="attached", timeout=10000)
                        page.wait_for_timeout(1000)
                        
                        review_elements = page.locator("[class*='pui__'], [class*='zPfyi'], [class*='LwUKe'], .zPfyi, .LwUKe").all()
                        for el in review_elements:
                            txt = el.text_content()
                            if txt:
                                clean_rev = txt.strip()
                                # '더보기' 꼬리말 제거
                                if clean_rev.endswith("더보기"):
                                    clean_rev = clean_rev[:-3].strip()

                                if len(clean_rev) > 15:
                                    # 1. 영수증/결제내역 인증 날짜 정보 필터링
                                    if re.search(r'\d+년\s*\d+월\s*\d+일', clean_rev) or re.search(r'\d+\.\d+\.[월화수목금토일]', clean_rev):
                                        continue
                                    if any(x in clean_rev for x in ["방문일", "방문인증", "인증수단", "인증 수단", "영수증", "결제내역", "반응 남기기", "번째 방문", "표정을 눌러", "반응을 남겨"]):
                                        continue

                                    # 2. 탭 이동 문구, 날짜, 태그, 방문 옵션 등 노이즈 제외 필터링
                                    if not any(x in clean_rev for x in ["방문자리뷰", "블로그리뷰", "블로그", "리뷰", "등록", "별점", "네이버", "펼쳐보기", "팔로워", "사진", "일자", "방문예약", "대기 시간", "다녀오셨나요", "경험을 남겨보세요", "표정을 눌러", "반응을 남겨"]):
                                        # 띄어쓰기가 충분하여 완전한 문장 구조를 갖추고 있는지 체크 (태그 나열 필터링)
                                        if len(clean_rev.split()) >= 3:
                                            if clean_rev not in reviews:
                                                reviews.append(clean_rev)
                                                if len(reviews) >= 5: # 최대 5개 리뷰 수집
                                                    break
                    except Exception as err:
                        logger.warning(f"ID {place_id} 리뷰 파싱 실패: {err}")

                    if not reviews:
                        reviews = ["아늑하고 분위기가 좋은 따뜻한 공간입니다.", "인테리어가 감각적이고 커피 맛이 마음에 듭니다."]

                    results.append({
                        "name": name,
                        "address": addr,
                        "externalId": f"naver_place_{place_id}",
                        "latitude": 37.55,
                        "longitude": 126.92,
                        "category": category,
                        "thumbnailUrl": photo_url,
                        "imageUrls": image_urls_str,
                        "reviews": reviews[:5]
                    })
                    logger.info(f"수집 완료 -> 장소명: '{name}', 주소: '{addr}', 이미지 개수: {len(place_images)}, 리뷰 개수: {len(reviews)}")
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
                "thumbnailUrl": "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80",
                "imageUrls": "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80",
                "reviews": [
                    "매장 내부에 식물이 가득해서 힐링되는 기분이에요. 완전 플랜테리어 정석!",
                    "햇살이 엄청 잘 들어오는 햇살맛집입니다. 통창 뷰가 예술이에요.",
                    "음악 소리가 잔잔하고 식물들이 많아서 친구랑 조용하게 대화 나누기 좋았습니다."
                ]
            }
        ]

