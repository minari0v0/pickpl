import os
import json
import re

LOG_PATH = os.path.join(os.path.dirname(__file__), "..", "pipeline.log")
JSON_PATH = os.path.join(os.path.dirname(__file__), "raw_data", "analyzed_places_2026-06-09.json")

def migrate_from_log():
    if not os.path.exists(LOG_PATH):
        print(f"로그 파일이 없습니다: {LOG_PATH}")
        return
    if not os.path.exists(JSON_PATH):
        print(f"JSON 파일이 없습니다: {JSON_PATH}")
        return

    # 1. 로그 파일에서 쿼리와 장소명 관계 파싱
    place_to_query = {}
    current_query = None
    
    with open(LOG_PATH, "r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            # 쿼리 실행 감지
            # 예: 2026-06-09 19:16:30,122 [INFO] ==> 쿼리 실행: '성수동 맛집' ...
            query_match = re.search(r"==> 쿼리 실행: '([^']+)'", line)
            if query_match:
                current_query = query_match.group(1).strip()
                continue
                
            # 장소 수집 완료 또는 분석 완료 감지
            # 예: 2026-06-09 19:16:40,150 [INFO] 수집 완료 -> 장소명: '대낚식당 성수직영점', ...
            if current_query:
                place_match = re.search(r"수집 완료 -> 장소명: '([^']+)'", line)
                if place_match:
                    place_name = place_match.group(1).strip()
                    place_to_query[place_name] = current_query
                    
    print(f"로그 분석 완료. 총 {len(place_to_query)}개의 장소-쿼리 맵핑을 확보했습니다.")

    # 2. JSON 데이터 업데이트
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        places = json.load(f)
        
    updated_count = 0
    for p in places:
        name = p.get("name", "").strip()
        if name in place_to_query:
            p["searchQuery"] = place_to_query[name]
            updated_count += 1
        else:
            # 로그에 명시되지 않은 장소는 혹시 잘못 주입되었을 수 있는 기존 searchQuery를 안전하게 제거
            if "searchQuery" in p:
                del p["searchQuery"]

    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(places, f, ensure_ascii=False, indent=2)
        
    print(f"JSON 업데이트 완료! 총 {updated_count}개 장소의 searchQuery를 실제 로그 기반으로 100% 매칭 완료했습니다.")

if __name__ == "__main__":
    migrate_from_log()
