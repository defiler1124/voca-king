package com.vocaking.controller;

import com.vocaking.dto.WordDto.*;
import com.vocaking.service.WordService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 레벨 API 컨트롤러
 *
 * 레벨 CRUD 및 Day 조회
 */
@Tag(name = "Level", description = "레벨 API")
@RestController
@RequestMapping("/api/levels")
@RequiredArgsConstructor
public class LevelController {

    private final WordService wordService;

    /**
     * 모든 레벨 조회
     *
     * GET /api/levels
     */
    @Operation(summary = "모든 레벨 조회", description = "정렬된 레벨 목록을 조회합니다")
    @GetMapping
    public ResponseEntity<List<LevelResponse>> getAllLevels() {
        return ResponseEntity.ok(wordService.getAllLevels());
    }

    /**
     * 레벨 상세 조회
     *
     * GET /api/levels/{levelId}
     */
    @Operation(summary = "레벨 상세 조회")
    @GetMapping("/{levelId}")
    public ResponseEntity<LevelResponse> getLevel(@PathVariable Long levelId) {
        return ResponseEntity.ok(wordService.getLevel(levelId));
    }

    /**
     * 특정 레벨의 Day 목록 조회
     *
     * GET /api/levels/{levelId}/days
     */
    @Operation(summary = "레벨의 Day 목록 조회")
    @GetMapping("/{levelId}/days")
    public ResponseEntity<List<DayResponse>> getDaysByLevel(@PathVariable Long levelId) {
        return ResponseEntity.ok(wordService.getDaysByLevel(levelId));
    }

    /**
     * 레벨 생성 (관리자 전용)
     *
     * POST /api/levels
     */
    @Operation(summary = "레벨 생성", description = "관리자 전용")
    @PostMapping
    public ResponseEntity<LevelResponse> createLevel(@Valid @RequestBody LevelRequest request) {
        return ResponseEntity.ok(wordService.createLevel(request));
    }

    /**
     * 레벨 수정 (관리자 전용)
     *
     * PUT /api/levels/{levelId}
     */
    @Operation(summary = "레벨 수정", description = "관리자 전용")
    @PutMapping("/{levelId}")
    public ResponseEntity<LevelResponse> updateLevel(
            @PathVariable Long levelId,
            @Valid @RequestBody LevelRequest request) {
        return ResponseEntity.ok(wordService.updateLevel(levelId, request));
    }

    /**
     * 레벨 삭제 (관리자 전용)
     *
     * DELETE /api/levels/{levelId}
     */
    @Operation(summary = "레벨 삭제", description = "관리자 전용 - 하위 Day와 단어도 함께 삭제됩니다")
    @DeleteMapping("/{levelId}")
    public ResponseEntity<Void> deleteLevel(@PathVariable Long levelId) {
        wordService.deleteLevel(levelId);
        return ResponseEntity.noContent().build();
    }

    /**
     * 특정 레벨의 모든 단어 조회 (퀴즈 오답 생성용)
     *
     * GET /api/levels/{levelId}/all-words
     */
    @Operation(summary = "레벨의 모든 단어 조회", description = "퀴즈 오답 생성용")
    @GetMapping("/{levelId}/all-words")
    public ResponseEntity<List<WordResponse>> getAllWordsByLevel(@PathVariable Long levelId) {
        return ResponseEntity.ok(wordService.getAllWordsByLevel(levelId));
    }
}
