'use client';

import React, { useState, useEffect } from 'react';
import { THEME_MAP } from './StagingTab';

interface CurationTabProps {
    setStatusMsg: (msg: { type: 'success' | 'error' | 'info'; text: string } | null) => void;
}

interface CurationSetting {
    mode: string;
    manualTheme: string;
}

interface CurationStat {
    themeKey: string;
    themeName: string;
    totalPlaces: number;
    publishedPlaces: number;
    totalScraps: number;
}

export default function CurationTab({ setStatusMsg }: CurationTabProps) {
    const [settings, setSettings] = useState<CurationSetting>({ mode: 'AUTO', manualTheme: 'rainy_indoor' });
    const [stats, setStats] = useState<CurationStat[]>([]);
    const [activeTheme, setActiveTheme] = useState<string>('rainy_indoor');
    const [mappedPlaces, setMappedPlaces] = useState<any[]>([]);
    const [mappedPage, setMappedPage] = useState<number>(0);
    const [mappedTotalPages, setMappedTotalPages] = useState<number>(0);
    const [isPlacesLoading, setIsPlacesLoading] = useState<boolean>(false);

    // 검색 관련 상태
    const [searchKeyword, setSearchKeyword] = useState<string>('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchPage, setSearchPage] = useState<number>(0);
    const [searchTotalPages, setSearchTotalPages] = useState<number>(0);
    const [isSearching, setIsSearching] = useState<boolean>(false);

    const adminKey = typeof window !== 'undefined' ? sessionStorage.getItem('adminSecretKey') || '' : '';

    // 1. 설정 및 통계 데이터 가져오기
    const fetchSettingsAndStats = async () => {
        try {
            // 설정 로드
            const settingsRes = await fetch('http://localhost:8080/api/v1/admin/curation/settings', {
                headers: { 'X-Admin-Secret-Key': adminKey }
            });
            if (settingsRes.ok) {
                const settingsData = await settingsRes.json();
                setSettings(settingsData);
            } else {
                setStatusMsg({ type: 'error', text: `큐레이션 설정 로드 실패 (HTTP ${settingsRes.status})` });
            }

            // 통계 로드
            const statsRes = await fetch('http://localhost:8080/api/v1/admin/curation/stats', {
                headers: { 'X-Admin-Secret-Key': adminKey }
            });
            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(statsData);
            } else {
                setStatusMsg({ type: 'error', text: `큐레이션 통계 로드 실패 (HTTP ${statsRes.status})` });
            }
        } catch (err: any) {
            console.error('설정/통계 로드 에러:', err);
        }
    };

    // 2. 특정 테마의 매핑된 장소 목록 가져오기
    const fetchMappedPlaces = async (theme: string, page: number) => {
        setIsPlacesLoading(true);
        try {
            const res = await fetch(`http://localhost:8080/api/v1/admin/curation/places?theme=${theme}&page=${page}&size=10`, {
                headers: { 'X-Admin-Secret-Key': adminKey }
            });
            if (res.ok) {
                const data = await res.json();
                setMappedPlaces(data.content || []);
                setMappedTotalPages(data.totalPages || 0);
                setMappedPage(data.number || 0);
            } else {
                setStatusMsg({ type: 'error', text: `매핑 장소 로드 실패 (HTTP ${res.status})` });
            }
        } catch (err: any) {
            setStatusMsg({ type: 'error', text: '매핑 장소 조회 실패: ' + err.message });
        } finally {
            setIsPlacesLoading(false);
        }
    };

    // 3. 일반 장소 검색하기
    const handleSearch = async (keyword: string, page: number) => {
        if (!keyword.trim()) return;
        setIsSearching(true);
        try {
            const res = await fetch(`http://localhost:8080/api/v1/admin/curation/places/search?keyword=${encodeURIComponent(keyword.trim())}&page=${page}&size=5`, {
                headers: { 'X-Admin-Secret-Key': adminKey }
            });
            if (res.ok) {
                const data = await res.json();
                setSearchResults(data.content || []);
                setSearchTotalPages(data.totalPages || 0);
                setSearchPage(data.number || 0);
            }
        } catch (err: any) {
            setStatusMsg({ type: 'error', text: '장소 검색 실패: ' + err.message });
        } finally {
            setIsSearching(false);
        }
    };

    useEffect(() => {
        fetchSettingsAndStats();
    }, []);

    useEffect(() => {
        fetchMappedPlaces(activeTheme, 0);
    }, [activeTheme]);

    // 4. 설정 변경 요청
    const handleSaveSettings = async () => {
        try {
            const res = await fetch('http://localhost:8080/api/v1/admin/curation/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Admin-Secret-Key': adminKey
                },
                body: JSON.stringify(settings)
            });

            if (res.ok) {
                setStatusMsg({ type: 'success', text: '🎉 실시간 큐레이션 강제 재정의 설정이 저장되었습니다.' });
                fetchSettingsAndStats();
            } else {
                setStatusMsg({ type: 'error', text: '설정 저장 실패: HTTP ' + res.status });
            }
        } catch (err: any) {
            setStatusMsg({ type: 'error', text: '설정 저장 에러: ' + err.message });
        }
    };

    // 5. 특정 장소의 테마 매핑 수정 (지정 / 해제)
    const handleUpdateTheme = async (placeId: number, theme: string | null, name: string) => {
        try {
            const res = await fetch(`http://localhost:8080/api/v1/admin/curation/places/${placeId}/theme`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Admin-Secret-Key': adminKey
                },
                body: JSON.stringify({ theme })
            });

            if (res.ok) {
                setStatusMsg({
                    type: 'success',
                    text: theme 
                        ? `🎉 '${name}' 공간이 '${THEME_MAP[theme]?.label || theme}' 테마에 매핑되었습니다.`
                        : `❌ '${name}' 공간의 테마 매핑이 해제되었습니다.`
                });
                // 목록 갱신
                fetchMappedPlaces(activeTheme, mappedPage);
                fetchSettingsAndStats();
                // 검색 결과 혹은 매핑 데이터의 로컬 상태 반영
                setSearchResults(prev => prev.map(item => {
                    if (item.id === placeId) {
                        return { ...item, curationTheme: theme };
                    }
                    return item;
                }));
            } else {
                setStatusMsg({ type: 'error', text: '테마 수정 실패: HTTP ' + res.status });
            }
        } catch (err: any) {
            setStatusMsg({ type: 'error', text: '테마 수정 에러: ' + err.message });
        }
    };

    const CURATION_THEMES = [
        { key: 'rainy_indoor', label: '비오는 날 ☔', style: 'bg-indigo-50 border-indigo-100 text-indigo-600 hover:border-indigo-300' },
        { key: 'spring', label: '봄 피크닉 🌸', style: 'bg-rose-50 border-rose-100 text-rose-600 hover:border-rose-300' },
        { key: 'summer', label: '여름 바캉스 🌊', style: 'bg-blue-50 border-blue-100 text-blue-600 hover:border-blue-300' },
        { key: 'autumn', label: '가을 단풍 🍁', style: 'bg-amber-50 border-amber-100 text-amber-600 hover:border-amber-300' },
        { key: 'winter', label: '겨울 온천 ♨️', style: 'bg-teal-50 border-teal-100 text-teal-600 hover:border-teal-300' },
        { key: 'wellness', label: '웰니스 다도 🍵', style: 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:border-emerald-300' },
        { key: 'pet_friendly', label: '반려동물 🐶', style: 'bg-violet-50 border-violet-100 text-violet-600 hover:border-violet-300' },
        { key: 'night_market', label: '로컬 야시장 🍺', style: 'bg-amber-50 border-amber-100 text-amber-800 hover:border-amber-300' }
    ];

    return (
        <div className="flex flex-col gap-8 animate-fade-in font-display">
            {/* 상단 안내 배너 */}
            <div className="bg-gradient-to-r from-[#FAFAFA] to-[#F2F4F6] p-8 rounded-[30px] border border-[#E5E8EB]/70 flex flex-col gap-1.5 shadow-[inset_0_1px_2px_rgba(255,255,255,0.8)]">
                <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-[8px] bg-orange-500/10 text-orange-600 text-[11px] font-black uppercase tracking-wider">
                        Curation Console
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B0B8C1]"></span>
                    <span className="text-[12px] text-[#8B95A1] font-bold">큐레이션 종합 설정</span>
                </div>
                <h2 className="text-[22px] font-bold text-[#191F28] tracking-tight mt-1">실시간 감성 큐레이션 관리자 센터</h2>
                <p className="text-[14px] text-[#4E5968] leading-relaxed max-w-[720px]">
                    사용자 발견 탭에 공급되는 날씨/계절별 실시간 큐레이션을 수동으로 오버라이드하거나, 각 테마별 수집 공간 목록을 간편하게 매핑하고 성과 지표를 추적할 수 있습니다.
                </p>
            </div>

            {/* 1단: 실시간 오버라이드 및 통계 대시보드 */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* 1. 실시간 테마 강제 재정의 카드 - 5컬럼 */}
                <div className="lg:col-span-5 bg-white rounded-[24px] border border-[#E5E8EB] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.01)] flex flex-col gap-6">
                    <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                            <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-bold text-[16px] text-[#191F28] tracking-tight">실시간 테마 강제 재정의</h3>
                            <p className="text-[12px] text-[#8B95A1] mt-0.5 font-medium">자동(기상 API 연동) 또는 수동(특정 테마 고정) 설정</p>
                        </div>
                    </div>

                    {/* 모드 선택 토글 */}
                    <div className="flex bg-[#F2F4F6] p-1 rounded-[14px]">
                        <button
                            type="button"
                            onClick={() => setSettings(prev => ({ ...prev, mode: 'AUTO' }))}
                            className={`flex-1 py-2.5 rounded-[11px] text-[13px] font-bold transition-all border-none outline-none cursor-pointer ${
                                settings.mode === 'AUTO' 
                                    ? 'bg-white text-[#191F28] shadow-sm' 
                                    : 'text-[#8B95A1] hover:text-[#4E5968]'
                            }`}
                        >
                            실시간 자동 모드 (기상청 API)
                        </button>
                        <button
                            type="button"
                            onClick={() => setSettings(prev => ({ ...prev, mode: 'MANUAL' }))}
                            className={`flex-1 py-2.5 rounded-[11px] text-[13px] font-bold transition-all border-none outline-none cursor-pointer ${
                                settings.mode === 'MANUAL' 
                                    ? 'bg-white text-[#191F28] shadow-sm' 
                                    : 'text-[#8B95A1] hover:text-[#4E5968]'
                            }`}
                        >
                            관리자 수동 강제 지정
                        </button>
                    </div>

                    {/* 수동 강제 테마 선택 (MANUAL일 때만 활성화) */}
                    <div className={`flex flex-col gap-2 transition-all duration-300 ${settings.mode === 'AUTO' ? 'opacity-40 pointer-events-none' : ''}`}>
                        <label className="text-[13px] font-bold text-[#8B95A1] pl-1">강제 노출할 감성 테마 선택</label>
                        <select
                            value={settings.manualTheme}
                            onChange={(e) => setSettings(prev => ({ ...prev, manualTheme: e.target.value }))}
                            className="w-full bg-[#F2F4F6] text-[#191F28] text-[14.5px] font-semibold rounded-[14px] px-4 py-3.5 border-none outline-none focus:ring-2 focus:ring-orange-500/20"
                        >
                            <option value="rainy_indoor">🌧️ 비오는 날 (rainy_indoor)</option>
                            <option value="spring">🌸 봄 피크닉 (spring)</option>
                            <option value="summer">🌊 여름 바캉스 (summer)</option>
                            <option value="autumn">🍁 가을 단풍 (autumn)</option>
                            <option value="winter">❄️ 겨울 온기 (winter / 눈오는 날 포함)</option>
                            <option value="wellness">🍵 웰니스 다도 (wellness)</option>
                            <option value="pet_friendly">🐶 반려동물 (pet_friendly)</option>
                            <option value="night_market">🍺 로컬 야시장 (night_market)</option>
                        </select>
                    </div>

                    <button
                        type="button"
                        onClick={handleSaveSettings}
                        className="w-full py-4 rounded-[14px] bg-[#191F28] hover:bg-black text-white font-extrabold text-[13.5px] transition-all border-none outline-none cursor-pointer active:scale-[0.98] shadow-sm"
                    >
                        큐레이션 상태 설정 저장
                    </button>
                </div>

                {/* 2. 큐레이션 통계 대시보드 - 7컬럼 */}
                <div className="lg:col-span-7 bg-white rounded-[24px] border border-[#E5E8EB] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.01)] flex flex-col gap-6">
                    <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                            <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2zm12 0v-3a2 2 0 00-2-2h-2a2 2 0 00-2 2v3a2 2 0 002 2h2a2 2 0 002-2zm0 0v-8a2 2 0 00-2-2h-2a2 2 0 00-2 2v8a2 2 0 002 2h2a2 2 0 002-2z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-bold text-[16px] text-[#191F28] tracking-tight">테마별 적재 및 성과 지표</h3>
                            <p className="text-[12px] text-[#8B95A1] mt-0.5 font-medium">테마별 총 지정 공간수 및 누적 유저 스크랩 카운트</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[#F2F4F6]">
                                    <th className="pb-3 text-[12px] font-bold text-[#8B95A1]">큐레이션 테마</th>
                                    <th className="pb-3 text-center text-[12px] font-bold text-[#8B95A1]">총 공간 수</th>
                                    <th className="pb-3 text-center text-[12px] font-bold text-[#8B95A1]">공개 노출 중</th>
                                    <th className="pb-3 text-right text-[12px] font-bold text-[#8B95A1]">누적 유저 스크랩</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.length > 0 ? (
                                    stats.map(stat => (
                                        <tr key={stat.themeKey} className="border-b border-[#F2F4F6] hover:bg-[#F9FAFB]/50 transition-colors">
                                            <td className="py-4 text-[13.5px] font-bold text-[#191F28] flex items-center gap-2">
                                                <span className={`px-2 py-0.5 rounded-[6px] text-[11px] font-semibold ${
                                                    THEME_MAP[stat.themeKey]?.style || 'bg-[#F2F4F6]'
                                                }`}>
                                                    {stat.themeName}
                                                </span>
                                            </td>
                                            <td className="py-4 text-center text-[14px] font-extrabold text-[#4E5968]">{stat.totalPlaces}곳</td>
                                            <td className="py-4 text-center text-[14px] font-extrabold text-emerald-600">{stat.publishedPlaces}곳</td>
                                            <td className="py-4 text-right text-[14px] font-extrabold text-orange-500">❤️ {stat.totalScraps}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="py-10 text-center text-[#B0B8C1] text-[13px] font-semibold">
                                            통계 데이터를 조회하는 중입니다...
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* 2단: 테마별 매핑 에디터 */}
            <div className="bg-white rounded-[24px] border border-[#E5E8EB] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.01)] flex flex-col gap-6">
                
                {/* 섹션 타이틀 */}
                <div className="flex flex-col gap-1 border-b border-[#F2F4F6] pb-4">
                    <h3 className="font-extrabold text-[18px] text-[#191F28] tracking-tight">큐레이션 매핑 에디터</h3>
                    <p className="text-[13px] text-[#8B95A1]">원하는 테마 탭을 골라 등록 공간을 편집하거나 새로운 공간을 큐레이션 리스트에 신규 바인딩할 수 있습니다.</p>
                </div>

                {/* 테마 셀렉터 필터 버튼 탭 */}
                <div className="flex flex-wrap gap-2.5">
                    {CURATION_THEMES.map(theme => (
                        <button
                            key={theme.key}
                            onClick={() => {
                                setActiveTheme(theme.key);
                                setMappedPage(0);
                            }}
                            className={`px-4.5 py-3 rounded-[14px] text-[13.5px] font-extrabold transition-all cursor-pointer border ${
                                activeTheme === theme.key
                                    ? 'bg-[#191F28] text-white border-[#191F28] shadow-sm'
                                    : 'bg-[#F2F4F6] text-[#4E5968] border-transparent hover:bg-[#E5E8EB]'
                            }`}
                        >
                            {theme.label}
                        </button>
                    ))}
                </div>

                {/* 2열 메인 작업 영역: 매핑된 장소 리스트(왼쪽: 7) & 신규 매핑 검색 추가(오른쪽: 5) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-2">
                    
                    {/* A. 현재 테마 매핑 공간 목록 - 7컬럼 */}
                    <div className="lg:col-span-7 flex flex-col gap-4">
                        <div className="flex justify-between items-center pl-1">
                            <span className="text-[13.5px] font-extrabold text-[#4E5968]">
                                현재 테마에 등록된 공간 ({mappedPlaces.length}곳)
                            </span>
                        </div>

                        {isPlacesLoading ? (
                            <div className="flex flex-col items-center justify-center py-16 border border-dashed border-[#E5E8EB] rounded-[20px] bg-[#FAFAFA]">
                                <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-[12.5px] text-[#8B95A1] font-semibold mt-3">공간 목록을 불러오는 중...</p>
                            </div>
                        ) : mappedPlaces.length > 0 ? (
                            <div className="flex flex-col gap-3">
                                {mappedPlaces.map(place => (
                                    <div
                                        key={place.id}
                                        className="bg-white rounded-[20px] border border-[#E5E8EB] p-4 flex gap-4 items-center justify-between shadow-[0_2px_8px_rgba(0,0,0,0.005)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.015)] transition-all group"
                                    >
                                        <div className="flex items-center gap-3.5 min-w-0">
                                            <div className="w-13 h-13 rounded-[12px] overflow-hidden shrink-0 bg-[#F2F4F6]">
                                                <img
                                                    src={place.thumbnailUrl}
                                                    className="w-full h-full object-cover"
                                                    alt=""
                                                    onError={(e) => {
                                                        e.currentTarget.src = '/default_place.png';
                                                    }}
                                                />
                                            </div>
                                            <div className="min-w-0 flex flex-col">
                                                <span className="text-[10px] font-extrabold text-[#8B95A1] uppercase tracking-wider">{place.category}</span>
                                                <h4 className="text-[14.5px] font-extrabold text-[#191F28] truncate group-hover:text-orange-500 transition-colors">
                                                    {place.name}
                                                </h4>
                                                <p className="text-[12px] text-[#8B95A1] truncate mt-0.5">{place.address}</p>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleUpdateTheme(place.id, null, place.name)}
                                            className="px-3 py-2 rounded-[10px] bg-red-50 hover:bg-red-100 text-red-600 text-[11.5px] font-extrabold transition-all border-none outline-none active:scale-[0.96] shrink-0 cursor-pointer"
                                        >
                                            테마 매핑 해제
                                        </button>
                                    </div>
                                ))}

                                {/* 페이징 컨트롤 */}
                                {mappedTotalPages > 1 && (
                                    <div className="flex items-center justify-center gap-2 mt-4">
                                        <button
                                            disabled={mappedPage === 0}
                                            onClick={() => fetchMappedPlaces(activeTheme, mappedPage - 1)}
                                            className="p-2 rounded-[8px] bg-[#F2F4F6] text-[#4E5968] disabled:opacity-40 border-none cursor-pointer"
                                        >
                                            이전
                                        </button>
                                        <span className="text-[13px] font-bold text-[#8B95A1]">
                                            {mappedPage + 1} / {mappedTotalPages}
                                        </span>
                                        <button
                                            disabled={mappedPage + 1 >= mappedTotalPages}
                                            onClick={() => fetchMappedPlaces(activeTheme, mappedPage + 1)}
                                            className="p-2 rounded-[8px] bg-[#F2F4F6] text-[#4E5968] disabled:opacity-40 border-none cursor-pointer"
                                        >
                                            다음
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 border border-dashed border-[#E5E8EB] rounded-[20px] bg-[#FAFAFA] text-center">
                                <span className="text-[32px] mb-2">🏝️</span>
                                <h4 className="text-[14.5px] font-bold text-[#191F28]">이 테마에 지정된 장소가 없습니다</h4>
                                <p className="text-[12.5px] text-[#8B95A1] mt-1 max-w-[280px] leading-relaxed">
                                    우측의 장소 검색 패널에서 공간을 찾아 이 테마에 신규 매핑하여 활성화해 주세요.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* B. 신규 장소 검색 및 추가 패널 - 5컬럼 */}
                    <div className="lg:col-span-5 bg-[#FAFAFA] rounded-[24px] border border-[#E5E8EB] p-5.5 flex flex-col gap-4">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[14.5px] font-extrabold text-[#191F28] tracking-tight">신규 장소 매핑 추가</span>
                            <span className="text-[11.5px] text-[#8B95A1] font-semibold">데이터베이스에 적재된 모든 장소 대상 검색</span>
                        </div>

                        {/* 검색 바 */}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="장소명 또는 주소 검색..."
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSearch(searchKeyword, 0);
                                }}
                                className="flex-1 bg-white text-[#191F28] text-[13.5px] font-bold rounded-[12px] px-3.5 py-2.5 border border-[#E5E8EB] focus:border-orange-500 focus:outline-none transition-all placeholder-[#B0B8C1]"
                            />
                            <button
                                type="button"
                                onClick={() => handleSearch(searchKeyword, 0)}
                                className="px-4 py-2.5 rounded-[12px] bg-[#191F28] hover:bg-black text-white text-[13.5px] font-extrabold transition-all border-none cursor-pointer"
                            >
                                검색
                            </button>
                        </div>

                        {/* 검색 결과 목록 */}
                        {isSearching ? (
                            <div className="flex flex-col items-center justify-center py-10 bg-white border border-[#E5E8EB] rounded-[18px]">
                                <div className="w-6 h-6 border-2.5 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-[11.5px] text-[#8B95A1] font-bold mt-2.5">검색 결과를 조회하고 있습니다...</span>
                            </div>
                        ) : searchResults.length > 0 ? (
                            <div className="flex flex-col gap-2.5">
                                {searchResults.map(place => {
                                    const isAlreadyHere = place.curationTheme === activeTheme;
                                    return (
                                        <div
                                            key={place.id}
                                            className="bg-white rounded-[16px] border border-[#E5E8EB] p-3 flex justify-between items-center gap-3 shadow-[0_2px_4px_rgba(0,0,0,0.002)]"
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="w-10 h-10 rounded-[8px] overflow-hidden shrink-0 bg-[#F2F4F6]">
                                                    <img
                                                        src={place.thumbnailUrl}
                                                        className="w-full h-full object-cover"
                                                        alt=""
                                                        onError={(e) => {
                                                            e.currentTarget.src = '/default_place.png';
                                                        }}
                                                    />
                                                </div>
                                                <div className="min-w-0 flex flex-col">
                                                    <h5 className="text-[13px] font-bold text-[#191F28] truncate">{place.name}</h5>
                                                    <p className="text-[11px] text-[#8B95A1] truncate mt-0.5">
                                                        {place.curationTheme ? (
                                                            <span className="text-orange-500 font-extrabold">
                                                                #{THEME_MAP[place.curationTheme]?.label?.split(' ')[0] || place.curationTheme} 지정됨
                                                            </span>
                                                        ) : (
                                                            '테마 없음'
                                                        )}
                                                    </p>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                disabled={isAlreadyHere}
                                                onClick={() => handleUpdateTheme(place.id, activeTheme, place.name)}
                                                className={`px-3 py-1.5 rounded-[8px] text-[11px] font-bold transition-all border-none outline-none cursor-pointer shrink-0 ${
                                                    isAlreadyHere 
                                                        ? 'bg-gray-100 text-gray-400 opacity-60 cursor-not-allowed' 
                                                        : 'bg-orange-500 hover:bg-orange-600 text-white active:scale-[0.96]'
                                                }`}
                                            >
                                                {isAlreadyHere ? '매핑 완료' : '이 테마에 추가'}
                                            </button>
                                        </div>
                                    );
                                })}

                                {/* 검색 결과 페이징 */}
                                {searchTotalPages > 1 && (
                                    <div className="flex items-center justify-center gap-2 mt-2">
                                        <button
                                            disabled={searchPage === 0}
                                            onClick={() => handleSearch(searchKeyword, searchPage - 1)}
                                            className="px-2.5 py-1 text-[11px] font-bold rounded-[6px] bg-white border border-[#E5E8EB] text-[#4E5968] disabled:opacity-40 cursor-pointer"
                                        >
                                            이전
                                        </button>
                                        <span className="text-[11.5px] font-bold text-[#8B95A1]">
                                            {searchPage + 1} / {searchTotalPages}
                                        </span>
                                        <button
                                            disabled={searchPage + 1 >= searchTotalPages}
                                            onClick={() => handleSearch(searchKeyword, searchPage + 1)}
                                            className="px-2.5 py-1 text-[11px] font-bold rounded-[6px] bg-white border border-[#E5E8EB] text-[#4E5968] disabled:opacity-40 cursor-pointer"
                                        >
                                            다음
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : searchKeyword.trim() ? (
                            <div className="py-8 text-center text-[#B0B8C1] text-[12px] font-semibold bg-white border border-[#E5E8EB] rounded-[18px]">
                                검색된 장소가 없습니다.
                            </div>
                        ) : (
                            <div className="py-8 text-center text-[#B0B8C1] text-[12px] font-semibold bg-white border border-[#E5E8EB] rounded-[18px]">
                                장소명이나 주소 키워드를 입력해 보세요.
                            </div>
                        )}
                    </div>

                </div>

            </div>
        </div>
    );
}
