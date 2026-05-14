import React, { useState, useEffect, useMemo } from 'react';

// --- 1. 태그 카테고리 ---
const TAG_CATEGORIES = [
    { id: 'popular', title: "요즘 뜨는 취향", tags: ["대형카페", "노트북하기좋은", "햇살맛집", "디저트맛집", "뷰맛집", "데이트코스"] },
    { id: 'mood', title: "공간의 무드", tags: ["코지한", "따뜻한우드톤", "힙한/인더스트리얼", "조용한", "미니멀한", "식물가득", "나만아는"] },
    { id: 'facility', title: "목적과 시설", tags: ["콘센트석", "편안한쇼파", "주차편리", "반려동물동반", "루프탑", "단체석"] }
];

// --- 2. 더미 데이터 (베스트 리뷰 포함) ---
const PLACES_DATA = [
    {
        id: 1, name: "어반우드 성수", location: "서울 성동구 성수동", distance: "내 위치에서 800m",
        imageUrl: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=800", aspectRatio: "aspect-[4/5]",
        tags: ["따뜻한우드톤", "노트북하기좋은", "콘센트석", "코지한"],
        isHiddenGem: false,
        initialVibe: { quiet: 85, chatty: 15 },
        description: "성수동 골목에 숨겨진, 따뜻한 나무 향기가 나는 작업하기 좋은 카페입니다. 넉넉한 콘센트와 우드톤 인테리어가 집중력을 높여줍니다.",
        features: [{ icon: "💻", title: "작업하기 편해요", desc: "전 좌석 콘센트 구비" }],
        bestReview: "콘센트가 많아서 눈치 안 보고 노트북 작업하기 너무 편했어요!"
    },
    {
        id: 2, name: "오브제 커피 (Secret)", location: "서울 마포구 연남동", distance: "내 위치에서 2.1km",
        imageUrl: "https://images.unsplash.com/photo-1600607686527-6fb886090705?q=80&w=800", aspectRatio: "aspect-[1/1]",
        tags: ["미니멀한", "디저트맛집", "조용한", "나만아는"],
        isHiddenGem: true,
        initialVibe: { quiet: 45, chatty: 55 },
        description: "미니멀한 인테리어와 예술 작품 같은 디저트가 있는 공간. 골목 깊숙한 곳에 있어 아는 사람만 찾아오는 숨겨진 보석 같은 곳입니다.",
        features: [{ icon: "🍰", title: "숨겨진 보석", desc: "예술 작품 같은 수제 디저트" }],
        bestReview: "골목에 숨어있어 찾기 힘들었지만 까눌레 한 입에 용서되는 맛 ㅠㅠ"
    },
    {
        id: 3, name: "플랜트 서울", location: "서울 용산구 이태원동", distance: "내 위치에서 4.5km",
        imageUrl: "https://images.unsplash.com/photo-1525097487450-52851ed90a1b?q=80&w=800", aspectRatio: "aspect-[3/4]",
        tags: ["식물가득", "반려동물동반", "햇살맛집", "뷰맛집"],
        isHiddenGem: false,
        initialVibe: { quiet: 60, chatty: 40 },
        description: "도심 속 작은 식물원. 신선한 비건 브런치와 함께 햇살이 가득 들어오는 공간에서 그리너리한 휴식을 즐겨보세요.",
        features: [{ icon: "🌿", title: "식물 가득", desc: "쾌적하고 맑은 공기" }],
        bestReview: "채광이 장난 아니에요. 식물들 덕분에 눈이 정화되는 기분🌿"
    },
    {
        id: 4, name: "루프탑 클라우드", location: "서울 강남구 신사동", distance: "내 위치에서 8.0km",
        imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800", aspectRatio: "aspect-[1/1]",
        tags: ["루프탑", "대형카페", "주차편리", "힙한/인더스트리얼", "데이트코스"],
        isHiddenGem: false,
        initialVibe: { quiet: 20, chatty: 80 },
        description: "신사동의 탁 트인 야경을 감상할 수 있는 루프탑 라운지 바. 선선한 저녁에 좋은 사람들과 대화 나누기 완벽한 장소입니다.",
        features: [{ icon: "🌃", title: "멋진 야경", desc: "남산타워가 보이는 뷰" }],
        bestReview: "야경 미쳤습니다.. 선선한 날 데이트 코스로 강추해요!"
    },
    {
        id: 5, name: "오디너리 핏", location: "서울 종로구 서촌", distance: "내 위치에서 11.2km",
        imageUrl: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=800", aspectRatio: "aspect-[4/5]",
        tags: ["조용한", "콘센트석", "편안한쇼파"],
        isHiddenGem: false,
        initialVibe: { quiet: 90, chatty: 10 },
        description: "책과 커피, 그리고 고요함이 있는 서촌의 북카페입니다. 조용히 개인 작업에 몰두하고 싶을 때 추천합니다.",
        features: [{ icon: "🤫", title: "조용한 분위기", desc: "대화보다는 독서와 작업 위주" }],
        bestReview: "음악 소리가 작고 다들 책 읽는 분위기라 집중하기 최상입니다."
    }
];

export default function App() {
    const [activeView, setActiveView] = useState('home');
    const [selectedTags, setSelectedTags] = useState([]);

    const [selectedPlace, setSelectedPlace] = useState(null);
    const [showHiddenGemPopup, setShowHiddenGemPopup] = useState(false);
    const [isPlayingAudio, setIsPlayingAudio] = useState(false);
    const [vibeStats, setVibeStats] = useState({ quiet: 50, chatty: 50 });
    const [userVotedVibe, setUserVotedVibe] = useState(null);
    const [isSaved, setIsSaved] = useState(false);
    const [showSaveAnim, setShowSaveAnim] = useState(false);

    const toggleTag = (tag) => {
        setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
    };

    const filteredPlaces = useMemo(() => {
        if (selectedTags.length === 0) return PLACES_DATA;
        return PLACES_DATA.filter(place => selectedTags.every(st => place.tags.includes(st)));
    }, [selectedTags]);

    const handlePlaceClick = (place) => {
        if (place.isHiddenGem) {
            setShowHiddenGemPopup(true);
            setTimeout(() => {
                setShowHiddenGemPopup(false);
                setSelectedPlace(place);
                setVibeStats(place.initialVibe);
            }, 2500);
        } else {
            setSelectedPlace(place);
            setVibeStats(place.initialVibe);
        }
    };

    const handleCloseDetail = () => {
        setSelectedPlace(null);
        setIsPlayingAudio(false);
        setUserVotedVibe(null);
        setIsSaved(false);
    };

    const handleVibeVote = (type) => {
        if (userVotedVibe === type) return;
        setUserVotedVibe(type);
        setVibeStats(prev => {
            if (type === 'quiet') return { quiet: prev.quiet + 15, chatty: Math.max(0, prev.chatty - 5) };
            return { quiet: Math.max(0, prev.quiet - 5), chatty: prev.chatty + 15 };
        });
    };

    const handleSaveClick = () => {
        setIsSaved(!isSaved);
        if (!isSaved) {
            setShowSaveAnim(true);
            setTimeout(() => setShowSaveAnim(false), 1000);
        }
    };

    const quietPercent = vibeStats.quiet + vibeStats.chatty === 0 ? 50 : Math.round((vibeStats.quiet / (vibeStats.quiet + vibeStats.chatty)) * 100);
    const chattyPercent = 100 - quietPercent;

    return (
        <div className="h-[100dvh] w-full bg-[#F0F2F5] flex justify-center overflow-hidden font-sans text-[#191F28] selection:bg-orange-500/30">

            <style dangerouslySetInnerHTML={{
                __html: `
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
        * { font-family: 'Pretendard', sans-serif; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        @keyframes fade-in { 0% { opacity: 0; } 100% { opacity: 1; } }
        @keyframes scale-up { 0% { transform: scale(0.95); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        .animate-scale-up { animation: scale-up 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        
        @keyframes gem-float { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-12px) rotate(3deg); } }
        @keyframes glow-pulse { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.1); } }
        
        @keyframes sound-wave { 0%, 100% { height: 4px; } 50% { height: 14px; } }
        .wave-bar { width: 3px; background: currentColor; border-radius: 3px; animation: sound-wave 1s ease-in-out infinite; }
        .wave-bar:nth-child(2) { animation-delay: 0.2s; }
        .wave-bar:nth-child(3) { animation-delay: 0.4s; }
        .wave-bar:nth-child(4) { animation-delay: 0.1s; }

        @keyframes fly-to-collection {
          0% { transform: scale(0.5) translate(0, 0); opacity: 0; }
          20% { transform: scale(1.5) translate(0, -30px); opacity: 1; }
          100% { transform: scale(0.2) translate(-200px, 300px); opacity: 0; }
        }
        .animate-fly { animation: fly-to-collection 0.8s cubic-bezier(0.5, 0, 0.2, 1) forwards; pointer-events: none; }
        
        .fade-edges {
          -webkit-mask-image: linear-gradient(to right, transparent, black 20px, black calc(100% - 20px), transparent);
          mask-image: linear-gradient(to right, transparent, black 20px, black calc(100% - 20px), transparent);
        }
      `}} />

            {/* --- 1440px 중앙 정렬 PC 랩퍼 --- */}
            <div className="w-full max-w-[1440px] bg-white h-full relative shadow-2xl flex border-x border-gray-200 overflow-hidden">

                {/* ========================================================
            [기능 1] 시크릿 스팟 전체 오버레이
        ======================================================== */}
                {showHiddenGemPopup && (
                    <div className="absolute inset-0 z-[100] bg-black/85 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in text-white">
                        <div className="relative w-64 h-64 flex items-center justify-center mb-6">
                            <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-[40px] animate-[glow-pulse_2s_ease-in-out_infinite]"></div>
                            <svg viewBox="0 0 100 100" className="w-40 h-40 z-10 drop-shadow-[0_0_30px_rgba(96,165,250,0.6)] animate-[gem-float_3s_ease-in-out_infinite]">
                                <polygon points="50,10 90,40 70,90 30,90 10,40" fill="url(#gemGrad)" stroke="#E0F2FE" strokeWidth="1.5" strokeLinejoin="round" />
                                <polygon points="50,10 50,45 10,40" fill="url(#gemLeft)" opacity="0.9" />
                                <polygon points="50,10 90,40 50,45" fill="url(#gemRight)" opacity="0.9" />
                                <polygon points="10,40 50,45 30,90" fill="url(#gemBottomLeft)" opacity="0.95" />
                                <polygon points="90,40 70,90 50,45" fill="url(#gemBottomRight)" opacity="0.95" />
                                <defs>
                                    <linearGradient id="gemGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#93C5FD" /><stop offset="100%" stopColor="#3B82F6" /></linearGradient>
                                    <linearGradient id="gemLeft" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#EFF6FF" /><stop offset="100%" stopColor="#60A5FA" /></linearGradient>
                                    <linearGradient id="gemRight" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#DBEAFE" /><stop offset="100%" stopColor="#2563EB" /></linearGradient>
                                    <linearGradient id="gemBottomLeft" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#3B82F6" /><stop offset="100%" stopColor="#1E40AF" /></linearGradient>
                                    <linearGradient id="gemBottomRight" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#2563EB" /><stop offset="100%" stopColor="#1E3A8A" /></linearGradient>
                                </defs>
                            </svg>
                        </div>
                        <h2 className="text-[32px] font-bold text-center leading-snug mb-3">나만 아는 특별한 공간을<br /><span className="text-blue-400">발견했어요!</span></h2>
                        <p className="text-[16px] text-gray-300 font-medium">취향 분석을 통해 숨겨진 보석을 찾았습니다.</p>
                    </div>
                )}

                {/* ========================================================
            [좌측] 고정 사이드바
        ======================================================== */}
                <aside className="w-[280px] shrink-0 border-r border-[#F2F4F6] bg-white z-20 h-full flex flex-col py-10 px-8">
                    <div className="flex items-center gap-3 mb-14 cursor-pointer" onClick={() => setActiveView('home')}>
                        <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center shadow-[0_4px_10px_rgba(249,115,22,0.3)]">
                            <span className="text-white font-bold text-xl">P</span>
                        </div>
                        <span className="font-bold text-[24px] tracking-tight text-[#191F28]">PickPl</span>
                    </div>

                    <nav className="flex flex-col gap-2 mb-12">
                        <button onClick={() => setActiveView('home')} className={`flex items-center gap-4 px-5 py-4 rounded-[16px] transition-colors font-bold text-[16px] ${activeView === 'home' ? 'bg-[#F2F4F6] text-[#191F28]' : 'text-[#6B7684] hover:bg-[#F9FAFB] hover:text-[#191F28]'}`}>
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                            홈 · 발견
                        </button>
                        <button onClick={() => setActiveView('explore')} className={`flex items-center gap-4 px-5 py-4 rounded-[16px] transition-colors font-bold text-[16px] ${activeView === 'explore' ? 'bg-[#F2F4F6] text-[#191F28]' : 'text-[#6B7684] hover:bg-[#F9FAFB] hover:text-[#191F28]'}`}>
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            공간 탐색
                        </button>
                        <button className="flex items-center gap-4 px-5 py-4 rounded-[16px] transition-colors font-bold text-[16px] text-[#6B7684] hover:bg-[#F9FAFB] hover:text-[#191F28]">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                            내 컬렉션
                        </button>
                    </nav>

                    <div className="flex-1 overflow-y-auto no-scrollbar">
                        <h3 className="text-[12px] font-bold text-[#8B95A1] tracking-wider mb-5 px-3">빠른 태그 검색</h3>
                        <div className="flex flex-col gap-2">
                            {['#햇살맛집', '#코지한', '#디저트맛집', '#대형카페'].map((tag) => (
                                <button key={tag} className="text-left px-4 py-2.5 rounded-[12px] text-[#4E5968] font-medium text-[15px] hover:bg-[#F9FAFB] hover:text-[#191F28] transition-colors">
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-auto pt-8 border-t border-[#F2F4F6] shrink-0">
                        <button className="flex items-center gap-4 w-full p-4 rounded-[16px] hover:bg-[#F9FAFB] transition-colors group">
                            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden shrink-0 border border-gray-100">
                                <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Felix" alt="profile" />
                            </div>
                            <div className="text-left flex-1">
                                <p className="font-bold text-[14px] text-[#191F28]">김토스</p>
                                <p className="font-medium text-[12px] text-[#8B95A1]">마이페이지</p>
                            </div>
                        </button>
                    </div>
                </aside>

                {/* ========================================================
            [메인] 중앙 피드 + 우측 위젯 영역
        ======================================================== */}
                <main className="flex-1 flex h-full overflow-hidden bg-white">

                    {/* --- A. HOME VIEW (Center 1-Column Feed) --- */}
                    {activeView === 'home' && !selectedPlace && (
                        <>
                            {/* 스크롤 가능한 메인 1열 피드 */}
                            <div className="flex-1 max-w-[720px] h-full overflow-y-auto no-scrollbar flex flex-col bg-white animate-fade-in relative border-r border-[#F2F4F6]">

                                <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-xl px-10 py-8 flex items-center justify-between border-b border-[#F2F4F6]/50">
                                    <h1 className="font-bold text-[28px] tracking-tight text-[#191F28]">발견</h1>
                                </header>

                                <div className="sticky top-[93px] z-10 bg-white/95 backdrop-blur-md pt-4 pb-5 mb-2 border-b border-[#F2F4F6]/50">
                                    <div className="px-10 flex gap-2 overflow-x-auto no-scrollbar whitespace-nowrap items-center fade-edges">
                                        <button className="px-5 py-2.5 rounded-[14px] bg-[#191F28] text-white text-[14px] font-bold shadow-sm shrink-0">추천 무드</button>
                                        <button onClick={() => setActiveView('explore')} className="px-5 py-2.5 rounded-[14px] bg-orange-50 text-orange-600 border border-orange-100 text-[14px] font-bold shrink-0 flex items-center gap-1.5 hover:bg-orange-100 transition-colors">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                                            세밀하게 탐색하기
                                        </button>
                                        <button className="px-5 py-2.5 rounded-[14px] bg-[#F2F4F6] text-[#4E5968] text-[14px] font-semibold shrink-0 hover:bg-[#E5E8EB]">#햇살맛집</button>
                                        <button className="px-5 py-2.5 rounded-[14px] bg-[#F2F4F6] text-[#4E5968] text-[14px] font-semibold shrink-0 hover:bg-[#E5E8EB]">#뷰맛집</button>
                                        <div className="w-4 shrink-0"></div>
                                    </div>
                                </div>

                                <div className="px-10 py-6 pb-24 flex-1">
                                    <div className="flex flex-col gap-10">
                                        {PLACES_DATA.map((place) => (
                                            <article key={place.id} onClick={() => handlePlaceClick(place)} className="group cursor-pointer">
                                                <div className={`relative w-full ${place.aspectRatio} rounded-[32px] overflow-hidden bg-[#F2F4F6] shadow-sm`}>
                                                    <img src={place.imageUrl} alt={place.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]" loading="lazy" />
                                                    <div className="absolute bottom-0 left-0 w-full pt-28 pb-8 px-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                                                        <h2 className="font-bold text-[28px] text-white mb-3 tracking-tight drop-shadow-md">{place.name}</h2>
                                                        <div className="flex flex-wrap gap-2">
                                                            {place.tags.map(tag => (
                                                                <span key={tag} className="px-3 py-1.5 rounded-[10px] bg-white/20 backdrop-blur-md text-[13px] font-bold text-white border border-white/10 shadow-sm">
                                                                    #{tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                                {place.isHiddenGem && (
                                                    <div className="absolute top-6 right-6 bg-blue-500/90 backdrop-blur-md text-white text-[13px] font-bold px-4 py-2 rounded-[12px] shadow-lg flex items-center gap-1.5 border border-white/20">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                                                        Secret Spot
                                                    </div>
                                                )}
                                            </article>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* [우측] 고정 위젯 패널 (스크롤과 독립적) */}
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
                                        {[{ rank: 1, name: '코지한', up: true }, { rank: 2, name: '햇살맛집', up: true }, { rank: 3, name: '노트북하기좋은', up: false }, { rank: 4, name: '힙한/인더스트리얼', up: true }, { rank: 5, name: '조용한', up: false }].map((tag) => (
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
                                    <p>PickPl © 2024</p>
                                    <p className="mt-1 flex gap-4">
                                        <span className="cursor-pointer hover:underline">이용약관</span>
                                        <span className="cursor-pointer hover:underline font-bold text-[#4E5968]">개인정보처리방침</span>
                                    </p>
                                </div>
                            </div>
                        </>
                    )}

                    {/* --- B. EXPLORE VIEW (세밀한 1열 검색 결과 레이아웃) --- */}
                    {activeView === 'explore' && !selectedPlace && (
                        <div className="flex-1 h-full overflow-y-auto no-scrollbar bg-[#F9FAFB] animate-fade-in flex flex-col items-center">
                            <div className="w-full max-w-[880px] px-8 py-12">
                                <header className="mb-8 flex items-center gap-4">
                                    <h1 className="font-bold text-[32px] tracking-tight text-[#191F28]">공간 탐색</h1>
                                </header>

                                {/* 다중 태그 필터 영역 */}
                                <div className="bg-white p-8 rounded-[32px] shadow-sm border border-[#F2F4F6] mb-6">
                                    <h2 className="text-[20px] font-bold mb-8 tracking-tight text-[#191F28]">어떤 무드를 찾으시나요?</h2>
                                    <div className="flex flex-col gap-8">
                                        {TAG_CATEGORIES.map(category => (
                                            <div key={category.id}>
                                                <h3 className="text-[14px] font-bold text-[#8B95A1] mb-4">{category.title}</h3>
                                                <div className="flex flex-wrap gap-3">
                                                    {category.tags.map(tag => (
                                                        <button key={tag} onClick={() => toggleTag(tag)} className={`px-5 py-2.5 rounded-[14px] text-[15px] font-semibold transition-all border ${selectedTags.includes(tag) ? 'bg-[#191F28] text-white border-[#191F28] shadow-md' : 'bg-white text-[#4E5968] border-[#E5E8EB] hover:bg-[#F2F4F6]'}`}>
                                                            {tag}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {selectedTags.length > 0 && (
                                        <div className="mt-8 pt-6 border-t border-[#F2F4F6] flex justify-between items-center animate-fade-in">
                                            <p className="text-[15px] font-bold text-[#8B95A1]"><span className="text-orange-500">{filteredPlaces.length}</span>개의 공간이 필터링 되었습니다.</p>
                                            <button onClick={() => setSelectedTags([])} className="px-5 py-2.5 bg-[#F2F4F6] text-[#4E5968] rounded-[12px] font-bold text-[14px] hover:bg-[#E5E8EB]">전체 초기화</button>
                                        </div>
                                    )}
                                </div>

                                {/* 컴팩트 인기 무드 티커 */}
                                <div className="flex items-center gap-4 bg-white px-6 py-4 rounded-[20px] border border-[#F2F4F6] shadow-sm mb-10 overflow-x-auto no-scrollbar fade-edges">
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-[18px]">🔥</span>
                                        <span className="font-bold text-[14px] text-[#191F28]">실시간 인기 무드</span>
                                        <div className="w-[1px] h-4 bg-[#E5E8EB] ml-2"></div>
                                    </div>
                                    <div className="flex items-center gap-8 shrink-0">
                                        {[{ rank: 1, name: '코지한' }, { rank: 2, name: '햇살맛집' }, { rank: 3, name: '노트북하기좋은' }, { rank: 4, name: '힙한/인더스트리얼' }].map((tag) => (
                                            <div key={tag.rank} className="flex items-center gap-2 cursor-pointer hover:opacity-70 transition-opacity" onClick={() => toggleTag(tag.name)}>
                                                <span className={`font-bold text-[14px] ${tag.rank <= 2 ? 'text-orange-500' : 'text-[#8B95A1]'}`}>{tag.rank}</span>
                                                <span className="font-medium text-[14px] text-[#4E5968]">#{tag.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* 필터링 결과: 가로형 상세 리스트 (List View) */}
                                <h3 className="font-bold text-[20px] mb-6 tracking-tight text-[#191F28]">검색 결과 <span className="text-orange-500">{filteredPlaces.length}</span>곳</h3>
                                <div className="flex flex-col gap-6">
                                    {filteredPlaces.map((place) => (
                                        <article key={place.id} onClick={() => handlePlaceClick(place)} className="flex bg-white rounded-[28px] shadow-sm border border-[#F2F4F6] cursor-pointer hover:shadow-md hover:border-gray-200 transition-all group overflow-hidden h-[260px]">

                                            <div className="w-[260px] shrink-0 relative overflow-hidden bg-[#F2F4F6]">
                                                <img src={place.imageUrl} alt={place.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                                {place.isHiddenGem && (
                                                    <div className="absolute top-4 left-4 bg-blue-500/90 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1.5 rounded-[8px] flex items-center gap-1 shadow-md border border-white/20">
                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                                                        Secret
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1 p-8 flex flex-col">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h2 className="text-[22px] font-bold text-[#191F28] tracking-tight">{place.name}</h2>
                                                        <p className="text-[#8B95A1] text-[14px] mt-1 font-medium flex items-center gap-1">
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                            {place.location} · {place.distance}
                                                        </p>
                                                    </div>
                                                    <div className="bg-[#F9FAFB] px-3 py-1.5 rounded-[10px] flex items-center gap-1.5 border border-[#F2F4F6]">
                                                        <div className={`w-1.5 h-1.5 rounded-full ${place.initialVibe.quiet >= 50 ? 'bg-blue-500' : 'bg-orange-500'}`}></div>
                                                        <span className="text-[12px] font-bold text-[#4E5968]">{place.initialVibe.quiet >= 50 ? '조용히 집중' : '대화하기 좋은'}</span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-2 mt-5">
                                                    {place.tags.map(tag => (
                                                        <span key={tag} className={`px-3 py-1.5 rounded-[8px] text-[13px] font-semibold ${selectedTags.includes(tag) ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-[#F2F4F6] text-[#4E5968]'}`}>
                                                            #{tag}
                                                        </span>
                                                    ))}
                                                </div>

                                                <div className="mt-auto bg-[#F9FAFB] p-4 rounded-[16px] text-[14px] text-[#4E5968] flex items-center gap-3 border border-[#F2F4F6]">
                                                    <span className="text-[18px]">💬</span>
                                                    <span className="line-clamp-1 font-medium">"{place.bestReview}"</span>
                                                </div>
                                            </div>
                                        </article>
                                    ))}

                                    {filteredPlaces.length === 0 && (
                                        <div className="text-center py-24 bg-white rounded-[32px] border border-[#F2F4F6] mt-4">
                                            <svg className="w-16 h-16 mx-auto mb-6 text-[#D1D6DB]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            <p className="font-medium text-[16px] text-[#4E5968]">선택하신 무드의 조합이 너무 뾰족해요.</p>
                                            <button onClick={() => setSelectedTags([])} className="mt-6 px-6 py-3 bg-[#191F28] text-white rounded-[14px] font-bold text-[14px] transition-transform active:scale-95">조건 초기화하기</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                </main>

                {/* --- C. DETAIL PAGE VIEW (데스크탑 와이드 스플릿 모달) --- */}
                {selectedPlace && !showHiddenGemPopup && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-8 animate-fade-in">
                        <div className="absolute inset-0 cursor-pointer" onClick={handleCloseDetail}></div>

                        <div className="relative w-full max-w-[1100px] h-[90vh] bg-white rounded-[40px] overflow-hidden flex shadow-2xl animate-scale-up z-10">

                            <div className="w-[55%] h-full relative bg-[#F2F4F6] shrink-0">
                                <img src={selectedPlace.imageUrl} className="w-full h-full object-cover" alt="" />

                                <button onClick={handleCloseDetail} className="absolute top-6 left-6 w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/40 transition-colors shadow-lg">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>

                                <button onClick={() => setIsPlayingAudio(!isPlayingAudio)} className={`absolute top-6 right-6 px-5 h-12 rounded-full backdrop-blur-md flex items-center gap-3 transition-all border ${isPlayingAudio ? 'bg-orange-500/90 border-orange-400 text-white shadow-[0_0_20px_rgba(249,115,22,0.4)]' : 'bg-black/30 border-white/20 text-white hover:bg-black/50'}`}>
                                    {isPlayingAudio ? (
                                        <div className="flex items-center gap-[4px] h-5 text-white"><div className="wave-bar"></div><div className="wave-bar"></div><div className="wave-bar"></div><div className="wave-bar"></div></div>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                                    )}
                                    <span className="text-[14px] font-bold">{isPlayingAudio ? '무드 재생 중' : '무드 듣기'}</span>
                                </button>
                            </div>

                            <div className="w-[45%] h-full flex flex-col bg-white">
                                <div className="flex-1 overflow-y-auto p-10 no-scrollbar">

                                    <h1 className="text-[32px] font-bold mb-2 tracking-tight text-[#191F28]">{selectedPlace.name}</h1>
                                    <p className="text-[15px] font-medium text-[#8B95A1] mb-6 flex items-center gap-1.5">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        {selectedPlace.location} · {selectedPlace.distance}
                                    </p>

                                    <div className="flex flex-wrap gap-2 mb-8">
                                        {selectedPlace.tags.map(tag => <span key={tag} className="px-4 py-2 rounded-[12px] bg-[#F2F4F6] text-[#4E5968] text-[14px] font-semibold">#{tag}</span>)}
                                    </div>

                                    <p className="text-[16px] text-[#4E5968] leading-[1.7] mb-10 bg-[#F9FAFB] p-6 rounded-[24px] border border-[#F2F4F6]">
                                        {selectedPlace.description}
                                    </p>

                                    <div className="w-full h-[1px] bg-[#F2F4F6] mb-10"></div>

                                    <h3 className="font-bold text-[20px] mb-5 tracking-tight text-[#191F28]">이 공간의 특징</h3>
                                    <div className="flex flex-col gap-5 mb-10">
                                        {selectedPlace.features.map((feat, idx) => (
                                            <div key={idx} className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-[16px] bg-[#F9FAFB] border border-[#F2F4F6] flex items-center justify-center text-gray-500 shadow-sm">
                                                    {feat.icon}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-[16px] text-[#333D4B]">{feat.title}</p>
                                                    <p className="font-medium text-[14px] text-[#8B95A1] mt-0.5">{feat.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="bg-[#F9FAFB] p-8 rounded-[32px] border border-[#F2F4F6]">
                                        <div className="flex justify-between items-center mb-3">
                                            <h3 className="font-bold text-[20px] tracking-tight">지금 분위기는?</h3>
                                            <div className="flex items-center gap-1.5 text-[#00A86B] bg-[#00A86B]/10 px-3 py-1.5 rounded-[8px]">
                                                <div className="w-2 h-2 rounded-full bg-[#00A86B] animate-pulse"></div>
                                                <span className="text-[12px] font-bold">실시간</span>
                                            </div>
                                        </div>
                                        <p className="text-[14px] text-[#8B95A1] mb-8">방문 중인 사람들의 투표로 만들어져요.</p>

                                        <div className="w-full h-4 bg-[#E5E8EB] rounded-full overflow-hidden mb-8 flex relative">
                                            <div className="h-full bg-blue-500 transition-all duration-700 ease-out" style={{ width: `${quietPercent}%` }}></div>
                                            <div className="h-full bg-orange-400 transition-all duration-700 ease-out" style={{ width: `${chattyPercent}%` }}></div>
                                        </div>

                                        <div className="flex gap-4">
                                            <button onClick={() => handleVibeVote('quiet')} className={`flex-1 py-6 px-4 rounded-[24px] border-2 transition-all flex flex-col items-center gap-3 ${userVotedVibe === 'quiet' ? 'border-blue-500 bg-blue-50' : 'border-[#E5E8EB] bg-white hover:border-blue-200'}`}>
                                                <svg className={`w-8 h-8 ${userVotedVibe === 'quiet' ? 'text-blue-500' : 'text-[#8B95A1]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                                                <span className={`text-[15px] font-bold ${userVotedVibe === 'quiet' ? 'text-blue-600' : 'text-[#4E5968]'}`}>조용히 집중</span>
                                                <span className={`text-[14px] font-bold ${userVotedVibe === 'quiet' ? 'text-blue-400' : 'text-[#8B95A1]'}`}>{quietPercent}%</span>
                                            </button>
                                            <button onClick={() => handleVibeVote('chatty')} className={`flex-1 py-6 px-4 rounded-[24px] border-2 transition-all flex flex-col items-center gap-3 ${userVotedVibe === 'chatty' ? 'border-orange-500 bg-orange-50' : 'border-[#E5E8EB] bg-white hover:border-orange-200'}`}>
                                                <svg className={`w-8 h-8 ${userVotedVibe === 'chatty' ? 'text-orange-500' : 'text-[#8B95A1]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
                                                <span className={`text-[15px] font-bold ${userVotedVibe === 'chatty' ? 'text-orange-600' : 'text-[#4E5968]'}`}>대화하기 좋아요</span>
                                                <span className={`text-[14px] font-bold ${userVotedVibe === 'chatty' ? 'text-orange-400' : 'text-[#8B95A1]'}`}>{chattyPercent}%</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="sticky bottom-0 bg-white/95 backdrop-blur-xl border-t border-[#F2F4F6] p-6 flex gap-4 z-50">
                                    {showSaveAnim && (
                                        <div className="absolute left-[35px] bottom-[30px] w-10 h-10 flex items-center justify-center text-red-500 animate-fly z-50">
                                            <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                                        </div>
                                    )}
                                    <button onClick={handleSaveClick} className={`w-[64px] h-[64px] rounded-[20px] flex items-center justify-center transition-all hover:scale-95 shrink-0 border ${isSaved ? 'bg-red-50 border-red-100 text-red-500' : 'bg-[#F9FAFB] border-[#E5E8EB] text-[#8B95A1] hover:bg-[#F2F4F6]'}`}>
                                        <svg className="w-8 h-8" fill={isSaved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isSaved ? 0 : 2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                    </button>
                                    <button className="flex-1 h-[64px] rounded-[20px] bg-[#191F28] hover:bg-black text-white font-bold text-[18px] transition-colors shadow-sm">
                                        방문 기록 남기기
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}