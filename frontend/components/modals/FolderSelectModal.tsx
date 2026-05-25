import React, { useState } from 'react';

interface FolderSelectModalProps {
    isOpen: boolean;
    onClose: () => void;
    foldersMap: { [key: string]: any[] };
    onExecuteScrap: (folderName: string | null, isDelete: boolean) => void;
}

export default function FolderSelectModal({
    isOpen,
    onClose,
    foldersMap,
    onExecuteScrap
}: FolderSelectModalProps) {
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-white w-full max-w-[480px] rounded-t-[28px] p-6 pb-safe animate-slide-up" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-[20px] text-[#191F28]">저장 위치 선택</h3>
                    <button onClick={onClose} className="p-2 text-[#8B95A1] hover:text-[#191F28] transition-colors rounded-full hover:bg-[#F2F4F6]">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <div className="flex flex-col gap-3">
                    {!isCreatingFolder ? (
                        <>
                            <div className="flex flex-col gap-3 overflow-y-auto no-scrollbar max-h-[260px] pr-0.5">
                                <button onClick={() => onExecuteScrap("기본 저장소", false)} className="flex items-center justify-between w-full p-4 rounded-[20px] bg-[#F9FAFB] hover:bg-[#F2F4F6] transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-[14px] bg-[#E5E8EB] flex items-center justify-center text-[#8B95A1] group-hover:text-[#4E5968] transition-colors">
                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                            </svg>
                                        </div>
                                        <div className="flex flex-col items-start">
                                            <span className="font-bold text-[16px] text-[#191F28]">기본 저장소</span>
                                            {foldersMap["기본 저장소"] && (
                                                <span className="text-[12px] text-[#8B95A1] font-semibold">{foldersMap["기본 저장소"].length}개의 공간</span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                                
                                {/* 기존 커스텀 폴더 목록 */}
                                {Object.keys(foldersMap)
                                    .filter(name => name !== "기본 저장소")
                                    .sort((a, b) => a.localeCompare(b))
                                    .map(folderName => (
                                        <button 
                                            key={folderName} 
                                            onClick={() => onExecuteScrap(folderName, false)} 
                                            className="flex items-center justify-between w-full p-4 rounded-[20px] bg-[#F9FAFB] hover:bg-[#F2F4F6] transition-colors group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-[14px] bg-[#E5E8EB] flex items-center justify-center text-[#8B95A1] group-hover:text-[#4E5968] transition-colors">
                                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                                    </svg>
                                                </div>
                                                <div className="flex flex-col items-start text-left">
                                                    <span className="font-bold text-[16px] text-[#191F28] line-clamp-1">{folderName}</span>
                                                    <span className="text-[12px] text-[#8B95A1] font-semibold">{foldersMap[folderName].length}개의 공간</span>
                                                </div>
                                            </div>
                                        </button>
                                    ))
                                }
                            </div>
                            
                            <button onClick={() => setIsCreatingFolder(true)} className="flex items-center justify-between w-full p-4 rounded-[20px] bg-white border border-[#F2F4F6] hover:border-blue-200 hover:bg-blue-50 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-[14px] bg-blue-100 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                    </div>
                                    <span className="font-bold text-[16px] text-blue-500 group-hover:text-blue-600">새 폴더 만들기</span>
                                </div>
                            </button>
                        </>
                    ) : (
                        <div className="flex flex-col gap-4 animate-fade-in">
                            <input 
                                type="text" 
                                autoFocus
                                placeholder="새 폴더 이름 입력" 
                                value={newFolderName} 
                                onChange={(e) => setNewFolderName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && newFolderName.trim()) {
                                        onExecuteScrap(newFolderName.trim(), false);
                                    }
                                }}
                                className="w-full bg-[#F9FAFB] border border-[#E5E8EB] rounded-[16px] px-5 py-4 text-[16px] font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                            />
                            <div className="flex gap-2">
                                <button onClick={() => setIsCreatingFolder(false)} className="flex-1 py-4 rounded-[16px] bg-[#F2F4F6] text-[#4E5968] font-bold text-[15px] hover:bg-[#E5E8EB] transition-colors">
                                    취소
                                </button>
                                <button 
                                    onClick={() => newFolderName.trim() && onExecuteScrap(newFolderName.trim(), false)} 
                                    disabled={!newFolderName.trim()}
                                    className={`flex-1 py-4 rounded-[16px] font-bold text-[15px] transition-colors ${newFolderName.trim() ? 'bg-[#191F28] text-white hover:bg-black' : 'bg-[#E5E8EB] text-[#B0B8C1] cursor-not-allowed'}`}
                                >
                                    만들기
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
