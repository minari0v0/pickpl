import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '../../api/axios';
import { getProfileBgClass } from '../ui/Helpers';

interface AccountEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    nickname: string;
    profileImage: string;
    userEmail: string;
    onSave: (newNickname: string, newProfileImage: string) => Promise<void>;
    showToast: (msg: string, type?: 'success' | 'warning' | 'error') => void;
}

export default function AccountEditModal({
    isOpen,
    onClose,
    nickname,
    profileImage,
    userEmail,
    onSave,
    showToast
}: AccountEditModalProps) {
    const [tempNickname, setTempNickname] = useState('');
    const [selectedImage, setSelectedImage] = useState('');
    const [isNicknameChecked, setIsNicknameChecked] = useState(true);
    const [nicknameCheckMsg, setNicknameCheckMsg] = useState<{ text: string; isSuccess: boolean } | null>(null);

    const [activeAvatar, setActiveAvatar] = useState('/profile_cat.png');
    const [activeBg, setActiveBg] = useState('default');
    const [avatarTab, setAvatarTab] = useState<'default' | 'upload'>('default');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setTempNickname(nickname);
            setSelectedImage(profileImage);
            setIsNicknameChecked(true);
            setNicknameCheckMsg(null);

            const imgUrl = profileImage || "/profile_cat.png";
            let pureAvatar = "/profile_cat.png";
            let bgParam = "default";
            
            if (imgUrl.includes('profile_puppy')) pureAvatar = "/profile_puppy.png";
            else if (imgUrl.includes('profile_fox')) pureAvatar = "/profile_fox.png";
            else if (imgUrl.includes('profile_squrel')) pureAvatar = "/profile_squrel.png";
            
            if (imgUrl.includes('bg=sage')) bgParam = "sage";
            else if (imgUrl.includes('bg=peach')) bgParam = "peach";
            else if (imgUrl.includes('bg=sand')) bgParam = "sand";
            else if (imgUrl.includes('bg=coral')) bgParam = "coral";
            else if (imgUrl.includes('bg=silver')) bgParam = "silver";
            else if (imgUrl.includes('bg=bluegray')) bgParam = "bluegray";
            else if (imgUrl.includes('bg=lavender')) bgParam = "lavender";
            
            const isDefaultAvatar = imgUrl.includes('profile_cat') || imgUrl.includes('profile_puppy') || imgUrl.includes('profile_fox') || imgUrl.includes('profile_squrel');
            setAvatarTab(isDefaultAvatar ? 'default' : 'upload');
            
            setActiveAvatar(pureAvatar);
            setActiveBg(bgParam);
        }
    }, [isOpen, nickname, profileImage]);

    if (!isOpen) return null;

    const handleCheckNickname = async () => {
        if (!tempNickname.trim()) {
            setNicknameCheckMsg({ text: "닉네임을 입력해주세요.", isSuccess: false });
            return;
        }
        if (tempNickname.trim() === nickname) {
            setIsNicknameChecked(true);
            setNicknameCheckMsg({ text: "현재 사용 중인 닉네임입니다.", isSuccess: true });
            return;
        }
        try {
            const res = await axiosInstance.get(`/auth/check-nickname?nickname=${encodeURIComponent(tempNickname.trim())}`);
            if (res.data === true) {
                setIsNicknameChecked(true);
                setNicknameCheckMsg({ text: "사용 가능한 닉네임입니다.", isSuccess: true });
            } else {
                setIsNicknameChecked(false);
                setNicknameCheckMsg({ text: "이미 사용 중인 닉네임입니다.", isSuccess: false });
            }
        } catch (err) {
            console.error("닉네임 중복 확인 실패:", err);
            setNicknameCheckMsg({ text: "중복 확인 중 오류가 발생했습니다.", isSuccess: false });
        }
    };

    const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setTempNickname(val);
        if (val.trim() === nickname) {
            setIsNicknameChecked(true);
            setNicknameCheckMsg(null);
        } else {
            setIsNicknameChecked(false);
            setNicknameCheckMsg(null);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64data = reader.result as string;
                const newUrl = activeBg === 'default' ? base64data : `${base64data}?bg=${activeBg}`;
                setSelectedImage(newUrl);
                showToast("프로필 이미지가 임시로 선택되었습니다. 저장을 누르면 적용됩니다.");
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAvatarChange = (avatar: string) => {
        setActiveAvatar(avatar);
        const newUrl = activeBg === 'default' ? avatar : `${avatar}?bg=${activeBg}`;
        setSelectedImage(newUrl);
    };

    const handleBgChange = (bg: string) => {
        setActiveBg(bg);
        const pureImage = selectedImage ? selectedImage.split('?')[0] : activeAvatar;
        const newUrl = bg === 'default' ? pureImage : `${pureImage}?bg=${bg}`;
        setSelectedImage(newUrl);
    };

    const handleSaveProfile = async () => {
        if (!tempNickname.trim()) {
            showToast("닉네임을 입력해주세요.", "warning");
            return;
        }
        if (tempNickname.trim() !== nickname && !isNicknameChecked) {
            showToast("닉네임 중복 확인을 진행해주세요.", "warning");
            return;
        }
        try {
            await onSave(tempNickname.trim(), selectedImage);
            onClose();
        } catch (err: any) {
            console.error("프로필 수정 실패:", err);
            showToast(err.response?.data?.message || "프로필 수정 중 오류가 발생했습니다.", "error");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md animate-fade-in p-4" onClick={onClose}>
            <div className="bg-white w-[92%] max-w-[500px] rounded-[32px] p-6 lg:p-8 flex flex-col shadow-2xl animate-scale-up" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6 shrink-0">
                    <h3 className="font-bold text-[20px] lg:text-[22px] text-[#191F28]">계정 설정</h3>
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
                    {/* Profile Pic Loader & Style Selectors */}
                    <div className="flex flex-col items-center">
                        <div className={`w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-[0_4px_15px_rgba(0,0,0,0.06)] transition-colors duration-300 relative flex items-center justify-center ${getProfileBgClass(selectedImage)}`}>
                            <img src={selectedImage ? selectedImage.split('?')[0] : "/profile_cat.png"} className="w-full h-full object-cover" alt="Profile Character" />
                        </div>
                        
                        {/* 탭 선택 버튼 (기본 캐릭터 배경 vs 직접 업로드) */}
                        <div className="flex gap-2 bg-[#F2F4F6] p-1 rounded-full mt-4 w-60 shrink-0">
                            <button 
                                type="button"
                                onClick={() => setAvatarTab('default')}
                                className={`flex-1 py-1.5 rounded-full text-[12px] font-bold transition-all ${avatarTab === 'default' ? 'bg-white text-[#191F28] shadow-sm' : 'text-[#8B95A1] hover:text-[#4E5968]'}`}
                            >
                                기본 캐릭터 배경
                            </button>
                            <button 
                                type="button"
                                onClick={() => setAvatarTab('upload')}
                                className={`flex-1 py-1.5 rounded-full text-[12px] font-bold transition-all ${avatarTab === 'upload' ? 'bg-white text-[#191F28] shadow-sm' : 'text-[#8B95A1] hover:text-[#4E5968]'}`}
                            >
                                직접 사진 업로드
                            </button>
                        </div>
                        
                        {/* 탭 콘텐츠 영역 */}
                        <div className="flex flex-col gap-4 mt-4 w-full">
                            {avatarTab === 'default' ? (
                                <div className="flex flex-col gap-4 bg-[#F9FAFB] p-4 rounded-[24px] border border-[#F2F4F6] w-full">
                                    {/* 캐릭터 아바타 선택 */}
                                    <div>
                                        <p className="text-[12px] font-bold text-[#8B95A1] mb-2.5 pl-1 text-center">캐릭터 아바타 선택</p>
                                        <div className="flex gap-4 justify-center">
                                            {[
                                                { id: 'cat', path: '/profile_cat.png', label: '고양이' },
                                                { id: 'puppy', path: '/profile_puppy.png', label: '강아지' },
                                                { id: 'fox', path: '/profile_fox.png', label: '여우' },
                                                { id: 'squrel', path: '/profile_squrel.png', label: '다람쥐' }
                                            ].map(character => (
                                                <button
                                                    key={character.id}
                                                    type="button"
                                                    onClick={() => handleAvatarChange(character.path)}
                                                    className={`w-14 h-14 rounded-full overflow-hidden border-2 bg-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 ${activeAvatar === character.path ? 'border-orange-500 shadow-md ring-2 ring-orange-500/20' : 'border-gray-200'}`}
                                                    title={character.label}
                                                >
                                                    <img src={character.path} alt={character.label} className="w-full h-full object-cover" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center bg-[#F9FAFB] p-5 rounded-[24px] border border-[#F2F4F6] w-full">
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        onChange={handleImageUpload} 
                                        accept="image/*" 
                                        className="hidden" 
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="px-5 py-3 rounded-[16px] bg-[#191F28] hover:bg-black text-white hover:scale-105 active:scale-95 transition-all text-[13px] font-bold shadow-sm"
                                    >
                                        기기에서 사진 선택하기
                                    </button>
                                </div>
                            )}

                            {/* 배경 테마 선택 (공통으로 노출) */}
                            <div className="flex flex-col gap-4 bg-[#F9FAFB] p-4 rounded-[24px] border border-[#F2F4F6] w-full">
                                <div>
                                    <p className="text-[12px] font-bold text-[#8B95A1] mb-2.5 pl-1 text-center">배경 테마 선택</p>
                                    <div className="flex flex-wrap gap-2.5 justify-center px-1">
                                        {[
                                            { id: 'default', label: '기본 화이트', bgClass: 'bg-white border-gray-200' },
                                            { id: 'silver', label: '실버 그레이', bgClass: 'bg-[#F2F4F6] border-[#E5E8EB]' },
                                            { id: 'bluegray', label: '모던 블루그레이', bgClass: 'bg-[#ECEFF2] border-[#DDE1E6]' },
                                            { id: 'lavender', label: '시크 라벤더', bgClass: 'bg-[#F1F0F5] border-[#E3E1E8]' },
                                            { id: 'sage', label: '차분한 세이지', bgClass: 'bg-[#F0F6F5] border-[#D1E6E4]' },
                                            { id: 'peach', label: '코지 피치', bgClass: 'bg-[#FFF4EE] border-[#FFD2B8]' },
                                            { id: 'sand', label: '따뜻한 샌드', bgClass: 'bg-[#F7F6F3] border-[#E8E6E1]' },
                                            { id: 'coral', label: '달콤한 코랄', bgClass: 'bg-[#FFF0F0] border-[#FFD5D5]' },
                                        ].map(style => (
                                            <button
                                                key={style.id}
                                                type="button"
                                                onClick={() => handleBgChange(style.id)}
                                                className={`w-8 h-8 rounded-full border-[1.5px] transition-all flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 ${style.bgClass} ${activeBg === style.id ? 'ring-2 ring-orange-500 ring-offset-2 scale-105 shadow-sm' : 'ring-0'}`}
                                                title={style.label}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Email Address Read-Only */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[13px] font-bold text-[#8B95A1] pl-1">이메일 주소 (수정 불가)</label>
                        <div className="w-full bg-[#F2F4F6] text-[#8B95A1] rounded-[16px] px-5 py-4 text-[15px] font-bold border border-transparent select-none cursor-not-allowed">
                            {userEmail || "email@pickpl.com"}
                        </div>
                    </div>

                    {/* Nickname Input & Dup Check */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[13px] font-bold text-[#8B95A1] pl-1">닉네임</label>
                        <div className="flex gap-3">
                            <input 
                                type="text" 
                                placeholder="닉네임 입력" 
                                value={tempNickname} 
                                onChange={handleNicknameChange}
                                className="flex-1 bg-[#F9FAFB] border border-[#E5E8EB] rounded-[16px] px-5 py-4 text-[15px] font-bold focus:outline-none focus:border-orange-500 focus:bg-white transition-colors"
                            />
                            <button 
                                onClick={handleCheckNickname}
                                disabled={tempNickname.trim() === nickname && isNicknameChecked}
                                className={`px-5 py-4 rounded-[16px] font-bold text-[13px] transition-all whitespace-nowrap active:scale-95 ${tempNickname.trim() === nickname && isNicknameChecked ? 'bg-[#F2F4F6] text-[#B0B8C1] cursor-not-allowed' : 'bg-orange-500/10 text-orange-600 hover:bg-orange-500/20'}`}
                            >
                                중복 확인
                            </button>
                        </div>
                        {nicknameCheckMsg && (
                            <p className={`text-[12px] font-bold mt-1.5 pl-1 ${nicknameCheckMsg.isSuccess ? 'text-[#2E7D7A]' : 'text-red-500'}`}>
                                {nicknameCheckMsg.text}
                            </p>
                        )}
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
                        onClick={handleSaveProfile} 
                        disabled={tempNickname.trim() !== nickname && !isNicknameChecked}
                        className={`flex-1 py-4 rounded-[16px] font-bold text-[15px] transition-all shadow-sm ${tempNickname.trim() !== nickname && !isNicknameChecked ? 'bg-[#E5E8EB] text-[#B0B8C1] cursor-not-allowed' : 'bg-[#191F28] text-white hover:bg-black'}`}
                    >
                        저장
                    </button>
                </div>
            </div>
        </div>
    );
}
