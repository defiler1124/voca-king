package com.vocaking.controller;

import com.vocaking.dto.GameProgressDto.Response;
import com.vocaking.dto.GameProgressDto.SaveRequest;
import com.vocaking.dto.GameProgressDto.SummaryResponse;
import com.vocaking.dto.GameProgressDto.UserProgressResponse;
import com.vocaking.service.GameProgressService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 게임 진도 API 컨트롤러
 */
@Tag(name = "GameProgress", description = "게임 진도 API")
@RestController
@RequestMapping("/api/progress")
@RequiredArgsConstructor
public class GameProgressController {

    private final GameProgressService progressService;

    /**
     * 진도 저장
     */
    @Operation(summary = "진도 저장", description = "게임 클리어 시 진도를 저장합니다")
    @PostMapping
    public ResponseEntity<Response> saveProgress(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody SaveRequest request) {
        Response response = progressService.saveProgress(userDetails.getUsername(), request);
        return ResponseEntity.ok(response);
    }

    /**
     * 전체 진도 요약 조회
     */
    @Operation(summary = "진도 요약 조회", description = "사용자의 전체 진도 요약을 조회합니다")
    @GetMapping("/summary")
    public ResponseEntity<SummaryResponse> getProgressSummary(
            @AuthenticationPrincipal UserDetails userDetails) {
        SummaryResponse response = progressService.getProgressSummary(userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    /**
     * 전체 학생 진도 조회 (관리자용)
     */
    @Operation(summary = "전체 학생 진도 조회", description = "모든 학생의 진도 요약을 조회합니다 (관리자 전용)")
    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserProgressResponse>> getAllUsersProgress() {
        List<UserProgressResponse> response = progressService.getAllUsersProgress();
        return ResponseEntity.ok(response);
    }

    /**
     * 특정 학생 상세 진도 조회 (관리자용)
     */
    @Operation(summary = "학생 상세 진도 조회", description = "특정 학생의 상세 진도를 조회합니다 (관리자 전용)")
    @GetMapping("/admin/user/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Response>> getUserProgressDetail(@PathVariable Long userId) {
        List<Response> response = progressService.getUserProgressDetail(userId);
        return ResponseEntity.ok(response);
    }
}
