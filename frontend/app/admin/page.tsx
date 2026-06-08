'use client';

import React, { useState, useEffect } from 'react';
import StagingDashboard from './components/StagingDashboard';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [passwordInput, setPasswordInput] = useState<string>('');
    const [errorMsg, setErrorMsg] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    useEffect(() => {
        // 브라우저 탭 타이틀 설정
        if (typeof window !== 'undefined') {
            document.title = "PickPl | 공간 관리 센터";
            const savedKey = sessionStorage.getItem('adminSecretKey');
            if (savedKey) {
                // 백엔드 시크릿 키가 설정되어 있을 때, 우선은 세션스토리지에 저장된 키를 확인하여 로그인 처리
                setIsAuthenticated(true);
            }
        }
    }, []);

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedPassword = passwordInput.trim();
        if (!trimmedPassword) {
            setErrorMsg('비밀번호를 입력해 주세요.');
            return;
        }

        setIsSubmitting(true);
        setErrorMsg('');

        try {
            const res = await fetch('http://localhost:8080/api/v1/admin/places', {
                headers: {
                    'X-Admin-Secret-Key': trimmedPassword
                }
            });

            if (res.ok) {
                if (typeof window !== 'undefined') {
                    sessionStorage.setItem('adminSecretKey', trimmedPassword);
                    setIsAuthenticated(true);
                }
            } else if (res.status === 403) {
                setErrorMsg('관리자 비밀번호가 올바르지 않습니다.');
            } else {
                setErrorMsg(`인증 실패: HTTP ${res.status}`);
            }
        } catch (err: any) {
            setErrorMsg('서버와 통신할 수 없습니다. 백엔드(8080 포트) 상태를 확인해 주세요.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLogout = () => {
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem('adminSecretKey');
            setIsAuthenticated(false);
            setPasswordInput('');
            router.push('/');
        }
    };

    if (isAuthenticated) {
        return (
            <StagingDashboard onLogout={handleLogout} />
        );
    }

    return (
        <div className="min-h-screen w-full bg-[#F2F4F6] flex items-center justify-center p-6 font-display">
            <div className="w-full max-w-[420px] bg-white rounded-[32px] p-10 shadow-[0_12px_40px_rgba(0,0,0,0.04)] border border-[#E5E8EB]/70 flex flex-col items-center">
                {/* Paperlogy 로고 */}
                <h1 className="font-logo font-extrabold text-[42px] tracking-tight text-[#191F28] mb-1.5 mt-2">Pick<span className="text-orange-500">Pl</span></h1>
                <span className="px-3 py-1 rounded-[8px] bg-[#F2F4F6] text-[#8B95A1] text-[12px] font-bold tracking-widest uppercase mb-10">
                    Administrator
                </span>

                <form onSubmit={handleLoginSubmit} className="w-full flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[13px] font-bold text-[#8B95A1] pl-1">관리자 비밀번호</label>
                        <input
                            type="password"
                            placeholder="비밀번호를 입력하세요"
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            disabled={isSubmitting}
                            className="w-full bg-[#F2F4F6] focus:bg-[#E5E8EB] focus:ring-2 focus:ring-orange-500/20 text-[#191F28] text-[15.5px] font-semibold rounded-[18px] px-5 py-4 border-none outline-none transition-all placeholder-[#B0B8C1] disabled:opacity-50"
                        />
                    </div>

                    {errorMsg && (
                        <p className="text-red-500 text-[13.5px] font-bold pl-1 animate-pulse">
                            {errorMsg}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-[56px] rounded-[18px] bg-[#191F28] hover:bg-black text-white font-bold text-[16px] transition-all mt-4 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                인증 확인 중...
                            </>
                        ) : (
                            '로그인'
                        )}
                    </button>
                </form>
                
                <button
                    type="button"
                    onClick={() => router.push('/')}
                    className="text-[13.5px] font-bold text-[#8B95A1] hover:text-[#4E5968] underline underline-offset-4 mt-6 transition-colors border-none bg-transparent cursor-pointer"
                >
                    일반 서비스 메인으로 돌아가기
                </button>
                
                <p className="text-[12px] text-[#B0B8C1] mt-8 text-center font-medium">
                    본 시스템은 허가된 관리자만 접근할 수 있습니다.<br />
                    비인가 접근 시 법적 처벌을 받을 수 있습니다.
                </p>
            </div>
        </div>
    );
}
