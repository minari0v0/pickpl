import React from 'react';

interface PlaceDetailModalProps {
    selectedPlace: any | null;
    isDetailOpen: boolean;
    onClose: () => void;
    userVotedVibe: string | null;
    vibeStats: { quiet: number; chatty: number };
    onVibeVote: (type: string) => void;
    isSaved: boolean;
    isBookmarkPopping: boolean;
    onSaveClick: () => void;
}

export default function PlaceDetailModal({
    selectedPlace,
    isDetailOpen,
    onClose,
    userVotedVibe,
    vibeStats,
    onVibeVote,
    isSaved,
    isBookmarkPopping,
    onSaveClick
}: PlaceDetailModalProps) {
    if (!selectedPlace || !isDetailOpen) return null;

    const quietPercent = vibeStats.quiet + vibeStats.chatty === 0 ? 50 : Math.round((vibeStats.quiet / (vibeStats.quiet + vibeStats.chatty)) * 100);
    const chattyPercent = 100 - quietPercent;

    return (
        <>
            {/* 모바일 슬라이드업 모달 */}
            <div className="lg:hidden absolute inset-0 z-40 bg-white flex flex-col animate-slide-up">
                <div className="relative w-full h-[45vh] bg-[#F2F4F6] shrink-0">
                    <img src={selectedPlace.imageUrl} className="w-full h-full object-cover" alt="" />
                    <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent pt-safe z-50">
                        <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition-transform">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div className="flex-1 bg-white -mt-8 rounded-t-[32px] relative z-10 overflow-y-auto no-scrollbar pb-[100px] shadow-[0_-10px_30px_rgba(0,0,0,0.1)]">
                    <div className="px-6 pt-8 pb-6">
                        <h1 className="text-[26px] font-bold mb-1.5 tracking-tight">{selectedPlace.name}</h1>
                        <p className="text-[14px] font-medium text-[#8B95A1] mb-5 flex items-center gap-1.5 w-full overflow-hidden">
                            <svg className="w-4 h-4 text-[#B0B8C1] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="truncate flex-1">{selectedPlace.location}</span>
                            <span className="text-[#B0B8C1] shrink-0">·</span>
                            <span className="shrink-0 text-orange-500 font-bold">{selectedPlace.distance}</span>
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {selectedPlace.tags.map((tag: string) => (
                                <span key={tag} className="px-3 py-1.5 rounded-[10px] bg-[#F2F4F6] text-[#4E5968] text-[12px] font-bold tracking-tight">#{tag}</span>
                            ))}
                        </div>
                        <p className="text-[15px] text-[#4E5968] leading-relaxed mt-6">{selectedPlace.description}</p>
                    </div>
                    <div className="w-full h-2 bg-[#F2F4F6]"></div>
                    <div className="px-6 py-8">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-[19px] tracking-tight">지금 이 공간의 분위기는?</h3>
                            <div className="flex items-center gap-1.5 text-[#00A86B] bg-[#00A86B]/10 px-2.5 py-1 rounded-[6px]">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#00A86B] animate-pulse"></div>
                                <span className="text-[11px] font-bold">실시간</span>
                            </div>
                        </div>
                        <p className="text-[13px] text-[#8B95A1] mb-6">현재 있는 사람들의 투표로 만들어져요.</p>
                        <div className="w-full h-3 bg-[#E5E8EB] rounded-full overflow-hidden mb-6 flex relative">
                            <div className="h-full bg-blue-500 transition-all duration-700 ease-out" style={{ width: `${quietPercent}%` }}></div>
                            <div className="h-full bg-orange-400 transition-all duration-700 ease-out" style={{ width: `${chattyPercent}%` }}></div>
                        </div>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => onVibeVote('quiet')} 
                                className={`flex-1 py-5 px-2 rounded-[20px] border-[1.5px] transition-all flex flex-col items-center gap-2 active:scale-95 ${userVotedVibe === 'quiet' ? 'border-blue-500 bg-blue-50' : 'border-[#E5E8EB] bg-white hover:bg-[#F9FAFB]'}`}
                            >
                                <svg className={`w-7 h-7 mb-1 ${userVotedVibe === 'quiet' ? 'text-blue-500' : 'text-[#8B95A1]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                <span className={`text-[14px] font-bold ${userVotedVibe === 'quiet' ? 'text-blue-600' : 'text-[#4E5968]'}`}>조용히 집중</span>
                                <span className={`text-[12px] font-bold ${userVotedVibe === 'quiet' ? 'text-blue-400' : 'text-[#8B95A1]'}`}>{quietPercent}%</span>
                            </button>
                            <button 
                                onClick={() => onVibeVote('chatty')} 
                                className={`flex-1 py-5 px-2 rounded-[20px] border-[1.5px] transition-all flex flex-col items-center gap-2 active:scale-95 ${userVotedVibe === 'chatty' ? 'border-orange-500 bg-orange-50' : 'border-[#E5E8EB] bg-white hover:bg-[#F9FAFB]'}`}
                            >
                                <svg className={`w-7 h-7 mb-1 ${userVotedVibe === 'chatty' ? 'text-orange-500' : 'text-[#8B95A1]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                                </svg>
                                <span className={`text-[14px] font-bold ${userVotedVibe === 'chatty' ? 'text-orange-600' : 'text-[#4E5968]'}`}>대화하기 좋아요</span>
                                <span className={`text-[12px] font-bold ${userVotedVibe === 'chatty' ? 'text-orange-400' : 'text-[#8B95A1]'}`}>{chattyPercent}%</span>
                            </button>
                        </div>
                    </div>
                </div>
                <div className="absolute bottom-0 left-0 w-full bg-white border-t border-[#F2F4F6] px-5 py-4 pb-safe flex gap-3 z-50">
                    <button 
                        onClick={onSaveClick} 
                        className={`w-[56px] h-[56px] rounded-[18px] flex items-center justify-center transition-all active:scale-90 shrink-0 border ${isSaved ? 'bg-orange-50 border-orange-100 text-orange-500' : 'bg-[#F2F4F6] border-transparent text-[#8B95A1]'} ${isBookmarkPopping ? 'animate-bookmark-pop' : ''}`}
                    >
                        <svg className="w-7 h-7" fill={isSaved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isSaved ? 0 : 2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                    </button>
                    <button className="flex-1 h-[56px] rounded-[18px] bg-[#191F28] text-white font-bold text-[17px] active:scale-[0.98] transition-transform shadow-sm">
                        방문 기록 남기기
                    </button>
                </div>
            </div>

            {/* PC 분할 팝업 모달 */}
            <div className="hidden lg:flex fixed inset-0 z-50 bg-black/60 backdrop-blur-sm items-center justify-center p-8 animate-fade-in">
                <div className="absolute inset-0 cursor-pointer" onClick={onClose}></div>
                <div className="relative w-full max-w-[1100px] h-[90vh] bg-white rounded-[40px] overflow-hidden flex shadow-2xl animate-scale-up z-10">
                    <div className="w-[55%] h-full relative bg-[#F2F4F6] shrink-0">
                        <img src={selectedPlace.imageUrl} className="w-full h-full object-cover" alt="" />
                        <button onClick={onClose} className="absolute top-6 left-6 w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/40 transition-colors shadow-lg">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="w-[45%] h-full flex flex-col bg-white">
                        <div className="flex-1 overflow-y-auto p-10 no-scrollbar">
                            <h1 className="text-[32px] font-bold mb-2 tracking-tight text-[#191F28]">{selectedPlace.name}</h1>
                            <p className="text-[15px] font-medium text-[#8B95A1] mb-6 flex items-center gap-1.5 w-full overflow-hidden">
                                <svg className="w-5 h-5 text-[#B0B8C1] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="truncate flex-1">{selectedPlace.location}</span>
                                <span className="text-[#B0B8C1] shrink-0">·</span>
                                <span className="shrink-0 text-[#E65C00] font-bold">{selectedPlace.distance}</span>
                            </p>
                            <div className="flex flex-wrap gap-1.5 mb-8">
                                {selectedPlace.tags.map((tag: string) => (
                                    <span key={tag} className="px-3.5 py-2 rounded-[12px] bg-[#F2F4F6] text-[#4E5968] text-[13px] font-bold tracking-tight">#{tag}</span>
                                ))}
                            </div>
                            <p className="text-[16px] text-[#4E5968] leading-[1.7] mb-10 bg-[#F9FAFB] p-6 rounded-[24px] border border-[#F2F4F6]">
                                {selectedPlace.description}
                            </p>
                            <div className="w-full h-[1px] bg-[#F2F4F6] mb-10"></div>
                            <h3 className="font-bold text-[20px] mb-5 tracking-tight text-[#191F28]">이 공간의 특징</h3>
                            <div className="flex flex-col gap-5 mb-10">
                                {selectedPlace.features.map((feat: any, idx: number) => (
                                    <div key={idx} className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-[16px] bg-[#F9FAFB] border border-[#F2F4F6] flex items-center justify-center text-gray-500 shadow-sm">
                                            {feat.icon}
                                        </div>
                                        <div>
                                            <p className="font-bold text-[16px] text-[#333D4B]">{feat.title}</p>
                                            <p className="font-medium text-[14px] text-[#8B95A1] mt-0.5">{feat.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="bg-[#F9FAFB] p-8 rounded-[32px] border border-[#F2F4F6]">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="font-bold text-[20px] tracking-tight">지금 분위기는?</h3>
                                    <div className="flex items-center gap-1.5 text-[#00A86B] bg-[#00A86B]/10 px-3 py-1.5 rounded-[8px]">
                                        <div className="w-2 h-2 rounded-full bg-[#00A86B] animate-pulse"></div>
                                        <span className="text-[12px] font-bold">실시간</span>
                                    </div>
                                </div>
                                <p className="text-[14px] text-[#8B95A1] mb-8">방문 중인 사람들의 투표로 만들어져요.</p>
                                <div className="w-full h-4 bg-[#E5E8EB] rounded-full overflow-hidden mb-8 flex relative">
                                    <div className="h-full bg-blue-500 transition-all duration-700 ease-out" style={{ width: `${quietPercent}%` }}></div>
                                    <div className="h-full bg-orange-400 transition-all duration-700 ease-out" style={{ width: `${chattyPercent}%` }}></div>
                                </div>
                                <div className="flex gap-4">
                                    <button 
                                        onClick={() => onVibeVote('quiet')} 
                                        className={`flex-1 py-6 px-4 rounded-[24px] border-2 transition-all flex flex-col items-center gap-3 ${userVotedVibe === 'quiet' ? 'border-blue-500 bg-blue-50' : 'border-[#E5E8EB] bg-white hover:border-blue-200'}`}
                                    >
                                        <svg className={`w-8 h-8 ${userVotedVibe === 'quiet' ? 'text-blue-500' : 'text-[#8B95A1]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                        </svg>
                                        <span className={`text-[15px] font-bold ${userVotedVibe === 'quiet' ? 'text-blue-600' : 'text-[#4E5968]'}`}>조용히 집중</span>
                                        <span className={`text-[14px] font-bold ${userVotedVibe === 'quiet' ? 'text-blue-400' : 'text-[#8B95A1]'}`}>{quietPercent}%</span>
                                    </button>
                                    <button 
                                        onClick={() => onVibeVote('chatty')} 
                                        className={`flex-1 py-6 px-4 rounded-[24px] border-2 transition-all flex flex-col items-center gap-3 ${userVotedVibe === 'chatty' ? 'border-orange-500 bg-orange-50' : 'border-[#E5E8EB] bg-white hover:border-orange-200'}`}
                                    >
                                        <svg className={`w-8 h-8 ${userVotedVibe === 'chatty' ? 'text-orange-500' : 'text-[#8B95A1]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                                        </svg>
                                        <span className={`text-[15px] font-bold ${userVotedVibe === 'chatty' ? 'text-orange-600' : 'text-[#4E5968]'}`}>대화하기 좋아요</span>
                                        <span className={`text-[14px] font-bold ${userVotedVibe === 'chatty' ? 'text-orange-400' : 'text-[#8B95A1]'}`}>{chattyPercent}%</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="sticky bottom-0 bg-white/95 backdrop-blur-xl border-t border-[#F2F4F6] p-6 flex gap-4 z-50">
                            <button 
                                onClick={onSaveClick} 
                                className={`w-[64px] h-[64px] rounded-[20px] flex items-center justify-center transition-all hover:scale-95 shrink-0 border ${isSaved ? 'bg-orange-50 border-orange-100 text-orange-500' : 'bg-[#F9FAFB] border-[#E5E8EB] text-[#8B95A1] hover:bg-[#F2F4F6]'} ${isBookmarkPopping ? 'animate-bookmark-pop' : ''}`}
                            >
                                <svg className="w-8 h-8" fill={isSaved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isSaved ? 0 : 2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                </svg>
                            </button>
                            <button className="flex-1 h-[64px] rounded-[20px] bg-[#191F28] hover:bg-black text-white font-bold text-[18px] transition-colors shadow-sm">
                                방문 기록 남기기
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
