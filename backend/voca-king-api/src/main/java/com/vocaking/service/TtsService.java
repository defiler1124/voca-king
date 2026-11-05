package com.vocaking.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Azure TTS 서비스 (REST API 방식)
 */
@Service
@Slf4j
public class TtsService {

    @Value("${azure.speech.key:}")
    private String speechKey;

    @Value("${azure.speech.region:eastus}")
    private String speechRegion;

    @Value("${azure.speech.enabled:false}")
    private boolean ttsEnabled;

    private HttpClient httpClient;
    private String ttsEndpoint;

    // 간단한 캐시 (메모리)
    private final Map<String, byte[]> audioCache = new ConcurrentHashMap<>();
    private static final int MAX_CACHE_SIZE = 1000;

    @PostConstruct
    public void init() {
        if (ttsEnabled && speechKey != null && !speechKey.isEmpty()) {
            httpClient = HttpClient.newHttpClient();
            ttsEndpoint = String.format("https://%s.tts.speech.microsoft.com/cognitiveservices/v1", speechRegion);
            log.info("Azure TTS 초기화 완료 (region: {})", speechRegion);
        } else {
            log.info("Azure TTS 비활성화 상태");
        }
    }

    /**
     * 텍스트를 음성으로 변환
     *
     * @param text 변환할 텍스트
     * @return MP3 오디오 데이터
     */
    public byte[] synthesize(String text) {
        if (!ttsEnabled || httpClient == null) {
            throw new RuntimeException("TTS 서비스가 비활성화되어 있습니다");
        }

        // 캐시 확인
        String cacheKey = text.toLowerCase().trim();
        if (audioCache.containsKey(cacheKey)) {
            return audioCache.get(cacheKey);
        }

        try {
            // SSML 형식으로 요청
            String ssml = String.format("""
                <speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>
                    <voice name='en-US-JennyNeural'>
                        <prosody rate='-10%%'>%s</prosody>
                    </voice>
                </speak>
                """, escapeXml(text));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(ttsEndpoint))
                    .header("Ocp-Apim-Subscription-Key", speechKey)
                    .header("Content-Type", "application/ssml+xml")
                    .header("X-Microsoft-OutputFormat", "audio-16khz-128kbitrate-mono-mp3")
                    .header("User-Agent", "VocaKing")
                    .POST(HttpRequest.BodyPublishers.ofString(ssml))
                    .build();

            HttpResponse<byte[]> response = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());

            if (response.statusCode() == 200) {
                byte[] audioData = response.body();

                // 캐시 저장 (최대 크기 제한)
                if (audioCache.size() < MAX_CACHE_SIZE) {
                    audioCache.put(cacheKey, audioData);
                }

                return audioData;
            } else {
                log.error("Azure TTS API 오류: {} - {}", response.statusCode(), new String(response.body()));
                throw new RuntimeException("음성 변환 실패: HTTP " + response.statusCode());
            }
        } catch (Exception e) {
            log.error("TTS 변환 실패: {}", e.getMessage());
            throw new RuntimeException("음성 변환에 실패했습니다: " + e.getMessage());
        }
    }

    /**
     * XML 특수문자 이스케이프
     */
    private String escapeXml(String text) {
        return text
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&apos;");
    }

    /**
     * TTS 활성화 여부 확인
     */
    public boolean isEnabled() {
        return ttsEnabled && httpClient != null;
    }
}
