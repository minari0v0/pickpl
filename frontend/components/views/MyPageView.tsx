import React, { useState } from 'react';
import { getProfileBgClass } from '../ui/Helpers';
import MyPageAccountSettingsView from './MyPageAccountSettingsView';
import MyPageAppSettingsView from './MyPageAppSettingsView';

interface MyPageViewProps {
    hidden: boolean;
    nickname: string;
    profileImage: string;
    userEmail: string;
    provider: string;
    emailVerified: boolean;
    linkedProviders: string[];
    refreshUserInfo: () => Promise<void>;
    scrapsData: any[] | undefined;
    foldersMap: { [key: string]: any[] };
    onViewChange: (view: string) => void;
    setSelectedFolder: (folder: string | null) => void;
    onAccountSettingsClick: () => void;
    onAppSettingsClick: () => void;
    onLogout: () => void;
    onShowTermsModal: (type: 'terms' | 'privacy' | null) => void;
    showToast: (msg: string, type?: 'success' | 'warning' | 'error') => void;

    // 추가된 앱 설정 Props
    defaultScrapFolder: string;
    appTheme: string;
    newThemeNotification: boolean;
    plannerNotification: boolean;
    onSaveSettings: (folder: string, theme: string, newThemeNotif: boolean, plannerNotif: boolean) => void;
}

export default function MyPageView({
    hidden,
    nickname,
    profileImage,
    userEmail,
    provider,
    emailVerified,
    linkedProviders,
    refreshUserInfo,
    scrapsData,
    foldersMap,
    onViewChange,
    setSelectedFolder,
    onAccountSettingsClick,
    onAppSettingsClick,
    onLogout,
    onShowTermsModal,
    showToast,

    // 설정 데이터 Props 바인딩
    defaultScrapFolder,
    appTheme,
    newThemeNotification,
    plannerNotification,
    onSaveSettings
}: MyPageViewProps) {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'general' | 'account'>('dashboard');

    const handleProfileEditClick = () => {
        if (provider === 'LOCAL' && !emailVerified) {
            showToast("이메일 인증을 완료해야 프로필 수정을 이용할 수 있습니다.", "warning");
            setActiveTab('account');
        } else {
            onAccountSettingsClick();
        }
    };

    return (
        <div 
            style={{ display: hidden ? 'none' : 'flex' }} 
            className="flex-1 h-full w-full bg-[#F9FAFB] animate-slide-in-right lg:animate-fade-in flex flex-col absolute inset-0 z-30 items-center overflow-hidden"
        >
            {/* 헤더 */}
            <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-[#F2F4F6]/50 px-6 py-4 lg:px-10 lg:py-6 flex items-center w-full justify-between shrink-0">
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

            {/* 2열 스플릿 레이아웃 (PC 뷰포트에서는 내부 칼럼들이 각각 스크롤됨) */}
            <div className="w-full flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden lg:max-w-[1100px] px-5 lg:px-8 py-6 lg:py-8 gap-6 lg:gap-8 pb-[120px] lg:pb-8 min-h-0 lg:h-[calc(100%-90px)]">
                {/* 좌측 칼럼: 프로필 카드 & 탭 메뉴 */}
                <div className="w-full lg:w-[320px] shrink-0 flex flex-col gap-6 lg:h-full lg:overflow-y-auto no-scrollbar">
                    {/* 1. 프로필 카드 */}
                    <div className="bg-white rounded-[28px] lg:rounded-[32px] p-6 lg:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.015)] border border-[#F2F4F6] flex flex-col items-center text-center gap-5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl"></div>
                        <button 
                            onClick={handleProfileEditClick}
                            className="absolute top-4 right-4 px-3 py-1.5 rounded-[12px] bg-[#F2F4F6] hover:bg-[#E5E8EB] active:scale-95 text-[#4E5968] font-bold text-[12px] transition-all flex items-center gap-1 shadow-sm"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            <span>수정</span>
                        </button>
                        <div className={`w-20 h-20 lg:w-24 lg:h-24 rounded-full overflow-hidden shrink-0 border-4 border-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-colors duration-300 ${getProfileBgClass(profileImage)}`}>
                            <img src={profileImage ? profileImage.split('?')[0] : "/profile_cat.png"} alt="profile" className="w-full h-full object-cover" />
                        </div>
                        <div className="w-full flex flex-col items-center">
                            <div className="flex items-center gap-1.5 mb-1.5 justify-center">
                                <h2 className="text-[20px] lg:text-[22px] font-extrabold text-[#191F28] tracking-tight">{nickname}</h2>
                                <span className="px-2 py-0.5 rounded-[8px] bg-[#F0F6F5] text-[#2E7D7A] border border-[#D1E6E4]/50 text-[10px] font-bold">취향 탐험가</span>
                            </div>
                            <p className="text-[13px] font-semibold text-[#8B95A1] mb-3 break-all">{userEmail}</p>
                            <p className="text-[13px] font-medium text-[#8B95A1] leading-relaxed max-w-[240px]">나만의 특별한 무드를 담은 취향 저장소를 만들고 있습니다.</p>
                        </div>
                    </div>

                    {/* 3. 메뉴 및 탭 전환 */}
                    <div className="bg-white rounded-[28px] p-6 lg:p-7 border border-[#F2F4F6] shadow-sm flex flex-col gap-1">
                        <h3 className="font-bold text-[13px] text-[#8B95A1] mb-3.5 tracking-wider px-1">계정 설정 및 정보</h3>
                        
                        <div className="flex flex-col gap-1.5">
                            {/* 📊 내 대시보드 탭 */}
                            <button 
                                onClick={() => setActiveTab('dashboard')}
                                className={`flex items-center justify-between w-full py-3.5 px-4 rounded-[14px] transition-all group text-left ${activeTab === 'dashboard' ? 'bg-[#F2F4F6] text-[#191F28] font-bold shadow-sm' : 'text-[#4E5968] hover:bg-[#F9FAFB] hover:text-[#191F28] font-medium'}`}
                            >
                                <span className="text-[14.5px] transition-colors flex items-center gap-3">
                                    <svg className="w-5 h-5 text-[#8B95A1] group-hover:text-[#191F28] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    <span>내 대시보드</span>
                                </span>
                                <svg className={`w-3.5 h-3.5 transition-transform ${activeTab === 'dashboard' ? 'text-[#191F28] translate-x-0.5' : 'text-[#8B95A1] group-hover:translate-x-0.5'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>

                            {/* ⚙️ 픽플 설정 탭 */}
                            <button 
                                onClick={() => setActiveTab('general')}
                                className={`flex items-center justify-between w-full py-3.5 px-4 rounded-[14px] transition-all group text-left ${activeTab === 'general' ? 'bg-[#F2F4F6] text-[#191F28] font-bold shadow-sm' : 'text-[#4E5968] hover:bg-[#F9FAFB] hover:text-[#191F28] font-medium'}`}
                            >
                                <span className="text-[14.5px] transition-colors flex items-center gap-3">
                                    <svg className="w-5 h-5 text-[#8B95A1] group-hover:text-[#191F28] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span>픽플 설정</span>
                                </span>
                                <svg className={`w-3.5 h-3.5 transition-transform ${activeTab === 'general' ? 'text-[#191F28] translate-x-0.5' : 'text-[#8B95A1] group-hover:translate-x-0.5'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>

                            {/* 👤 계정 설정 탭 */}
                            <button 
                                onClick={() => setActiveTab('account')}
                                className={`flex items-center justify-between w-full py-3.5 px-4 rounded-[14px] transition-all group text-left ${activeTab === 'account' ? 'bg-[#F2F4F6] text-[#191F28] font-bold shadow-sm' : 'text-[#4E5968] hover:bg-[#F9FAFB] hover:text-[#191F28] font-medium'}`}
                            >
                                <span className="text-[14.5px] transition-colors flex items-center gap-3">
                                    <svg className="w-5 h-5 text-[#8B95A1] group-hover:text-[#191F28] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <span>계정 설정</span>
                                </span>
                                <svg className={`w-3.5 h-3.5 transition-transform ${activeTab === 'account' ? 'text-[#191F28] translate-x-0.5' : 'text-[#8B95A1] group-hover:translate-x-0.5'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>

                            <div className="h-[1px] bg-[#F2F4F6] my-2.5"></div>

                            {/* 서비스 이용약관 (모달) */}
                            <button 
                                onClick={() => onShowTermsModal('terms')}
                                className="flex items-center justify-between w-full py-3 px-4 hover:bg-[#F9FAFB] rounded-[14px] text-[#4E5968] hover:text-[#191F28] transition-colors font-medium text-left group"
                            >
                                <span className="text-[14px] flex items-center gap-3">
                                    <svg className="w-4.5 h-4.5 text-[#8B95A1] group-hover:text-[#191F28] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span>서비스 이용약관</span>
                                </span>
                                <svg className="w-3.5 h-3.5 text-[#8B95A1] group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                                </svg>
                            </button>

                            {/* 개인정보 처리방침 (모달) */}
                            <button 
                                onClick={() => onShowTermsModal('privacy')}
                                className="flex items-center justify-between w-full py-3 px-4 hover:bg-[#F9FAFB] rounded-[14px] text-[#4E5968] hover:text-[#191F28] transition-colors font-medium text-left group"
                            >
                                <span className="text-[14px] flex items-center gap-3">
                                    <svg className="w-4.5 h-4.5 text-[#8B95A1] group-hover:text-[#191F28] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    <span>개인정보 처리방침</span>
                                </span>
                                <svg className="w-3.5 h-3.5 text-[#8B95A1] group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                                </svg>
                            </button>

                            <div className="h-[1px] bg-[#F2F4F6] my-2.5"></div>

                            {/* 로그아웃 */}
                            <button 
                                onClick={onLogout}
                                className="flex items-center justify-between w-full py-3.5 px-4 hover:bg-[#FFF0F0] rounded-[14px] text-red-500 font-bold transition-colors text-left group"
                            >
                                <span className="text-[14.5px] flex items-center gap-3">
                                    <svg className="w-5 h-5 text-red-400 group-hover:text-red-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    <span>로그아웃</span>
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* 우측 칼럼: 활성 탭에 따른 컴포넌트 스위칭 (PC 뷰포트에서 독립 스크롤) */}
                <div className="flex-1 lg:h-full lg:overflow-y-auto flex flex-col gap-6 min-w-0 pr-1 pb-[100px] lg:pb-0 min-h-0 no-scrollbar">
                    {/* 1. 내 대시보드 탭 내용 */}
                    {activeTab === 'dashboard' && (
                        <div className="flex flex-col gap-6 w-full animate-fade-in shrink-0">
                            {/* 미인증 경고 배너 */}
                            {provider === 'LOCAL' && !emailVerified && (
                                <div 
                                    onClick={() => setActiveTab('account')}
                                    className="w-full bg-[#FFF0EB] hover:bg-[#FFE5DC] border border-[#FFD2C4] rounded-[20px] p-4 flex items-center justify-between cursor-pointer transition-all duration-200 shadow-sm group"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-[20px]">⚠️</span>
                                        <div className="text-left">
                                            <p className="font-bold text-[14px] text-[#FF5F2E]">이메일 미인증 안내</p>
                                            <p className="text-[12.5px] text-[#8C5240] font-medium mt-0.5">안전한 프로필 설정 및 소셜 통합 연동을 위해 인증을 완료해 주세요.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 text-[#FF5F2E] font-bold text-[13px] shrink-0 group-hover:translate-x-1 transition-transform">
                                        <span>인증하러 가기</span>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            )}

                            {/* 내 취향 & 픽플 대시보드 통합 컴포넌트 */}
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
                        </div>
                    )}

                    {/* 2. 일반 설정 탭 내용 */}
                    {activeTab === 'general' && (
                        <MyPageAppSettingsView
                            foldersMap={foldersMap}
                            defaultScrapFolder={defaultScrapFolder}
                            appTheme={appTheme}
                            newThemeNotification={newThemeNotification}
                            plannerNotification={plannerNotification}
                            onSave={onSaveSettings}
                        />
                    )}

                    {/* 3. 계정 설정 탭 내용 (가입정보/로그인기록/비밀번호 등) */}
                    <MyPageAccountSettingsView
                        hidden={activeTab !== 'account'}
                        userEmail={userEmail}
                        provider={provider}
                        emailVerified={emailVerified}
                        linkedProviders={linkedProviders}
                        refreshUserInfo={refreshUserInfo}
                        onLogout={onLogout}
                        showToast={showToast}
                    />
                </div>
            </div>
        </div>
    );
}
