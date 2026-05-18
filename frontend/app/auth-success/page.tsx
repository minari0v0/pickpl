"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function AuthSuccessHandler() {
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        const accessToken = searchParams.get("accessToken");
        const refreshToken = searchParams.get("refreshToken");

        if (accessToken && refreshToken) {
            localStorage.setItem("accessToken", accessToken);
            localStorage.setItem("refreshToken", refreshToken);
            // 메인 페이지로 이동
            router.push("/");
        } else {
            alert("로그인 처리에 실패했습니다.");
            router.push("/login");
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
