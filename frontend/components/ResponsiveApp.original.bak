"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';

import useSWR, { mutate } from 'swr';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/authStore';
import axiosInstance from '../api/axios';
import TermsAndPrivacyModal from './TermsAndPrivacyModal';

const fetcher = async (url: string) => {
    const relativeUrl = url.replace('http://localhost:8080/api/v1', '');
    const res = await axiosInstance.get(relativeUrl);
    return res.data;
};

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

// --- 썸네일 콜라주 (Collage) 생성 함수 ---
const renderFolderCover = (scraps: any[]) => {
    if (!scraps || scraps.length === 0) {
        return (
            <div className="w-full h-full bg-[#F2F4F6] flex items-center justify-center text-[#8B95A1]">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
        );
    }
    
    const imageUrls = scraps.map(s => s.place?.thumbnailUrl || "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=800");
    
    if (imageUrls.length === 1) {
        return (
            <img 
                src={imageUrls[0]} 
                alt="cover" 
                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" 
            />
        );
    }
    
    if (imageUrls.length === 2) {
        return (
            <div className="w-full h-full flex gap-[2px]">
                <img src={imageUrls[0]} className="w-1/2 h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 animate-fade-in" alt="cover 1" />
                <img src={imageUrls[1]} className="w-1/2 h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 animate-fade-in" alt="cover 2" />
            </div>
        );
    }
    
    if (imageUrls.length === 3) {
        return (
            <div className="w-full h-full flex gap-[2px]">
                <div className="w-[60%] h-full overflow-hidden">
                    <img src={imageUrls[0]} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 animate-fade-in" alt="cover 1" />
                </div>
                <div className="w-[40%] h-full flex flex-col gap-[2px]">
                    <div className="h-1/2 overflow-hidden">
                        <img src={imageUrls[1]} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 animate-fade-in" alt="cover 2" />
                    </div>
                    <div className="h-1/2 overflow-hidden">
                        <img src={imageUrls[2]} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 animate-fade-in" alt="cover 3" />
                    </div>
                </div>
            </div>
        );
    }
    
    // 4 or more
    return (
        <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-[2px]">
            <img src={imageUrls[0]} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 animate-fade-in" alt="cover 1" />
            <img src={imageUrls[1]} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 animate-fade-in" alt="cover 2" />
            <img src={imageUrls[2]} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 animate-fade-in" alt="cover 3" />
            <img src={imageUrls[3]} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 animate-fade-in" alt="cover 4" />
        </div>
    );
};

// --- 프리미엄 수제 듀오톤 SVG 아이콘 정의 ---
const CafeIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
        <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z" fill="currentColor" fillOpacity="0.15" />
        <line x1="6" y1="2" x2="6" y2="4" />
        <line x1="10" y1="2" x2="10" y2="4" />
        <line x1="14" y1="2" x2="14" y2="4" />
    </svg>
);

const RestaurantIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 17h20" />
        <path d="M20 17c0-4.418-3.582-8-8-8s-8 3.582-8 8" fill="currentColor" fillOpacity="0.15" />
        <path d="M12 9V6" />
        <circle cx="12" cy="5" r="1.5" fill="currentColor" />
        <path d="M4 17v1a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1" />
    </svg>
);

const StudyIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="12" rx="2" fill="currentColor" fillOpacity="0.15" />
        <path d="M2 16h20v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-2z" />
        <path d="M12 16v4" />
    </svg>
);

const CocktailIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3h18l-9 9z" fill="currentColor" fillOpacity="0.15" />
        <path d="M12 12v9" />
        <path d="M8 21h8" />
        <circle cx="12" cy="7" r="1.5" fill="currentColor" />
    </svg>
);

const SparkleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3c.132 4.318 1.562 6.84 5.3 7.7 0 0-4.312 1.34-5.3 7.7-.09-6.36-5.3-7.7-5.3-7.7 3.738-.86 5.168-3.382 5.3-7.7z" fill="currentColor" fillOpacity="0.15" />
    </svg>
);

// --- 토스 스타일 업종/태그 분석 카테고리 아이콘 헬퍼 ---
const getCategoryIcon = (category: string = '', name: string = '') => {
    const combined = `${category} ${name}`.toLowerCase();
    if (combined.includes('카페') || combined.includes('디저트') || combined.includes('커피') || combined.includes('베이커리')) {
        return { icon: <CafeIcon />, bg: "bg-[#FFF4EE]", text: "text-[#E65C00]" }; // Warm Terracotta/Peach
    }
    if (combined.includes('식당') || combined.includes('맛집') || combined.includes('레스토랑') || combined.includes('푸드') || combined.includes('음식점') || combined.includes('한식') || combined.includes('양식') || combined.includes('일식') || combined.includes('중식') || combined.includes('키친') || combined.includes('테이블')) {
        return { icon: <RestaurantIcon />, bg: "bg-[#FFF0F0]", text: "text-[#E63939]" }; // Warm Coral/Rose
    }
    if (combined.includes('작업') || combined.includes('노트북') || combined.includes('공부') || combined.includes('스터디') || combined.includes('오피스') || combined.includes('서재') || combined.includes('라운지')) {
        return { icon: <StudyIcon />, bg: "bg-[#F0F6F5]", text: "text-[#2E7D7A]" }; // Cozy Sage/Teal
    }
    if (combined.includes('술집') || combined.includes('바') || combined.includes('펍') || combined.includes('와인') || combined.includes('맥주') || combined.includes('이자카야') || combined.includes('주점')) {
        return { icon: <CocktailIcon />, bg: "bg-[#FFF9E6]", text: "text-[#B38000]" }; // Warm Muted Gold
    }
    return { icon: <SparkleIcon />, bg: "bg-[#F7F6F3]", text: "text-[#7F776F]" }; // Warm Sand/Beige
};

const isSpecialTag = (tag: string) => {
    const specialTags = ['노트북하기좋은', '콘센트석', '조용한', '대형카페', '단체석', '공부'];
    return specialTags.includes(tag);
};

const getVibeBadge = (vibeStats: { quiet: number; chatty: number }) => {
    const quiet = vibeStats?.quiet || 0;
    const chatty = vibeStats?.chatty || 0;
    const total = quiet + chatty;
    
    if (total === 0) return null; // 투표가 아예 없을 때 미노출
    
    const quietRatio = quiet / total;
    const chattyRatio = chatty / total;
    
    if (quietRatio >= 0.60) {
        return {
            text: `조용히 집중 (${Math.round(quietRatio * 100)}%)`,
            bg: "bg-[#F0F6F5]/90 text-[#2E7D7A] border-[#D1E6E4]",
            dot: "bg-[#2E7D7A]"
        };
    } else if (chattyRatio >= 0.60) {
        return {
            text: `대화하기 좋은 (${Math.round(chattyRatio * 100)}%)`,
            bg: "bg-[#FFF4EE]/90 text-[#E65C00] border-[#FFD2B8]",
            dot: "bg-[#E65C00]"
        };
    }
    
    return null; // 백중세(60% 미만)일 때는 미노출
};

export default function ResponsiveApp({ initialPlaces }: { initialPlaces: any[] }) {
    const router = useRouter();
    const [activeView, setActiveView] = useState<string>('home');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const authStore = useAuthStore();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [nickname, setNickname] = useState("미나리");
    const [userEmail, setUserEmail] = useState("");
    const [profileImage, setProfileImage] = useState("/profile_cat.png");
    const [showAccountModal, setShowAccountModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);

    // Account Edit States
    const [tempNickname, setTempNickname] = useState("");
    const [selectedImage, setSelectedImage] = useState("");
    const [isNicknameChecked, setIsNicknameChecked] = useState(true);
    const [nicknameCheckMsg, setNicknameCheckMsg] = useState<{ text: string, isSuccess: boolean } | null>(null);

    // Settings States
    const [defaultScrapFolder, setDefaultScrapFolder] = useState("기본 저장소");
    const [appTheme, setAppTheme] = useState("기본 테마");
    const [newThemeNotification, setNewThemeNotification] = useState(true);
    const [plannerNotification, setPlannerNotification] = useState(true);

    // Profile Avatar Customizing States
    const [activeAvatar, setActiveAvatar] = useState('/profile_cat.png');
    const [activeBg, setActiveBg] = useState('default');

    // Profile Avatar Upload & Tab States
    const [avatarTab, setAvatarTab] = useState<'default' | 'upload'>('default');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const getProfileBgClass = (imgUrl: string = '') => {
        if (imgUrl.includes('bg=sage')) return 'bg-[#F0F6F5]';
        if (imgUrl.includes('bg=peach')) return 'bg-[#FFF4EE]';
        if (imgUrl.includes('bg=sand')) return 'bg-[#F7F6F3]';
        if (imgUrl.includes('bg=coral')) return 'bg-[#FFF0F0]';
        if (imgUrl.includes('bg=silver')) return 'bg-[#F2F4F6]';
        if (imgUrl.includes('bg=bluegray')) return 'bg-[#ECEFF2]';
        if (imgUrl.includes('bg=lavender')) return 'bg-[#F1F0F5]';
        return 'bg-white';
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setDefaultScrapFolder(localStorage.getItem("defaultScrapFolder") || "기본 저장소");
            setAppTheme(localStorage.getItem("appTheme") || "기본 테마");
            setNewThemeNotification(localStorage.getItem("newThemeNotification") !== "false");
            setPlannerNotification(localStorage.getItem("plannerNotification") !== "false");
        }
    }, []);

    const handleCheckNickname = async () => {
        if (!tempNickname.trim()) {
            setNicknameCheckMsg({ text: "닉네임을 입력해주세요.", isSuccess: false });
            return;
        }
        if (tempNickname.trim() === nickname) {
            setIsNicknameChecked(true);
            setNicknameCheckMsg({ text: "현재 사용 중인 닉네임입니다.", isSuccess: true });
            return;
        }
        try {
            const res = await axiosInstance.get(`/auth/check-nickname?nickname=${encodeURIComponent(tempNickname.trim())}`);
            if (res.data === true) {
                setIsNicknameChecked(true);
                setNicknameCheckMsg({ text: "사용 가능한 닉네임입니다.", isSuccess: true });
            } else {
                setIsNicknameChecked(false);
                setNicknameCheckMsg({ text: "이미 사용 중인 닉네임입니다.", isSuccess: false });
            }
        } catch (err) {
            console.error("닉네임 중복 확인 실패:", err);
            setNicknameCheckMsg({ text: "중복 확인 중 오류가 발생했습니다.", isSuccess: false });
        }
    };

    const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setTempNickname(val);
        if (val.trim() === nickname) {
            setIsNicknameChecked(true);
            setNicknameCheckMsg(null);
        } else {
            setIsNicknameChecked(false);
            setNicknameCheckMsg(null);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64data = reader.result as string;
                const newUrl = activeBg === 'default' ? base64data : `${base64data}?bg=${activeBg}`;
                setSelectedImage(newUrl);
                showToast("프로필 이미지가 임시로 선택되었습니다. 저장을 누르면 적용됩니다.");
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveProfile = async () => {
        if (!tempNickname.trim()) {
            showToast("닉네임을 입력해주세요.", "warning");
            return;
        }
        if (tempNickname.trim() !== nickname && !isNicknameChecked) {
            showToast("닉네임 중복 확인을 진행해주세요.", "warning");
            return;
        }
        try {
            const res = await axiosInstance.post('/auth/me', {
                nickname: tempNickname.trim(),
                profileImageUrl: selectedImage
            });
            
            setNickname(res.data.nickname);
            setProfileImage(res.data.profileImageUrl || "/profile_cat.png");
            
            authStore.login(res.data.nickname);
            localStorage.setItem("nickname", res.data.nickname);
            
            showToast("프로필이 저장되었습니다.");
            setShowAccountModal(false);
        } catch (err: any) {
            console.error("프로필 수정 실패:", err);
            showToast(err.response?.data?.message || "프로필 수정 중 오류가 발생했습니다.", "error");
        }
    };

    const handleAvatarChange = (avatar: string) => {
        setActiveAvatar(avatar);
        const newUrl = activeBg === 'default' ? avatar : `${avatar}?bg=${activeBg}`;
        setSelectedImage(newUrl);
    };

    const handleBgChange = (bg: string) => {
        setActiveBg(bg);
        const pureImage = selectedImage ? selectedImage.split('?')[0] : activeAvatar;
        const newUrl = bg === 'default' ? pureImage : `${pureImage}?bg=${bg}`;
        setSelectedImage(newUrl);
    };

    const handleSaveSettings = () => {
        localStorage.setItem("defaultScrapFolder", defaultScrapFolder);
        localStorage.setItem("appTheme", appTheme);
        localStorage.setItem("newThemeNotification", String(newThemeNotification));
        localStorage.setItem("plannerNotification", String(plannerNotification));
        showToast("설정이 저장되었습니다.");
        setShowSettingsModal(false);
    };

    useEffect(() => {
        // Hydration mismatch 방지를 위해 클라이언트 마운트 후 Zustand 상태 동기화
        const logged = authStore.isLoggedIn || !!localStorage.getItem("accessToken");
        setIsLoggedIn(logged);
        setNickname(authStore.nickname || localStorage.getItem("nickname") || "미나리");
    }, [authStore.isLoggedIn, authStore.nickname]);

    useEffect(() => {
        if (isLoggedIn) {
            axiosInstance.get('/auth/me')
                .then(res => {
                    if (res.data) {
                        if (res.data.nickname) {
                            setNickname(res.data.nickname);
                            localStorage.setItem("nickname", res.data.nickname);
                        }
                        if (res.data.email) {
                            setUserEmail(res.data.email);
                        }
                        if (res.data.profileImageUrl) {
                            setProfileImage(res.data.profileImageUrl);
                        }
                    }
                })
                .catch(err => {
                    console.error("사용자 정보 조회 실패:", err);
                });
        }
    }, [isLoggedIn]);

    const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
    const [showTermsModal, setShowTermsModal] = useState<'terms' | 'privacy' | null>(null);

    const { data: scrapsData, mutate: mutateScraps } = useSWR(
        isLoggedIn ? 'http://localhost:8080/api/v1/scraps' : null,
        fetcher
    );

    const foldersMap = useMemo(() => {
        if (!scrapsData || !Array.isArray(scrapsData)) return {};
        const map: { [key: string]: any[] } = {};
        scrapsData.forEach((scrap: any) => {
            const folder = scrap.folderName || "기본 저장소";
            if (!map[folder]) map[folder] = [];
            map[folder].push(scrap);
        });
        return map;
    }, [scrapsData]);

    const mapPlaceToData = (place: any) => {
        const tags = place.tags ? place.tags.map((t: any) => t.name) : [];
        const isHiddenGem = false;
        const initialVibe = place.vibeStats || { quiet: 0, chatty: 0 };
        return {
            id: place.id,
            name: place.name,
            location: place.address,
            category: place.category,
            distance: "내 위치에서 " + ((place.id % 10) + 1) + "km",
            imageUrl: place.thumbnailUrl || "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=800",
            aspectRatio: "aspect-[4/5]",
            tags: tags,
            isHiddenGem: isHiddenGem,
            initialVibe: initialVibe,
            description: place.aiMoodSummary || place.category || "공간에 대한 설명이 없습니다.",
            features: [{ icon: "✨", title: "특징", desc: place.category || "매력적인 공간" }],
            bestReview: "정말 분위기가 좋았어요. 강력 추천합니다!",
            isScrapped: place.isScrapped,
            userVotedVibe: place.userVotedVibe ? place.userVotedVibe.toLowerCase() : null
        };
    };

    const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null);

    const showToast = (message: string, type: 'success' | 'warning' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000); // 3초 후 사라짐
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
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [hiddenGemPlace, setHiddenGemPlace] = useState<any | null>(null);
    const [showHiddenGemPopup, setShowHiddenGemPopup] = useState<boolean>(false);
    const [vibeStats, setVibeStats] = useState<{ quiet: number; chatty: number }>({ quiet: 50, chatty: 50 });
    const [userVotedVibe, setUserVotedVibe] = useState<string | null>(null);
    const [isSaved, setIsSaved] = useState(false);
    const [isBookmarkPopping, setIsBookmarkPopping] = useState(false);
    const [showFolderSettings, setShowFolderSettings] = useState(false);
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [renameInputVal, setRenameInputVal] = useState("");
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState("");

    // API 데이터와 디자인에 필요한 더미 속성 매핑
    const placesData = useMemo(() => {
        return currentPlaces.map((place: any) => {
            // 태그 배열 문자열 추출
            const tags = place.tags ? place.tags.map((t: any) => t.name) : [];
            // 시크릿 장소 기능 임시 비활성화
            const isHiddenGem = false; // tags.includes("나만아는");
            // 백엔드에서 받은 vibeStats (없으면 0, 0)
            const initialVibe = place.vibeStats || { quiet: 0, chatty: 0 };
            
            return {
                id: place.id,
                name: place.name,
                location: place.address,
                category: place.category,
                distance: "내 위치에서 " + ((place.id % 10) + 1) + "km",
                imageUrl: place.thumbnailUrl || "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=800",
                aspectRatio: "aspect-[4/5]",
                tags: tags,
                isHiddenGem: isHiddenGem,
                initialVibe: initialVibe,
                description: place.aiMoodSummary || place.category || "공간에 대한 설명이 없습니다.",
                features: [{ icon: "✨", title: "특징", desc: place.category || "매력적인 공간" }],
                bestReview: "정말 분위기가 좋았어요. 강력 추천합니다!",
                isScrapped: place.isScrapped,
                userVotedVibe: place.userVotedVibe ? place.userVotedVibe.toLowerCase() : null
            };
        });
    }, [currentPlaces]);

    const toggleTag = (tag: string) => {
        setSelectedTags(prev => prev.includes(tag) ? prev.filter((t: string) => t !== tag) : [...prev, tag]);
    };

    const filteredPlaces = useMemo(() => {
        let result = placesData;
        if (searchKeyword.trim() !== "") {
            const k = searchKeyword.toLowerCase();
            result = result.filter((p: any) => 
                p.name.toLowerCase().includes(k) || 
                p.description.toLowerCase().includes(k) || 
                p.tags.some((t: string) => t.toLowerCase().includes(k)) ||
                (p.location && p.location.toLowerCase().includes(k))
            );
        }
        return result;
    }, [placesData, searchKeyword]);

    const handlePlaceClick = (place: any) => {
        if (place.isHiddenGem) {
            setHiddenGemPlace(place);
            setShowHiddenGemPopup(true);
        } else {
            setSelectedPlace(place);
            setVibeStats(place.initialVibe);
            setIsSaved(!!place.isScrapped); // 백엔드에서 받은 스크랩 상태로 초기화
            setUserVotedVibe(place.userVotedVibe || null); // 유저의 기존 투표 상태 초기화
            setIsDetailOpen(true);
        }
    };

    const handleCloseDetail = () => {
        setSelectedPlace(null);
        setUserVotedVibe(null);
        setIsDetailOpen(false);
    };

    const handleCardSaveClick = async (place: any, e: React.MouseEvent) => {
        e.stopPropagation(); // 카드 클릭(상세 열기) 방지!
        if (!isLoggedIn) {
            showToast("로그인이 필요한 기능입니다.", "warning");
            return;
        }
        
        setSelectedPlace(place);
        setIsDetailOpen(false); // 상세 모달은 닫아둠
        setIsSaved(!!place.isScrapped);

        if (place.isScrapped) {
            // 이미 스크랩된 상태면 바로 취소
            try {
                await axiosInstance.delete(`/scraps/${place.id}`);
                setIsSaved(false);
                showToast("북마크가 해제되었습니다.");
                mutate((key: any) => typeof key === 'string' && (key.includes('/places') || key.includes('/scraps')));
            } catch (err) {
                console.error(err);
                showToast("북마크 해제 중 오류가 발생했습니다.", "error");
            }
        } else {
            setIsCreatingFolder(false);
            setNewFolderName("");
            setShowFolderModal(true); // 폴더 선택 모달 오픈
        }
    };

    const handleVibeVote = async (type: string) => {
        if (!isLoggedIn) {
            showToast("로그인이 필요한 기능입니다.", "warning");
            return;
        }
        if (!selectedPlace) return;
        
        // 이미 같은 것에 투표했다면 무시 (UI에서 시각적으로 표시)
        if (userVotedVibe === type) return;
        
        try {
            const apiType = type === 'quiet' ? 'QUIET' : 'CHATTY';
            await axiosInstance.post(`/places/${selectedPlace.id}/vibe?type=${apiType}`);
            
            const previousVote = userVotedVibe;
            setUserVotedVibe(type);
            
            // 로컬 상태 즉시 업데이트 (사용자 경험 향상)
            setVibeStats(prev => {
                if (previousVote) {
                    return {
                        quiet: type === 'quiet' ? prev.quiet + 1 : prev.quiet - 1,
                        chatty: type === 'chatty' ? prev.chatty + 1 : prev.chatty - 1
                    };
                }
                if (type === 'quiet') return { ...prev, quiet: prev.quiet + 1 };
                return { ...prev, chatty: prev.chatty + 1 };
            });
            
            // 서버 데이터 동기화
            mutate((key: any) => typeof key === 'string' && key.includes('/places'));
        } catch (error: any) {
            console.error("투표 처리 실패:", error);
            if (error.response?.status === 400) {
                showToast("투표 처리 중 문제가 발생했습니다.", "warning");
            } else if (error.response?.status === 401) {
                showToast("로그인이 필요한 기능입니다.", "warning");
            } else {
                showToast("투표 처리 중 오류가 발생했습니다.", "error");
            }
        }
    };

    const [showFolderModal, setShowFolderModal] = useState(false);
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");

    const closeFolderModal = () => {
        setShowFolderModal(false);
        if (!isDetailOpen) {
            setSelectedPlace(null);
        }
    };

    const handleSaveClick = () => {
        if (!selectedPlace) return;
        if (!isLoggedIn) {
            showToast("로그인이 필요한 기능입니다.", "warning");
            return;
        }

        if (isSaved) {
            // 이미 스크랩된 상태면 바로 취소
            executeScrap(null, true);
        } else {
            // 스크랩 안된 상태면 폴더 선택 모달 띄우기
            setIsCreatingFolder(false);
            setNewFolderName("");
            setShowFolderModal(true);
        }
    };

    const executeScrap = async (folderName: string | null = "기본 저장소", isDelete: boolean = false) => {
        try {
            if (isDelete) {
                await axiosInstance.delete(`/scraps/${selectedPlace.id}`);
                setIsSaved(false);
                showToast("북마크가 해제되었습니다.");
            } else {
                const encodedFolder = encodeURIComponent(folderName || "기본 저장소");
                await axiosInstance.post(`/scraps/${selectedPlace.id}?folderName=${encodedFolder}`);
                setIsSaved(true);
                setIsBookmarkPopping(true);
                closeFolderModal();
                showToast(`"${folderName || '기본 저장소'}"에 저장되었습니다.`);
                setTimeout(() => setIsBookmarkPopping(false), 500);
            }
            mutate((key: any) => typeof key === 'string' && (key.includes('/places') || key.includes('/scraps')));
        } catch (error: any) {
            console.error("스크랩 처리 실패:", error);
            if (error.response?.status === 401) {
                showToast("로그인이 필요한 기능입니다.", "warning");
            } else if (error.response?.status === 400) {
                showToast("이미 처리된 요청입니다.", "warning");
                setIsSaved(true);
                mutate((key: any) => typeof key === 'string' && (key.includes('/places') || key.includes('/scraps')));
                closeFolderModal();
            } else {
                showToast("스크랩 처리 중 오류가 발생했습니다.", "error");
            }
        }
    };

    const handleRenameFolder = async () => {
        if (!selectedFolder || !renameInputVal.trim()) return;
        if (renameInputVal.trim() === selectedFolder) {
            setShowRenameModal(false);
            return;
        }
        try {
            const oldFolder = encodeURIComponent(selectedFolder);
            const newFolder = encodeURIComponent(renameInputVal.trim());
            await axiosInstance.put(`/scraps/folders?oldFolderName=${oldFolder}&newFolderName=${newFolder}`);
            showToast("폴더 이름이 변경되었습니다.");
            setSelectedFolder(renameInputVal.trim());
            setShowRenameModal(false);
            mutateScraps();
            mutate((key: any) => typeof key === 'string' && (key.includes('/places') || key.includes('/scraps')));
        } catch (error: any) {
            console.error("폴더 이름 변경 실패:", error);
            showToast("폴더 이름 변경 중 오류가 발생했습니다.", "error");
        }
    };

    const handleDeleteFolder = async () => {
        if (!selectedFolder) return;
        try {
            const folder = encodeURIComponent(selectedFolder);
            await axiosInstance.delete(`/scraps/folders?folderName=${folder}`);
            showToast("폴더가 삭제되었습니다.");
            setSelectedFolder(null);
            setShowDeleteConfirmModal(false);
            mutateScraps();
            mutate((key: any) => typeof key === 'string' && (key.includes('/places') || key.includes('/scraps')));
        } catch (error: any) {
            console.error("폴더 삭제 실패:", error);
            showToast("폴더 삭제 중 오류가 발생했습니다.", "error");
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

        @keyframes bookmark-pop {
          0% { transform: scale(1); }
          40% { transform: scale(1.3) rotate(-8deg); }
          70% { transform: scale(0.95) rotate(3deg); }
          100% { transform: scale(1) rotate(0); }
        }
        .animate-bookmark-pop {
          animation: bookmark-pop 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        
        .fade-edges {
          -webkit-mask-image: linear-gradient(to right, transparent, black 20px, black calc(100% - 20px), transparent);
          mask-image: linear-gradient(to right, transparent, black 20px, black calc(100% - 20px), transparent);
        }

        @keyframes toastInOut {
          0% { transform: translate(-50%, -100%); opacity: 0; }
          10% { transform: translate(-50%, 0); opacity: 1; }
          90% { transform: translate(-50%, 0); opacity: 1; }
          100% { transform: translate(-50%, -100%); opacity: 0; }
        }

        /* --- 테마 및 다크 모드에 따른 글로벌 CSS 오버라이드 --- */
        .transition-theme-all {
          transition: background-color 0.4s ease, border-color 0.4s ease, color 0.4s ease, shadow 0.4s ease;
        }

        /* 2. Sage Green Theme */
        .theme-sage-active {
            background-color: #E9F1EF !important;
        }
        .theme-sage-active aside, .theme-sage-active main, .theme-sage-active .bg-white, .theme-sage-active article {
            background-color: #F4F8F7 !important;
            border-color: #DDE8E5 !important;
        }
        .theme-sage-active .bg-\[\#F9FAFB\], .theme-sage-active .bg-\[\#F2F4F6\] {
            background-color: #EBF2F0 !important;
            border-color: #D6E4E1 !important;
        }
        .theme-sage-active .border-\[\#F2F4F6\], .theme-sage-active .border-\[\#E5E8EB\] {
            border-color: #D6E4E1 !important;
        }

        /* 3. Cozy Sand Theme */
        .theme-sand-active {
            background-color: #EFEFEA !important;
        }
        .theme-sand-active aside, .theme-sand-active main, .theme-sand-active .bg-white, .theme-sand-active article {
            background-color: #FAF9F6 !important;
            border-color: #EBEAE4 !important;
        }
        .theme-sand-active .bg-\[\#F9FAFB\], .theme-sand-active .bg-\[\#F2F4F6\] {
            background-color: #F1EFEA !important;
            border-color: #E2E0D5 !important;
        }
        .theme-sand-active .border-\[\#F2F4F6\], .theme-sand-active .border-\[\#E5E8EB\] {
            border-color: #E2E0D5 !important;
        }

        /* 4. Warm Coral Theme */
        .theme-coral-active {
            background-color: #FEEFEF !important;
        }
        .theme-coral-active aside, .theme-coral-active main, .theme-coral-active .bg-white, .theme-coral-active article {
            background-color: #FFFAFA !important;
            border-color: #FCDDDD !important;
        }
        .theme-coral-active .bg-\[\#F9FAFB\], .theme-coral-active .bg-\[\#F2F4F6\] {
            background-color: #FFF0F0 !important;
            border-color: #FAD0D0 !important;
        }
        .theme-coral-active .border-\[\#F2F4F6\], .theme-coral-active .border-\[\#E5E8EB\] {
            border-color: #FAD0D0 !important;
        }
      `}} />

            {/* --- 1440px 중앙 정렬 랩퍼 (모바일에서는 max-w-[480px]) --- */}
            <div className={`w-full max-w-[480px] lg:max-w-[1440px] h-full relative shadow-2xl flex flex-col lg:flex-row border-x border-gray-200 overflow-hidden transition-theme-all ${
                appTheme === '세이지 그린' ? 'theme-sage-active' :
                appTheme === '차분한 샌드' ? 'theme-sand-active' :
                appTheme === '웜 코랄' ? 'theme-coral-active' : ''
            }`}>

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
                        <button onClick={() => { setActiveView('collection'); setSelectedFolder(null); setSelectedPlace(null); }} className={`flex items-center gap-4 px-5 py-4 rounded-[16px] transition-colors font-bold text-[16px] ${activeView === 'collection' ? 'bg-[#F2F4F6] text-[#191F28]' : 'text-[#6B7684] hover:bg-[#F9FAFB] hover:text-[#191F28]'}`}>
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
                                <button onClick={() => setActiveView('mypage')} className={`flex items-center gap-4 w-full p-4 rounded-[16px] hover:bg-[#F9FAFB] active:bg-[#F2F4F6] transition-colors group ${activeView === 'mypage' ? 'bg-[#F2F4F6]' : ''}`}>
                                    <div className={`w-10 h-10 rounded-full overflow-hidden shrink-0 border border-orange-100 transition-colors duration-300 ${getProfileBgClass(profileImage)}`}>
                                        <img src={profileImage || "/profile_cat.png"} alt="profile" className="w-full h-full object-cover" />
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
                            <div className="flex-1 w-full lg:max-w-[720px] h-full overflow-y-auto no-scrollbar flex flex-col bg-[#F9FAFB] animate-fade-in relative lg:border-r lg:border-[#F2F4F6]">

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
                                        ) : placesData.map((place: any) => {
                                            const iconData = getCategoryIcon(place.category || place.features?.[0]?.desc || '', place.name);
                                            return (
                                                <article 
                                                    key={place.id} 
                                                    onClick={() => handlePlaceClick(place)} 
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
                                                            onClick={(e) => handleCardSaveClick(place, e)}
                                                            className="w-9 h-9 rounded-full bg-[#F2F4F6] hover:bg-[#E5E8EB] active:scale-90 transition-all flex items-center justify-center text-[#8B95A1] hover:text-orange-500 shrink-0"
                                                        >
                                                            <svg className={`w-[18px] h-[18px] ${place.isScrapped ? 'text-orange-500 fill-current' : 'text-[#8B95A1]'}`} fill={place.isScrapped ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
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
                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
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
                                        <span onClick={() => setShowTermsModal('terms')} className="cursor-pointer hover:underline">이용약관</span>
                                        <span onClick={() => setShowTermsModal('privacy')} className="cursor-pointer hover:underline font-bold text-[#4E5968]">개인정보처리방침</span>
                                    </p>
                                </div>
                            </div>
                        </>
                    )}

                    {/* --- B. EXPLORE VIEW --- */}
                    {activeView === 'explore' && (
                        <div className="flex-1 h-full w-full overflow-y-auto no-scrollbar bg-[#F9FAFB] animate-slide-in-right lg:animate-fade-in flex flex-col absolute lg:relative inset-0 z-30 lg:z-auto items-center">
                            
                            {/* 모바일 헤더 */}
                            <header className="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#F2F4F6] px-2 py-4 flex items-center w-full shadow-sm">
                                <button onClick={() => setActiveView('home')} className="w-12 h-12 flex items-center justify-center text-[#191F28] active:scale-90 relative z-50">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
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
                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
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
                                                    onClick={() => handlePlaceClick(place)} 
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
                                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
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
                                                                    <svg className="w-3.5 h-3.5 text-[#B0B8C1] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
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
                                                                    onClick={(e) => handleCardSaveClick(place, e)}
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
                                                        {place.bestReview && (
                                                            <div className="bg-[#FAF9F6] border border-[#F2ECE5] p-4 rounded-[16px] text-[13px] text-[#5A4F43] flex items-start gap-3 relative overflow-hidden">
                                                                <div className="w-5 h-5 rounded-full bg-[#FFF0E6] flex items-center justify-center text-orange-500 font-serif text-[15px] select-none mt-0.5 shrink-0">
                                                                    “
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-[10px] font-bold text-orange-500/90 tracking-widest uppercase mb-0.5">Editor's Pick Review</p>
                                                                    <p className="line-clamp-1 font-semibold text-[#4E4338]">
                                                                        {place.bestReview}
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
                                                                        <svg className="w-4 h-4 text-[#B0B8C1] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
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
                                                                        onClick={(e) => handleCardSaveClick(place, e)}
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
                                                        {place.bestReview && (
                                                            <div className="mt-6 bg-[#FAF9F6] border border-[#F2ECE5] px-5 py-4 rounded-[18px] text-[13.5px] text-[#5A4F43] flex items-start gap-3.5 relative overflow-hidden select-none">
                                                                <div className="w-6 h-6 rounded-full bg-[#FFF0E6] flex items-center justify-center text-orange-500 font-serif text-[18px] select-none mt-0.5 shrink-0">
                                                                    “
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-[11px] font-bold text-orange-500/90 tracking-widest uppercase mb-1">Editor's Pick Review</p>
                                                                    <p className="line-clamp-1 font-semibold text-[#4E4338] leading-relaxed">
                                                                        {place.bestReview}
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
                                                <svg className="w-12 h-12 lg:w-16 lg:h-16 mx-auto mb-4 lg:mb-6 text-[#D1D6DB]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                <p className="font-medium text-[15px] lg:text-[16px] text-[#4E5968]">선택하신 조건의 공간이 없습니다.</p>
                                                <button onClick={() => { setSelectedTags([]); setSearchKeyword(""); }} className="mt-4 lg:mt-6 px-5 py-2.5 lg:px-6 lg:py-3 bg-[#191F28] text-white rounded-[12px] font-bold text-[13px] lg:text-[14px] hover:bg-black transition-colors shadow-sm">초기화하기</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- D. COLLECTION VIEW --- */}
                    {activeView === 'collection' && (
                        <div className="flex-1 h-full w-full overflow-y-auto no-scrollbar bg-[#F9FAFB] animate-slide-in-right lg:animate-fade-in flex flex-col absolute lg:relative inset-0 z-30 lg:z-auto items-center">
                            
                            {/* 헤더 */}
                            <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-[#F2F4F6]/50 px-6 py-4 lg:px-10 lg:py-8 flex items-center w-full justify-between shrink-0">
                                <div className="flex items-center gap-3">
                                    {selectedFolder ? (
                                        <button 
                                            onClick={() => setSelectedFolder(null)}
                                            className="w-10 h-10 rounded-full bg-[#F2F4F6] hover:bg-[#E5E8EB] flex items-center justify-center text-[#4E5968] active:scale-95 transition-all mr-1"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => setActiveView('home')}
                                            className="lg:hidden w-10 h-10 rounded-full bg-[#F2F4F6] hover:bg-[#E5E8EB] flex items-center justify-center text-[#4E5968] active:scale-95 transition-all mr-1"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </button>
                                    )}
                                    <div className="flex flex-col">
                                        {selectedFolder ? (
                                            <>
                                                <div className="hidden lg:flex items-center gap-1.5 text-[13px] font-bold text-[#8B95A1] mb-1">
                                                    <span>내 컬렉션</span>
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                                                    <span className="text-[#4E5968]">{selectedFolder}</span>
                                                </div>
                                                <h1 className="font-bold text-[20px] lg:text-[28px] tracking-tight text-[#191F28]">{selectedFolder}</h1>
                                            </>
                                        ) : (
                                            <h1 className="font-bold text-[20px] lg:text-[28px] tracking-tight text-[#191F28]">내 컬렉션</h1>
                                        )}
                                    </div>
                                </div>
                                {isLoggedIn && !selectedFolder && scrapsData && Array.isArray(scrapsData) && Object.keys(foldersMap).length > 0 && (
                                    <span className="text-[13px] lg:text-[14px] font-bold text-orange-500 bg-orange-50 border border-orange-100 px-3.5 py-1.5 rounded-[10px]">
                                        총 {Object.keys(foldersMap).length}개의 폴더
                                    </span>
                                )}
                                {selectedFolder && foldersMap[selectedFolder] && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-[13px] lg:text-[14px] font-bold text-orange-500 bg-orange-50 border border-orange-100 px-3.5 py-1.5 rounded-[10px]">
                                            공간 {foldersMap[selectedFolder].length}개
                                        </span>
                                        {selectedFolder !== "기본 저장소" && (
                                            <div className="relative">
                                                <button 
                                                    onClick={() => setShowFolderSettings(!showFolderSettings)}
                                                    className="w-10 h-10 rounded-full flex items-center justify-center text-[#8B95A1] hover:text-[#191F28] hover:bg-[#F2F4F6] transition-colors"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                                    </svg>
                                                </button>
                                                
                                                {showFolderSettings && (
                                                    <>
                                                        <div className="fixed inset-0 z-30" onClick={() => setShowFolderSettings(false)}></div>
                                                        <div className="absolute right-0 mt-2 w-40 bg-white border border-[#E5E8EB] rounded-[16px] shadow-lg py-2 z-40 animate-scale-up">
                                                            <button 
                                                                onClick={() => {
                                                                    setShowFolderSettings(false);
                                                                    setRenameInputVal(selectedFolder);
                                                                    setShowRenameModal(true);
                                                                }}
                                                                className="flex items-center gap-2.5 w-full px-4 py-3 text-left font-bold text-[14px] text-[#4E5968] hover:bg-[#F9FAFB] hover:text-[#191F28] transition-colors"
                                                            >
                                                                ✏️ 이름 변경
                                                            </button>
                                                            <button 
                                                                onClick={() => {
                                                                    setShowFolderSettings(false);
                                                                    setShowDeleteConfirmModal(true);
                                                                }}
                                                                className="flex items-center gap-2.5 w-full px-4 py-3 text-left font-bold text-[14px] text-red-500 hover:bg-red-50 transition-colors"
                                                            >
                                                                🗑️ 폴더 삭제
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </header>

                            <div className="w-full lg:max-w-[880px] px-5 py-6 lg:px-8 lg:py-10 flex-1 flex flex-col pb-[100px] lg:pb-24">
                                {!isLoggedIn ? (
                                    /* 비로그인 유도 CTA */
                                    <div className="flex-1 flex flex-col items-center justify-center text-center py-10 lg:py-20 animate-fade-in">
                                        <div className="relative w-36 h-36 flex items-center justify-center mb-8">
                                            <div className="absolute inset-0 bg-orange-500/10 rounded-full blur-[30px] animate-[glow-pulse_3s_ease-in-out_infinite]"></div>
                                            <svg className="w-16 h-16 text-orange-500/90 drop-shadow-[0_0_12px_rgba(249,115,22,0.35)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                            </svg>
                                        </div>
                                        <h2 className="text-[22px] lg:text-[26px] font-bold tracking-tight text-[#191F28] mb-3">나만의 감성 공간을 채워보세요</h2>
                                        <p className="text-[14px] lg:text-[15px] text-[#8B95A1] font-medium leading-relaxed max-w-[320px] mb-8">
                                            로그인하고 마음에 드는 공간들을<br />나만의 폴더로 간직할 수 있습니다.
                                        </p>
                                        <button onClick={() => router.push('/login')} className="bg-[#191F28] hover:bg-black text-white font-bold text-[15px] px-7 py-4 rounded-[16px] transition-all active:scale-[0.98] shadow-md">
                                            로그인하고 시작하기
                                        </button>
                                    </div>
                                ) : !scrapsData ? (
                                    /* 로딩 스켈레톤 */
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                                        {[1, 2, 3].map((n) => (
                                            <div key={n} className="flex flex-col">
                                                <div className="aspect-[4/3] rounded-[24px] bg-[#E5E8EB]"></div>
                                                <div className="h-5 bg-[#E5E8EB] w-2/3 rounded-md mt-4"></div>
                                                <div className="h-4 bg-[#E5E8EB] w-1/3 rounded-md mt-2"></div>
                                            </div>
                                        ))}
                                    </div>
                                ) : Object.keys(foldersMap).length === 0 ? (
                                    /* 저장된 공간 없음 Empty State */
                                    <div className="flex-1 flex flex-col items-center justify-center text-center py-12 lg:py-24 animate-fade-in">
                                        <div className="w-20 h-20 rounded-full bg-[#F2F4F6] flex items-center justify-center text-[#D1D6DB] mb-6">
                                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                            </svg>
                                        </div>
                                        <h3 className="font-bold text-[18px] text-[#191F28] mb-2">저장한 공간이 아직 없습니다</h3>
                                        <p className="text-[13.5px] text-[#8B95A1] font-medium leading-relaxed max-w-[280px] mb-6">
                                            발견 피드에서 마음에 드는 공간에<br />북마크를 눌러 폴더를 채워보세요.
                                        </p>
                                        <button onClick={() => setActiveView('home')} className="bg-[#191F28] hover:bg-black text-white font-bold text-[14px] px-6 py-3 rounded-[12px] transition-colors shadow-sm">
                                            피드 보러 가기
                                        </button>
                                    </div>
                                ) : !selectedFolder ? (
                                    /* 폴더 리스트 메인 뷰 */
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 animate-fade-in">
                                        {Object.keys(foldersMap)
                                            .sort((a, b) => {
                                                if (a === "기본 저장소") return -1;
                                                if (b === "기본 저장소") return 1;
                                                return a.localeCompare(b);
                                            })
                                            .map((folderName) => {
                                                const scrapsInFolder = foldersMap[folderName];
                                                
                                                return (
                                                    <div 
                                                        key={folderName} 
                                                        onClick={() => setSelectedFolder(folderName)}
                                                        className="group cursor-pointer flex flex-col animate-scale-up"
                                                    >
                                                        <div className="relative aspect-[4/3] rounded-[24px] overflow-hidden bg-[#F2F4F6] shadow-sm border border-[#F2F4F6]/50">
                                                            {renderFolderCover(scrapsInFolder)}
                                                            <div className="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors"></div>
                                                            
                                                            {scrapsInFolder.length > 1 && (
                                                                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-[10px] text-[11px] font-bold text-[#4E5968] shadow-sm border border-white/20">
                                                                    +{scrapsInFolder.length - 1}개
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="mt-4 px-1">
                                                            <h3 className="font-bold text-[16px] lg:text-[18px] text-[#191F28] tracking-tight group-hover:text-orange-500 transition-colors line-clamp-1">{folderName}</h3>
                                                            <p className="text-[12.5px] text-[#8B95A1] font-semibold mt-0.5">{scrapsInFolder.length}개의 공간</p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                ) : (
                                    /* 폴더 상세 뷰 (Masonry grid 스타일) */
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6 animate-fade-in">
                                        {foldersMap[selectedFolder]?.map((scrap: any) => {
                                            const placeData = mapPlaceToData(scrap.place);
                                            return (
                                                <article 
                                                    key={scrap.scrapId} 
                                                    onClick={() => handlePlaceClick(placeData)}
                                                    className="group cursor-pointer relative flex flex-col bg-white rounded-[24px] border border-[#F2F4F6] overflow-hidden shadow-sm hover:shadow-md transition-all animate-scale-up"
                                                >
                                                    <div className="relative aspect-[4/5] overflow-hidden bg-[#F2F4F6]">
                                                        <img 
                                                            src={placeData.imageUrl} 
                                                            alt={placeData.name} 
                                                            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" 
                                                        />
                                                        
                                                        {/* Floating Unscrap Button */}
                                                        <button 
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                try {
                                                                    await axiosInstance.delete(`/scraps/${placeData.id}`);
                                                                    showToast("북마크가 해제되었습니다.");
                                                                    mutateScraps();
                                                                    mutate((key: any) => typeof key === 'string' && (key.includes('/places') || key.includes('/scraps')));
                                                                } catch (err) {
                                                                    console.error(err);
                                                                    showToast("북마크 해제 중 오류가 발생했습니다.", "error");
                                                                }
                                                            }}
                                                            className="absolute top-3.5 right-3.5 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-[#F97316] shadow-sm border border-white/20 active:scale-90 hover:scale-105 transition-transform z-10"
                                                        >
                                                            <svg className="w-4 h-4 text-[#F97316]" fill="currentColor" viewBox="0 0 24 24">
                                                                <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                    
                                                    <div className="p-4 flex flex-col flex-1">
                                                        <h4 className="font-bold text-[15px] lg:text-[16px] text-[#191F28] tracking-tight line-clamp-1 group-hover:text-orange-500 transition-colors">{placeData.name}</h4>
                                                        <p className="text-[12px] text-[#8B95A1] font-semibold mt-1 line-clamp-1">{placeData.location}</p>
                                                        
                                                        {placeData.tags.length > 0 && (
                                                            <div className="flex flex-wrap gap-1.5 mt-3">
                                                                {placeData.tags.slice(0, 2).map((t: string) => (
                                                                    <span key={t} className="px-2.5 py-1 rounded-[8px] bg-[#F2F4F6] text-[#4E5968] text-[11.5px] font-bold tracking-tight">
                                                                        #{t}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </article>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* --- E. MY PAGE VIEW --- */}
                    {activeView === 'mypage' && (
                        <div className="flex-1 h-full w-full overflow-y-auto no-scrollbar bg-[#F9FAFB] animate-slide-in-right lg:animate-fade-in flex flex-col absolute lg:relative inset-0 z-30 lg:z-auto items-center">
                            
                            {/* 헤더 */}
                            <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-[#F2F4F6]/50 px-6 py-4 lg:px-10 lg:py-8 flex items-center w-full justify-between shrink-0">
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={() => setActiveView('home')}
                                        className="lg:hidden w-10 h-10 rounded-full bg-[#F2F4F6] hover:bg-[#E5E8EB] flex items-center justify-center text-[#4E5968] active:scale-95 transition-all mr-1"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <h1 className="font-bold text-[20px] lg:text-[28px] tracking-tight text-[#191F28]">마이페이지</h1>
                                </div>
                            </header>

                            <div className="w-full lg:max-w-[800px] px-5 lg:px-8 py-6 lg:py-10 flex-1 flex flex-col gap-6 lg:gap-8 pb-[120px]">
                                {/* 1. 프로필 카드 */}
                                <div className="bg-white rounded-[28px] lg:rounded-[32px] p-6 lg:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.015)] border border-[#F2F4F6] flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl"></div>
                                    <div className={`w-20 h-20 lg:w-24 lg:h-24 rounded-full overflow-hidden shrink-0 border-4 border-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-colors duration-300 ${getProfileBgClass(profileImage)}`}>
                                        <img src={profileImage ? profileImage.split('?')[0] : "/profile_cat.png"} alt="profile" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 text-center sm:text-left">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1.5 justify-center sm:justify-start">
                                            <h2 className="text-[22px] lg:text-[26px] font-extrabold text-[#191F28] tracking-tight">{nickname}</h2>
                                            <span className="self-center px-2.5 py-1 rounded-[8px] bg-[#F0F6F5] text-[#2E7D7A] border border-[#D1E6E4]/50 text-[11px] font-bold">취향 탐험가</span>
                                        </div>
                                        <p className="text-[14px] font-medium text-[#8B95A1] leading-relaxed">나만의 특별한 무드를 담은 취향 저장소를 만들고 있습니다.</p>
                                    </div>
                                </div>

                                {/* 2. 내 취향 & 픽플 대시보드 통합 컴포넌트 */}
                                <div className="bg-white rounded-[28px] lg:rounded-[32px] p-6 lg:p-8 border border-[#F2F4F6] shadow-sm flex flex-col gap-6 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/[0.02] rounded-full blur-3xl pointer-events-none"></div>
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F2F4F6]">
                                        <div>
                                            <span className="px-2.5 py-1 rounded-[8px] bg-[#F0F6F5] text-[#2E7D7A] text-[11px] font-bold tracking-tight border border-[#D1E6E4]/50">활동 및 보관함 분석</span>
                                            <h3 className="font-extrabold text-[19px] text-[#191F28] mt-1.5 tracking-tight">내 취향 & 픽플 대시보드</h3>
                                        </div>
                                        <button 
                                            onClick={() => { setActiveView('collection'); setSelectedFolder(null); }}
                                            className="bg-[#F9FAFB] hover:bg-[#F2F4F6] active:scale-[0.98] text-[#4E5968] font-bold text-[13px] px-4 py-2.5 rounded-[12px] transition-all flex items-center gap-1.5 shrink-0 self-start sm:self-center"
                                        >
                                            <span>내 컬렉션 전체보기</span>
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                        </button>
                                    </div>

                                    {/* 2단 구성: 요약 스탯 + 무드 분석 */}
                                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                                        {/* 왼쪽: 저장소 요약 (2칸) */}
                                        <div className="md:col-span-2 flex flex-col justify-between gap-4 bg-[#F9FAFB] rounded-[24px] p-5 border border-[#F2F4F6]">
                                            <div>
                                                <h4 className="font-bold text-[14px] text-[#191F28] mb-1">저장소 요약</h4>
                                                <p className="text-[12px] text-[#8B95A1]">북마크한 공간 및 폴더 개수</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 my-2">
                                                <div className="bg-white rounded-[16px] p-3 text-center border border-[#F2F4F6] shadow-sm cursor-pointer hover:border-orange-200 transition-colors" onClick={() => { setActiveView('collection'); setSelectedFolder(null); }}>
                                                    <p className="text-[11px] text-[#8B95A1] font-bold mb-0.5">총 북마크</p>
                                                    <p className="text-[22px] font-extrabold text-[#191F28]">{scrapsData?.length || 0}</p>
                                                </div>
                                                <div className="bg-white rounded-[16px] p-3 text-center border border-[#F2F4F6] shadow-sm cursor-pointer hover:border-orange-200 transition-colors" onClick={() => { setActiveView('collection'); setSelectedFolder(null); }}>
                                                    <p className="text-[11px] text-[#8B95A1] font-bold mb-0.5">폴더 개수</p>
                                                    <p className="text-[22px] font-extrabold text-orange-500">{Object.keys(foldersMap).length}</p>
                                                </div>
                                            </div>
                                            <div className="text-[11.5px] text-[#8B95A1] leading-relaxed font-semibold">
                                                💡 공간을 북마크할 때 폴더별로 구분하면 나중에 장소들을 더 쉽게 관리할 수 있어요!
                                            </div>
                                        </div>

                                        {/* 오른쪽: 선호 무드 분석 (3칸) */}
                                        <div className="md:col-span-3 flex flex-col justify-between gap-4">
                                            <div>
                                                <h4 className="font-bold text-[14px] text-[#191F28] mb-1">선호 무드 분석</h4>
                                                <p className="text-[12px] text-[#8B95A1]">최근 1개월 동안 수집된 개인 취향 통계</p>
                                            </div>
                                            <div className="flex flex-col gap-3.5 my-2">
                                                <div>
                                                    <div className="flex justify-between items-center text-[12px] font-bold mb-1">
                                                        <span className="text-[#2E7D7A] flex items-center gap-1">🌲 #코지한 / #조용한 (집중)</span>
                                                        <span className="text-[#2E7D7A]">62%</span>
                                                    </div>
                                                    <div className="w-full h-2 bg-[#F0F6F5] rounded-full overflow-hidden">
                                                        <div className="h-full bg-[#2E7D7A] rounded-full" style={{ width: '62%' }}></div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="flex justify-between items-center text-[12px] font-bold mb-1">
                                                        <span className="text-[#C67A5A] flex items-center gap-1">☕ #디저트맛집 / #대형카페 (대화)</span>
                                                        <span className="text-[#C67A5A]">38%</span>
                                                    </div>
                                                    <div className="w-full h-2 bg-[#FAF0EB] rounded-full overflow-hidden">
                                                        <div className="h-full bg-[#C67A5A] rounded-full" style={{ width: '38%' }}></div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-[12px] text-[#4E5968] font-bold flex items-center justify-between pt-3 border-t border-[#F2F4F6]">
                                                <span>대표 획득 뱃지</span>
                                                <span className="px-2.5 py-1 rounded-[6px] bg-[#F0F6F5] text-[#2E7D7A] border border-[#D1E6E4]/50">조용한 탐험가 🌲</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 하단: 무드 뱃지 획득 리스트 */}
                                    <div className="mt-4 pt-5 border-t border-[#F2F4F6]">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="font-bold text-[14px] text-[#191F28]">내 무드 뱃지 업적</h4>
                                            <span className="text-[11.5px] text-[#8B95A1] font-semibold">활동에 따라 다양한 뱃지가 해금됩니다</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="bg-[#F0F6F5] border border-[#D1E6E4] rounded-[20px] p-3.5 flex flex-col items-center text-center transition-transform hover:-translate-y-0.5 duration-300">
                                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[20px] shadow-sm mb-2">
                                                    🌲
                                                </div>
                                                <p className="font-bold text-[12.5px] text-[#2E7D7A] mb-0.5">조용한 탐험가</p>
                                                <span className="text-[10px] text-[#5C9E9B] font-bold">해금 완료</span>
                                            </div>

                                            <div className="bg-[#FAF0EB] border border-[#EAD5C3] rounded-[20px] p-3.5 flex flex-col items-center text-center transition-transform hover:-translate-y-0.5 duration-300">
                                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[20px] shadow-sm mb-2">
                                                    ☕
                                                </div>
                                                <p className="font-bold text-[12.5px] text-[#C67A5A] mb-0.5">카페 마스터</p>
                                                <span className="text-[10px] text-[#D48F70] font-bold">해금 완료</span>
                                            </div>

                                            <div className="bg-[#F7F6F3] border border-[#E8E6E1] rounded-[20px] p-3.5 flex flex-col items-center text-center relative overflow-hidden transition-transform hover:-translate-y-0.5 duration-300">
                                                <div className="absolute inset-0 bg-black/[0.01] flex items-center justify-center z-10 pointer-events-none"></div>
                                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[20px] shadow-sm mb-2 opacity-50 relative">
                                                    🍹
                                                    <span className="absolute text-[11px] font-bold text-[#7F776F] -bottom-1 -right-1 bg-white/95 px-1 rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.1)]">50%</span>
                                                </div>
                                                <p className="font-bold text-[12.5px] text-[#7F776F] mb-0.5 opacity-60">야간 힙스터</p>
                                                <span className="text-[10px] text-[#A09890] font-bold">진행 중</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 3. 설정 및 기타 메뉴 */}
                                <div className="bg-white rounded-[28px] p-6 lg:p-8 border border-[#F2F4F6] shadow-sm">
                                    <h3 className="font-bold text-[17px] text-[#191F28] mb-5 tracking-tight px-1">계정 설정 및 정보</h3>
                                    
                                    <div className="flex flex-col">
                                        <button 
                                            onClick={() => {
                                                setTempNickname(nickname);
                                                setSelectedImage(profileImage);
                                                setIsNicknameChecked(true);
                                                setNicknameCheckMsg(null);
                                                
                                                // 프로필 이미지로부터 캐릭터와 배경색 파라미터 추출 및 동기화
                                                const imgUrl = profileImage || "/profile_cat.png";
                                                let pureAvatar = "/profile_cat.png";
                                                let bgParam = "default";
                                                
                                                if (imgUrl.includes('profile_puppy')) pureAvatar = "/profile_puppy.png";
                                                else if (imgUrl.includes('profile_fox')) pureAvatar = "/profile_fox.png";
                                                else if (imgUrl.includes('profile_squrel')) pureAvatar = "/profile_squrel.png";
                                                
                                                if (imgUrl.includes('bg=sage')) bgParam = "sage";
                                                else if (imgUrl.includes('bg=peach')) bgParam = "peach";
                                                else if (imgUrl.includes('bg=sand')) bgParam = "sand";
                                                else if (imgUrl.includes('bg=coral')) bgParam = "coral";
                                                else if (imgUrl.includes('bg=silver')) bgParam = "silver";
                                                else if (imgUrl.includes('bg=bluegray')) bgParam = "bluegray";
                                                else if (imgUrl.includes('bg=lavender')) bgParam = "lavender";
                                                
                                                const isDefaultAvatar = imgUrl.includes('profile_cat') || imgUrl.includes('profile_puppy') || imgUrl.includes('profile_fox') || imgUrl.includes('profile_squrel');
                                                setAvatarTab(isDefaultAvatar ? 'default' : 'upload');
                                                
                                                setActiveAvatar(pureAvatar);
                                                setActiveBg(bgParam);
                                                setShowAccountModal(true);
                                            }}
                                            className="flex items-center justify-between w-full py-4 px-2 hover:bg-[#F9FAFB] rounded-[14px] transition-colors group text-left"
                                        >
                                            <span className="font-bold text-[15px] text-[#4E5968] group-hover:text-[#191F28] transition-colors">계정 설정</span>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[13px] text-[#8B95A1] font-semibold">계정 조회 및 수정</span>
                                                <svg className="w-4 h-4 text-[#8B95A1]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                            </div>
                                        </button>
                                        <button 
                                            onClick={() => {
                                                if (typeof window !== 'undefined') {
                                                    setDefaultScrapFolder(localStorage.getItem("defaultScrapFolder") || "기본 저장소");
                                                    setAppTheme(localStorage.getItem("appTheme") || "기본 테마");
                                                    setNewThemeNotification(localStorage.getItem("newThemeNotification") !== "false");
                                                    setPlannerNotification(localStorage.getItem("plannerNotification") !== "false");
                                                }
                                                setShowSettingsModal(true);
                                            }}
                                            className="flex items-center justify-between w-full py-4 px-2 hover:bg-[#F9FAFB] rounded-[14px] transition-colors group text-left"
                                        >
                                            <span className="font-bold text-[15px] text-[#4E5968] group-hover:text-[#191F28] transition-colors">픽플 설정</span>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[13px] text-[#8B95A1] font-semibold">기본 폴더, 테마 등</span>
                                                <svg className="w-4 h-4 text-[#8B95A1]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                            </div>
                                        </button>
                                        <div className="h-[1px] bg-[#F2F4F6] my-2"></div>
                                        <button 
                                            onClick={() => setShowTermsModal('terms')}
                                            className="flex items-center justify-between w-full py-4 px-2 hover:bg-[#F9FAFB] rounded-[14px] transition-colors group text-left"
                                        >
                                            <span className="font-bold text-[15px] text-[#4E5968] group-hover:text-[#191F28] transition-colors">서비스 이용약관</span>
                                            <svg className="w-4 h-4 text-[#8B95A1]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                        </button>
                                        <button 
                                            onClick={() => setShowTermsModal('privacy')}
                                            className="flex items-center justify-between w-full py-4 px-2 hover:bg-[#F9FAFB] rounded-[14px] transition-colors group text-left"
                                        >
                                            <span className="font-bold text-[15px] text-[#4E5968] group-hover:text-[#191F28] transition-colors">개인정보 처리방침</span>
                                            <svg className="w-4 h-4 text-[#8B95A1]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                        </button>
                                        <div className="h-[1px] bg-[#F2F4F6] my-2"></div>
                                        <button 
                                            onClick={handleLogout}
                                            className="flex items-center justify-between w-full py-4 px-2 hover:bg-[#FFF0F0] rounded-[14px] transition-colors group text-left"
                                        >
                                            <span className="font-bold text-[15px] text-red-500">로그아웃</span>
                                            <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- C. DETAIL PAGE VIEW --- */}
                    {selectedPlace && isDetailOpen && !showHiddenGemPopup && (
                        <>
                            {/* 모바일 슬라이드업 모달 */}
                            <div className="lg:hidden absolute inset-0 z-40 bg-white flex flex-col animate-slide-up">
                                <div className="relative w-full h-[45vh] bg-[#F2F4F6] shrink-0">
                                    <img src={selectedPlace.imageUrl} className="w-full h-full object-cover" alt="" />
                                    <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent pt-safe z-50">
                                        <button onClick={handleCloseDetail} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition-transform">
                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-1 bg-white -mt-8 rounded-t-[32px] relative z-10 overflow-y-auto no-scrollbar pb-[100px] shadow-[0_-10px_30px_rgba(0,0,0,0.1)]">
                                    <div className="px-6 pt-8 pb-6">
                                        <h1 className="text-[26px] font-bold mb-1.5 tracking-tight">{selectedPlace.name}</h1>
                                        <p className="text-[14px] font-medium text-[#8B95A1] mb-5 flex items-center gap-1.5 w-full overflow-hidden">
                                            <svg className="w-4 h-4 text-[#B0B8C1] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                            <span className="truncate flex-1">{selectedPlace.location}</span>
                                            <span className="text-[#B0B8C1] shrink-0">·</span>
                                            <span className="shrink-0 text-orange-500 font-bold">{selectedPlace.distance}</span>
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {selectedPlace.tags.map((tag: string) => <span key={tag} className="px-3 py-1.5 rounded-[10px] bg-[#F2F4F6] text-[#4E5968] text-[12px] font-bold tracking-tight">#{tag}</span>)}
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
                                    <button 
                                        onClick={handleSaveClick} 
                                        className={`w-[56px] h-[56px] rounded-[18px] flex items-center justify-center transition-all active:scale-90 shrink-0 border ${isSaved ? 'bg-orange-50 border-orange-100 text-orange-500' : 'bg-[#F2F4F6] border-transparent text-[#8B95A1]'} ${isBookmarkPopping ? 'animate-bookmark-pop' : ''}`}
                                    >
                                        <svg className="w-7 h-7" fill={isSaved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isSaved ? 0 : 2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
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
                                    </div>
                                    <div className="w-[45%] h-full flex flex-col bg-white">
                                        <div className="flex-1 overflow-y-auto p-10 no-scrollbar">
                                            <h1 className="text-[32px] font-bold mb-2 tracking-tight text-[#191F28]">{selectedPlace.name}</h1>
                                            <p className="text-[15px] font-medium text-[#8B95A1] mb-6 flex items-center gap-1.5 w-full overflow-hidden">
                                                <svg className="w-5 h-5 text-[#B0B8C1] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                <span className="truncate flex-1">{selectedPlace.location}</span>
                                                <span className="text-[#B0B8C1] shrink-0">·</span>
                                                <span className="shrink-0 text-[#E65C00] font-bold">{selectedPlace.distance}</span>
                                            </p>
                                            <div className="flex flex-wrap gap-1.5 mb-8">
                                                {selectedPlace.tags.map((tag: string) => <span key={tag} className="px-3.5 py-2 rounded-[12px] bg-[#F2F4F6] text-[#4E5968] text-[13px] font-bold tracking-tight">#{tag}</span>)}
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
                                            <button 
                                                onClick={handleSaveClick} 
                                                className={`w-[64px] h-[64px] rounded-[20px] flex items-center justify-center transition-all hover:scale-95 shrink-0 border ${isSaved ? 'bg-orange-50 border-orange-100 text-orange-500' : 'bg-[#F9FAFB] border-[#E5E8EB] text-[#8B95A1] hover:bg-[#F2F4F6]'} ${isBookmarkPopping ? 'animate-bookmark-pop' : ''}`}
                                            >
                                                <svg className="w-8 h-8" fill={isSaved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isSaved ? 0 : 2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
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
                    {!isDetailOpen && (
                        <div className="lg:hidden absolute bottom-5 left-0 right-0 z-40 flex justify-center pointer-events-none w-full">
                            <nav className="pointer-events-auto max-w-[400px] w-[calc(100%-32px)] bg-white/85 backdrop-blur-xl border border-white/20 shadow-xl rounded-[24px] px-2 py-3 flex justify-around items-center gap-1">
                                {/* 발견 */}
                                <button 
                                    onClick={() => setActiveView('home')} 
                                    className={`flex flex-col items-center gap-1 flex-1 py-1 transition-all relative ${activeView === 'home' ? 'text-[#191F28]' : 'text-[#8B95A1] hover:text-[#4E5968]'}`}
                                >
                                    <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={activeView === 'home' ? 2.5 : 2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                                    <span className="text-[10px] font-bold">발견</span>
                                    {activeView === 'home' && <span className="absolute bottom-[-3px] w-1.5 h-1.5 rounded-full bg-orange-500"></span>}
                                </button>
                                {/* 탐색 */}
                                <button 
                                    onClick={() => setActiveView('explore')} 
                                    className={`flex flex-col items-center gap-1 flex-1 py-1 transition-all relative ${activeView === 'explore' ? 'text-[#191F28]' : 'text-[#8B95A1] hover:text-[#4E5968]'}`}
                                >
                                    <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={activeView === 'explore' ? 2.5 : 2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                    <span className="text-[10px] font-bold">탐색</span>
                                    {activeView === 'explore' && <span className="absolute bottom-[-3px] w-1.5 h-1.5 rounded-full bg-orange-500"></span>}
                                </button>
                                {/* 컬렉션 */}
                                <button 
                                    onClick={() => { setActiveView('collection'); setSelectedFolder(null); setSelectedPlace(null); }} 
                                    className={`flex flex-col items-center gap-1 flex-1 py-1 transition-all relative ${activeView === 'collection' ? 'text-[#191F28]' : 'text-[#8B95A1] hover:text-[#4E5968]'}`}
                                >
                                    <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={activeView === 'collection' ? 2.5 : 2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                                    <span className="text-[10px] font-bold">컬렉션</span>
                                    {activeView === 'collection' && <span className="absolute bottom-[-3px] w-1.5 h-1.5 rounded-full bg-orange-500"></span>}
                                </button>
                                {/* 마이페이지 */}
                                <button 
                                    onClick={() => {
                                        if (isLoggedIn) {
                                            setActiveView('mypage');
                                        } else {
                                            router.push('/login');
                                        }
                                    }} 
                                    className={`flex flex-col items-center gap-1 flex-1 py-1 transition-all relative ${activeView === 'mypage' ? 'text-[#191F28]' : 'text-[#8B95A1] hover:text-[#4E5968]'}`}
                                >
                                    <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={activeView === 'mypage' ? 2.5 : 2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                    <span className="text-[10px] font-bold">{isLoggedIn ? '마이' : '로그인'}</span>
                                    {activeView === 'mypage' && <span className="absolute bottom-[-3px] w-1.5 h-1.5 rounded-full bg-orange-500"></span>}
                                </button>
                            </nav>
                        </div>
                    )}
                </main>
            </div>

            {/* Scrap Folder Bottom Sheet Modal */}
            {showFolderModal && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm animate-fade-in" onClick={closeFolderModal}>
                    <div className="bg-white w-full max-w-[480px] rounded-t-[28px] p-6 pb-safe animate-slide-up" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-[20px] text-[#191F28]">저장 위치 선택</h3>
                            <button onClick={closeFolderModal} className="p-2 text-[#8B95A1] hover:text-[#191F28] transition-colors rounded-full hover:bg-[#F2F4F6]">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        
                        <div className="flex flex-col gap-3">
                            {!isCreatingFolder ? (
                                <>
                                    <div className="flex flex-col gap-3 overflow-y-auto no-scrollbar max-h-[260px] pr-0.5">
                                        <button onClick={() => executeScrap("기본 저장소", false)} className="flex items-center justify-between w-full p-4 rounded-[20px] bg-[#F9FAFB] hover:bg-[#F2F4F6] transition-colors group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-[14px] bg-[#E5E8EB] flex items-center justify-center text-[#8B95A1] group-hover:text-[#4E5968] transition-colors">
                                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                                                </div>
                                                <div className="flex flex-col items-start">
                                                    <span className="font-bold text-[16px] text-[#191F28]">기본 저장소</span>
                                                    {foldersMap["기본 저장소"] && (
                                                        <span className="text-[12px] text-[#8B95A1] font-semibold">{foldersMap["기본 저장소"].length}개의 공간</span>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                        
                                        {/* 기존 커스텀 폴더 목록 */}
                                        {Object.keys(foldersMap)
                                            .filter(name => name !== "기본 저장소")
                                            .sort((a, b) => a.localeCompare(b))
                                            .map(folderName => (
                                                <button 
                                                    key={folderName} 
                                                    onClick={() => executeScrap(folderName, false)} 
                                                    className="flex items-center justify-between w-full p-4 rounded-[20px] bg-[#F9FAFB] hover:bg-[#F2F4F6] transition-colors group"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-[14px] bg-[#E5E8EB] flex items-center justify-center text-[#8B95A1] group-hover:text-[#4E5968] transition-colors">
                                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                                                        </div>
                                                        <div className="flex flex-col items-start text-left">
                                                            <span className="font-bold text-[16px] text-[#191F28] line-clamp-1">{folderName}</span>
                                                            <span className="text-[12px] text-[#8B95A1] font-semibold">{foldersMap[folderName].length}개의 공간</span>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))
                                        }
                                    </div>
                                    
                                    <button onClick={() => setIsCreatingFolder(true)} className="flex items-center justify-between w-full p-4 rounded-[20px] bg-white border border-[#F2F4F6] hover:border-blue-200 hover:bg-blue-50 transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-[14px] bg-blue-100 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                            </div>
                                            <span className="font-bold text-[16px] text-blue-500 group-hover:text-blue-600">새 폴더 만들기</span>
                                        </div>
                                    </button>
                                </>
                            ) : (
                                <div className="flex flex-col gap-4 animate-fade-in">
                                    <input 
                                        type="text" 
                                        autoFocus
                                        placeholder="새 폴더 이름 입력" 
                                        value={newFolderName} 
                                        onChange={(e) => setNewFolderName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && newFolderName.trim()) {
                                                executeScrap(newFolderName.trim(), false);
                                            }
                                        }}
                                        className="w-full bg-[#F9FAFB] border border-[#E5E8EB] rounded-[16px] px-5 py-4 text-[16px] font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                                    />
                                    <div className="flex gap-2">
                                        <button onClick={() => setIsCreatingFolder(false)} className="flex-1 py-4 rounded-[16px] bg-[#F2F4F6] text-[#4E5968] font-bold text-[15px] hover:bg-[#E5E8EB] transition-colors">
                                            취소
                                        </button>
                                        <button 
                                            onClick={() => newFolderName.trim() && executeScrap(newFolderName.trim(), false)} 
                                            disabled={!newFolderName.trim()}
                                            className={`flex-1 py-4 rounded-[16px] font-bold text-[15px] transition-colors ${newFolderName.trim() ? 'bg-[#191F28] text-white hover:bg-black' : 'bg-[#E5E8EB] text-[#B0B8C1] cursor-not-allowed'}`}
                                        >
                                            만들기
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Folder Rename Modal */}
            {showRenameModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setShowRenameModal(false)}>
                    <div className="bg-white w-[90%] max-w-[400px] rounded-[28px] p-6 shadow-2xl animate-scale-up" onClick={e => e.stopPropagation()}>
                        <h3 className="font-bold text-[20px] text-[#191F28] mb-4">폴더 이름 변경</h3>
                        <p className="text-[14px] text-[#8B95A1] font-semibold mb-4">새로운 폴더 이름을 입력해주세요.</p>
                        <input 
                            type="text" 
                            autoFocus
                            placeholder="폴더 이름 입력" 
                            value={renameInputVal} 
                            onChange={(e) => setRenameInputVal(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && renameInputVal.trim()) {
                                    handleRenameFolder();
                                }
                            }}
                            className="w-full bg-[#F9FAFB] border border-[#E5E8EB] rounded-[16px] px-5 py-4 text-[16px] font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-colors mb-6"
                        />
                        <div className="flex gap-3">
                            <button onClick={() => setShowRenameModal(false)} className="flex-1 py-4 rounded-[16px] bg-[#F2F4F6] text-[#4E5968] font-bold text-[15px] hover:bg-[#E5E8EB] transition-colors">
                                취소
                            </button>
                            <button 
                                onClick={handleRenameFolder} 
                                disabled={!renameInputVal.trim() || renameInputVal.trim() === selectedFolder}
                                className={`flex-1 py-4 rounded-[16px] font-bold text-[15px] transition-colors ${renameInputVal.trim() && renameInputVal.trim() !== selectedFolder ? 'bg-[#191F28] text-white hover:bg-black' : 'bg-[#E5E8EB] text-[#B0B8C1] cursor-not-allowed'}`}
                            >
                                변경
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Folder Delete Confirmation Modal */}
            {showDeleteConfirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setShowDeleteConfirmModal(false)}>
                    <div className="bg-white w-[90%] max-w-[400px] rounded-[28px] p-6 shadow-2xl animate-scale-up" onClick={e => e.stopPropagation()}>
                        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-4">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </div>
                        <h3 className="font-bold text-[20px] text-[#191F28] mb-2">폴더를 삭제하시겠습니까?</h3>
                        <p className="text-[14px] text-[#8B95A1] font-semibold leading-relaxed mb-6">
                            폴더를 삭제하면 해당 폴더 안에 저장된 <span className="text-red-500 font-bold">{(selectedFolder && foldersMap[selectedFolder])?.length || 0}개</span>의 모든 공간 스크랩이 함께 삭제됩니다. 이 동작은 취소할 수 없습니다.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteConfirmModal(false)} className="flex-1 py-4 rounded-[16px] bg-[#F2F4F6] text-[#4E5968] font-bold text-[15px] hover:bg-[#E5E8EB] transition-colors">
                                취소
                            </button>
                            <button 
                                onClick={handleDeleteFolder} 
                                className="flex-1 py-4 rounded-[16px] bg-red-500 text-white font-bold text-[15px] hover:bg-red-600 transition-colors shadow-sm"
                            >
                                삭제
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <TermsAndPrivacyModal 
                isOpen={!!showTermsModal} 
                type={showTermsModal} 
                onClose={() => setShowTermsModal(null)} 
            />

            {/* Account Settings Overlay Modal (Toss Style) */}
            {showAccountModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md animate-fade-in p-4" onClick={() => setShowAccountModal(false)}>
                    <div className="bg-white w-[92%] max-w-[500px] rounded-[32px] p-6 lg:p-8 flex flex-col shadow-2xl animate-scale-up" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6 shrink-0">
                            <h3 className="font-bold text-[20px] lg:text-[22px] text-[#191F28]">계정 설정</h3>
                            <button 
                                onClick={() => setShowAccountModal(false)} 
                                className="p-2 text-[#8B95A1] hover:text-[#191F28] transition-colors rounded-full hover:bg-[#F2F4F6]"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-6 py-2">
                            {/* Profile Pic Loader & Style Selectors */}
                            <div className="flex flex-col items-center">
                                <div className={`w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-[0_4px_15px_rgba(0,0,0,0.06)] transition-colors duration-300 relative flex items-center justify-center ${getProfileBgClass(selectedImage)}`}>
                                    <img src={selectedImage ? selectedImage.split('?')[0] : "/profile_cat.png"} className="w-full h-full object-cover" alt="Profile Cat" />
                                </div>
                                
                                {/* 탭 선택 버튼 (기본 고양이 vs 직접 업로드) */}
                                <div className="flex gap-2 bg-[#F2F4F6] p-1 rounded-full mt-4 w-60 shrink-0">
                                    <button 
                                        type="button"
                                        onClick={() => setAvatarTab('default')}
                                        className={`flex-1 py-1.5 rounded-full text-[12px] font-bold transition-all ${avatarTab === 'default' ? 'bg-white text-[#191F28] shadow-sm' : 'text-[#8B95A1] hover:text-[#4E5968]'}`}
                                    >
                                        기본 캐릭터 배경
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setAvatarTab('upload')}
                                        className={`flex-1 py-1.5 rounded-full text-[12px] font-bold transition-all ${avatarTab === 'upload' ? 'bg-white text-[#191F28] shadow-sm' : 'text-[#8B95A1] hover:text-[#4E5968]'}`}
                                    >
                                        직접 사진 업로드
                                    </button>
                                </div>
                                
                                {/* 탭 콘텐츠 영역 */}
                                <div className="flex flex-col gap-4 mt-4 w-full">
                                    {avatarTab === 'default' ? (
                                        <div className="flex flex-col gap-4 bg-[#F9FAFB] p-4 rounded-[24px] border border-[#F2F4F6] w-full">
                                            {/* 캐릭터 아바타 선택 */}
                                            <div>
                                                <p className="text-[12px] font-bold text-[#8B95A1] mb-2.5 pl-1 text-center">캐릭터 아바타 선택</p>
                                                <div className="flex gap-4 justify-center">
                                                    {[
                                                        { id: 'cat', path: '/profile_cat.png', label: '고양이' },
                                                        { id: 'puppy', path: '/profile_puppy.png', label: '강아지' },
                                                        { id: 'fox', path: '/profile_fox.png', label: '여우' },
                                                        { id: 'squrel', path: '/profile_squrel.png', label: '다람쥐' }
                                                    ].map(character => (
                                                        <button
                                                            key={character.id}
                                                            type="button"
                                                            onClick={() => handleAvatarChange(character.path)}
                                                            className={`w-14 h-14 rounded-full overflow-hidden border-2 bg-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 ${activeAvatar === character.path ? 'border-orange-500 shadow-md ring-2 ring-orange-500/20' : 'border-gray-200'}`}
                                                            title={character.label}
                                                        >
                                                            <img src={character.path} alt={character.label} className="w-full h-full object-cover" />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center bg-[#F9FAFB] p-5 rounded-[24px] border border-[#F2F4F6] w-full">
                                            <input 
                                                type="file" 
                                                ref={fileInputRef} 
                                                onChange={handleImageUpload} 
                                                accept="image/*" 
                                                className="hidden" 
                                            />
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="px-5 py-3 rounded-[16px] bg-[#191F28] hover:bg-black text-white hover:scale-105 active:scale-95 transition-all text-[13px] font-bold shadow-sm"
                                            >
                                                기기에서 사진 선택하기
                                            </button>
                                        </div>
                                    )}

                                    {/* 배경 테마 선택 (공통으로 노출) */}
                                    <div className="flex flex-col gap-4 bg-[#F9FAFB] p-4 rounded-[24px] border border-[#F2F4F6] w-full">
                                        <div>
                                            <p className="text-[12px] font-bold text-[#8B95A1] mb-2.5 pl-1 text-center">배경 테마 선택</p>
                                            <div className="flex flex-wrap gap-2.5 justify-center px-1">
                                                {[
                                                    { id: 'default', label: '기본 화이트', bgClass: 'bg-white border-gray-200' },
                                                    { id: 'silver', label: '실버 그레이', bgClass: 'bg-[#F2F4F6] border-[#E5E8EB]' },
                                                    { id: 'bluegray', label: '모던 블루그레이', bgClass: 'bg-[#ECEFF2] border-[#DDE1E6]' },
                                                    { id: 'lavender', label: '시크 라벤더', bgClass: 'bg-[#F1F0F5] border-[#E3E1E8]' },
                                                    { id: 'sage', label: '차분한 세이지', bgClass: 'bg-[#F0F6F5] border-[#D1E6E4]' },
                                                    { id: 'peach', label: '코지 피치', bgClass: 'bg-[#FFF4EE] border-[#FFD2B8]' },
                                                    { id: 'sand', label: '따뜻한 샌드', bgClass: 'bg-[#F7F6F3] border-[#E8E6E1]' },
                                                    { id: 'coral', label: '달콤한 코랄', bgClass: 'bg-[#FFF0F0] border-[#FFD5D5]' },
                                                ].map(style => (
                                                    <button
                                                        key={style.id}
                                                        type="button"
                                                        onClick={() => handleBgChange(style.id)}
                                                        className={`w-8 h-8 rounded-full border-[1.5px] transition-all flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 ${style.bgClass} ${activeBg === style.id ? 'ring-2 ring-orange-500 ring-offset-2 scale-105 shadow-sm' : 'ring-0'}`}
                                                        title={style.label}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Email Address Read-Only */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[13px] font-bold text-[#8B95A1] pl-1">이메일 주소 (수정 불가)</label>
                                <div className="w-full bg-[#F2F4F6] text-[#8B95A1] rounded-[16px] px-5 py-4 text-[15px] font-bold border border-transparent select-none cursor-not-allowed">
                                    {userEmail || "email@pickpl.com"}
                                </div>
                            </div>

                            {/* Nickname Input & Dup Check */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[13px] font-bold text-[#8B95A1] pl-1">닉네임</label>
                                <div className="flex gap-3">
                                    <input 
                                        type="text" 
                                        placeholder="닉네임 입력" 
                                        value={tempNickname} 
                                        onChange={handleNicknameChange}
                                        className="flex-1 bg-[#F9FAFB] border border-[#E5E8EB] rounded-[16px] px-5 py-4 text-[15px] font-bold focus:outline-none focus:border-orange-500 focus:bg-white transition-colors"
                                    />
                                    <button 
                                        onClick={handleCheckNickname}
                                        disabled={tempNickname.trim() === nickname && isNicknameChecked}
                                        className={`px-5 py-4 rounded-[16px] font-bold text-[13px] transition-all whitespace-nowrap active:scale-95 ${tempNickname.trim() === nickname && isNicknameChecked ? 'bg-[#F2F4F6] text-[#B0B8C1] cursor-not-allowed' : 'bg-orange-500/10 text-orange-600 hover:bg-orange-500/20'}`}
                                    >
                                        중복 확인
                                    </button>
                                </div>
                                {nicknameCheckMsg && (
                                    <p className={`text-[12px] font-bold mt-1.5 pl-1 ${nicknameCheckMsg.isSuccess ? 'text-[#2E7D7A]' : 'text-red-500'}`}>
                                        {nicknameCheckMsg.text}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6 shrink-0">
                            <button 
                                onClick={() => setShowAccountModal(false)} 
                                className="flex-1 py-4 rounded-[16px] bg-[#F2F4F6] text-[#4E5968] font-bold text-[15px] hover:bg-[#E5E8EB] transition-colors"
                            >
                                취소
                            </button>
                            <button 
                                onClick={handleSaveProfile} 
                                disabled={tempNickname.trim() !== nickname && !isNicknameChecked}
                                className={`flex-1 py-4 rounded-[16px] font-bold text-[15px] transition-all shadow-sm ${tempNickname.trim() !== nickname && !isNicknameChecked ? 'bg-[#E5E8EB] text-[#B0B8C1] cursor-not-allowed' : 'bg-[#191F28] text-white hover:bg-black'}`}
                            >
                                저장
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* PickPl Settings Overlay Modal (Toss Style) */}
            {showSettingsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md animate-fade-in p-4" onClick={() => setShowSettingsModal(false)}>
                    <div className="bg-white w-[92%] max-w-[500px] rounded-[32px] p-6 lg:p-8 flex flex-col shadow-2xl animate-scale-up" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6 shrink-0">
                            <h3 className="font-bold text-[20px] lg:text-[22px] text-[#191F28]">픽플 설정</h3>
                            <button 
                                onClick={() => setShowSettingsModal(false)} 
                                className="p-2 text-[#8B95A1] hover:text-[#191F28] transition-colors rounded-full hover:bg-[#F2F4F6]"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-6 py-2">
                            {/* Default Scrap Folder Dropdown */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[13px] font-bold text-[#8B95A1] pl-1">기본 스크랩 폴더 설정</label>
                                <div className="relative">
                                    <select 
                                        value={defaultScrapFolder} 
                                        onChange={(e) => setDefaultScrapFolder(e.target.value)}
                                        className="w-full bg-[#F9FAFB] border border-[#E5E8EB] rounded-[16px] px-5 py-4 text-[15px] font-bold focus:outline-none focus:border-orange-500 focus:bg-white transition-colors appearance-none cursor-pointer pr-10"
                                    >
                                        {(() => {
                                            const folderList = Object.keys(foldersMap);
                                            if (!folderList.includes("기본 저장소")) {
                                                folderList.unshift("기본 저장소");
                                            }
                                            return folderList.map(folder => (
                                                <option key={folder} value={folder}>{folder}</option>
                                            ));
                                        })()}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[#8B95A1]">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Vibe Theme Buttons Grid */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[13px] font-bold text-[#8B95A1] pl-1">픽플 어플리케이션 테마</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { name: "기본 테마", color: "bg-white", border: "border-[#E5E8EB]", text: "text-[#191F28]" },
                                        { name: "차분한 샌드", color: "bg-[#F7F6F3]", border: "border-[#E8E6E1]", text: "text-[#7F776F]" },
                                        { name: "세이지 그린", color: "bg-[#F0F6F5]", border: "border-[#D1E6E4]", text: "text-[#2E7D7A]" },
                                        { name: "웜 코랄", color: "bg-[#FFF0F0]", border: "border-[#FFD5D5]", text: "text-[#E63939]" }
                                    ].map(theme => (
                                        <button
                                            key={theme.name}
                                            type="button"
                                            onClick={() => setAppTheme(theme.name)}
                                            className={`flex items-center gap-3 p-4 rounded-[20px] border-[1.5px] transition-all text-[13.5px] font-bold active:scale-95 text-left ${appTheme === theme.name ? 'border-orange-500 bg-orange-50/40 shadow-sm' : 'border-[#E5E8EB] bg-white hover:bg-[#F9FAFB]'}`}
                                        >
                                            <div className={`w-5.5 h-5.5 rounded-full border ${theme.color} ${theme.border} shrink-0`} />
                                            <span className={appTheme === theme.name ? 'text-orange-600' : 'text-[#4E5968]'}>{theme.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Notification Settings */}
                            <div className="flex flex-col gap-4 border-t border-[#F2F4F6] pt-5">
                                <h4 className="text-[13px] font-bold text-[#8B95A1] pl-1">알림 수신 설정</h4>
                                
                                <div className="flex items-center justify-between py-1 px-1">
                                    <div>
                                        <p className="font-bold text-[14.5px] text-[#4E5968]">새로운 추천 테마 알림</p>
                                        <p className="text-[11.5px] text-[#8B95A1] font-semibold mt-0.5">날씨, 계절 및 감성 공간 추천 푸시 알림 수신</p>
                                    </div>
                                    <button
                                        onClick={() => setNewThemeNotification(!newThemeNotification)}
                                        className={`w-12 h-6.5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none flex items-center ${newThemeNotification ? 'bg-orange-500 justify-end' : 'bg-[#E5E8EB] justify-start'}`}
                                    >
                                        <div className="w-5.5 h-5.5 rounded-full bg-white shadow-sm transition-transform duration-200" />
                                    </button>
                                </div>
                                
                                <div className="flex items-center justify-between py-1 px-1">
                                    <div>
                                        <p className="font-bold text-[14.5px] text-[#4E5968]">공동 플래너 활동 알림</p>
                                        <p className="text-[11.5px] text-[#8B95A1] font-semibold mt-0.5">친구와 공유 중인 플래너 실시간 변동 알림 수신</p>
                                    </div>
                                    <button
                                        onClick={() => setPlannerNotification(!plannerNotification)}
                                        className={`w-12 h-6.5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none flex items-center ${plannerNotification ? 'bg-orange-500 justify-end' : 'bg-[#E5E8EB] justify-start'}`}
                                    >
                                        <div className="w-5.5 h-5.5 rounded-full bg-white shadow-sm transition-transform duration-200" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6 shrink-0">
                            <button 
                                onClick={() => setShowSettingsModal(false)} 
                                className="flex-1 py-4 rounded-[16px] bg-[#F2F4F6] text-[#4E5968] font-bold text-[15px] hover:bg-[#E5E8EB] transition-colors"
                            >
                                취소
                            </button>
                            <button 
                                onClick={handleSaveSettings} 
                                className="flex-1 py-4 rounded-[16px] bg-[#191F28] text-white font-bold text-[15px] hover:bg-black transition-colors shadow-sm"
                            >
                                저장
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast && (
                <div className="fixed top-16 left-1/2 z-50 bg-[#191F28] text-white px-6 py-3 rounded-full text-[14px] font-bold shadow-lg animate-[toastInOut_3s_ease-in-out_forwards] flex items-center gap-2.5">
                    {toast.type === 'success' && (
                        <svg className="w-5 h-5 text-[#22C55E]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                    )}
                    {toast.type === 'warning' && (
                        <svg className="w-5 h-5 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    )}
                    {toast.type === 'error' && (
                        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    )}
                    <span>{toast.message}</span>
                </div>
            )}
        </div>
    );
}
