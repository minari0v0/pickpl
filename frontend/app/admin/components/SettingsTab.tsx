'use client';

import React, { useState, useEffect } from 'react';

interface SettingsTabProps {
    onRefreshDb: () => Promise<void>;
    dbPlaces: any[];
    setStatusMsg: (msg: { type: 'success' | 'error' | 'info'; text: string } | null) => void;
}

export default function SettingsTab({ onRefreshDb, dbPlaces, setStatusMsg }: SettingsTabProps) {
    const [healthStatus, setHealthStatus] = useState<'testing' | 'ok' | 'error'>('testing');
    const [latency, setLatency] = useState<number | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // API Health Check
    const checkServerHealth = async () => {
        setHealthStatus('testing');
        const start = performance.now();
        const adminKey = sessionStorage.getItem('adminSecretKey') || '';
        try {
            const res = await fetch('http://localhost:8080/api/v1/admin/places', {
                headers: { 'X-Admin-Secret-Key': adminKey }
            });
            const end = performance.now();
            if (res.ok) {
                setHealthStatus('ok');
                setLatency(Math.round(end - start));
            } else {
                setHealthStatus('error');
                setLatency(null);
            }
        } catch {
            setHealthStatus('error');
            setLatency(null);
        }
    };

    useEffect(() => {
        checkServerHealth();
    }, []);

    // 일괄 공개 전환 API 호출
    const handlePublishAll = async () => {
        if (!confirm('현재 데이터베이스에 적재된 모든 비공개 장소들을 일괄 공개 상태로 전환하시겠습니까?\n전환 시 모바일/웹 메인 발견 탭에 즉시 노출됩니다.')) {
            return;
        }

        setIsProcessing(true);
        const adminKey = sessionStorage.getItem('adminSecretKey') || '';
        try {
            const res = await fetch('http://localhost:8080/api/v1/admin/places/publish-all', {
                method: 'POST',
                headers: { 'X-Admin-Secret-Key': adminKey }
            });

            if (res.ok) {
                const data = await res.json();
                setStatusMsg({
                    type: 'success',
                    text: `🎉 일괄 공개 성공! 총 ${data.publishedCount}개의 장소를 공개 상태로 즉시 활성화했습니다.`
                });
                await onRefreshDb();
            } else {
                setStatusMsg({ type: 'error', text: '일괄 공개 처리 실패: HTTP ' + res.status });
            }
        } catch (err: any) {
            setStatusMsg({ type: 'error', text: '서버 통신 실패: ' + err.message });
        } finally {
            setIsProcessing(false);
        }
    };

    // 테스트용 공간 더미 데이터 주입
    const handleInjectDummyData = async () => {
        if (!confirm('테스트용 핫플레이스 더미 데이터를 데이터베이스에 일괄 주입하시겠습니까?\n(중복 검사를 수행하며, 존재하지 않는 신규 데이터만 주입됩니다.)')) {
            return;
        }

        setIsProcessing(true);
        const adminKey = sessionStorage.getItem('adminSecretKey') || '';
        
        // 핫플 더미 데이터 모음
        const dummyPayload = {
            places: [
                {
                    name: "메이크제로존",
                    address: "서울 마포구 망원로 49 망원빌딩 지하1층",
                    externalId: "dummy_naver_place_1",
                    latitude: 37.5562,
                    longitude: 126.9015,
                    category: "카페,디저트",
                    thumbnailUrl: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=500",
                    imageUrls: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=500",
                    aiMoodSummary: "망원동의 감각적인 인테리어와 수제 디저트가 가득한 지하 아지트",
                    tags: ["조용한", "따뜻한우드톤", "코지한", "힙한분위기"],
                    editorsComment: "조용히 노트북 작업하기 좋고 감성적인 노래가 흘러나오는 망원 최고의 공간",
                    isPublished: true
                },
                {
                    name: "해금도 망원",
                    address: "서울 마포구 망원로 63 1층",
                    externalId: "dummy_naver_place_2",
                    latitude: 37.5568,
                    longitude: 126.9008,
                    category: "술집",
                    thumbnailUrl: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=500",
                    imageUrls: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=500",
                    aiMoodSummary: "전통 안주와 퓨전 요리를 내추럴 와인/전통주와 곁들이는 로컬 요리주점",
                    tags: ["데이트코스", "모던한", "힙한분위기"],
                    editorsComment: "망원동 골목길에서 발견한 숨은 보석 같은 안주 맛집 요리대포",
                    isPublished: true
                },
                {
                    name: "어반우드 성수",
                    address: "서울특별시 성동구 성수이로 51",
                    externalId: "dummy_naver_place_3",
                    latitude: 37.5432,
                    longitude: 127.0567,
                    category: "카페",
                    thumbnailUrl: "https://images.unsplash.com/photo-1498804103079-a6351b050096?w=500",
                    imageUrls: "https://images.unsplash.com/photo-1498804103079-a6351b050096?w=500",
                    aiMoodSummary: "푸릇푸릇한 플랜테리어와 우드 인테리어가 조화를 이루는 성수동 힐링 공간",
                    tags: ["우드톤", "코지한", "노트북가능", "콘센트석"],
                    editorsComment: "햇빛이 잘 드는 통창 밑에서 커피 한 잔 즐기며 책 읽기 아주 훌륭한 쉼터",
                    isPublished: true
                }
            ]
        };

        try {
            const res = await fetch('http://localhost:8080/api/v1/admin/places/batch-publish', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Admin-Secret-Key': adminKey
                },
                body: JSON.stringify(dummyPayload)
            });

            if (res.ok) {
                const result = await res.json();
                setStatusMsg({
                    type: 'success',
                    text: `🎉 더미 데이터 주입 성공! 총 ${result.processedCount}개의 신규 핫플레이스를 추가 로딩했습니다.`
                });
                await onRefreshDb();
            } else {
                setStatusMsg({ type: 'error', text: '더미 데이터 주입 실패: HTTP ' + res.status });
            }
        } catch (err: any) {
            setStatusMsg({ type: 'error', text: '더미 주입 통신 에러: ' + err.message });
        } finally {
            setIsProcessing(false);
        }
    };

    // 데이터베이스 전체 리셋 (모든 공간 삭제)
    const handleResetDatabase = async () => {
        if (!confirm('⚠️ [경고] 데이터베이스에 저장된 모든 공간(장소) 데이터를 영구 삭제하시겠습니까?\n이 작업은 복구할 수 없으며, 모든 사용자 추천 룩북이 초기화됩니다.')) {
            return;
        }
        
        if (!confirm('정말로 진행하겠습니까? 이 최종 경고 이후 모든 데이터가 영구적으로 증발합니다.')) {
            return;
        }

        setIsProcessing(true);
        const adminKey = sessionStorage.getItem('adminSecretKey') || '';
        let successCount = 0;
        let failCount = 0;

        try {
            // 모든 dbPlaces의 ID를 순회하며 개별 Delete 요청을 쏩니다.
            // 어드민용 전체 초기화 전용 API가 백엔드에 따로 없으므로, 안정적으로 리스트에 매핑된 장소들을 영구삭제 요청합니다.
            for (const place of dbPlaces) {
                const res = await fetch(`http://localhost:8080/api/v1/admin/places/${place.id}`, {
                    method: 'DELETE',
                    headers: { 'X-Admin-Secret-Key': adminKey }
                });
                if (res.ok) successCount++;
                else failCount++;
            }

            if (failCount === 0) {
                setStatusMsg({
                    type: 'success',
                    text: `🔥 DB 리셋 완료! 총 ${successCount}개의 장소를 데이터베이스에서 안전하게 소거했습니다.`
                });
            } else {
                setStatusMsg({
                    type: 'info',
                    text: `DB 일부 소거: 성공 ${successCount}건, 실패 ${failCount}건. 권한을 다시 한 번 확인하세요.`
                });
            }
            await onRefreshDb();
        } catch (err: any) {
            setStatusMsg({ type: 'error', text: 'DB 초기화 통신 오류: ' + err.message });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 animate-fade-in font-display">
            {/* 설정 패널 인트로 */}
            <div className="bg-[#FAFAFA] p-6 rounded-[24px] border border-[#E5E8EB]/70">
                <span className="text-[12.5px] font-extrabold text-orange-500 tracking-wider uppercase">System Config</span>
                <h2 className="text-[20px] font-bold text-[#191F28] tracking-tight mt-1">CMS 시스템 환경설정</h2>
                <p className="text-[13.5px] text-[#8B95A1] mt-0.5">백엔드 서버 헬스체크 및 개발/테스트 목적의 관리자용 데이터 수동 제어 도구 모음입니다.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. API 통신 & 헬스 체크 카드 */}
                <div className="bg-white rounded-[24px] border border-[#E5E8EB] p-6 flex flex-col justify-between min-h-[180px] shadow-[0_4px_16px_rgba(0,0,0,0.01)]">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <h3 className="font-extrabold text-[15.5px] text-[#191F28]">API 연결 상태 (Health Check)</h3>
                            <button
                                onClick={checkServerHealth}
                                className="px-2.5 py-1.5 rounded-[8px] bg-[#F2F4F6] hover:bg-[#E5E8EB] text-[#4E5968] text-[11px] font-bold transition-all cursor-pointer border-none outline-none"
                            >
                                새로고침
                            </button>
                        </div>
                        <p className="text-[12px] text-[#8B95A1]">Spring Boot 백엔드 서버와의 API 레이턴시 응답속도를 체크합니다.</p>
                    </div>

                    <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[#F2F4F6]">
                        {healthStatus === 'testing' && (
                            <>
                                <span className="w-3.5 h-3.5 rounded-full bg-amber-400 animate-pulse"></span>
                                <span className="text-[13.5px] font-bold text-amber-500">연결 확인 중...</span>
                            </>
                        )}
                        {healthStatus === 'ok' && (
                            <>
                                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500"></span>
                                <span className="text-[13.5px] font-bold text-emerald-600">
                                    통신 양호 <span className="text-[11.5px] text-[#8B95A1] font-normal">({latency} ms)</span>
                                </span>
                            </>
                        )}
                        {healthStatus === 'error' && (
                            <>
                                <span className="w-3.5 h-3.5 rounded-full bg-red-500 animate-ping"></span>
                                <span className="text-[13.5px] font-bold text-red-500">통신 에러 (8080 포트 점검 필요)</span>
                            </>
                        )}
                    </div>
                </div>

                {/* 2. 일괄 노출 복구 도구 카드 */}
                <div className="bg-white rounded-[24px] border border-[#E5E8EB] p-6 flex flex-col justify-between min-h-[180px] shadow-[0_4px_16px_rgba(0,0,0,0.01)]">
                    <div className="flex flex-col gap-1.5">
                        <h3 className="font-extrabold text-[15.5px] text-[#191F28]">일괄 공개 전환 도구</h3>
                        <p className="text-[12px] text-[#8B95A1]">
                            DB에 비공개 상태(`is_published = false`)로 머물러 발견 탭에서 보이지 않는 장소들을 클릭 한 번에 전부 `공개`로 활성화합니다.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handlePublishAll}
                        disabled={isProcessing}
                        className="w-full h-[46px] rounded-[12px] bg-[#191F28] hover:bg-black text-white font-bold text-[13.5px] transition-colors mt-4 shadow-sm border-none outline-none cursor-pointer disabled:opacity-50"
                    >
                        모든 비공개 장소 일괄 공개 전환
                    </button>
                </div>

                {/* 3. 더미 데이터 주입 카드 */}
                <div className="bg-white rounded-[24px] border border-[#E5E8EB] p-6 flex flex-col justify-between min-h-[180px] shadow-[0_4px_16px_rgba(0,0,0,0.01)]">
                    <div className="flex flex-col gap-1.5">
                        <h3 className="font-extrabold text-[15.5px] text-[#191F28]">테스트용 핫플 데이터 주입</h3>
                        <p className="text-[12px] text-[#8B95A1]">
                            망원동 및 성수동의 핫플레이스 더미 3건을 즉시 빌드 및 공개 상태로 DB에 직접 주입합니다. (중복 방지 처리)
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleInjectDummyData}
                        disabled={isProcessing}
                        className="w-full h-[46px] rounded-[12px] border border-orange-500/30 bg-orange-50/50 hover:bg-orange-100/50 text-orange-600 font-bold text-[13.5px] transition-colors mt-4 shadow-sm outline-none cursor-pointer disabled:opacity-50"
                    >
                        테스트 공간 3선 주입
                    </button>
                </div>

                {/* 4. 데이터베이스 초기화 카드 */}
                <div className="bg-white rounded-[24px] border border-red-100 p-6 flex flex-col justify-between min-h-[180px] shadow-[0_4px_16px_rgba(0,0,0,0.01)]">
                    <div className="flex flex-col gap-1.5">
                        <h3 className="font-extrabold text-[15.5px] text-red-600">데이터베이스 전체 리셋</h3>
                        <p className="text-[12px] text-[#8B95A1]">
                            DB에 적재된 모든 장소 데이터를 영구히 소거합니다. 테스트 주기가 바뀔 때 초기 상태로 깨끗하게 청소하기에 유용합니다.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleResetDatabase}
                        disabled={isProcessing || dbPlaces.length === 0}
                        className="w-full h-[46px] rounded-[12px] bg-red-50 hover:bg-red-100 text-red-600 font-bold text-[13.5px] transition-colors mt-4 shadow-sm border-none outline-none cursor-pointer disabled:opacity-40"
                    >
                        DB 전체 초기화 (데이터 영구 삭제)
                    </button>
                </div>
            </div>
        </div>
    );
}
