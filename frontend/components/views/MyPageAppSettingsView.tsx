import React, { useState, useEffect, useRef } from 'react';

interface MyPageAppSettingsViewProps {
    foldersMap: { [key: string]: any[] };
    defaultScrapFolder: string;
    appTheme: string;
    newThemeNotification: boolean;
    plannerNotification: boolean;
    onSave: (folder: string, theme: string, newThemeNotif: boolean, plannerNotif: boolean) => void;
}

export default function MyPageAppSettingsView({
    foldersMap,
    defaultScrapFolder,
    appTheme,
    newThemeNotification,
    plannerNotification,
    onSave
}: MyPageAppSettingsViewProps) {
    // 커스텀 드롭다운을 위한 상태
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // 외부 클릭 시 드롭다운 닫기
    useEffect(() => {
        const handleOutsideClick = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, []);

    // 설정 변경 즉시 부모 콜백 호출 (Auto-save)
    const handleFolderSelect = (folderName: string) => {
        onSave(folderName, appTheme, newThemeNotification, plannerNotification);
        setDropdownOpen(false);
    };

    const handleThemeSelect = (themeName: string) => {
        onSave(defaultScrapFolder, themeName, newThemeNotification, plannerNotification);
    };

    const handleNewThemeNotifToggle = () => {
        onSave(defaultScrapFolder, appTheme, !newThemeNotification, plannerNotification);
    };

    const handlePlannerNotifToggle = () => {
        onSave(defaultScrapFolder, appTheme, newThemeNotification, !plannerNotification);
    };

    // 폴더 목록 가져오기
    const folderList = Object.keys(foldersMap);
    if (!folderList.includes("기본 저장소")) {
        folderList.unshift("기본 저장소");
    }

    return (
        <div className="bg-white rounded-[28px] lg:rounded-[32px] p-6 lg:p-8 border border-[#F2F4F6] shadow-sm flex flex-col gap-6 relative overflow-hidden animate-fade-in w-full shrink-0">
            <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/[0.01] rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="pb-4 border-b border-[#F2F4F6] flex justify-between items-center w-full">
                <div>
                    <span className="px-2.5 py-1 rounded-[8px] bg-[#F0F6F5] text-[#2E7D7A] text-[11px] font-bold tracking-tight border border-[#D1E6E4]/50">어플리케이션 설정</span>
                    <h3 className="font-extrabold text-[19px] text-[#191F28] mt-1.5 tracking-tight">픽플 설정</h3>
                </div>
            </div>

            <div className="flex flex-col gap-6 w-full">
                {/* 기본 스크랩 폴더 설정 (커스텀 드롭다운) */}
                <div className="flex flex-col gap-1.5" ref={dropdownRef}>
                    <label className="text-[13px] font-bold text-[#8B95A1] pl-1">기본 스크랩 폴더 설정</label>
                    <div className="relative max-w-[400px] w-full">
                        {/* 드롭다운 Trigger 버튼 */}
                        <button
                            type="button"
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="w-full bg-[#F9FAFB] hover:bg-[#F2F4F6] border border-[#E5E8EB] rounded-[16px] px-5 py-4 text-[15px] font-bold text-left focus:outline-none transition-colors flex items-center justify-between"
                        >
                            <span>{defaultScrapFolder || "기본 저장소"}</span>
                            <svg className={`w-4 h-4 text-[#8B95A1] transition-transform duration-200 ${dropdownOpen ? 'rotate-180 text-orange-500' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {/* 드롭다운 List */}
                        {dropdownOpen && (
                            <div className="absolute left-0 right-0 z-50 mt-2 bg-white border border-[#F2F4F6] rounded-[20px] shadow-[0_12px_40px_rgba(0,0,0,0.08)] overflow-hidden animate-scale-up">
                                <div className="max-h-[220px] overflow-y-auto no-scrollbar py-1">
                                    {folderList.map(folder => (
                                        <button
                                            key={folder}
                                            type="button"
                                            onClick={() => handleFolderSelect(folder)}
                                            className={`w-full text-left px-5 py-3.5 text-[14px] font-bold transition-colors flex items-center justify-between ${defaultScrapFolder === folder ? 'bg-orange-50/60 text-orange-600' : 'text-[#4E5968] hover:bg-[#F9FAFB] hover:text-[#191F28]'}`}
                                        >
                                            <span>{folder}</span>
                                            {defaultScrapFolder === folder && (
                                                <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 픽플 테마 설정 */}
                <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-bold text-[#8B95A1] pl-1">픽플 어플리케이션 테마</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full">
                        {[
                            { name: "기본 테마", color: "bg-white", border: "border-[#E5E8EB]" },
                            { name: "차분한 샌드", color: "bg-[#F7F6F3]", border: "border-[#E8E6E1]" },
                            { name: "세이지 그린", color: "bg-[#F0F6F5]", border: "border-[#D1E6E4]" },
                            { name: "웜 코랄", color: "bg-[#FFF0F0]", border: "border-[#FFD5D5]" }
                        ].map(theme => (
                            <button
                                key={theme.name}
                                type="button"
                                onClick={() => handleThemeSelect(theme.name)}
                                className={`flex items-center gap-3 p-4 rounded-[20px] border-[1.5px] transition-all text-[13.5px] font-bold active:scale-95 text-left w-full ${appTheme === theme.name ? 'border-orange-500 bg-orange-50/40 shadow-sm' : 'border-[#E5E8EB] bg-white hover:bg-[#F9FAFB]'}`}
                            >
                                <div className={`w-5.5 h-5.5 rounded-full border ${theme.color} ${theme.border} shrink-0`} />
                                <span className={appTheme === theme.name ? 'text-orange-600' : 'text-[#4E5968]'}>{theme.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 알림 수신 설정 */}
                <div className="flex flex-col gap-4 border-t border-[#F2F4F6] pt-5 w-full">
                    <h4 className="text-[13px] font-bold text-[#8B95A1] pl-1">알림 수신 설정</h4>
                    
                    <div className="flex items-center justify-between py-1.5 px-1 max-w-[600px] w-full gap-4">
                        <div>
                            <p className="font-bold text-[14.5px] text-[#4E5968]">새로운 추천 테마 알림</p>
                            <p className="text-[11.5px] text-[#8B95A1] font-semibold mt-0.5">날씨, 계절 및 감성 공간 추천 푸시 알림 수신</p>
                        </div>
                        <button
                            type="button"
                            onClick={handleNewThemeNotifToggle}
                            className={`w-12 h-6.5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none flex items-center shrink-0 ${newThemeNotification ? 'bg-orange-500 justify-end' : 'bg-[#E5E8EB] justify-start'}`}
                        >
                            <div className="w-5.5 h-5.5 rounded-full bg-white shadow-sm transition-transform duration-200" />
                        </button>
                    </div>
                    
                    <div className="flex items-center justify-between py-1.5 px-1 max-w-[600px] w-full gap-4">
                        <div>
                            <p className="font-bold text-[14.5px] text-[#4E5968]">공동 플래너 활동 알림</p>
                            <p className="text-[11.5px] text-[#8B95A1] font-semibold mt-0.5">친구와 공유 중인 플래너 실시간 변동 알림 수신</p>
                        </div>
                        <button
                            type="button"
                            onClick={handlePlannerNotifToggle}
                            className={`w-12 h-6.5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none flex items-center shrink-0 ${plannerNotification ? 'bg-orange-500 justify-end' : 'bg-[#E5E8EB] justify-start'}`}
                        >
                            <div className="w-5.5 h-5.5 rounded-full bg-white shadow-sm transition-transform duration-200" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
