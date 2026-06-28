import React from 'react';
import { getCategoryIcon } from '../ui/Helpers';
import useSWR from 'swr';
import axiosInstance from '../../api/axios';
import VisitRecordFormModal from './VisitRecordFormModal';

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
    isLoggedIn: boolean;
    showToast: (msg: string, type: 'success' | 'warning' | 'error') => void;
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
    onSaveClick,
    isLoggedIn,
    showToast
}: PlaceDetailModalProps) {
    const [currentImgIdx, setCurrentImgIdx] = React.useState(0);
    const [isVisitFormOpen, setIsVisitFormOpen] = React.useState(false);
    const [editingVisit, setEditingVisit] = React.useState<any | null>(null);
    const [isSubmitLoading, setIsSubmitLoading] = React.useState(false);
    const [showVisitsSidebar, setShowVisitsSidebar] = React.useState(true);

    // SWR을 이용해 방문 기록 목록 실시간 페치
    const fetcher = (url: string) => axiosInstance.get(url).then(res => res.data);
    const { data: visits, mutate: mutateVisits } = useSWR(
        selectedPlace && isDetailOpen ? `/places/${selectedPlace.id}/visits` : null,
        fetcher
    );

    // 모달이 처음 열리거나 장소가 바뀔 때 후기가 있다면 기본 활성화
    React.useEffect(() => {
        if (isDetailOpen && visits && visits.length > 0) {
            setShowVisitsSidebar(true);
        }
    }, [isDetailOpen, selectedPlace?.id, visits?.length]);

    const handleVisitSubmit = async (comment: string, visitedDate: string) => {
        setIsSubmitLoading(true);
        try {
            if (editingVisit) {
                // 수정 API
                await axiosInstance.put(`/visits/${editingVisit.id}`, {
                    placeId: selectedPlace.id,
                    comment,
                    visitedDate
                });
                showToast("방문 기록이 성공적으로 수정되었습니다.", "success");
            } else {
                // 등록 API
                await axiosInstance.post('/visits', {
                    placeId: selectedPlace.id,
                    comment,
                    visitedDate
                });
                showToast("방문 기록이 등록되었습니다. 소중한 발자국 감사합니다!", "success");
            }
            mutateVisits(); // 후기 피드 갱신
            setIsVisitFormOpen(false);
            setEditingVisit(null);
        } catch (error: any) {
            console.error("방문 기록 저장 실패:", error);
            const status = error.response?.status;
            if (status === 401 || status === 403) {
                showToast("로그인이 유효하지 않거나 만료되었습니다. 다시 로그인해 주세요.", "error");
            } else {
                const errorMsg = error.response?.data?.message || "방문 기록을 저장하지 못했습니다.";
                showToast(errorMsg, "error");
            }
        } finally {
            setIsSubmitLoading(false);
        }
    };

    const handleVisitDelete = async (visitId: number) => {
        if (!confirm("정말 이 방문 기록을 삭제하시겠습니까?")) return;
        try {
            await axiosInstance.delete(`/visits/${visitId}`);
            showToast("방문 기록이 삭제되었습니다.", "success");
            mutateVisits(); // 후기 피드 갱신
        } catch (error: any) {
            console.error("방문 기록 삭제 실패:", error);
            showToast("방문 기록을 삭제하지 못했습니다. 다시 시도해 주세요.", "error");
        }
    };

    const handleEditClick = (visit: any) => {
        setEditingVisit(visit);
        setIsVisitFormOpen(true);
    };

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
            <div className="sm:hidden absolute inset-0 z-40 bg-white flex flex-col animate-slide-up">
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
                        {(() => {
                            const desc = selectedPlace.description || '';
                            const hasPipe = desc.includes('|');
                            if (hasPipe) {
                                const parts = desc.split('|');
                                const headline = parts[0].trim();
                                const summary = parts[1].trim();
                                return (
                                    <div className="mt-4 flex flex-col gap-2">
                                        <h4 className="text-[16px] font-extrabold text-[#E65C00] tracking-tight leading-snug">
                                            {headline}
                                        </h4>
                                        <p className="text-[14.5px] text-[#4E5968] leading-relaxed font-semibold">
                                            {summary}
                                        </p>
                                    </div>
                                );
                            }
                            return <p className="text-[15px] text-[#4E5968] leading-relaxed mt-4">{selectedPlace.description}</p>;
                        })()}
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

                    {/* 다녀간 픽플러들의 기록 (방문 후기 피드 - 모바일 버전) */}
                    <div className="px-6 pb-20">
                        <div className="bg-[#F8FAFC] p-6 rounded-[28px] border border-[#F1F5F9]">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-extrabold text-[17px] tracking-tight text-[#1E293B] flex items-center gap-1.5">
                                    다녀간 픽플러들의 기록
                                    {visits && visits.length > 0 && (
                                        <span className="text-[#FF802B] text-[14px] font-extrabold">({visits.length})</span>
                                    )}
                                </h3>
                            </div>

                            {visits && visits.length > 0 ? (
                                <div className="flex flex-col gap-3.5 max-h-[350px] overflow-y-auto pr-1 no-scrollbar">
                                    {visits.map((visit: any) => (
                                        <div key={visit.id} className="bg-white p-4.5 rounded-[20px] border border-[#F1F5F9] flex flex-col gap-2 shadow-[0_2px_6px_rgba(241,245,249,0.4)]">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <img 
                                                        src={visit.profileImageUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${visit.nickname || 'PickPl'}`}
                                                        alt="profile" 
                                                        className="w-7 h-7 rounded-full object-cover bg-[#F2F4F6]"
                                                    />
                                                    <div>
                                                        <p className="font-bold text-[12px] text-[#333D4B]">{visit.nickname}</p>
                                                        <p className="text-[10px] font-semibold text-[#8B95A1]">{visit.visitedDate} 방문</p>
                                                    </div>
                                                </div>
                                                
                                                {visit.isMyRecord && (
                                                    <div className="flex gap-1.5 text-[11px] font-bold text-[#8B95A1]">
                                                        <button 
                                                            onClick={() => handleEditClick(visit)}
                                                            className="hover:text-[#333D4B] cursor-pointer"
                                                        >
                                                            수정
                                                        </button>
                                                        <span className="text-[#E5E8EB]">·</span>
                                                        <button 
                                                            onClick={() => handleVisitDelete(visit.id)}
                                                            className="hover:text-red-500 cursor-pointer"
                                                        >
                                                            삭제
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-[13px] text-[#4E5968] font-medium leading-relaxed whitespace-pre-wrap">
                                                {visit.comment}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-8 text-center flex flex-col items-center gap-1.5">
                                    <svg className="w-8 h-8 text-[#CBD5E1]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    <p className="text-[12px] font-bold text-[#8B95A1]">아직 방문 기록이 없어요.</p>
                                    <p className="text-[10px] font-semibold text-[#B0B8C1]">첫 번째로 이 장소에 발자국을 남겨보세요!</p>
                                </div>
                            )}
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
                    <button 
                        onClick={() => {
                            if (!isLoggedIn) {
                                showToast("로그인 후 방문 기록을 남길 수 있습니다.", "error");
                            } else {
                                setIsVisitFormOpen(true);
                            }
                        }}
                        className="flex-1 h-[56px] rounded-[18px] bg-[#191F28] text-white font-bold text-[17px] active:scale-[0.98] transition-transform shadow-sm cursor-pointer"
                    >
                        방문 기록 남기기
                    </button>
                </div>
            </div>

            {/* PC 분할 팝업 모달 */}
            <div className="hidden sm:flex fixed inset-0 z-50 bg-black/60 backdrop-blur-sm items-center justify-center p-8 animate-fade-in">
                <div className="absolute inset-0 cursor-pointer" onClick={onClose}></div>
                
                {/* 메인 모달 및 우측 사이드 뷰 래퍼 (메인 모달의 정중앙 유지를 위해 relative 배치) */}
                <div className="relative flex items-center justify-center">
                    
                    {/* 메인 모달창 컨테이너 */}
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
                            {(() => {
                                const desc = selectedPlace.description || '';
                                const hasPipe = desc.includes('|');
                                if (hasPipe) {
                                    const parts = desc.split('|');
                                    const headline = parts[0].trim();
                                    const summary = parts[1].trim();
                                    return (
                                        <div className="mb-10 bg-[#F9FAFB] p-6 rounded-[24px] border border-[#F2F4F6] flex flex-col gap-2.5">
                                            <h4 className="text-[17px] font-extrabold text-[#E65C00] tracking-tight leading-snug">
                                                {headline}
                                            </h4>
                                            <p className="text-[15.5px] text-[#4E5968] leading-[1.7] font-semibold">
                                                {summary}
                                            </p>
                                        </div>
                                    );
                                }
                                return (
                                    <p className="text-[16px] text-[#4E5968] leading-[1.7] mb-10 bg-[#F9FAFB] p-6 rounded-[24px] border border-[#F2F4F6]">
                                        {selectedPlace.description}
                                    </p>
                                );
                            })()}
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
                                <div className="w-full h-4 bg-[#F2F4F6] rounded-full overflow-hidden mb-8 relative border border-[#E2E8F0]/20">
                                    {/* 조용히 집중 바 - 왼쪽 기준 확장 */}
                                    <div 
                                        className="absolute top-0 left-0 h-full bg-[#ADC3E5]" 
                                        style={{ 
                                            width: '100%',
                                            transform: `scaleX(${quietPercent / 100})`,
                                            transformOrigin: 'left',
                                            transition: 'transform 750ms cubic-bezier(0.16, 1, 0.3, 1)',
                                            willChange: 'transform'
                                        }}
                                    ></div>
                                    {/* 대화하기 좋아요 바 - 오른쪽 기준 확장 */}
                                    <div 
                                        className="absolute top-0 right-0 h-full bg-[#FFAC81]" 
                                        style={{ 
                                            width: '100%',
                                            transform: `scaleX(${chattyPercent / 100})`,
                                            transformOrigin: 'right',
                                            transition: 'transform 750ms cubic-bezier(0.16, 1, 0.3, 1)',
                                            willChange: 'transform'
                                        }}
                                    ></div>
                                </div>
                                <div className="flex gap-4">
                                    <button 
                                        onClick={() => onVibeVote('quiet')} 
                                        className={`flex-1 py-6 px-4 rounded-[24px] border-[1.5px] transition-all flex flex-col items-center gap-3 active:scale-[0.98] ${
                                            userVotedVibe === 'quiet' 
                                            ? 'border-[#ADC3E5] bg-[#ADC3E5]/5 text-[#637FA6]' 
                                            : 'border-[#E5E8EB] bg-white hover:border-[#ADC3E5]/40'
                                        }`}
                                    >
                                        <svg className={`w-8 h-8 ${userVotedVibe === 'quiet' ? 'text-[#637FA6]' : 'text-[#8B95A1]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                        </svg>
                                        <span className={`text-[15px] font-bold ${userVotedVibe === 'quiet' ? 'text-[#637FA6]' : 'text-[#4E5968]'}`}>조용히 집중</span>
                                        <span className={`text-[14px] font-bold ${userVotedVibe === 'quiet' ? 'text-[#637FA6]' : 'text-[#8B95A1]'}`}>{quietPercent}%</span>
                                    </button>
                                    <button 
                                        onClick={() => onVibeVote('chatty')} 
                                        className={`flex-1 py-6 px-4 rounded-[24px] border-[1.5px] transition-all flex flex-col items-center gap-3 active:scale-[0.98] ${
                                            userVotedVibe === 'chatty' 
                                            ? 'border-[#FFAC81] bg-[#FFAC81]/5 text-[#CD6E3C]' 
                                            : 'border-[#E5E8EB] bg-white hover:border-[#FFAC81]/40'
                                        }`}
                                    >
                                        <svg className={`w-8 h-8 ${userVotedVibe === 'chatty' ? 'text-[#FFAC81]' : 'text-[#8B95A1]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                                        </svg>
                                        <span className={`text-[15px] font-bold ${userVotedVibe === 'chatty' ? 'text-[#CD6E3C]' : 'text-[#4E5968]'}`}>대화하기 좋아요</span>
                                        <span className={`text-[14px] font-bold ${userVotedVibe === 'chatty' ? 'text-[#CD6E3C]' : 'text-[#8B95A1]'}`}>{chattyPercent}%</span>
                                    </button>
                                </div>
                            </div>

                            {/* 후기가 없을 때만 장소 상세 정보 아래에 빈 상태 카드 노출 */}
                            {(!visits || visits.length === 0) && (
                                <div className="bg-[#F8FAFC] p-8 rounded-[32px] border border-[#F1F5F9] mt-6">
                                    <div className="flex justify-between items-center mb-5">
                                        <h3 className="font-extrabold text-[19px] tracking-tight text-[#1E293B] flex items-center gap-2">
                                            다녀간 픽플러들의 기록
                                        </h3>
                                    </div>
                                    <div className="py-10 text-center flex flex-col items-center gap-2">
                                        <svg className="w-10 h-10 text-[#CBD5E1]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                        <p className="text-[13px] font-bold text-[#8B95A1]">아직 방문 기록이 없어요.</p>
                                        <p className="text-[11px] font-semibold text-[#B0B8C1]">첫 번째로 이 장소에 발자국을 남겨보세요!</p>
                                    </div>
                                </div>
                            )}

                            {/* 후기가 존재하고 브라우저 폭이 xl 미만일 때(태블릿, 랩톱 등) 메인 모달 아래에 후기 피드 노출 */}
                            {visits && visits.length > 0 && (
                                <div className="xl:hidden bg-[#F8FAFC] p-8 rounded-[32px] border border-[#F1F5F9] mt-6 animate-fade-in">
                                    <div className="flex justify-between items-center mb-5">
                                        <h3 className="font-extrabold text-[19px] tracking-tight text-[#1E293B] flex items-center gap-2">
                                            다녀간 픽플러들의 기록
                                            <span className="text-[#FF802B] text-[16px] font-extrabold">({visits.length})</span>
                                        </h3>
                                    </div>
                                    <div className="flex flex-col gap-4 max-h-[350px] overflow-y-auto pr-1 no-scrollbar">
                                        {visits.map((visit: any) => (
                                            <div key={visit.id} className="bg-white p-5 rounded-[22px] border border-[#F1F5F9] flex flex-col gap-2.5 shadow-[0_2px_8px_rgba(241,245,249,0.5)]">
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-2.5">
                                                        <img 
                                                            src={visit.profileImageUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${visit.nickname || 'PickPl'}`}
                                                            alt="profile" 
                                                            className="w-8 h-8 rounded-full object-cover bg-[#F2F4F6]"
                                                        />
                                                        <div>
                                                            <p className="font-bold text-[13px] text-[#333D4B]">{visit.nickname}</p>
                                                            <p className="text-[11px] font-semibold text-[#8B95A1]">{visit.visitedDate} 방문</p>
                                                        </div>
                                                    </div>
                                                    
                                                    {visit.isMyRecord && (
                                                        <div className="flex gap-2 text-[12px] font-bold text-[#8B95A1]">
                                                            <button 
                                                                onClick={() => handleEditClick(visit)}
                                                                className="hover:text-[#333D4B] cursor-pointer"
                                                            >
                                                                수정
                                                            </button>
                                                            <span className="text-[#E5E8EB]">·</span>
                                                            <button 
                                                                onClick={() => handleVisitDelete(visit.id)}
                                                                className="hover:text-red-500 cursor-pointer"
                                                            >
                                                                삭제
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-[14px] text-[#4E5968] font-medium leading-relaxed whitespace-pre-wrap">
                                                    {visit.comment}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
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

                            {/* 방문 기록 서브 모달 닫힘 상태 시 다시 열기 버튼 */}
                            {visits && visits.length > 0 && !showVisitsSidebar && (
                                <button 
                                    onClick={() => setShowVisitsSidebar(true)}
                                    className="hidden xl:flex px-6 h-[64px] rounded-[20px] border border-[#FF802B] bg-orange-50 hover:bg-orange-100/70 text-[#FF802B] font-extrabold text-[15px] transition-colors items-center justify-center gap-2 cursor-pointer whitespace-nowrap animate-scale-up"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    기록 보기 ({visits.length})
                                </button>
                            )}

                            <button 
                                onClick={() => {
                                    if (!isLoggedIn) {
                                        showToast("로그인 후 방문 기록을 남길 수 있습니다.", "error");
                                    } else {
                                        setIsVisitFormOpen(true);
                                    }
                                }}
                                className="flex-1 h-[64px] rounded-[20px] bg-[#191F28] hover:bg-black text-white font-bold text-[18px] transition-colors shadow-sm cursor-pointer"
                            >
                                방문 기록 남기기
                            </button>
                        </div>
                    </div>
                </div>

                {/* 방문 기록 사이드 피드 뷰 (후기가 있을 때만 데스크톱에서 우측에 나란히 노출) */}
                {visits && visits.length > 0 && showVisitsSidebar && (
                    <div className="hidden xl:flex absolute left-[calc(100%+24px)] top-0 w-[380px] h-[90vh] bg-white rounded-[40px] border border-[#E5E8EB]/50 shadow-2xl flex-col z-20 overflow-hidden animate-scale-up">
                        {/* 헤더 */}
                        <div className="p-6 border-b border-[#F2F4F6] shrink-0 flex justify-between items-center bg-[#F9FAFB]">
                            <h3 className="font-extrabold text-[20px] text-[#191F28] tracking-tight flex items-center gap-2">
                                다녀간 픽플러들의 기록
                                <span className="text-[#FF802B] text-[17px] font-extrabold">({visits.length})</span>
                            </h3>
                            {/* 닫기 버튼 */}
                            <button 
                                onClick={() => setShowVisitsSidebar(false)}
                                className="w-8 h-8 rounded-full bg-[#E5E8EB]/50 hover:bg-[#E5E8EB] active:scale-95 transition-all flex items-center justify-center text-[#4E5968] cursor-pointer"
                                title="피드 닫기"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        {/* 피드 목록 */}
                        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 no-scrollbar">
                            {visits.map((visit: any) => (
                                <div key={visit.id} className="bg-[#F8FAFC] p-5 rounded-[24px] border border-[#F1F5F9] flex flex-col gap-3 shadow-sm transition-transform hover:translate-y-[-2px]">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2.5">
                                            <img 
                                                src={visit.profileImageUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${visit.nickname || 'PickPl'}`}
                                                alt="profile" 
                                                className="w-8 h-8 rounded-full object-cover bg-[#F2F4F6]"
                                            />
                                            <div>
                                                <p className="font-bold text-[13px] text-[#333D4B]">{visit.nickname}</p>
                                                <p className="text-[11px] font-semibold text-[#8B95A1]">{visit.visitedDate} 방문</p>
                                            </div>
                                        </div>
                                        
                                        {visit.isMyRecord && (
                                            <div className="flex gap-2 text-[12px] font-bold text-[#8B95A1]">
                                                <button 
                                                    onClick={() => handleEditClick(visit)}
                                                    className="hover:text-[#333D4B] cursor-pointer"
                                                >
                                                    수정
                                                </button>
                                                <span className="text-[#E5E8EB]">·</span>
                                                <button 
                                                    onClick={() => handleVisitDelete(visit.id)}
                                                    className="hover:text-red-500 cursor-pointer"
                                                >
                                                    삭제
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[14px] text-[#4E5968] font-medium leading-relaxed whitespace-pre-wrap">
                                        {visit.comment}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                </div>
            </div>

            {/* 방문 기록 작성/수정 모달 레이어 */}
            <VisitRecordFormModal
                isOpen={isVisitFormOpen}
                onClose={() => {
                    setIsVisitFormOpen(false);
                    setEditingVisit(null);
                }}
                onSubmit={handleVisitSubmit}
                placeName={selectedPlace.name}
                initialComment={editingVisit?.comment}
                initialVisitedDate={editingVisit?.visitedDate}
                isLoading={isSubmitLoading}
            />
        </>
    );
}
