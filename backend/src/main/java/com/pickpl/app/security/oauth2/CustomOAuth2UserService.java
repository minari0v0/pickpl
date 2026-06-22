package com.pickpl.app.security.oauth2;

import com.pickpl.app.domain.user.AuthProvider;
import com.pickpl.app.domain.user.Role;
import com.pickpl.app.domain.user.User;
import com.pickpl.app.domain.user.UserRepository;
import com.pickpl.app.domain.user.SocialConnection;
import com.pickpl.app.domain.user.SocialConnectionRepository;
import com.pickpl.app.security.oauth2.userinfo.GoogleOAuth2UserInfo;
import com.pickpl.app.security.oauth2.userinfo.KakaoOAuth2UserInfo;
import com.pickpl.app.security.oauth2.userinfo.NaverOAuth2UserInfo;
import com.pickpl.app.security.oauth2.userinfo.OAuth2UserInfo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;
    private final SocialConnectionRepository socialConnectionRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        AuthProvider provider = getAuthProvider(registrationId);

        OAuth2UserInfo oAuth2UserInfo = getOAuth2UserInfo(registrationId, oAuth2User.getAttributes());

        String providerStr = provider.name();
        String providerId = oAuth2UserInfo.getProviderId();

        User user;

        // HttpSession에서 link_user_id 조회 (수동 연동 프로세스인지 판별)
        String linkUserId = null;
        try {
            org.springframework.web.context.request.ServletRequestAttributes attributes = 
                (org.springframework.web.context.request.ServletRequestAttributes) org.springframework.web.context.request.RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                jakarta.servlet.http.HttpServletRequest request = attributes.getRequest();
                jakarta.servlet.http.HttpSession session = request.getSession(false);
                if (session != null) {
                    linkUserId = (String) session.getAttribute("link_user_id");
                }
            }
        } catch (Exception e) {
            log.warn("OAuth2 loadUser 중 HttpSession 조회 실패: {}", e.getMessage());
        }

        if (linkUserId != null) {
            Long userId = Long.valueOf(linkUserId);
            user = userRepository.findById(userId)
                    .orElseThrow(() -> new org.springframework.security.oauth2.core.OAuth2AuthenticationException(
                            new org.springframework.security.oauth2.core.OAuth2Error("user_not_found", "존재하지 않는 사용자 계정입니다.", null)
                    ));
            
            if (socialConnectionRepository.existsByProviderAndProviderId(providerStr, providerId) ||
                userRepository.existsByProviderAndProviderId(provider, providerId)) {
                throw new org.springframework.security.oauth2.core.OAuth2AuthenticationException(
                        new org.springframework.security.oauth2.core.OAuth2Error("already_linked", "이미 다른 계정에 연결되어 있는 소셜 계정입니다.", null)
                );
            }
            
            boolean alreadyLinked = socialConnectionRepository.findByUserId(user.getId())
                    .stream()
                    .anyMatch(conn -> conn.getProvider().equals(providerStr));
            if (alreadyLinked) {
                throw new org.springframework.security.oauth2.core.OAuth2AuthenticationException(
                        new org.springframework.security.oauth2.core.OAuth2Error("already_linked_platform", "이미 연동 완료된 소셜 플랫폼입니다.", null)
                );
            }
            
            SocialConnection newConn = SocialConnection.builder()
                    .user(user)
                    .provider(providerStr)
                    .providerId(providerId)
                    .build();
            socialConnectionRepository.save(newConn);
            log.info("Social Account linked to logged-in user: User ID {}, Provider {}", user.getId(), providerStr);
            
            try {
                org.springframework.web.context.request.ServletRequestAttributes attributes = 
                    (org.springframework.web.context.request.ServletRequestAttributes) org.springframework.web.context.request.RequestContextHolder.getRequestAttributes();
                if (attributes != null) {
                    jakarta.servlet.http.HttpServletRequest request = attributes.getRequest();
                    jakarta.servlet.http.HttpSession session = request.getSession(false);
                    if (session != null) {
                        session.removeAttribute("link_user_id");
                        session.setAttribute("link_success", "true");
                        session.setAttribute("link_provider", providerStr);
                    }
                }
            } catch (Exception e) {
                log.warn("OAuth2 loadUser 중 HttpSession 성공 마크 실패: {}", e.getMessage());
            }
        } else {
            // 1. SocialConnection에 연동 정보가 있는지 확인
            Optional<SocialConnection> socialConnOpt = socialConnectionRepository.findByProviderAndProviderId(providerStr, providerId);

            if (socialConnOpt.isPresent()) {
                // 이미 연동된 마스터 유저로 로그인
                User lazyUser = socialConnOpt.get().getUser();
                user = userRepository.findById(lazyUser.getId())
                        .orElseThrow(() -> new org.springframework.security.oauth2.core.OAuth2AuthenticationException("존재하지 않는 사용자 계정입니다."));
                log.info("Social Account matched via SocialConnection: User ID {}", user.getId());
            } else {
                // 2. 레거시 단일 소셜 회원 호환성을 위해 UserRepository에서 직접 조회
                Optional<User> legacyUserOpt = userRepository.findByProviderAndProviderId(provider, providerId);

                if (legacyUserOpt.isPresent()) {
                    user = legacyUserOpt.get();
                    user.updateProfile(oAuth2UserInfo.getName(), oAuth2UserInfo.getImageUrl());
                    userRepository.save(user);
                    log.info("Social Account matched via legacy provider information: User ID {}", user.getId());
                } else {
                    // 3. 연동 및 레거시 정보가 없지만, 동일 이메일을 가진 로컬 마스터 유저(LOCAL)가 있는지 확인
                    String email = oAuth2UserInfo.getEmail();
                    Optional<User> localUserOpt = Optional.empty();
                    if (email != null && !email.isBlank()) {
                        localUserOpt = userRepository.findByEmail(email);
                    }

                    if (localUserOpt.isPresent() && localUserOpt.get().getProvider() == AuthProvider.LOCAL) {
                        // 동일 이메일의 로컬 회원 계정을 찾아 자동 연동 처리
                        User localUser = localUserOpt.get();
                        SocialConnection newConn = SocialConnection.builder()
                                .user(localUser)
                                .provider(providerStr)
                                .providerId(providerId)
                                .build();
                        socialConnectionRepository.save(newConn);
                        user = localUser;
                        log.info("Social Account auto-linked to Local Account: User ID {}", user.getId());
                    } else {
                        // 4. 신규 소셜 유저로 가입 처리 (GUEST 롤 부여)
                        user = registerNewUser(provider, oAuth2UserInfo);
                        log.info("Registered a new OAuth2 user: User ID {}", user.getId());
                    }
                }
            }
        }

        return new CustomOAuth2User(user, oAuth2User.getAttributes());
    }

    private User registerNewUser(AuthProvider provider, OAuth2UserInfo userInfo) {
        String email = userInfo.getEmail();
        
        // 이메일이 없는 경우 (예: 카카오 이메일 제공 미동의) 더미 이메일 생성
        if (email == null || email.isBlank()) {
            email = provider.name().toLowerCase() + "_" + userInfo.getProviderId() + "@pickpl.dummy";
        }

        User user = User.builder()
                .email(email)
                .nickname(userInfo.getName() != null ? userInfo.getName() : "유저_" + UUID.randomUUID().toString().substring(0, 5))
                .profileImageUrl(userInfo.getImageUrl())
                .provider(provider)
                .providerId(userInfo.getProviderId())
                .role(Role.GUEST) // 최초 로그인은 GUEST로 설정
                .build();

        return userRepository.save(user);
    }

    private AuthProvider getAuthProvider(String registrationId) {
        if ("google".equalsIgnoreCase(registrationId)) {
            return AuthProvider.GOOGLE;
        } else if ("kakao".equalsIgnoreCase(registrationId)) {
            return AuthProvider.KAKAO;
        } else if ("naver".equalsIgnoreCase(registrationId)) {
            return AuthProvider.NAVER;
        }
        return AuthProvider.LOCAL;
    }

    private OAuth2UserInfo getOAuth2UserInfo(String registrationId, java.util.Map<String, Object> attributes) {
        if ("google".equalsIgnoreCase(registrationId)) {
            return new GoogleOAuth2UserInfo(attributes);
        } else if ("kakao".equalsIgnoreCase(registrationId)) {
            return new KakaoOAuth2UserInfo(attributes);
        } else if ("naver".equalsIgnoreCase(registrationId)) {
            return new NaverOAuth2UserInfo(attributes);
        }
        throw new OAuth2AuthenticationException("지원하지 않는 소셜 로그인입니다.");
    }
}
