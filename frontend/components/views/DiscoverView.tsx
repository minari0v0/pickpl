import React from 'react';
import DraggableScroll from '../ui/DraggableScroll';
import { getCategoryIcon } from '../ui/Helpers';

interface DiscoverViewProps {
    hidden: boolean;
    placesData: any[];
    onPlaceClick: (place: any) => void;
    onCardSaveClick: (place: any, e: React.MouseEvent) => void;
    onViewChange: (view: string) => void;
    onShowTermsModal: (type: 'terms' | 'privacy' | null) => void;
}

export default function DiscoverView({
    hidden,
    placesData,
    onPlaceClick,
    onCardSaveClick,
    onViewChange,
    onShowTermsModal
}: DiscoverViewProps) {
    return (
        <div style={{ display: hidden ? 'none' : 'flex' }} className="w-full h-full flex flex-col lg:flex-row overflow-hidden">
            {/* 스크롤 가능한 메인 피드 */}
            <div className="flex-1 w-full lg:max-w-[720px] h-full overflow-y-auto no-scrollbar flex flex-col bg-[#F9FAFB] animate-fade-in relative lg:border-r lg:border-[#F2F4F6]">

                {/* 헤더 (모바일/PC) */}
                <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-xl px-6 py-4 lg:px-10 lg:py-8 flex items-center justify-between border-b lg:border-b border-[#F2F4F6]/50">
                    <h1 className="lg:hidden font-logo font-extrabold text-[28px] tracking-tight text-[#191F28]">Pick<span className="text-orange-500 text-[1em] font-logo">Pl</span></h1>
                    <h1 className="hidden lg:block font-bold text-[28px] tracking-tight text-[#191F28]">발견</h1>
                    {/* 모바일에서만 보이는 탐색 버튼 */}
                    <button onClick={() => onViewChange('explore')} className="lg:hidden w-10 h-10 bg-[#F2F4F6] rounded-full flex items-center justify-center hover:bg-[#E5E8EB] transition-colors">
                        <svg className="w-5 h-5 text-[#4E5968]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </button>
                </header>

                {/* 모바일 전용 상단 큐레이션 배너 */}
                <div className="lg:hidden px-6 pt-2 pb-4">
                    <div className="bg-[#F9FAFB] rounded-[24px] p-5 flex items-center justify-between border border-[#F2F4F6] shadow-[0_4px_20px_rgba(0,0,0,0.02)] cursor-pointer active:scale-[0.98] transition-transform">
                        <div>
                            <p className="text-orange-500 text-[13px] font-bold mb-1 tracking-tight">이번 주 큐레이션</p>
                            <h2 className="text-[#191F28] text-[18px] font-bold leading-snug">비 오는 날,<br />창밖을 보기 좋은 카페</h2>
                        </div>
                        <div className="w-[52px] h-[52px] bg-white rounded-full flex items-center justify-center shadow-sm">
                            <svg className="w-7 h-7 text-[#4E5968]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* 필터 바 */}
                <div className="sticky top-[72px] lg:top-[93px] z-10 bg-white/95 backdrop-blur-md pt-2 lg:pt-4 pb-3 lg:pb-5 mb-2 border-b border-[#F2F4F6]/50">
                    <DraggableScroll className="px-6 lg:px-10 flex gap-2 overflow-x-auto no-scrollbar whitespace-nowrap items-center">
                        <button className="px-5 py-2.5 rounded-[14px] bg-[#191F28] text-white text-[14px] font-bold shadow-sm shrink-0">추천 무드</button>
                        <button onClick={() => onViewChange('explore')} className="px-5 py-2.5 rounded-[14px] bg-orange-50 text-orange-600 border border-orange-100 text-[14px] font-bold shrink-0 flex items-center gap-1.5 hover:bg-orange-100 transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                            </svg>
                            세밀하게 탐색하기
                        </button>
                        <button className="px-5 py-2.5 rounded-[14px] bg-[#F2F4F6] text-[#4E5968] text-[14px] font-semibold shrink-0 hover:bg-[#E5E8EB]">#햇살맛집</button>
                        <button className="px-5 py-2.5 rounded-[14px] bg-[#F2F4F6] text-[#4E5968] text-[14px] font-semibold shrink-0 hover:bg-[#E5E8EB]">#뷰맛집</button>
                        <div className="w-2 lg:w-4 shrink-0"></div>
                    </DraggableScroll>
                </div>

                {/* 피드 목록 */}
                <div className="px-5 lg:px-10 py-2 lg:py-6 pb-[100px] lg:pb-24 flex-1">
                    <div className="flex flex-col gap-6 lg:gap-10">
                        {placesData.length === 0 ? (
                            <div className="text-center py-20 text-[#8B95A1]">
                                데이터가 없습니다. 백엔드를 확인해주세요.
                            </div>
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
                                                {place.location ? place.location.split(' ').slice(0, 2).join(' ') : '서울'} · {place.distance}
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
                                    <div className="flex flex-col gap-2.5">
                                        <p className="text-[14px] text-[#4E5968] leading-relaxed font-medium line-clamp-2">
                                            {place.description}
                                        </p>
                                        <div className="flex flex-wrap gap-1.5 mt-0.5">
                                            {place.tags.map((tag: string) => (
                                                <span key={tag} className="px-2.5 py-1 rounded-[8px] bg-[#F2F4F6] text-[#4E5968] text-[12px] font-bold tracking-tight">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* [PC 전용 우측] 고정 위젯 패널 */}
            <div className="hidden lg:flex w-[440px] shrink-0 h-full overflow-y-auto no-scrollbar flex-col p-8 bg-[#F9FAFB] animate-fade-in">
                {/* 추천 배너 위젯 */}
                <div className="bg-white rounded-[28px] p-6 shadow-sm border border-[#F2F4F6] cursor-pointer hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all group mb-8">
                    <p className="text-orange-500 text-[13px] font-bold mb-1.5 tracking-tight">이번 주 PickPl 큐레이션</p>
                    <h2 className="text-[#191F28] text-[20px] font-bold leading-snug mb-5">비 오는 날,<br />창밖을 보며 멍때리기</h2>
                    <div className="w-full h-36 rounded-[16px] overflow-hidden bg-[#F2F4F6]">
                        <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=400" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="" />
                    </div>
                </div>

                {/* 실시간 랭킹 위젯 */}
                <div className="bg-white rounded-[28px] p-7 shadow-sm border border-[#F2F4F6]">
                    <h3 className="font-bold text-[18px] text-[#191F28] mb-6 tracking-tight">실시간 인기 무드 🔥</h3>
                    <div className="flex flex-col gap-6">
                        {[{ rank: 1, name: '코지한', up: true }, { rank: 2, name: '햇살맛집', up: true }, { rank: 3, name: '노트북하기좋은', up: false }, { rank: 4, name: '힙한/인더스트리얼', up: true }, { rank: 5, name: '조용한', up: false }].map((tag: any) => (
                            <div key={tag.rank} className="flex items-center justify-between cursor-pointer group">
                                <div className="flex items-center gap-4">
                                    <span className={`font-bold text-[16px] w-4 text-center ${tag.rank <= 3 ? 'text-orange-500' : 'text-[#8B95A1]'}`}>{tag.rank}</span>
                                    <span className="font-semibold text-[15px] text-[#4E5968] group-hover:text-[#191F28] transition-colors">#{tag.name}</span>
                                </div>
                                <span className={`text-[12px] font-bold ${tag.up ? 'text-red-500' : 'text-blue-500'}`}>{tag.up ? '▲' : '▼'}</span>
                            </div>
                        ))}
                    </div>
                </div>

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
