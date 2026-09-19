package com.vocaking.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * 사용자 엔티티
 *
 * 역할(Role):
 * - ADMIN: 관리자 (단어 등록/수정/삭제, 사용자 관리)
 * - STUDENT: 학생 (단어 학습, 퀴즈)
 */
@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 이메일 (로그인 ID) */
    @Column(nullable = false, unique = true, length = 100)
    private String email;

    /** 암호화된 비밀번호 */
    @Column(nullable = false)
    private String password;

    /** 사용자 이름 */
    @Column(nullable = false, length = 50)
    private String name;

    /** 역할 (ADMIN, STUDENT) */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    /** 계정 활성화 여부 */
    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    /** 생성일시 */
    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    /** 수정일시 */
    @UpdateTimestamp
    private LocalDateTime updatedAt;

    /**
     * 사용자 역할 열거형
     */
    public enum Role {
        ADMIN,   // 관리자
        STUDENT  // 학생
    }
}
