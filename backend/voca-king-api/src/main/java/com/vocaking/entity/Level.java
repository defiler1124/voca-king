package com.vocaking.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

/**
 * 레벨 엔티티
 *
 * 단어 학습 난이도 레벨
 * 예: Lv.1 Newbie, Lv.5 Master, Lv.10 Legend 등
 */
@Entity
@Table(name = "levels")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Level {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 레벨 이름 (예: "Lv.1 Newbie") */
    @Column(nullable = false, length = 50)
    private String name;

    /** 레벨 색상 (CSS 변수 또는 HEX 코드) */
    @Column(length = 20)
    private String color;

    /** 레벨 연한 색상 (배경용) */
    @Column(length = 20)
    private String lightColor;

    /** 정렬 순서 */
    @Column(nullable = false)
    private Integer orderIndex;

    /** 해당 레벨의 Day 목록 */
    @OneToMany(mappedBy = "level", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("dayNumber ASC")
    @Builder.Default
    private List<Day> days = new ArrayList<>();
}
