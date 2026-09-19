package com.vocaking.repository;

import com.vocaking.entity.Word;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 단어 레포지토리
 */
@Repository
public interface WordRepository extends JpaRepository<Word, Long> {

    /** 특정 Day의 모든 단어 조회 (정렬순) */
    List<Word> findByDayIdOrderByOrderIndexAsc(Long dayId);

    /** 특정 레벨의 모든 단어 조회 (퀴즈 오답 생성용) */
    @Query("SELECT w FROM Word w WHERE w.day.level.id = :levelId")
    List<Word> findAllByLevelId(@Param("levelId") Long levelId);

    /** 특정 Day의 단어 개수 */
    long countByDayId(Long dayId);
}
