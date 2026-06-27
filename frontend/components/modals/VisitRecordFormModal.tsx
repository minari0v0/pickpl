import React, { useState, useEffect } from 'react';

interface VisitRecordFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (comment: string, visitedDate: string) => void;
    placeName: string;
    initialComment?: string;
    initialVisitedDate?: string;
    isLoading?: boolean;
}

export default function VisitRecordFormModal({
    isOpen,
    onClose,
    onSubmit,
    placeName,
    initialComment = '',
    initialVisitedDate = '',
    isLoading = false
}: VisitRecordFormModalProps) {
    const [comment, setComment] = useState('');
    const [visitedDate, setVisitedDate] = useState('');

    useEffect(() => {
        if (isOpen) {
            setComment(initialComment);
            setVisitedDate(initialVisitedDate || new Date().toISOString().split('T')[0]);
        }
    }, [isOpen, initialComment, initialVisitedDate]);

    if (!isOpen) return null;

    const isEditMode = !!initialComment;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-white w-[90%] max-w-[450px] rounded-[32px] p-6 shadow-2xl animate-scale-up flex flex-col gap-5 border border-[#F2F4F6]" onClick={e => e.stopPropagation()}>
                <div>
                    <h3 className="font-extrabold text-[22px] text-[#191F28] tracking-tight mb-1">
                        {isEditMode ? '방문 기록 수정' : '방문 기록 남기기'}
                    </h3>
                    <p className="text-[14px] text-[#8B95A1] font-semibold">
                        <span className="text-[#FF802B] font-bold">{placeName}</span>에서의 추억을 남겨주세요.
                    </p>
                </div>

                <div className="flex flex-col gap-4">
                    {/* 방문 날짜 입력 */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[12px] font-bold text-[#8B95A1]">방문 날짜</label>
                        <input 
                            type="date"
                            value={visitedDate}
                            onChange={(e) => setVisitedDate(e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                            className="w-full bg-[#F9FAFB] border border-[#E5E8EB] rounded-[16px] px-5 py-4 text-[16px] font-semibold text-[#333D4B] focus:outline-none focus:border-[#FF802B] focus:bg-white transition-colors"
                        />
                    </div>

                    {/* 방문 한줄평 입력 */}
                    <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center">
                            <label className="text-[12px] font-bold text-[#8B95A1]">방문 한줄평</label>
                            <span className={`text-[11px] font-bold ${comment.length > 200 ? 'text-red-500' : 'text-[#B0B8C1]'}`}>
                                {comment.length}/200자
                            </span>
                        </div>
                        <textarea 
                            value={comment}
                            onChange={(e) => setComment(e.target.value.slice(0, 200))}
                            placeholder="이 공간에서 어떤 감정을 느끼셨나요? (예: 아늑하고 일하기 너무 좋은 공간이었어요.)"
                            rows={3}
                            className="w-full bg-[#F9FAFB] border border-[#E5E8EB] rounded-[16px] px-5 py-4 text-[15px] font-medium text-[#333D4B] placeholder-[#B0B8C1] focus:outline-none focus:border-[#FF802B] focus:bg-white transition-colors resize-none leading-relaxed"
                        />
                    </div>
                </div>

                <div className="flex gap-3 mt-2">
                    <button 
                        onClick={onClose} 
                        disabled={isLoading}
                        className="flex-1 py-4 rounded-[18px] bg-[#F2F4F6] text-[#4E5968] font-extrabold text-[15px] hover:bg-[#E5E8EB] transition-colors cursor-pointer"
                    >
                        취소
                    </button>
                    <button 
                        onClick={() => onSubmit(comment.trim(), visitedDate)} 
                        disabled={!comment.trim() || !visitedDate || comment.length > 200 || isLoading}
                        className={`flex-1 py-4 rounded-[18px] font-extrabold text-[15px] transition-all flex items-center justify-center gap-1.5 ${
                            comment.trim() && visitedDate && comment.length <= 200 && !isLoading
                            ? 'bg-[#191F28] text-white hover:bg-black cursor-pointer shadow-sm active:scale-95' 
                            : 'bg-[#E5E8EB] text-[#B0B8C1] cursor-not-allowed'
                        }`}
                    >
                        {isLoading ? (
                            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            isEditMode ? '수정 완료' : '기록하기'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
