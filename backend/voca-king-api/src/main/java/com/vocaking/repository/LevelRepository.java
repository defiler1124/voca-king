package com.vocaking.repository;

import com.vocaking.entity.Level;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 레벨 레포지토리
 */
@Repository
public interface LevelRepository extends JpaRepository<Level, Long> {

    /** 정렬 순서대로 모든 레벨 조회 */
    List<Level> findAllByOrderByOrderIndexAsc();
}
