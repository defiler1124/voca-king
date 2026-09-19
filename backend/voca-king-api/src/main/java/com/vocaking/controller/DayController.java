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
 * Day API 컨트롤러
 *
 * Day CRUD 및 단어 조회
 */
@Tag(name = "Day", description = "Day API")
@RestController
@RequestMapping("/api/days")
@RequiredArgsConstructor
public class DayController {

    private final WordService wordService;

    /**
     * Day 상세 조회 (단어 목록 포함)
     *
     * GET /api/days/{dayId}
     */
    @Operation(summary = "Day 상세 조회", description = "단어 목록을 포함한 Day 정보를 조회합니다")
    @GetMapping("/{dayId}")
    public ResponseEntity<DayDetailResponse> getDayDetail(@PathVariable Long dayId) {
        return ResponseEntity.ok(wordService.getDayDetail(dayId));
    }

    /**
     * Day 생성 (관리자 전용)
     *
     * POST /api/days
     */
    @Operation(summary = "Day 생성", description = "관리자 전용")
    @PostMapping
    public ResponseEntity<DayResponse> createDay(@Valid @RequestBody DayRequest request) {
        return ResponseEntity.ok(wordService.createDay(request));
    }

    /**
     * Day 수정 (관리자 전용)
     *
     * PUT /api/days/{dayId}
     */
    @Operation(summary = "Day 수정", description = "관리자 전용")
    @PutMapping("/{dayId}")
    public ResponseEntity<DayResponse> updateDay(
            @PathVariable Long dayId,
            @Valid @RequestBody DayRequest request) {
        return ResponseEntity.ok(wordService.updateDay(dayId, request));
    }

    /**
     * Day 삭제 (관리자 전용)
     *
     * DELETE /api/days/{dayId}
     */
    @Operation(summary = "Day 삭제", description = "관리자 전용 - 하위 단어도 함께 삭제됩니다")
    @DeleteMapping("/{dayId}")
    public ResponseEntity<Void> deleteDay(@PathVariable Long dayId) {
        wordService.deleteDay(dayId);
        return ResponseEntity.noContent().build();
    }
}
