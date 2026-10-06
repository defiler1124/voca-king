package com.vocaking.controller;

import com.vocaking.dto.LearningDto.*;
import com.vocaking.entity.User;
import com.vocaking.repository.UserRepository;
import com.vocaking.service.LearningService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 관리자 API 컨트롤러
 *
 * 사용자 관리 및 전체 통계 조회 (ADMIN 전용)
 */
@Tag(name = "Admin", description = "관리자 API")
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserRepository userRepository;
    private final LearningService learningService;

    /**
     * 전체 사용자 목록 조회
     *
     * GET /api/admin/users
     */
    @Operation(summary = "사용자 목록", description = "전체 사용자 목록을 조회합니다")
    @GetMapping("/users")
    public ResponseEntity<List<UserInfoResponse>> getAllUsers() {
        List<User> users = userRepository.findAll();
        List<UserInfoResponse> response = users.stream()
                .map(this::toUserInfoResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    /**
     * 사용자 상세 정보 조회
     *
     * GET /api/admin/users/{userId}
     */
    @Operation(summary = "사용자 상세", description = "특정 사용자의 상세 정보를 조회합니다")
    @GetMapping("/users/{userId}")
    public ResponseEntity<UserInfoResponse> getUser(@PathVariable Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다"));
        return ResponseEntity.ok(toUserInfoResponse(user));
    }

    /**
     * 사용자 활성화/비활성화
     *
     * PATCH /api/admin/users/{userId}/active
     */
    @Operation(summary = "사용자 활성화 토글", description = "사용자 계정을 활성화/비활성화합니다")
    @PatchMapping("/users/{userId}/active")
    public ResponseEntity<UserInfoResponse> toggleUserActive(@PathVariable Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다"));
        // null 체크: null이면 true로 간주 (기본값)
        Boolean currentActive = user.getActive();
        user.setActive(currentActive == null ? false : !currentActive);
        userRepository.save(user);
        return ResponseEntity.ok(toUserInfoResponse(user));
    }

    /**
     * 사용자 역할 변경
     *
     * PATCH /api/admin/users/{userId}/role
     */
    @Operation(summary = "사용자 역할 변경", description = "사용자 역할을 변경합니다 (ADMIN/STUDENT)")
    @PatchMapping("/users/{userId}/role")
    public ResponseEntity<UserInfoResponse> changeUserRole(
            @PathVariable Long userId,
            @RequestParam User.Role role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다"));
        user.setRole(role);
        userRepository.save(user);
        return ResponseEntity.ok(toUserInfoResponse(user));
    }

    /**
     * 사용자 정보 수정
     *
     * PUT /api/admin/users/{userId}
     */
    @Operation(summary = "사용자 수정", description = "사용자 정보를 수정합니다")
    @PutMapping("/users/{userId}")
    public ResponseEntity<UserInfoResponse> updateUser(
            @PathVariable Long userId,
            @RequestBody UserUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다"));

        if (request.getName() != null && !request.getName().trim().isEmpty()) {
            user.setName(request.getName().trim());
        }
        if (request.getUsername() != null && !request.getUsername().trim().isEmpty()) {
            // 아이디 중복 체크
            if (!user.getUsername().equals(request.getUsername()) &&
                userRepository.existsByUsername(request.getUsername())) {
                throw new RuntimeException("이미 사용 중인 아이디입니다");
            }
            user.setUsername(request.getUsername().trim());
        }

        userRepository.save(user);
        return ResponseEntity.ok(toUserInfoResponse(user));
    }

    /**
     * 사용자 삭제
     *
     * DELETE /api/admin/users/{userId}
     */
    @Operation(summary = "사용자 삭제", description = "사용자를 삭제합니다")
    @DeleteMapping("/users/{userId}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long userId) {
        userRepository.deleteById(userId);
        return ResponseEntity.ok().build();
    }

    /**
     * 전체 사용자 학습 통계
     *
     * GET /api/admin/stats/users
     */
    @Operation(summary = "전체 학습 통계", description = "모든 사용자의 학습 통계를 조회합니다")
    @GetMapping("/stats/users")
    public ResponseEntity<List<UserStatsResponse>> getAllUserStats() {
        return ResponseEntity.ok(learningService.getAllUserStats());
    }

    /**
     * 특정 사용자 상세 학습 통계
     *
     * GET /api/admin/stats/users/{userId}
     */
    @Operation(summary = "사용자 상세 통계", description = "특정 사용자의 상세 학습 통계를 조회합니다")
    @GetMapping("/stats/users/{userId}")
    public ResponseEntity<UserDetailStatsResponse> getUserDetailStats(@PathVariable Long userId) {
        return ResponseEntity.ok(learningService.getUserDetailStats(userId));
    }

    /**
     * 전체 통계 요약
     *
     * GET /api/admin/stats/overall
     */
    @Operation(summary = "전체 통계 요약", description = "전체 학습 통계 요약을 조회합니다")
    @GetMapping("/stats/overall")
    public ResponseEntity<OverallStatsResponse> getOverallStats() {
        return ResponseEntity.ok(learningService.getOverallStats());
    }

    /**
     * User -> UserInfoResponse 변환
     */
    private UserInfoResponse toUserInfoResponse(User user) {
        return UserInfoResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .name(user.getName())
                .role(user.getRole().name())
                .active(user.getActive() != null ? user.getActive() : true)
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    /**
     * 사용자 정보 응답 DTO
     */
    @lombok.Getter
    @lombok.Setter
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    @lombok.Builder
    public static class UserInfoResponse {
        private Long id;
        private String username;
        private String name;
        private String role;
        private Boolean active;
        private java.time.LocalDateTime createdAt;
        private java.time.LocalDateTime updatedAt;
    }

    /**
     * 사용자 수정 요청 DTO
     */
    @lombok.Getter
    @lombok.Setter
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class UserUpdateRequest {
        private String name;
        private String username;
    }
}
