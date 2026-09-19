package com.vocaking.repository;

import com.vocaking.entity.Day;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Day 레포지토리
 */
@Repository
public interface DayRepository extends JpaRepository<Day, Long> {

    /** 특정 레벨의 모든 Day 조회 */
    List<Day> findByLevelIdOrderByDayNumberAsc(Long levelId);

    /** 특정 레벨의 특정 Day 조회 */
    Optional<Day> findByLevelIdAndDayNumber(Long levelId, Integer dayNumber);
}
