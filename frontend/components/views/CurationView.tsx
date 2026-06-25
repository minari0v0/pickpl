"use client";

import React, { useMemo } from 'react';
import { useLocationStore } from '../../store/locationStore';
import { getCategoryIcon, mapPlaceToData } from '../ui/Helpers';

interface CurationViewProps {
    hidden: boolean;
    onPlaceClick: (place: any) => void;
    onCardSaveClick: (place: any, e: React.MouseEvent) => void;
    onViewChange: (view: string) => void;
    isLoggedIn: boolean;
    curationData: any;
    isValidating: boolean;
}

export default function CurationView({
    hidden,
    onPlaceClick,
    onCardSaveClick,
    onViewChange,
    isLoggedIn,
    curationData,
    isValidating
}: CurationViewProps) {
    const locationStore = useLocationStore();

    const placesData = useMemo(() => {
        if (!curationData || !curationData.places) return [];
        const prefix = locationStore.permissionStatus === 'granted' 
            ? '내 위치에서' 
            : locationStore.fallbackPlace === 'seongsu' ? '성수역에서' : '강남역에서';

        return curationData.places.map((place: any) => {
            const mapped = mapPlaceToData(place);
            if (place.distance) {
                mapped.distance = `${prefix} ${place.distance}`;
            } else {
                mapped.distance = null;
            }
            return mapped;
        });
    }, [curationData, locationStore.permissionStatus, locationStore.fallbackPlace]);

    // 1. 테마별 프론트엔드 맞춤 타이틀 매핑
    const displayThemeTitle = useMemo(() => {
        const theme = curationData?.activeThemeName;
        switch (theme) {
            case '비오는날':
                return '비 오는 날의 아늑한 실내 데이트';
            case '눈오는날':
                return '따뜻한 겨울 온천 & 연말 감성 모임';
            case '봄':
                return '봄꽃 피크닉 & 감성 스냅';
            case '여름':
                return '여름 바캉스 & 자연 힐링';
            case '가을':
                return '싱그러운 가을 단풍 & 사색의 숲';
            case '겨울':
                return '따뜻한 겨울 온천 & 연말 감성 모임';
            default:
                return curationData?.activeThemeTitle || '오늘의 날씨와 어울리는 추천 공간';
        }
    }, [curationData?.activeThemeName, curationData?.activeThemeTitle]);

    // 2. 테마별 백엔드 큐레이션 네임 기준 그라디언트 색상 분기 (Tailwind 컴파일 가능 리터럴 구조)
    const themeBgClass = useMemo(() => {
        const theme = curationData?.activeThemeName;
        switch (theme) {
            case '비오는날':
                return 'bg-gradient-to-br from-slate-700 via-indigo-950 to-slate-900';
            case '눈오는날':
                return 'bg-gradient-to-br from-blue-500 via-sky-400 to-indigo-600';
            case '봄':
                return 'bg-gradient-to-br from-rose-400 via-pink-400 to-amber-300';
            case '여름':
                return 'bg-gradient-to-br from-teal-400 via-emerald-500 to-cyan-600';
            case '가을':
                return 'bg-gradient-to-br from-amber-700 via-orange-600 to-stone-700';
            case '겨울':
                return 'bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-800';
            default:
                return 'bg-gradient-to-br from-orange-500 to-rose-500';
        }
    }, [curationData?.activeThemeName]);

    // 3. 테마별 친숙한 어투(토스/네이버지도 절충형)의 픽플 추천 메시지
    const themeDescription = useMemo(() => {
        const theme = curationData?.activeThemeName;
        switch (theme) {
            case '비오는날':
                return '빗소리를 배경 음악 삼아 책을 읽거나 도란도란 이야기 나누기 좋은 곳들이에요. 픽플 크루가 직접 비 오는 날 가보고, 습하지 않고 쾌적한 실내 좌석과 넓은 창가 뷰를 갖춘 공간들만 신중히 골랐어요.';
            case '눈오는날':
                return '창밖으로 하얗게 소복소복 쌓이는 눈을 감상하며 따뜻한 시그니처 핫초코 한 잔 어때요? 찬 바람 걱정 없이 머무를 수 있도록 온기가 가득하고 아늑한 조명이 감도는 겨울 아지트들입니다.';
            case '봄':
                return '싱그러운 봄 햇살과 살랑이는 바람이 기분 좋은 날이에요. 무겁지 않고 화사한 인테리어에, 야외 공기를 가득 느낄 수 있는 테라스와 채광 좋은 창가 자리가 돋보이는 픽플 엄선 스팟입니다.';
            case '여름':
                return '무더운 더위에 지친 하루, 쾌적하고 시원한 아이스 아메리카노 한 잔이 생각나는 공간들이에요. 냉방이 고루 잘 미치고 좌석 간격이 넓어 여유롭게 쉴 수 있는 도심 속 오아시스를 모았어요.';
            case '가을':
                return '바스락거리는 낙엽 소리와 노랗게 물든 골목길 감성이 어우러지는 날이에요. 잔잔한 재즈 음악이 흐르고 콘센트와 테이블이 편안해, 사색을 즐기거나 나만의 개인 작업에 집중하기 좋은 곳들이에요.';
            case '겨울':
                return '살을 에는 찬 바람에 몸이 웅크러드는 계절이에요. 벽난로 같은 따뜻한 인테리어와 보들보들한 담요가 준비된, 소중한 사람과 도란도란 깊은 대화를 나누기 좋은 아늑한 은신처들을 소개할게요.';
            default:
                return '오늘 하루 당신이 머무는 시간이 한층 더 기억에 남도록, 픽플 크루들이 공간의 크기, 조도, 온도까지 고려해 정성스레 선별한 분위기 맛집 리스트를 구경해보세요.';
        }
    }, [curationData?.activeThemeName]);

    // 4. 테마별 가이드 추천 무드 태그 목록
    const themeGuideTags = useMemo(() => {
        const theme = curationData?.activeThemeName;
        switch (theme) {
            case '비오는날':
                return ['#빗소리맛집', '#창가자리', '#아늑한실내', '#따뜻한라떼'];
            case '눈오는날':
                return ['#눈멍가능', '#난방빵빵', '#포근한조명', '#스위트초코'];
            case '봄':
                return ['#햇살맛집', '#테라스카페', '#식물인테리어', '#봄바람솔솔'];
            case '여름':
                return ['#에어컨빵빵', '#청량한에이드', '#넓은인터벌', '#주차편리'];
            case '가을':
                return ['#가을단풍', '#콘센트넉넉', '#작업하기좋은', '#잔잔한재즈'];
            case '겨울':
                return ['#포근한담요', '#벽난로감성', '#조용한대화', '#뱅쇼맛집'];
            default:
                return ['#픽플검증', '#감성인테리어', '#취향저격', '#편안한소파'];
        }
    }, [curationData?.activeThemeName]);

    // 5. 테마별 친근하고 실용적인 방문 가이드 팁 3가지
    const themeGuideTips = useMemo(() => {
        const theme = curationData?.activeThemeName;
        switch (theme) {
            case '비오는날':
                return [
                    '우산 보관함과 개인 짐을 둘 수 있는 보관 공간이 잘 되어 있어 쾌적해요.',
                    '비 오는 풍경이 가장 잘 보이는 창가 소파석이나 1인석 선점을 추천해 드려요.',
                    '습도가 높은 날에도 에어컨과 내부 환기 시스템이 잘 가동되어 보송보송해요.'
                ];
            case '눈오는날':
                return [
                    '문가보다는 안쪽 소파석이나 벽면 자리가 찬 바람이 들이치지 않아 더 따뜻해요.',
                    '몸을 사르르 녹여줄 진한 수제 핫초코나 따뜻한 시나몬 티가 이 공간의 인기 메뉴예요.',
                    '외투를 걸어둘 수 있는 행거가 구비되어 있어 두꺼운 옷도 편하게 보관할 수 있어요.'
                ];
            case '봄':
                return [
                    '오후 2시부터 4시 사이에 햇살 채광이 가장 깊게 들어와 인생 사진을 남기기 좋아요.',
                    '식물이 가득한 플랜테리어 공간으로, 가벼운 책 한 권 들고 혼자 방문해도 참 편안해요.',
                    '테라스석은 일교차가 있을 수 있으니 가벼운 숄이나 겉옷을 챙기시면 더욱 좋아요.'
                ];
            case '여름':
                return [
                    '주차 공간이 지원되거나 대중교통 역과 가까워 뙤약볕을 최소한으로 걷고 도착할 수 있어요.',
                    '갈증을 시원하게 해소해 줄 생과일 에이드나 시그니처 콜드브루가 아주 훌륭해요.',
                    '에어컨 바람이 직접 오지 않는 안쪽 자리나 개방감 있는 통창 안쪽이 명당이에요.'
                ];
            case '가을':
                return [
                    '대부분의 좌석에 콘센트가 잘 구비되어 있어 노트북 작업이나 공부하기 편해요.',
                    '단풍이 예쁘게 물든 골목길이나 정원이 잘 보이는 창가 쪽을 선점해보세요.',
                    '사장님이 직접 볶은 드립 커피와 쌉싸름한 가을 분위기가 아주 조화롭습니다.'
                ];
            case '겨울':
                return [
                    '손님들을 위한 무료 대여 담요와 핫팩이 구비되어 있어 세심한 배려가 느껴져요.',
                    '겨울 시즌 한정으로 판매하는 따뜻한 뱅쇼나 라떼 종류가 추위를 싹 녹여줄 거예요.',
                    '좌석 간격이 아늑하게 배치되어 있어 프라이빗하고 조용한 대화를 나누기에 완벽해요.'
                ];
            default:
                return [
                    '장소의 정확한 위치와 실제 유저들의 리얼한 리뷰 정보를 한눈에 볼 수 있어요.',
                    '마음에 든 장소가 있다면 화면에서 바로 저장해 나만의 방문 리스트를 완성해 보세요.',
                    '각 장소마다 시그니처 메뉴가 있으니 방문 전 디테일 뷰를 꼭 확인해보시길 추천해요.'
                ];
        }
    }, [curationData?.activeThemeName]);

    return (
        <div style={{ display: hidden ? 'none' : 'flex' }} className="w-full h-full flex flex-col lg:flex-row overflow-hidden">
            {/* 스크롤 피드 */}
            <div className="flex-1 w-full lg:max-w-[720px] h-full overflow-y-auto no-scrollbar flex flex-col bg-[#F9FAFB] animate-fade-in relative lg:border-r lg:border-[#F2F4F6]">
                
                {/* 헤더 브랜딩 개선 (사용자 요구사항 반영: 픽플 - 큐레이션 타이틀화) */}
                <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-xl px-6 py-4 lg:px-10 lg:py-8 flex items-center gap-4 border-b border-[#F2F4F6]/50">
                    <button 
                        onClick={() => onViewChange('home')}
                        className="p-2 text-[#4E5968] hover:text-[#191F28] hover:bg-[#F2F4F6] rounded-full transition-colors active:scale-95"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="font-bold text-[20px] lg:text-[22px] text-[#191F28] tracking-tight">
                            픽플 - 큐레이션
                        </h1>
                    </div>
                </header>

                {/* 테마 헤드라인 소개 배너 (그라디언트 동적 분기 및 어투 교정) */}
                <div className="px-6 lg:px-10 pt-6">
                    <div className={`${themeBgClass} rounded-[28px] p-6 lg:p-8 text-white shadow-md relative overflow-hidden transition-all duration-500`}>
                        <div className="relative z-10">
                            <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold border border-white/10 uppercase tracking-wider">Curation Team Pick</span>
                            <h2 className="text-[22px] lg:text-[26px] font-extrabold leading-snug mt-4 mb-2.5">
                                {displayThemeTitle}
                            </h2>
                            <p className="text-[13px] lg:text-[13.5px] text-white/90 font-medium leading-relaxed max-w-[500px]">
                                {themeDescription}
                            </p>
                        </div>
                        {/* 물방울/구름/눈송이 데코 레이어 */}
                        <div className="absolute right-[-10px] bottom-[-20px] opacity-15 text-white pointer-events-none select-none">
                            <svg className="w-44 h-44" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* 피드 목록 */}
                <div className="px-5 lg:px-10 py-6 pb-[100px] lg:pb-24 flex-1">
                    <div className="flex flex-col gap-6 lg:gap-10">
                        {isValidating && placesData.length === 0 ? (
                            <div className="text-center py-20 text-[#8B95A1] font-semibold animate-pulse">
                                오늘 날씨에 딱 어울리는, 픽플이 엄선한 장소들을 불러오고 있어요...
                            </div>
                        ) : placesData.length === 0 ? (
                            <div className="text-center py-20 text-[#8B95A1] font-medium">
                                해당 테마의 공개된 공간 데이터가 없습니다. 어드민 패널을 확인해 주세요.
                            </div>
                        ) : (
                            placesData.map((place: any) => {
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
                                                {(place.tagInfos || []).map((tag: any) => (
                                                    <span key={tag.name} className="px-2.5 py-1 rounded-[8px] bg-[#F2F4F6] text-[#4E5968] text-[12px] font-bold tracking-tight">
                                                        #{tag.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </article>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* PC 전용 우측 고부가가치 가이드 패널 위젯 */}
            <div className="hidden lg:flex w-[440px] shrink-0 h-full p-8 bg-[#F9FAFB] animate-fade-in flex-col">
                <div className="bg-white rounded-[28px] p-6 lg:p-7 shadow-sm border border-[#F2F4F6] mb-6 flex flex-col gap-6">
                    <div>
                        <span className="text-[11px] font-bold text-orange-500 tracking-wide uppercase">Curation Guide</span>
                        <h3 className="font-bold text-[18px] text-[#191F28] mt-0.5 tracking-tight">오늘의 추천 Vibe ☕</h3>
                    </div>
                    
                    {/* 가이드 태그 칩스 */}
                    <div className="flex flex-wrap gap-1.5 border-b border-[#F2F4F6] pb-5">
                        {themeGuideTags.map(tag => (
                            <span key={tag} className="px-3 py-1.5 rounded-[10px] bg-[#F2F4F6] text-[#4E5968] text-[12px] font-bold tracking-tight">
                                {tag}
                            </span>
                        ))}
                    </div>

                    {/* 픽플이 드리는 방문 꿀팁 (Toss + 네이버 지도 스타일의 3단 꿀팁 리스트) */}
                    <div className="flex flex-col gap-4">
                        <h4 className="font-bold text-[14px] text-[#191F28] flex items-center gap-1.5">
                            <span className="text-[14px]">💡</span> 픽플이 제안하는 머무는 팁
                        </h4>
                        <div className="flex flex-col gap-3">
                            {themeGuideTips.map((tip, idx) => (
                                <div key={idx} className="flex gap-2.5 items-start">
                                    <span className="text-orange-500 font-bold text-[13px] mt-0.5">{idx + 1}</span>
                                    <p className="text-[13px] text-[#4E5968] leading-relaxed font-semibold">
                                        {tip}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 나만의 폴더 모으기 안내 */}
                    <div className="flex flex-col gap-2 pt-5 border-t border-[#F2F4F6]">
                        <h4 className="font-bold text-[14px] text-[#191F28] flex items-center gap-1.5">
                            <span className="text-[14px]">⭐</span> 마음에 드는 공간 저장하기
                        </h4>
                        <p className="text-[13px] text-[#4E5968] leading-relaxed font-medium">
                            장소 카드의 <strong className="font-extrabold text-[#191F28]">책갈피 버튼</strong>을 누르면 스크랩돼요. 저장된 장소는 컬렉션 탭에서 언제든 편하게 지도와 리스트로 확인할 수 있습니다.
                        </p>
                    </div>
                </div>
                
                <button 
                    onClick={() => onViewChange('home')}
                    className="w-full bg-[#191F28] hover:bg-black text-white font-bold py-4 rounded-[20px] active:scale-[0.98] transition-all text-center text-[15px] shadow-sm mt-auto"
                >
                    메인 홈으로 돌아가기
                </button>
            </div>
        </div>
    );
}
