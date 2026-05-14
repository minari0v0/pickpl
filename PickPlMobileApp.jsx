import React, { useState, useEffect, useMemo } from 'react';

// --- 1. 태그 카테고리 (탐색 페이지용) ---
const TAG_CATEGORIES = [
    { id: 'popular', title: "요즘 뜨는 취향", tags: ["대형카페", "노트북하기좋은", "햇살맛집", "디저트맛집"] },
    { id: 'mood', title: "공간의 무드", tags: ["코지한", "따뜻한우드톤", "힙한/인더스트리얼", "조용한", "미니멀한", "식물가득", "나만아는"] },
    { id: 'facility', title: "목적과 시설", tags: ["콘센트석", "편안한쇼파", "주차편리", "반려동물동반", "루프탑"] }
];

// --- 2. 통합 더미 데이터 ---
const PLACES_DATA = [
    {
        id: 1, name: "어반우드 성수", location: "서울 성동구 성수동", distance: "내 위치에서 800m",
        imageUrl: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=600", aspectRatio: "aspect-[4/5]",
        tags: ["따뜻한우드톤", "노트북하기좋은", "콘센트석", "코지한"],
        isHiddenGem: false,
        initialVibe: { quiet: 85, chatty: 15 },
        description: "성수동 골목에 숨겨진, 따뜻한 나무 향기가 나는 작업하기 좋은 카페입니다. 넉넉한 콘센트와 우드톤 인테리어가 집중력을 높여줍니다.",
        features: [
            { icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>, title: "작업하기 편해요", desc: "전 좌석 콘센트 구비" }
        ]
    },
    {
        id: 2, name: "오브제 커피 (Secret)", location: "서울 마포구 연남동", distance: "내 위치에서 2.1km",
        imageUrl: "https://images.unsplash.com/photo-1600607686527-6fb886090705?q=80&w=600", aspectRatio: "aspect-square",
        tags: ["미니멀한", "디저트맛집", "조용한", "나만아는"],
        isHiddenGem: true,
        initialVibe: { quiet: 45, chatty: 55 },
        description: "미니멀한 인테리어와 예술 작품 같은 디저트가 있는 공간. 골목 깊숙한 곳에 있어 아는 사람만 찾아오는 숨겨진 보석 같은 곳입니다.",
        features: [
            { icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>, title: "숨겨진 보석", desc: "예술 작품 같은 수제 디저트" }
        ]
    },
    {
        id: 3, name: "플랜트 서울", location: "서울 용산구 이태원동", distance: "내 위치에서 4.5km",
        imageUrl: "https://images.unsplash.com/photo-1525097487450-52851ed90a1b?q=80&w=600", aspectRatio: "aspect-[3/4]",
        tags: ["식물가득", "반려동물동반", "햇살맛집"],
        isHiddenGem: false,
        initialVibe: { quiet: 60, chatty: 40 },
        description: "도심 속 작은 식물원. 신선한 비건 브런치와 함께 햇살이 가득 들어오는 공간에서 그리너리한 휴식을 즐겨보세요.",
        features: [
            { icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>, title: "식물 가득", desc: "쾌적하고 맑은 공기" }
        ]
    },
    {
        id: 4, name: "루프탑 클라우드", location: "서울 강남구 신사동", distance: "내 위치에서 8.0km",
        imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=600", aspectRatio: "aspect-square",
        tags: ["루프탑", "대형카페", "주차편리", "힙한/인더스트리얼"],
        isHiddenGem: false,
        initialVibe: { quiet: 20, chatty: 80 },
        description: "신사동의 탁 트인 야경을 감상할 수 있는 루프탑 라운지 바. 선선한 저녁에 좋은 사람들과 대화 나누기 완벽한 장소입니다.",
        features: [
            { icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>, title: "멋진 야경", desc: "남산타워가 보이는 뷰" }
        ]
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
        <div className="min-h-screen bg-[#F0F2F5] flex justify-center font-sans text-[#191F28] selection:bg-orange-500/30">

            <style dangerouslySetInnerHTML={{
                __html: `
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
        * { font-family: 'Pretendard', sans-serif; -webkit-tap-highlight-color: transparent; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        @keyframes fade-in { 0% { opacity: 0; } 100% { opacity: 1; } }
        @keyframes slide-in-right { 0% { transform: translateX(10%); opacity: 0; } 100% { transform: translateX(0); opacity: 1; } }
        @keyframes slide-up { 0% { transform: translateY(100%); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
        
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        .animate-slide-in-right { animation: slide-in-right 0.35s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        
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
          100% { transform: scale(0.2) translate(100px, 350px); opacity: 0; }
        }
        .animate-fly { animation: fly-to-collection 0.8s cubic-bezier(0.5, 0, 0.2, 1) forwards; pointer-events: none; }
        
        .fade-edges {
          -webkit-mask-image: linear-gradient(to right, transparent, black 15px, black calc(100% - 15px), transparent);
          mask-image: linear-gradient(to right, transparent, black 15px, black calc(100% - 15px), transparent);
        }
      `}} />

            <div className="w-full max-w-[480px] bg-white h-[100dvh] relative shadow-[0_0_40px_rgba(0,0,0,0.05)] overflow-hidden border-x border-gray-100 flex flex-col">

                {/* ========================================================
            [기능 1] 시크릿 스팟 오버레이
        ======================================================== */}
                {showHiddenGemPopup && (
                    <div className="absolute inset-0 z-[100] bg-black/85 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in text-white">
                        <div className="relative w-64 h-64 flex items-center justify-center mb-6">
                            <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-[40px] animate-[glow-pulse_2s_ease-in-out_infinite]"></div>
                            <svg viewBox="0 0 100 100" className="w-32 h-32 z-10 drop-shadow-[0_0_20px_rgba(96,165,250,0.6)] animate-[gem-float_3s_ease-in-out_infinite]">
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
                        <h2 className="text-[26px] font-bold text-center leading-snug mb-3">나만 아는 특별한 공간을<br /><span className="text-blue-400">발견했어요!</span></h2>
                        <p className="text-[14px] text-gray-300 font-medium">취향 분석을 통해 숨겨진 보석을 찾았습니다.</p>
                    </div>
                )}

                {/* ========================================================
            우측 메인 영역 (홈 / 탐색 / 상세 페이지)
        ======================================================== */}
                <div className="flex-1 flex flex-col relative overflow-hidden bg-white">

                    {/* --- A. HOME VIEW --- */}
                    {!selectedPlace && activeView === 'home' && (
                        <div className="flex-1 overflow-y-auto no-scrollbar animate-fade-in flex flex-col">

                            <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-6 py-4 flex items-center justify-between">
                                <h1 className="font-bold text-[24px] tracking-tight text-[#191F28]">발견</h1>
                                <button onClick={() => setActiveView('explore')} className="w-10 h-10 bg-[#F2F4F6] rounded-full flex items-center justify-center hover:bg-[#E5E8EB] transition-colors">
                                    <svg className="w-5 h-5 text-[#4E5968]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                </button>
                            </header>

                            <div className="px-6 pt-2 pb-4">
                                <div className="bg-[#F9FAFB] rounded-[24px] p-5 flex items-center justify-between border border-[#F2F4F6] shadow-[0_4px_20px_rgba(0,0,0,0.02)] cursor-pointer active:scale-[0.98] transition-transform">
                                    <div>
                                        <p className="text-orange-500 text-[13px] font-bold mb-1 tracking-tight">이번 주 큐레이션</p>
                                        <h2 className="text-[#191F28] text-[18px] font-bold leading-snug">비 오는 날,<br />창밖을 보기 좋은 카페</h2>
                                    </div>
                                    <div className="w-[52px] h-[52px] bg-white rounded-full flex items-center justify-center shadow-sm">
                                        <svg className="w-7 h-7 text-[#4E5968]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                                    </div>
                                </div>
                            </div>

                            <div className="sticky top-[72px] z-10 bg-white/95 backdrop-blur-md pt-2 pb-3 mb-2">
                                <div className="flex gap-2 overflow-x-auto no-scrollbar whitespace-nowrap px-6 fade-edges">
                                    <button className="px-5 py-2.5 rounded-[14px] bg-[#191F28] text-white text-[14px] font-bold shadow-sm shrink-0">추천 무드</button>
                                    <button onClick={() => setActiveView('explore')} className="px-5 py-2.5 rounded-[14px] bg-orange-50 text-orange-600 border border-orange-100 text-[14px] font-bold shrink-0 flex items-center gap-1.5 active:scale-95 transition-transform">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                                        세밀하게 탐색하기
                                    </button>
                                    <button className="px-5 py-2.5 rounded-[14px] bg-[#F2F4F6] text-[#4E5968] text-[14px] font-semibold shrink-0">#햇살맛집</button>
                                    <button className="px-5 py-2.5 rounded-[14px] bg-[#F2F4F6] text-[#4E5968] text-[14px] font-semibold shrink-0">#뷰맛집</button>
                                    <div className="w-2 shrink-0"></div>
                                </div>
                            </div>

                            <div className="px-5 pb-24 flex-1">
                                <div className="flex flex-col gap-6">
                                    {PLACES_DATA.map((place) => (
                                        <article key={place.id} onClick={() => handlePlaceClick(place)} className="group cursor-pointer active:scale-[0.98] transition-transform relative">
                                            <div className={`relative w-full ${place.aspectRatio} rounded-[28px] overflow-hidden bg-[#F2F4F6] shadow-[0_4px_20px_rgba(0,0,0,0.04)]`}>
                                                <img src={place.imageUrl} alt={place.name} className="w-full h-full object-cover" loading="lazy" />

                                                <div className="absolute bottom-0 left-0 w-full pt-20 pb-6 px-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                                                    <h2 className="font-bold text-[24px] text-white mb-2.5 tracking-tight drop-shadow-md">{place.name}</h2>
                                                    <div className="flex flex-wrap gap-2">
                                                        {place.tags.map(tag => (
                                                            <span key={tag} className="px-2.5 py-1.5 rounded-[8px] bg-white/20 backdrop-blur-md text-[12px] font-bold text-white shadow-sm border border-white/10">
                                                                #{tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {place.isHiddenGem && (
                                                <div className="absolute top-4 right-4 bg-blue-500/90 backdrop-blur-md text-white text-[12px] font-bold px-3 py-1.5 rounded-[10px] shadow-lg flex items-center gap-1.5 border border-white/20">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                                                    Secret
                                                </div>
                                            )}
                                        </article>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- B. EXPLORE VIEW --- */}
                    {!selectedPlace && activeView === 'explore' && (
                        <div className="flex-1 bg-[#F9FAFB] animate-slide-in-right flex flex-col absolute inset-0 z-30">
                            <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-[#F2F4F6] px-2 py-4 flex items-center">
                                <button onClick={() => setActiveView('home')} className="w-12 h-12 flex items-center justify-center text-[#191F28] active:scale-90">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                                </button>
                                <h1 className="font-bold text-[18px] flex-1 text-center -ml-12 tracking-tight">공간 탐색</h1>
                            </header>

                            <div className="flex-1 overflow-y-auto no-scrollbar">

                                <div className="bg-white pt-6 pb-7 rounded-b-[32px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] sticky top-0 z-30">
                                    <h2 className="text-[20px] font-bold mb-5 tracking-tight text-[#191F28] px-6">어떤 무드를 찾으시나요?</h2>

                                    <div className="flex flex-col gap-6">
                                        {TAG_CATEGORIES.map(category => (
                                            <div key={category.id} className="pl-6">
                                                <h3 className="text-[13px] font-bold text-[#8B95A1] mb-3">{category.title}</h3>
                                                <div className="flex gap-2 overflow-x-auto no-scrollbar pr-6 pb-1 fade-edges">
                                                    {category.tags.map(tag => (
                                                        <button key={tag} onClick={() => toggleTag(tag)} className={`px-4 py-2.5 rounded-[14px] text-[14px] font-semibold transition-all active:scale-95 border whitespace-nowrap shrink-0 ${selectedTags.includes(tag) ? 'bg-[#191F28] text-white border-[#191F28] shadow-md' : 'bg-white text-[#4E5968] border-[#E5E8EB] hover:bg-[#F9FAFB]'}`}>
                                                            {tag}
                                                        </button>
                                                    ))}
                                                    <div className="w-2 shrink-0"></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="px-5 pt-8 pb-24">
                                    <h3 className="font-bold text-[18px] mb-5 px-1 text-[#191F28]">추천 공간 <span className="text-orange-500">{filteredPlaces.length}</span>곳</h3>

                                    <div className="flex flex-col gap-6">
                                        {filteredPlaces.map((place) => (
                                            <article key={place.id} onClick={() => handlePlaceClick(place)} className="cursor-pointer active:scale-[0.98] transition-transform relative">
                                                <div className={`relative w-full ${place.aspectRatio} rounded-[28px] overflow-hidden bg-[#E5E8EB] shadow-sm`}>
                                                    <img src={place.imageUrl} alt={place.name} className="w-full h-full object-cover" />
                                                    <div className="absolute bottom-0 left-0 w-full pt-16 pb-6 px-6 bg-gradient-to-t from-black/80 to-transparent">
                                                        <h2 className="font-bold text-[22px] text-white mb-2 tracking-tight">{place.name}</h2>
                                                        <div className="flex flex-wrap gap-2">
                                                            {place.tags.filter(t => selectedTags.includes(t)).map(tag => (
                                                                <span key={tag} className="px-2.5 py-1.5 rounded-[8px] bg-orange-500/90 backdrop-blur-md text-[12px] font-bold text-white shadow-sm border border-white/10">
                                                                    #{tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </article>
                                        ))}

                                        {filteredPlaces.length === 0 && (
                                            <div className="text-center py-20 text-[#8B95A1]">
                                                <svg className="w-12 h-12 mx-auto mb-4 text-[#D1D6DB]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                <p className="font-medium">선택하신 무드의 조합이 너무 뾰족해요.</p>
                                                <button onClick={() => setSelectedTags([])} className="mt-4 px-4 py-2 bg-[#F2F4F6] text-[#4E5968] rounded-full font-bold text-[13px]">초기화하기</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- C. DETAIL PAGE VIEW --- */}
                    {selectedPlace && !showHiddenGemPopup && (
                        <div className="absolute inset-0 z-40 bg-white flex flex-col animate-slide-up">

                            <div className="relative w-full h-[45vh] bg-[#F2F4F6] shrink-0">
                                <img src={selectedPlace.imageUrl} className="w-full h-full object-cover" alt="" />

                                <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent pt-safe z-50">
                                    <button onClick={handleCloseDetail} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition-transform">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                                    </button>

                                    <button onClick={() => setIsPlayingAudio(!isPlayingAudio)} className={`px-4 h-10 rounded-full backdrop-blur-md flex items-center gap-2 transition-all active:scale-95 border ${isPlayingAudio ? 'bg-orange-500/90 border-orange-400 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]' : 'bg-black/30 border-white/20 text-white'}`}>
                                        {isPlayingAudio ? (
                                            <div className="flex items-center gap-[3px] h-4 text-white"><div className="wave-bar"></div><div className="wave-bar"></div><div className="wave-bar"></div><div className="wave-bar"></div></div>
                                        ) : (
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                                        )}
                                        <span className="text-[13px] font-bold">{isPlayingAudio ? '무드 재생 중' : '무드 듣기'}</span>
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 bg-white -mt-8 rounded-t-[32px] relative z-10 overflow-y-auto no-scrollbar pb-[100px] shadow-[0_-10px_30px_rgba(0,0,0,0.1)]">
                                <div className="px-6 pt-8 pb-6">
                                    <h1 className="text-[26px] font-bold mb-1.5 tracking-tight">{selectedPlace.name}</h1>
                                    <p className="text-[14px] font-medium text-[#8B95A1] mb-5 flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        {selectedPlace.location}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedPlace.tags.map(tag => <span key={tag} className="px-3 py-1.5 rounded-[10px] bg-[#F2F4F6] text-[#4E5968] text-[13px] font-semibold">#{tag}</span>)}
                                    </div>
                                    <p className="text-[15px] text-[#4E5968] leading-relaxed mt-6">{selectedPlace.description}</p>
                                </div>

                                <div className="w-full h-2 bg-[#F2F4F6]"></div>

                                <div className="px-6 py-8">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="font-bold text-[19px] tracking-tight">지금 이 공간의 분위기는?</h3>
                                        <div className="flex items-center gap-1.5 text-[#00A86B] bg-[#00A86B]/10 px-2.5 py-1 rounded-[6px]">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#00A86B] animate-pulse"></div>
                                            <span className="text-[11px] font-bold">실시간</span>
                                        </div>
                                    </div>
                                    <p className="text-[13px] text-[#8B95A1] mb-6">현재 있는 사람들의 투표로 만들어져요.</p>

                                    <div className="w-full h-3 bg-[#E5E8EB] rounded-full overflow-hidden mb-6 flex relative">
                                        <div className="h-full bg-blue-500 transition-all duration-700 ease-out" style={{ width: `${quietPercent}%` }}></div>
                                        <div className="h-full bg-orange-400 transition-all duration-700 ease-out" style={{ width: `${chattyPercent}%` }}></div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button onClick={() => handleVibeVote('quiet')} className={`flex-1 py-5 px-2 rounded-[20px] border-[1.5px] transition-all flex flex-col items-center gap-2 active:scale-95 ${userVotedVibe === 'quiet' ? 'border-blue-500 bg-blue-50' : 'border-[#E5E8EB] bg-white hover:bg-[#F9FAFB]'}`}>
                                            <svg className={`w-7 h-7 mb-1 ${userVotedVibe === 'quiet' ? 'text-blue-500' : 'text-[#8B95A1]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                                            <span className={`text-[14px] font-bold ${userVotedVibe === 'quiet' ? 'text-blue-600' : 'text-[#4E5968]'}`}>조용히 집중</span>
                                            <span className={`text-[12px] font-bold ${userVotedVibe === 'quiet' ? 'text-blue-400' : 'text-[#8B95A1]'}`}>{quietPercent}%</span>
                                        </button>
                                        <button onClick={() => handleVibeVote('chatty')} className={`flex-1 py-5 px-2 rounded-[20px] border-[1.5px] transition-all flex flex-col items-center gap-2 active:scale-95 ${userVotedVibe === 'chatty' ? 'border-orange-500 bg-orange-50' : 'border-[#E5E8EB] bg-white hover:bg-[#F9FAFB]'}`}>
                                            <svg className={`w-7 h-7 mb-1 ${userVotedVibe === 'chatty' ? 'text-orange-500' : 'text-[#8B95A1]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
                                            <span className={`text-[14px] font-bold ${userVotedVibe === 'chatty' ? 'text-orange-600' : 'text-[#4E5968]'}`}>대화하기 좋아요</span>
                                            <span className={`text-[12px] font-bold ${userVotedVibe === 'chatty' ? 'text-orange-400' : 'text-[#8B95A1]'}`}>{chattyPercent}%</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="absolute bottom-0 left-0 w-full bg-white border-t border-[#F2F4F6] px-5 py-4 pb-safe flex gap-3 z-50">
                                {showSaveAnim && (
                                    <div className="absolute left-[35px] bottom-[30px] w-8 h-8 flex items-center justify-center text-red-500 animate-fly z-50">
                                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                                    </div>
                                )}
                                <button onClick={handleSaveClick} className={`w-[56px] h-[56px] rounded-[18px] flex items-center justify-center transition-all active:scale-90 shrink-0 border ${isSaved ? 'bg-red-50 border-red-100 text-red-500' : 'bg-[#F2F4F6] border-transparent text-[#8B95A1]'}`}>
                                    <svg className="w-7 h-7" fill={isSaved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isSaved ? 0 : 2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                </button>
                                <button className="flex-1 h-[56px] rounded-[18px] bg-[#191F28] text-white font-bold text-[17px] active:scale-[0.98] transition-transform shadow-sm">
                                    방문 기록 남기기
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ========================================================
              모바일 하단 네비게이션 (ALL SVG)
          ======================================================== */}
                    {!selectedPlace && (
                        <nav className="absolute bottom-0 left-0 w-full bg-white/95 backdrop-blur-xl border-t border-[#F2F4F6] px-6 py-2.5 pb-safe flex justify-between items-center z-20">
                            <button onClick={() => setActiveView('home')} className={`flex flex-col items-center gap-1 active:scale-95 ${activeView === 'home' ? 'text-[#191F28]' : 'text-[#8B95A1]'}`}>
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                                <span className="text-[10px] font-bold">발견</span>
                            </button>
                            <button onClick={() => setActiveView('explore')} className={`flex flex-col items-center gap-1 active:scale-95 ${activeView === 'explore' ? 'text-[#191F28]' : 'text-[#8B95A1]'}`}>
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                <span className="text-[10px] font-bold">탐색</span>
                            </button>
                            <button className="flex flex-col items-center gap-1 text-[#8B95A1] active:scale-95 relative">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                                <span className="text-[10px] font-bold">컬렉션</span>
                            </button>
                            <button className="flex flex-col items-center gap-1 text-[#8B95A1] active:scale-95">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                <span className="text-[10px] font-bold">마이</span>
                            </button>
                        </nav>
                    )}

                </div>
            </div>
        </div>
    );
}