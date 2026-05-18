package com.pickpl.app.security.oauth2;

import com.pickpl.app.domain.user.AuthProvider;
import com.pickpl.app.domain.user.Role;
import com.pickpl.app.domain.user.User;
import com.pickpl.app.domain.user.UserRepository;
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

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        AuthProvider provider = getAuthProvider(registrationId);

        OAuth2UserInfo oAuth2UserInfo = getOAuth2UserInfo(registrationId, oAuth2User.getAttributes());

        // providerId를 기반으로 기존 유저 여부 확인
        Optional<User> userOptional = userRepository.findByProviderAndProviderId(provider, oAuth2UserInfo.getProviderId());

        User user;
        if (userOptional.isPresent()) {
            // 기존 유저 (정보 업데이트)
            user = userOptional.get();
            user.updateProfile(oAuth2UserInfo.getName(), oAuth2UserInfo.getImageUrl());
            userRepository.save(user);
        } else {
            // 신규 유저 가입 처리 (GUEST 롤 부여)
            user = registerNewUser(provider, oAuth2UserInfo);
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
