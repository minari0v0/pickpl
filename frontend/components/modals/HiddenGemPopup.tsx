import React from 'react';

interface HiddenGemPopupProps {
    isOpen: boolean;
    hiddenGemPlace: any | null;
    onClose: () => void;
    onOpenSecret: () => void;
}

export default function HiddenGemPopup({
    isOpen,
    hiddenGemPlace,
    onClose,
    onOpenSecret
}: HiddenGemPopupProps) {
    if (!isOpen || !hiddenGemPlace) return null;

    return (
        <div className="absolute inset-0 z-[100] bg-[#0F1423] flex flex-col items-center justify-center animate-fade-in text-white px-6">
            <div className="flex-1 flex flex-col items-center justify-center w-full mt-10">
                <div className="relative w-64 h-64 flex items-center justify-center mb-8">
                    <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-[50px] animate-[glow-pulse_2s_ease-in-out_infinite]"></div>
                    {/* 3D 보석 / 선물 큐브 */}
                    <svg viewBox="0 0 100 100" className="w-40 h-40 z-10 drop-shadow-[0_0_40px_rgba(96,165,250,0.8)] animate-[gem-float_3s_ease-in-out_infinite]">
                        <polygon points="50,10 90,40 70,90 30,90 10,40" fill="url(#gemGrad)" stroke="#E0F2FE" strokeWidth="1.5" strokeLinejoin="round" />
                        <polygon points="50,10 50,45 10,40" fill="url(#gemLeft)" opacity="0.9" />
                        <polygon points="50,10 90,40 50,45" fill="url(#gemRight)" opacity="0.9" />
                        <polygon points="10,40 50,45 30,90" fill="url(#gemBottomLeft)" opacity="0.95" />
                        <polygon points="90,40 70,90 50,45" fill="url(#gemBottomRight)" opacity="0.95" />
                        <defs>
                            <linearGradient id="gemGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#93C5FD" /><stop offset="100%" stopColor="#3B82F6" /></linearGradient>
                            <linearGradient id="gemLeft" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#EFF6FF" /><stop offset="100%" stopColor="#60A5FA" /></linearGradient>
                            <linearGradient id="gemRight" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#DBEAFE" /><stop offset="100%" stopColor="#2563EB" /></linearGradient>
                            <linearGradient id="gemBottomLeft" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#3B82F6" /><stop offset="100%" stopColor="#1E40AF" /></linearGradient>
                            <linearGradient id="gemBottomRight" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#2563EB" /><stop offset="100%" stopColor="#1E3A8A" /></linearGradient>
                        </defs>
                    </svg>
                </div>
                <h2 className="text-[28px] lg:text-[34px] font-bold text-center leading-[1.3] tracking-tight mb-4">
                    <span className="text-[#60A5FA]">미나리</span>님이 발견한<br />
                    비밀 공간이 도착했어요
                </h2>
            </div>
            <div className="w-full lg:max-w-[400px] pb-10 pt-4">
                <button 
                    onClick={onOpenSecret}
                    className="w-full bg-[#3182F6] hover:bg-[#2272EB] text-white font-bold text-[18px] py-5 rounded-[16px] transition-all active:scale-[0.98] shadow-[0_8px_20px_rgba(49,130,246,0.3)]"
                >
                    비밀 공간 열어보기
                </button>
            </div>
        </div>
    );
}
