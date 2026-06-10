import os
import json

FILE_PATH = os.path.join(os.path.dirname(__file__), "raw_data", "analyzed_places_2026-06-09.json")

def migrate():
    if not os.path.exists(FILE_PATH):
        print("마이그레이션할 파일이 아직 없습니다.")
        return
        
    with open(FILE_PATH, "r", encoding="utf-8") as f:
        places = json.load(f)
        
    migrated_count = 0
    for p in places:
        if "searchQuery" not in p:
            # 주소에서 동 단위 파싱
            addr = p.get("address", "")
            region = "합정" # 기본값
            
            # 대표 지역 매핑 매칭
            for r in ["성수동", "성수", "연남동", "연남", "망원동", "망원", "합정동", "합정", "홍대", "신촌", "여의도", "을지로", "문래", "이태원"]:
                if r in addr or r in p.get("name", ""):
                    # regions.json 규격에 맞게 지역명 정리
                    if r in ["성수동", "성수"]:
                        region = "성수동"
                    elif r in ["연남동", "연남"]:
                        region = "연남동"
                    elif r in ["망원동", "망원"]:
                        region = "망원동"
                    elif r in ["합정동", "합정"]:
                        region = "합정동"
                    else:
                        region = r
                    break
            
            # 카테고리 매핑
            cat = p.get("category", "").lower()
            category_kw = "맛집"
            if any(x in cat for x in ["카페", "디저트", "베이커리", "커피"]):
                category_kw = "카페"
            elif any(x in cat for x in ["술집", "주점", "바", "펍", "와인", "맥주", "이자카야"]):
                category_kw = "술집"
            elif any(x in cat for x in ["명소", "공원", "산책", "등산", "산", "숲"]):
                category_kw = "명소"
            elif any(x in cat for x in ["핫플레이스", "핫플"]):
                category_kw = "핫플레이스"
                
            p["searchQuery"] = f"{region} {category_kw}"
            migrated_count += 1
            
    if migrated_count > 0:
        with open(FILE_PATH, "w", encoding="utf-8") as f:
            json.dump(places, f, ensure_ascii=False, indent=2)
        print(f"마이그레이션 완료! 총 {migrated_count}개 장소에 searchQuery를 주입했습니다.")
    else:
        print("마이그레이션할 항목이 없거나 이미 모두 처리되어 있습니다.")

if __name__ == "__main__":
    migrate()
