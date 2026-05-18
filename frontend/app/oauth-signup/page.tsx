"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function OAuthSignupForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    
    const [nickname, setNickname] = useState("");
    const [accessToken, setAccessToken] = useState("");
    const [refreshToken, setRefreshToken] = useState("");
    const [isNicknameChecked, setIsNicknameChecked] = useState(false);
    const [nicknameMessage, setNicknameMessage] = useState("");
    const [isAvailable, setIsAvailable] = useState(false);

    useEffect(() => {
        setAccessToken(searchParams.get("accessToken") || "");
        setRefreshToken(searchParams.get("refreshToken") || "");
    }, [searchParams]);

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

    const handleComplete = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!accessToken || !refreshToken) return;
        if (!isNicknameChecked || !isAvailable) {
            alert("닉네임 중복 확인을 해주세요.");
            return;
        }

        try {
            const res = await fetch("http://localhost:8080/api/v1/auth/oauth-signup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`
                },
                body: JSON.stringify({ nickname })
            });

            if (res.ok) {
                const data = await res.json();
                localStorage.setItem("accessToken", data.accessToken);
                localStorage.setItem("refreshToken", data.refreshToken);
                alert(`환영합니다, ${data.nickname}님! 회원가입이 완료되었습니다.`);
                router.push("/");
            } else {
                const errorMsg = await res.text();
                alert(errorMsg || "회원가입에 실패했습니다.");
            }
        } catch (error) {
            alert("서버 연결에 실패했습니다.");
        }
    };

    return (
        <form onSubmit={handleComplete} className="flex flex-col gap-6 w-full animate-[fadeIn_0.5s_ease-in-out]">
            <div className="flex flex-col items-center mb-4">
                <div className="w-24 h-24 bg-[#F2F4F6] rounded-full flex items-center justify-center mb-4 overflow-hidden border-4 border-white shadow-md">
                    <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${nickname || 'PickPl'}`} alt="profile preview" className="w-full h-full object-cover" />
                </div>
                <p className="text-[13px] text-[#8B95A1] text-center px-4">
                    프로필 이미지는 가입 후 마이페이지에서 변경할 수 있어요!
                </p>
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-[14px] font-bold text-[#191F28] px-1">닉네임</label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="2자 이상 입력해주세요"
                        value={nickname}
                        onChange={(e) => {
                            setNickname(e.target.value);
                            setIsNicknameChecked(false);
                            setNicknameMessage("");
                        }}
                        className="flex-1 h-14 bg-[#F2F4F6] rounded-[14px] px-5 text-[#191F28] placeholder-[#B0B8C1] focus:outline-none focus:ring-2 focus:ring-[#3182F6] transition-all"
                        required
                        minLength={2}
                        maxLength={10}
                    />
                    <button
                        type="button"
                        onClick={handleCheckNickname}
                        disabled={!nickname.trim()}
                        className="h-14 px-6 bg-[#E8F3FF] text-[#3182F6] hover:bg-[#D3E8FF] active:bg-[#BDE0FF] font-bold rounded-[14px] transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                        중복 확인
                    </button>
                </div>
                {nicknameMessage && (
                    <p className={`text-[13px] px-2 ${isAvailable ? 'text-[#3182F6]' : 'text-[#F04438]'}`}>
                        {nicknameMessage}
                    </p>
                )}
            </div>

            <button
                type="submit"
                disabled={!isNicknameChecked || !isAvailable}
                className="w-full h-14 bg-[#3182F6] hover:bg-[#1B64DA] active:bg-[#1958C0] active:scale-[0.98] text-white font-bold rounded-[14px] mt-4 transition-all duration-200 disabled:opacity-50 disabled:active:scale-100 shadow-sm"
            >
                PickPl 시작하기
            </button>
        </form>
    );
}

export default function OAuthSignupPage() {
    return (
        <div className="w-full min-h-screen flex items-center justify-center bg-[#F9FAFB]">
            <div className="w-full max-w-[480px] bg-white sm:rounded-[24px] sm:shadow-sm min-h-screen sm:min-h-0 px-6 py-12 flex flex-col justify-center animate-[fadeIn_0.3s_ease-in-out]">
                
                <div className="mb-10 text-center">
                    <h1 className="text-3xl font-bold text-[#191F28] mb-3">환영합니다! 🎉</h1>
                    <p className="text-[#8B95A1] text-[15px]">PickPl에서 활동할 멋진 닉네임을 설정해주세요.</p>
                </div>

                <Suspense fallback={<div className="text-center text-[#8B95A1] py-10">로딩 중...</div>}>
                    <OAuthSignupForm />
                </Suspense>

            </div>
        </div>
    );
}
