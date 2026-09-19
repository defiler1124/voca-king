package com.vocaking;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * VOCA KING API 메인 애플리케이션 클래스
 *
 * 영어 단어 학습 애플리케이션의 백엔드 API 서버
 * - 회원 인증 (JWT)
 * - 단어 관리 (레벨/Day별)
 * - 퀴즈 및 학습 진도 관리
 */
@SpringBootApplication
public class VocaKingApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(VocaKingApiApplication.class, args);
    }
}
