package com.vocaking.controller;

import com.vocaking.dto.AuthDto.*;
import com.vocaking.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

/**
 * 인증 API 컨트롤러
 *
 * 회원가입, 로그인, 현재 사용자 정보 조회
 */
@Tag(name = "Auth", description = "인증 API")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * 회원가입
     *
     * POST /api/auth/register
     */
    @Operation(summary = "회원가입", description = "새로운 사용자 계정을 생성합니다")
    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        UserResponse response = authService.register(request);
        return ResponseEntity.ok(response);
    }

    /**
     * 로그인
     *
     * POST /api/auth/login
     */
    @Operation(summary = "로그인", description = "이메일과 비밀번호로 로그인하여 JWT 토큰을 발급받습니다")
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    /**
     * 현재 사용자 정보 조회
     *
     * GET /api/auth/me
     */
    @Operation(summary = "현재 사용자 정보", description = "로그인한 사용자의 정보를 조회합니다")
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        UserResponse response = authService.getCurrentUser(userDetails.getUsername());
        return ResponseEntity.ok(response);
    }
}
