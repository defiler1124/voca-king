package com.vocaking.controller;

import com.vocaking.dto.LearningDto.*;
import com.vocaking.service.LearningService;
import com.vocaking.repository.UserRepository;
import com.vocaking.entity.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

/**
 * 학습 API 컨트롤러
 *
 * 학습 기록 저장 및 통계 조회
 */
@Tag(name = "Learning", description = "학습 API")
@RestController
@RequestMapping("/api/learning")
@RequiredArgsConstructor
public class LearningController {

    private final LearningService learningService;
    private final UserRepository userRepository;

    /**
     * 단어 학습 기록
     *
     * POST /api/learning/attempt
     */
    @Operation(summary = "학습 기록", description = "단어 학습/퀴즈 시도를 기록합니다")
    @PostMapping("/attempt")
    public ResponseEntity<Void> recordAttempt(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody AttemptRequest request) {
        Long userId = getUserId(userDetails);
        learningService.recordAttempt(userId, request);
        return ResponseEntity.ok().build();
    }

    /**
     * 퀴즈 결과 저장
     *
     * POST /api/learning/quiz-result
     */
    @Operation(summary = "퀴즈 결과 저장", description = "파이널테스트 결과를 저장합니다")
    @PostMapping("/quiz-result")
    public ResponseEntity<Void> saveQuizResult(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody QuizResultRequest request) {
        Long userId = getUserId(userDetails);
        learningService.saveQuizResult(userId, request);
        return ResponseEntity.ok().build();
    }

    /**
     * 내 학습 통계 조회
     *
     * GET /api/learning/my-stats
     */
    @Operation(summary = "내 학습 통계", description = "로그인한 사용자의 학습 통계를 조회합니다")
    @GetMapping("/my-stats")
    public ResponseEntity<UserStatsResponse> getMyStats(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(learningService.getUserStats(userId));
    }

    /**
     * 내 상세 학습 통계 조회
     *
     * GET /api/learning/my-stats/detail
     */
    @Operation(summary = "내 상세 학습 통계", description = "로그인한 사용자의 상세 학습 통계를 조회합니다")
    @GetMapping("/my-stats/detail")
    public ResponseEntity<UserDetailStatsResponse> getMyDetailStats(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(learningService.getUserDetailStats(userId));
    }

    private Long getUserId(UserDetails userDetails) {
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다"));
        return user.getId();
    }
}
