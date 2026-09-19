package com.vocaking.service;

import com.vocaking.dto.AuthDto.*;
import com.vocaking.entity.User;
import com.vocaking.repository.UserRepository;
import com.vocaking.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 인증 서비스
 *
 * 회원가입, 로그인 처리
 */
@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;

    /**
     * 회원가입
     *
     * @param request 회원가입 요청 정보
     * @return 생성된 사용자 정보
     * @throws IllegalArgumentException 이메일 중복 시
     */
    public UserResponse register(RegisterRequest request) {
        // 이메일 중복 확인
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다: " + request.getEmail());
        }

        // 사용자 생성 (기본 역할: STUDENT)
        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .name(request.getName())
                .role(User.Role.STUDENT)
                .active(true)
                .build();

        User savedUser = userRepository.save(user);
        return UserResponse.from(savedUser);
    }

    /**
     * 로그인
     *
     * @param request 로그인 요청 정보
     * @return 토큰 및 사용자 정보
     */
    public LoginResponse login(LoginRequest request) {
        // 인증 수행
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        // 사용자 조회
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));

        // JWT 토큰 생성
        String token = jwtTokenProvider.createToken(user.getEmail(), user.getRole().name());

        return LoginResponse.from(user, token);
    }

    /**
     * 현재 사용자 정보 조회
     *
     * @param email 사용자 이메일
     * @return 사용자 정보
     */
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));
        return UserResponse.from(user);
    }
}
