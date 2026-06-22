import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import axiosInstance from '../../api/axios';

interface MyPageAccountSettingsViewProps {
    hidden: boolean;
    userEmail: string;
    provider: string;
    emailVerified: boolean;
    linkedProviders: string[];
    refreshUserInfo: () => Promise<void>;
    onBack?: () => void;
    onLogout: () => void;
    showToast: (msg: string, type?: 'success' | 'warning' | 'error') => void;
}

export default function MyPageAccountSettingsView({
    hidden,
    userEmail,
    provider,
    emailVerified,
    linkedProviders,
    refreshUserInfo,
    onBack,
    onLogout,
    showToast
}: MyPageAccountSettingsViewProps) {
    // 비밀번호 변경 입력 상태
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 로그인 기기 세션 상태
    const [sessions, setSessions] = useState<any[]>([]);
    const [isLoadingSessions, setIsLoadingSessions] = useState(false);

    const fetchSessions = async () => {
        setIsLoadingSessions(true);
        try {
            const token = localStorage.getItem("refreshToken") || "";
            const res = await axiosInstance.get(`/auth/sessions?currentRefreshToken=${encodeURIComponent(token)}`);
            setSessions(res.data || []);
        } catch (err) {
            console.error("로그인 기록 조회 실패:", err);
        } finally {
            setIsLoadingSessions(false);
        }
    };

    useEffect(() => {
        if (!hidden) {
            fetchSessions();
        }
    }, [hidden]);

    const handleRemoteLogout = async (sessionId: number) => {
        if (!window.confirm("이 기기에서 로그아웃하시겠습니까?")) return;
        try {
            await axiosInstance.delete(`/auth/sessions/${sessionId}`);
            showToast("해당 기기에서 원격 로그아웃 되었습니다.", "success");
            fetchSessions();
        } catch (err: any) {
            console.error("원격 로그아웃 실패:", err);
            showToast(err.response?.data?.message || "원격 로그아웃 처리 중 오류가 발생했습니다.", "error");
        }
    };

    // 이메일 인증 관련 상태
    const [isVerificationSending, setIsVerificationSending] = useState(false);
    const [verificationSent, setVerificationSent] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false); // 모달 오픈 상태 추가
    const [mounted, setMounted] = useState(false); // Portal 마운트 감지

    // 6자리 개별 인풋 값 상태 및 포커스 참조
    const [codeInputs, setCodeInputs] = useState<string[]>(Array(6).fill(''));
    const inputRefs = useRef<HTMLInputElement[]>([]);
    const [timeLeft, setTimeLeft] = useState<number>(0);

    // 클라이언트 마운트 완료 처리
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // 모달이 열릴 때 첫 번째 입력창에 자동 포커스
    useEffect(() => {
        if (isModalOpen && verificationSent) {
            const timer = setTimeout(() => {
                inputRefs.current[0]?.focus();
            }, 150);
            return () => clearTimeout(timer);
        }
    }, [isModalOpen, verificationSent]);

    const updateVerificationCode = (newInputs: string[]) => {
        setCodeInputs(newInputs);
        setVerificationCode(newInputs.join(''));
    };

    // 지속형 5분 타이머 로컬스토리지 연동
    useEffect(() => {
        const checkTimer = () => {
            const savedExpiry = localStorage.getItem('pickpl_verify_expiry');
            if (savedExpiry) {
                const expiry = parseInt(savedExpiry, 10);
                const remaining = Math.max(0, Math.floor((expiry - Date.now()) / 1000));
                if (remaining > 0) {
                    setVerificationSent(true);
                    setTimeLeft(remaining);
                    return remaining;
                } else {
                    localStorage.removeItem('pickpl_verify_expiry');
                    setVerificationSent(false);
                    setTimeLeft(0);
                }
            }
            return 0;
        };

        const initialRemaining = checkTimer();
        if (initialRemaining <= 0) return;

        const timerId = setInterval(() => {
            const savedExpiry = localStorage.getItem('pickpl_verify_expiry');
            if (savedExpiry) {
                const expiry = parseInt(savedExpiry, 10);
                const remaining = Math.max(0, Math.floor((expiry - Date.now()) / 1000));
                if (remaining > 0) {
                    setTimeLeft(remaining);
                } else {
                    setTimeLeft(0);
                    setVerificationSent(false);
                    localStorage.removeItem('pickpl_verify_expiry');
                    showToast("인증 시간이 만료되었습니다. 다시 발송해주세요.", "warning");
                    clearInterval(timerId);
                }
            } else {
                clearInterval(timerId);
            }
        }, 1000);

        return () => clearInterval(timerId);
    }, [verificationSent]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handleInputChange = (index: number, value: string) => {
        const cleanValue = value.replace(/[^0-9]/g, '');
        const newInputs = [...codeInputs];
        newInputs[index] = cleanValue.substring(cleanValue.length - 1);
        updateVerificationCode(newInputs);

        if (newInputs[index] !== '' && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            if (codeInputs[index] === '' && index > 0) {
                const newInputs = [...codeInputs];
                newInputs[index - 1] = '';
                updateVerificationCode(newInputs);
                inputRefs.current[index - 1]?.focus();
            } else {
                const newInputs = [...codeInputs];
                newInputs[index] = '';
                updateVerificationCode(newInputs);
            }
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').trim();
        if (/^\d{6}$/.test(pastedData)) {
            const digits = pastedData.split('');
            updateVerificationCode(digits);
            inputRefs.current[5]?.focus();
        } else {
            showToast("올바른 6자리 숫자를 붙여넣어 주세요.", "warning");
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
            showToast("모든 비밀번호 필드를 입력해주세요.", "warning");
            return;
        }
        if (newPassword !== confirmPassword) {
            showToast("새 비밀번호와 비밀번호 확인이 일치하지 않습니다.", "warning");
            return;
        }
        if (newPassword.length < 4) {
            showToast("비밀번호는 4자리 이상이어야 합니다.", "warning");
            return;
        }

        setIsSubmitting(true);
        try {
            await axiosInstance.post('/auth/password', {
                currentPassword,
                newPassword
            });
            showToast("비밀번호가 성공적으로 변경되었습니다.", "success");
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            console.error("비밀번호 변경 실패:", err);
            showToast(err.response?.data?.message || "현재 비밀번호가 올바르지 않습니다.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSendVerificationRequest = async () => {
        setIsVerificationSending(true);
        try {
            await axiosInstance.post('/auth/email/verification-request');
            
            // 5분 만료 타임스탬프 로컬스토리지에 저장
            const expiry = Date.now() + 5 * 60 * 1000;
            localStorage.setItem('pickpl_verify_expiry', String(expiry));
            
            setCodeInputs(Array(6).fill(''));
            setVerificationCode('');
            setVerificationSent(true);
            showToast("인증 코드가 이메일로 발송되었습니다. 콘솔 로그를 확인하세요!", "success");
        } catch (err: any) {
            console.error("인증 메일 발송 실패:", err);
            showToast(err.response?.data?.message || "인증 메일 발송 중 오류가 발생했습니다.", "error");
        } finally {
            setIsVerificationSending(false);
        }
    };

    const handleVerifyEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        if (verificationCode.length !== 6) {
            showToast("6자리 인증 코드를 모두 입력해주세요.", "warning");
            return;
        }
        setIsVerifying(true);
        try {
            await axiosInstance.post('/auth/email/verify', {
                code: verificationCode
            });
            showToast("이메일 인증이 성공적으로 완료되었습니다!", "success");
            setVerificationSent(false);
            setVerificationCode('');
            setCodeInputs(Array(6).fill(''));
            localStorage.removeItem('pickpl_verify_expiry');
            setIsModalOpen(false); // 이메일 인증 완료 후 모달 닫기
            await refreshUserInfo();
        } catch (err: any) {
            console.error("이메일 인증 실패:", err);
            showToast(err.response?.data?.message || "인증 코드가 일치하지 않거나 유효시간이 지났습니다.", "error");
        } finally {
            setIsVerifying(false);
        }
    };

    const handleLinkSocial = (providerName: string) => {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            showToast("인증 토큰이 유효하지 않습니다. 다시 로그인해 주세요.", "error");
            return;
        }
        window.location.href = `http://localhost:8080/api/v1/auth/link/${providerName.toLowerCase()}/init?token=${encodeURIComponent(token)}`;
    };

    const handleWithdraw = async () => {
        const confirmWithdraw = window.confirm(
            "정말로 회원 탈퇴를 진행하시겠습니까?\n탈퇴 시 모든 북마크 및 투표 내역이 삭제되며, 이 작업은 되돌릴 수 없습니다."
        );
        if (!confirmWithdraw) return;

        try {
            await axiosInstance.delete('/auth/me');
            showToast("회원 탈퇴가 완료되었습니다. 그동안 이용해주셔서 감사합니다.", "success");
            onLogout();
        } catch (err: any) {
            console.error("회원 탈퇴 실패:", err);
            showToast(err.response?.data?.message || "회원 탈퇴 처리 중 오류가 발생했습니다.", "error");
        }
    };

    return (
        <div 
            style={{ display: hidden ? 'none' : 'flex' }} 
            className="bg-white rounded-[28px] lg:rounded-[32px] p-6 lg:p-8 border border-[#F2F4F6] shadow-sm flex flex-col gap-6 relative overflow-hidden animate-fade-in w-full shrink-0"
        >
            <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/[0.01] rounded-full blur-3xl pointer-events-none"></div>

            {/* 헤더 */}
            <div className="pb-4 border-b border-[#F2F4F6] flex justify-between items-center w-full">
                <div>
                    <span className="px-2.5 py-1 rounded-[8px] bg-[#F0F6F5] text-[#2E7D7A] text-[11px] font-bold tracking-tight border border-[#D1E6E4]/50">프로필 및 보안 설정</span>
                    <h3 className="font-extrabold text-[19px] text-[#191F28] mt-1.5 tracking-tight">계정 설정</h3>
                </div>
            </div>

            <div className="w-full flex flex-col gap-6">
                {/* 계정 정보 카드 */}
                <div className="bg-[#F9FAFB] rounded-[24px] p-5 border border-[#F2F4F6] flex flex-col gap-4">
                    <h3 className="font-extrabold text-[15px] text-[#191F28]">계정 기본 정보</h3>
                    <div className="flex flex-col gap-1">
                        <span className="text-[12px] font-bold text-[#8B95A1]">이메일 주소</span>
                        <div className="flex items-center justify-between mt-1">
                            <span className="text-[15px] font-extrabold text-[#191F28]">{userEmail || "이메일 정보 없음"}</span>
                            {provider === 'LOCAL' ? (
                                emailVerified ? (
                                    <span className="px-2.5 py-1 rounded-[8px] bg-[#F0F6F5] text-[#2E7D7A] border border-[#D1E6E4]/50 text-[11px] font-bold">
                                        이메일 인증됨
                                    </span>
                                ) : (
                                    <span className="px-2.5 py-1 rounded-[8px] bg-[#FFF0EB] text-[#FF5F2E] border border-[#FFD2C4]/50 text-[11px] font-bold">
                                        이메일 미인증
                                    </span>
                                )
                            ) : (
                                <span className="px-2.5 py-1 rounded-[8px] bg-[#FAF0EB] text-[#C67A5A] border border-[#EAD5C3]/50 text-[11px] font-bold">
                                    {provider} 연동됨
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* 이메일 미인증 카드 (LOCAL 회원의 경우) */}
                {provider === 'LOCAL' && !emailVerified && (
                    <div className="bg-[#FFF9F7] rounded-[24px] p-5 border border-[#FFD2C4] shadow-sm flex flex-col gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-[18px]">✉️</span>
                            <h3 className="font-extrabold text-[15px] text-[#FF5F2E]">이메일 본인 인증</h3>
                        </div>
                        <p className="text-[12px] text-[#8B95A1] font-medium leading-relaxed">
                            현재 계정은 이메일 인증이 완료되지 않았습니다. 인증을 완료하시면 프로필 설정 수정 권한이 부여되며 소셜 다중 통합 계정을 안전하게 연동하실 수 있습니다.
                        </p>
                        
                        {!verificationSent ? (
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(true)}
                                className="w-full py-3.5 rounded-[16px] bg-[#FF5F2E] hover:bg-[#E54E20] text-white font-bold text-[14px] active:scale-[0.98] transition-all"
                            >
                                이메일 인증하기
                            </button>
                        ) : (
                            <div className="flex flex-col gap-3">
                                <div className="flex justify-between items-center bg-[#FFF0EB] px-4 py-3.5 rounded-[16px] border border-[#FFD2C4]/50">
                                    <span className="text-[13px] font-bold text-[#FF5F2E] flex items-center gap-1">
                                        ⏱️ 인증 진행 중 (남은 시간: {formatTime(timeLeft)})
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(true)}
                                    className="w-full py-3.5 rounded-[16px] bg-[#191F28] hover:bg-black text-white font-bold text-[14px] active:scale-[0.98] transition-all"
                                >
                                    인증 코드 입력하기
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* 소셜 계정 연동 관리 */}
                <div className="bg-white rounded-[24px] p-5 border border-[#F2F4F6] shadow-sm flex flex-col gap-4">
                    <h3 className="font-extrabold text-[15px] text-[#191F28]">소셜 계정 연동 관리</h3>
                    <p className="text-[12px] font-medium text-[#8B95A1] leading-relaxed">
                        일반 이메일 계정으로 로그인한 경우, 소셜 계정들을 연동하여 다음 로그인 시 해당 소셜 로그인으로 바로 접속하실 수 있습니다.
                    </p>
                    
                    <div className="flex flex-col gap-3">
                        {/* 네이버 연동 배지 */}
                        <div className="flex items-center justify-between p-3.5 rounded-[16px] border border-[#F2F4F6] bg-[#F9FAFB]">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#03C75A] flex items-center justify-center">
                                    <svg viewBox="0 0 24 24" width="13" height="13" fill="white" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M16.2 2H22v20h-5.8l-8.4-12.4V22H2V2h5.8l8.4 12.4V2z"/>
                                    </svg>
                                </div>
                                <span className="font-bold text-[13.5px] text-[#4E5968]">네이버 계정</span>
                            </div>
                            {linkedProviders.includes('NAVER') || provider === 'NAVER' ? (
                                <span className="px-3 py-1.5 rounded-[10px] bg-[#03C75A]/10 text-[#03C75A] border border-[#03C75A]/30 text-[11px] font-bold">
                                    연동됨
                                </span>
                            ) : (
                                <button
                                    onClick={() => handleLinkSocial('NAVER')}
                                    className="px-3 py-1.5 rounded-[10px] bg-[#F2F4F6] hover:bg-[#E5E8EB] active:scale-95 text-[#4E5968] font-bold text-[11px] transition-all"
                                >
                                    연동하기
                                </button>
                            )}
                        </div>

                        {/* 카카오 연동 배지 */}
                        <div className="flex items-center justify-between p-3.5 rounded-[16px] border border-[#F2F4F6] bg-[#F9FAFB]">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#FEE500] flex items-center justify-center">
                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="#3C1E1E" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 3c-4.97 0-9 3.18-9 7.1 0 2.5 1.63 4.7 4.14 5.92-.17.58-.62 2.1-.7 2.4-.1.38.14.37.28.27.12-.08 1.94-1.32 2.7-1.84.85.22 1.7.35 2.58.35 4.97 0 9-3.18 9-7.1S16.97 3 12 3z"/>
                                    </svg>
                                </div>
                                <span className="font-bold text-[13.5px] text-[#4E5968]">카카오 계정</span>
                            </div>
                            {linkedProviders.includes('KAKAO') || provider === 'KAKAO' ? (
                                <span className="px-3 py-1.5 rounded-[10px] bg-[#03C75A]/10 text-[#03C75A] border border-[#03C75A]/30 text-[11px] font-bold">
                                    연동됨
                                </span>
                            ) : (
                                <button
                                    onClick={() => handleLinkSocial('KAKAO')}
                                    className="px-3 py-1.5 rounded-[10px] bg-[#F2F4F6] hover:bg-[#E5E8EB] active:scale-95 text-[#4E5968] font-bold text-[11px] transition-all"
                                >
                                    연동하기
                                </button>
                            )}
                        </div>

                        {/* 구글 연동 배지 */}
                        <div className="flex items-center justify-between p-3.5 rounded-[16px] border border-[#F2F4F6] bg-[#F9FAFB]">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white border border-[#E5E8EB] flex items-center justify-center shadow-sm">
                                    <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                    </svg>
                                </div>
                                <span className="font-bold text-[13.5px] text-[#4E5968]">구글 계정</span>
                            </div>
                            {linkedProviders.includes('GOOGLE') || provider === 'GOOGLE' ? (
                                <span className="px-3 py-1.5 rounded-[10px] bg-[#03C75A]/10 text-[#03C75A] border border-[#03C75A]/30 text-[11px] font-bold">
                                    연동됨
                                </span>
                            ) : (
                                <button
                                    onClick={() => handleLinkSocial('GOOGLE')}
                                    className="px-3 py-1.5 rounded-[10px] bg-[#F2F4F6] hover:bg-[#E5E8EB] active:scale-95 text-[#4E5968] font-bold text-[11px] transition-all"
                                >
                                    연동하기
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* 비밀번호 변경 폼 (LOCAL 유저) */}
                {provider === 'LOCAL' ? (
                    <form onSubmit={handlePasswordChange} className="bg-white rounded-[24px] p-5 border border-[#F2F4F6] shadow-sm flex flex-col gap-4">
                        <h3 className="font-extrabold text-[15px] text-[#191F28]">비밀번호 변경</h3>
                        
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[12px] font-bold text-[#8B95A1] pl-1">현재 비밀번호</label>
                            <input 
                                type="password"
                                placeholder="현재 비밀번호 입력"
                                value={currentPassword}
                                onChange={e => setCurrentPassword(e.target.value)}
                                className="bg-[#F9FAFB] border border-[#E5E8EB] rounded-[16px] px-4 py-3.5 text-[14px] font-semibold focus:outline-none focus:border-orange-500 focus:bg-white transition-colors"
                                required
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[12px] font-bold text-[#8B95A1] pl-1">새 비밀번호</label>
                            <input 
                                type="password"
                                placeholder="새 비밀번호 입력 (4자리 이상)"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                className="bg-[#F9FAFB] border border-[#E5E8EB] rounded-[16px] px-4 py-3.5 text-[14px] font-semibold focus:outline-none focus:border-orange-500 focus:bg-white transition-colors"
                                required
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[12px] font-bold text-[#8B95A1] pl-1">새 비밀번호 확인</label>
                            <input 
                                type="password"
                                placeholder="새 비밀번호 다시 입력"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                className="bg-[#F9FAFB] border border-[#E5E8EB] rounded-[16px] px-4 py-3.5 text-[14px] font-semibold focus:outline-none focus:border-orange-500 focus:bg-white transition-colors"
                                required
                            />
                        </div>

                        <button 
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full mt-2 py-3.5 rounded-[16px] bg-[#191F28] hover:bg-black text-white font-bold text-[14px] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? "변경 중..." : "비밀번호 변경"}
                        </button>
                    </form>
                ) : (
                    <div className="bg-white rounded-[24px] p-5 border border-[#F2F4F6] shadow-sm flex flex-col gap-3">
                        <h3 className="font-extrabold text-[15px] text-[#191F28]">비밀번호 변경</h3>
                        <div className="bg-[#FAF0EB] rounded-[16px] p-4 border border-[#EAD5C3]/40 text-center flex flex-col items-center gap-2">
                            <span className="text-[20px]">🔒</span>
                            <p className="text-[13px] font-bold text-[#C67A5A]">소셜 로그인 계정입니다.</p>
                            <p className="text-[12px] text-[#8B95A1] font-medium leading-relaxed">
                                해당 계정({provider})은 소셜 연동을 통해 로그인되었습니다.<br />
                                비밀번호 변경은 가입하신 소셜 서비스에서 진행해 주시기 바랍니다.
                            </p>
                        </div>
                    </div>
                )}

                {/* 로그인 기록 */}
                <div className="flex flex-col gap-4 border-t border-[#F2F4F6] pt-5">
                    <div className="flex flex-col gap-1">
                        <h4 className="font-bold text-[14px] text-[#191F28] pl-1">로그인 기록</h4>
                        <p className="text-[12px] text-[#8B95A1] pl-1">현재 로그인되어 있는 기기 및 세션 정보입니다.</p>
                    </div>
                    
                    <div className="flex flex-col gap-3 mt-1 font-sans">
                        {isLoadingSessions ? (
                            <div className="text-center py-4 text-[13px] text-[#8B95A1] font-semibold">로그인 기록 로딩 중...</div>
                        ) : sessions.length === 0 ? (
                            <div className="text-center py-4 text-[13px] text-[#8B95A1] font-semibold">로그인 기록이 없습니다.</div>
                        ) : (
                            sessions.map((session) => (
                                <div key={session.id} className="flex items-center justify-between p-4 rounded-[16px] border border-[#F2F4F6] bg-[#F9FAFB] shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-[#F2F4F6] flex items-center justify-center text-[#4E5968]">
                                            {session.device === 'iOS' || session.device === 'Android' ? (
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                </svg>
                                            ) : (
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                            )}
                                        </div>
                                        <div className="text-left">
                                            <p className="font-bold text-[13.5px] text-[#191F28] flex items-center gap-1.5">
                                                {session.location || "알 수 없는 지역"}{" "}
                                                {session.isCurrent && (
                                                    <span className="px-1.5 py-0.5 rounded-[6px] bg-[#E8F3F1] text-[#2E7D7A] text-[9.5px] font-bold">현재 기기</span>
                                                )}
                                            </p>
                                            <p className="text-[11.5px] text-[#8B95A1] font-semibold mt-0.5">
                                                {session.lastAccessed} • {session.browser || "Browser"} • {session.device || "OS"}
                                            </p>
                                        </div>
                                    </div>
                                    {!session.isCurrent && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoteLogout(session.id)}
                                            className="px-3 py-1.5 rounded-[10px] bg-[#FAF0F0] hover:bg-[#FFF0F0] text-red-500 font-bold text-[11px] transition-all active:scale-95 border border-red-100 flex items-center gap-1 shadow-sm"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                            <span>로그아웃</span>
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* 회원 탈퇴 카드 */}
                <div className="bg-white rounded-[24px] p-5 border border-[#F2F4F6] shadow-sm flex flex-col gap-4 mt-2">
                    <h3 className="font-extrabold text-[15px] text-[#191F28]">회원 탈퇴</h3>
                    <p className="text-[12px] font-medium text-[#8B95A1] leading-relaxed">
                        탈퇴 시 보관함에 저장된 모든 공간 데이터와 활동 내역이 즉시 영구 삭제되며 복구할 수 없습니다.
                    </p>
                    <button 
                        type="button"
                        onClick={handleWithdraw}
                        className="w-full py-3.5 rounded-[16px] bg-[#FAF0F0] hover:bg-[#FFF0F0] text-red-500 font-bold text-[14px] active:scale-[0.98] transition-all"
                    >
                        픽플 탈퇴하기
                    </button>
                </div>
            </div>

            {/* 이메일 인증 모달 오버레이 */}
            {isModalOpen && mounted && createPortal(
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
                    onClick={() => setIsModalOpen(false)}
                >
                    <div 
                        className="bg-white rounded-[32px] w-full max-w-[440px] p-6 lg:p-8 border border-[#F2F4F6] shadow-2xl flex flex-col relative animate-zoom-in"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* 닫기 버튼 */}
                        <button 
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#F2F4F6] hover:bg-[#E5E8EB] flex items-center justify-center text-[#4E5968] active:scale-95 transition-all"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {/* 모달 헤더 */}
                        <div className="flex flex-col items-center text-center mt-2 mb-6">
                            <span className="text-[32px] mb-2">🍊</span>
                            <h3 className="font-extrabold text-[20px] text-[#191F28]">
                                {!verificationSent ? "이메일 본인 인증" : "인증 번호 입력"}
                            </h3>
                            <p className="text-[13.5px] text-[#8B95A1] font-medium leading-relaxed mt-2 px-2">
                                {!verificationSent 
                                    ? `본인 인증을 위해 가입하신 이메일(${userEmail})로 인증 코드를 전송합니다.`
                                    : `가입하신 이메일(${userEmail})로 인증번호가 발송되었습니다. 아래에 6자리 코드를 입력해주세요.`}
                            </p>
                        </div>

                        {/* 모달 바디 / 폼 */}
                        {!verificationSent ? (
                            <button
                                type="button"
                                onClick={handleSendVerificationRequest}
                                disabled={isVerificationSending}
                                className="w-full py-4 rounded-[16px] bg-[#FF5F2E] hover:bg-[#E54E20] text-white font-bold text-[14px] active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                {isVerificationSending ? "인증 메일 발송 중..." : "인증 번호 받기"}
                            </button>
                        ) : (
                            <form onSubmit={handleVerifyEmail} className="flex flex-col gap-4">
                                <div className="flex flex-col gap-3">
                                    <div className="flex justify-between items-center px-1">
                                        <span className="text-[11px] font-bold text-[#8B95A1]">인증 번호 입력</span>
                                        <span className="text-[12px] font-bold text-[#FF5F2E] flex items-center gap-1 bg-[#FFF0EB] px-2.5 py-0.5 rounded-full">
                                            ⏱️ {formatTime(timeLeft)}
                                        </span>
                                    </div>
                                    
                                    {/* 6칸 분할 입력 폼 */}
                                    <div className="flex justify-between gap-2 mt-1">
                                        {codeInputs.map((val, idx) => (
                                            <input
                                                key={idx}
                                                type="text"
                                                maxLength={1}
                                                value={val}
                                                ref={el => { if (el) inputRefs.current[idx] = el; }}
                                                onChange={e => handleInputChange(idx, e.target.value)}
                                                onKeyDown={e => handleKeyDown(idx, e)}
                                                onPaste={idx === 0 ? handlePaste : undefined}
                                                className="w-11 h-11 text-center bg-[#F9FAFB] border border-[#E5E8EB] rounded-[12px] text-[18px] font-bold text-[#191F28] focus:outline-none focus:border-[#FF5F2E] focus:bg-white transition-colors shadow-sm"
                                            />
                                        ))}
                                    </div>
                                    
                                    <button
                                        type="submit"
                                        disabled={isVerifying || verificationCode.length !== 6}
                                        className="w-full mt-3 py-4 rounded-[16px] bg-[#191F28] hover:bg-black text-white font-bold text-[14px] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isVerifying ? "인증 확인 중..." : "인증 완료"}
                                    </button>
                                    
                                    <div className="flex flex-col items-center gap-2 mt-4 border-t border-[#F2F4F6] pt-4">
                                        <p className="text-[11px] text-[#8B95A1] font-medium text-center">
                                            이메일을 받지 못하셨나요? 
                                        </p>
                                        <button
                                            type="button"
                                            onClick={handleSendVerificationRequest}
                                            disabled={isVerificationSending}
                                            className="text-[12px] text-[#FF5F2E] hover:underline font-extrabold"
                                        >
                                            {isVerificationSending ? "다시 보내는 중..." : "인증번호 다시 보내기"}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
