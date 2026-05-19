"use client";

import React, { useState, useEffect, useMemo } from 'react';

import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/authStore';
import axiosInstance from '../api/axios';

const fetcher = (url: string) => fetch(url).then(res => res.json());

// --- 1. 태그 카테고리 ---
const TAG_CATEGORIES = [
    { id: 'popular', title: "요즘 뜨는 취향", tags: ["대형카페", "노트북하기좋은", "햇살맛집", "디저트맛집", "뷰맛집", "데이트코스"] },
    { id: 'mood', title: "공간의 무드", tags: ["코지한", "따뜻한우드톤", "힙한/인더스트리얼", "조용한", "미니멀한", "식물가득", "나만아는"] },
    { id: 'facility', title: "목적과 시설", tags: ["콘센트석", "편안한쇼파", "주차편리", "반려동물동반", "루프탑", "단체석"] }
];

function DraggableScroll({ children, className }: { children: React.ReactNode, className?: string }) {
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const isDown = React.useRef(false);
    const startX = React.useRef(0);
    const scrollLeft = React.useRef(0);
    const isDragging = React.useRef(false);

    const onMouseDown = (e: React.MouseEvent) => {
        isDown.current = true;
        isDragging.current = false;
        startX.current = e.pageX - (scrollRef.current?.offsetLeft || 0);
        scrollLeft.current = scrollRef.current?.scrollLeft || 0;
    };
    const onMouseLeave = () => { isDown.current = false; };
    const onMouseUp = () => { isDown.current = false; };
    const onMouseMove = (e: React.MouseEvent) => {
        if (!isDown.current || !scrollRef.current) return;
        e.preventDefault();
        const x = e.pageX - scrollRef.current.offsetLeft;
        const walk = (x - startX.current) * 2;
        if (Math.abs(walk) > 5) isDragging.current = true;
        scrollRef.current.scrollLeft = scrollLeft.current - walk;
    };

    const onClickCapture = (e: React.MouseEvent) => {
        if (isDragging.current) {
            e.stopPropagation();
            e.preventDefault();
        }
    };

    return (
        <div 
            ref={scrollRef}
            onMouseDown={onMouseDown}
            onMouseLeave={onMouseLeave}
            onMouseUp={onMouseUp}
            onMouseMove={onMouseMove}
            onClickCapture={onClickCapture}
            className={`cursor-grab active:cursor-grabbing ${className || ''}`}
        >
            {children}
        </div>
    );
}

export default function ResponsiveApp({ initialPlaces }: { initialPlaces: any[] }) {
    const router = useRouter();
    const [activeView, setActiveView] = useState<string>('home');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const authStore = useAuthStore();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [nickname, setNickname] = useState("미나리");

    useEffect(() => {
        // Hydration mismatch 방지를 위해 클라이언트 마운트 후 Zustand 상태 동기화
        setIsLoggedIn(authStore.isLoggedIn || !!localStorage.getItem("accessToken"));
        setNickname(authStore.nickname || localStorage.getItem("nickname") || "미나리");
    }, [authStore.isLoggedIn, authStore.nickname]);

    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const showToast = (message: string) => {
        setToastMessage(message);
        setTimeout(() => setToastMessage(null), 3000);
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (sessionStorage.getItem("showLoginToast")) {
                showToast("로그인 되었습니다.");
                sessionStorage.removeItem("showLoginToast");
            }
        }
    }, []);

    const handleLogout = async () => {
        try {
            await axiosInstance.post('/auth/logout');
        } catch (error) {
            console.error('로그아웃 요청 실패:', error);
        } finally {
            authStore.logout();
            showToast("로그아웃 되었습니다.");
        }
    };
    
    const queryString = selectedTags.length > 0 
        ? `?tags=${selectedTags.map(encodeURIComponent).join(',')}` 
        : '';
        
    const { data: fetchedPlaces } = useSWR(`http://localhost:8080/api/v1/places${queryString}`, fetcher, {
        fallbackData: selectedTags.length === 0 ? initialPlaces : undefined,
        keepPreviousData: true
    });
    
    const currentPlaces = fetchedPlaces || initialPlaces;

    const [selectedPlace, setSelectedPlace] = useState<any | null>(null);
    const [hiddenGemPlace, setHiddenGemPlace] = useState<any | null>(null);
    const [showHiddenGemPopup, setShowHiddenGemPopup] = useState<boolean>(false);
    const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
    const [vibeStats, setVibeStats] = useState<{ quiet: number; chatty: number }>({ quiet: 50, chatty: 50 });
    const [userVotedVibe, setUserVotedVibe] = useState<string | null>(null);
    const [isSaved, setIsSaved] = useState(false);
    const [showSaveAnim, setShowSaveAnim] = useState(false);

    // API 데이터와 디자인에 필요한 더미 속성 매핑
    const placesData = useMemo(() => {
        return currentPlaces.map((place: any) => {
            // 태그 배열 문자열 추출
            const tags = place.tags ? place.tags.map((t: any) => t.name) : [];
            // 시크릿 장소 기능 임시 비활성화
            const isHiddenGem = false; // tags.includes("나만아는");
            const initialVibe = tags.includes("조용한") ? { quiet: 80, chatty: 20 } : { quiet: 30, chatty: 70 };
            
            return {
                id: place.id,
                name: place.name,
                location: place.address,
                distance: "내 위치에서 " + ((place.id % 10) + 1) + "km",
                imageUrl: place.thumbnailUrl || "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=800",
                aspectRatio: "aspect-[4/5]",
                tags: tags,
                isHiddenGem: isHiddenGem,
                initialVibe: initialVibe,
                description: place.aiMoodSummary || place.category || "공간에 대한 설명이 없습니다.",
                features: [{ icon: "✨", title: "특징", desc: place.category || "매력적인 공간" }],
                bestReview: "정말 분위기가 좋았어요. 강력 추천합니다!"
            };
        });
    }, [currentPlaces]);

    const toggleTag = (tag: string) => {
        setSelectedTags(prev => prev.includes(tag) ? prev.filter((t: string) => t !== tag) : [...prev, tag]);
    };

    const filteredPlaces = placesData; // 이제 필터링은 백엔드에서 수행하므로そのまま 반환

    const handlePlaceClick = (place: any) => {
        if (place.isHiddenGem) {
            setHiddenGemPlace(place);
            setShowHiddenGemPopup(true);
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

    const handleVibeVote = (type: string) => {
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
        * { font-family: 'Pretendard', sans-serif; -webkit-tap-highlight-color: transparent; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        @keyframes fade-in { 0% { opacity: 0; } 100% { opacity: 1; } }
        @keyframes scale-up { 0% { transform: scale(0.95); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes slide-up { 0% { transform: translateY(100%); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
        @keyframes slide-in-right { 0% { transform: translateX(10%); opacity: 0; } 100% { transform: translateX(0); opacity: 1; } }
        
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        .animate-scale-up { animation: scale-up 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        .animate-slide-in-right { animation: slide-in-right 0.35s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        
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

            {/* --- 1440px 중앙 정렬 랩퍼 (모바일에서는 max-w-[480px]) --- */}
            <div className="w-full max-w-[480px] lg:max-w-[1440px] bg-white h-full relative shadow-2xl flex flex-col lg:flex-row border-x border-gray-200 overflow-hidden">

                {/* ========================================================
                    [기능 1] 시크릿 스팟 전체 오버레이 (Toss Style)
                ======================================================== */}
                {showHiddenGemPopup && (
                    <div className="absolute inset-0 z-[100] bg-[#0F1423] flex flex-col items-center justify-center animate-fade-in text-white px-6">
                        <div className="flex-1 flex flex-col items-center justify-center w-full mt-10">
                            <div className="relative w-64 h-64 flex items-center justify-center mb-8">
                                <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-[50px] animate-[glow-pulse_2s_ease-in-out_infinite]"></div>
                                {/* 3D 보석 / 선물 큐브 */}
                                <svg viewBox="0 0 100 100" className="w-40 h-40 z-10 drop-shadow-[0_0_40px_rgba(96,165,250,0.8)] animate-[gem-float_3s_ease-in-out_infinite]">
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
                            <h2 className="text-[28px] lg:text-[34px] font-bold text-center leading-[1.3] tracking-tight mb-4">
                                <span className="text-[#60A5FA]">미나리</span>님이 발견한<br />
                                비밀 공간이 도착했어요
                            </h2>
                        </div>
                        <div className="w-full lg:max-w-[400px] pb-10 pt-4">
                            <button 
                                onClick={() => {
                                    setShowHiddenGemPopup(false);
                                    setSelectedPlace(hiddenGemPlace);
                                }}
                                className="w-full bg-[#3182F6] hover:bg-[#2272EB] text-white font-bold text-[18px] py-5 rounded-[16px] transition-all active:scale-[0.98] shadow-[0_8px_20px_rgba(49,130,246,0.3)]">
                                비밀 공간 열어보기
                            </button>
                        </div>
                    </div>
                )}

                {/* ========================================================
                    [PC 전용 좌측] 고정 사이드바
                ======================================================== */}
                <aside className="hidden lg:flex w-[280px] shrink-0 border-r border-[#F2F4F6] bg-white z-20 h-full flex-col py-10 px-8">
                    <div className="flex items-center gap-3 mb-14 cursor-pointer" onClick={() => setActiveView('home')}>
                        <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center shadow-[0_4px_10px_rgba(249,115,22,0.3)]">
                            <span className="text-white font-bold text-xl">P</span>
                        </div>
                        <span className="font-logo font-extrabold text-[28px] tracking-tight text-[#191F28]">Pick<span className="text-orange-500 text-[1em] font-logo">Pl</span></span>
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
                            {['#햇살맛집', '#코지한', '#디저트맛집', '#대형카페'].map((tag: any) => (
                                <button key={tag} className="text-left px-4 py-2.5 rounded-[12px] text-[#4E5968] font-medium text-[15px] hover:bg-[#F9FAFB] hover:text-[#191F28] transition-colors">
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-auto pt-8 border-t border-[#F2F4F6] shrink-0">
                        {isLoggedIn ? (
                            <div className="flex flex-col gap-2">
                                <button className="flex items-center gap-4 w-full p-4 rounded-[16px] hover:bg-[#F9FAFB] active:bg-[#F2F4F6] transition-colors group">
                                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden shrink-0 border border-gray-100">
                                        <img src="/profile_cat.png" alt="profile" />
                                    </div>
                                    <div className="text-left flex-1">
                                        <p className="font-bold text-[14px] text-[#191F28]">{nickname}</p>
                                        <p className="font-medium text-[12px] text-[#8B95A1]">마이페이지</p>
                                    </div>
                                </button>
                                <button onClick={handleLogout} className="text-[#8B95A1] text-[13px] font-bold text-center mt-2 hover:text-[#4E5968] active:scale-95 transition-all">로그아웃</button>
                            </div>
                        ) : (
                            <button onClick={() => router.push('/login')} className="w-full bg-[#191F28] hover:bg-[#333D4B] active:bg-black active:scale-[0.98] text-white font-bold py-3.5 rounded-[16px] transition-all duration-200 shadow-sm">
                                로그인 / 회원가입
                            </button>
                        )}
                    </div>
                </aside>

                {/* ========================================================
                    [메인] 중앙 피드 + 우측 위젯 영역
                ======================================================== */}
                <main className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden bg-white relative">

                    {/* --- A. HOME VIEW --- */}
                    {activeView === 'home' && (
                        <>
                            {/* 스크롤 가능한 메인 피드 */}
                            <div className="flex-1 w-full lg:max-w-[720px] h-full overflow-y-auto no-scrollbar flex flex-col bg-white animate-fade-in relative lg:border-r lg:border-[#F2F4F6]">

                                {/* 헤더 (모바일/PC) */}
                                <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-xl px-6 py-4 lg:px-10 lg:py-8 flex items-center justify-between border-b lg:border-b border-[#F2F4F6]/50">
                                    <h1 className="lg:hidden font-logo font-extrabold text-[28px] tracking-tight text-[#191F28]">Pick<span className="text-orange-500 text-[1em] font-logo">Pl</span></h1>
                                    <h1 className="hidden lg:block font-bold text-[28px] tracking-tight text-[#191F28]">발견</h1>
                                    {/* 모바일에서만 보이는 탐색 버튼 */}
                                    <button onClick={() => setActiveView('explore')} className="lg:hidden w-10 h-10 bg-[#F2F4F6] rounded-full flex items-center justify-center hover:bg-[#E5E8EB] transition-colors">
                                        <svg className="w-5 h-5 text-[#4E5968]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
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
                                            <svg className="w-7 h-7 text-[#4E5968]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                                        </div>
                                    </div>
                                </div>

                                {/* 필터 바 */}
                                <div className="sticky top-[72px] lg:top-[93px] z-10 bg-white/95 backdrop-blur-md pt-2 lg:pt-4 pb-3 lg:pb-5 mb-2 border-b border-[#F2F4F6]/50">
                                    <DraggableScroll className="px-6 lg:px-10 flex gap-2 overflow-x-auto no-scrollbar whitespace-nowrap items-center">
                                        <button className="px-5 py-2.5 rounded-[14px] bg-[#191F28] text-white text-[14px] font-bold shadow-sm shrink-0">추천 무드</button>
                                        <button onClick={() => setActiveView('explore')} className="px-5 py-2.5 rounded-[14px] bg-orange-50 text-orange-600 border border-orange-100 text-[14px] font-bold shrink-0 flex items-center gap-1.5 hover:bg-orange-100 transition-colors">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
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
                                        ) : placesData.map((place: any) => (
                                            <article key={place.id} onClick={() => handlePlaceClick(place)} className="group cursor-pointer active:scale-[0.98] lg:active:scale-100 transition-transform relative">
                                                <div className={`relative w-full ${place.aspectRatio} rounded-[28px] lg:rounded-[32px] overflow-hidden bg-[#F2F4F6] shadow-sm`}>
                                                    <img src={place.imageUrl} alt={place.name} className="w-full h-full object-cover lg:group-hover:scale-[1.02] transition-transform duration-700" loading="lazy" />
                                                    <div className="absolute bottom-0 left-0 w-full pt-20 lg:pt-28 pb-6 px-6 lg:pb-8 lg:px-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                                                        <h2 className="font-bold text-[24px] lg:text-[28px] text-white mb-2.5 lg:mb-3 tracking-tight drop-shadow-md">{place.name}</h2>
                                                        <div className="flex flex-wrap gap-2">
                                                            {place.tags.map((tag: string) => (
                                                                <span key={tag} className="px-2.5 py-1.5 lg:px-3 lg:py-1.5 rounded-[8px] lg:rounded-[10px] bg-white/20 backdrop-blur-md text-[12px] lg:text-[13px] font-bold text-white border border-white/10 shadow-sm">
                                                                    #{tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                                {place.isHiddenGem && (
                                                    <div className="absolute top-4 right-4 lg:top-6 lg:right-6 bg-blue-500/90 backdrop-blur-md text-white text-[12px] lg:text-[13px] font-bold px-3 py-1.5 lg:px-4 lg:py-2 rounded-[10px] lg:rounded-[12px] shadow-lg flex items-center gap-1.5 border border-white/20">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                                                        Secret<span className="hidden lg:inline"> Spot</span>
                                                    </div>
                                                )}
                                            </article>
                                        ))}
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
                                    <p>PickPl © 2024</p>
                                    <p className="mt-1 flex gap-4">
                                        <span className="cursor-pointer hover:underline">이용약관</span>
                                        <span className="cursor-pointer hover:underline font-bold text-[#4E5968]">개인정보처리방침</span>
                                    </p>
                                </div>
                            </div>
                        </>
                    )}

                    {/* --- B. EXPLORE VIEW --- */}
                    {activeView === 'explore' && (
                        <div className="flex-1 h-full w-full overflow-y-auto no-scrollbar bg-[#F9FAFB] animate-slide-in-right lg:animate-fade-in flex flex-col absolute lg:relative inset-0 z-30 lg:z-auto items-center">
                            
                            {/* 모바일 헤더 */}
                            <header className="lg:hidden sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-[#F2F4F6] px-2 py-4 flex items-center w-full">
                                <button onClick={() => setActiveView('home')} className="w-12 h-12 flex items-center justify-center text-[#191F28] active:scale-90 relative z-50">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                                </button>
                                <h1 className="font-bold text-[18px] flex-1 text-center -ml-12 tracking-tight pointer-events-none">Pick<span className="text-orange-500 text-[1em]">Pl</span></h1>
                            </header>

                            <div className="w-full lg:max-w-[880px] lg:px-8 lg:py-12 flex-1 flex flex-col">
                                {/* PC 헤더 */}
                                <header className="hidden lg:flex mb-8 items-center gap-4">
                                    <h1 className="font-bold text-[32px] tracking-tight text-[#191F28]">공간 탐색</h1>
                                </header>

                                {/* 다중 태그 필터 영역 */}
                                <div className="bg-white pt-6 pb-7 lg:p-8 rounded-b-[32px] lg:rounded-[32px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] lg:shadow-sm border-b lg:border border-[#F2F4F6] lg:mb-6 relative">
                                    <h2 className="text-[20px] font-bold mb-5 lg:mb-8 tracking-tight text-[#191F28] px-6 lg:px-0">어떤 무드를 찾으시나요?</h2>
                                    <div className="flex flex-col gap-6 lg:gap-8">
                                        {TAG_CATEGORIES.map((category: any) => (
                                            <div key={category.id} className="pl-6 lg:pl-0">
                                                <h3 className="text-[13px] lg:text-[14px] font-bold text-[#8B95A1] mb-3 lg:mb-4">{category.title}</h3>
                                                <DraggableScroll className="flex flex-nowrap gap-2 lg:gap-3 overflow-x-auto no-scrollbar pr-6 pb-1">
                                                    {category.tags.map((tag: string) => (
                                                        <button key={tag} onClick={() => toggleTag(tag)} className={`px-4 py-2.5 lg:px-5 lg:py-2.5 rounded-[14px] text-[14px] lg:text-[15px] font-semibold transition-all active:scale-95 border whitespace-nowrap shrink-0 ${selectedTags.includes(tag) ? 'bg-[#191F28] text-white border-[#191F28] shadow-md' : 'bg-white text-[#4E5968] border-[#E5E8EB] hover:bg-[#F9FAFB] lg:hover:bg-[#F2F4F6]'}`}>
                                                            {tag}
                                                        </button>
                                                    ))}
                                                    <div className="w-2 shrink-0 lg:hidden"></div>
                                                </DraggableScroll>
                                            </div>
                                        ))}
                                    </div>

                                    {selectedTags.length > 0 && (
                                        <div className="mt-6 lg:mt-8 pt-5 lg:pt-6 border-t border-[#F2F4F6] flex justify-between items-center animate-fade-in px-6 lg:px-0">
                                            <p className="text-[14px] lg:text-[15px] font-bold text-[#8B95A1]"><span className="text-orange-500">{filteredPlaces.length}</span>개의 공간이 필터링 되었습니다.</p>
                                            <button onClick={() => setSelectedTags([])} className="px-4 py-2 lg:px-5 lg:py-2.5 bg-[#F2F4F6] text-[#4E5968] rounded-[12px] font-bold text-[13px] lg:text-[14px] hover:bg-[#E5E8EB]">초기화</button>
                                        </div>
                                    )}
                                </div>

                                {/* PC 컴팩트 티커 */}
                                <DraggableScroll className="hidden lg:flex items-center gap-4 bg-white px-6 py-4 rounded-[20px] border border-[#F2F4F6] shadow-sm mb-10 overflow-x-auto no-scrollbar fade-edges mt-4">
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-[18px]">🔥</span>
                                        <span className="font-bold text-[14px] text-[#191F28]">실시간 인기 무드</span>
                                        <div className="w-[1px] h-4 bg-[#E5E8EB] ml-2"></div>
                                    </div>
                                    <div className="flex items-center gap-8 shrink-0">
                                        {[{ rank: 1, name: '코지한' }, { rank: 2, name: '햇살맛집' }].map((tag: any) => (
                                            <div key={tag.rank} className="flex items-center gap-2 cursor-pointer hover:opacity-70 transition-opacity" onClick={() => toggleTag(tag.name)}>
                                                <span className={`font-bold text-[14px] ${tag.rank <= 2 ? 'text-orange-500' : 'text-[#8B95A1]'}`}>{tag.rank}</span>
                                                <span className="font-medium text-[14px] text-[#4E5968]">#{tag.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </DraggableScroll>

                                {/* 검색 결과 */}
                                <div className="px-5 lg:px-0 pt-8 lg:pt-0 pb-[100px] lg:pb-24 flex-1">
                                    <h3 className="font-bold text-[18px] lg:text-[20px] mb-5 lg:mb-6 tracking-tight text-[#191F28] px-1 lg:px-0">검색 결과 <span className="text-orange-500">{filteredPlaces.length}</span>곳</h3>
                                    
                                    <div className="flex flex-col gap-6">
                                        {filteredPlaces.map((place: any) => (
                                            <article key={place.id} onClick={() => handlePlaceClick(place)} className="flex flex-col lg:flex-row bg-white lg:rounded-[28px] lg:shadow-sm lg:border lg:border-[#F2F4F6] cursor-pointer hover:shadow-md transition-all group overflow-hidden lg:h-[260px] relative">
                                                
                                                {/* 모바일: 썸네일 위, PC: 썸네일 좌측 */}
                                                <div className={`relative w-full lg:w-[260px] ${place.aspectRatio} lg:aspect-auto shrink-0 overflow-hidden bg-[#E5E8EB] lg:bg-[#F2F4F6] rounded-[28px] lg:rounded-none`}>
                                                    <img src={place.imageUrl} alt={place.name} className="w-full h-full object-cover lg:group-hover:scale-105 transition-transform duration-700" />
                                                    
                                                    {/* 모바일 텍스트 오버레이 */}
                                                    <div className="lg:hidden absolute bottom-0 left-0 w-full pt-16 pb-6 px-6 bg-gradient-to-t from-black/80 to-transparent">
                                                        <h2 className="font-bold text-[22px] text-white mb-2 tracking-tight">{place.name}</h2>
                                                        <div className="flex flex-wrap gap-2">
                                                            {place.tags.filter((t: string) => selectedTags.length === 0 || selectedTags.includes(t)).slice(0, 3).map((tag: string) => (
                                                                <span key={tag} className="px-2.5 py-1.5 rounded-[8px] bg-white/20 backdrop-blur-md text-[12px] font-bold text-white shadow-sm border border-white/10">
                                                                    #{tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    
                                                    {place.isHiddenGem && (
                                                        <div className="absolute top-4 left-4 bg-blue-500/90 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1.5 rounded-[8px] flex items-center gap-1 shadow-md border border-white/20">
                                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                                                            Secret
                                                        </div>
                                                    )}
                                                </div>

                                                {/* PC 전용 우측 컨텐츠 */}
                                                <div className="hidden lg:flex flex-1 p-8 flex-col">
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
                                                        {place.tags.map((tag: string) => (
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
                                            <div className="text-center py-20 lg:py-24 bg-transparent lg:bg-white lg:rounded-[32px] lg:border border-[#F2F4F6] mt-4">
                                                <svg className="w-12 h-12 lg:w-16 lg:h-16 mx-auto mb-4 lg:mb-6 text-[#D1D6DB]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                <p className="font-medium text-[15px] lg:text-[16px] text-[#4E5968]">선택하신 무드의 조합이 너무 뾰족해요.</p>
                                                <button onClick={() => setSelectedTags([])} className="mt-4 lg:mt-6 px-5 py-2.5 lg:px-6 lg:py-3 bg-[#F2F4F6] lg:bg-[#191F28] text-[#4E5968] lg:text-white rounded-full lg:rounded-[14px] font-bold text-[13px] lg:text-[14px]">초기화하기</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- C. DETAIL PAGE VIEW --- */}
                    {selectedPlace && !showHiddenGemPopup && (
                        <>
                            {/* 모바일 슬라이드업 모달 */}
                            <div className="lg:hidden absolute inset-0 z-40 bg-white flex flex-col animate-slide-up">
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
                                            {selectedPlace.tags.map((tag: string) => <span key={tag} className="px-3 py-1.5 rounded-[10px] bg-[#F2F4F6] text-[#4E5968] text-[13px] font-semibold">#{tag}</span>)}
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

                            {/* PC 분할 팝업 모달 */}
                            <div className="hidden lg:flex fixed inset-0 z-50 bg-black/60 backdrop-blur-sm items-center justify-center p-8 animate-fade-in">
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
                                                {selectedPlace.tags.map((tag: string) => <span key={tag} className="px-4 py-2 rounded-[12px] bg-[#F2F4F6] text-[#4E5968] text-[14px] font-semibold">#{tag}</span>)}
                                            </div>
                                            <p className="text-[16px] text-[#4E5968] leading-[1.7] mb-10 bg-[#F9FAFB] p-6 rounded-[24px] border border-[#F2F4F6]">
                                                {selectedPlace.description}
                                            </p>
                                            <div className="w-full h-[1px] bg-[#F2F4F6] mb-10"></div>
                                            <h3 className="font-bold text-[20px] mb-5 tracking-tight text-[#191F28]">이 공간의 특징</h3>
                                            <div className="flex flex-col gap-5 mb-10">
                                                {selectedPlace.features.map((feat: any, idx: number) => (
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
                        </>
                    )}

                    {/* ========================================================
                        모바일 하단 네비게이션
                    ======================================================== */}
                    {!selectedPlace && (
                        <nav className="lg:hidden absolute bottom-0 left-0 w-full bg-white/95 backdrop-blur-xl border-t border-[#F2F4F6] px-6 py-2.5 pb-safe flex justify-between items-center z-20">
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
                            <button onClick={() => isLoggedIn ? alert('마이페이지 준비중') : router.push('/login')} className="flex flex-col items-center gap-1 text-[#8B95A1] active:scale-95">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                <span className="text-[10px] font-bold">{isLoggedIn ? '마이' : '로그인'}</span>
                            </button>
                        </nav>
                    )}
                </main>
            </div>

            {/* Toast Notification */}
            {toastMessage && (
                <div className="fixed top-16 left-1/2 z-50 bg-[#191F28] text-white px-6 py-3 rounded-full text-[14px] font-bold shadow-lg animate-[toastInOut_3s_ease-in-out_forwards] flex items-center gap-2.5">
                    <svg className="w-5 h-5 text-[#22C55E]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>{toastMessage}</span>
                </div>
            )}
        </div>
    );
}
