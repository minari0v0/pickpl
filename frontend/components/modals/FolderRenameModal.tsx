import React, { useState, useEffect } from 'react';

interface FolderRenameModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedFolder: string | null;
    onRename: (newName: string) => void;
}

export default function FolderRenameModal({
    isOpen,
    onClose,
    selectedFolder,
    onRename
}: FolderRenameModalProps) {
    const [renameInputVal, setRenameInputVal] = useState('');

    useEffect(() => {
        if (isOpen && selectedFolder) {
            setRenameInputVal(selectedFolder);
        }
    }, [isOpen, selectedFolder]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-white w-[90%] max-w-[400px] rounded-[28px] p-6 shadow-2xl animate-scale-up" onClick={e => e.stopPropagation()}>
                <h3 className="font-bold text-[20px] text-[#191F28] mb-4">폴더 이름 변경</h3>
                <p className="text-[14px] text-[#8B95A1] font-semibold mb-4">새로운 폴더 이름을 입력해주세요.</p>
                <input 
                    type="text" 
                    autoFocus
                    placeholder="폴더 이름 입력" 
                    value={renameInputVal} 
                    onChange={(e) => setRenameInputVal(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && renameInputVal.trim() && renameInputVal.trim() !== selectedFolder) {
                            onRename(renameInputVal.trim());
                        }
                    }}
                    className="w-full bg-[#F9FAFB] border border-[#E5E8EB] rounded-[16px] px-5 py-4 text-[16px] font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-colors mb-6"
                />
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-4 rounded-[16px] bg-[#F2F4F6] text-[#4E5968] font-bold text-[15px] hover:bg-[#E5E8EB] transition-colors">
                        취소
                    </button>
                    <button 
                        onClick={() => onRename(renameInputVal.trim())} 
                        disabled={!renameInputVal.trim() || renameInputVal.trim() === selectedFolder}
                        className={`flex-1 py-4 rounded-[16px] font-bold text-[15px] transition-colors ${renameInputVal.trim() && renameInputVal.trim() !== selectedFolder ? 'bg-[#191F28] text-white hover:bg-black' : 'bg-[#E5E8EB] text-[#B0B8C1] cursor-not-allowed'}`}
                    >
                        변경
                    </button>
                </div>
            </div>
        </div>
    );
}
