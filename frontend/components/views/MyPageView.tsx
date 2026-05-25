import React from 'react';
import { getProfileBgClass } from '../ui/Helpers';

interface MyPageViewProps {
    hidden: boolean;
    nickname: string;
    profileImage: string;
    scrapsData: any[] | undefined;
    foldersMap: { [key: string]: any[] };
    onViewChange: (view: string) => void;
    setSelectedFolder: (folder: string | null) => void;
    onAccountSettingsClick: () => void;
    onAppSettingsClick: () => void;
    onLogout: () => void;
    onShowTermsModal: (type: 'terms' | 'privacy' | null) => void;
}

export default function MyPageView({
    hidden,
    nickname,
    profileImage,
    scrapsData,
    foldersMap,
    onViewChange,
    setSelectedFolder,
    onAccountSettingsClick,
    onAppSettingsClick,
    onLogout,
    onShowTermsModal
}: MyPageViewProps) {
    
    return (
        <div 
            style={{ display: hidden ? 'none' : 'flex' }} 
            className="flex-1 h-full w-full overflow-y-auto no-scrollbar bg-[#F9FAFB] animate-slide-in-right lg:animate-fade-in flex flex-col absolute lg:relative inset-0 z-30 lg:z-auto items-center"
        >
            {/* 헤더 */}
            <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-[#F2F4F6]/50 px-6 py-4 lg:px-10 lg:py-8 flex items-center w-full justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => onViewChange('home')}
                        className="lg:hidden w-10 h-10 rounded-full bg-[#F2F4F6] hover:bg-[#E5E8EB] flex items-center justify-center text-[#4E5968] active:scale-95 transition-all mr-1"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h1 className="font-bold text-[20px] lg:text-[28px] tracking-tight text-[#191F28]">마이페이지</h1>
                </div>
            </header>

            <div className="w-full lg:max-w-[800px] px-5 lg:px-8 py-6 lg:py-10 flex-1 flex flex-col gap-6 lg:gap-8 pb-[120px]">
                {/* 1. 프로필 카드 */}
                <div className="bg-white rounded-[28px] lg:rounded-[32px] p-6 lg:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.015)] border border-[#F2F4F6] flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl"></div>
                    <div className={`w-20 h-20 lg:w-24 lg:h-24 rounded-full overflow-hidden shrink-0 border-4 border-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-colors duration-300 ${getProfileBgClass(profileImage)}`}>
                        <img src={profileImage ? profileImage.split('?')[0] : "/profile_cat.png"} alt="profile" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1.5 justify-center sm:justify-start">
                            <h2 className="text-[22px] lg:text-[26px] font-extrabold text-[#191F28] tracking-tight">{nickname}</h2>
                            <span className="self-center px-2.5 py-1 rounded-[8px] bg-[#F0F6F5] text-[#2E7D7A] border border-[#D1E6E4]/50 text-[11px] font-bold">취향 탐험가</span>
                        </div>
                        <p className="text-[14px] font-medium text-[#8B95A1] leading-relaxed">나만의 특별한 무드를 담은 취향 저장소를 만들고 있습니다.</p>
                    </div>
                </div>

                {/* 2. 내 취향 & 픽플 대시보드 통합 컴포넌트 */}
                <div className="bg-white rounded-[28px] lg:rounded-[32px] p-6 lg:p-8 border border-[#F2F4F6] shadow-sm flex flex-col gap-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/[0.02] rounded-full blur-3xl pointer-events-none"></div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F2F4F6]">
                        <div>
                            <span className="px-2.5 py-1 rounded-[8px] bg-[#F0F6F5] text-[#2E7D7A] text-[11px] font-bold tracking-tight border border-[#D1E6E4]/50">활동 및 보관함 분석</span>
                            <h3 className="font-extrabold text-[19px] text-[#191F28] mt-1.5 tracking-tight">내 취향 & 픽플 대시보드</h3>
                        </div>
                        <button 
                            onClick={() => { onViewChange('collection'); setSelectedFolder(null); }}
                            className="bg-[#F9FAFB] hover:bg-[#F2F4F6] active:scale-[0.98] text-[#4E5968] font-bold text-[13px] px-4 py-2.5 rounded-[12px] transition-all flex items-center gap-1.5 shrink-0 self-start sm:self-center"
                        >
                            <span>내 컬렉션 전체보기</span>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>

                    {/* 2단 구성: 요약 스탯 + 무드 분석 */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                        {/* 왼쪽: 저장소 요약 (2칸) */}
                        <div className="md:col-span-2 flex flex-col justify-between gap-4 bg-[#F9FAFB] rounded-[24px] p-5 border border-[#F2F4F6]">
                            <div>
                                <h4 className="font-bold text-[14px] text-[#191F28] mb-1">저장소 요약</h4>
                                <p className="text-[12px] text-[#8B95A1]">북마크한 공간 및 폴더 개수</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3 my-2">
                                <div className="bg-white rounded-[16px] p-3 text-center border border-[#F2F4F6] shadow-sm cursor-pointer hover:border-orange-200 transition-colors" onClick={() => { onViewChange('collection'); setSelectedFolder(null); }}>
                                    <p className="text-[11px] text-[#8B95A1] font-bold mb-0.5">총 북마크</p>
                                    <p className="text-[22px] font-extrabold text-[#191F28]">{scrapsData?.length || 0}</p>
                                </div>
                                <div className="bg-white rounded-[16px] p-3 text-center border border-[#F2F4F6] shadow-sm cursor-pointer hover:border-orange-200 transition-colors" onClick={() => { onViewChange('collection'); setSelectedFolder(null); }}>
                                    <p className="text-[11px] text-[#8B95A1] font-bold mb-0.5">폴더 개수</p>
                                    <p className="text-[22px] font-extrabold text-orange-500">{Object.keys(foldersMap).length}</p>
                                </div>
                            </div>
                            <div className="text-[11.5px] text-[#8B95A1] leading-relaxed font-semibold">
                                💡 공간을 북마크할 때 폴더별로 구분하면 나중에 장소들을 더 쉽게 관리할 수 있어요!
                            </div>
                        </div>

                        {/* 오른쪽: 선호 무드 분석 (3칸) */}
                        <div className="md:col-span-3 flex flex-col justify-between gap-4">
                            <div>
                                <h4 className="font-bold text-[14px] text-[#191F28] mb-1">선호 무드 분석</h4>
                                <p className="text-[12px] text-[#8B95A1]">최근 1개월 동안 수집된 개인 취향 통계</p>
                            </div>
                            <div className="flex flex-col gap-3.5 my-2">
                                <div>
                                    <div className="flex justify-between items-center text-[12px] font-bold mb-1">
                                        <span className="text-[#2E7D7A] flex items-center gap-1">🌲 #코지한 / #조용한 (집중)</span>
                                        <span className="text-[#2E7D7A]">62%</span>
                                    </div>
                                    <div className="w-full h-2 bg-[#F0F6F5] rounded-full overflow-hidden">
                                        <div className="h-full bg-[#2E7D7A] rounded-full" style={{ width: '62%' }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between items-center text-[12px] font-bold mb-1">
                                        <span className="text-[#C67A5A] flex items-center gap-1">☕ #디저트맛집 / #대형카페 (대화)</span>
                                        <span className="text-[#C67A5A]">38%</span>
                                    </div>
                                    <div className="w-full h-2 bg-[#FAF0EB] rounded-full overflow-hidden">
                                        <div className="h-full bg-[#C67A5A] rounded-full" style={{ width: '38%' }}></div>
                                    </div>
                                </div>
                            </div>
                            <div className="text-[12px] text-[#4E5968] font-bold flex items-center justify-between pt-3 border-t border-[#F2F4F6]">
                                <span>대표 획득 뱃지</span>
                                <span className="px-2.5 py-1 rounded-[6px] bg-[#F0F6F5] text-[#2E7D7A] border border-[#D1E6E4]/50">조용한 탐험가 🌲</span>
                            </div>
                        </div>
                    </div>

                    {/* 하단: 무드 뱃지 획득 리스트 */}
                    <div className="mt-4 pt-5 border-t border-[#F2F4F6]">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-bold text-[14px] text-[#191F28]">내 무드 뱃지 업적</h4>
                            <span className="text-[11.5px] text-[#8B95A1] font-semibold">활동에 따라 다양한 뱃지가 해금됩니다</span>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-[#F0F6F5] border border-[#D1E6E4] rounded-[20px] p-3.5 flex flex-col items-center text-center transition-transform hover:-translate-y-0.5 duration-300">
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[20px] shadow-sm mb-2">
                                    🌲
                                </div>
                                <p className="font-bold text-[12.5px] text-[#2E7D7A] mb-0.5">조용한 탐험가</p>
                                <span className="text-[10px] text-[#5C9E9B] font-bold">해금 완료</span>
                            </div>

                            <div className="bg-[#FAF0EB] border border-[#EAD5C3] rounded-[20px] p-3.5 flex flex-col items-center text-center transition-transform hover:-translate-y-0.5 duration-300">
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[20px] shadow-sm mb-2">
                                    ☕
                                </div>
                                <p className="font-bold text-[12.5px] text-[#C67A5A] mb-0.5">카페 마스터</p>
                                <span className="text-[10px] text-[#D48F70] font-bold">해금 완료</span>
                            </div>

                            <div className="bg-[#F7F6F3] border border-[#E8E6E1] rounded-[20px] p-3.5 flex flex-col items-center text-center relative overflow-hidden transition-transform hover:-translate-y-0.5 duration-300">
                                <div className="absolute inset-0 bg-black/[0.01] flex items-center justify-center z-10 pointer-events-none"></div>
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[20px] shadow-sm mb-2 opacity-50 relative">
                                    🍹
                                    <span className="absolute text-[11px] font-bold text-[#7F776F] -bottom-1 -right-1 bg-white/95 px-1 rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.1)]">50%</span>
                                </div>
                                <p className="font-bold text-[12.5px] text-[#7F776F] mb-0.5 opacity-60">야간 힙스터</p>
                                <span className="text-[10px] text-[#A09890] font-bold">진행 중</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. 설정 및 기타 메뉴 */}
                <div className="bg-white rounded-[28px] p-6 lg:p-8 border border-[#F2F4F6] shadow-sm">
                    <h3 className="font-bold text-[17px] text-[#191F28] mb-5 tracking-tight px-1">계정 설정 및 정보</h3>
                    
                    <div className="flex flex-col">
                        <button 
                            onClick={onAccountSettingsClick}
                            className="flex items-center justify-between w-full py-4 px-2 hover:bg-[#F9FAFB] rounded-[14px] transition-colors group text-left"
                        >
                            <span className="font-bold text-[15px] text-[#4E5968] group-hover:text-[#191F28] transition-colors">계정 설정</span>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[13px] text-[#8B95A1] font-semibold">계정 조회 및 수정</span>
                                <svg className="w-4 h-4 text-[#8B95A1]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </button>
                        <button 
                            onClick={onAppSettingsClick}
                            className="flex items-center justify-between w-full py-4 px-2 hover:bg-[#F9FAFB] rounded-[14px] transition-colors group text-left"
                        >
                            <span className="font-bold text-[15px] text-[#4E5968] group-hover:text-[#191F28] transition-colors">픽플 설정</span>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[13px] text-[#8B95A1] font-semibold">기본 폴더, 테마 등</span>
                                <svg className="w-4 h-4 text-[#8B95A1]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </button>
                        <div className="h-[1px] bg-[#F2F4F6] my-2"></div>
                        <button 
                            onClick={() => onShowTermsModal('terms')}
                            className="flex items-center justify-between w-full py-4 px-2 hover:bg-[#F9FAFB] rounded-[14px] transition-colors group text-left"
                        >
                            <span className="font-bold text-[15px] text-[#4E5968] group-hover:text-[#191F28] transition-colors">서비스 이용약관</span>
                            <svg className="w-4 h-4 text-[#8B95A1]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                        <button 
                            onClick={() => onShowTermsModal('privacy')}
                            className="flex items-center justify-between w-full py-4 px-2 hover:bg-[#F9FAFB] rounded-[14px] transition-colors group text-left"
                        >
                            <span className="font-bold text-[15px] text-[#4E5968] group-hover:text-[#191F28] transition-colors">개인정보 처리방침</span>
                            <svg className="w-4 h-4 text-[#8B95A1]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                        <div className="h-[1px] bg-[#F2F4F6] my-2"></div>
                        <button 
                            onClick={onLogout}
                            className="flex items-center justify-between w-full py-4 px-2 hover:bg-[#FFF0F0] rounded-[14px] transition-colors group text-left"
                        >
                            <span className="font-bold text-[15px] text-red-500">로그아웃</span>
                            <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
