"use client";

import React, { useState, useEffect, useMemo } from 'react';
import useSWR, { mutate } from 'swr';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/authStore';
import { useLocationStore } from '../store/locationStore';
import axiosInstance from '../api/axios';
import TermsAndPrivacyModal from './TermsAndPrivacyModal';

// --- 분리된 하위 컴포넌트 임포트 ---
import { getProfileBgClass, mapPlaceToData } from './ui/Helpers';
import DiscoverView from './views/DiscoverView';
import ExploreView from './views/ExploreView';
import CollectionView from './views/CollectionView';
import MyPageView from './views/MyPageView';
import CurationView from './views/CurationView';

import PlaceDetailModal from './modals/PlaceDetailModal';
import HiddenGemPopup from './modals/HiddenGemPopup';
import FolderSelectModal from './modals/FolderSelectModal';
import FolderRenameModal from './modals/FolderRenameModal';
import FolderDeleteConfirmModal from './modals/FolderDeleteConfirmModal';
import AccountEditModal from './modals/AccountEditModal';
import AppSettingsModal from './modals/AppSettingsModal';

const fetcher = async (url: string) => {
    const res = await axiosInstance.get(url);
    return res.data;
};

export default function ResponsiveApp({ initialPlaces }: { initialPlaces: any[] }) {
    const router = useRouter();
    const [activeView, setActiveView] = useState<string>('home');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const authStore = useAuthStore();
    const locationStore = useLocationStore();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [nickname, setNickname] = useState("미나리");
    const [userEmail, setUserEmail] = useState("");
    const [provider, setProvider] = useState("LOCAL");
    const [profileImage, setProfileImage] = useState("/profile_cat.png");
    const [isMounted, setIsMounted] = useState(false);
    const [emailVerified, setEmailVerified] = useState(false);
    const [linkedProviders, setLinkedProviders] = useState<string[]>([]);
    
    // 모달 표시 상태
    const [showAccountModal, setShowAccountModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState<'terms' | 'privacy' | null>(null);

    // 글로벌 설정 상태들
    const [defaultScrapFolder, setDefaultScrapFolder] = useState("기본 저장소");
    const [appTheme, setAppTheme] = useState("기본 테마");
    const [newThemeNotification, setNewThemeNotification] = useState(true);
    const [plannerNotification, setPlannerNotification] = useState(true);

    // 장소 선택 관련 상태들
    const [selectedPlace, setSelectedPlace] = useState<any | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [hiddenGemPlace, setHiddenGemPlace] = useState<any | null>(null);
    const [showHiddenGemPopup, setShowHiddenGemPopup] = useState<boolean>(false);
    const [vibeStats, setVibeStats] = useState<{ quiet: number; chatty: number }>({ quiet: 50, chatty: 50 });
    const [userVotedVibe, setUserVotedVibe] = useState<string | null>(null);
    const [isSaved, setIsSaved] = useState(false);
    const [isBookmarkPopping, setIsBookmarkPopping] = useState(false);

    // 폴더 편집 관련 상태들
    const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
    const [folderToEdit, setFolderToEdit] = useState<string | null>(null);
    const [showFolderSettings, setShowFolderSettings] = useState(false);
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
    const [showFolderModal, setShowFolderModal] = useState(false);

    // 발견(Discover) 탭 전용 상태
    const [discoverPlacesList, setDiscoverPlacesList] = useState<any[]>(initialPlaces);
    const [discoverPage, setDiscoverPage] = useState<number>(0);
    const [discoverHasMore, setDiscoverHasMore] = useState<boolean>(true);
    const [discoverIsLoadingMore, setDiscoverIsLoadingMore] = useState<boolean>(false);

    // 탐색(Explore) 탭 전용 상태
    const [explorePlacesList, setExplorePlacesList] = useState<any[]>([]);
    const [explorePage, setExplorePage] = useState<number>(0);
    const [exploreHasMore, setExploreHasMore] = useState<boolean>(true);
    const [exploreIsLoadingMore, setExploreIsLoadingMore] = useState<boolean>(false);

    // 검색 필터 상태
    const [searchKeyword, setSearchKeyword] = useState("");
    const [debouncedSearchKeyword, setDebouncedSearchKeyword] = useState("");

    // 검색어 디바운싱 (300ms)
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchKeyword(searchKeyword);
        }, 300);
        return () => clearTimeout(handler);
    }, [searchKeyword]);

    // 토스트 관련 상태
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null);

    const showToast = (message: string, type: 'success' | 'warning' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // 실시간 GPS 및 에러/Fallback 처리
    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        locationStore.setPermissionStatus('granted');
                        locationStore.setLocation(position.coords.latitude, position.coords.longitude);
                    },
                    (error) => {
                        console.warn("Geolocation API Error or Denied:", error);
                        if (error.code === error.PERMISSION_DENIED) {
                            locationStore.setPermissionStatus('denied');
                        } else {
                            locationStore.setPermissionStatus('error');
                        }
                        locationStore.useFallbackCoordinates();
                    },
                    { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
                );
            } else {
                locationStore.setPermissionStatus('error');
                locationStore.useFallbackCoordinates();
            }
        }
    }, []);

    // 로컬 스토리지 설정 및 로그인 상태 마운트 동기화
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setDefaultScrapFolder(localStorage.getItem("defaultScrapFolder") || "기본 저장소");
            setAppTheme(localStorage.getItem("appTheme") || "기본 테마");
            setNewThemeNotification(localStorage.getItem("newThemeNotification") !== "false");
            setPlannerNotification(localStorage.getItem("plannerNotification") !== "false");

            // Zustand 스토어 로그인 상태 동기화
            const token = localStorage.getItem("accessToken");
            const nick = localStorage.getItem("nickname") || "미나리";
            if (token) {
                authStore.login(nick);
            } else {
                authStore.logout();
            }
            setIsMounted(true);
        }
    }, []);

    // 로그인 상태 마운트 동기화
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const logged = authStore.isLoggedIn || !!localStorage.getItem("accessToken");
            setIsLoggedIn(logged);
            setNickname(authStore.nickname || localStorage.getItem("nickname") || "미나리");
        }
    }, [authStore.isLoggedIn, authStore.nickname]);

    const refreshUserInfo = async () => {
        if (!isLoggedIn) return;
        try {
            const res = await axiosInstance.get('/auth/me');
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
                if (res.data.provider) {
                    setProvider(res.data.provider);
                }
                if (res.data.emailVerified !== undefined) {
                    setEmailVerified(res.data.emailVerified);
                }
                if (res.data.linkedProviders) {
                    setLinkedProviders(res.data.linkedProviders);
                }
                if (res.data.onboarded === false) {
                    router.push('/onboarding');
                }
            }
        } catch (err) {
            console.error("사용자 정보 조회 실패:", err);
        }
    };

    // 내 정보 로드
    useEffect(() => {
        refreshUserInfo();
    }, [isLoggedIn]);

    // 소셜 연동(OAuth2) 성공/실패 쿼리 파라미터 감지 및 처리
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const linkSuccess = params.get('linkSuccess');
            const linkError = params.get('linkError');
            const providerParam = params.get('provider');

            if (linkSuccess === 'true') {
                const newAccessToken = params.get('accessToken');
                const newRefreshToken = params.get('refreshToken');
                const nicknameParam = params.get('nickname');

                if (newAccessToken && newRefreshToken) {
                    localStorage.setItem("accessToken", newAccessToken);
                    localStorage.setItem("refreshToken", newRefreshToken);
                    if (nicknameParam) {
                        localStorage.setItem("nickname", nicknameParam);
                        authStore.login(nicknameParam);
                    }
                }

                setActiveView('mypage');
                showToast(`${providerParam || '소셜'} 계정이 성공적으로 연동되었습니다.`, 'success');
                refreshUserInfo();
                
                // URL 쿼리 클리어
                const newUrl = window.location.pathname;
                window.history.replaceState({}, document.title, newUrl);
            } else if (linkError) {
                setActiveView('mypage');
                showToast(decodeURIComponent(linkError), 'error');
                
                // URL 쿼리 클리어
                const newUrl = window.location.pathname;
                window.history.replaceState({}, document.title, newUrl);
            }
        }
    }, [isMounted]);

    // SWR 북마크 폴더 조회
    const { data: scrapsData, mutate: mutateScraps } = useSWR(
        isLoggedIn ? '/scraps' : null,
        fetcher
    );

    // --- 발견(Discover) 탭 전용 SWR 쿼리 및 페이징 ---
    const discoverQueryString = useMemo(() => {
        const params: string[] = [];
        if (locationStore.latitude !== null) {
            params.push(`latitude=${locationStore.latitude}`);
        }
        if (locationStore.longitude !== null) {
            params.push(`longitude=${locationStore.longitude}`);
        }
        return params.length > 0 ? `?${params.join('&')}` : '';
    }, [locationStore.latitude, locationStore.longitude]);

    // 큐레이션 API 호출용 글로벌 SWR 추가
    const { data: curationData, isValidating: isCurationValidating } = useSWR(
        `/curation${discoverQueryString}`,
        fetcher
    );

    const isDiscoverInitialLoad = discoverPage === 0 && locationStore.latitude === null && !isLoggedIn;

    const { data: discoverPageData, isValidating: isDiscoverValidating } = useSWR(
        isDiscoverInitialLoad ? null : `/places${discoverQueryString}${discoverQueryString ? '&' : '?'}page=${discoverPage}&size=20`,
        fetcher,
        { keepPreviousData: false }
    );

    // 위치/GPS가 리프레시되거나 마운트될 때 discoverPage 리셋
    useEffect(() => {
        setDiscoverPage(0);
        setDiscoverHasMore(true);
    }, [locationStore.latitude, locationStore.longitude]);

    useEffect(() => {
        if (isDiscoverInitialLoad) {
            setDiscoverHasMore(initialPlaces.length >= 20);
            return;
        }

        if (discoverPageData) {
            const newPlaces = discoverPageData.content || [];
            const isLast = discoverPageData.last;
            
            setDiscoverPlacesList(prev => {
                if (discoverPage === 0) {
                    return newPlaces;
                } else {
                    const existingIds = new Set(prev.map(p => p.id));
                    const filteredNew = newPlaces.filter((p: any) => !existingIds.has(p.id));
                    return [...prev, ...filteredNew];
                }
            });
            setDiscoverHasMore(!isLast);
            setDiscoverIsLoadingMore(false);
        }
    }, [discoverPageData, discoverPage, isDiscoverInitialLoad]);

    const loadMoreDiscover = () => {
        if (!discoverHasMore || discoverIsLoadingMore || isDiscoverValidating) return;
        setDiscoverIsLoadingMore(true);
        setDiscoverPage(prev => prev + 1);
    };

    // --- 탐색(Explore) 탭 전용 SWR 쿼리 및 페이징 ---
    const exploreQueryString = useMemo(() => {
        const params: string[] = [];
        if (selectedTags.length > 0) {
            params.push(`tags=${selectedTags.map(encodeURIComponent).join(',')}`);
        }
        if (debouncedSearchKeyword.trim() !== "") {
            params.push(`keyword=${encodeURIComponent(debouncedSearchKeyword.trim())}`);
        }
        if (locationStore.latitude !== null) {
            params.push(`latitude=${locationStore.latitude}`);
        }
        if (locationStore.longitude !== null) {
            params.push(`longitude=${locationStore.longitude}`);
        }
        return params.length > 0 ? `?${params.join('&')}` : '';
    }, [selectedTags, debouncedSearchKeyword, locationStore.latitude, locationStore.longitude]);

    const exploreFilterKey = `${selectedTags.join(',')}_${debouncedSearchKeyword}_${locationStore.latitude}_${locationStore.longitude}`;
    
    // 필터 조건 변경 시 Explore 페이지 리셋 및 리스트 초기화
    useEffect(() => {
        setExplorePage(0);
        setExploreHasMore(true);
        setExplorePlacesList([]);
    }, [exploreFilterKey]);

    const { data: explorePageData, isValidating: isExploreValidating } = useSWR(
        isDiscoverInitialLoad && exploreFilterKey === '___' ? null : `/places${exploreQueryString}${exploreQueryString ? '&' : '?'}page=${explorePage}&size=20`,
        fetcher,
        { keepPreviousData: false }
    );

    useEffect(() => {
        if (explorePageData) {
            const newPlaces = explorePageData.content || [];
            const isLast = explorePageData.last;
            
            setExplorePlacesList(prev => {
                if (explorePage === 0) {
                    return newPlaces;
                } else {
                    const existingIds = new Set(prev.map(p => p.id));
                    const filteredNew = newPlaces.filter((p: any) => !existingIds.has(p.id));
                    return [...prev, ...filteredNew];
                }
            });
            setExploreHasMore(!isLast);
            setExploreIsLoadingMore(false);
        }
    }, [explorePageData, explorePage]);

    const loadMoreExplore = () => {
        if (!exploreHasMore || exploreIsLoadingMore || isExploreValidating) return;
        setExploreIsLoadingMore(true);
        setExplorePage(prev => prev + 1);
    };

    // 북마크 폴더 구조 맵 변환
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

    // 발견(Discover)용 장소 데이터 디자인 속성 매핑
    const discoverPlacesData = useMemo(() => {
        const prefix = locationStore.permissionStatus === 'granted' 
            ? '내 위치에서' 
            : locationStore.fallbackPlace === 'seongsu' ? '성수역에서' : '강남역에서';

        return discoverPlacesList.map(place => {
            const mapped = mapPlaceToData(place);
            if (place.distance) {
                mapped.distance = `${prefix} ${place.distance}`;
            } else {
                mapped.distance = null;
            }
            return mapped;
        });
    }, [discoverPlacesList, locationStore.permissionStatus, locationStore.fallbackPlace]);

    // 탐색(Explore)용 장소 데이터 디자인 속성 매핑
    const explorePlacesData = useMemo(() => {
        const prefix = locationStore.permissionStatus === 'granted' 
            ? '내 위치에서' 
            : locationStore.fallbackPlace === 'seongsu' ? '성수역에서' : '강남역에서';

        return explorePlacesList.map(place => {
            const mapped = mapPlaceToData(place);
            if (place.distance) {
                mapped.distance = `${prefix} ${place.distance}`;
            } else {
                mapped.distance = null;
            }
            return mapped;
        });
    }, [explorePlacesList, locationStore.permissionStatus, locationStore.fallbackPlace]);

    // 검색 결과 가공
    const filteredPlaces = explorePlacesData;

    const toggleTag = (tag: string) => {
        setSelectedTags(prev => prev.includes(tag) ? prev.filter((t: string) => t !== tag) : [...prev, tag]);
    };

    const handlePlaceClick = async (place: any) => {
        if (place.isHiddenGem) {
            setHiddenGemPlace(place);
            setShowHiddenGemPopup(true);
        } else {
            setSelectedPlace(place);
            setVibeStats(place.initialVibe);
            setIsSaved(!!place.isScrapped);
            setUserVotedVibe(place.userVotedVibe || null);
            setIsDetailOpen(true);

            try {
                const latParam = locationStore.latitude !== null ? `latitude=${locationStore.latitude}` : '';
                const lonParam = locationStore.longitude !== null ? `longitude=${locationStore.longitude}` : '';
                const query = [latParam, lonParam].filter(Boolean).join('&');
                const res = await axiosInstance.get(`/places/${place.id}${query ? `?${query}` : ''}`);
                if (res.data) {
                    const detailed = mapPlaceToData(res.data);
                    const prefix = locationStore.permissionStatus === 'granted' 
                        ? '내 위치에서' 
                        : locationStore.fallbackPlace === 'seongsu' ? '성수역에서' : '강남역에서';
                    if (res.data.distance) {
                        detailed.distance = `${prefix} ${res.data.distance}`;
                    } else {
                        detailed.distance = null;
                    }
                    setSelectedPlace(detailed);
                    setVibeStats(detailed.initialVibe);
                    setIsSaved(!!detailed.isScrapped);
                    setUserVotedVibe(detailed.userVotedVibe || null);
                }
            } catch (err) {
                console.error("장소 상세정보 조회 실패:", err);
            }
        }
    };

    const handleCloseDetail = () => {
        setSelectedPlace(null);
        setUserVotedVibe(null);
        setIsDetailOpen(false);
    };

    const handleCardSaveClick = async (place: any, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isLoggedIn) {
            showToast("로그인이 필요한 기능입니다.", "warning");
            return;
        }
        
        setSelectedPlace(place);
        setIsDetailOpen(false);
        setIsSaved(!!place.isScrapped);

        if (place.isScrapped) {
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
            setShowFolderModal(true);
        }
    };

    const handleVibeVote = async (type: string) => {
        if (!isLoggedIn) {
            showToast("로그인이 필요한 기능입니다.", "warning");
            return;
        }
        if (!selectedPlace) return;
        if (userVotedVibe === type) return;
        
        // 1. UI 상태 즉각 업데이트 (낙관적 업데이트로 네트워크 대기시간 무력화)
        const previousVote = userVotedVibe;
        setUserVotedVibe(type);
        
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
        
        // 2. API 전송 및 백필은 백그라운드 비동기로 수행
        try {
            const apiType = type === 'quiet' ? 'QUIET' : 'CHATTY';
            await axiosInstance.post(`/places/${selectedPlace.id}/vibe?type=${apiType}`);
            mutate((key: any) => typeof key === 'string' && key.includes('/places'), undefined, { revalidate: true });
        } catch (error: any) {
            console.error("투표 처리 실패:", error);
            
            // API 실패 시 기존 상태로 즉각 롤백
            setUserVotedVibe(previousVote);
            setVibeStats(prev => {
                if (previousVote) {
                    return {
                        quiet: previousVote === 'quiet' ? prev.quiet + 1 : prev.quiet - 1,
                        chatty: previousVote === 'chatty' ? prev.chatty + 1 : prev.chatty - 1
                    };
                }
                if (type === 'quiet') return { ...prev, quiet: Math.max(0, prev.quiet - 1) };
                return { ...prev, chatty: Math.max(0, prev.chatty - 1) };
            });

            if (error.response?.status === 400) {
                showToast("투표 처리 중 문제가 발생했습니다.", "warning");
            } else if (error.response?.status === 401) {
                showToast("로그인이 필요한 기능입니다.", "warning");
            } else {
                showToast("투표 처리 중 오류가 발생했습니다.", "error");
            }
        }
    };

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
            executeScrap(null, true);
        } else {
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

    const handleRenameFolder = async (newName: string) => {
        if (!folderToEdit || !newName) return;
        try {
            const oldFolder = encodeURIComponent(folderToEdit);
            const newFolder = encodeURIComponent(newName);
            await axiosInstance.put(`/scraps/folders?oldFolderName=${oldFolder}&newFolderName=${newFolder}`);
            showToast("폴더 이름이 변경되었습니다.");
            
            if (selectedFolder === folderToEdit) {
                setSelectedFolder(newName);
            }
            
            setFolderToEdit(null);
            setShowRenameModal(false);
            mutateScraps();
            mutate((key: any) => typeof key === 'string' && (key.includes('/places') || key.includes('/scraps')));
        } catch (error: any) {
            console.error("폴더 이름 변경 실패:", error);
            showToast("폴더 이름 변경 중 오류가 발생했습니다.", "error");
        }
    };

    const handleDeleteFolder = async () => {
        if (!folderToEdit) return;
        try {
            const folder = encodeURIComponent(folderToEdit);
            await axiosInstance.delete(`/scraps/folders?folderName=${folder}`);
            showToast("폴더가 삭제되었습니다.");
            
            if (selectedFolder === folderToEdit) {
                setSelectedFolder(null);
            }
            
            setFolderToEdit(null);
            setShowDeleteConfirmModal(false);
            mutateScraps();
            mutate((key: any) => typeof key === 'string' && (key.includes('/places') || key.includes('/scraps')));
        } catch (error: any) {
            console.error("폴더 삭제 실패:", error);
            showToast("폴더 삭제 중 오류가 발생했습니다.", "error");
        }
    };

    const handleLogout = async () => {
        try {
            await axiosInstance.post('/auth/logout');
        } catch (error) {
            console.error('로그아웃 요청 실패:', error);
        } finally {
            authStore.logout();
            showToast("로그아웃 되었습니다.");
            setActiveView('home');
        }
    };

    const handleSaveProfile = async (newNickname: string, newProfileImage: string) => {
        const res = await axiosInstance.post('/auth/me', {
            nickname: newNickname,
            profileImageUrl: newProfileImage
        });
        
        setNickname(res.data.nickname);
        setProfileImage(res.data.profileImageUrl || "/profile_cat.png");
        
        authStore.login(res.data.nickname);
        localStorage.setItem("nickname", res.data.nickname);
        
        showToast("프로필이 저장되었습니다.");
    };

    const handleSaveSettings = (folder: string, theme: string, newThemeNotif: boolean, plannerNotif: boolean) => {
        setDefaultScrapFolder(folder);
        setAppTheme(theme);
        setNewThemeNotification(newThemeNotif);
        setPlannerNotification(plannerNotif);

        localStorage.setItem("defaultScrapFolder", folder);
        localStorage.setItem("appTheme", theme);
        localStorage.setItem("newThemeNotification", String(newThemeNotif));
        localStorage.setItem("plannerNotification", String(plannerNotif));
        showToast("설정이 저장되었습니다.");
    };

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

                    <div className="mt-auto pt-8 border-t border-[#F2F4F6] shrink-0 min-h-[90px]">
                        {!isMounted ? (
                            <div className="w-full h-[54px] bg-[#F9FAFB] border border-[#F2F4F6] animate-pulse rounded-[16px] flex items-center justify-center text-[13px] text-[#8B95A1] font-semibold">
                                로딩 중...
                            </div>
                        ) : isLoggedIn ? (
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
                    {/* 상시 마운트하여 스크롤 및 입력 상태를 보존하되 display 속성으로 토글 */}
                    <DiscoverView 
                        hidden={activeView !== 'home'} 
                        placesData={!isMounted || (isLoggedIn && discoverPlacesList === initialPlaces) ? [] : discoverPlacesData} 
                        onPlaceClick={handlePlaceClick} 
                        onCardSaveClick={handleCardSaveClick}
                        onViewChange={setActiveView}
                        onShowTermsModal={setShowTermsModal}
                        loadMore={loadMoreDiscover}
                        hasMore={discoverHasMore}
                        isLoadingMore={discoverIsLoadingMore}
                        isValidating={isDiscoverValidating}
                        activeThemeName={curationData?.activeThemeName}
                        isLoggedIn={isLoggedIn}
                    />

                    <CurationView 
                        hidden={activeView !== 'curation'}
                        onPlaceClick={handlePlaceClick}
                        onCardSaveClick={handleCardSaveClick}
                        onViewChange={setActiveView}
                        isLoggedIn={isLoggedIn}
                        curationData={curationData}
                        isValidating={isCurationValidating}
                    />

                    <ExploreView
                        hidden={activeView !== 'explore'}
                        searchKeyword={searchKeyword}
                        setSearchKeyword={setSearchKeyword}
                        selectedTags={selectedTags}
                        toggleTag={toggleTag}
                        filteredPlaces={explorePlacesData}
                        onPlaceClick={handlePlaceClick}
                        onCardSaveClick={handleCardSaveClick}
                        onViewChange={setActiveView}
                        setSelectedTags={setSelectedTags}
                        loadMore={loadMoreExplore}
                        hasMore={exploreHasMore}
                        isLoadingMore={exploreIsLoadingMore}
                        isValidating={isExploreValidating}
                        totalElements={explorePageData?.totalElements ?? 0}
                    />

                    <CollectionView
                        hidden={activeView !== 'collection'}
                        isLoggedIn={isLoggedIn}
                        scrapsData={scrapsData}
                        foldersMap={foldersMap}
                        selectedFolder={selectedFolder}
                        setSelectedFolder={setSelectedFolder}
                        setFolderToEdit={setFolderToEdit}
                        onPlaceClick={handlePlaceClick}
                        onViewChange={setActiveView}
                        showFolderSettings={showFolderSettings}
                        setShowFolderSettings={setShowFolderSettings}
                        setShowRenameModal={setShowRenameModal}
                        setShowDeleteConfirmModal={setShowDeleteConfirmModal}
                        mutateScraps={mutateScraps}
                        showToast={showToast}
                    />

                    <MyPageView
                        hidden={activeView !== 'mypage'}
                        nickname={nickname}
                        profileImage={profileImage}
                        userEmail={userEmail}
                        provider={provider}
                        emailVerified={emailVerified}
                        linkedProviders={linkedProviders}
                        refreshUserInfo={refreshUserInfo}
                        scrapsData={scrapsData}
                        foldersMap={foldersMap}
                        onViewChange={setActiveView}
                        setSelectedFolder={setSelectedFolder}
                        onAccountSettingsClick={() => setShowAccountModal(true)}
                        onAppSettingsClick={() => {}}
                        onLogout={handleLogout}
                        onShowTermsModal={setShowTermsModal}
                        showToast={showToast}
                        defaultScrapFolder={defaultScrapFolder}
                        appTheme={appTheme}
                        newThemeNotification={newThemeNotification}
                        plannerNotification={plannerNotification}
                        onSaveSettings={handleSaveSettings}
                    />
                </main>
            </div>

            {/* ========================================================
                모바일 하단 네비게이션 (상세 정보 창이 닫혀 있을 때만 노출)
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
                                if (!isMounted) return;
                                if (isLoggedIn) {
                                    setActiveView('mypage');
                                } else {
                                    router.push('/login');
                                }
                            }} 
                            className={`flex flex-col items-center gap-1 flex-1 py-1 transition-all relative ${activeView === 'mypage' ? 'text-[#191F28]' : 'text-[#8B95A1] hover:text-[#4E5968]'}`}
                        >
                            <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={activeView === 'mypage' ? 2.5 : 2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            <span className="text-[10px] font-bold">{!isMounted ? '...' : isLoggedIn ? '마이' : '로그인'}</span>
                            {activeView === 'mypage' && <span className="absolute bottom-[-3px] w-1.5 h-1.5 rounded-full bg-orange-500"></span>}
                        </button>
                    </nav>
                </div>
            )}

            {/* ========================================================
                모달 창 목록
            ======================================================== */}

            {/* 시크릿 스팟 오버레이 */}
            <HiddenGemPopup 
                isOpen={showHiddenGemPopup} 
                hiddenGemPlace={hiddenGemPlace} 
                onClose={() => setShowHiddenGemPopup(false)} 
                onOpenSecret={() => {
                    setShowHiddenGemPopup(false);
                    setSelectedPlace(hiddenGemPlace);
                }} 
            />

            {/* 장소 상세 정보 모달 */}
            <PlaceDetailModal 
                selectedPlace={selectedPlace} 
                isDetailOpen={isDetailOpen} 
                onClose={handleCloseDetail} 
                userVotedVibe={userVotedVibe} 
                vibeStats={vibeStats} 
                onVibeVote={handleVibeVote} 
                isSaved={isSaved} 
                isBookmarkPopping={isBookmarkPopping} 
                onSaveClick={handleSaveClick} 
                isLoggedIn={isLoggedIn}
                showToast={showToast}
            />

            {/* 북마크 저장 위치 선택 */}
            <FolderSelectModal 
                isOpen={showFolderModal} 
                onClose={closeFolderModal} 
                foldersMap={foldersMap} 
                onExecuteScrap={executeScrap} 
            />

            {/* 폴더 이름 변경 */}
            <FolderRenameModal 
                isOpen={showRenameModal} 
                onClose={() => {
                    setShowRenameModal(false);
                    setFolderToEdit(null);
                }} 
                selectedFolder={folderToEdit} 
                onRename={handleRenameFolder} 
            />

            {/* 폴더 삭제 확인 */}
            <FolderDeleteConfirmModal 
                isOpen={showDeleteConfirmModal} 
                onClose={() => {
                    setShowDeleteConfirmModal(false);
                    setFolderToEdit(null);
                }} 
                selectedFolder={folderToEdit} 
                folderScrapsCount={(folderToEdit && foldersMap[folderToEdit])?.length || 0} 
                onDeleteConfirm={handleDeleteFolder} 
            />

            {/* 이용약관 모달 */}
            <TermsAndPrivacyModal 
                isOpen={!!showTermsModal} 
                type={showTermsModal} 
                onClose={() => setShowTermsModal(null)} 
            />

            {/* 계정 정보 수정 */}
            <AccountEditModal 
                isOpen={showAccountModal} 
                onClose={() => setShowAccountModal(false)} 
                nickname={nickname} 
                profileImage={profileImage} 
                userEmail={userEmail} 
                onSave={handleSaveProfile} 
                showToast={showToast} 
            />



            {/* 토스트 알림창 */}
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
