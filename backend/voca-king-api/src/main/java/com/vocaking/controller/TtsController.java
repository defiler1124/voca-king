package com.vocaking.controller;

import com.vocaking.service.TtsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * TTS API 컨트롤러
 */
@Tag(name = "TTS", description = "Text-to-Speech API")
@RestController
@RequestMapping("/api/tts")
@RequiredArgsConstructor
public class TtsController {

    private final TtsService ttsService;

    /**
     * 텍스트를 음성으로 변환
     *
     * GET /api/tts/speak?text=hello
     */
    @Operation(summary = "텍스트 음성 변환", description = "영어 텍스트를 음성(MP3)으로 변환합니다")
    @GetMapping("/speak")
    public ResponseEntity<byte[]> speak(@RequestParam String text) {
        if (!ttsService.isEnabled()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(null);
        }

        if (text == null || text.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(null);
        }

        // 텍스트 길이 제한 (100자)
        if (text.length() > 100) {
            text = text.substring(0, 100);
        }

        try {
            byte[] audioData = ttsService.synthesize(text.trim());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("audio/mpeg"));
            headers.setContentLength(audioData.length);
            headers.setCacheControl("public, max-age=86400");  // 24시간 캐시

            return new ResponseEntity<>(audioData, headers, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    /**
     * TTS 상태 확인
     *
     * GET /api/tts/status
     */
    @Operation(summary = "TTS 상태 확인", description = "TTS 서비스 활성화 여부를 확인합니다")
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> status() {
        return ResponseEntity.ok(Map.of(
                "enabled", ttsService.isEnabled(),
                "provider", "Azure TTS"
        ));
    }
}
