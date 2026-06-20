'use client';

import React, { useState } from 'react';

export interface PlaceStagingData {
    id?: number;
    name: string;
    address: string;
    externalId: string;
    latitude: number;
    longitude: number;
    category: string;
    subCategory?: string;
    thumbnailUrl: string;
    imageUrls: string;
    reviews: string[];
    aiMoodSummary: string;
    tags: string[];
    editorsComment?: string;
    isPublished?: boolean;
    isDuplicate?: boolean;
}

interface PlaceModalProps {
    place: PlaceStagingData;
    onClose: () => void;
    onSave: (updatedData: Partial<PlaceStagingData>) => void;
}

export default function PlaceModal({ place, onClose, onSave }: PlaceModalProps) {
    const [name, setName] = useState(place.name);
    const [category, setCategory] = useState(place.category);
    const [editorsComment, setEditorsComment] = useState(place.editorsComment || '');
    const [tags, setTags] = useState<string[]>(Array.from(new Set(place.tags)));
    const [isPublished, setIsPublished] = useState<boolean>(place.isPublished !== false);
    const [newTagInput, setNewTagInput] = useState('');

    const handleAddTag = (e: React.FormEvent) => {
        e.preventDefault();
        const tag = newTagInput.trim().replace('#', '');
        if (tag && !tags.includes(tag)) {
            setTags([...tags, tag]);
            setNewTagInput('');
        }
    };

    const handleRemoveTag = (tag: string) => {
        setTags(tags.filter(t => t !== tag));
    };

    const handleSaveSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            name,
            category,
            editorsComment,
            tags,
            isPublished
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
            {/* 배경 클릭 시 닫기 */}
            <div className="absolute inset-0 cursor-pointer" onClick={onClose}></div>
            
            {/* 모달 카드 바디 (중앙 정렬 및 높이 제약형) */}
            <div className="relative w-full max-w-[500px] max-h-[85vh] bg-white rounded-[28px] shadow-2xl flex flex-col z-10 animate-scale-up overflow-hidden font-display border border-[#E5E8EB]/70">
                {/* 헤더 */}
                <div className="p-6 border-b border-[#F2F4F6] flex justify-between items-center shrink-0">
                    <h3 className="font-bold text-[19px] text-[#191F28] tracking-tight">공간 정보 세부 편집</h3>
                    <button onClick={onClose} className="w-9 h-9 rounded-full bg-[#F2F4F6] hover:bg-[#E5E8EB] flex items-center justify-center text-[#8B95A1] hover:text-[#4E5968] transition-colors active:scale-95">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* 에디팅 폼 바디 (스크롤 가능) */}
                <form onSubmit={handleSaveSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-5 admin-scrollbar">
                    {/* 장소 기본 메타데이터 카드 */}
                    <div className="bg-[#F9FAFB] p-4.5 rounded-[18px] border border-[#F2F4F6] flex gap-4">
                        <div className="w-14 h-14 rounded-[12px] overflow-hidden shrink-0 bg-[#F2F4F6]">
                            <img src={place.thumbnailUrl} className="w-full h-full object-cover" alt="" />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <span className="text-[11px] font-bold text-[#8B95A1] truncate">외부 ID: {place.externalId}</span>
                            <h4 className="text-[15.5px] font-extrabold text-[#191F28] truncate">{place.name}</h4>
                            <p className="text-[12px] text-[#8B95A1] truncate mt-0.5">{place.address}</p>
                        </div>
                    </div>

                    {/* 상호명 수정 */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[13px] font-bold text-[#8B95A1] pl-1">공간 상호명</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-[#F2F4F6] focus:bg-[#E5E8EB] text-[#191F28] text-[14.5px] font-semibold rounded-[14px] px-4 py-3.5 border-none outline-none transition-colors"
                        />
                    </div>

                    {/* 카테고리 수정 */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[13px] font-bold text-[#8B95A1] pl-1">업종 카테고리</label>
                        <input
                            type="text"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            placeholder="예: 카페,디저트, 술집, 요리주점"
                            className="w-full bg-[#F2F4F6] focus:bg-[#E5E8EB] text-[#191F28] text-[14.5px] font-semibold rounded-[14px] px-4 py-3.5 border-none outline-none transition-colors"
                        />
                    </div>

                    {/* 서비스 노출 공개 여부 토글 */}
                    <div className="flex justify-between items-center bg-[#F2F4F6] p-4 rounded-[18px] border border-[#E5E8EB]/40 select-none">
                        <div className="flex flex-col">
                            <span className="text-[14.5px] font-bold text-[#191F28]">서비스 공개 여부</span>
                            <span className="text-[11.5px] text-[#8B95A1] mt-0.5">활성화 시 일반 사용자의 공간 발견 탭에 즉시 노출됩니다.</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsPublished(!isPublished)}
                            className={`w-14 h-8 rounded-full transition-colors flex items-center p-1 cursor-pointer outline-none border-none ${
                                isPublished ? 'bg-orange-500' : 'bg-[#D1D5DB]'
                            }`}
                        >
                            <div className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                                isPublished ? 'translate-x-6' : 'translate-x-0'
                            }`} />
                        </button>
                    </div>

                    {/* 에디터의 한 마디 */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[13px] font-bold text-[#8B95A1] pl-1">
                            에디터의 한 마디
                        </label>
                        <textarea
                            rows={3}
                            value={editorsComment}
                            onChange={(e) => setEditorsComment(e.target.value)}
                            placeholder="공간 소개, 추천 평이나 폐업/이전 등의 특이사항 한 마디를 자유롭게 적어주세요..."
                            className="w-full bg-[#F2F4F6] focus:bg-[#E5E8EB] text-[#191F28] text-[14.5px] font-semibold rounded-[14px] px-4 py-3.5 border-none outline-none transition-colors resize-none leading-relaxed"
                        />
                    </div>

                    {/* 태그 편집 */}
                    <div className="flex flex-col gap-2.5">
                        <label className="text-[13px] font-bold text-[#8B95A1] pl-1">무드 태그 관리</label>
                        
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="새 태그 입력 (예: 조용한)"
                                value={newTagInput}
                                onChange={(e) => setNewTagInput(e.target.value)}
                                className="flex-1 bg-[#F2F4F6] focus:bg-[#E5E8EB] text-[#191F28] text-[14px] font-semibold rounded-[12px] px-4 py-3 border-none outline-none transition-colors"
                            />
                            <button
                                type="button"
                                onClick={handleAddTag}
                                className="px-4 bg-[#191F28] hover:bg-black text-white font-bold text-[13px] rounded-[12px] transition-colors active:scale-95"
                            >
                                추가
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-1">
                            {tags.map((t, tagIdx) => (
                                <span
                                    key={`${t}-${tagIdx}`}
                                    className="px-2.5 py-1.5 rounded-[8px] bg-orange-50 border border-orange-100/60 text-orange-600 text-[12px] font-bold flex items-center gap-1.5"
                                >
                                    #{t}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveTag(t)}
                                        className="w-4 h-4 rounded-full bg-orange-200/50 hover:bg-orange-200 text-orange-700 flex items-center justify-center text-[10px] transition-colors"
                                    >
                                        ✕
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>
                </form>

                {/* 하단 푸터 버튼 */}
                <div className="p-6 border-t border-[#F2F4F6] bg-white flex gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 h-[50px] rounded-[14px] bg-[#F2F4F6] hover:bg-[#E5E8EB] text-[#4E5968] font-bold text-[14.5px] transition-colors active:scale-98"
                    >
                        취소
                    </button>
                    <button
                        type="button"
                        onClick={handleSaveSubmit}
                        className="flex-1 h-[50px] rounded-[14px] bg-[#191F28] hover:bg-black text-white font-bold text-[14.5px] transition-colors active:scale-98"
                    >
                        적용하기
                    </button>
                </div>
            </div>
        </div>
    );
}
