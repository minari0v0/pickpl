package com.pickpl.app.security.admin;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * X-Admin-Secret-Key 헤더 기반의 관리자 권한 인증 필터.
 * /api/v1/admin/** 경로의 요청에 대해 헤더 유효성 검증 후 ROLE_ADMIN 권한을 부여합니다.
 */
public class AdminKeyAuthenticationFilter extends OncePerRequestFilter {

    private final AdminKeyService adminKeyService;

    public AdminKeyAuthenticationFilter(AdminKeyService adminKeyService) {
        this.adminKeyService = adminKeyService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();

        // 관리자용 API 경로 진입 시에만 헤더 검증 작동
        if (path.startsWith("/api/v1/admin")) {
            String requestKey = request.getHeader("X-Admin-Secret-Key");
            String actualAdminKey = adminKeyService.getAdminKey();

            if (actualAdminKey != null && !actualAdminKey.isEmpty() && actualAdminKey.equals(requestKey)) {
                // 가상 어드민 인증 토큰 설정 (ROLE_ADMIN 부여)
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        "ADMIN_SYSTEM", null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
                );
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } else {
                // 키가 누락되었거나 불일치할 경우 403 차단 반환
                response.setContentType("application/json;charset=UTF-8");
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.getWriter().write("{\"status\":\"ERROR\",\"message\":\"Access Denied: Invalid or missing Admin Secret Key.\"}");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }
}
