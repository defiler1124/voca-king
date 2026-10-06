package com.vocaking.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * 단어 학습 시도 엔티티
 *
 * 사용자가 단어를 학습하거나 퀴즈에서 답한 기록
 */
@Entity
@Table(name = "word_attempts", indexes = {
    @Index(name = "idx_word_attempt_user", columnList = "user_id"),
    @Index(name = "idx_word_attempt_word", columnList = "word_id"),
    @Index(name = "idx_word_attempt_created", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WordAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 학습한 사용자 */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** 학습한 단어 */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "word_id", nullable = false)
    private Word word;

    /** 시도 유형 (LISTEN: 발음듣기, FLASH: 셀프테스트, QUIZ: 파이널테스트) */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AttemptType attemptType;

    /** 정답 여부 (QUIZ 타입일 때만 의미있음) */
    @Column(nullable = false)
    @Builder.Default
    private Boolean correct = true;

    /** 선택한 답 (오답일 경우 기록) */
    @Column(length = 100)
    private String selectedAnswer;

    /** 생성일시 */
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    /**
     * 시도 유형 열거형
     */
    public enum AttemptType {
        LISTEN,  // 발음 듣기
        FLASH,   // 셀프테스트 (플래시카드)
        QUIZ     // 파이널테스트
    }
}
