'use client';

import React, { useState, useRef } from 'react';
import { PlaceStagingData } from './PlaceModal';

interface StagingTabProps {
    places: PlaceStagingData[];
    setPlaces: React.Dispatch<React.SetStateAction<PlaceStagingData[]>>;
    onSelectPlace: (index: number) => void;
    isUploading: boolean;
    onFinalSubmit: () => void;
    checkDuplicates: (stagingPlaces: PlaceStagingData[]) => Promise<void>;
    statusMsg: { type: 'success' | 'error' | 'info'; text: string } | null;
    setStatusMsg: (msg: { type: 'success' | 'error' | 'info'; text: string } | null) => void;
    onLogout: () => void;
}

export default function StagingTab({
    places,
    setPlaces,
    onSelectPlace,
    isUploading,
    onFinalSubmit,
    checkDuplicates,
    statusMsg,
    setStatusMsg,
    onLogout
}: StagingTabProps) {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileLoad = (text: string) => {
        try {
            const parsed = JSON.parse(text);
            const rawPlaces = Array.isArray(parsed) ? parsed : [parsed];

            const stagingPlaces: PlaceStagingData[] = rawPlaces.map((p: any) => ({
                name: p.name || '이름 없음',
                address: p.address || '',
                externalId: p.externalId || `temp_${Math.random().toString(36).substr(2, 9)}`,
                latitude: Number(p.latitude) || 37.55,
                longitude: Number(p.longitude) || 126.92,
                category: p.category || '공간',
                thumbnailUrl: p.thumbnailUrl || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=500',
                imageUrls: p.imageUrls || p.thumbnailUrl || '',
                reviews: Array.isArray(p.reviews) ? p.reviews : [],
                aiMoodSummary: p.aiMoodSummary || '',
                tags: Array.isArray(p.tags) ? p.tags : [],
                editorsComment: p.editorsComment || '',
                isPublished: true,
                isDuplicate: false
            }));

            checkDuplicates(stagingPlaces);
            setStatusMsg({ type: 'info', text: `총 ${stagingPlaces.length}개의 장소를 성공적으로 불러왔습니다. 중복 검사를 실행했습니다.` });
        } catch (err: any) {
            setStatusMsg({ type: 'error', text: 'JSON 파일 형식이 올바르지 않습니다: ' + err.message });
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            handleFileLoad(event.target?.result as string);
        };
        reader.readAsText(file);
    };

    // 드래그 앤 드롭 핸들러
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const file = e.dataTransfer.files?.[0];
        if (!file) return;

        if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
            setStatusMsg({ type: 'error', text: 'JSON 파일만 업로드할 수 있습니다.' });
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            handleFileLoad(event.target?.result as string);
        };
        reader.readAsText(file);
    };

    // 개별 체크박스 토글
    const togglePlaceCheck = (index: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const updated = [...places];
        updated[index].isPublished = !updated[index].isPublished;
        setPlaces(updated);
    };

    // 전체 선택 / 해제
    const handleSelectAll = (select: boolean) => {
        const updated = places.map(p => ({ ...p, isPublished: select }));
        setPlaces(updated);
    };

    return (
        <div className="flex flex-col gap-6 animate-fade-in">
            {/* 드래그 앤 드롭 영역 및 검수 제어바 */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => {
                    if (places.length === 0) {
                        fileInputRef.current?.click();
                    }
                }}
                className={`rounded-[24px] p-8 border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center min-h-[220px] select-none ${
                    places.length === 0 ? 'cursor-pointer' : ''
                } ${
                    isDragging
                        ? 'border-orange-500 bg-orange-50/50 shadow-inner'
                        : 'border-[#E5E8EB] bg-[#F9FAFB] hover:border-orange-500/30'
                }`}
            >
                <input
                    type="file"
                    accept=".json"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                />

                <div className="flex flex-col items-center text-center gap-3">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-sm ${
                        isDragging ? 'bg-orange-500 text-white scale-110' : 'bg-orange-50 text-orange-500 border border-orange-100'
                    }`}>
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                    </div>
                    {places.length === 0 ? (
                        <>
                            <h3 className="text-[17px] font-bold text-[#191F28] tracking-tight">
                                analyzed_places.json 파일을 이곳에 드롭하거나 클릭하여 로드하세요
                            </h3>
                            <p className="text-[12.5px] text-[#8B95A1] max-w-[340px] leading-relaxed">
                                크롤러와 Gemini 분석을 마친 로컬 JSON 파일을 끌어다 놓아 검수를 즉시 개시할 수 있습니다.
                            </p>
                        </>
                    ) : (
                        <>
                            <h3 className="text-[17px] font-bold text-[#191F28] tracking-tight">
                                총 {places.length}개의 데이터 로드 완료
                            </h3>
                            <p className="text-[12.5px] text-[#8B95A1] max-w-[380px] leading-relaxed">
                                다른 JSON 파일을 드롭하여 덮어쓰거나 아래 카드들을 클릭해 에디터 코멘트 및 공개 상태를 세부 편집해 주세요.
                            </p>
                        </>
                    )}

                    <div className="flex items-center gap-3 mt-2">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                fileInputRef.current?.click();
                            }}
                            className="h-[44px] px-5 rounded-[12px] border border-orange-500/20 bg-white hover:bg-orange-50/50 text-orange-600 font-bold text-[13.5px] transition-all flex items-center gap-2 shadow-sm"
                        >
                            파일 탐색기 열기
                        </button>
                        {places.length > 0 && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onFinalSubmit();
                                }}
                                disabled={isUploading}
                                className="h-[44px] px-6 rounded-[12px] bg-[#191F28] hover:bg-black text-white font-bold text-[13.5px] transition-colors flex items-center gap-2 disabled:opacity-50 shadow-md"
                            >
                                {isUploading ? '적재 진행 중...' : '최종 DB 주입 실행'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* 검수 목록 그리드 카드 */}
            {places.length > 0 && (
                <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center px-2">
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleSelectAll(true)}
                                className="text-[13px] font-bold text-[#8B95A1] hover:text-[#4E5968]"
                            >
                                전체 선택
                            </button>
                            <span className="text-[#E5E8EB]">|</span>
                            <button
                                onClick={() => handleSelectAll(false)}
                                className="text-[13px] font-bold text-[#8B95A1] hover:text-[#4E5968]"
                            >
                                전체 해제
                            </button>
                        </div>
                        <p className="text-[13px] font-semibold text-[#8B95A1]">
                            선택됨: <span className="text-[#191F28] font-bold">{places.filter(p => p.isPublished).length}</span> / {places.length}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {places.map((place, idx) => (
                            <div
                                key={idx}
                                onClick={() => onSelectPlace(idx)}
                                className={`bg-white rounded-[24px] border transition-all duration-300 cursor-pointer p-5 flex flex-col gap-4 shadow-[0_4px_16px_rgba(0,0,0,0.01)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.03)] hover:border-orange-500/20 relative group ${
                                    place.isPublished ? 'border-orange-500/30 bg-[#FFFDFB]/40' : 'border-[#E5E8EB]'
                                }`}
                            >
                                <div className="flex justify-between items-center relative z-10">
                                    <button
                                        type="button"
                                        onClick={(e) => togglePlaceCheck(idx, e)}
                                        className={`w-6 h-6 rounded-[8px] flex items-center justify-center border transition-all ${
                                            place.isPublished ? 'bg-orange-500 border-orange-500 text-white' : 'border-[#D1D5DB] bg-white hover:border-[#9CA3AF]'
                                        }`}
                                    >
                                        {place.isPublished && (
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </button>

                                    {place.isDuplicate ? (
                                        <span className="px-2.5 py-1 rounded-[6px] bg-red-50 border border-red-100 text-red-600 text-[10px] font-extrabold tracking-tight flex items-center gap-1">
                                            <svg className="w-3 h-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                            중복된 장소
                                        </span>
                                    ) : (
                                        <span className="px-2.5 py-1 rounded-[6px] bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-extrabold tracking-tight flex items-center gap-1">
                                            <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                            </svg>
                                            신규 장소
                                        </span>
                                    )}
                                </div>

                                <div className="flex gap-4">
                                    <div className="w-20 h-20 rounded-[16px] overflow-hidden shrink-0 bg-[#F2F4F6]">
                                        <img src={place.thumbnailUrl} className="w-full h-full object-cover" alt="" />
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
                                    {place.tags.map(t => (
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
                                            <span className="italic font-normal">등록된 정보 없음 (클릭하여 작성)</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
