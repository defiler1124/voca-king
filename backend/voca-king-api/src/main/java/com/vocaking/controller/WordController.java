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
 * 단어 API 컨트롤러
 *
 * 단어 CRUD
 */
@Tag(name = "Word", description = "단어 API")
@RestController
@RequestMapping("/api/words")
@RequiredArgsConstructor
public class WordController {

    private final WordService wordService;

    /**
     * 특정 Day의 단어 목록 조회
     *
     * GET /api/words?dayId={dayId}
     */
    @Operation(summary = "Day의 단어 목록 조회")
    @GetMapping
    public ResponseEntity<List<WordResponse>> getWordsByDay(@RequestParam Long dayId) {
        return ResponseEntity.ok(wordService.getWordsByDay(dayId));
    }

    /**
     * 단어 생성 (관리자 전용)
     *
     * POST /api/words?dayId={dayId}
     */
    @Operation(summary = "단어 생성", description = "관리자 전용")
    @PostMapping
    public ResponseEntity<WordResponse> createWord(
            @RequestParam Long dayId,
            @Valid @RequestBody WordRequest request) {
        return ResponseEntity.ok(wordService.createWord(dayId, request));
    }

    /**
     * 단어 일괄 생성 (관리자 전용)
     *
     * POST /api/words/bulk
     */
    @Operation(summary = "단어 일괄 생성", description = "관리자 전용 - 여러 단어를 한 번에 등록합니다")
    @PostMapping("/bulk")
    public ResponseEntity<List<WordResponse>> createWordsBulk(@Valid @RequestBody WordBulkRequest request) {
        return ResponseEntity.ok(wordService.createWordsBulk(request));
    }

    /**
     * 단어 수정 (관리자 전용)
     *
     * PUT /api/words/{wordId}
     */
    @Operation(summary = "단어 수정", description = "관리자 전용")
    @PutMapping("/{wordId}")
    public ResponseEntity<WordResponse> updateWord(
            @PathVariable Long wordId,
            @Valid @RequestBody WordRequest request) {
        return ResponseEntity.ok(wordService.updateWord(wordId, request));
    }

    /**
     * 단어 삭제 (관리자 전용)
     *
     * DELETE /api/words/{wordId}
     */
    @Operation(summary = "단어 삭제", description = "관리자 전용")
    @DeleteMapping("/{wordId}")
    public ResponseEntity<Void> deleteWord(@PathVariable Long wordId) {
        wordService.deleteWord(wordId);
        return ResponseEntity.noContent().build();
    }
}
