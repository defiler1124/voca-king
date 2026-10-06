package com.vocaking.repository;

import com.vocaking.entity.WordAttempt;
import com.vocaking.entity.WordAttempt.AttemptType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 단어 학습 시도 레포지토리
 */
@Repository
public interface WordAttemptRepository extends JpaRepository<WordAttempt, Long> {

    /** 사용자의 모든 시도 횟수 */
    long countByUserId(Long userId);

    /** 사용자의 타입별 시도 횟수 */
    long countByUserIdAndAttemptType(Long userId, AttemptType attemptType);

    /** 사용자의 퀴즈 정답 횟수 */
    long countByUserIdAndAttemptTypeAndCorrect(Long userId, AttemptType attemptType, Boolean correct);

    /** 사용자의 최근 학습 기록 */
    List<WordAttempt> findTop50ByUserIdOrderByCreatedAtDesc(Long userId);

    /** 사용자의 특정 기간 학습 횟수 */
    long countByUserIdAndCreatedAtAfter(Long userId, LocalDateTime after);

    /** 사용자별 학습 통계 (총 시도, 퀴즈 정답, 퀴즈 오답) */
    @Query("SELECT wa.user.id, COUNT(wa), " +
           "SUM(CASE WHEN wa.attemptType = 'QUIZ' AND wa.correct = true THEN 1 ELSE 0 END), " +
           "SUM(CASE WHEN wa.attemptType = 'QUIZ' AND wa.correct = false THEN 1 ELSE 0 END) " +
           "FROM WordAttempt wa GROUP BY wa.user.id")
    List<Object[]> getUserStatistics();

    /** 특정 사용자의 단어별 오답 횟수 (많은 순) */
    @Query("SELECT wa.word.id, wa.word.english, wa.word.korean, COUNT(wa) as wrongCount " +
           "FROM WordAttempt wa " +
           "WHERE wa.user.id = :userId AND wa.attemptType = 'QUIZ' AND wa.correct = false " +
           "GROUP BY wa.word.id, wa.word.english, wa.word.korean " +
           "ORDER BY wrongCount DESC")
    List<Object[]> getWrongWordsByUser(@Param("userId") Long userId);

    /** 오늘 학습한 사용자 수 */
    @Query("SELECT COUNT(DISTINCT wa.user.id) FROM WordAttempt wa WHERE wa.createdAt >= :today")
    long countActiveUsersToday(@Param("today") LocalDateTime today);
}
