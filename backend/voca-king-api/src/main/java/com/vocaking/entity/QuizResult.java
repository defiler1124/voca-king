package com.vocaking.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * 퀴즈 결과 엔티티
 *
 * 사용자의 퀴즈 점수와 학습 기록 저장
 */
@Entity
@Table(name = "quiz_results")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 퀴즈를 푼 사용자 */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** 퀴즈 대상 Day */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "day_id", nullable = false)
    private Day day;

    /** 맞춘 문제 수 */
    @Column(nullable = false)
    private Integer correctCount;

    /** 총 문제 수 */
    @Column(nullable = false)
    private Integer totalCount;

    /** 점수 (백분율) */
    @Column(nullable = false)
    private Integer score;

    /** 퀴즈 완료 시간 */
    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime completedAt;
}
