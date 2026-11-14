package com.vocaking.repository;

import com.vocaking.entity.GameProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 게임 진도 레포지토리
 */
@Repository
public interface GameProgressRepository extends JpaRepository<GameProgress, Long> {

    /**
     * 특정 사용자의 특정 Day, 게임타입 진도 조회
     */
    Optional<GameProgress> findByUserIdAndDayIdAndGameType(Long userId, Long dayId, GameProgress.GameType gameType);

    /**
     * 특정 사용자의 모든 완료된 Day 목록 (게임타입별)
     */
    List<GameProgress> findByUserIdAndGameTypeAndCompletedTrue(Long userId, GameProgress.GameType gameType);

    /**
     * 특정 사용자의 특정 레벨 진도 조회
     */
    @Query("SELECT gp FROM GameProgress gp WHERE gp.user.id = :userId AND gp.day.level.id = :levelId")
    List<GameProgress> findByUserIdAndLevelId(@Param("userId") Long userId, @Param("levelId") Long levelId);

    /**
     * 특정 사용자의 전체 진도 조회
     */
    List<GameProgress> findByUserId(Long userId);
}
