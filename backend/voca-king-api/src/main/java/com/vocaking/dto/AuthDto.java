package com.vocaking.dto;

import com.vocaking.entity.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

/**
 * 인증 관련 DTO
 */
public class AuthDto {

    /**
     * 회원가입 요청 DTO
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RegisterRequest {

        @NotBlank(message = "이메일은 필수입니다")
        @Email(message = "올바른 이메일 형식이 아닙니다")
        private String email;

        @NotBlank(message = "비밀번호는 필수입니다")
        @Size(min = 6, max = 20, message = "비밀번호는 6~20자여야 합니다")
        private String password;

        @NotBlank(message = "이름은 필수입니다")
        @Size(min = 2, max = 50, message = "이름은 2~50자여야 합니다")
        private String name;
    }

    /**
     * 로그인 요청 DTO
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoginRequest {

        @NotBlank(message = "이메일은 필수입니다")
        @Email(message = "올바른 이메일 형식이 아닙니다")
        private String email;

        @NotBlank(message = "비밀번호는 필수입니다")
        private String password;
    }

    /**
     * 로그인 응답 DTO
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LoginResponse {
        private String token;
        private String email;
        private String name;
        private String role;

        public static LoginResponse from(User user, String token) {
            return LoginResponse.builder()
                    .token(token)
                    .email(user.getEmail())
                    .name(user.getName())
                    .role(user.getRole().name())
                    .build();
        }
    }

    /**
     * 사용자 정보 응답 DTO
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserResponse {
        private Long id;
        private String email;
        private String name;
        private String role;

        public static UserResponse from(User user) {
            return UserResponse.builder()
                    .id(user.getId())
                    .email(user.getEmail())
                    .name(user.getName())
                    .role(user.getRole().name())
                    .build();
        }
    }
}
