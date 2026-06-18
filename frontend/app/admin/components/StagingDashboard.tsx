'use client';

import React, { useState, useEffect } from 'react';
import PlaceModal, { PlaceStagingData } from './PlaceModal';
import StagingTab from './StagingTab';
import ManagementTab from './ManagementTab';
import StatsTab from './StatsTab';
import SettingsTab from './SettingsTab';

interface StagingDashboardProps {
    onLogout: () => void;
}

export default function StagingDashboard({ onLogout }: StagingDashboardProps) {
    const [activeMenu, setActiveMenu] = useState<'staging' | 'management' | 'stats' | 'settings'>('staging');
    
    // 탭 1 (신규 적재) 상태
    const [places, setPlaces] = useState<PlaceStagingData[]>([]);
    const [selectedPlaceIndex, setSelectedPlaceIndex] = useState<number | null>(null);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    
    // 탭 2 (기존 장소 관리) 상태
    const [dbPlaces, setDbPlaces] = useState<any[]>([]);
    const [isDbLoading, setIsDbLoading] = useState<boolean>(false);
    const [selectedDbPlaceIndex, setSelectedDbPlaceIndex] = useState<number | null>(null);

    const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

    // DB 데이터 로드
    const fetchDbPlaces = async () => {
        setIsDbLoading(true);
        const adminKey = sessionStorage.getItem('adminSecretKey') || '';
        try {
            const res = await fetch('http://localhost:8080/api/v1/admin/places', {
                headers: {
                    'X-Admin-Secret-Key': adminKey
                }
            });

            if (res.status === 403) {
                setStatusMsg({ type: 'error', text: '접근이 거부되었습니다. 비밀번호가 만료되었습니다.' });
                onLogout();
                return;
            }

            if (res.ok) {
                const data = await res.json();
                setDbPlaces(data);
            } else {
                setStatusMsg({ type: 'error', text: `목록 로드 실패: HTTP ${res.status}` });
            }
        } catch (err: any) {
            setStatusMsg({ type: 'error', text: '서버 연결 실패: ' + err.message });
        } finally {
            setIsDbLoading(false);
        }
    };

    // 메뉴 전환 시 DB 데이터 로드 및 상태 메세지 초기화
    useEffect(() => {
        setStatusMsg(null);
        if (activeMenu === 'management' || activeMenu === 'stats' || activeMenu === 'settings') {
            fetchDbPlaces();
        }
    }, [activeMenu]);

    // 백엔드 중복 검사 호출
    const checkDuplicates = async (stagingPlaces: PlaceStagingData[]) => {
        const externalIds = stagingPlaces.map(p => p.externalId);
        const adminKey = sessionStorage.getItem('adminSecretKey') || '';

        try {
            const res = await fetch('http://localhost:8080/api/v1/admin/places/check-duplicates', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Admin-Secret-Key': adminKey
                },
                body: JSON.stringify(externalIds)
            });

            if (res.status === 403) {
                setStatusMsg({ type: 'error', text: '접근이 거부되었습니다. 비밀번호가 만료되었습니다.' });
                onLogout();
                return;
            }

            if (res.ok) {
                const duplicateMap: Record<string, boolean> = await res.json();
                const updated = stagingPlaces.map(p => {
                    const isDup = !!duplicateMap[p.externalId];
                    return {
                        ...p,
                        isDuplicate: isDup,
                        isPublished: !isDup
                    };
                });
                setPlaces(updated);
            } else {
                setPlaces(stagingPlaces);
            }
        } catch (err) {
            console.error('중복 검사 오류:', err);
            setPlaces(stagingPlaces);
        }
    };

    // 탭 1 장소 임시 수정 적용 (메모리 반영)
    const handleSaveStagingDetail = (index: number, updatedData: Partial<PlaceStagingData>) => {
        const updated = [...places];
        updated[index] = { ...updated[index], ...updatedData };
        setPlaces(updated);
        setSelectedPlaceIndex(null);
        setStatusMsg({ type: 'success', text: `'${updated[index].name}' 장소 정보가 임시 반영되었습니다.` });
    };

    // 탭 2 장소 DB 수정 적용 (실제 DB 반영)
    const handleSaveDbDetail = async (index: number, updatedData: Partial<PlaceStagingData>) => {
        const target = dbPlaces[index];
        const adminKey = sessionStorage.getItem('adminSecretKey') || '';
        
        const payload = {
            name: updatedData.name || target.name,
            address: updatedData.address || target.address,
            externalId: target.externalId,
            latitude: target.latitude,
            longitude: target.longitude,
            category: updatedData.category || target.category,
            thumbnailUrl: target.thumbnailUrl,
            imageUrls: target.imageUrls || target.thumbnailUrl || '',
            aiMoodSummary: target.aiMoodSummary,
            tags: updatedData.tags || target.tags.map((t: any) => t.name),
            editorsComment: updatedData.editorsComment || '',
            isPublished: updatedData.isPublished !== undefined ? updatedData.isPublished : target.isPublished
        };

        try {
            const res = await fetch(`http://localhost:8080/api/v1/admin/places/${target.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Admin-Secret-Key': adminKey
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setStatusMsg({ type: 'success', text: `'${payload.name}' 공간 정보가 수정 및 DB에 직접 반영되었습니다.` });
                setSelectedDbPlaceIndex(null);
                fetchDbPlaces(); // 목록 갱신
            } else {
                setStatusMsg({ type: 'error', text: '수정 실패: HTTP ' + res.status });
            }
        } catch (err: any) {
            setStatusMsg({ type: 'error', text: '수정 실패: ' + err.message });
        }
    };

    // 탭 2 장소 DB 삭제
    const handleDeleteDbPlace = async (id: number, name: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm(`'${name}' 공간을 정말로 데이터베이스에서 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
            return;
        }

        const adminKey = sessionStorage.getItem('adminSecretKey') || '';
        try {
            const res = await fetch(`http://localhost:8080/api/v1/admin/places/${id}`, {
                method: 'DELETE',
                headers: {
                    'X-Admin-Secret-Key': adminKey
                }
            });

            if (res.ok) {
                setStatusMsg({ type: 'success', text: `'${name}' 장소가 데이터베이스에서 성공적으로 삭제되었습니다.` });
                fetchDbPlaces();
            } else {
                setStatusMsg({ type: 'error', text: '삭제 실패: HTTP ' + res.status });
            }
        } catch (err: any) {
            setStatusMsg({ type: 'error', text: '삭제 실패: ' + err.message });
        }
    };

    // 탭 2 간이 공개 여부 토글 핸들러
    const handleQuickTogglePublish = async (id: number, currentStatus: boolean, name: string) => {
        const target = dbPlaces.find(p => p.id === id);
        if (!target) return;

        const adminKey = sessionStorage.getItem('adminSecretKey') || '';
        const payload = {
            name: target.name,
            address: target.address,
            externalId: target.externalId,
            latitude: target.latitude,
            longitude: target.longitude,
            category: target.category,
            thumbnailUrl: target.thumbnailUrl,
            imageUrls: target.imageUrls || target.thumbnailUrl || '',
            aiMoodSummary: target.aiMoodSummary,
            tags: target.tags ? target.tags.map((t: any) => t.name) : [],
            editorsComment: target.editorsComment || '',
            isPublished: !currentStatus
        };

        try {
            const res = await fetch(`http://localhost:8080/api/v1/admin/places/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Admin-Secret-Key': adminKey
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setStatusMsg({
                    type: 'success',
                    text: `'${name}' 장소를 ${!currentStatus ? '공개' : '비공개'} 상태로 즉시 변경했습니다.`
                });
                fetchDbPlaces();
            } else {
                setStatusMsg({ type: 'error', text: '상태 변경 실패: HTTP ' + res.status });
            }
        } catch (err: any) {
            setStatusMsg({ type: 'error', text: '서버 통신 실패: ' + err.message });
        }
    };

    // 탭 2 장소 다중 벌크 공개 여부 토글 핸들러
    const handleBulkTogglePublish = async (ids: number[], isPublished: boolean) => {
        const adminKey = sessionStorage.getItem('adminSecretKey') || '';
        const payload = {
            ids,
            isPublished
        };

        try {
            const res = await fetch('http://localhost:8080/api/v1/admin/places/bulk-publish-status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Admin-Secret-Key': adminKey
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setStatusMsg({
                    type: 'success',
                    text: `🎉 성공적으로 ${ids.length}개의 공간을 ${isPublished ? '공개' : '비공개'} 상태로 일괄 변경했습니다.`
                });
                fetchDbPlaces();
            } else {
                setStatusMsg({ type: 'error', text: '일괄 상태 변경 실패: HTTP ' + res.status });
            }
        } catch (err: any) {
            setStatusMsg({ type: 'error', text: '서버 통신 실패: ' + err.message });
        }
    };

    // 탭 2 장소 다중 벌크 삭제 핸들러
    const handleBulkDeleteDbPlaces = async (ids: number[]) => {
        const adminKey = sessionStorage.getItem('adminSecretKey') || '';
        try {
            const res = await fetch('http://localhost:8080/api/v1/admin/places/bulk-delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Admin-Secret-Key': adminKey
                },
                body: JSON.stringify(ids)
            });

            if (res.ok) {
                setStatusMsg({
                    type: 'success',
                    text: `🎉 성공적으로 ${ids.length}개의 공간을 데이터베이스에서 일괄 삭제했습니다.`
                });
                fetchDbPlaces(); // 목록 갱신
            } else {
                setStatusMsg({ type: 'error', text: '일괄 삭제 실패: HTTP ' + res.status });
            }
        } catch (err: any) {
            setStatusMsg({ type: 'error', text: '서버 통신 실패: ' + err.message });
        }
    };

    // 탭 1 최종 DB 벌크 주입
    const handleFinalSubmit = async () => {
        const targetPlaces = places.filter(p => p.isPublished);
        if (targetPlaces.length === 0) {
            setStatusMsg({ type: 'error', text: '최종 적재할 장소를 1개 이상 선택해 주세요.' });
            return;
        }

        setIsUploading(true);
        setStatusMsg({ type: 'info', text: '데이터베이스에 적재를 시작합니다...' });

        const adminKey = sessionStorage.getItem('adminSecretKey') || '';
        const payload = {
            places: targetPlaces.map(p => ({
                name: p.name,
                address: p.address,
                externalId: p.externalId,
                latitude: p.latitude,
                longitude: p.longitude,
                category: p.category,
                thumbnailUrl: p.thumbnailUrl,
                imageUrls: p.imageUrls,
                aiMoodSummary: p.aiMoodSummary,
                tags: p.tags,
                editorsComment: p.editorsComment || '',
                isPublished: true // 승인 적재 처리
            }))
        };

        try {
            const res = await fetch('http://localhost:8080/api/v1/admin/places/batch-publish', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Admin-Secret-Key': adminKey
                },
                body: JSON.stringify(payload)
            });

            if (res.status === 403) {
                setStatusMsg({ type: 'error', text: '권한이 없습니다. 다시 로그인해 주세요.' });
                onLogout();
                return;
            }

            if (res.ok) {
                const result = await res.json();
                setStatusMsg({ 
                    type: 'success', 
                    text: `🎉 데이터 적재 완료! 총 ${result.processedCount}개의 장소가 성공적으로 DB에 주입되었습니다.` 
                });
                setPlaces([]);
            } else {
                const errText = await res.text();
                setStatusMsg({ type: 'error', text: '적재 실패: ' + errText });
            }
        } catch (err: any) {
            setStatusMsg({ type: 'error', text: '서버 통신 실패: ' + err.message });
        } finally {
            setIsUploading(false);
        }
    };

    const selectedPlace = selectedPlaceIndex !== null ? places[selectedPlaceIndex] : null;
    
    // DB 장소 상세 편집 매핑용 DTO 래퍼
    const selectedDbPlaceMapped: PlaceStagingData | null = selectedDbPlaceIndex !== null ? {
        name: dbPlaces[selectedDbPlaceIndex].name,
        category: dbPlaces[selectedDbPlaceIndex].category,
        address: dbPlaces[selectedDbPlaceIndex].address,
        externalId: dbPlaces[selectedDbPlaceIndex].externalId,
        latitude: dbPlaces[selectedDbPlaceIndex].latitude,
        longitude: dbPlaces[selectedDbPlaceIndex].longitude,
        thumbnailUrl: dbPlaces[selectedDbPlaceIndex].thumbnailUrl,
        imageUrls: dbPlaces[selectedDbPlaceIndex].imageUrls || '',
        reviews: [],
        aiMoodSummary: dbPlaces[selectedDbPlaceIndex].aiMoodSummary || '',
        tags: dbPlaces[selectedDbPlaceIndex].tags ? dbPlaces[selectedDbPlaceIndex].tags.map((t: any) => t.name) : [],
        editorsComment: dbPlaces[selectedDbPlaceIndex].editorsComment || '',
        isPublished: dbPlaces[selectedDbPlaceIndex].isPublished
    } : null;

    return (
        <div className="flex h-screen w-full bg-[#F2F4F6] overflow-hidden font-display">
            {/* LNB (좌측 사이드바) - 고정 256px */}
            <aside className="w-64 bg-white border-r border-[#E5E8EB] flex flex-col z-10 shrink-0 h-full">
                <div className="p-6 flex flex-col items-center border-b border-[#F2F4F6]">
                    <h1 className="font-logo font-extrabold text-[22px] tracking-tight text-[#191F28]">
                        Pick<span className="text-orange-500">Pl</span><span className="text-[12px] font-black text-[#8B95A1] bg-[#F2F4F6] px-2 py-0.5 rounded-[6px] tracking-wide ml-2 font-display align-middle">CMS</span>
                    </h1>
                    <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mt-5 mb-2.5 shadow-inner">
                        <svg className="w-6 h-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <p className="font-bold text-[#191F28] text-[14px]">PickPl 최고 관리자</p>
                    <p className="text-[11px] text-[#8B95A1] mt-0.5 font-semibold">Administrator Mode</p>
                </div>

                <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto no-scrollbar">
                    <div className="text-[10px] font-extrabold text-[#B0B8C1] mb-2.5 ml-2 mt-2 uppercase tracking-widest">
                        DATA INGESTION
                    </div>
                    <button
                        onClick={() => setActiveMenu('staging')}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-[14px] transition-all cursor-pointer border-none outline-none ${
                            activeMenu === 'staging'
                                ? 'bg-orange-50 text-orange-600 shadow-sm border border-orange-100/50'
                                : 'bg-transparent text-[#4E5968] hover:bg-[#F9FAFB] hover:text-[#191F28]'
                        }`}
                    >
                        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        신규 데이터 적재
                    </button>

                    <div className="text-[10px] font-extrabold text-[#B0B8C1] mb-2.5 ml-2 mt-6 uppercase tracking-widest">
                        MANAGEMENT
                    </div>
                    <button
                        onClick={() => setActiveMenu('management')}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-[14px] transition-all cursor-pointer border-none outline-none ${
                            activeMenu === 'management'
                                ? 'bg-orange-50 text-orange-600 shadow-sm border border-orange-100/50'
                                : 'bg-transparent text-[#4E5968] hover:bg-[#F9FAFB] hover:text-[#191F28]'
                        }`}
                    >
                        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        공간 관리
                    </button>

                    <button
                        onClick={() => setActiveMenu('stats')}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-[14px] transition-all cursor-pointer border-none outline-none ${
                            activeMenu === 'stats'
                                ? 'bg-orange-50 text-orange-600 shadow-sm border border-orange-100/50'
                                : 'bg-transparent text-[#4E5968] hover:bg-[#F9FAFB] hover:text-[#191F28]'
                        }`}
                    >
                        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2zm12 0v-3a2 2 0 00-2-2h-2a2 2 0 00-2 2v3a2 2 0 002 2h2a2 2 0 002-2zm0 0v-8a2 2 0 00-2-2h-2a2 2 0 00-2 2v8a2 2 0 002 2h2a2 2 0 002-2z" />
                        </svg>
                        통계 대시보드
                    </button>

                    <div className="text-[10px] font-extrabold text-[#B0B8C1] mb-2.5 ml-2 mt-6 uppercase tracking-widest">
                        SYSTEM
                    </div>
                    <button
                        onClick={() => setActiveMenu('settings')}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-[14px] transition-all cursor-pointer border-none outline-none ${
                            activeMenu === 'settings'
                                ? 'bg-orange-50 text-orange-600 shadow-sm border border-orange-100/50'
                                : 'bg-transparent text-[#4E5968] hover:bg-[#F9FAFB] hover:text-[#191F28]'
                        }`}
                    >
                        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                        CMS 환경설정
                    </button>
                </nav>

                <div className="p-4 border-t border-[#F2F4F6]">
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-[#8B95A1] hover:text-[#4E5968] hover:bg-[#F2F4F6] transition-all text-[13px] border-none outline-none cursor-pointer"
                    >
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        로그아웃
                    </button>
                </div>
            </aside>

            {/* 메인 뷰 영역 */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* 헤더 */}
                <header className="h-16 bg-white border-b border-[#E5E8EB] px-8 flex items-center justify-between shrink-0 z-20">
                    <div className="flex items-center gap-2">
                        <span className="text-[#8B95A1] text-[13.5px] font-bold">PickPl CMS</span>
                        <svg className="w-3.5 h-3.5 text-[#B0B8C1]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="text-[#191F28] font-bold text-[14px]">
                            {activeMenu === 'staging' && '신규 데이터 적재'}
                            {activeMenu === 'management' && '공간 관리'}
                            {activeMenu === 'stats' && '통계 대시보드'}
                            {activeMenu === 'settings' && 'CMS 환경설정'}
                        </span>
                    </div>
                    <div className="text-[12.5px] font-bold text-[#8B95A1]">
                        {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}
                    </div>
                </header>

                {/* 뷰 콘텐츠 컨테이너 */}
                <div className="flex-1 p-8 overflow-y-auto admin-scrollbar relative z-0">
                    <div className="max-w-[1440px] mx-auto w-full flex flex-col gap-6 bg-white border border-[#E5E8EB] p-8 rounded-[32px] shadow-sm mb-10">
                        {/* 전역 피드백 메세지 */}
                        {statusMsg && (
                            <div className={`p-4 rounded-[16px] text-[13.5px] font-semibold flex items-start gap-3 border ${
                                statusMsg.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' :
                                statusMsg.type === 'error' ? 'bg-red-50 border-red-100 text-red-800' :
                                'bg-blue-50 border-blue-100 text-blue-800'
                            }`}>
                                <span className="mt-0.5">
                                    {statusMsg.type === 'success' && (
                                        <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    )}
                                    {statusMsg.type === 'error' && (
                                        <svg className="w-5 h-5 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    )}
                                    {statusMsg.type === 'info' && (
                                        <svg className="w-5 h-5 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    )}
                                </span>
                                <p className="flex-1 leading-relaxed">{statusMsg.text}</p>
                            </div>
                        )}

                        {activeMenu === 'staging' && (
                            <StagingTab
                                places={places}
                                setPlaces={setPlaces}
                                onSelectPlace={setSelectedPlaceIndex}
                                isUploading={isUploading}
                                onFinalSubmit={handleFinalSubmit}
                                checkDuplicates={checkDuplicates}
                                statusMsg={statusMsg}
                                setStatusMsg={setStatusMsg}
                                onLogout={onLogout}
                            />
                        )}

                        {activeMenu === 'management' && (
                            <ManagementTab
                                dbPlaces={dbPlaces}
                                onSelectDbPlace={setSelectedDbPlaceIndex}
                                onDeleteDbPlace={handleDeleteDbPlace}
                                onQuickTogglePublish={handleQuickTogglePublish}
                                onBulkTogglePublish={handleBulkTogglePublish}
                                onBulkDeleteDbPlaces={handleBulkDeleteDbPlaces}
                                isDbLoading={isDbLoading}
                            />
                        )}

                        {activeMenu === 'stats' && (
                            <StatsTab dbPlaces={dbPlaces} />
                        )}

                        {activeMenu === 'settings' && (
                            <SettingsTab
                                onRefreshDb={fetchDbPlaces}
                                dbPlaces={dbPlaces}
                                setStatusMsg={setStatusMsg}
                            />
                        )}
                    </div>
                </div>
            </main>

            {/* 에디터 중앙 정렬형 팝업 모달 */}
            {selectedPlace && selectedPlaceIndex !== null && (
                <PlaceModal
                    place={selectedPlace}
                    onClose={() => setSelectedPlaceIndex(null)}
                    onSave={(updatedData) => handleSaveStagingDetail(selectedPlaceIndex, updatedData)}
                />
            )}

            {selectedDbPlaceMapped && selectedDbPlaceIndex !== null && (
                <PlaceModal
                    place={selectedDbPlaceMapped}
                    onClose={() => setSelectedDbPlaceIndex(null)}
                    onSave={(updatedData) => handleSaveDbDetail(selectedDbPlaceIndex, updatedData)}
                />
            )}
        </div>
    );
}
