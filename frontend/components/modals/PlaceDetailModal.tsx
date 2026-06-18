import React from 'react';
import { getCategoryIcon } from '../ui/Helpers';

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
    const [currentImgIdx, setCurrentImgIdx] = React.useState(0);

    React.useEffect(() => {
        setCurrentImgIdx(0);
    }, [selectedPlace?.id]);

    if (!selectedPlace || !isDetailOpen) return null;

    const imageUrls = selectedPlace.imageUrls || [selectedPlace.imageUrl];

    const handlePrevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentImgIdx(prev => (prev === 0 ? imageUrls.length - 1 : prev - 1));
    };

    const handleNextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentImgIdx(prev => (prev === imageUrls.length - 1 ? 0 : prev + 1));
    };

    const quietPercent = vibeStats.quiet + vibeStats.chatty === 0 ? 50 : Math.round((vibeStats.quiet / (vibeStats.quiet + vibeStats.chatty)) * 100);
    const chattyPercent = 100 - quietPercent;

    const getMapLink = () => {
        const extId = selectedPlace?.externalId;
        const name = selectedPlace?.name;
        const location = selectedPlace?.location;

        if (extId && extId.startsWith('naver_place_')) {
            const placeId = extId.replace('naver_place_', '');
            return {
                type: 'naver',
                url: `https://pcmap.place.naver.com/place/${placeId}`,
                label: '네이버 지도'
            };
        } else if (extId && extId.startsWith('kakao_place_')) {
            const placeId = extId.replace('kakao_place_', '');
            return {
                type: 'kakao',
                url: `https://place.map.kakao.com/${placeId}`,
                label: '카카오 맵'
            };
        } else if (name) {
            const query = encodeURIComponent(`${name} ${location || ''}`.trim());
            return {
                type: 'naver',
                url: `https://map.naver.com/p/search/${query}`,
                label: '네이버 지도'
            };
        }
        return null;
    };

    const mapLink = getMapLink();

    const renderMapButton = (viewType: 'mobile' | 'pc') => {
        if (!mapLink) return null;
        
        if (mapLink.type === 'naver') {
            const gradId = `naverMapGrad_${viewType}`;
            return (
                <a 
                    href={mapLink.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex flex-col items-center gap-1 group shrink-0"
                >
                    <div className="w-[60px] h-[60px] rounded-[20px] bg-white border border-[#E5E8EB] hover:bg-[#F9FAFB] transition-colors flex items-center justify-center shadow-md">
                        <svg className="w-9 h-9" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#0090ec" />
                                    <stop offset="100%" stopColor="#00c73c" />
                                </linearGradient>
                            </defs>
                            <path d="M50 8 C33.43 8 20 21.43 20 38 C20 54.34 50 82 50 82 C50 82 80 54.34 80 38 C80 21.43 66.57 8 50 8 Z" fill={`url(#${gradId})`} />
                            <text x="50" y="44" fill="white" fontSize="24" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" dominantBaseline="middle">N</text>
                        </svg>
                    </div>
                    <span className="text-[11px] font-bold text-[#8B95A1] group-hover:text-[#4E5968] transition-colors tracking-tight">지도</span>
                </a>
            );
        } else if (mapLink.type === 'kakao') {
            return (
                <a 
                    href={mapLink.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex flex-col items-center gap-1 group shrink-0"
                >
                    <div className="w-[60px] h-[60px] rounded-[20px] bg-[#FFF9E6] hover:bg-[#FFE0B2] transition-colors flex items-center justify-center shadow-md border border-[#FEE500]/30">
                        <svg className="w-9 h-9" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M50 8 C33.43 8 20 21.43 20 38 C20 54.34 50 82 50 82 C50 82 80 54.34 80 38 C80 21.43 66.57 8 50 8 Z" fill="#FEE500" />
                            <text x="50" y="44" fill="#3C1E1E" fontSize="24" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" dominantBaseline="middle">K</text>
                        </svg>
                    </div>
                    <span className="text-[11px] font-bold text-[#8B95A1] group-hover:text-[#4E5968] transition-colors tracking-tight">지도</span>
                </a>
            );
        }
        return null;
    };

    return (
        <>
            {/* 모바일 슬라이드업 모달 */}
            <div className="lg:hidden absolute inset-0 z-40 bg-white flex flex-col animate-slide-up">
                <div className="relative w-full h-[45vh] bg-[#12161F] shrink-0 group overflow-hidden flex items-center justify-center">
                    <img 
                        src={imageUrls[currentImgIdx]} 
                        className="absolute inset-0 w-full h-full object-cover blur-[24px] opacity-45 scale-110 pointer-events-none select-none" 
                        alt="" 
                        onError={(e) => {
                            e.currentTarget.src = "/default_place.png";
                        }}
                    />
                    <div className="w-full h-full relative z-10 flex items-center justify-center p-6 pb-10">
                        <img 
                            src={imageUrls[currentImgIdx]} 
                            className="max-w-full max-h-full object-contain rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.25)] border border-white/10 transition-all duration-300 ease-in-out" 
                            alt="" 
                            onError={(e) => {
                                e.currentTarget.src = "/default_place.png";
                            }}
                        />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30 pointer-events-none z-15" />
                    
                    <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center pt-safe z-50">
                        <button 
                            onClick={onClose} 
                            className="w-10 h-10 rounded-full bg-black/25 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition-transform shadow-md"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                    </div>

                    {imageUrls.length > 1 && (
                        <>
                            <button 
                                onClick={handlePrevImage} 
                                className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/35 backdrop-blur-md text-white active:scale-90 flex items-center justify-center shadow-md z-40"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <button 
                                onClick={handleNextImage} 
                                className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/35 backdrop-blur-md text-white active:scale-90 flex items-center justify-center shadow-md z-40"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </>
                    )}

                    {imageUrls.length > 1 && (
                        <div className="absolute bottom-12 right-6 px-3 py-1 rounded-full bg-black/55 backdrop-blur-sm text-white text-[11px] font-bold shadow-sm z-40">
                            {currentImgIdx + 1} / {imageUrls.length}
                        </div>
                    )}
                </div>
                <div className="flex-1 bg-white -mt-8 rounded-t-[32px] relative z-10 overflow-y-auto no-scrollbar pb-[100px] shadow-[0_-12px_36px_rgba(0,0,0,0.12)]">
                    <div className="w-full flex justify-center pt-3 pb-1">
                        <div className="w-12 h-1 bg-[#E5E8EB] rounded-full" />
                    </div>
                    <div className="px-6 pt-8 pb-6">
                        <div className="flex justify-between items-start gap-4 mb-2">
                            <h1 className="text-[26px] font-bold tracking-tight flex-1 leading-tight">{selectedPlace.name}</h1>
                            {renderMapButton('mobile')}
                        </div>
                        <p className="text-[14px] font-medium text-[#8B95A1] mb-5 flex items-center gap-1.5 w-full overflow-hidden">
                            <svg className="w-4 h-4 text-[#B0B8C1] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="truncate flex-1">{selectedPlace.location}</span>
                            {selectedPlace.distance && (
                                <>
                                    <span className="text-[#B0B8C1] shrink-0">·</span>
                                    <span className="shrink-0 text-orange-500 font-bold">{selectedPlace.distance}</span>
                                </>
                            )}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {selectedPlace.tagInfos && selectedPlace.tagInfos.length > 0 ? (
                                selectedPlace.tagInfos.map((tag: any) => {
                                    const style = tag.type === 'FACILITY' 
                                        ? 'bg-[#F2F4F6] text-[#4E5968] border-transparent' 
                                        : tag.type === 'WEATHER'
                                        ? 'bg-blue-50 text-blue-600 border-blue-100'
                                        : 'bg-orange-50 text-orange-600 border-orange-100';
                                    return (
                                        <span key={tag.name} className={`px-3 py-1.5 rounded-[10px] text-[12px] font-bold tracking-tight border ${style}`}>
                                            #{tag.name}
                                        </span>
                                    );
                                })
                            ) : (
                                selectedPlace.tags.map((tag: string) => (
                                    <span key={tag} className="px-3 py-1.5 rounded-[10px] bg-[#F2F4F6] text-[#4E5968] text-[12px] font-bold tracking-tight">#{tag}</span>
                                ))
                            )}
                        </div>
                        {selectedPlace.editorsComment && (
                            <div className="mb-6 mt-2 p-5 rounded-[20px] bg-orange-50/50 border border-orange-100/40 flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-black shrink-0 shadow-sm text-[11.5px]">
                                    Pick
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-bold text-orange-600 tracking-tight uppercase">에디터의 한마디</p>
                                    <p className="text-[13.5px] font-bold text-[#333D4B] mt-0.5 leading-relaxed">
                                        "{selectedPlace.editorsComment}"
                                    </p>
                                </div>
                            </div>
                        )}
                        <p className="text-[15px] text-[#4E5968] leading-relaxed mt-4">{selectedPlace.description}</p>
                        {selectedPlace.category && (() => {
                            const catInfo = getCategoryIcon(selectedPlace.category, selectedPlace.name);
                            return (
                                <div className="mt-8 border-t border-[#F2F4F6] pt-6">
                                    <h3 className="font-bold text-[19px] mb-4 tracking-tight text-[#191F28]">이 공간의 특징</h3>
                                    <div className="flex items-center gap-4">
                                        <div className={`w-14 h-14 rounded-[16px] ${catInfo.bg || 'bg-[#F2F4F6]'} border border-[#E5E8EB] flex items-center justify-center shadow-sm`}>
                                            {React.cloneElement(catInfo.icon as React.ReactElement<any>, { className: `w-6 h-6 ${catInfo.text}` })}
                                        </div>
                                        <div>
                                            <p className="font-bold text-[15.5px] text-[#4E5968]">{selectedPlace.category}</p>
                                            {selectedPlace.subCategory && (
                                                <p className="font-medium text-[13.5px] text-[#8B95A1] mt-0.5">{selectedPlace.subCategory}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
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
                    <div className="w-[55%] h-full relative bg-[#12161F] shrink-0 group overflow-hidden flex items-center justify-center">
                        <img 
                            src={imageUrls[currentImgIdx]} 
                            className="absolute inset-0 w-full h-full object-cover blur-[32px] opacity-40 scale-110 pointer-events-none select-none" 
                            alt="" 
                            onError={(e) => {
                                e.currentTarget.src = "/default_place.png";
                            }}
                        />
                        <div className="w-full h-full relative z-10 flex items-center justify-center p-8">
                            <img 
                                src={imageUrls[currentImgIdx]} 
                                className="max-w-full max-h-full object-contain rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.3)] border border-white/10 transition-all duration-500 ease-in-out" 
                                alt={`${selectedPlace.name} - ${currentImgIdx + 1}`} 
                                onError={(e) => {
                                    e.currentTarget.src = "/default_place.png";
                                }}
                            />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30 pointer-events-none z-15" />
                        <button 
                            onClick={onClose} 
                            className="absolute top-6 left-6 w-12 h-12 rounded-full bg-black/25 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/45 hover:scale-105 active:scale-95 transition-all shadow-lg z-20"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        {imageUrls.length > 1 && (
                            <>
                                <button 
                                    onClick={handlePrevImage} 
                                    className="absolute left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/35 backdrop-blur-md text-white hover:bg-black/55 hover:scale-105 active:scale-95 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center shadow-lg z-20"
                                >
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <button 
                                    onClick={handleNextImage} 
                                    className="absolute right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/35 backdrop-blur-md text-white hover:bg-black/55 hover:scale-105 active:scale-95 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center shadow-lg z-20"
                                >
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </>
                        )}
                        {imageUrls.length > 1 && (
                            <div className="absolute bottom-6 right-6 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-sm text-white text-[12px] font-bold tracking-wider shadow-sm z-25">
                                {currentImgIdx + 1} / {imageUrls.length}
                            </div>
                        )}
                    </div>
                    <div className="w-[45%] h-full flex flex-col bg-white">
                        <div className="flex-1 overflow-y-auto p-10 no-scrollbar">
                            <div className="flex justify-between items-start gap-4 mb-2">
                                <h1 className="text-[32px] font-bold tracking-tight text-[#191F28] flex-1 leading-tight">{selectedPlace.name}</h1>
                                {renderMapButton('pc')}
                            </div>
                            <p className="text-[15px] font-medium text-[#8B95A1] mb-5 flex items-center gap-1.5 w-full overflow-hidden">
                                <svg className="w-5 h-5 text-[#B0B8C1] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="truncate flex-1">{selectedPlace.location}</span>
                                {selectedPlace.distance && (
                                    <>
                                        <span className="text-[#B0B8C1] shrink-0">·</span>
                                        <span className="shrink-0 text-[#E65C00] font-bold">{selectedPlace.distance}</span>
                                    </>
                                )}
                            </p>
                            <div className="flex flex-wrap gap-1.5 mb-8">
                                {selectedPlace.tagInfos && selectedPlace.tagInfos.length > 0 ? (
                                    selectedPlace.tagInfos.map((tag: any) => {
                                        const style = tag.type === 'FACILITY' 
                                            ? 'bg-[#F2F4F6] text-[#4E5968] border-transparent' 
                                            : tag.type === 'WEATHER'
                                            ? 'bg-blue-50 text-blue-600 border-blue-100'
                                            : 'bg-orange-50 text-orange-600 border-orange-100';
                                        return (
                                            <span key={tag.name} className={`px-3.5 py-2 rounded-[12px] text-[13px] font-bold tracking-tight border ${style}`}>
                                                #{tag.name}
                                            </span>
                                        );
                                    })
                                ) : (
                                    selectedPlace.tags.map((tag: string) => (
                                        <span key={tag} className="px-3.5 py-2 rounded-[12px] bg-[#F2F4F6] text-[#4E5968] text-[13px] font-bold tracking-tight">#{tag}</span>
                                    ))
                                )}
                            </div>
                            {selectedPlace.editorsComment && (
                                <div className="mb-8 p-5.5 rounded-[24px] bg-orange-50/50 border border-orange-100/50 flex gap-4">
                                    <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold shrink-0 mt-0.5 shadow-sm text-[13px]">
                                        Pick
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[12px] font-bold text-orange-600 tracking-tight uppercase">에디터의 한마디</p>
                                        <p className="text-[14.5px] font-bold text-[#333D4B] mt-1 leading-relaxed">
                                            "{selectedPlace.editorsComment}"
                                        </p>
                                    </div>
                                </div>
                            )}
                            <p className="text-[16px] text-[#4E5968] leading-[1.7] mb-10 bg-[#F9FAFB] p-6 rounded-[24px] border border-[#F2F4F6]">
                                {selectedPlace.description}
                            </p>
                            <div className="w-full h-[1px] bg-[#F2F4F6] mb-10"></div>
                            {selectedPlace.category && (() => {
                                const catInfo = getCategoryIcon(selectedPlace.category, selectedPlace.name);
                                return (
                                    <>
                                        <h3 className="font-bold text-[20px] mb-5 tracking-tight text-[#191F28]">이 공간의 특징</h3>
                                        <div className="flex items-center gap-4 mb-10">
                                            <div className={`w-16 h-16 rounded-[18px] ${catInfo.bg || 'bg-[#F2F4F6]'} border border-[#E5E8EB] flex items-center justify-center shadow-sm`}>
                                                {React.cloneElement(catInfo.icon as React.ReactElement<any>, { className: `w-7 h-7 ${catInfo.text}` })}
                                            </div>
                                            <div>
                                                <p className="font-bold text-[16px] text-[#4E5968]">{selectedPlace.category}</p>
                                                {selectedPlace.subCategory && (
                                                    <p className="font-medium text-[14px] text-[#8B95A1] mt-0.5">{selectedPlace.subCategory}</p>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                );
                            })()}
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
