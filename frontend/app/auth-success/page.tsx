"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "../../store/authStore";

function AuthSuccessHandler() {
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        const accessToken = searchParams.get("accessToken");
        const refreshToken = searchParams.get("refreshToken");
        const nickname = searchParams.get("nickname");

        if (accessToken && refreshToken && nickname) {
            localStorage.setItem("accessToken", accessToken);
            localStorage.setItem("refreshToken", refreshToken);
            localStorage.setItem("nickname", nickname);

            useAuthStore.getState().login(nickname);

            // GUEST 사용자인 경우 oauth-signup 페이지로 리다이렉트
            const isGuest = isGuestToken(accessToken);
            if (isGuest) {
                router.replace("/oauth-signup");
            } else {
                sessionStorage.setItem("showLoginToast", "true");
                router.replace("/");
            }
        } else {
            // 실패 시 로그인 페이지로
            router.replace("/login?error=true");
        }
    }, [searchParams, router]);

    return (
        <div className="text-[#8B95A1] text-sm">로그인 처리 중입니다...</div>
    );
}

export default function AuthSuccessPage() {
    return (
        <div className="w-full min-h-screen flex items-center justify-center bg-[#F9FAFB]">
            <Suspense fallback={<div className="text-[#8B95A1] text-sm">로딩 중...</div>}>
                <AuthSuccessHandler />
            </Suspense>
        </div>
    );
}
