"use client";

import React from 'react';

interface TermsAndPrivacyModalProps {
    isOpen: boolean;
    type: 'terms' | 'privacy' | null;
    onClose: () => void;
}

export default function TermsAndPrivacyModal({ isOpen, type, onClose }: TermsAndPrivacyModalProps) {
    if (!isOpen || !type) return null;

    return (
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-md animate-fade-in p-4" 
            onClick={onClose}
        >
            <div 
                className="bg-white w-[92%] max-w-[600px] h-[75vh] rounded-[32px] p-6 lg:p-8 flex flex-col shadow-2xl animate-scale-up" 
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-5 shrink-0">
                    <h3 className="font-bold text-[20px] lg:text-[22px] text-[#191F28]">
                        {type === 'terms' ? '서비스 이용약관' : '개인정보 처리방침'}
                    </h3>
                    <button 
                        onClick={onClose} 
                        className="p-2 text-[#8B95A1] hover:text-[#191F28] transition-colors rounded-full hover:bg-[#F2F4F6]"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto no-scrollbar pr-1 text-[#4E5968] text-[14px] leading-[1.7] font-medium border-y border-[#F2F4F6] py-5 my-2">
                    {type === 'terms' ? (
                        <div className="flex flex-col gap-5">
                            <div>
                                <h4 className="font-bold text-[15.5px] text-[#191F28] mb-1.5">제 1 조 (목적)</h4>
                                <p>본 약관은 픽플(PickPl) 서비스(이하 "회사"라 합니다)가 제공하는 모든 서비스의 이용조건 및 절차, 회원과 회사 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-[15.5px] text-[#191F28] mb-1.5">제 2 조 (용어의 정의)</h4>
                                <p>1. "서비스"란 회사가 회원에게 제공하는 공간 탐색, 취향 분석, 무드 투표, 공동 플래너 세션 및 관련 부가 서비스를 의미합니다.<br />
                                2. "회원"이란 회사의 서비스에 접속하여 본 약관에 동의하고 이용자 ID를 부여받은 자를 말합니다.</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-[15.5px] text-[#191F28] mb-1.5">제 3 조 (이용약관의 효력 및 변경)</h4>
                                <p>1. 회사는 본 약관의 내용을 회원이 쉽게 알 수 있도록 서비스 화면에 게시합니다.<br />
                                2. 회사는 약관의 규제에 관한 법률 등 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있으며, 변경된 약관은 공지사항을 통해 고지됩니다.</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-[15.5px] text-[#191F28] mb-1.5">제 4 조 (서비스의 제공 및 제한)</h4>
                                <p>1. 서비스 이용은 회사의 업무상 또는 기술상 특별한 지장이 없는 한 연중무휴, 1일 24시간 운영을 원칙으로 합니다.<br />
                                2. 회사는 정보통신설비의 보수점검, 교체 및 고장, 통신두절 등의 사유가 발생한 경우에는 서비스의 제공을 일시적으로 중단할 수 있습니다.</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-[15.5px] text-[#191F28] mb-1.5">제 5 조 (회원의 의무)</h4>
                                <p>회원은 서비스 이용 시 관련 법령, 약관의 규정, 이용고객의 주의사항 등을 준수하여야 하며, 기타 회사의 업무에 방해되는 행위를 하여서는 안 됩니다.</p>
                            </div>
                            <p className="text-[12px] text-[#8B95A1] mt-3">공고일자: 2026년 5월 20일<br />시행일자: 2026년 5월 20일</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-5">
                            <div>
                                <h4 className="font-bold text-[15.5px] text-[#191F28] mb-1.5">제 1 조 (수집하는 개인정보 항목)</h4>
                                <p>회사는 회원가입, 원활한 고객상담, 각종 서비스의 제공을 위해 최초 회원가입 당시 아래와 같은 개인정보를 수집하고 있습니다.<br />
                                - 필수항목: 이메일 주소, 비밀번호, 닉네임, 프로필 정보<br />
                                - 선택항목: 기기 식별값, 위치 기반 데이터(기상 및 거리 큐레이션용)</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-[15.5px] text-[#191F28] mb-1.5">제 2 조 (개인정보의 수집 및 이용 목적)</h4>
                                <p>1. 회원 관리: 본인 확인, 서비스 이용에 따른 회원 식별 및 부정이용 방지<br />
                                2. 서비스 제공: 기상/위치 기반 공간 추천 및 큐레이션, 실시간 공동 플래너 동기화<br />
                                3. 마케팅 및 광고: 신규 서비스 개발 및 맞춤형 서비스 제공</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-[15.5px] text-[#191F28] mb-1.5">제 3 조 (개인정보의 보유 및 이용기간)</h4>
                                <p>이용자의 개인정보는 회원탈퇴 시 지체 없이 파기하는 것을 원칙으로 합니다. 단, 관련 법령의 규정에 의하여 보존할 필요가 있는 경우 법령이 정한 일정한 기간 동안 개인정보를 보관합니다.</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-[15.5px] text-[#191F28] mb-1.5">제 4 조 (이용자의 권리 및 의무)</h4>
                                <p>이용자는 언제든지 등록되어 있는 자신의 개인정보를 조회하거나 수정할 수 있으며, 회원탈퇴를 통해 개인정보 이용 동의를 철회할 수 있습니다.</p>
                            </div>
                            <p className="text-[12px] text-[#8B95A1] mt-3">공고일자: 2026년 5월 20일<br />시행일자: 2026년 5월 20일</p>
                        </div>
                    )}
                </div>
                
                <div className="mt-5 shrink-0">
                    <button 
                        onClick={onClose} 
                        className="w-full bg-[#191F28] hover:bg-black text-white font-bold py-4 rounded-[16px] active:scale-[0.98] transition-all text-center"
                    >
                        확인 및 닫기
                    </button>
                </div>
            </div>
        </div>
    );
}
