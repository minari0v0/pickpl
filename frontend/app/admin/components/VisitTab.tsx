import React, { useState } from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => {
    const adminKey = typeof window !== 'undefined' ? sessionStorage.getItem('adminSecretKey') || '' : '';
    return fetch(url, {
        headers: {
            'X-Admin-Secret-Key': adminKey
        }
    }).then(res => {
        if (!res.ok) throw new Error("HTTP error " + res.status);
        return res.json();
    });
};

export default function VisitTab() {
    const [page, setPage] = useState(0);
    const size = 10;

    // SWR 데이터 페칭
    const { data, error, isLoading, mutate } = useSWR(
        `http://localhost:8080/api/v1/admin/visits?page=${page}&size=${size}`,
        fetcher,
        { keepPreviousData: true }
    );

    const handleForceDelete = async (visitId: number) => {
        if (!confirm(`정말 ID: ${visitId}번 방문 기록을 강제 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;

        const adminKey = sessionStorage.getItem('adminSecretKey') || '';
        try {
            const res = await fetch(`http://localhost:8080/api/v1/admin/visits/${visitId}`, {
                method: 'DELETE',
                headers: {
                    'X-Admin-Secret-Key': adminKey
                }
            });

            if (res.ok) {
                alert("방문 기록이 강제 삭제되었습니다.");
                mutate(); // 목록 갱신
            } else {
                alert(`삭제 실패: HTTP ${res.status}`);
            }
        } catch (err) {
            console.error("방문 기록 강제 삭제 실패:", err);
            alert("삭제 처리에 실패했습니다.");
        }
    };

    if (error) {
        return (
            <div className="p-8 text-center bg-red-50 text-red-500 rounded-2xl border border-red-100">
                <p className="font-bold text-[16px]">방문 기록 데이터를 불러오지 못했습니다.</p>
                <p className="text-[13px] mt-1 text-red-400">관리자 인증 상태를 확인해 주세요.</p>
            </div>
        );
    }

    const visitsPage = data;
    const visits = visitsPage?.content || [];
    const totalPages = visitsPage?.totalPages || 0;
    const totalElements = visitsPage?.totalElements || 0;

    return (
        <div className="bg-white rounded-[24px] border border-[#F2F4F6] p-8 shadow-sm flex flex-col gap-6">
            <div className="flex justify-between items-center pb-4 border-b border-[#F2F4F6]">
                <div>
                    <h2 className="font-extrabold text-[22px] text-[#191F28] tracking-tight">픽플러들의 방문 기록</h2>
                    <p className="text-[14px] text-[#8B95A1] font-semibold mt-1">
                        픽플러들이 여러 공간에 남긴 소중한 발자국들이에요. 깨끗하고 안전한 픽플 커뮤니티를 위해, 부적절하거나 스팸성 후기가 보인다면 이곳에서 직접 삭제할 수 있어요.
                    </p>
                </div>
                <div className="bg-orange-50 text-[#FF802B] px-4 py-2 rounded-xl text-[13px] font-extrabold border border-orange-100 shrink-0">
                    전체 기록 {totalElements}개
                </div>
            </div>

            {isLoading && visits.length === 0 ? (
                <div className="py-20 flex justify-center items-center">
                    <svg className="animate-spin h-8 w-8 text-[#FF802B]" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
            ) : visits.length > 0 ? (
                <div className="flex flex-col gap-6">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[#F2F4F6] text-[13px] font-bold text-[#8B95A1] uppercase tracking-wider">
                                    <th className="py-4.5 px-4 w-[80px]">ID</th>
                                    <th className="py-4.5 px-4 w-[130px]">작성자</th>
                                    <th className="py-4.5 px-4 w-[180px]">대상 장소</th>
                                    <th className="py-4.5 px-4">방문 한줄평</th>
                                    <th className="py-4.5 px-4 w-[130px] whitespace-nowrap">방문 일자</th>
                                    <th className="py-4.5 px-4 w-[100px] text-center whitespace-nowrap">동작</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visits.map((visit: any) => (
                                    <tr key={visit.id} className="border-b border-[#F2F4F6] hover:bg-[#F9FAFB] transition-colors text-[14px]">
                                        <td className="py-4 px-4 font-bold text-[#8B95A1]">{visit.id}</td>
                                        <td className="py-4 px-4">
                                            <div className="flex flex-col">
                                                <span className="font-extrabold text-[#333D4B]">{visit.nickname}</span>
                                                <span className="text-[11px] font-semibold text-[#8B95A1]">ID: {visit.userId}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="flex flex-col">
                                                <span className="font-extrabold text-[#4E5968] truncate max-w-[160px]" title={visit.placeName}>
                                                    {visit.placeName}
                                                </span>
                                                <span className="text-[11px] font-semibold text-[#8B95A1]">ID: {visit.placeId}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <p className="text-[#4E5968] font-medium leading-relaxed max-w-[400px] break-all whitespace-pre-wrap">
                                                {visit.comment}
                                            </p>
                                        </td>
                                        <td className="py-4 px-4 whitespace-nowrap">
                                            <span className="inline-block whitespace-nowrap font-bold text-[#637FA6] bg-[#ADC3E5]/10 px-2.5 py-1 rounded-lg text-[12px]">
                                                {visit.visitedDate}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            <button 
                                                onClick={() => handleForceDelete(visit.id)}
                                                className="p-2 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 active:scale-95 transition-all cursor-pointer"
                                                title="강제 삭제"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* 페이지네이션 */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-2 mt-4">
                            <button
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="px-3.5 py-2 rounded-lg bg-[#F2F4F6] text-[#4E5968] text-[13px] font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#E5E8EB] transition-colors cursor-pointer"
                            >
                                이전
                            </button>
                            <span className="text-[14px] font-bold text-[#333D4B]">
                                {page + 1} / {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                disabled={page === totalPages - 1}
                                className="px-3.5 py-2 rounded-lg bg-[#F2F4F6] text-[#4E5968] text-[13px] font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#E5E8EB] transition-colors cursor-pointer"
                            >
                                다음
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="py-20 text-center flex flex-col items-center gap-2.5">
                    <svg className="w-14 h-14 text-[#CBD5E1]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="font-extrabold text-[#333D4B] text-[16px]">등록된 방문 기록이 없습니다.</p>
                    <p className="text-[13px] font-semibold text-[#8B95A1]">유저들이 발자국을 등록하면 여기에 피드로 쌓입니다.</p>
                </div>
            )}
        </div>
    );
}
