import React from 'react';
import DraggableScroll from '../ui/DraggableScroll';
import { getCategoryIcon, getVibeBadge } from '../ui/Helpers';

export const TAG_CATEGORIES = [
    { id: 'popular', title: "요즘 뜨는 취향", tags: ["대형카페", "노트북하기좋은", "햇살맛집", "디저트맛집", "뷰맛집", "데이트코스"] },
    { id: 'mood', title: "공간의 무드", tags: ["코지한", "따뜻한우드톤", "힙한/인더스트리얼", "조용한", "미니멀한", "식물가득", "나만아는"] },
    { id: 'facility', title: "목적과 시설", tags: ["콘센트석", "편안한쇼파", "주차가능", "반려동물동반", "루프탑", "단체석"] }
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
    setSelectedTags
}: ExploreViewProps) {
    
    return (
        <div 
            style={{ display: hidden ? 'none' : 'flex' }} 
            className="flex-1 h-full w-full overflow-y-auto no-scrollbar bg-[#F9FAFB] animate-slide-in-right lg:animate-fade-in flex flex-col absolute lg:relative inset-0 z-30 lg:z-auto items-center"
        >
            {/* 모바일 헤더 */}
            <header className="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#F2F4F6] px-2 py-4 flex items-center w-full shadow-sm">
                <button onClick={() => onViewChange('home')} className="w-12 h-12 flex items-center justify-center text-[#191F28] active:scale-90 relative z-50">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <h1 className="font-logo font-extrabold text-[22px] flex-1 text-center -ml-12 tracking-tight text-[#191F28]">Pick<span className="text-orange-500 font-logo">Pl</span></h1>
            </header>

            <div className="w-full lg:max-w-[880px] px-5 lg:px-8 py-6 lg:py-12 flex-1 flex flex-col">
                {/* PC 헤더: 비주얼 배너 */}
                <header className="hidden lg:flex flex-col gap-2 mb-10">
                    <span className="text-orange-500 font-extrabold text-[13px] tracking-widest uppercase">Mood & Space Curation</span>
                    <h1 className="font-bold text-[34px] tracking-tight text-[#191F28] leading-tight">
                        나만의 감성 공간을 <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-rose-500">픽(Pick)하다</span>
                    </h1>
                    <p className="text-[15px] font-medium text-[#8B95A1]">
                        당신의 일상과 감성에 어우러지는 최적의 분위기를 찾아보세요.
                    </p>
                </header>

                {/* 다중 태그 필터 영역 */}
                <div className="bg-white pt-6 pb-7 lg:p-8 rounded-[28px] lg:rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.015)] border border-[#F2F4F6] lg:mb-6 relative">
                    {/* 검색 인풋 추가 */}
                    <div className="px-1 lg:px-0">
                        <div className="relative w-full mb-6 lg:mb-8 group">
                            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-rose-500/5 rounded-[20px] blur-md transition-all duration-300 group-focus-within:blur-lg"></div>
                            <div className="relative flex items-center bg-white border border-[#E5E8EB] focus-within:border-orange-500/60 focus-within:shadow-[0_8px_30px_rgba(230,92,0,0.06)] rounded-[18px] px-5 py-3.5 transition-all duration-300">
                                <svg className="w-5 h-5 text-[#8B95A1] mr-3 shrink-0 transition-colors group-focus-within:text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
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
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <h2 className="text-[18px] lg:text-[20px] font-bold mb-6 tracking-tight text-[#191F28] px-1 lg:px-0 flex items-center gap-2">
                        <span>어떤 무드를 찾으시나요?</span>
                        <span className="text-[13px] font-normal text-[#8B95A1]">(다중 선택 가능)</span>
                    </h2>
                    <div className="flex flex-col gap-6 lg:gap-8">
                        {TAG_CATEGORIES.map((category: any) => (
                            <div key={category.id} className="pl-1 lg:pl-0">
                                <h3 className="text-[13px] lg:text-[14px] font-bold text-[#8B95A1] mb-3 lg:mb-4">{category.title}</h3>
                                <DraggableScroll className="flex flex-nowrap gap-2.5 lg:gap-3 overflow-x-auto no-scrollbar pr-6 pb-1">
                                    {category.tags.map((tag: string) => {
                                        const isSelected = selectedTags.includes(tag);
                                        let chipStyle = "";
                                        if (category.id === 'popular') {
                                            chipStyle = isSelected 
                                                ? "bg-[#E65C00] text-white border-[#E65C00] shadow-[0_8px_20px_rgba(230,92,0,0.18)] scale-[1.03]" 
                                                : "bg-[#FFF4EE]/70 text-[#E65C00] border-[#FFD2B8] hover:bg-[#FFF4EE]";
                                        } else if (category.id === 'mood') {
                                            chipStyle = isSelected 
                                                ? "bg-[#2E7D7A] text-white border-[#2E7D7A] shadow-[0_8px_20px_rgba(46,125,122,0.18)] scale-[1.03]" 
                                                : "bg-[#F0F6F5]/70 text-[#2E7D7A] border-[#D1E6E4] hover:bg-[#F0F6F5]";
                                        } else {
                                            chipStyle = isSelected 
                                                ? "bg-[#B38000] text-white border-[#B38000] shadow-[0_8px_20px_rgba(179,128,0,0.18)] scale-[1.03]" 
                                                : "bg-[#FFF9E6]/70 text-[#B38000] border-[#FFE9A3] hover:bg-[#FFF9E6]";
                                        }
                                        return (
                                            <button 
                                                key={tag} 
                                                onClick={() => toggleTag(tag)} 
                                                className={`px-4 py-2.5 lg:px-5 lg:py-2.5 rounded-[12px] text-[14px] lg:text-[15px] font-semibold transition-all active:scale-95 border whitespace-nowrap shrink-0 ${chipStyle}`}
                                            >
                                                {tag}
                                            </button>
                                        );
                                    })}
                                    <div className="w-2 shrink-0 lg:hidden"></div>
                                </DraggableScroll>
                            </div>
                        ))}
                    </div>

                    {(selectedTags.length > 0 || searchKeyword) && (
                        <div className="mt-6 lg:mt-8 pt-5 lg:pt-6 border-t border-[#F2F4F6] flex justify-between items-center animate-fade-in px-1 lg:px-0">
                            <p className="text-[14px] lg:text-[15px] font-bold text-[#4E5968]">
                                <span className="text-orange-500 font-extrabold">{filteredPlaces.length}</span>개의 감성 공간을 발견했습니다.
                            </p>
                            <button 
                                onClick={() => { setSelectedTags([]); setSearchKeyword(""); }} 
                                className="px-4 py-2 lg:px-5 lg:py-2 bg-[#F2F4F6] text-[#4E5968] rounded-[10px] font-bold text-[13px] lg:text-[14px] hover:bg-[#E5E8EB] active:scale-95 transition-all"
                            >
                                초기화
                            </button>
                        </div>
                    )}
                </div>

                {/* PC 컴팩트 티커 */}
                <DraggableScroll className="hidden lg:flex items-center gap-4 bg-white px-6 py-4 rounded-[20px] border border-[#F2F4F6] shadow-sm mb-8 overflow-x-auto no-scrollbar fade-edges mt-6">
                    <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[18px]">🔥</span>
                        <span className="font-bold text-[14px] text-[#191F28]">실시간 인기 무드</span>
                        <div className="w-[1px] h-4 bg-[#E5E8EB] ml-2"></div>
                    </div>
                    <div className="flex items-center gap-8 shrink-0">
                        {[{ rank: 1, name: '코지한' }, { rank: 2, name: '햇살맛집' }, { rank: 3, name: '노트북하기좋은' }].map((tag: any) => (
                            <div key={tag.rank} className="flex items-center gap-2 cursor-pointer hover:opacity-70 transition-opacity" onClick={() => toggleTag(tag.name)}>
                                <span className={`font-bold text-[14px] ${tag.rank <= 2 ? 'text-orange-500' : 'text-[#8B95A1]'}`}>{tag.rank}</span>
                                <span className="font-medium text-[14px] text-[#4E5968]">#{tag.name}</span>
                            </div>
                        ))}
                    </div>
                </DraggableScroll>

                {/* 검색 결과 리스트 */}
                <div className="pt-8 lg:pt-4 pb-[100px] lg:pb-24 flex-1">
                    <h3 className="font-bold text-[18px] lg:text-[22px] mb-5 lg:mb-6 tracking-tight text-[#191F28] px-1 lg:px-0 flex items-center gap-2">
                        <span>공간 리스트</span>
                        <span className="text-[15px] font-semibold text-[#8B95A1] bg-[#F2F4F6] px-2.5 py-1 rounded-[8px]">{filteredPlaces.length}곳</span>
                    </h3>
                    
                    <div className="flex flex-col gap-6 lg:gap-8">
                        {filteredPlaces.map((place: any) => {
                            const iconData = getCategoryIcon(place.category, place.name);
                            const vibe = getVibeBadge(place.initialVibe);
                            return (
                                <article 
                                    key={place.id} 
                                    onClick={() => onPlaceClick(place)} 
                                    className="flex flex-col lg:flex-row bg-white rounded-[28px] lg:rounded-[32px] border border-[#E5E8EB] lg:border-[#F2F4F6] cursor-pointer shadow-[0_8px_24px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_48px_rgba(230,92,0,0.08)] hover:border-orange-200/60 transition-all duration-500 group overflow-hidden relative"
                                >
                                    {/* 썸네일 영역 */}
                                    <div className="relative w-full lg:w-[260px] aspect-[16/10] lg:aspect-square shrink-0 overflow-hidden bg-[#F8F9FA] p-3 lg:p-4">
                                        <div className="w-full h-full rounded-[20px] lg:rounded-[24px] overflow-hidden relative shadow-inner bg-gray-100">
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
                                            <div className="absolute top-6 left-6 bg-blue-500/90 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1.5 rounded-[10px] flex items-center gap-1 shadow-md border border-white/20 z-10 animate-fade-in">
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                                </svg>
                                                Secret
                                            </div>
                                        )}
                                    </div>

                                    {/* 모바일용 세세한 설명 레이아웃 (lg:hidden) */}
                                    <div className="lg:hidden p-6 pt-2 flex flex-col gap-4">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                                                    <span className={`w-5.5 h-5.5 rounded-full flex items-center justify-center ${iconData.bg} ${iconData.text} text-[10px] shrink-0`}>
                                                        {iconData.icon}
                                                    </span>
                                                    <span className="text-[12.5px] font-bold text-[#8B95A1] uppercase tracking-wider">{place.category || '공간'}</span>
                                                </div>
                                                <h2 className="text-[21px] font-extrabold text-[#191F28] tracking-tight group-hover:text-orange-500 transition-colors leading-tight truncate">{place.name}</h2>
                                                <p className="text-[#8B95A1] text-[13px] mt-1 font-semibold flex items-center gap-1 w-full overflow-hidden">
                                                    <svg className="w-3.5 h-3.5 text-[#B0B8C1] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    <span className="truncate flex-1">{place.location ? place.location.split(' ').slice(0, 2).join(' ') : '서울'}</span>
                                                    <span className="text-[#B0B8C1] shrink-0">·</span>
                                                    <span className="shrink-0 text-orange-500/90 font-bold">{place.distance}</span>
                                                </p>
                                            </div>
                                            
                                            {/* 분위기 뱃지 + 북마크 버튼 */}
                                            <div className="flex items-center gap-2 shrink-0">
                                                {vibe && (
                                                    <div className={`px-2 py-1 rounded-[6px] flex items-center gap-1 border text-[10px] font-extrabold shadow-sm ${vibe.bg}`}>
                                                        <div className={`w-1.5 h-1.5 rounded-full ${vibe.dot} animate-pulse`}></div>
                                                        <span>{vibe.text}</span>
                                                    </div>
                                                )}
                                                <button 
                                                    onClick={(e) => onCardSaveClick(place, e)}
                                                    className="w-11 h-11 rounded-full bg-[#F2F4F6]/80 hover:bg-[#E5E8EB] active:scale-90 transition-all flex items-center justify-center text-[#8B95A1] hover:text-orange-500 shrink-0 border border-gray-100 shadow-sm"
                                                >
                                                    <svg className={`w-5 h-5 ${place.isScrapped ? 'text-orange-500 fill-current animate-bookmark-pop' : 'text-[#8B95A1]'}`} fill={place.isScrapped ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-1.5">
                                            {place.tags.slice(0, 3).map((tag: string) => (
                                                <span key={tag} className="px-2.5 py-1 rounded-[8px] text-[12px] font-bold tracking-tight bg-[#F2F4F6] text-[#4E5968] border border-gray-100">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                        
                                        {/* 모바일 큐레이터 감성 리뷰 카드 */}
                                        {place.editorsComment && (
                                            <div className="bg-[#FAF9F6] border border-[#F2ECE5] p-4 rounded-[16px] text-[13px] text-[#5A4F43] flex items-start gap-3 relative overflow-hidden">
                                                <div className="w-5 h-5 rounded-full bg-[#FFF0E6] flex items-center justify-center text-orange-500 font-serif text-[15px] select-none mt-0.5 shrink-0">
                                                    “
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[10px] font-bold text-orange-500/90 tracking-widest uppercase mb-0.5">Editor's Pick Review</p>
                                                    <p className="line-clamp-3 font-semibold text-[#4E4338] leading-relaxed">
                                                        {place.editorsComment}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* PC용 전용 상세 레이아웃 (hidden lg:flex) */}
                                    <div className="hidden lg:flex flex-1 p-8 flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start gap-6">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2.5 mb-2.5 flex-wrap">
                                                        <span className={`w-8 h-8 rounded-[10px] flex items-center justify-center ${iconData.bg} ${iconData.text} shadow-sm shrink-0`}>
                                                            {iconData.icon}
                                                        </span>
                                                        <span className="text-[13px] font-bold text-[#8B95A1] uppercase tracking-wider">{place.category || '공간'}</span>
                                                    </div>
                                                    <h2 className="text-[24px] font-extrabold text-[#191F28] tracking-tight group-hover:text-orange-500 transition-colors duration-300 leading-snug truncate">
                                                        {place.name}
                                                    </h2>
                                                    <p className="text-[#8B95A1] text-[14.5px] mt-1.5 font-semibold flex items-center gap-1.5 w-full overflow-hidden">
                                                        <svg className="w-4 h-4 text-[#B0B8C1] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                        <span className="truncate flex-1">{place.location}</span>
                                                        <span className="text-[#B0B8C1] shrink-0">·</span>
                                                        <span className="shrink-0 text-[#E65C00] font-bold">{place.distance}</span>
                                                    </p>
                                                </div>
                                                
                                                {/* 분위기 뱃지 + 북마크 버튼 */}
                                                <div className="flex items-center gap-3 shrink-0">
                                                    {vibe && (
                                                        <div className={`px-2.5 py-1.5 rounded-[8px] flex items-center gap-1.5 border text-[11px] font-extrabold shadow-sm ${vibe.bg}`}>
                                                            <div className={`w-1.5 h-1.5 rounded-full ${vibe.dot} animate-pulse`}></div>
                                                            <span>{vibe.text}</span>
                                                        </div>
                                                    )}
                                                    <button 
                                                        onClick={(e) => onCardSaveClick(place, e)}
                                                        className="w-12 h-12 rounded-full bg-[#F2F4F6] hover:bg-[#E5E8EB] active:scale-90 transition-all flex items-center justify-center text-[#8B95A1] hover:text-orange-500 shrink-0 border border-gray-100 shadow-sm"
                                                    >
                                                        <svg className={`w-[22px] h-[22px] ${place.isScrapped ? 'text-orange-500 fill-current animate-bookmark-pop' : 'text-[#8B95A1]'}`} fill={place.isScrapped ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            <div className="flex flex-wrap gap-2 mt-5">
                                                {place.tags.map((tag: string) => {
                                                    let activeStyle = "bg-[#F8F9FA] text-[#4E5968] border-[#E5E8EB] hover:bg-[#F2F4F6]";
                                                    if (selectedTags.includes(tag)) {
                                                        const category = TAG_CATEGORIES.find(c => c.tags.includes(tag));
                                                        if (category?.id === 'popular') {
                                                            activeStyle = "bg-[#FFF4EE] text-[#E65C00] border-[#FFD2B8] shadow-sm";
                                                        } else if (category?.id === 'mood') {
                                                            activeStyle = "bg-[#F0F6F5] text-[#2E7D7A] border-[#D1E6E4] shadow-sm";
                                                        } else {
                                                            activeStyle = "bg-[#FFF9E6] text-[#B38000] border-[#FFE9A3] shadow-sm";
                                                        }
                                                    }
                                                    return (
                                                        <span key={tag} className={`px-3 py-1.5 rounded-[12px] text-[13px] font-bold tracking-tight border transition-colors ${activeStyle}`}>
                                                            #{tag}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        
                                        {/* PC 큐레이터 감성 리뷰 카드 */}
                                        {place.editorsComment && (
                                            <div className="mt-6 bg-[#FAF9F6] border border-[#F2ECE5] px-5 py-4 rounded-[18px] text-[13.5px] text-[#5A4F43] flex items-start gap-3.5 relative overflow-hidden select-none">
                                                <div className="w-6 h-6 rounded-full bg-[#FFF0E6] flex items-center justify-center text-orange-500 font-serif text-[18px] select-none mt-0.5 shrink-0">
                                                    “
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[11px] font-bold text-orange-500/90 tracking-widest uppercase mb-1">Editor's Pick Review</p>
                                                    <p className="line-clamp-3 font-semibold text-[#4E4338] leading-relaxed">
                                                        {place.editorsComment}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </article>
                            );
                        })}

                        {filteredPlaces.length === 0 && (
                            <div className="text-center py-20 lg:py-24 bg-white lg:rounded-[32px] lg:border border-[#F2F4F6] mt-4 shadow-sm">
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
        </div>
    );
}
