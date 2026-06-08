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
    const [newPassword, setNewPassword] = useState<string>('');

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

    // 어드민 비밀번호 변경
    const handleChangePassword = async () => {
        if (!newPassword.trim()) return;

        if (!confirm('어드민 비밀번호를 변경하시겠습니까?\n변경 시 현재 세션 정보도 새 비밀번호로 갱신됩니다.')) {
            return;
        }

        setIsProcessing(true);
        const adminKey = sessionStorage.getItem('adminSecretKey') || '';
        try {
            const res = await fetch('http://localhost:8080/api/v1/admin/places/settings/password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Admin-Secret-Key': adminKey
                },
                body: JSON.stringify({ newPassword: newPassword.trim() })
            });

            if (res.ok) {
                sessionStorage.setItem('adminSecretKey', newPassword.trim());
                setStatusMsg({
                    type: 'success',
                    text: '🎉 어드민 비밀번호가 성공적으로 변경되었습니다.'
                });
                setNewPassword('');
            } else {
                setStatusMsg({ type: 'error', text: '비밀번호 변경 실패: HTTP ' + res.status });
            }
        } catch (err: any) {
            setStatusMsg({ type: 'error', text: '비밀번호 변경 중 통신 오류: ' + err.message });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="flex flex-col gap-8 animate-fade-in font-display">
            {/* 상단 안내 섹션 */}
            <div className="bg-gradient-to-r from-[#F9FAFB] to-[#F2F4F6] p-8 rounded-[30px] border border-[#E5E8EB]/60 flex flex-col gap-1.5 relative overflow-hidden shadow-[inset_0_1px_2px_rgba(255,255,255,0.8)]">
                <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-[8px] bg-orange-500/10 text-orange-600 text-[11px] font-black uppercase tracking-wider">
                        System Config
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B0B8C1]"></span>
                    <span className="text-[12px] text-[#8B95A1] font-bold">CMS 환경설정</span>
                </div>
                <h2 className="text-[22px] font-bold text-[#191F28] tracking-tight mt-1">CMS 시스템 환경설정</h2>
                <p className="text-[14px] text-[#4E5968] leading-relaxed max-w-[640px]">
                    API 서버와의 연결 상태를 점검하고, 데이터 일괄 관리 및 보안 비밀번호 구성을 간편하게 설정할 수 있습니다.
                </p>
            </div>

            {/* 메인 3단 그룹화 레이아웃 */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* 왼쪽 영역 (시스템 상태 및 보안 제어) - 7컬럼 */}
                <div className="lg:col-span-7 flex flex-col gap-8">
                    
                    {/* 1. API 연결 상태 카드 */}
                    <div className="bg-white rounded-[24px] border border-[#E5E8EB] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.03)] transition-all duration-300 flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3.5">
                                <div className="w-11 h-11 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500">
                                    <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-bold text-[16px] text-[#191F28] tracking-tight">API 연결 상태</h3>
                                    <p className="text-[12px] text-[#8B95A1] mt-0.5 font-medium">Spring Boot 서버 연결성 및 응답 지연율 확인</p>
                                </div>
                            </div>
                            <button
                                onClick={checkServerHealth}
                                className="px-4 py-2.5 rounded-[12px] bg-[#F2F4F6] hover:bg-[#E5E8EB] active:scale-[0.97] text-[#4E5968] text-[12px] font-bold transition-all border-none outline-none cursor-pointer"
                            >
                                상태 갱신
                            </button>
                        </div>

                        <div className="flex items-center justify-between bg-[#F9FAFB] p-5 rounded-[16px] border border-[#F2F4F6]">
                            <div className="flex items-center gap-3">
                                {healthStatus === 'testing' && (
                                    <>
                                        <span className="w-3.5 h-3.5 rounded-full bg-amber-400 animate-pulse"></span>
                                        <span className="text-[14px] font-bold text-amber-500">연결 확인 중...</span>
                                    </>
                                )}
                                {healthStatus === 'ok' && (
                                    <>
                                        <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]"></span>
                                        <span className="text-[14px] font-bold text-emerald-600">통신 양호 (정상)</span>
                                    </>
                                )}
                                {healthStatus === 'error' && (
                                    <>
                                        <span className="w-3.5 h-3.5 rounded-full bg-red-500 animate-ping"></span>
                                        <span className="text-[14px] font-bold text-red-500">연결 에러 (서버 점검 필요)</span>
                                    </>
                                )}
                            </div>
                            
                            {healthStatus === 'ok' && latency !== null && (
                                <div className="text-[12px] font-bold text-[#8B95A1]">
                                    레이턴시: <span className="text-emerald-600 font-extrabold text-[14px]">{latency}</span> ms
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 2. 어드민 비밀번호 변경 카드 */}
                    <div className="bg-white rounded-[24px] border border-[#E5E8EB] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.03)] transition-all duration-300 flex flex-col gap-6">
                        <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500">
                                <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-bold text-[16px] text-[#191F28] tracking-tight">어드민 마스터 비밀번호 변경</h3>
                                <p className="text-[12px] text-[#8B95A1] mt-0.5 font-medium">인증용 마스터 키를 변경하여 DB에 즉시 영구 반영합니다.</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="password"
                                placeholder="새 비밀번호 입력"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="flex-1 bg-[#F2F4F6] focus:bg-[#E5E8EB] focus:ring-2 focus:ring-orange-500/20 text-[#191F28] text-[14px] font-bold rounded-[14px] px-5 py-3.5 border border-transparent focus:border-orange-500/30 outline-none transition-all placeholder-[#B0B8C1]"
                            />
                            <button
                                type="button"
                                onClick={handleChangePassword}
                                disabled={isProcessing || !newPassword.trim()}
                                className="px-6 py-3.5 rounded-[14px] bg-orange-500 hover:bg-orange-600 disabled:bg-[#E5E8EB] disabled:text-[#B0B8C1] disabled:opacity-70 text-white font-extrabold text-[13.5px] transition-all border-none outline-none cursor-pointer active:scale-[0.98]"
                            >
                                변경 적용
                            </button>
                        </div>
                    </div>

                </div>

                {/* 오른쪽 영역 (데이터 상태 관리 및 Danger Zone) - 5컬럼 */}
                <div className="lg:col-span-5 flex flex-col gap-8">
                    
                    {/* 3. 데이터 일괄 노출 카드 */}
                    <div className="bg-white rounded-[24px] border border-[#E5E8EB] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.03)] transition-all duration-300 flex flex-col gap-6">
                        <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500">
                                <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-bold text-[16px] text-[#191F28] tracking-tight">비공개 장소 일괄 공개</h3>
                                <p className="text-[12px] text-[#8B95A1] mt-0.5 font-medium">가등록 상태의 모든 장소를 발견 피드에 일괄 활성화합니다.</p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handlePublishAll}
                            disabled={isProcessing}
                            className="w-full py-4 rounded-[14px] bg-[#191F28] hover:bg-black disabled:bg-[#E5E8EB] text-white font-extrabold text-[13.5px] transition-all border-none outline-none cursor-pointer active:scale-[0.98] shadow-sm flex items-center justify-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            모든 비공개 장소 즉시 활성화
                        </button>
                    </div>

                    {/* 4. Danger Zone (위험 관리 구역) */}
                    <div className="bg-red-50/20 border border-red-100 rounded-[24px] p-8 shadow-[0_4px_20px_rgba(239,68,68,0.01)] flex flex-col gap-6">
                        <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-2xl bg-red-50 flex items-center justify-center text-red-500">
                                <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-bold text-[16px] text-red-600 tracking-tight">Danger Zone (위험 작업)</h3>
                                <p className="text-[12px] text-red-500/80 mt-0.5 font-medium">주의가 필요한 데이터베이스 영구 소거 명령어입니다.</p>
                            </div>
                        </div>

                        <div className="bg-white/70 border border-red-100/50 p-4 rounded-[16px] text-[12px] text-[#4E5968] leading-relaxed font-semibold">
                            <span className="font-extrabold text-red-600">경고:</span> 본 작업을 실행하면 DB 내 모든 공간(장소) 데이터 및 룩북 데이터가 영구히 소거되며, 복구할 수 없습니다.
                        </div>

                        <button
                            type="button"
                            onClick={handleResetDatabase}
                            disabled={isProcessing || dbPlaces.length === 0}
                            className="w-full py-4 rounded-[14px] bg-red-600 hover:bg-red-700 disabled:bg-red-100 disabled:text-red-300 text-white font-extrabold text-[13.5px] transition-all border-none outline-none cursor-pointer active:scale-[0.98] shadow-sm flex items-center justify-center gap-2"
                        >
                            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            데이터베이스 전체 초기화 실행
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
