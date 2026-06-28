'use client';

import React, { useState } from 'react';
import { THEME_MAP } from './StagingTab';

interface ManagementTabProps {
    dbPlaces: any[];
    onSelectDbPlace: (index: number) => void;
    onDeleteDbPlace: (id: number, name: string, e: React.MouseEvent) => Promise<void>;
    onQuickTogglePublish: (id: number, currentStatus: boolean, name: string) => Promise<void>;
    onBulkTogglePublish: (ids: number[], isPublished: boolean) => Promise<void>;
    onBulkDeleteDbPlaces: (ids: number[]) => Promise<void>;
    isDbLoading: boolean;
}

export default function ManagementTab({
    dbPlaces,
    onSelectDbPlace,
    onDeleteDbPlace,
    onQuickTogglePublish,
    onBulkTogglePublish,
    onBulkDeleteDbPlaces,
    isDbLoading
}: ManagementTabProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name' | 'published'>('newest');

    // 카테고리 종류 추출
    const categories = ['All', ...Array.from(new Set(dbPlaces.map(p => p.category).filter(Boolean)))];

    // 필터링 적용
    const filteredDbPlaces = dbPlaces.filter(place => {
        const matchesSearch = place.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              place.address.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || place.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    // 정렬 적용 (클라이언트 사이드)
    const sortedDbPlaces = [...filteredDbPlaces].sort((a, b) => {
        if (sortBy === 'newest') {
            return b.id - a.id;
        }
        if (sortBy === 'oldest') {
            return a.id - b.id;
        }
        if (sortBy === 'name') {
            return a.name.localeCompare(b.name, 'ko');
        }
        if (sortBy === 'published') {
            const aVal = a.isPublished ? 1 : 0;
            const bVal = b.isPublished ? 1 : 0;
            return bVal - aVal;
        }
        return 0;
    });

    const toggleSelect = (id: number) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(x => x !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleBulkPublish = async (isPublished: boolean) => {
        if (selectedIds.length === 0) return;
        if (!confirm(`선택한 ${selectedIds.length}개의 공간을 일괄 ${isPublished ? '공개' : '비공개'} 상태로 전환하시겠습니까?`)) {
            return;
        }
        await onBulkTogglePublish(selectedIds, isPublished);
        setSelectedIds([]); // 초기화
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`선택한 ${selectedIds.length}개의 공간을 정말로 데이터베이스에서 일괄 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
            return;
        }
        await onBulkDeleteDbPlaces(selectedIds);
        setSelectedIds([]); // 초기화
    };

    return (
        <div className="flex flex-col gap-6 animate-fade-in">
            {/* 대시보드 통계 지표 위젯 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="bg-[#FAFAFA] rounded-[20px] p-6 border border-[#E5E8EB]/70 flex flex-col gap-2 shadow-[0_4px_16px_rgba(0,0,0,0.01)] transition-all hover:shadow-[0_8px_24px_rgba(0,0,0,0.02)]">
                    <span className="text-[12.5px] font-bold text-[#8B95A1] tracking-tight">전체 등록 공간</span>
                    <span className="text-[28px] font-black text-[#191F28]">{dbPlaces.length} <span className="text-[15px] font-bold text-[#8B95A1]">곳</span></span>
                </div>
                <div className="bg-[#FAFAFA] rounded-[20px] p-6 border border-[#E5E8EB]/70 flex flex-col gap-2 shadow-[0_4px_16px_rgba(0,0,0,0.01)] transition-all hover:shadow-[0_8px_24px_rgba(0,0,0,0.02)]">
                    <span className="text-[12.5px] font-bold text-emerald-600 tracking-tight">공개 게시 중</span>
                    <span className="text-[28px] font-black text-emerald-600">{dbPlaces.filter(p => p.isPublished).length} <span className="text-[15px] font-bold text-[#8B95A1]">곳</span></span>
                </div>
                <div className="bg-[#FAFAFA] rounded-[20px] p-6 border border-[#E5E8EB]/70 flex flex-col gap-2 shadow-[0_4px_16px_rgba(0,0,0,0.01)] transition-all hover:shadow-[0_8px_24px_rgba(0,0,0,0.02)]">
                    <span className="text-[12.5px] font-bold text-orange-500 tracking-tight">비공개 대기</span>
                    <span className="text-[28px] font-black text-orange-500">{dbPlaces.filter(p => !p.isPublished).length} <span className="text-[15px] font-bold text-[#8B95A1]">곳</span></span>
                </div>
            </div>

            {/* 검색 및 카테고리 필터 컨트롤러 */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center py-2 border-b border-[#F2F4F6] pb-5">
                {/* 검색 및 정렬 드롭다운 묶음 */}
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    {/* 검색 인풋 */}
                    <div className="relative w-full sm:w-[260px]">
                        <input
                            type="text"
                            placeholder="공간명 또는 주소 검색..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#F2F4F6] focus:bg-[#E5E8EB] text-[#191F28] text-[14.5px] font-semibold rounded-[14px] pl-10 pr-4 py-3.5 border-none outline-none transition-colors placeholder-[#B0B8C1]"
                        />
                        <span className="absolute left-3.5 top-3.5 text-[#B0B8C1]">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </span>
                    </div>

                    {/* 정렬 셀렉터 */}
                    <div className="relative w-full sm:w-[150px]">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="w-full bg-[#F2F4F6] focus:bg-[#E5E8EB] text-[#4E5968] text-[14px] font-bold rounded-[14px] px-4 py-3.5 border-none outline-none cursor-pointer appearance-none transition-colors"
                        >
                            <option value="newest">최신 등록순</option>
                            <option value="oldest">과거 등록순</option>
                            <option value="name">이름 가나다순</option>
                            <option value="published">공개 상태순</option>
                        </select>
                        <span className="absolute right-4 top-4.5 pointer-events-none text-[#8B95A1]">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </span>
                    </div>
                </div>

                {/* 카테고리 필터 뱃지 */}
                <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-[12px] text-[13px] font-bold transition-all active:scale-95 border-none outline-none cursor-pointer ${
                                selectedCategory === cat
                                    ? 'bg-[#191F28] text-white shadow-sm'
                                    : 'bg-[#F2F4F6] hover:bg-[#E5E8EB] text-[#4E5968]'
                            }`}
                        >
                            {cat === 'All' ? '전체' : cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* 다중 선택 조작 제어바 */}
            {selectedIds.length > 0 && (
                <div className="bg-[#FFFDFB] rounded-[18px] p-4.5 border border-orange-500/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3.5 animate-fade-in shadow-[0_4px_16px_rgba(249,115,22,0.02)]">
                    <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-[6px]">
                            {selectedIds.length}개 선택됨
                        </span>
                        <button
                            onClick={() => setSelectedIds([])}
                            className="text-[12px] font-bold text-[#8B95A1] hover:text-[#4E5968] cursor-pointer border-none bg-transparent"
                        >
                            선택 해제
                        </button>
                    </div>
                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={() => handleBulkPublish(true)}
                            className="flex-1 sm:flex-none h-10 px-5 rounded-[10px] bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[12.5px] transition-colors cursor-pointer border-none outline-none"
                        >
                            선택 장소 공개 전환
                        </button>
                        <button
                            type="button"
                            onClick={() => handleBulkPublish(false)}
                            className="flex-1 sm:flex-none h-10 px-5 rounded-[10px] bg-orange-500 hover:bg-orange-600 text-white font-bold text-[12.5px] transition-colors cursor-pointer border-none outline-none"
                        >
                            선택 장소 비공개 전환
                        </button>
                        <button
                            type="button"
                            onClick={handleBulkDelete}
                            className="flex-1 sm:flex-none h-10 px-5 rounded-[10px] bg-red-500 hover:bg-red-600 text-white font-bold text-[12.5px] transition-colors cursor-pointer border-none outline-none"
                        >
                            선택 장소 삭제
                        </button>
                    </div>
                </div>
            )}

            {/* 다중 선택 보조바 */}
            {dbPlaces.length > 0 && (
                <div className="flex justify-between items-center px-2">
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                const allIds = filteredDbPlaces.map(p => p.id);
                                setSelectedIds(allIds);
                            }}
                            className="text-[13px] font-bold text-[#8B95A1] hover:text-[#4E5968] cursor-pointer border-none bg-transparent"
                        >
                            전체 선택
                        </button>
                        <span className="text-[#E5E8EB]">|</span>
                        <button
                            onClick={() => setSelectedIds([])}
                            className="text-[13px] font-bold text-[#8B95A1] hover:text-[#4E5968] cursor-pointer border-none bg-transparent"
                        >
                            전체 해제
                        </button>
                    </div>
                </div>
            )}

            {/* DB 장소 목록 그리드 */}
            {isDbLoading ? (
                <div className="flex flex-col items-center justify-center py-20 min-h-[300px]">
                    <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-[14px] font-semibold text-[#8B95A1] mt-4">데이터베이스에서 공간 데이터를 조회 중입니다...</p>
                </div>
            ) : dbPlaces.length > 0 ? (
                sortedDbPlaces.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sortedDbPlaces.map((place) => {
                            const tagNames = place.tags ? place.tags.map((t: any) => t.name) : [];
                            const isChecked = selectedIds.includes(place.id);
                            return (
                                <div
                                    key={place.id}
                                    onClick={() => {
                                        const origIdx = dbPlaces.findIndex(p => p.id === place.id);
                                        if (origIdx >= 0) onSelectDbPlace(origIdx);
                                    }}
                                    className={`bg-white rounded-[24px] border transition-all duration-300 cursor-pointer p-5 flex flex-col gap-4 shadow-[0_4px_16px_rgba(0,0,0,0.01)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.03)] hover:border-orange-500/20 relative group ${
                                        isChecked ? 'border-orange-500/30 bg-[#FFFDFB]/30' : 'border-[#E5E8EB]'
                                    }`}
                                >
                                    <div className="flex justify-between items-center relative z-10">
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleSelect(place.id);
                                                }}
                                                className={`w-5.5 h-5.5 rounded-[6px] flex items-center justify-center border transition-all cursor-pointer ${
                                                    isChecked ? 'bg-orange-500 border-orange-500 text-white' : 'border-[#D1D5DB] bg-white hover:border-[#9CA3AF]'
                                                }`}
                                            >
                                                {isChecked && (
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </button>
                                            <span className="text-[11px] font-extrabold text-[#8B95A1] bg-[#F2F4F6] px-2.5 py-1 rounded-[6px]">
                                                ID: {place.id}
                                            </span>
                                            
                                            {place.curationTheme && THEME_MAP[place.curationTheme] && (
                                                <span className={`px-2 py-0.5 rounded-[6px] border text-[10px] font-bold ${THEME_MAP[place.curationTheme].style}`}>
                                                    {THEME_MAP[place.curationTheme].label}
                                                </span>
                                            )}
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            {/* 간이 공개/비공개 토글 스위치 (폐업 및 상태변경 빠른 대응용) */}
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onQuickTogglePublish(place.id, place.isPublished, place.name);
                                                }}
                                                className={`px-2.5 py-1 rounded-[6px] text-[11px] font-bold transition-all active:scale-95 cursor-pointer border-none ${
                                                    place.isPublished 
                                                        ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' 
                                                        : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                                                }`}
                                            >
                                                {place.isPublished ? '공개 중' : '비공개'}
                                            </button>
                                            
                                            <button
                                                type="button"
                                                onClick={(e) => onDeleteDbPlace(place.id, place.name, e)}
                                                className="px-2.5 py-1 rounded-[6px] bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-bold transition-all relative z-10 active:scale-95 cursor-pointer border-none"
                                            >
                                                삭제
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="w-20 h-20 rounded-[16px] overflow-hidden shrink-0 bg-[#F2F4F6]">
                                            <img 
                                                src={place.thumbnailUrl} 
                                                className="w-full h-full object-cover" 
                                                alt="" 
                                                onError={(e) => {
                                                    e.currentTarget.src = '/default_place.png';
                                                }}
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                            <span className="text-[11px] font-bold text-[#8B95A1] uppercase tracking-wider">{place.category}</span>
                                            <h3 className="text-[17px] font-extrabold text-[#191F28] tracking-tight truncate group-hover:text-orange-500 transition-colors">
                                                {place.name}
                                            </h3>
                                            <p className="text-[12.5px] text-[#8B95A1] truncate mt-0.5">{place.address}</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-1.5 overflow-hidden h-[26px]">
                                        {tagNames.map((t: string) => (
                                            <span key={t} className="px-2 py-0.5 rounded-[6px] bg-[#F2F4F6] text-[#4E5968] text-[11px] font-bold">
                                                #{t}
                                            </span>
                                        ))}
                                    </div>

                                    <div className={`mt-2 pt-3 border-t border-[#F2F4F6] text-[12.5px] flex items-center gap-1.5 font-semibold ${
                                        place.editorsComment ? 'text-emerald-600' : 'text-[#8B95A1]'
                                    }`}>
                                        {place.editorsComment ? (
                                            <>
                                                <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                                <span className="truncate">에디터 한 마디: {place.editorsComment}</span>
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-3.5 h-3.5 text-[#B0B8C1] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                </svg>
                                                <span className="italic font-normal">등록된 정보 없음 (클릭하여 수정)</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center py-20 min-h-[300px]">
                        <div className="w-16 h-16 rounded-full bg-[#F2F4F6] flex items-center justify-center text-[#B0B8C1] mb-4">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <h3 className="text-[17px] font-bold text-[#191F28] tracking-tight">검색 결과가 없습니다</h3>
                        <p className="text-[13.5px] text-[#8B95A1] mt-1 text-center">검색어 또는 카테고리 필터를 다르게 설정해 보세요.</p>
                    </div>
                )
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-20 min-h-[400px]">
                    <div className="w-20 h-20 rounded-[28px] bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500 mb-6 shadow-inner">
                        <svg className="w-9 h-9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                    </div>
                    <h3 className="text-[20px] font-bold text-[#191F28] tracking-tight">데이터베이스가 비어 있습니다</h3>
                    <p className="text-[14px] text-[#8B95A1] text-center mt-2 max-w-[380px] leading-relaxed">
                        '신규 장소 업로드' 탭을 통해 최초 공간 정보들을 DB에 먼저 로딩해 주세요.
                    </p>
                </div>
            )}
        </div>
    );
}
