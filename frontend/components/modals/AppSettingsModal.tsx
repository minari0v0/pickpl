import React, { useState, useEffect } from 'react';

interface AppSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    foldersMap: { [key: string]: any[] };
    defaultScrapFolder: string;
    appTheme: string;
    newThemeNotification: boolean;
    plannerNotification: boolean;
    onSave: (folder: string, theme: string, newThemeNotif: boolean, plannerNotif: boolean) => void;
}

export default function AppSettingsModal({
    isOpen,
    onClose,
    foldersMap,
    defaultScrapFolder,
    appTheme,
    newThemeNotification,
    plannerNotification,
    onSave
}: AppSettingsModalProps) {
    const [tempFolder, setTempFolder] = useState(defaultScrapFolder);
    const [tempTheme, setTempTheme] = useState(appTheme);
    const [tempNewThemeNotif, setTempNewThemeNotif] = useState(newThemeNotification);
    const [tempPlannerNotif, setTempPlannerNotif] = useState(plannerNotification);

    useEffect(() => {
        if (isOpen) {
            setTempFolder(defaultScrapFolder);
            setTempTheme(appTheme);
            setTempNewThemeNotif(newThemeNotification);
            setTempPlannerNotif(plannerNotification);
        }
    }, [isOpen, defaultScrapFolder, appTheme, newThemeNotification, plannerNotification]);

    if (!isOpen) return null;

    const handleSave = () => {
        onSave(tempFolder, tempTheme, tempNewThemeNotif, tempPlannerNotif);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md animate-fade-in p-4" onClick={onClose}>
            <div className="bg-white w-[92%] max-w-[500px] rounded-[32px] p-6 lg:p-8 flex flex-col shadow-2xl animate-scale-up" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6 shrink-0">
                    <h3 className="font-bold text-[20px] lg:text-[22px] text-[#191F28]">픽플 설정</h3>
                    <button 
                        onClick={onClose} 
                        className="p-2 text-[#8B95A1] hover:text-[#191F28] transition-colors rounded-full hover:bg-[#F2F4F6]"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-6 py-2">
                    {/* Default Scrap Folder Dropdown */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[13px] font-bold text-[#8B95A1] pl-1">기본 스크랩 폴더 설정</label>
                        <div className="relative">
                            <select 
                                value={tempFolder} 
                                onChange={(e) => setTempFolder(e.target.value)}
                                className="w-full bg-[#F9FAFB] border border-[#E5E8EB] rounded-[16px] px-5 py-4 text-[15px] font-bold focus:outline-none focus:border-orange-500 focus:bg-white transition-colors appearance-none cursor-pointer pr-10"
                            >
                                {(() => {
                                    const folderList = Object.keys(foldersMap);
                                    if (!folderList.includes("기본 저장소")) {
                                        folderList.unshift("기본 저장소");
                                    }
                                    return folderList.map(folder => (
                                        <option key={folder} value={folder}>{folder}</option>
                                    ));
                                })()}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[#8B95A1]">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Vibe Theme Buttons Grid */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[13px] font-bold text-[#8B95A1] pl-1">픽플 어플리케이션 테마</label>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { name: "기본 테마", color: "bg-white", border: "border-[#E5E8EB]" },
                                { name: "차분한 샌드", color: "bg-[#F7F6F3]", border: "border-[#E8E6E1]" },
                                { name: "세이지 그린", color: "bg-[#F0F6F5]", border: "border-[#D1E6E4]" },
                                { name: "웜 코랄", color: "bg-[#FFF0F0]", border: "border-[#FFD5D5]" }
                            ].map(theme => (
                                <button
                                    key={theme.name}
                                    type="button"
                                    onClick={() => setTempTheme(theme.name)}
                                    className={`flex items-center gap-3 p-4 rounded-[20px] border-[1.5px] transition-all text-[13.5px] font-bold active:scale-95 text-left ${tempTheme === theme.name ? 'border-orange-500 bg-orange-50/40 shadow-sm' : 'border-[#E5E8EB] bg-white hover:bg-[#F9FAFB]'}`}
                                >
                                    <div className={`w-5.5 h-5.5 rounded-full border ${theme.color} ${theme.border} shrink-0`} />
                                    <span className={tempTheme === theme.name ? 'text-orange-600' : 'text-[#4E5968]'}>{theme.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Notification Settings */}
                    <div className="flex flex-col gap-4 border-t border-[#F2F4F6] pt-5">
                        <h4 className="text-[13px] font-bold text-[#8B95A1] pl-1">알림 수신 설정</h4>
                        
                        <div className="flex items-center justify-between py-1 px-1">
                            <div>
                                <p className="font-bold text-[14.5px] text-[#4E5968]">새로운 추천 테마 알림</p>
                                <p className="text-[11.5px] text-[#8B95A1] font-semibold mt-0.5">날씨, 계절 및 감성 공간 추천 푸시 알림 수신</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setTempNewThemeNotif(!tempNewThemeNotif)}
                                className={`w-12 h-6.5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none flex items-center ${tempNewThemeNotif ? 'bg-orange-500 justify-end' : 'bg-[#E5E8EB] justify-start'}`}
                            >
                                <div className="w-5.5 h-5.5 rounded-full bg-white shadow-sm transition-transform duration-200" />
                            </button>
                        </div>
                        
                        <div className="flex items-center justify-between py-1 px-1">
                            <div>
                                <p className="font-bold text-[14.5px] text-[#4E5968]">공동 플래너 활동 알림</p>
                                <p className="text-[11.5px] text-[#8B95A1] font-semibold mt-0.5">친구와 공유 중인 플래너 실시간 변동 알림 수신</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setTempPlannerNotif(!tempPlannerNotif)}
                                className={`w-12 h-6.5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none flex items-center ${tempPlannerNotif ? 'bg-orange-500 justify-end' : 'bg-[#E5E8EB] justify-start'}`}
                            >
                                <div className="w-5.5 h-5.5 rounded-full bg-white shadow-sm transition-transform duration-200" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 mt-6 shrink-0">
                    <button 
                        onClick={onClose} 
                        className="flex-1 py-4 rounded-[16px] bg-[#F2F4F6] text-[#4E5968] font-bold text-[15px] hover:bg-[#E5E8EB] transition-colors"
                    >
                        취소
                    </button>
                    <button 
                        onClick={handleSave} 
                        className="flex-1 py-4 rounded-[16px] bg-[#191F28] text-white font-bold text-[15px] hover:bg-black transition-colors shadow-sm"
                    >
                        저장
                    </button>
                </div>
            </div>
        </div>
    );
}
