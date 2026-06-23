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
                className="bg-white w-[92%] max-w-[650px] h-[80vh] rounded-[32px] p-6 lg:p-8 flex flex-col shadow-2xl animate-scale-up" 
                onClick={e => e.stopPropagation()}
            >
                {/* 헤더 */}
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
                
                {/* 본문 콘텐츠 스크롤 영역 */}
                <div className="flex-1 overflow-y-auto no-scrollbar pr-2 text-[#4E5968] text-[13.5px] leading-[1.7] font-medium border-y border-[#F2F4F6] py-5 my-2">
                    {type === 'terms' ? (
                        <div className="flex flex-col gap-6">
                            <div className="bg-[#F8F9FA] p-4 rounded-2xl border border-[#F2F4F6] text-[13px] text-[#8B95A1] mb-2">
                                본 약관은 픽플(PickPl) 서비스를 이용하시는 모든 회원님들께 적용됩니다. 회원이 되시기 전에 본 약관을 꼼꼼히 읽어보시기 바랍니다.
                            </div>
                            
                            <div>
                                <h4 className="font-bold text-[15px] text-[#191F28] mb-2">제 1 조 (목적)</h4>
                                <p>본 약관은 <strong>픽플(PickPl)</strong>(이하 "서비스")이 제공하는 공간 큐레이션, 실시간 감성 추천, 하버사인 기반 거리 연산, 다중 세션 관리 등 제반 서비스(이하 "서비스")의 이용과 관련하여, 회사와 회원 간의 권리, 의무, 책임사항 및 기타 필요한 사항을 규정함을 목적으로 합니다.</p>
                            </div>
                            
                            <div>
                                <h4 className="font-bold text-[15px] text-[#191F28] mb-2">제 2 조 (용어의 정의)</h4>
                                <p>본 약관에서 사용하는 용어의 정의는 다음과 같습니다.</p>
                                <ul className="list-disc pl-5 mt-1.5 flex flex-col gap-1 text-[13px]">
                                    <li><strong>"회원"</strong>: 서비스에 접속하여 본 약관에 동의하고, 이메일 인증 또는 소셜 연동을 통해 가입을 완료하여 서비스를 이용하는 자를 의미합니다.</li>
                                    <li><strong>"공간 데이터"</strong>: 서비스 내에 등록된 명칭, 썸네일 이미지, 지도 좌표, 태그, 에디터 코멘트 등의 데이터 일체를 뜻합니다.</li>
                                    <li><strong>"분위기 투표"</strong>: 회원이 특정 공간에 대해 조용함(Quiet) 혹은 활기참(Chatty) 등의 감성 지표를 선택해 실시간 통계에 반영하는 활동을 의미합니다.</li>
                                    <li><strong>"다중 세션"</strong>: 하나의 계정으로 여러 대의 모바일, 태블릿, PC 기기에서 동시 로그인 및 실시간 동기화를 유지할 수 있도록 지원하는 Redis 기반 보안 세션 기능을 말합니다.</li>
                                </ul>
                            </div>
                            
                            <div>
                                <h4 className="font-bold text-[15px] text-[#191F28] mb-2">제 3 조 (이용약관의 효력 및 개정)</h4>
                                <p>1. 본 약관은 회원이 동의함으로써 효력이 발생하며, 회사는 약관을 회원이 쉽게 확인할 수 있도록 서비스 화면에 게시합니다.<br />
                                2. 회사는 관계 법령을 위배하지 않는 범위 내에서 본 약관을 개정할 수 있습니다.<br />
                                3. 약관이 개정되는 경우 개정 약관의 적용일자 7일 전(회원에게 불리하거나 중요한 내용의 개정은 30일 전)에 서비스 내 공지사항을 통해 고지하며, 적용일 이후 서비스를 계속 이용할 경우 변경된 약관에 동의한 것으로 간주합니다.</p>
                            </div>
                            
                            <div>
                                <h4 className="font-bold text-[15px] text-[#191F28] mb-2">제 4 조 (회원 가입 및 계정 안전 관리)</h4>
                                <p>1. 회원가입은 이용자가 본 약관 및 개인정보 처리방침에 동의하고, 가입 폼 작성 또는 OAuth2 소셜 인증을 완료함으로써 신청됩니다.<br />
                                2. 회원은 본인의 계정 정보(이메일, 비밀번호 등)의 관리 책임이 있으며, 제3자가 본인의 계정을 무단 사용하도록 방치해서는 안 됩니다.<br />
                                3. 회사는 Redis 다중 세션 관리 방식을 통해 회원이 로그인한 디바이스 및 웹 브라우저 정보(Windows, macOS, iOS, Android 등)와 마지막 접속 정보 및 대략적인 로그인 리전을 확인할 수 있는 기능을 제공하며, 회원은 원하지 않는 기기 세션을 언제든지 원격으로 즉시 로그아웃(토큰 만료) 처리할 수 있습니다.</p>
                            </div>
                            
                            <div>
                                <h4 className="font-bold text-[15px] text-[#191F28] mb-2">제 5 조 (서비스의 제공, 변경 및 중단)</h4>
                                <p>1. 서비스는 연중무휴, 1일 24시간 제공함을 원칙으로 합니다.<br />
                                2. 회사는 아래의 각 호에 해당하는 경우 서비스의 전부 또는 일부를 제한하거나 중단할 수 있습니다.<br />
                                &nbsp;&nbsp;- 시스템 점검, 서버 증설 및 교체 등 유지보수가 필요한 경우<br />
                                &nbsp;&nbsp;- 전기통신사업법에 규정된 기간통신사업자가 전기통신 서비스를 중지했을 경우<br />
                                &nbsp;&nbsp;- 천재지변, 국가비상사태 또는 외부 오픈 API(카카오/네이버 지도 API, Open-Meteo 날씨 API 등)의 일시적 장애가 발생한 경우</p>
                            </div>
                            
                            <div>
                                <h4 className="font-bold text-[15px] text-[#191F28] mb-2">제 6 조 (회원의 의무 및 부적절한 행위 제한)</h4>
                                <p>회원은 서비스를 이용할 때 다음 각 호의 행위를 하여서는 안 됩니다. 위반 시 회사는 계정의 일시 정지, 영구 이용제한 등의 조치를 취할 수 있습니다.</p>
                                <ul className="list-disc pl-5 mt-1.5 flex flex-col gap-1 text-[13px]">
                                    <li>타인의 정보(이메일, 비밀번호, 소셜 토큰 등)를 무단으로 수집하거나 도용하는 행위</li>
                                    <li>회사가 공식 제공하는 API 외의 비정상적 크롤링 스크립트, 매크로 프로그램 등을 이용해 서버에 비정상적인 과부하를 주는 행위</li>
                                    <li>특정 장소의 분위기 투표(Vibe Vote)나 평판 점수를 악의적으로 왜곡하기 위해 어뷰징 또는 매크로 투표를 진행하는 행위</li>
                                    <li>서비스의 안전한 보안 구조를 침해하거나 리버스 엔지니어링을 시도하는 행위</li>
                                </ul>
                            </div>
                            
                            <div>
                                <h4 className="font-bold text-[15px] text-[#191F28] mb-2">제 7 조 (면책조항)</h4>
                                <p>1. 회사는 천재지변, 기상 이변, 전쟁 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.<br />
                                2. 회사는 날씨 예측 서비스(Open-Meteo) 등 외부 API 연동 오류로 발생한 부정확한 날씨 필터링 또는 큐레이션 결과에 대해 보증하거나 배상 책임이 없습니다.<br />
                                3. 회사는 회원 간 또는 회원과 제3자 상호 간에 서비스를 매개로 하여 거래 등을 한 경우에는 책임이 면제됩니다.</p>
                            </div>
                            
                            <div>
                                <h4 className="font-bold text-[15px] text-[#191F28] mb-2">제 8 조 (준거법 및 재판관할)</h4>
                                <p>본 약관의 해석 및 회사와 회원 간의 분쟁에 대하여는 대한민국 법률을 준거법으로 하며, 발생한 분쟁에 관한 소송은 민사소송법상의 관할법원에 제기합니다.</p>
                            </div>
                            
                            <p className="text-[12px] text-[#8B95A1] mt-2 border-t border-[#F2F4F6] pt-3">
                                <strong>최초 공고일자</strong>: 2026년 5월 20일<br />
                                <strong>최종 개정일자</strong>: 2026년 6월 23일 (다중 세션 원격 로그아웃 및 하버사인 거리 계산 정책 반영)
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-6">
                            <div className="bg-[#F8F9FA] p-4 rounded-2xl border border-[#F2F4F6] text-[13px] text-[#8B95A1] mb-2">
                                픽플(PickPl)은 이용자의 개인정보를 소중하게 생각하며, '개인정보 보호법' 등 관련 법령을 철저히 준수하고 있습니다.
                            </div>
                            
                            <div>
                                <h4 className="font-bold text-[15px] text-[#191F28] mb-2">제 1 조 (수집하는 개인정보 항목 및 수집방법)</h4>
                                <p>회사는 서비스 회원가입, 원활한 고객 대응, 위치 및 날씨 기반 추천의 개인화 맞춤형 서비스를 제공하기 위해 아래와 같이 개인정보를 수집하고 있습니다.</p>
                                <ul className="list-disc pl-5 mt-1.5 flex flex-col gap-1 text-[13px]">
                                    <li><strong>회원가입 및 프로필 구성 시 (필수)</strong>: 이메일 주소, 패스워드(암호화 저장), 닉네임, 프로필 이미지 경로, 소셜 로그인 연동 시 제공되는 소셜 플랫폼 고유 식별 번호(Google, Kakao, Naver ID)</li>
                                    <li><strong>서비스 이용 및 데이터 처리 시 (자동 생성/수집)</strong>: IP 주소, 브라우저 정보(User-Agent), 접속 OS 기기명(Windows, macOS, iOS, Android 등), 접속 타임스탬프, Refresh Token 식별값</li>
                                    <li><strong>위치 기반 기능 이용 시 (선택)</strong>: 사용자의 디바이스 GPS 좌표(위경도 데이터 - 하버사인 공식을 이용한 실시간 목적지 거리 계산 및 반환용)</li>
                                </ul>
                            </div>
                            
                            <div>
                                <h4 className="font-bold text-[15px] text-[#191F28] mb-2">제 2 조 (개인정보의 수집 및 이용 목적)</h4>
                                <p>회사는 수집한 개인정보를 다음의 목적으로만 이용합니다.</p>
                                <ul className="list-disc pl-5 mt-1.5 flex flex-col gap-1 text-[13px]">
                                    <li><strong>회원 관리</strong>: 회원 식별, 비밀번호 재설정 인증 이메일 발송, 불량 회원의 부정이용 방지 및 비인가 계정 접근 제한</li>
                                    <li><strong>맞춤화 서비스 제공</strong>: 유저의 GPS 정보를 기준으로 장소 간 실제 직선거리를 미터/킬로미터로 자동 연산하여 반환하고, 현 위치 기상(강수, 적설, 온도 등)에 적합한 감성 룩북 카드를 홈 화면에 개인화 큐레이션</li>
                                    <li><strong>기기 세션 보안</strong>: Redis의 다중 기기 키-밸류 저장 방식을 이용하여, 본인의 활성화된 다중 디바이스 로그인 세션을 한눈에 조회하고 임의 세션을 원격 로그아웃할 수 있도록 통제 수단 제공</li>
                                </ul>
                            </div>
                            
                            <div>
                                <h4 className="font-bold text-[15px] text-[#191F28] mb-2">제 3 조 (개인정보의 제3자 제공 및 위탁)</h4>
                                <p>1. 회사는 이용자의 개인정보를 가입 신청 및 이용약관에 고지한 범위 내에서만 사용하며, 이용자의 사전 동의 없이는 동 범위를 초과하여 이용하거나 원칙적으로 외부에 공개 또는 제3자에게 제공하지 않습니다.<br />
                                2. 법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우에 한하여 예외적으로 제공됩니다.</p>
                            </div>
                            
                            <div>
                                <h4 className="font-bold text-[15px] text-[#191F28] mb-2">제 4 조 (개인정보의 보유 및 이용기간, 파기 정책)</h4>
                                <p>1. 이용자의 개인정보는 회원 탈퇴 시 지체 없이 파기함을 원칙으로 합니다.<br />
                                2. 회원 탈퇴 시 RDB 내 저장된 회원 레코드 및 관련 소셜 커넥션(Social Connection) 데이터는 즉시 영구 삭제(Hard Delete)됩니다.<br />
                                3. Redis에 캐싱된 세션 데이터 및 인증 메일 키-값 쌍 또한 탈퇴 및 로그아웃과 동시에 즉각 `DEL` 명령어로 완전 파기되어 복구 불가능한 상태가 됩니다.</p>
                            </div>
                            
                            <div>
                                <h4 className="font-bold text-[15px] text-[#191F28] mb-2">제 5 조 (이용자의 권리와 그 행사방법)</h4>
                                <p>1. 이용자는 언제든지 마이페이지 내 프로필 수정을 통해 자신의 개인정보를 열람하거나 수정할 수 있으며, 이메일 인증 여부를 갱신할 수 있습니다.<br />
                                2. 이용자는 언제든지 회원탈퇴를 클릭하여 가입 해지 및 개인정보 제공에 동의했던 내역을 즉시 철회할 수 있습니다.<br />
                                3. 만 14세 미만 아동의 회원 가입은 원칙적으로 제한됩니다.</p>
                            </div>
                            
                            <div>
                                <h4 className="font-bold text-[15px] text-[#191F28] mb-2">제 6 조 (개인정보의 기술적/관리적 보호 대책)</h4>
                                <p>회사는 개인정보를 취급함에 있어 안전성 확보를 위해 다음과 같은 대책을 강구하고 있습니다.</p>
                                <ul className="list-disc pl-5 mt-1.5 flex flex-col gap-1 text-[13px]">
                                    <li><strong>패스워드 암호화</strong>: 회원의 비밀번호는 BCrypt 단방향 해시 알고리즘으로 암호화되어 저장되므로 데이터베이스 관리자도 원본 비밀번호를 알 수 없습니다.</li>
                                    <li><strong>해킹 등에 대비한 대책</strong>: 외부 비인가 접근을 차단하고 JWT 인증 및 서명 키를 비대칭/대칭 방식으로 보관하여 보안 유출에 대비합니다.</li>
                                    <li><strong>세션 하이재킹 방지</strong>: IP 주소와 브라우저 정보를 수시 체크하며, Redis 기반 세션 검증 모듈을 통해 세션 변조나 타 기기 무단 탈취를 완벽히 통제합니다.</li>
                                </ul>
                            </div>
                            
                            <div>
                                <h4 className="font-bold text-[15px] text-[#191F28] mb-2">개인정보 보호책임자 및 고충처리 메일</h4>
                                <p>서비스의 개인정보 관리 및 불편 사항 해결을 위해 아래와 같이 담당 창구를 운영하고 있습니다.<br />
                                &nbsp;&nbsp;- 이메일: <a href="mailto:support@pickpl.com" className="text-[#FF5F2E] underline">support@pickpl.com</a></p>
                            </div>
                            
                            <p className="text-[12px] text-[#8B95A1] mt-2 border-t border-[#F2F4F6] pt-3">
                                <strong>최초 공고일자</strong>: 2026년 5월 20일<br />
                                <strong>최종 개정일자</strong>: 2026년 6월 23일
                            </p>
                        </div>
                    )}
                </div>
                
                {/* 하단 확인 버튼 */}
                <div className="mt-5 shrink-0">
                    <button 
                        onClick={onClose} 
                        className="w-full bg-[#191F28] hover:bg-black text-white font-bold py-4 rounded-[20px] active:scale-[0.98] transition-all text-center text-[15px]"
                    >
                        동의 및 확인 완료
                    </button>
                </div>
            </div>
        </div>
    );
}

