import React, { useEffect, useRef } from 'react';

interface InfiniteScrollTriggerProps {
    onLoadMore: () => void;
    hasMore: boolean;
    isLoadingMore: boolean;
    isValidating: boolean;
}

export default function InfiniteScrollTrigger({
    onLoadMore,
    hasMore,
    isLoadingMore,
    isValidating
}: InfiniteScrollTriggerProps) {
    const triggerRef = useRef<HTMLDivElement>(null);
    
    // 리액트 HMR 캐시 꼬임이나 의존성 크기 변경 오류를 원천 차단하기 위해
    // 수시로 변하는 값들을 useRef를 통해 동기화합니다.
    const propsRef = useRef({ onLoadMore, hasMore, isLoadingMore, isValidating });
    
    // 매 렌더링마다 최신 값으로 ref를 동기화
    propsRef.current = { onLoadMore, hasMore, isLoadingMore, isValidating };

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const { onLoadMore: loadFn, hasMore: active, isLoadingMore: loading, isValidating: validating } = propsRef.current;
                
                // 뷰포트에 감지되고, 더 가져올 데이터가 있으며, 현재 통신 중(loading, validating)이 아닐 때만 실행
                if (entries[0].isIntersecting && active && !loading && !validating) {
                    loadFn();
                }
            },
            { 
                threshold: 0.1,
                rootMargin: '100px' // 감지 감도를 높여 부드러운 스크롤 제공
            }
        );

        const currentTrigger = triggerRef.current;
        if (currentTrigger) {
            observer.observe(currentTrigger);
        }

        return () => {
            if (currentTrigger) {
                observer.unobserve(currentTrigger);
            }
        };
    }, []); // 의존성 배열을 완전히 빈 배열로 고정하여 훅 규칙 위반을 100% 방지하고, 불필요한 observer 재등록 오버헤드를 막습니다.

    if (!hasMore && !isLoadingMore) return null;

    return (
        <div ref={triggerRef} className="flex flex-col items-center justify-center py-10 pb-12 gap-3.5 w-full shrink-0 select-none">
            {isLoadingMore || isValidating ? (
                <>
                    <div className="w-8 h-8 border-[3.5px] border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
                    <p className="text-[12px] font-bold text-[#8B95A1] tracking-tight">공간을 불러오는 중이에요</p>
                </>
            ) : (
                <div className="h-1 w-full"></div>
            )}
        </div>
    );
}
