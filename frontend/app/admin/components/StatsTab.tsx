'use client';

import React from 'react';

interface StatsTabProps {
    dbPlaces: any[];
}

export default function StatsTab({ dbPlaces }: StatsTabProps) {
    // 1. 카테고리 분포 분석
    const categoryCounts: Record<string, number> = {};
    dbPlaces.forEach(p => {
        const cat = p.category || '기타';
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    const totalPlaces = dbPlaces.length;
    const sortedCategories = Object.entries(categoryCounts)
        .map(([name, count]) => ({
            name,
            count,
            percentage: totalPlaces > 0 ? Math.round((count / totalPlaces) * 100) : 0
        }))
        .sort((a, b) => b.count - a.count);

    // 2. 무드 태그 빈도수 분석
    const tagCounts: Record<string, number> = {};
    dbPlaces.forEach(p => {
        const tags = p.tags ? p.tags.map((t: any) => t.name) : [];
        tags.forEach((tag: string) => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
    });

    const sortedTags = Object.entries(tagCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    const maxTagCount = sortedTags.length > 0 ? sortedTags[0].count : 1;

    // 도넛 차트 색상 목록 (토스풍 파스텔 테마)
    const chartColors = [
        '#FF6B6B', // Red
        '#4D96FF', // Blue
        '#6BCB77', // Green
        '#FFD93D', // Yellow
        '#B185DB', // Purple
        '#FFA07A', // Salmon
        '#4ECDC4'  // Teal
    ];

    // SVG 도넛 세그먼트 생성용 누적 변수
    let accumulatedPercentage = 0;
    const radius = 50;
    const circumference = 2 * Math.PI * radius; // 약 314.16

    return (
        <div className="flex flex-col gap-8 animate-fade-in font-display">
            {/* 대시보드 타이틀 */}
            <div className="bg-[#FAFAFA] p-6 rounded-[24px] border border-[#E5E8EB]/70 flex flex-col gap-1.5">
                <span className="text-[12.5px] font-extrabold text-orange-500 tracking-wider uppercase">Analytics</span>
                <h2 className="text-[20px] font-bold text-[#191F28] tracking-tight">공간 데이터 통계 요약</h2>
                <p className="text-[13.5px] text-[#8B95A1] mt-0.5">데이터베이스에 수집되어 적재된 장소들의 업종 분포와 주로 매핑된 무드 태그 트렌드입니다.</p>
            </div>

            {totalPlaces === 0 ? (
                <div className="bg-white rounded-[24px] border border-[#E5E8EB] p-20 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-full bg-[#F2F4F6] flex items-center justify-center text-[#B0B8C1] mb-4">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2zm12 0v-3a2 2 0 00-2-2h-2a2 2 0 00-2 2v3a2 2 0 002 2h2a2 2 0 002-2zm0 0v-8a2 2 0 00-2-2h-2a2 2 0 00-2 2v8a2 2 0 002 2h2a2 2 0 002-2z" />
                        </svg>
                    </div>
                    <h3 className="text-[18px] font-bold text-[#191F28]">분석할 데이터가 없습니다</h3>
                    <p className="text-[13.5px] text-[#8B95A1] mt-1.5">장소가 적재된 이후에 시각화된 차트 대시보드가 활성화됩니다.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* 카드 1: 업종 카테고리 점유율 (SVG 도넛 차트) */}
                    <div className="bg-white rounded-[24px] border border-[#E5E8EB] p-6 flex flex-col gap-6 shadow-[0_4px_16px_rgba(0,0,0,0.01)]">
                        <div className="flex flex-col gap-1">
                            <h3 className="font-extrabold text-[16px] text-[#191F28] tracking-tight">업종별 카테고리 분포</h3>
                            <p className="text-[12px] text-[#8B95A1]">어떤 업종의 공간들이 가장 많이 수집되었는지 보여줍니다.</p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-4">
                            {/* SVG 도넛 차트 그리기 */}
                            <div className="relative w-40 h-40 shrink-0">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 140 140">
                                    <circle
                                        cx="70"
                                        cy="70"
                                        r={radius}
                                        fill="transparent"
                                        stroke="#F2F4F6"
                                        strokeWidth="20"
                                    />
                                    {sortedCategories.map((cat, idx) => {
                                        const color = chartColors[idx % chartColors.length];
                                        const strokeDashArray = `${(cat.percentage / 100) * circumference} ${circumference}`;
                                        const strokeDashOffset = -((accumulatedPercentage / 100) * circumference);
                                        accumulatedPercentage += cat.percentage;

                                        if (cat.percentage === 0) return null;

                                        return (
                                            <circle
                                                key={cat.name}
                                                cx="70"
                                                cy="70"
                                                r={radius}
                                                fill="transparent"
                                                stroke={color}
                                                strokeWidth="20"
                                                strokeDasharray={strokeDashArray}
                                                strokeDashoffset={strokeDashOffset}
                                                className="transition-all duration-500 hover:stroke-[24px] cursor-pointer"
                                            />
                                        );
                                    })}
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-[12px] font-bold text-[#8B95A1]">총 수량</span>
                                    <span className="text-[20px] font-black text-[#191F28]">{totalPlaces}곳</span>
                                </div>
                            </div>

                            {/* 범례 표시 */}
                            <div className="flex-1 flex flex-col gap-2.5 w-full">
                                {sortedCategories.slice(0, 6).map((cat, idx) => {
                                    const color = chartColors[idx % chartColors.length];
                                    return (
                                        <div key={cat.name} className="flex justify-between items-center text-[13px] font-semibold text-[#4E5968]">
                                            <div className="flex items-center gap-2">
                                                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }}></span>
                                                <span className="truncate max-w-[120px]">{cat.name}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <span className="font-bold text-[#191F28]">{cat.count}곳</span>
                                                <span className="text-[#8B95A1] text-[11px] font-bold">({cat.percentage}%)</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* 카드 2: 인기 무드 태그 TOP 5 (가로 막대 차트) */}
                    <div className="bg-white rounded-[24px] border border-[#E5E8EB] p-6 flex flex-col gap-6 shadow-[0_4px_16px_rgba(0,0,0,0.01)]">
                        <div className="flex flex-col gap-1">
                            <h3 className="font-extrabold text-[16px] text-[#191F28] tracking-tight">인기 무드 태그 TOP 5</h3>
                            <p className="text-[12px] text-[#8B95A1]">수집된 공간들에 가장 빈번하게 부여된 대표 무드 태그입니다.</p>
                        </div>

                        {sortedTags.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center text-center text-[#8B95A1] text-[13px] py-10">
                                태그가 할당된 장소가 없습니다.
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col justify-center gap-5.5 py-2">
                                {sortedTags.map((tag, idx) => {
                                    const barWidthPercentage = Math.max(10, Math.round((tag.count / maxTagCount) * 100));
                                    const color = chartColors[(idx + 2) % chartColors.length];
                                    
                                    return (
                                        <div key={tag.name} className="flex flex-col gap-1.5">
                                            <div className="flex justify-between items-center text-[12.5px] font-bold text-[#4E5968]">
                                                <span>#{tag.name}</span>
                                                <span className="text-[#191F28]">{tag.count}회 태깅됨</span>
                                            </div>
                                            <div className="w-full bg-[#F2F4F6] h-3.5 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-700 ease-out"
                                                    style={{
                                                        width: `${barWidthPercentage}%`,
                                                        backgroundColor: color
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
