package com.vocaking.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * 단어 엔티티
 *
 * 영어 단어와 한글 뜻을 저장
 */
@Entity
@Table(name = "words")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Word {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 소속 Day */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "day_id", nullable = false)
    private Day day;

    /** 영어 단어 */
    @Column(nullable = false, length = 100)
    private String english;

    /** 한글 뜻 */
    @Column(nullable = false, length = 200)
    private String korean;

    /** 정렬 순서 */
    @Column(nullable = false)
    @Builder.Default
    private Integer orderIndex = 0;

    /** 예문 (선택사항) */
    @Column(length = 500)
    private String example;

    /** 발음 기호 (선택사항) */
    @Column(length = 100)
    private String pronunciation;
}
