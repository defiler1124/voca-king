package com.vocaking.dto;

import com.vocaking.entity.GameProgress;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 게임 진도 관련 DTO
 */
public class GameProgressDto {

    /**
     * 진도 저장 요청 DTO
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SaveRequest {
        private Long dayId;
        private String gameType;  // LISTEN, BANANA, ANIMAL
        private Integer score;
        private Integer totalWords;
        private Integer stars;
        private Integer clearTime;
    }

    /**
     * 진도 응답 DTO
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {
        private Long id;
        private Long dayId;
        private String gameType;
        private Boolean completed;
        private Integer score;
        private Integer totalWords;
        private Integer stars;
        private Integer clearTime;
        private LocalDateTime completedAt;

        public static Response from(GameProgress progress) {
            return Response.builder()
                    .id(progress.getId())
                    .dayId(progress.getDay().getId())
                    .gameType(progress.getGameType().name())
                    .completed(progress.getCompleted())
                    .score(progress.getScore())
                    .totalWords(progress.getTotalWords())
                    .stars(progress.getStars())
                    .clearTime(progress.getClearTime())
                    .completedAt(progress.getUpdatedAt())
                    .build();
        }
    }

    /**
     * 진도 요약 응답 DTO (완료된 dayId 목록)
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SummaryResponse {
        private List<Long> listenCleared;
        private List<Long> bananaCleared;
        private List<Long> animalCleared;
    }

    /**
     * 학생별 진도 응답 DTO (관리자용)
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserProgressResponse {
        private Long userId;
        private String username;
        private String name;
        private Integer listenCleared;   // 클리어한 Day 수
        private Integer bananaCleared;
        private Integer animalCleared;
        private Integer totalCleared;    // 전체 클리어 수
        private LocalDateTime lastStudyAt;  // 최근 학습일
    }
}
