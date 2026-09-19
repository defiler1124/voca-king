package com.vocaking.dto;

import com.vocaking.entity.Day;
import com.vocaking.entity.Level;
import com.vocaking.entity.Word;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;

/**
 * 단어 관련 DTO
 */
public class WordDto {

    /**
     * 레벨 응답 DTO
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LevelResponse {
        private Long id;
        private String name;
        private String color;
        private String lightColor;
        private Integer orderIndex;
        private Integer dayCount;

        public static LevelResponse from(Level level) {
            return LevelResponse.builder()
                    .id(level.getId())
                    .name(level.getName())
                    .color(level.getColor())
                    .lightColor(level.getLightColor())
                    .orderIndex(level.getOrderIndex())
                    .dayCount(level.getDays().size())
                    .build();
        }
    }

    /**
     * Day 응답 DTO
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DayResponse {
        private Long id;
        private Long levelId;
        private Integer dayNumber;
        private String title;
        private Integer wordCount;

        public static DayResponse from(Day day) {
            return DayResponse.builder()
                    .id(day.getId())
                    .levelId(day.getLevel().getId())
                    .dayNumber(day.getDayNumber())
                    .title(day.getTitle())
                    .wordCount(day.getWords().size())
                    .build();
        }
    }

    /**
     * Day 상세 응답 DTO (단어 목록 포함)
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DayDetailResponse {
        private Long id;
        private Long levelId;
        private String levelName;
        private Integer dayNumber;
        private String title;
        private List<WordResponse> words;

        public static DayDetailResponse from(Day day) {
            return DayDetailResponse.builder()
                    .id(day.getId())
                    .levelId(day.getLevel().getId())
                    .levelName(day.getLevel().getName())
                    .dayNumber(day.getDayNumber())
                    .title(day.getTitle())
                    .words(day.getWords().stream()
                            .map(WordResponse::from)
                            .toList())
                    .build();
        }
    }

    /**
     * 단어 응답 DTO
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class WordResponse {
        private Long id;
        private String english;
        private String korean;
        private Integer orderIndex;
        private String example;
        private String pronunciation;

        public static WordResponse from(Word word) {
            return WordResponse.builder()
                    .id(word.getId())
                    .english(word.getEnglish())
                    .korean(word.getKorean())
                    .orderIndex(word.getOrderIndex())
                    .example(word.getExample())
                    .pronunciation(word.getPronunciation())
                    .build();
        }
    }

    /**
     * 단어 생성/수정 요청 DTO
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WordRequest {

        @NotBlank(message = "영어 단어는 필수입니다")
        private String english;

        @NotBlank(message = "한글 뜻은 필수입니다")
        private String korean;

        private Integer orderIndex;
        private String example;
        private String pronunciation;
    }

    /**
     * 단어 일괄 등록 요청 DTO
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WordBulkRequest {

        @NotNull(message = "Day ID는 필수입니다")
        private Long dayId;

        private List<WordRequest> words;
    }

    /**
     * 레벨 생성/수정 요청 DTO
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LevelRequest {

        @NotBlank(message = "레벨 이름은 필수입니다")
        private String name;

        private String color;
        private String lightColor;
        private Integer orderIndex;
    }

    /**
     * Day 생성/수정 요청 DTO
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DayRequest {

        @NotNull(message = "레벨 ID는 필수입니다")
        private Long levelId;

        @NotNull(message = "Day 번호는 필수입니다")
        private Integer dayNumber;

        private String title;
    }
}
