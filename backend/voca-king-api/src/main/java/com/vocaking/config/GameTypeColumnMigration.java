package com.vocaking.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * game_progress.game_type 컬럼 마이그레이션
 *
 * Hibernate 6이 MySQL ENUM('LISTEN','BANANA','ANIMAL')로 생성한 컬럼은
 * ddl-auto: update로 변경되지 않아 FLASH 저장이 실패함 → VARCHAR(20)으로 변경
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class GameTypeColumnMigration implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            List<String> types = jdbcTemplate.queryForList(
                    "SELECT DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS " +
                    "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'game_progress' AND COLUMN_NAME = 'game_type'",
                    String.class);

            if (!types.isEmpty() && "enum".equalsIgnoreCase(types.get(0))) {
                jdbcTemplate.execute("ALTER TABLE game_progress MODIFY game_type VARCHAR(20) NOT NULL");
                log.info("game_progress.game_type 컬럼을 VARCHAR(20)으로 변경했습니다.");
            }
        } catch (Exception e) {
            log.error("game_type 컬럼 마이그레이션 실패", e);
        }
    }
}
