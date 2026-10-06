package com.vocaking.dto;

import com.vocaking.entity.WordAttempt.AttemptType;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 학습 관련 DTO
 */
public class LearningDto {

    /**
     * 단어 학습 기록 요청
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AttemptRequest {
        @NotNull
        private Long wordId;

        @NotNull
        private AttemptType attemptType;

        private Boolean correct;

        private String selectedAnswer;
    }

    /**
     * 퀴즈 결과 저장 요청
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuizResultRequest {
        @NotNull
        private Long dayId;

        @NotNull
        private Integer correctCount;

        @NotNull
        private Integer totalCount;

        /** 개별 문제 결과 */
        private List<AttemptRequest> attempts;
    }

    /**
     * 사용자 학습 통계 응답
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserStatsResponse {
        private Long userId;
        private String userName;
        private String username;

        /** 총 학습 횟수 */
        private Long totalAttempts;

        /** 발음 듣기 횟수 */
        private Long listenCount;

        /** 셀프테스트 횟수 */
        private Long flashCount;

        /** 퀴즈 시도 횟수 */
        private Long quizAttempts;

        /** 퀴즈 정답 수 */
        private Long quizCorrect;

        /** 퀴즈 오답 수 */
        private Long quizWrong;

        /** 정답률 (%) */
        private Double accuracyRate;

        /** 오늘 학습 횟수 */
        private Long todayAttempts;

        /** 최근 학습일 */
        private LocalDateTime lastStudyAt;

        /** 가입일 */
        private LocalDateTime createdAt;
    }

    /**
     * 오답 단어 정보
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class WrongWordInfo {
        private Long wordId;
        private String english;
        private String korean;
        private Long wrongCount;
    }

    /**
     * 사용자 상세 학습 통계
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserDetailStatsResponse {
        private UserStatsResponse stats;
        private List<WrongWordInfo> wrongWords;
        private List<QuizHistoryResponse> recentQuizzes;
    }

    /**
     * 퀴즈 이력
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class QuizHistoryResponse {
        private Long id;
        private String dayTitle;
        private Integer dayNumber;
        private String levelName;
        private Integer correctCount;
        private Integer totalCount;
        private Integer score;
        private LocalDateTime completedAt;
    }

    /**
     * 전체 통계 요약 (관리자용)
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OverallStatsResponse {
        private Long totalUsers;
        private Long activeUsersToday;
        private Long totalAttempts;
        private Long totalQuizzes;
        private Double averageAccuracy;
    }
}
