import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { mutate } from 'swr';
import axiosInstance from '../../api/axios';
import { renderFolderCover, mapPlaceToData } from '../ui/Helpers';

interface CollectionViewProps {
    hidden: boolean;
    isLoggedIn: boolean;
    scrapsData: any[] | undefined;
    foldersMap: { [key: string]: any[] };
    selectedFolder: string | null;
    setSelectedFolder: (folder: string | null) => void;
    setFolderToEdit: (folder: string | null) => void;
    onPlaceClick: (place: any) => void;
    onViewChange: (view: string) => void;
    showFolderSettings: boolean;
    setShowFolderSettings: (val: boolean) => void;
    setShowRenameModal: (val: boolean) => void;
    setShowDeleteConfirmModal: (val: boolean) => void;
    mutateScraps: () => any;
    showToast: (msg: string, type?: 'success' | 'warning' | 'error') => void;
}

export default function CollectionView({
    hidden,
    isLoggedIn,
    scrapsData,
    foldersMap,
    selectedFolder,
    setSelectedFolder,
    setFolderToEdit,
    onPlaceClick,
    onViewChange,
    showFolderSettings,
    setShowFolderSettings,
    setShowRenameModal,
    setShowDeleteConfirmModal,
    mutateScraps,
    showToast
}: CollectionViewProps) {
    const router = useRouter();
    const [activeMenuFolder, setActiveMenuFolder] = useState<string | null>(null);

    React.useEffect(() => {
        if (!activeMenuFolder) return;
        
        const handleOutsideClick = () => {
            setActiveMenuFolder(null);
        };
        
        document.addEventListener('click', handleOutsideClick);
        return () => {
            document.removeEventListener('click', handleOutsideClick);
        };
    }, [activeMenuFolder]);

    return (
        <div 
            style={{ display: hidden ? 'none' : 'flex' }} 
            className="flex-1 h-full w-full overflow-y-auto no-scrollbar bg-[#F9FAFB] animate-slide-in-right lg:animate-fade-in flex flex-col absolute lg:relative inset-0 z-30 lg:z-auto items-center"
        >
            {/* 헤더 */}
            <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-[#F2F4F6]/50 px-6 py-4 lg:px-10 lg:py-8 flex items-center w-full justify-between shrink-0">
                <div className="flex items-center gap-3">
                    {selectedFolder ? (
                        <button 
                            onClick={() => setSelectedFolder(null)}
                            className="w-10 h-10 rounded-full bg-[#F2F4F6] hover:bg-[#E5E8EB] flex items-center justify-center text-[#4E5968] active:scale-95 transition-all mr-1"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                    ) : (
                        <button 
                            onClick={() => onViewChange('home')}
                            className="lg:hidden w-10 h-10 rounded-full bg-[#F2F4F6] hover:bg-[#E5E8EB] flex items-center justify-center text-[#4E5968] active:scale-95 transition-all mr-1"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                    )}
                    <div className="flex flex-col">
                        {selectedFolder ? (
                            <>
                                <div className="hidden lg:flex items-center gap-1.5 text-[13px] font-bold text-[#8B95A1] mb-1">
                                    <span>내 컬렉션</span>
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                                    </svg>
                                    <span className="text-[#4E5968]">{selectedFolder}</span>
                                </div>
                                <h1 className="font-bold text-[20px] lg:text-[28px] tracking-tight text-[#191F28]">{selectedFolder}</h1>
                            </>
                        ) : (
                            <h1 className="font-bold text-[20px] lg:text-[28px] tracking-tight text-[#191F28]">내 컬렉션</h1>
                        )}
                    </div>
                </div>
                {isLoggedIn && !selectedFolder && scrapsData && Array.isArray(scrapsData) && Object.keys(foldersMap).length > 0 && (
                    <span className="text-[13px] lg:text-[14px] font-bold text-orange-500 bg-orange-50 border border-orange-100 px-3.5 py-1.5 rounded-[10px]">
                        총 {Object.keys(foldersMap).length}개의 폴더
                    </span>
                )}
                {selectedFolder && foldersMap[selectedFolder] && (
                    <div className="flex items-center gap-2">
                        <span className="text-[13px] lg:text-[14px] font-bold text-orange-500 bg-orange-50 border border-orange-100 px-3.5 py-1.5 rounded-[10px]">
                            공간 {foldersMap[selectedFolder].length}개
                        </span>
                        {selectedFolder !== "기본 저장소" && (
                            <div className="relative">
                                <button 
                                    onClick={() => setShowFolderSettings(!showFolderSettings)}
                                    className="w-10 h-10 rounded-full flex items-center justify-center text-[#8B95A1] hover:text-[#191F28] hover:bg-[#F2F4F6] transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                    </svg>
                                </button>
                                
                                {showFolderSettings && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setShowFolderSettings(false)}></div>
                                        <div className="absolute right-0 mt-2 w-40 bg-white border border-[#E5E8EB] rounded-[16px] shadow-lg py-2 z-50 animate-scale-up">
                                            <button 
                                                onClick={() => {
                                                    setShowFolderSettings(false);
                                                    setFolderToEdit(selectedFolder);
                                                    setShowRenameModal(true);
                                                }}
                                                className="flex items-center gap-2.5 w-full px-4 py-3 text-left font-bold text-[14px] text-[#4E5968] hover:bg-[#F9FAFB] hover:text-[#191F28] transition-colors"
                                            >
                                                이름 변경
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    setShowFolderSettings(false);
                                                    setFolderToEdit(selectedFolder);
                                                    setShowDeleteConfirmModal(true);
                                                }}
                                                className="flex items-center gap-2.5 w-full px-4 py-3 text-left font-bold text-[14px] text-red-500 hover:bg-red-50 transition-colors"
                                            >
                                                폴더 삭제
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </header>

            <div className="w-full lg:max-w-[880px] px-5 py-6 lg:px-8 lg:py-10 flex-1 flex flex-col pb-[100px] lg:pb-24">
                {!isLoggedIn ? (
                    /* 비로그인 유도 CTA */
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-10 lg:py-20 animate-fade-in">
                        <div className="relative w-36 h-36 flex items-center justify-center mb-8">
                            <div className="absolute inset-0 bg-orange-500/10 rounded-full blur-[30px] animate-[glow-pulse_3s_ease-in-out_infinite]"></div>
                            <svg className="w-16 h-16 text-orange-500/90 drop-shadow-[0_0_12px_rgba(249,115,22,0.35)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                        </div>
                        <h2 className="text-[22px] lg:text-[26px] font-bold tracking-tight text-[#191F28] mb-3">나만의 감성 공간을 채워보세요</h2>
                        <p className="text-[14px] lg:text-[15px] text-[#8B95A1] font-medium leading-relaxed max-w-[320px] mb-8">
                            로그인하고 마음에 드는 공간들을<br />나만의 폴더로 간직할 수 있습니다.
                        </p>
                        <button onClick={() => router.push('/login')} className="bg-[#191F28] hover:bg-black text-white font-bold text-[15px] px-7 py-4 rounded-[16px] transition-all active:scale-[0.98] shadow-md">
                            로그인하고 시작하기
                        </button>
                    </div>
                ) : !scrapsData ? (
                    /* 로딩 스켈레톤 */
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                        {[1, 2, 3].map((n) => (
                            <div key={n} className="flex flex-col">
                                <div className="aspect-[4/3] rounded-[24px] bg-[#E5E8EB]"></div>
                                <div className="h-5 bg-[#E5E8EB] w-2/3 rounded-md mt-4"></div>
                                <div className="h-4 bg-[#E5E8EB] w-1/3 rounded-md mt-2"></div>
                            </div>
                        ))}
                    </div>
                ) : Object.keys(foldersMap).length === 0 ? (
                    /* 저장된 공간 없음 Empty State */
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-12 lg:py-24 animate-fade-in">
                        <div className="w-20 h-20 rounded-full bg-[#F2F4F6] flex items-center justify-center text-[#D1D6DB] mb-6">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                        </div>
                        <h3 className="font-bold text-[18px] text-[#191F28] mb-2">저장한 공간이 아직 없습니다</h3>
                        <p className="text-[13.5px] text-[#8B95A1] font-medium leading-relaxed max-w-[280px] mb-6">
                            발견 피드에서 마음에 드는 공간에<br />북마크를 눌러 폴더를 채워보세요.
                        </p>
                        <button onClick={() => onViewChange('home')} className="bg-[#191F28] hover:bg-black text-white font-bold text-[14px] px-6 py-3 rounded-[12px] transition-colors shadow-sm">
                            피드 보러 가기
                        </button>
                    </div>
                ) : !selectedFolder ? (
                    /* 폴더 리스트 메인 뷰 */
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 animate-fade-in">
                        {Object.keys(foldersMap)
                            .sort((a, b) => {
                                if (a === "기본 저장소") return -1;
                                if (b === "기본 저장소") return 1;
                                return a.localeCompare(b);
                            })
                            .map((folderName) => {
                                const scrapsInFolder = foldersMap[folderName];
                                
                                return (
                                    <div 
                                        key={folderName} 
                                        onClick={() => setSelectedFolder(folderName)}
                                        className="group cursor-pointer flex flex-col animate-scale-up relative"
                                    >
                                        <div className="relative aspect-[4/3] rounded-[24px] overflow-hidden bg-[#F2F4F6] shadow-sm border border-[#F2F4F6]/50">
                                            {renderFolderCover(scrapsInFolder)}
                                            <div className="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors"></div>
                                            
                                            {scrapsInFolder.length > 1 && (
                                                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-[10px] text-[11px] font-bold text-[#4E5968] shadow-sm border border-white/20">
                                                    +{scrapsInFolder.length - 1}개
                                                </div>
                                            )}
                                        </div>
                                        <div className="mt-4 px-1 flex items-center justify-between relative">
                                            <div className="min-w-0 flex-1">
                                                <h3 className="font-bold text-[16px] lg:text-[18px] text-[#191F28] tracking-tight group-hover:text-orange-500 transition-colors line-clamp-1">{folderName}</h3>
                                                <p className="text-[12.5px] text-[#8B95A1] font-semibold mt-0.5">{scrapsInFolder.length}개의 공간</p>
                                            </div>

                                            {/* 개별 폴더 설정 버튼 (기본 저장소 제외) */}
                                            {folderName !== "기본 저장소" && (
                                                <div className="relative ml-2">
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveMenuFolder(activeMenuFolder === folderName ? null : folderName);
                                                        }}
                                                        className="w-8 h-8 rounded-full flex items-center justify-center text-[#8B95A1] hover:text-[#191F28] hover:bg-[#F2F4F6] transition-all active:scale-90"
                                                    >
                                                        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                                        </svg>
                                                    </button>
                                                    
                                                    {activeMenuFolder === folderName && (
                                                        <div 
                                                            className="absolute right-0 mt-2 w-32 bg-white border border-[#E5E8EB] rounded-[16px] shadow-lg py-1.5 z-50 animate-scale-up cursor-default"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <button 
                                                                onClick={() => {
                                                                    setActiveMenuFolder(null);
                                                                    setFolderToEdit(folderName);
                                                                    setShowRenameModal(true);
                                                                }}
                                                                className="flex items-center gap-2 w-full px-4 py-2.5 text-left font-bold text-[13px] text-[#4E5968] hover:bg-[#F9FAFB] hover:text-[#191F28] transition-colors"
                                                            >
                                                                이름 변경
                                                            </button>
                                                            <button 
                                                                onClick={() => {
                                                                    setActiveMenuFolder(null);
                                                                    setFolderToEdit(folderName);
                                                                    setShowDeleteConfirmModal(true);
                                                                }}
                                                                className="flex items-center gap-2 w-full px-4 py-2.5 text-left font-bold text-[13px] text-red-500 hover:bg-red-50 transition-colors"
                                                            >
                                                                폴더 삭제
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                ) : (
                    /* 폴더 상세 뷰 (Masonry grid 스타일) */
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6 animate-fade-in">
                        {foldersMap[selectedFolder]?.map((scrap: any) => {
                            const placeData = mapPlaceToData(scrap.place);
                            return (
                                <article 
                                    key={scrap.scrapId} 
                                    onClick={() => onPlaceClick(placeData)}
                                    className="group cursor-pointer relative flex flex-col bg-white rounded-[24px] border border-[#F2F4F6] overflow-hidden shadow-sm hover:shadow-md transition-all animate-scale-up"
                                >
                                    <div className="relative aspect-[4/5] overflow-hidden bg-[#F2F4F6]">
                                        <img 
                                            src={placeData.imageUrl} 
                                            alt={placeData.name} 
                                            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" 
                                        />
                                        
                                        {/* Floating Unscrap Button */}
                                        <button 
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                try {
                                                    await axiosInstance.delete(`/scraps/${placeData.id}`);
                                                    showToast("북마크가 해제되었습니다.");
                                                    mutateScraps();
                                                    mutate((key: any) => typeof key === 'string' && (key.includes('/places') || key.includes('/scraps')));
                                                } catch (err) {
                                                    console.error(err);
                                                    showToast("북마크 해제 중 오류가 발생했습니다.", "error");
                                                }
                                            }}
                                            className="absolute top-3.5 right-3.5 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-[#F97316] shadow-sm border border-white/20 active:scale-90 hover:scale-105 transition-transform z-10"
                                        >
                                            <svg className="w-4 h-4 text-[#F97316]" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                            </svg>
                                        </button>
                                    </div>
                                    
                                    <div className="p-4 flex flex-col flex-1">
                                        <h4 className="font-bold text-[15px] lg:text-[16px] text-[#191F28] tracking-tight line-clamp-1 group-hover:text-orange-500 transition-colors">{placeData.name}</h4>
                                        <p className="text-[12px] text-[#8B95A1] font-semibold mt-1 line-clamp-1">{placeData.location}</p>
                                        
                                        {placeData.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mt-3">
                                                {placeData.tags.slice(0, 2).map((t: string) => (
                                                    <span key={t} className="px-2.5 py-1 rounded-[8px] bg-[#F2F4F6] text-[#4E5968] text-[11.5px] font-bold tracking-tight">
                                                        #{t}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
