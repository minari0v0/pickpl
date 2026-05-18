"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

function AuthForm() {
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const router = useRouter();
    const searchParams = useSearchParams();

    // Login States
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [loginError, setLoginError] = useState("");
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Signup States
    const [nickname, setNickname] = useState("");
    const [signupEmail, setSignupEmail] = useState("");
    const [signupPassword, setSignupPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [isNicknameChecked, setIsNicknameChecked] = useState(false);
    const [nicknameMessage, setNicknameMessage] = useState("");
    const [isAvailable, setIsAvailable] = useState(false);
    const [signupError, setSignupError] = useState("");

    useEffect(() => {
        const oauthError = searchParams.get("error");
        if (oauthError) {
            setLoginError(`소셜 로그인에 실패했습니다: ${oauthError}`);
        }
    }, [searchParams]);

    // Toast Logic
    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    const handleLocalLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError("");
        try {
            const res = await fetch("http://localhost:8080/api/v1/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: loginEmail, password: loginPassword }),
            });
            if (res.ok) {
                const data = await res.json();
                localStorage.setItem("accessToken", data.accessToken);
                localStorage.setItem("refreshToken", data.refreshToken);
                localStorage.setItem("nickname", data.nickname || "PickPl 유저");
                sessionStorage.setItem("showLoginToast", "true");
                router.push("/");
            } else if (res.status === 400) {
                setLoginError("일치하는 정보가 없습니다.");
            } else {
                setLoginError("서버 상태가 원활하지 않습니다. 잠시 후 다시 시도해주세요.");
            }
        } catch (error) {
            setLoginError("서버 연결에 실패했습니다. 네트워크 상태를 확인해주세요.");
        }
    };

    const handleCheckNickname = async () => {
        if (!nickname.trim()) {
            setNicknameMessage("닉네임을 입력해주세요.");
            setIsAvailable(false);
            return;
        }
        try {
            const res = await fetch(`http://localhost:8080/api/v1/auth/check-nickname?nickname=${encodeURIComponent(nickname)}`);
            if (res.ok) {
                const available = await res.json();
                setIsAvailable(available);
                setIsNicknameChecked(true);
                setNicknameMessage(available ? "사용 가능한 닉네임입니다." : "이미 사용 중인 닉네임입니다.");
            } else {
                setNicknameMessage("중복 확인에 실패했습니다.");
                setIsAvailable(false);
            }
        } catch (error) {
            setNicknameMessage("서버 연결에 실패했습니다.");
            setIsAvailable(false);
        }
    };

    const isPasswordValid = (pw: string) => {
        const reg = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return reg.test(pw);
    }

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setSignupError("");

        if (!isNicknameChecked || !isAvailable) {
            setSignupError("닉네임 중복 확인을 진행해주세요.");
            return;
        }
        if (!isPasswordValid(signupPassword)) {
            setSignupError("비밀번호 조건을 만족하지 않습니다.");
            return;
        }
        if (signupPassword !== passwordConfirm) {
            setSignupError("비밀번호가 일치하지 않습니다.");
            return;
        }

        try {
            const res = await fetch("http://localhost:8080/api/v1/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nickname, email: signupEmail, password: signupPassword }),
            });
            if (res.ok) {
                showToast("회원가입이 완료되었습니다! 로그인해주세요.");
                setMode('login'); // Switch back to login mode smoothly
                setSignupEmail("");
                setSignupPassword("");
                setPasswordConfirm("");
                setNickname("");
                setIsNicknameChecked(false);
                setNicknameMessage("");
                setSignupError("");
            } else {
                const errorMsg = await res.text();
                setSignupError(errorMsg || "이미 사용중인 이메일이거나 회원가입에 실패했습니다.");
            }
        } catch (error) {
            setSignupError("서버 연결에 실패했습니다. 네트워크 상태를 확인해주세요.");
        }
    };

    const slideVariants = {
        hidden: (isLogin: boolean) => ({ opacity: 0, x: isLogin ? -15 : 15 }),
        visible: { opacity: 1, x: 0, transition: { duration: 0.25, ease: "easeOut" } },
        exit: (isLogin: boolean) => ({ opacity: 0, x: isLogin ? 15 : -15, transition: { duration: 0.15, ease: "easeIn" } }),
    };

    return (
        <div className="w-full min-h-screen flex items-center justify-center bg-[#F9FAFB] overflow-hidden">
            <motion.div 
                layout 
                className="w-full max-w-[480px] bg-white sm:rounded-[24px] sm:shadow-sm px-6 py-12 flex flex-col justify-center relative min-h-screen sm:min-h-[500px]"
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
            >
                {/* Back Button */}
                <button onClick={() => {
                    if (mode === 'signup') setMode('login');
                    else router.push('/');
                }} className="absolute top-6 right-6 w-10 h-10 rounded-full hover:bg-[#F2F4F6] flex items-center justify-center text-[#8B95A1] transition-colors z-10">
                    {mode === 'signup' ? (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    )}
                </button>

                <AnimatePresence mode="wait" custom={mode === 'login'}>
                    {mode === 'login' ? (
                        <motion.div 
                            key="login-form"
                            custom={true}
                            variants={slideVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="flex flex-col w-full"
                        >
                            <div className="text-center mb-10 mt-4">
                                <h1 className="text-3xl font-bold text-[#191F28] mb-3 font-logo">PickPl</h1>
                                <p className="text-[#8B95A1] text-[15px]">나만의 비밀스러운 장소를 저장하세요</p>
                            </div>

                            {loginError && (
                                <div className="mb-4 p-3 bg-[#FFF0F0] text-[#F04438] text-[13px] rounded-[12px] font-medium text-center">
                                    {loginError}
                                </div>
                            )}

                            <form onSubmit={handleLocalLogin} className="flex flex-col gap-4 mb-6">
                                <div>
                                    <input
                                        type="email"
                                        placeholder="이메일 주소"
                                        value={loginEmail}
                                        onChange={(e) => setLoginEmail(e.target.value)}
                                        className="w-full h-14 bg-[#F2F4F6] rounded-[14px] px-5 text-[#191F28] placeholder-[#B0B8C1] focus:outline-none focus:ring-2 focus:ring-[#3182F6] transition-all"
                                        required
                                    />
                                </div>
                                <div>
                                    <input
                                        type="password"
                                        placeholder="비밀번호"
                                        value={loginPassword}
                                        onChange={(e) => setLoginPassword(e.target.value)}
                                        className="w-full h-14 bg-[#F2F4F6] rounded-[14px] px-5 text-[#191F28] placeholder-[#B0B8C1] focus:outline-none focus:ring-2 focus:ring-[#3182F6] transition-all"
                                        required
                                    />
                                </div>
                                <button type="submit" className="w-full h-14 bg-[#3182F6] hover:bg-[#1B64DA] active:bg-[#1958C0] text-white font-bold rounded-[14px] mt-2 transition-colors">
                                    이메일로 로그인
                                </button>
                            </form>

                            <div className="flex justify-center mb-8">
                                <span className="text-[#8B95A1] text-sm">아직 계정이 없으신가요? </span>
                                <button type="button" onClick={() => setMode('signup')} className="text-[#3182F6] text-sm font-semibold ml-2 hover:underline">
                                    회원가입
                                </button>
                            </div>

                            <div className="relative flex items-center justify-center mb-8">
                                <div className="absolute w-full border-t border-[#F2F4F6]"></div>
                                <span className="bg-white px-4 text-[#B0B8C1] text-sm relative z-10">또는 다음으로 로그인</span>
                            </div>

                            <div className="flex flex-col gap-3">
                                <a href="http://localhost:8080/oauth2/authorization/kakao" className="w-full h-14 bg-[#FEE500] hover:bg-[#F4DC00] text-[#000000] text-opacity-85 font-bold rounded-[14px] flex items-center justify-center relative transition-colors">
                                    <svg className="absolute left-5 w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 3C6.477 3 2 6.533 2 10.892c0 2.802 1.848 5.253 4.61 6.556-.208.73-1.002 3.615-1.026 3.738-.035.176.064.195.186.11 0 0 3.01-1.947 4.26-2.735.636.082 1.296.124 1.97.124 5.523 0 10-3.533 10-7.893C22 6.533 17.523 3 12 3z"/>
                                    </svg>
                                    카카오 로그인
                                </a>
                                <a href="http://localhost:8080/oauth2/authorization/naver" className="w-full h-14 bg-[#03C75A] hover:bg-[#02B351] text-white font-bold rounded-[14px] flex items-center justify-center relative transition-colors">
                                    <svg className="absolute left-5 w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M16.273 12.845 7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845z"/>
                                    </svg>
                                    네이버 로그인
                                </a>
                                <a href="http://localhost:8080/oauth2/authorization/google" className="w-full h-14 bg-white border border-[#E5E8EB] hover:bg-[#F9FAFB] text-[#333D4B] font-bold rounded-[14px] flex items-center justify-center relative transition-colors">
                                    <svg className="absolute left-5 w-6 h-6" viewBox="0 0 24 24">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                    </svg>
                                    Google 로그인
                                </a>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="signup-form"
                            custom={false}
                            variants={slideVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="flex flex-col w-full"
                        >
                            <div className="mb-10 mt-4 text-center">
                                <h1 className="text-3xl font-bold text-[#191F28] mb-3">회원가입</h1>
                                <p className="text-[#8B95A1] text-[15px]">PickPl과 함께 나만의 핫플을 기록하세요.</p>
                            </div>

                            {signupError && (
                                <div className="mb-4 p-3 bg-[#FFF0F0] text-[#F04438] text-[13px] rounded-[12px] font-medium text-center">
                                    {signupError}
                                </div>
                            )}

                            <form onSubmit={handleSignup} className="flex flex-col gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="block text-[14px] font-bold text-[#191F28] px-1">닉네임</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="사용하실 닉네임 (2~10자)"
                                            value={nickname}
                                            onChange={(e) => {
                                                setNickname(e.target.value);
                                                setIsNicknameChecked(false);
                                                setNicknameMessage("");
                                            }}
                                            className="flex-1 h-14 bg-[#F2F4F6] rounded-[14px] px-5 text-[#191F28] placeholder-[#B0B8C1] focus:outline-none focus:ring-2 focus:ring-[#3182F6] transition-all"
                                            required minLength={2} maxLength={10}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleCheckNickname}
                                            disabled={!nickname.trim()}
                                            className="h-14 px-5 bg-[#E8F3FF] text-[#3182F6] hover:bg-[#D3E8FF] active:bg-[#BDE0FF] font-bold rounded-[14px] transition-colors disabled:opacity-50 whitespace-nowrap"
                                        >
                                            중복 확인
                                        </button>
                                    </div>
                                    {nicknameMessage && (
                                        <p className={`text-[12px] px-2 ${isAvailable ? 'text-[#3182F6]' : 'text-[#F04438]'}`}>{nicknameMessage}</p>
                                    )}
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="block text-[14px] font-bold text-[#191F28] px-1">이메일</label>
                                    <input
                                        type="email"
                                        placeholder="example@pickpl.com"
                                        value={signupEmail}
                                        onChange={(e) => setSignupEmail(e.target.value)}
                                        className="w-full h-14 bg-[#F2F4F6] rounded-[14px] px-5 text-[#191F28] placeholder-[#B0B8C1] focus:outline-none focus:ring-2 focus:ring-[#3182F6] transition-all"
                                        required
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="block text-[14px] font-bold text-[#191F28] px-1">비밀번호</label>
                                    <input
                                        type="password"
                                        placeholder="영문, 숫자, 특수문자 포함 8자 이상"
                                        value={signupPassword}
                                        onChange={(e) => setSignupPassword(e.target.value)}
                                        className="w-full h-14 bg-[#F2F4F6] rounded-[14px] px-5 text-[#191F28] placeholder-[#B0B8C1] focus:outline-none focus:ring-2 focus:ring-[#3182F6] transition-all"
                                        required
                                    />
                                    {signupPassword.length > 0 && !isPasswordValid(signupPassword) && (
                                        <p className="text-[12px] text-[#F04438] px-2">비밀번호는 영문, 숫자, 특수문자를 포함해 8자 이상이어야 합니다.</p>
                                    )}
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="block text-[14px] font-bold text-[#191F28] px-1">비밀번호 확인</label>
                                    <input
                                        type="password"
                                        placeholder="비밀번호 한 번 더 입력"
                                        value={passwordConfirm}
                                        onChange={(e) => setPasswordConfirm(e.target.value)}
                                        className="w-full h-14 bg-[#F2F4F6] rounded-[14px] px-5 text-[#191F28] placeholder-[#B0B8C1] focus:outline-none focus:ring-2 focus:ring-[#3182F6] transition-all"
                                        required
                                    />
                                    {passwordConfirm.length > 0 && signupPassword !== passwordConfirm && (
                                        <p className="text-[12px] text-[#F04438] px-2">비밀번호가 일치하지 않습니다.</p>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    disabled={!isNicknameChecked || !isAvailable || !isPasswordValid(signupPassword) || signupPassword !== passwordConfirm}
                                    className="w-full h-14 bg-[#3182F6] hover:bg-[#1B64DA] active:bg-[#1958C0] active:scale-[0.98] text-white font-bold rounded-[14px] mt-4 transition-all duration-200 disabled:opacity-50 disabled:active:scale-100 shadow-sm"
                                >
                                    가입하기
                                </button>
                            </form>

                            <div className="relative flex items-center justify-center mt-10 mb-6">
                                <div className="absolute w-full border-t border-[#F2F4F6]"></div>
                            </div>

                            <div className="flex flex-col items-center gap-3">
                                <span className="text-[#8B95A1] text-sm">이미 계정이 있으신가요?</span>
                                <button type="button" onClick={() => setMode('login')} className="w-full h-14 bg-white border border-[#E5E8EB] hover:bg-[#F9FAFB] active:bg-[#F2F4F6] text-[#333D4B] font-bold rounded-[14px] transition-colors">
                                    로그인 하러가기
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Premium Toast Notification with SVG */}
            {toastMessage && (
                <div className="fixed top-16 left-1/2 z-50 bg-[#191F28] text-white px-6 py-3 rounded-[24px] text-[14px] font-bold shadow-lg animate-[toastInOut_3s_ease-in-out_forwards] flex items-center gap-2.5 w-max">
                    <svg className="w-5 h-5 text-[#22C55E]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>{toastMessage}</span>
                </div>
            )}
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="text-center py-10 w-full min-h-screen bg-[#F9FAFB]">로딩 중...</div>}>
            <AuthForm />
        </Suspense>
    );
}
