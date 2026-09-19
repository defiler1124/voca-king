package com.vocaking.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

/**
 * Day 엔티티
 *
 * 각 레벨 내의 학습 일차
 * 하루에 학습할 단어들을 그룹화
 */
@Entity
@Table(name = "days", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"level_id", "day_number"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Day {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 소속 레벨 */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "level_id", nullable = false)
    private Level level;

    /** Day 번호 (1, 2, 3, ...) */
    @Column(name = "day_number", nullable = false)
    private Integer dayNumber;

    /** Day 제목 (선택사항, 예: "가족/친척") */
    @Column(length = 100)
    private String title;

    /** 해당 Day의 단어 목록 */
    @OneToMany(mappedBy = "day", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex ASC")
    @Builder.Default
    private List<Word> words = new ArrayList<>();
}
