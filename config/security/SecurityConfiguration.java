package com.everytable.api.config.security;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * 원본 everytable은 HttpSession + AuthorityFilter(everytable.util.filter.AuthorityFilter)로
 * 로그인/권한을 처리했다. 이 프로젝트에서는 REST API + React 구조에 맞춰
 * JWT(Json Web Token) + Spring Security STATELESS 인증으로 대체한다.
 *
 * 등급(grade_no) -> 권한(role) 매핑 (MemberUserDetailsService 참고)
 *   1 : ROLE_USER  (일반회원)
 *   2 : ROLE_OWNER (매장점주)
 *   9 : ROLE_ADMIN (관리자)
 */
@Configuration
@EnableMethodSecurity // 컨트롤러의 @PreAuthorize("hasRole('ADMIN')") 등을 사용하기 위해 필요
public class SecurityConfiguration {

    private final JwtTokenProvider jwtTokenProvider;

    @Autowired
    public SecurityConfiguration(JwtTokenProvider jwtTokenProvider) {
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity httpSecurity) throws Exception {
        httpSecurity
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .httpBasic(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeHttpRequests(authorize -> authorize
                        // Swagger 문서
                        .requestMatchers("/swagger", "/swagger-ui.html", "/swagger-ui/**",
                                "/api-docs", "/api-docs/**", "/v3/api-docs/**").permitAll()
                        // 회원가입/로그인/중복체크/휴면인증/이메일 인증(OTP)은 인증 없이 허용
                        // (sendAuthCode.do/verifyAuthCode.do/resetPw.do/dormantVerify.do는 세션 자체가
                        //  인증 수단이므로 로그인 여부와 무관하게 열어둬야 한다 - 원본과 동일)
                        .requestMatchers("/member/login.do", "/member/write.do",
                                "/member/checkId.do", "/member/checkTel.do", "/member/checkEmail.do",
                                "/member/searchId.do", "/member/checkPwForId.do", "/member/dormantVerify.do",
                                "/member/sendAuthCode.do", "/member/verifyAuthCode.do",
                                "/member/verifyMemberForReset.do", "/member/resetPw.do").permitAll()
                        // 메뉴/매장/리뷰 조회(GET)는 고객이 로그인 없이 볼 수 있어야 한다.
                        .requestMatchers(HttpMethod.GET, "/menu/**", "/store/**", "/main/**", "/review/storeList.do").permitAll()
                        .requestMatchers("/upload/**").permitAll()
                        // 단체주문(그룹오더) 참여자는 계정이 없을 수 있어 원본과 동일하게 로그인 없이 허용
                        // (원본 ReservationController의 isExempted 목록과 동일: groupMenuForm/groupOrderWrite)
                        .requestMatchers(HttpMethod.GET, "/reservation/groupMenuForm.do").permitAll()
                        .requestMatchers(HttpMethod.POST, "/reservation/groupOrderWrite.do").permitAll()
                        // 나머지 /member, /menu, /store, /reservation, /payment, /refund, /review, /stats 관리 기능은
                        // 로그인 사용자만 (세부 권한은 컨트롤러/서비스에서 재검증)
                        .requestMatchers("/member/**", "/menu/**", "/store/**", "/reservation/**", "/payment/**",
                                "/refund/**", "/review/**", "/stats/**").authenticated()
                        .anyRequest().permitAll()
                )
                .formLogin(AbstractHttpConfigurer::disable)
                .addFilterBefore(new JwtAuthenticationFilter(jwtTokenProvider), UsernamePasswordAuthenticationFilter.class)
                .exceptionHandling(handling -> handling
                        .authenticationEntryPoint(new CustomAuthenticationEntryPoint())
                        .accessDeniedHandler(new CustomAccessDeniedHandler()));

        return httpSecurity.build();
    }

    // 원본은 JSP를 같은 서버가 그대로 내려주는 same-origin 구조라 CORS가 필요 없었지만,
    // 이 프로젝트는 React(5173)/Spring Boot(8080)가 서로 다른 origin이라 CORS 설정이 반드시 필요하다.
    //
    // 버그였던 부분: 지금까지는 각 컨트롤러에 개별 @CrossOrigin(origins = "http://localhost:5173")만
    // 붙여뒀는데, MemberRestController를 뺀 나머지 9개 컨트롤러(store/menu/notice/reservation/
    // payment/refund/review/stats/main)는 allowCredentials를 지정하지 않았었다. 반면 프론트의
    // 공용 axios 인스턴스(http.js)는 withCredentials:true를 "모든" 요청에 전역으로 걸어두고 있어서,
    // 이 9개 컨트롤러로 가는 요청은 자격증명 포함 요청인데 응답에는 Access-Control-Allow-Credentials가
    // 없는 상태가 되어 브라우저가 CORS 스펙에 따라 응답을 전부 차단했다 (member 쪽 API만 우연히
    // 동작하고 나머지 대부분의 화면에서 "서버 오류"가 반복되던 원인). 게다가 Spring Security의
    // .cors(cors -> {})는 CorsConfigurationSource 빈이 없으면 시큐리티 필터 단계에서 preflight를
    // 제대로 처리하지 못하므로, @CrossOrigin 어노테이션들을 없애고 여기 하나로 통일한다.
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:5173"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(List.of("X-AUTH-TOKEN"));
        configuration.setAllowCredentials(true); // http.js가 모든 요청에 withCredentials:true를 쓰므로 반드시 true여야 한다

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
