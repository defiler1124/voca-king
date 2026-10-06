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
     * @throws IllegalArgumentException 아이디 중복 시
     */
    public UserResponse register(RegisterRequest request) {
        // 아이디 중복 확인
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("이미 사용 중인 아이디입니다: " + request.getUsername());
        }

        // 사용자 생성 (기본 역할: STUDENT)
        User user = User.builder()
                .username(request.getUsername())
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
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        // 사용자 조회
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));

        // JWT 토큰 생성
        String token = jwtTokenProvider.createToken(user.getUsername(), user.getRole().name());

        return LoginResponse.from(user, token);
    }

    /**
     * 현재 사용자 정보 조회
     *
     * @param username 사용자 아이디
     * @return 사용자 정보
     */
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));
        return UserResponse.from(user);
    }
}
