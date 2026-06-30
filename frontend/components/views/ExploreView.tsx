import React, { useMemo } from 'react';
import DraggableScroll from '../ui/DraggableScroll';
import { getCategoryIcon, getVibeBadge } from '../ui/Helpers';
import { useLocationStore } from '../../store/locationStore';
import InfiniteScrollTrigger from '../ui/InfiniteScrollTrigger';

export const TAG_CATEGORIES = [
    { id: 'popular', title: "요즘 뜨는 취향", tags: ["대형카페", "노트북하기좋은", "햇살맛집", "디저트맛집", "뷰맛집", "데이트코스"] },
    { id: 'mood', title: "공간의 무드", tags: ["코지한", "따뜻한우드톤", "힙한/인더스트리얼", "조용한", "미니멀한", "식물가득", "나만아는", "숨겨진보석", "힙한레트로"] },
    { id: 'context', title: "상황과 동행", tags: ["비오는날", "실내데이트", "혼자구경하기좋은", "데이트추천", "주말나들이", "작업하기좋은", "사진남기기좋은", "피크닉하기좋은", "겨울온천여행", "여름휴가", "단풍구경", "눈오는날"] },
    { id: 'facility', title: "목적과 시설", tags: ["콘센트석", "편안한쇼파", "주차가능", "반려동물동반", "루프탑", "단체석", "에메랄드빛바다", "독채", "풀빌라", "바비큐가능", "스파/온천", "어메니티완비"] }
];

interface ExploreViewProps {
    hidden: boolean;
    searchKeyword: string;
    setSearchKeyword: (val: string) => void;
    selectedTags: string[];
    toggleTag: (tag: string) => void;
    filteredPlaces: any[];
    onPlaceClick: (place: any) => void;
    onCardSaveClick: (place: any, e: React.MouseEvent) => void;
    onViewChange: (view: string) => void;
    setSelectedTags: React.Dispatch<React.SetStateAction<string[]>>;
    loadMore: () => void;
    hasMore: boolean;
    isLoadingMore: boolean;
    isValidating: boolean;
    totalElements?: number;
    popularTags?: any[];
}

export default function ExploreView({
    hidden,
    searchKeyword,
    setSearchKeyword,
    selectedTags,
    toggleTag,
    filteredPlaces,
    onPlaceClick,
    onCardSaveClick,
    onViewChange,
    setSelectedTags,
    loadMore,
    hasMore,
    isLoadingMore,
    isValidating,
    totalElements = 0,
    popularTags
}: ExploreViewProps) {
    const locationStore = useLocationStore();
    const [activeCategory, setActiveCategory] = React.useState<string>('popular');

    const handleLocationToggle = () => {
        if (locationStore.permissionStatus === 'denied' || locationStore.permissionStatus === 'error' || locationStore.permissionStatus === 'prompt') {
            const nextPlace = locationStore.fallbackPlace === 'seongsu' ? 'gangnam' : 'seongsu';
            locationStore.setFallbackPlace(nextPlace);
        }
    };

    const getLocationLabel = () => {
        if (locationStore.permissionStatus === 'granted') {
            return '내 위치 주변';
        }
        return locationStore.fallbackPlace === 'seongsu' ? '성수역' : '강남역';
    };

    const activeCategoryInfo = useMemo(() => {
        return TAG_CATEGORIES.find(c => c.id === activeCategory) || TAG_CATEGORIES[0];
    }, [activeCategory]);
    
    return (
        <div 
            style={{ display: hidden ? 'none' : 'flex' }} 
            className="flex-1 h-full w-full overflow-y-auto no-scrollbar bg-[#F9FAFB] animate-slide-in-right lg:animate-fade-in flex flex-col absolute lg:relative inset-0 z-30 lg:z-auto items-center"
        >
            {/* 모바일 헤더 */}
            <header className="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#F2F4F6] px-2 py-4 flex items-center w-full shadow-sm justify-between">
                <button onClick={() => onViewChange('home')} className="w-12 h-12 flex items-center justify-center text-[#191F28] active:scale-90 relative z-50 shrink-0">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div className="flex items-center gap-2 flex-1 justify-center -ml-6">
                    <h1 className="font-logo font-extrabold text-[22px] tracking-tight text-[#191F28]">Pick<span className="text-orange-500 font-logo">Pl</span></h1>
                    
                    {/* 위치 칩 */}
                    <div 
                        onClick={handleLocationToggle}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-[10px] cursor-pointer transition-all border select-none active:scale-95 shrink-0 ${
                            locationStore.permissionStatus === 'granted' 
                            ? 'bg-orange-50 text-orange-600 border-orange-100' 
                            : 'bg-[#F2F4F6] text-[#4E5968] border-transparent hover:bg-[#E5E8EB]'
                        }`}
                    >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-[10.5px] font-bold">{getLocationLabel()}</span>
                    </div>
                </div>
                <div className="w-6 shrink-0 lg:hidden"></div>
            </header>

            <div className="w-full lg:max-w-[960px] px-5 lg:px-8 py-6 lg:py-12 flex-1 flex flex-col">
                {/* PC 헤더: 비주얼 배너 */}
                <header className="hidden lg:flex flex-col gap-2 mb-10">
                    <div className="flex items-center gap-3">
                        <span className="text-orange-500 font-extrabold text-[13px] tracking-widest uppercase">Mood & Space Curation</span>
                        
                        {/* 위치 칩 */}
                        <div 
                            onClick={handleLocationToggle}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-[12px] cursor-pointer transition-all border select-none active:scale-95 ${
                                locationStore.permissionStatus === 'granted' 
                                ? 'bg-orange-50 text-orange-600 border-orange-100' 
                                : 'bg-[#F2F4F6] text-[#4E5968] border-transparent hover:bg-[#E5E8EB]'
                            }`}
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-[11px] font-bold">{getLocationLabel()}</span>
                        </div>
                    </div>
                    <h1 className="font-bold text-[34px] tracking-tight text-[#191F28] leading-tight">
                        나만의 감성 공간을 <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-rose-500">픽(Pick)하다</span>
                    </h1>
                    <p className="text-[15px] font-medium text-[#8B95A1]">
                        당신의 일상과 감성에 어우러지는 최적의 분위기를 찾아보세요.
                    </p>
                </header>

                {/* 다중 태그 필터 영역 (탭 방식으로 콤팩트 리디자인) */}
                <div className="bg-white pt-6 pb-7 lg:p-8 rounded-[28px] lg:rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.015)] border border-[#F2F4F6] lg:mb-6 relative">
                    
                    {/* 검색 인풋 */}
                    <div className="px-1 lg:px-0">
                        <div className="relative w-full mb-6 group">
                            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-rose-500/5 rounded-[20px] blur-md transition-all duration-300 group-focus-within:blur-lg"></div>
                            <div className="relative flex items-center bg-white border border-[#E5E8EB] focus-within:border-orange-500/60 focus-within:shadow-[0_8px_30px_rgba(230,92,0,0.06)] rounded-[18px] px-5 py-3.5 transition-all duration-300">
                                <svg className="w-5 h-5 text-[#8B95A1] mr-3 shrink-0 transition-colors group-focus-within:text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input 
                                    type="text" 
                                    placeholder="공간 이름, 분위기 태그, 지역 등으로 검색해보세요..." 
                                    value={searchKeyword}
                                    onChange={(e) => setSearchKeyword(e.target.value)}
                                    className="w-full bg-transparent border-none outline-none text-[15.5px] font-medium text-[#191F28] placeholder-[#B0B8C1]"
                                />
                                {searchKeyword && (
                                    <button 
                                        onClick={() => setSearchKeyword("")}
                                        className="w-5.5 h-5.5 rounded-full bg-[#E5E8EB] hover:bg-[#D1D6DB] flex items-center justify-center text-[#8B95A1] hover:text-[#4E5968] active:scale-95 transition-all"
                                    >
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 선택된 필터 활성화 칩 영역 */}
                    {(selectedTags.length > 0 || searchKeyword) && (
                        <div className="flex flex-wrap gap-2 mb-6 px-1 lg:px-0 items-center">
                            <span className="text-[12px] font-bold text-[#8B95A1] mr-1 shrink-0">선택한 무드</span>
                            {searchKeyword && (
                                <button 
                                    onClick={() => setSearchKeyword("")}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-orange-50 text-orange-600 border border-orange-100 text-[12.5px] font-bold shadow-sm active:scale-95 transition-all hover:bg-orange-100"
                                >
                                    <span>검색어: {searchKeyword}</span>
                                    <svg className="w-3 h-3 opacity-70 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                            {selectedTags.map(tag => {
                                const cat = TAG_CATEGORIES.find(c => c.tags.includes(tag));
                                let colorClass = "bg-[#FFF4EE] text-[#E65C00] border-[#FFD2B8] hover:bg-[#FFF4EE]/90";
                                if (cat?.id === 'mood') colorClass = "bg-[#F0F6F5] text-[#2E7D7A] border-[#D1E6E4] hover:bg-[#F0F6F5]/90";
                                if (cat?.id === 'context') colorClass = "bg-[#EEF1FC] text-[#4B5EAA] border-[#D6DBF5] hover:bg-[#EEF1FC]/90";
                                if (cat?.id === 'facility') colorClass = "bg-[#FFF9E6] text-[#B38000] border-[#FFE9A3] hover:bg-[#FFF9E6]/90";
                                
                                return (
                                    <button 
                                        key={tag} 
                                        onClick={() => toggleTag(tag)} 
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] border text-[12.5px] font-bold shadow-sm active:scale-95 transition-all ${colorClass}`}
                                    >
                                        <span>#{tag}</span>
                                        <svg className="w-3 h-3 opacity-70 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                );
                            })}
                            <button 
                                onClick={() => { setSelectedTags([]); setSearchKeyword(""); }}
                                className="text-[12.5px] font-bold text-[#8B95A1] hover:text-orange-500 ml-auto underline"
                            >
                                전체 초기화
                            </button>
                        </div>
                    )}

                    {/* 카테고리 탭 바 */}
                    <div className="flex border-b border-[#F2F4F6] mb-6 px-1 lg:px-0 gap-1 overflow-x-auto no-scrollbar">
                        {TAG_CATEGORIES.map((category) => {
                            const isActive = activeCategory === category.id;
                            return (
                                <button
                                    key={category.id}
                                    onClick={() => setActiveCategory(category.id)}
                                    className={`pb-3.5 px-4 font-bold text-[14px] lg:text-[15px] border-b-2 transition-all relative whitespace-nowrap shrink-0 ${
                                        isActive 
                                            ? 'text-orange-500 border-orange-500' 
                                            : 'text-[#8B95A1] border-transparent hover:text-[#4E5968]'
                                    }`}
                                >
                                    {category.title}
                                </button>
                            );
                        })}
                    </div>

                    {/* 활성 카테고리의 태그 리스트 */}
                    <div className="px-1 lg:px-0">
                        <div className="flex flex-wrap gap-2.5 lg:gap-3">
                            {activeCategoryInfo.tags.map((tag: string) => {
                                const isSelected = selectedTags.includes(tag);
                                let chipStyle = "";
                                if (activeCategory === 'popular') {
                                    chipStyle = isSelected 
                                        ? "bg-[#E65C00] text-white border-[#E65C00] shadow-[0_8px_20px_rgba(230,92,0,0.18)] scale-[1.02]" 
                                        : "bg-[#FFF4EE]/70 text-[#E65C00] border-[#FFD2B8] hover:bg-[#FFF4EE]";
                                } else if (activeCategory === 'mood') {
                                    chipStyle = isSelected 
                                        ? "bg-[#2E7D7A] text-white border-[#2E7D7A] shadow-[0_8px_20px_rgba(46,125,122,0.18)] scale-[1.02]" 
                                        : "bg-[#F0F6F5]/70 text-[#2E7D7A] border-[#D1E6E4] hover:bg-[#F0F6F5]";
                                } else if (activeCategory === 'context') {
                                    chipStyle = isSelected 
                                        ? "bg-[#4B5EAA] text-white border-[#4B5EAA] shadow-[0_8px_20px_rgba(75,94,170,0.18)] scale-[1.02]" 
                                        : "bg-[#EEF1FC]/70 text-[#4B5EAA] border-[#D6DBF5] hover:bg-[#EEF1FC]";
                                } else {
                                    chipStyle = isSelected 
                                        ? "bg-[#B38000] text-white border-[#B38000] shadow-[0_8px_20px_rgba(179,128,0,0.18)] scale-[1.02]" 
                                        : "bg-[#FFF9E6]/70 text-[#B38000] border-[#FFE9A3] hover:bg-[#FFF9E6]";
                                }
                                return (
                                    <button 
                                        key={tag} 
                                        onClick={() => toggleTag(tag)} 
                                        className={`px-4 py-2.5 rounded-[12px] text-[13.5px] lg:text-[14px] font-bold transition-all active:scale-95 border whitespace-nowrap shrink-0 ${chipStyle}`}
                                    >
                                        {tag}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* PC 컴팩트 티커 */}
                <DraggableScroll className="hidden lg:flex items-center gap-4 bg-white px-6 py-4 rounded-[20px] border border-[#F2F4F6] shadow-sm mb-4 overflow-x-auto no-scrollbar fade-edges mt-4">
                    <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[18px]">🔥</span>
                        <span className="font-bold text-[14.5px] text-[#191F28]">실시간 인기 무드</span>
                        <div className="w-[1px] h-4 bg-[#E5E8EB] ml-2"></div>
                    </div>
                    <div className="flex items-center gap-6 shrink-0">
                        {(popularTags || []).map((tag: any) => {
                            const isSelected = selectedTags.includes(tag.tagName);
                            const badgeEmoji = tag.tagType === 'TREND' ? '🔥'
                                             : tag.tagType === 'RISING' ? '✨'
                                             : '❤️';
                            return (
                                <div 
                                    key={tag.ranking} 
                                    className={`flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all px-3 py-1.5 rounded-[10px] ${isSelected ? 'bg-orange-500 text-white shadow-sm' : 'hover:bg-[#F2F4F6]'}`} 
                                    onClick={() => toggleTag(tag.tagName)}
                                >
                                    <span className={`font-extrabold text-[12.5px] ${isSelected ? 'text-white' : 'text-[#8B95A1]'}`}>{tag.ranking}</span>
                                    <span className="text-[11px]">{badgeEmoji}</span>
                                    <span className={`font-bold text-[13.5px] ${isSelected ? 'text-white' : 'text-[#4E5968]'}`}>#{tag.tagName}</span>
                                    {tag.detailValue && (
                                        <span className={`text-[10px] font-extrabold ${isSelected ? 'text-white/90' : 'text-orange-500'}`}>{tag.detailValue}</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </DraggableScroll>

                {/* 검색 결과 리스트 (유튜브 추천 피드 형태의 Grid 격자 레이아웃으로 개선) */}
                <div className="pt-8 lg:pt-4 pb-[100px] lg:pb-24 flex-1">
                    <h3 className="font-bold text-[18px] lg:text-[22px] mb-6 tracking-tight text-[#191F28] px-1 lg:px-0 flex items-center gap-2">
                        <span>공간 리스트</span>
                        <span className="text-[14px] font-bold text-[#E65C00] bg-orange-50 border border-orange-100 px-3 py-1 rounded-[10px] shadow-sm">
                            총 {totalElements}곳의 공간
                        </span>
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                        {filteredPlaces.map((place: any) => {
                            const iconData = getCategoryIcon(place.category, place.name);
                            const vibe = getVibeBadge(place.initialVibe);
                            
                            const commentToUse = place.editorsComment || place.aiMoodSummary;
                            const hasHeadline = commentToUse && commentToUse.includes('|');
                            let headline = '';
                            let commentBody = commentToUse || '';

                            if (hasHeadline && commentToUse) {
                                const parts = commentToUse.split('|');
                                headline = parts[0].trim();
                                commentBody = parts[1].trim();
                            }
                            
                            return (
                                <article 
                                    key={place.id} 
                                    onClick={() => onPlaceClick(place)} 
                                    className="flex flex-col bg-white rounded-[24px] lg:rounded-[28px] border border-[#E5E8EB] lg:border-[#F2F4F6] cursor-pointer shadow-[0_8px_24px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_48px_rgba(230,92,0,0.08)] hover:border-orange-200/60 transition-all duration-500 group overflow-hidden relative flex-1"
                                >
                                    {/* 썸네일 영역 (가로세로 비율 고정) */}
                                    <div className="relative w-full aspect-[1.5/1] overflow-hidden bg-[#F8F9FA] p-3">
                                        <div className="w-full h-full rounded-[16px] lg:rounded-[20px] overflow-hidden relative shadow-inner bg-gray-100">
                                            <img 
                                                src={place.imageUrl} 
                                                alt={place.name} 
                                                className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700" 
                                                loading="lazy"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-60"></div>
                                        </div>
                                        
                                        {/* Secret 뱃지 */}
                                        {place.isHiddenGem && (
                                            <div className="absolute top-5 left-5 bg-blue-500/90 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-[8px] flex items-center gap-1 shadow-md border border-white/20 z-10">
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                                </svg>
                                                Secret
                                            </div>
                                        )}
                                        
                                        {/* 북마크 플로팅 버튼 */}
                                        <button 
                                            onClick={(e) => onCardSaveClick(place, e)}
                                            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md hover:bg-white active:scale-90 transition-all flex items-center justify-center text-[#8B95A1] hover:text-orange-500 shadow-md border border-white/20 z-10"
                                        >
                                            <svg className={`w-4.5 h-4.5 ${place.isScrapped ? 'text-orange-500 fill-current animate-bookmark-pop' : 'text-[#8B95A1]'}`} fill={place.isScrapped ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                            </svg>
                                        </button>
                                    </div>

                                    {/* 정보 영역 */}
                                    <div className="p-5 pt-2 flex-1 flex flex-col justify-between gap-4">
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center justify-between gap-2 mb-0.5">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <span className={`w-5.5 h-5.5 rounded-full flex items-center justify-center ${iconData.bg} ${iconData.text} text-[9.5px] shrink-0 border border-[#F2F4F6]`}>
                                                        {iconData.icon}
                                                    </span>
                                                    <span className="text-[11.5px] font-bold text-[#8B95A1] uppercase tracking-wider truncate">{place.category || '공간'}</span>
                                                </div>
                                                {vibe && (
                                                    <div className={`px-2 py-0.5 rounded-[6px] flex items-center gap-1 border text-[9px] font-extrabold shadow-sm ${vibe.bg} shrink-0`}>
                                                        <div className={`w-1 h-1 rounded-full ${vibe.dot} animate-pulse`}></div>
                                                        <span>{vibe.text}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <h2 className="text-[17px] lg:text-[18px] font-extrabold text-[#191F28] tracking-tight group-hover:text-orange-500 transition-colors leading-snug truncate">
                                                {place.name}
                                            </h2>
                                            
                                            <p className="text-[#8B95A1] text-[12.5px] font-semibold flex items-center gap-1 w-full overflow-hidden">
                                                <svg className="w-3.5 h-3.5 text-[#B0B8C1] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                <span className="truncate flex-1">{place.location ? place.location.split(' ').slice(0, 2).join(' ') : '서울'}</span>
                                                {place.distance && (
                                                    <>
                                                        <span className="text-[#B0B8C1] shrink-0">·</span>
                                                        <span className="shrink-0 text-orange-500 font-bold">{place.distance}</span>
                                                    </>
                                                )}
                                            </p>
                                        </div>

                                        {/* 말풍선 에디터 코멘트 */}
                                        {commentToUse && (
                                            <div className="bg-[#FAF9F6] border border-[#F2ECE5] p-3.5 rounded-[16px] text-[12.5px] text-[#5A4F43] flex items-start gap-2.5 relative overflow-hidden select-none">
                                                <div className="w-5 h-5 rounded-full bg-[#FFF0E6] flex items-center justify-center text-orange-500 font-serif text-[14px] select-none mt-0.5 shrink-0">
                                                    “
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    {hasHeadline ? (
                                                        <>
                                                            <p className="text-[11px] font-extrabold text-[#E65C00] tracking-tight mb-0.5 truncate">{headline}</p>
                                                            <p className="line-clamp-2 font-semibold text-[#4E4338] leading-relaxed text-[12px]">
                                                                {commentBody}
                                                            </p>
                                                        </>
                                                    ) : (
                                                        <p className="line-clamp-2 font-semibold text-[#4E4338] leading-relaxed">
                                                            {commentBody}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        
                                        <div className="flex flex-wrap gap-1.5 mt-auto pt-1">
                                            {place.tags.slice(0, 2).map((tag: string) => {
                                                let tagActiveStyle = "bg-[#F2F4F6] text-[#4E5968]";
                                                if (selectedTags.includes(tag)) {
                                                    const tagCategory = TAG_CATEGORIES.find(c => c.tags.includes(tag));
                                                    if (tagCategory?.id === 'popular') tagActiveStyle = "bg-[#FFF4EE] text-[#E65C00]";
                                                    if (tagCategory?.id === 'mood') tagActiveStyle = "bg-[#F0F6F5] text-[#2E7D7A]";
                                                    if (tagCategory?.id === 'context') tagActiveStyle = "bg-[#EEF1FC] text-[#4B5EAA]";
                                                    if (tagCategory?.id === 'facility') tagActiveStyle = "bg-[#FFF9E6] text-[#B38000]";
                                                }
                                                return (
                                                    <span key={tag} className={`px-2 py-0.5 rounded-[6px] text-[11px] font-bold border border-transparent transition-colors ${tagActiveStyle}`}>
                                                        #{tag}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>

                    {filteredPlaces.length > 0 && (
                        <div className="mt-8 flex justify-center w-full">
                            <InfiniteScrollTrigger 
                                onLoadMore={loadMore} 
                                hasMore={hasMore} 
                                isLoadingMore={isLoadingMore} 
                                isValidating={isValidating}
                            />
                        </div>
                    )}

                    {filteredPlaces.length === 0 && (
                        <div className="text-center py-20 lg:py-24 bg-white rounded-[28px] border border-[#F2F4F6] mt-4 shadow-sm w-full">
                            <svg className="w-12 h-12 lg:w-16 lg:h-16 mx-auto mb-4 lg:mb-6 text-[#D1D6DB]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="font-medium text-[15px] lg:text-[16px] text-[#4E5968]">선택하신 조건의 공간이 없습니다.</p>
                            <button onClick={() => { setSelectedTags([]); setSearchKeyword(""); }} className="mt-4 lg:mt-6 px-5 py-2.5 lg:px-6 lg:py-3 bg-[#191F28] text-white rounded-[12px] font-bold text-[13px] lg:text-[14px] hover:bg-black transition-colors shadow-sm">초기화하기</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
