package com.vocaking.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * 게임 진도 엔티티
 *
 * 사용자별 Day별 게임 클리어 상태 저장
 */
@Entity
@Table(name = "game_progress", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "day_id", "game_type"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GameProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "day_id", nullable = false)
    private Day day;

    @Enumerated(EnumType.STRING)
    @Column(name = "game_type", nullable = false, length = 20)
    private GameType gameType;

    @Column(nullable = false)
    @Builder.Default
    private Boolean completed = false;

    /** 맞춘 개수 */
    private Integer score;

    /** 전체 단어 수 */
    private Integer totalWords;

    /** 별점 (1-3) */
    private Integer stars;

    /** 클리어 시간 (초) */
    private Integer clearTime;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    /**
     * 게임 타입
     */
    public enum GameType {
        LISTEN,   // 발음연습 (Stage 1)
        BANANA,   // 바나나 게임 (Stage 2)
        ANIMAL    // 동물 구출 (Stage 3)
    }
}
