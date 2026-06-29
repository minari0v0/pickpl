'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import axiosInstance from '@/api/axios';

const ONBOARDING_TAGS = [
    "대형카페", "노트북하기좋은", "햇살맛집", "디저트맛집", "뷰맛집", "데이트코스",
    "코지한", "따뜻한우드톤", "조용한", "식물가득", "비오는날", "실내데이트",
    "혼자구경하기좋은", "작업하기좋은", "사진남기기좋은", "루프탑"
];

export default function OnboardingPage() {
    const router = useRouter();
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const toggleTag = (tag: string) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter(t => t !== tag));
        } else {
            if (selectedTags.length >= 5) {
                return; // 5개까지만 제한
            }
            setSelectedTags([...selectedTags, tag]);
        }
    };

    const handleOnboardingSubmit = async (tagsToSend: string[]) => {
        setIsLoading(false);
        try {
            await axiosInstance.post('/auth/onboarding', { tags: tagsToSend });
            router.push('/');
        } catch (err: any) {
            console.error("취향 온보딩 저장 실패:", err);
            // 오류가 있어도 스킵 등 메인 진입은 가능하도록 복구
            router.push('/');
        }
    };

    return (
        <div className="min-h-screen bg-[#FCFCFD] flex flex-col items-center justify-center p-6 relative overflow-hidden select-none">
            {/* 배경 그라데이션 장식 무드 구체 */}
            <div className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-orange-100/40 to-purple-100/30 blur-[120px] -top-40 -left-40 pointer-events-none" />
            <div className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-br from-emerald-50/30 to-blue-100/20 blur-[130px] -bottom-40 -right-40 pointer-events-none" />

            {/* 우측 상단 스킵 버튼 */}
            <div className="absolute top-8 right-8 z-10">
                <button
                    onClick={() => handleOnboardingSubmit([])}
                    disabled={isLoading}
                    className="text-[14.5px] font-bold text-[#8B95A1] hover:text-[#4E5968] active:scale-95 transition-all bg-[#F2F4F6]/60 hover:bg-[#E5E8EB]/70 border-none outline-none rounded-[14px] px-5 py-3 cursor-pointer"
                >
                    다음에 고를래요 (Skip)
                </button>
            </div>

            {/* 온보딩 카드 콘텐츠 박스 */}
            <div className="w-full max-w-[540px] bg-white/80 backdrop-blur-md rounded-[36px] border border-[#E5E8EB]/60 p-8 sm:p-10 shadow-[0_24px_64px_rgba(0,0,0,0.02)] relative z-10 flex flex-col gap-8 animate-scale-up">
                {/* 헤더 섹션 */}
                <div className="flex flex-col gap-2.5 text-center">
                    <span className="text-[12.5px] font-black text-orange-500 tracking-widest uppercase">VIBE ONBOARDING</span>
                    <h2 className="text-[25px] sm:text-[28px] font-black text-[#191F28] tracking-tight leading-tight">
                        선호하는 분위기를 알려주세요
                    </h2>
                    <p className="text-[14.5px] font-bold text-[#8B95A1] leading-relaxed">
                        선택하신 취향에 맞춰 픽플 AI가<br />
                        당신만을 위한 맞춤 장소를 큐레이션해 드릴게요. (3~5개)
                    </p>
                </div>

                {/* 태그 캡슐 그리드 */}
                <div className="flex flex-wrap gap-3.5 justify-center py-2 max-h-[320px] overflow-y-auto no-scrollbar">
                    {ONBOARDING_TAGS.map((tag) => {
                        const isSelected = selectedTags.includes(tag);
                        return (
                            <button
                                key={tag}
                                onClick={() => toggleTag(tag)}
                                className={`px-5 py-3.5 rounded-[18px] text-[14.5px] font-extrabold transition-all border outline-none cursor-pointer active:scale-95 select-none ${
                                    isSelected
                                        ? 'bg-[#191F28] border-[#191F28] text-white shadow-[0_8px_20px_rgba(0,0,0,0.06)]'
                                        : 'bg-[#F2F4F6]/50 hover:bg-[#E5E8EB]/60 border-transparent text-[#4E5968]'
                                }`}
                            >
                                #{tag}
                            </button>
                        );
                    })}
                </div>

                {/* 하단 확인 버튼 */}
                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => handleOnboardingSubmit(selectedTags)}
                        disabled={selectedTags.length < 3 || isLoading}
                        className={`w-full py-4.5 rounded-[22px] font-black text-[16px] transition-all flex items-center justify-center gap-2 select-none border-none outline-none ${
                            selectedTags.length >= 3 && !isLoading
                                ? 'bg-orange-500 text-white hover:bg-orange-600 cursor-pointer shadow-[0_10px_24px_rgba(249,115,22,0.15)] active:scale-98'
                                : 'bg-[#E5E8EB] text-[#B0B8C1] cursor-not-allowed'
                        }`}
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                픽플 시작하기
                                <span className="text-[13px] font-extrabold opacity-95">
                                    ({selectedTags.length}/5)
                                </span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
