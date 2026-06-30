import React from 'react';
import DraggableScroll from '../ui/DraggableScroll';
import { getCategoryIcon } from '../ui/Helpers';
import { useLocationStore } from '../../store/locationStore';
import InfiniteScrollTrigger from '../ui/InfiniteScrollTrigger';

interface DiscoverViewProps {
    hidden: boolean;
    placesData: any[];
    onPlaceClick: (place: any) => void;
    onCardSaveClick: (place: any, e: React.MouseEvent) => void;
    onViewChange: (view: string) => void;
    onShowTermsModal: (type: 'terms' | 'privacy' | null) => void;
    loadMore: () => void;
    hasMore: boolean;
    isLoadingMore: boolean;
    isValidating: boolean;
    activeThemeName?: string;
    recommendationData?: any;
    isLoggedIn?: boolean;
    popularTags?: any[];
    activeTag?: string | null;
    onTagSelect?: (tag: string) => void;
}

export default function DiscoverView({
    hidden,
    placesData,
    onPlaceClick,
    onCardSaveClick,
    onViewChange,
    onShowTermsModal,
    loadMore,
    hasMore,
    isLoadingMore,
    isValidating,
    activeThemeName,
    recommendationData,
    isLoggedIn,
    popularTags,
    activeTag,
    onTagSelect
}: DiscoverViewProps) {
    const locationStore = useLocationStore();

    const bannerInfo = React.useMemo(() => {
        const theme = activeThemeName;
        switch (theme) {
            case '비오는날':
                return {
                    title: '비 오는 날,\n창밖을 보며 멍때리기',
                    mobileTitle: '비 오는 날,\n창밖을 보기 좋은 카페',
                    image: '/curation_rainy.png',
                    icon: (
                        <svg className="w-7 h-7 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                        </svg>
                    )
                };
            case '봄':
                return {
                    title: '따스한 봄날,\n소풍하기 좋은 곳',
                    mobileTitle: '따스한 봄날,\n소풍하기 좋은 곳',
                    image: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?q=80&w=600',
                    icon: (
                        <svg className="w-7 h-7 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    )
                };
            case '여름':
                return {
                    title: '무더운 날,\n시원한 곳으로 풍덩',
                    mobileTitle: '무더운 날,\n시원한 곳으로 풍덩',
                    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600',
                    icon: (
                        <svg className="w-7 h-7 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M14 12a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    )
                };
            case '가을':
                return {
                    title: '바스락 단풍잎,\n사색의 숲길 걷기',
                    mobileTitle: '바스락 단풍잎,\n사색의 숲길 걷기',
                    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=600',
                    icon: (
                        <svg className="w-7 h-7 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                    )
                };
            case '눈오는날':
                return {
                    title: '바깥은 포슬한 눈,\n따뜻한 곳에서',
                    mobileTitle: '바깥은 포슬한 눈,\n따뜻한 곳에서',
                    image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=600',
                    icon: (
                        <svg className="w-7 h-7 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v18m9-9H3m14.828-5.828L6.172 17.828m0-11.656l11.656 11.656" />
                        </svg>
                    )
                };
            case '겨울':
                return {
                    title: '시린 겨울날,\n벽난로 옆에서 도란도란',
                    mobileTitle: '시린 겨울날,\n벽난로 옆에서 도란도란',
                    image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=600',
                    icon: (
                        <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9" />
                        </svg>
                    )
                };
            default:
                return {
                    title: '오늘 날씨,\n머물기 좋은 특별한 공간',
                    mobileTitle: '오늘 날씨,\n머물기 좋은 특별한 공간',
                    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=600',
                    icon: (
                        <svg className="w-7 h-7 text-[#4E5968]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                    )
                };
        }
    }, [activeThemeName]);

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

    return (
        <div style={{ display: hidden ? 'none' : 'flex' }} className="w-full h-full flex flex-col lg:flex-row overflow-hidden">
            {/* 스크롤 가능한 메인 피드 */}
            <div className="flex-1 w-full lg:max-w-[720px] h-full overflow-y-auto no-scrollbar flex flex-col bg-[#F9FAFB] animate-fade-in relative lg:border-r lg:border-[#F2F4F6]">

                {/* 헤더 (모바일/PC) */}
                <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-xl px-6 py-4 lg:px-10 lg:py-8 flex items-center justify-between border-b lg:border-b border-[#F2F4F6]/50">
                    <div className="flex items-center gap-3">
                        <h1 className="lg:hidden font-logo font-extrabold text-[28px] tracking-tight text-[#191F28]">Pick<span className="text-orange-500 text-[1em] font-logo">Pl</span></h1>
                        <h1 className="hidden lg:block font-bold text-[28px] tracking-tight text-[#191F28]">발견</h1>
                        
                        {/* 위치 칩 */}
                        <div 
                            onClick={handleLocationToggle}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] cursor-pointer transition-all border select-none active:scale-95 ${
                                locationStore.permissionStatus === 'granted' 
                                ? 'bg-orange-50 text-orange-600 border-orange-100' 
                                : 'bg-[#F2F4F6] text-[#4E5968] border-transparent hover:bg-[#E5E8EB]'
                            }`}
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-[12px] font-bold">{getLocationLabel()}</span>
                        </div>
                    </div>
                    {/* 모바일에서만 보이는 탐색 버튼 */}
                    <button onClick={() => onViewChange('explore')} className="lg:hidden w-10 h-10 bg-[#F2F4F6] rounded-full flex items-center justify-center hover:bg-[#E5E8EB] transition-colors">
                        <svg className="w-5 h-5 text-[#4E5968]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </button>
                </header>

                {/* 모바일 전용 상단 큐레이션 배너 */}
                <div className="lg:hidden px-6 pt-2 pb-4">
                    <div onClick={() => onViewChange('curation')} className="bg-[#F9FAFB] rounded-[24px] p-5 flex items-center justify-between border border-[#F2F4F6] shadow-[0_4px_20px_rgba(0,0,0,0.02)] cursor-pointer active:scale-[0.98] transition-transform">
                        <div>
                            <p className="text-orange-500 text-[13px] font-bold mb-1 tracking-tight">이번 주 큐레이션</p>
                            <h2 className="text-[#191F28] text-[18px] font-bold leading-snug whitespace-pre-line">{bannerInfo.mobileTitle}</h2>
                        </div>
                        <div className="w-[52px] h-[52px] bg-white rounded-full flex items-center justify-center shadow-sm">
                            {bannerInfo.icon}
                        </div>
                    </div>
                </div>

                {/* 필터 바 */}
                <div className="sticky top-[72px] lg:top-[93px] z-10 bg-white/95 backdrop-blur-md pt-2 lg:pt-4 pb-3 lg:pb-5 mb-2 border-b border-[#F2F4F6]/50">
                    <DraggableScroll className="px-6 lg:px-10 flex gap-2 overflow-x-auto no-scrollbar whitespace-nowrap items-center">
                        <button 
                            onClick={() => onTagSelect?.('')} 
                            className={`px-5 py-2.5 rounded-[14px] text-[14px] font-bold shadow-sm shrink-0 transition-colors ${!activeTag ? 'bg-[#191F28] text-white' : 'bg-[#F2F4F6] text-[#4E5968] hover:bg-[#E5E8EB]'}`}
                        >
                            추천 무드
                        </button>
                        <button onClick={() => onViewChange('explore')} className="px-5 py-2.5 rounded-[14px] bg-orange-50 text-orange-600 border border-orange-100 text-[14px] font-bold shrink-0 flex items-center gap-1.5 hover:bg-orange-100 transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                            </svg>
                            세밀하게 탐색하기
                        </button>
                        {(popularTags || []).map((t: any) => {
                            const isSelected = activeTag === t.tagName;
                            const dotColor = t.tagType === 'TREND' ? 'bg-[#FF5B35]'
                                           : t.tagType === 'RISING' ? 'bg-[#10B981]'
                                           : 'bg-[#6366F1]';
                            return (
                                <button 
                                    key={t.ranking}
                                    onClick={() => onTagSelect?.(t.tagName)}
                                    className={`px-4.5 py-2.5 rounded-[14px] text-[13.5px] font-bold shrink-0 active:scale-95 transition-all flex items-center gap-1.5 ${isSelected ? 'bg-orange-500 text-white shadow-sm border border-orange-500' : 'bg-[#F2F4F6] text-[#4E5968] hover:bg-[#E5E8EB]'}`}
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors duration-200 ${isSelected ? 'bg-white' : dotColor}`} />
                                    #{t.tagName}
                                </button>
                            );
                        })}
                        <div className="w-2 lg:w-4 shrink-0"></div>
                    </DraggableScroll>
                </div>

                {/* 피드 목록 */}
                <div className="px-5 lg:px-10 py-2 lg:py-6 pb-[100px] lg:pb-24 flex-1">
                    <div className="flex flex-col gap-6 lg:gap-10">
                        {placesData.length === 0 ? (
                            (isLoggedIn || isValidating) ? (
                                <div className="flex flex-col gap-6 lg:gap-10 py-2 animate-pulse">
                                    {[1, 2].map((i) => (
                                        <div 
                                            key={i} 
                                            className="bg-white border border-[#E5E8EB]/70 rounded-[28px] lg:rounded-[32px] p-5 lg:p-6 flex flex-col gap-4"
                                        >
                                            {/* 헤더 스켈레톤 */}
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-[#F2F4F6] border border-[#F2F4F6] shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="w-[130px] h-[16px] bg-[#E5E8EB] rounded-[4px]" />
                                                    <div className="w-[90px] h-[12px] bg-[#F2F4F6] rounded-[3px] mt-1.5" />
                                                </div>
                                                <div className="w-9 h-9 rounded-full bg-[#F2F4F6] shrink-0" />
                                            </div>

                                            {/* 이미지 스켈레톤 */}
                                            <div className="w-full aspect-[4/3] rounded-[20px] lg:rounded-[24px] bg-[#F2F4F6]" />

                                            {/* 바디 스켈레톤 */}
                                            <div className="flex flex-col gap-2.5">
                                                <div className="w-[190px] h-[15px] bg-[#E5E8EB] rounded-[4px]" />
                                                <div className="w-full h-[13.5px] bg-[#F2F4F6] rounded-[3px] mt-1" />
                                                <div className="w-[85%] h-[13.5px] bg-[#F2F4F6] rounded-[3px] mt-1" />
                                                <div className="flex gap-1.5 mt-2">
                                                    <div className="w-[62px] h-[22px] bg-[#F2F4F6] rounded-[8px]" />
                                                    <div className="w-[74px] h-[22px] bg-[#F2F4F6] rounded-[8px]" />
                                                    <div className="w-[58px] h-[22px] bg-[#F2F4F6] rounded-[8px]" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 text-[#8B95A1]">
                                    데이터가 없습니다. 백엔드를 확인해주세요.
                                </div>
                            )
                        ) : placesData.map((place: any) => {
                            const iconData = getCategoryIcon(place.category || place.features?.[0]?.desc || '', place.name);
                            return (
                                <article 
                                    key={place.id} 
                                    onClick={() => onPlaceClick(place)} 
                                    className="group cursor-pointer active:scale-[0.99] lg:active:scale-100 transition-all duration-300 relative bg-white border border-[#E5E8EB] shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.05)] rounded-[28px] lg:rounded-[32px] p-5 lg:p-6 flex flex-col gap-4"
                                >
                                    {/* 카드 헤더 */}
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-[#F2F4F6] shadow-sm ${iconData.bg} ${iconData.text}`}>
                                            {iconData.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-[16px] text-[#191F28] tracking-tight truncate group-hover:text-orange-500 transition-colors">{place.name}</h3>
                                            <p className="text-[12px] font-semibold text-[#8B95A1] mt-0.5 truncate">
                                                {place.location ? place.location.split(' ').slice(0, 2).join(' ') : '서울'}
                                                {place.distance ? ` · ${place.distance}` : ''}
                                            </p>
                                        </div>
                                        <button 
                                            onClick={(e) => onCardSaveClick(place, e)}
                                            className="w-9 h-9 rounded-full bg-[#F2F4F6] hover:bg-[#E5E8EB] active:scale-90 transition-all flex items-center justify-center text-[#8B95A1] hover:text-orange-500 shrink-0"
                                        >
                                            <svg className={`w-[18px] h-[18px] ${place.isScrapped ? 'text-orange-500 fill-current' : 'text-[#8B95A1]'}`} fill={place.isScrapped ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                            </svg>
                                        </button>
                                    </div>

                                    {/* 카드 이미지 */}
                                    <div className="relative w-full aspect-[4/3] rounded-[20px] lg:rounded-[24px] overflow-hidden bg-[#F2F4F6] shadow-inner">
                                        <img 
                                            src={place.imageUrl} 
                                            alt={place.name} 
                                            className="w-full h-full object-cover lg:group-hover:scale-[1.02] transition-transform duration-700" 
                                            loading="lazy" 
                                        />
                                        {place.isHiddenGem && (
                                            <div className="absolute top-3 right-3 bg-blue-500/90 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-[8px] shadow-md flex items-center gap-1 border border-white/20">
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                                </svg>
                                                Secret
                                            </div>
                                        )}
                                    </div>

                                    {/* 카드 바디 */}
                                    <div className="flex flex-col gap-2">
                                        {(() => {
                                            const desc = place.description || '';
                                            const hasPipe = desc.includes('|');
                                            if (hasPipe) {
                                                const parts = desc.split('|');
                                                const headline = parts[0].trim();
                                                const summary = parts[1].trim();
                                                return (
                                                    <>
                                                        <h4 className="text-[14.5px] font-extrabold text-[#E65C00] tracking-tight leading-snug">
                                                            {headline}
                                                        </h4>
                                                        <p className="text-[13.5px] text-[#4E5968] leading-relaxed font-semibold line-clamp-2">
                                                            {summary}
                                                        </p>
                                                    </>
                                                );
                                            }
                                            return (
                                                <p className="text-[14px] text-[#4E5968] leading-relaxed font-medium line-clamp-2">
                                                    {place.description}
                                                </p>
                                            );
                                        })()}
                                        <div className="flex flex-wrap gap-1.5 mt-0.5">
                                            {(() => {
                                                const displayTags = (place.tagInfos || []).filter((tag: any) => {
                                                    const isCafe = place.category && (place.category.includes('카페') || place.category.includes('디저트'));
                                                    if (!isCafe && tag.type === 'FACILITY') {
                                                        return false;
                                                    }
                                                    return true;
                                                });
                                                return displayTags.map((tag: any) => (
                                                    <span key={tag.name} className="px-2.5 py-1 rounded-[8px] bg-[#F2F4F6] text-[#4E5968] text-[12px] font-bold tracking-tight">
                                                        #{tag.name}
                                                    </span>
                                                ));
                                            })()}
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                        {placesData.length > 0 && (
                            <InfiniteScrollTrigger 
                                onLoadMore={loadMore} 
                                hasMore={hasMore} 
                                isLoadingMore={isLoadingMore} 
                                isValidating={isValidating}
                            />
                        )}
                    </div>
                </div>
            </div>
 
            {/* [PC 전용 우측] 고정 위젯 패널 */}
            <div className="hidden lg:flex w-[440px] shrink-0 h-full overflow-y-auto no-scrollbar flex-col p-8 bg-[#F9FAFB] animate-fade-in">
                {/* 추천 배너 위젯 */}
                <div onClick={() => onViewChange('curation')} className="bg-white rounded-[28px] p-6 shadow-sm border border-[#F2F4F6] cursor-pointer hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all group mb-8">
                    <p className="text-orange-500 text-[13px] font-bold mb-1.5 tracking-tight">이번 주 PickPl 큐레이션</p>
                    <h2 className="text-[#191F28] text-[20px] font-bold leading-snug mb-5 whitespace-pre-line">{bannerInfo.title}</h2>
                    <div className="w-full h-36 rounded-[16px] overflow-hidden bg-[#F2F4F6]">
                        <img src={bannerInfo.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="큐레이션 이미지" />
                    </div>
                </div>

                {/* 실시간 인기 무드 위젯 — 3카드 분리 */}
                {(() => {
                    const allTags = popularTags && popularTags.length > 0
                        ? popularTags
                        : [
                              { ranking: 1, tagName: '비오는날',      tagType: 'TREND',  detailValue: '+23' },
                              { ranking: 2, tagName: '드라이브코스',   tagType: 'TREND',  detailValue: '+18' },
                              { ranking: 3, tagName: '오션뷰',        tagType: 'TREND',  detailValue: '+14' },
                              { ranking: 4, tagName: '소품샵투어',     tagType: 'RISING', detailValue: null },
                              { ranking: 5, tagName: '야간산책',       tagType: 'RISING', detailValue: null },
                              { ranking: 6, tagName: '러닝코스',       tagType: 'RISING', detailValue: null },
                              { ranking: 7, tagName: '대형카페',       tagType: 'STEADY', detailValue: null },
                              { ranking: 8, tagName: '데이트코스',     tagType: 'STEADY', detailValue: null },
                              { ranking: 9, tagName: '작업하기좋은',   tagType: 'STEADY', detailValue: null },
                          ];
                    const hotTags    = allTags.filter((t: any) => t.tagType === 'TREND');
                    const risingTags = allTags.filter((t: any) => t.tagType === 'RISING');
                    const steadyTags = allTags.filter((t: any) => t.tagType === 'STEADY');

                    const sectionCard = (
                        label: string,
                        icon: React.ReactNode,
                        tags: any[],
                        showDetail: boolean
                    ) => (
                        <div className="bg-white rounded-[24px] p-6 border border-[#E5E8EB] shadow-[0_4px_20px_rgba(0,0,0,0.015)] mb-5 hover:shadow-[0_8px_30px_rgba(0,0,0,0.03)] transition-all duration-300">
                            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#F2F4F6]">
                                <div className="flex items-center gap-2.5">
                                    {icon}
                                    <span className="font-bold text-[14.5px] text-[#191F28] tracking-tight">{label}</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-3.5">
                                {tags.map((tag: any, i: number) => (
                                    <div
                                        key={tag.tagName}
                                        className="flex items-center justify-between cursor-pointer group active:scale-[0.98] transition-transform"
                                        onClick={() => onTagSelect?.(tag.tagName)}
                                    >
                                        <div className="flex items-center gap-3.5">
                                            <span className={`font-extrabold text-[13px] w-5 text-center ${i < 3 ? 'text-orange-500' : 'text-[#B0B8C1]'}`}>
                                                {i + 1}
                                            </span>
                                            <span className="font-semibold text-[14.5px] text-[#4E5968] group-hover:text-orange-500 group-hover:translate-x-1 transition-all duration-200">
                                                #{tag.tagName}
                                            </span>
                                        </div>
                                        {showDetail && tag.detailValue && (
                                            <span className="text-[11px] font-extrabold text-[#FF5B35] bg-[#FF5B35]/5 px-2 py-0.5 rounded-[8px] tabular-nums border border-[#FF5B35]/10">
                                                {tag.detailValue}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );

                    return (
                        <>
                            {hotTags.length > 0 && sectionCard(
                                '지금 뜨는 태그',
                                <svg className="w-[18px] h-[18px] text-[#FF5B35]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                                </svg>,
                                hotTags,
                                true
                            )}
                            {risingTags.length > 0 && sectionCard(
                                '새롭게 떠오르는 태그',
                                <svg className="w-[18px] h-[18px] text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>,
                                risingTags,
                                false
                            )}
                            {steadyTags.length > 0 && sectionCard(
                                '꾸준히 인기 있는 태그',
                                <svg className="w-[18px] h-[18px] text-[#6366F1]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>,
                                steadyTags,
                                false
                            )}
                        </>
                    );
                })()}

                <div className="mt-auto pt-8 pb-4 text-[#8B95A1] text-[13px] font-medium leading-relaxed px-2">
                    <p>PickPl © 2026</p>
                    <p className="mt-1 flex gap-4">
                        <span onClick={() => onShowTermsModal('terms')} className="cursor-pointer hover:underline">이용약관</span>
                        <span onClick={() => onShowTermsModal('privacy')} className="cursor-pointer hover:underline font-bold text-[#4E5968]">개인정보처리방침</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
