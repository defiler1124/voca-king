package com.vocaking.repository;

import com.vocaking.entity.QuizResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 퀴즈 결과 레포지토리
 */
@Repository
public interface QuizResultRepository extends JpaRepository<QuizResult, Long> {

    /** 사용자의 모든 퀴즈 결과 조회 */
    List<QuizResult> findByUserIdOrderByCompletedAtDesc(Long userId);

    /** 사용자의 특정 Day 최고 점수 조회 */
    Optional<QuizResult> findTopByUserIdAndDayIdOrderByScoreDesc(Long userId, Long dayId);

    /** 사용자의 특정 Day 퀴즈 결과 목록 */
    List<QuizResult> findByUserIdAndDayIdOrderByCompletedAtDesc(Long userId, Long dayId);
}
