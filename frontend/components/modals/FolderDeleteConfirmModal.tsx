import React from 'react';

interface FolderDeleteConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedFolder: string | null;
    folderScrapsCount: number;
    onDeleteConfirm: () => void;
}

export default function FolderDeleteConfirmModal({
    isOpen,
    onClose,
    selectedFolder,
    folderScrapsCount,
    onDeleteConfirm
}: FolderDeleteConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-white w-[90%] max-w-[400px] rounded-[28px] p-6 shadow-2xl animate-scale-up" onClick={e => e.stopPropagation()}>
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-4">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </div>
                <h3 className="font-bold text-[20px] text-[#191F28] mb-2">폴더를 삭제하시겠습니까?</h3>
                <p className="text-[14px] text-[#8B95A1] font-semibold leading-relaxed mb-6">
                    폴더를 삭제하면 해당 폴더 안에 저장된 <span className="text-red-500 font-bold">{folderScrapsCount}개</span>의 모든 공간 스크랩이 함께 삭제됩니다. 이 동작은 취소할 수 없습니다.
                </p>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-4 rounded-[16px] bg-[#F2F4F6] text-[#4E5968] font-bold text-[15px] hover:bg-[#E5E8EB] transition-colors">
                        취소
                    </button>
                    <button 
                        onClick={onDeleteConfirm} 
                        className="flex-1 py-4 rounded-[16px] bg-red-500 text-white font-bold text-[15px] hover:bg-red-600 transition-colors shadow-sm"
                    >
                        삭제
                    </button>
                </div>
            </div>
        </div>
    );
}
