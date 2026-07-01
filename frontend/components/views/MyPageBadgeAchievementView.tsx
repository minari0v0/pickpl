import React, { useState, useMemo } from 'react';

interface MyPageBadgeAchievementViewProps {
    dashboardData: any;
    scrapsData: any[] | undefined;
    onBack: () => void;
    onViewChange: (view: string) => void;
    equippedTitle: string | null;
    onEquip: (title: string | null) => void;
}

export default function MyPageBadgeAchievementView({
    dashboardData,
    scrapsData,
    onBack,
    onViewChange,
    equippedTitle,
    onEquip
}: MyPageBadgeAchievementViewProps) {
    const [selectedBadgeId, setSelectedBadgeId] = useState<string | null>(null);

    const badges = dashboardData?.badges || [];
    
    // 해금 완료 뱃지 수 계산
    const unlockedCount = useMemo(() => {
        return badges.filter((b: any) => b.status === 'UNLOCKED').length;
    }, [badges]);

    // 등급 타이틀 및 레벨 스탯 계산
    const levelInfo = useMemo(() => {
        const totalBadges = badges.length || 7;
        const ratio = (unlockedCount * 100) / totalBadges;
        
        let title = 'Lv.1 새싹 탐험가 🌱';
        let sub = '첫 걸음을 뗀 초보 수집가입니다.';
        
        if (unlockedCount === totalBadges) {
            title = 'Lv.MAX 마스터 개척자 👑';
            sub = '픽플의 모든 분위기와 업적을 정복했습니다!';
        } else if (unlockedCount >= 5) {
            title = 'Lv.3 프로 방랑자 🗺️';
            sub = '세련된 안목을 지닌 베테랑 모험가입니다.';
        } else if (unlockedCount >= 1) {
            title = 'Lv.2 노련한 길잡이 🧭';
            sub = '나만의 핫플레이스를 모으기 시작한 개척자입니다.';
        }
        
        return { title, sub, ratio };
    }, [unlockedCount, badges]);

    // 3D 클레이 렌더 뱃지 이미지 매핑
    const getBadgeImage = (badgeId: string) => {
        switch (badgeId) {
            case 'PINE_COZY': return '/images/badge_pine.png';
            case 'COFFEE_CHAT': return '/images/badge_coffee.png';
            case 'HIP_VIBE': return '/images/badge_hip.png';
            case 'BEGINNER_SCRAP': return '/images/badge_box.png';
            case 'ACTIVE_VOTER': return '/images/badge_ticket.png';
            case 'MAP_MAKER': return '/images/badge_map.png';
            case 'MYSTIC_EXPLORER': return '/images/badge_hat.png';
            default: return '/images/badge_pine.png';
        }
    };

    // 각 뱃지 아이디별 커스텀 컬러 테마 매핑 (다채로움 극대화)
    const getBadgeCardStyle = (badgeId: string) => {
        switch (badgeId) {
            case 'PINE_COZY': 
                return { bg: 'from-[#F0F6F5] to-[#E3EFEF]', border: 'border-[#D1E6E4]/70', text: 'text-[#2E7D7A]', subText: 'text-[#5C9E9B]' };
            case 'COFFEE_CHAT': 
                return { bg: 'from-[#FAF0EB] to-[#F5E6DC]', border: 'border-[#EAD5C3]/70', text: 'text-[#C67A5A]', subText: 'text-[#D48F70]' };
            case 'HIP_VIBE': 
                return { bg: 'from-[#EEF2F6] to-[#E5EDF6]', border: 'border-[#D2E0F5]/70', text: 'text-[#3B82F6]', subText: 'text-[#60A5FA]' };
            case 'BEGINNER_SCRAP': 
                return { bg: 'from-[#FFFDF0] to-[#FFF9D6]', border: 'border-[#FCEEBC]/70', text: 'text-[#B7791F]', subText: 'text-[#D69E2E]' };
            case 'ACTIVE_VOTER': 
                return { bg: 'from-[#F0F7FF] to-[#E6F0FF]', border: 'border-[#CCE0FF]/70', text: 'text-[#2B6CB0]', subText: 'text-[#4299E1]' };
            case 'MAP_MAKER': 
                return { bg: 'from-[#F0FDF4] to-[#E8F8EE]', border: 'border-[#C2F0D5]/70', text: 'text-[#22543D]', subText: 'text-[#38A169]' };
            case 'MYSTIC_EXPLORER': 
                return { bg: 'from-[#FFF1F2] to-[#FFE4E6]', border: 'border-[#FECDD3]/70', text: 'text-[#9B2C2C]', subText: 'text-[#E53E3E]' };
            default: 
                return { bg: 'from-white to-[#F9FAFB]', border: 'border-[#EAEAEA]', text: 'text-[#191F28]', subText: 'text-[#8B95A1]' };
        }
    };

    // 선택된 뱃지 상세 정보
    const selectedBadge = useMemo(() => {
        if (!selectedBadgeId) return badges[0] || null;
        return badges.find((b: any) => b.badgeId === selectedBadgeId) || null;
    }, [selectedBadgeId, badges]);

    // 뱃지 획득에 기여한 장소들 필터링
    const contributedPlaces = useMemo(() => {
        if (!selectedBadge || !scrapsData) return [];
        
        const badgeId = selectedBadge.badgeId;
        
        const cozyTags = ["조용한", "코지한", "노트북하기좋은", "작업하기좋은", "책읽기좋은"];
        const chatTags = ["디저트맛집", "대형카페", "수다떨기좋은", "데이트코스", "단정함", "단체석"];
        const hipTags = ["힙한/인더스트리얼", "사진남기기좋은", "이색적인", "오션뷰", "햇살맛집", "뷰맛집"];

        return scrapsData.filter((scrap: any) => {
            const place = scrap.place;
            if (!place || !place.placeTagMaps) return false;
            
            const placeTags = place.placeTagMaps.map((m: any) => m.tag?.name);
            
            if (badgeId === 'PINE_COZY') {
                return placeTags.some((tag: string) => cozyTags.includes(tag));
            } else if (badgeId === 'COFFEE_CHAT') {
                return placeTags.some((tag: string) => chatTags.includes(tag));
            } else if (badgeId === 'HIP_VIBE') {
                return placeTags.some((tag: string) => hipTags.includes(tag));
            }
            
            return true;
        }).map(scrap => scrap.place);
    }, [selectedBadge, scrapsData]);

    const isCurrentBadgeEquipped = selectedBadge && equippedTitle === selectedBadge.badgeName;
    const isUnlocked = selectedBadge && selectedBadge.status === 'UNLOCKED';

    const handleEquipToggle = () => {
        if (!selectedBadge || !isUnlocked) return;
        if (isCurrentBadgeEquipped) {
            onEquip(null);
        } else {
            onEquip(selectedBadge.badgeName);
        }
    };

    // 상태 번역 헬퍼
    const translateStatus = (status: string) => {
        switch (status) {
            case 'UNLOCKED': return '획득 완료';
            case 'PROGRESS': return '진행 중';
            case 'LOCKED': return '잠김';
            default: return status;
        }
    };

    return (
        <div className="w-full flex flex-col gap-6 animate-fade-in shrink-0 pb-36 lg:pb-24">
            {/* 상단 네비게이션 헤더 */}
            <div className="flex items-center justify-between pb-4 border-b border-[#F2F4F6]">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={onBack}
                        className="w-9 h-9 rounded-full bg-[#F2F4F6] hover:bg-[#E5E8EB] flex items-center justify-center text-[#4E5968] active:scale-95 transition-all mr-1"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h3 className="font-extrabold text-[19px] text-[#191F28] tracking-tight">내 무드 뱃지 업적</h3>
                </div>
                {/* 실버/크롬 메탈 플레이트 해금 뱃지 */}
                <span className="text-[12px] font-extrabold text-[#475569] bg-gradient-to-r from-[#F1F5F9] via-[#FFFFFF] to-[#E2E8F0] px-3.5 py-1.5 rounded-[12px] border border-[#CBD5E1] shadow-[0_2px_8px_rgba(148,163,184,0.12),inset_0_1.5px_0_rgba(255,255,255,0.6)] flex items-center gap-1.5 select-none">
                    <span className="w-2 h-2 rounded-full bg-[#E2E8F0] shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)] border border-[#94A3B8]"></span>
                    <span>해금 {unlockedCount} / {badges.length}</span>
                </span>
            </div>

            {/* 1. 레벨 등급 게이지 */}
            <div className="bg-[#FAF8F5] border border-[#EFEBE4] rounded-[24px] p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/[0.015] rounded-full blur-xl"></div>
                <div className="text-left z-10 flex-1">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-[6px] bg-[#EFEBE4] text-[#8A7C6B]">나의 탐험 등급</span>
                    <h4 className="font-extrabold text-[17px] text-[#191F28] mt-1.5 leading-none">{levelInfo.title}</h4>
                    <p className="text-[12px] font-semibold text-[#8B95A1] mt-1.5">{levelInfo.sub}</p>
                </div>
                <div className="w-full sm:w-[200px] z-10">
                    <div className="flex justify-between items-center text-[11px] font-extrabold text-[#8A7C6B] mb-1.5">
                        <span>달성률</span>
                        <span>{Math.round(levelInfo.ratio)}%</span>
                    </div>
                    <div className="w-full h-3 bg-[#EAE5DC] rounded-full overflow-hidden shadow-inner">
                        <div className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500" style={{ width: `${levelInfo.ratio}%` }}></div>
                    </div>
                </div>
            </div>

            {/* 2. 3D 뱃지 그리드 리스트 (쇼케이스 3D 리디자인 및 마이크로 호버 피규어 리액션) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4 p-1.5">
                {badges.map((badge: any) => {
                    const isBadgeUnlocked = badge.status === 'UNLOCKED';
                    const isProgress = badge.status === 'PROGRESS';
                    const isSelected = selectedBadge?.badgeId === badge.badgeId;
                    const isEquipped = equippedTitle === badge.badgeName;
                    const styleSet = getBadgeCardStyle(badge.badgeId);

                    return (
                        <div 
                            key={badge.badgeId}
                            onClick={() => setSelectedBadgeId(badge.badgeId)}
                            className={`cursor-pointer rounded-[24px] p-4.5 flex flex-col items-center justify-center relative border select-none group 
                                transition-all duration-300 ease-out
                                bg-gradient-to-b from-white to-[#FAFAFA]
                                hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(0,0,0,0.05)]
                                ${isSelected 
                                    ? 'border-orange-500 shadow-[0_8px_24px_rgba(255,92,0,0.08)] scale-[1.02]' 
                                    : 'border-[#EAEAEA] hover:border-[#CBD5E1]'
                                }`}
                        >
                            {/* 3D 뱃지 둥글고 정갈하게 깎아주는 둥근 사각형 판 */}
                            <div className="w-24 h-24 rounded-[20px] bg-[#FAF9F6] border border-[#EFECE6] flex items-center justify-center mb-3.5 relative overflow-hidden select-none shadow-[inset_0_1.5px_4px_rgba(0,0,0,0.02)]">
                                <img 
                                    src={getBadgeImage(badge.badgeId)} 
                                    alt={badge.badgeName} 
                                    className={`w-full h-full object-cover transition-all duration-300 ease-out 
                                        group-hover:scale-108 group-hover:-translate-y-0.5
                                        ${isBadgeUnlocked 
                                            ? 'scale-100 filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.03)]' 
                                            : 'grayscale contrast-[0.8] opacity-30 scale-95'
                                        }`} 
                                    style={{
                                        mixBlendMode: 'multiply'
                                    }}
                                />
                                {/* 진행률 뱃지 */}
                                {!isBadgeUnlocked && isProgress && (
                                    <span className="absolute text-[8.5px] font-extrabold text-[#4E5968] bottom-1.5 right-1.5 bg-white/95 px-1.5 py-0.5 rounded-full shadow border border-[#E5E8EB]">
                                        {badge.progressPercentage}%
                                    </span>
                                )}
                            </div>

                            <p className={`font-extrabold text-[12.5px] leading-tight tracking-tight mb-1 text-center truncate w-full ${
                                isBadgeUnlocked ? 'text-[#191F28]' : 'text-[#8B95A1]'
                            }`}>
                                {badge.badgeName}
                            </p>
                            
                            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-[8px] border ${
                                isBadgeUnlocked 
                                    ? (isEquipped ? 'bg-orange-500 text-white border-transparent' : 'bg-[#FFF0E6]/60 text-orange-400 border-transparent') 
                                    : (isProgress ? 'bg-blue-50 text-[#2B7FFF] border-transparent' : 'bg-[#F2F4F6] text-[#8B95A1] border-transparent')
                            }`}>
                                {isBadgeUnlocked ? (isEquipped ? '장착 중' : '획득 완료') : (isProgress ? '진행 중' : '잠김')}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* 3. 뱃지 상세 설명 및 기여 공간 정보 (상하 구획 확실한 분리) */}
            {selectedBadge && (
                <div className="mt-2 bg-[#FAF8F5] rounded-[24px] border border-[#EFEBE4] p-5.5 lg:p-6.5 text-left flex flex-col gap-5 shadow-[0_8px_24px_rgba(0,0,0,0.02)] animate-slide-in-bottom">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <div className="w-14 h-14 bg-white border border-[#EFEBE4] rounded-[18px] overflow-hidden p-0.5 shrink-0 shadow-sm flex items-center justify-center">
                                <img src={getBadgeImage(selectedBadge.badgeId)} alt="detail" className={`w-full h-full object-cover ${selectedBadge.status === 'UNLOCKED' ? '' : 'grayscale opacity-40'}`} />
                            </div>
                            <div>
                                <div className="text-[9.5px] font-extrabold text-[#8A7C6B] bg-[#EFEBE4] px-1.5 py-0.5 rounded-[5px] w-fit mb-1">
                                    선택한 업적 상세 정보
                                </div>
                                <div className="flex items-center gap-2">
                                    <h4 className="font-extrabold text-[15.5px] text-[#191F28]">{selectedBadge.badgeName}</h4>
                                    <span className={`text-[9.5px] font-extrabold px-1.5 py-0.5 rounded-[6px] ${
                                        selectedBadge.status === 'UNLOCKED' ? 'bg-orange-100 text-orange-600' : 'bg-gray-200 text-[#6B7684]'
                                    }`}>
                                        {translateStatus(selectedBadge.status)}
                                    </span>
                                </div>
                                <p className="text-[12.5px] font-medium text-[#6B7684] mt-1.5 leading-relaxed">{selectedBadge.description}</p>
                            </div>
                        </div>

                        {/* 칭호 장착 버튼 */}
                        {isUnlocked && (
                            <button
                                onClick={handleEquipToggle}
                                className={`text-[12px] font-bold px-4 py-2.5 rounded-[12px] transition-all active:scale-[0.98] shrink-0 border ${
                                    isCurrentBadgeEquipped
                                        ? 'bg-[#F2F4F6] text-[#4E5968] hover:bg-[#E5E8EB] border-transparent'
                                        : 'bg-orange-500 text-white hover:bg-orange-600 border-transparent shadow-sm'
                                }`}
                            >
                                {isCurrentBadgeEquipped ? '장착 해제' : '대표 칭호로 장착'}
                            </button>
                        )}
                    </div>

                    {/* 링킹: 내 획득에 기여한 공간들 */}
                    <div className="border-t border-[#EFEBE4] pt-4.5">
                        <h5 className="font-bold text-[13px] text-[#4E5968] mb-3">내 획득에 기여한 공간들 ({contributedPlaces.length})</h5>
                        {contributedPlaces.length === 0 ? (
                            <div className="bg-white rounded-[20px] p-8 border border-[#F2F4F6] text-center flex flex-col items-center justify-center gap-2">
                                <p className="text-[12.5px] text-[#8B95A1] font-bold">아직 연관 조건으로 북마크된 공간이 없어요.</p>
                                <button 
                                    onClick={() => onViewChange('home')}
                                    className="text-[11.5px] font-extrabold text-orange-500 hover:underline flex items-center gap-0.5"
                                >
                                    <span>공간 탐색하러 가기</span>
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                                {contributedPlaces.map((place: any) => (
                                    <div 
                                        key={place.placeId}
                                        className="w-[140px] shrink-0 bg-white border border-[#EFEBE4] rounded-[20px] overflow-hidden p-2 flex flex-col gap-1.5 shadow-sm hover:border-orange-200 transition-colors"
                                    >
                                        <div className="w-full h-[85px] bg-[#F2F4F6] rounded-[14px] overflow-hidden">
                                            <img src={place.imageUrl || "/default_place.png"} alt={place.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="px-1 text-left">
                                            <p className="font-extrabold text-[12px] text-[#191F28] truncate leading-tight">{place.name}</p>
                                            <p className="text-[10px] text-[#8B95A1] font-semibold truncate mt-0.5">{place.address}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

