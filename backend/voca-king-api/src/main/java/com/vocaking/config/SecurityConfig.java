package com.vocaking.config;

import com.vocaking.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Spring Security 설정
 *
 * - JWT 기반 인증
 * - CORS 설정
 * - 역할 기반 접근 제어
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // CSRF 비활성화 (JWT 사용)
            .csrf(AbstractHttpConfigurer::disable)

            // CORS 설정
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            // 세션 사용 안 함 (Stateless)
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // 요청 권한 설정
            .authorizeHttpRequests(auth -> auth
                // 인증 없이 접근 가능한 경로
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers("/h2-console/**").permitAll()
                .requestMatchers("/swagger-ui/**", "/api-docs/**", "/swagger-ui.html").permitAll()

                // 단어 조회는 인증된 사용자
                .requestMatchers(HttpMethod.GET, "/api/levels/**").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/days/**").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/words/**").authenticated()

                // 단어 생성/수정/삭제는 관리자만
                .requestMatchers(HttpMethod.POST, "/api/levels/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/levels/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/levels/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/days/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/days/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/days/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/words/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/words/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/words/**").hasRole("ADMIN")

                // 관리자 전용 경로
                .requestMatchers("/api/admin/**").hasRole("ADMIN")

                // 나머지는 인증 필요
                .anyRequest().authenticated()
            )

            // H2 콘솔 iframe 허용
            .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()))

            // JWT 필터 추가
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * CORS 설정
     * 프론트엔드에서 API 호출 허용
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of(
            "http://localhost:3000",       // 로컬 개발
            "http://localhost:5173",       // Vite 개발 서버
            "https://*.vercel.app",        // Vercel 배포
            "https://*.netlify.app"        // Netlify 배포
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
