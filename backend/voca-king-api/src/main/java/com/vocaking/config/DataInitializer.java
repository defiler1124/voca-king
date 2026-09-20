package com.vocaking.config;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vocaking.entity.Day;
import com.vocaking.entity.Level;
import com.vocaking.entity.User;
import com.vocaking.entity.Word;
import com.vocaking.repository.DayRepository;
import com.vocaking.repository.LevelRepository;
import com.vocaking.repository.UserRepository;
import com.vocaking.repository.WordRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.util.List;

/**
 * 초기 데이터 생성
 *
 * test.html의 모든 레벨/Day/단어 데이터를 로드
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final LevelRepository levelRepository;
    private final DayRepository dayRepository;
    private final WordRepository wordRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public void run(String... args) {
        // 이미 데이터가 있으면 스킵
        if (levelRepository.count() > 0) {
            log.info("데이터가 이미 존재합니다. 초기화를 건너뜁니다.");
            return;
        }

        log.info("초기 데이터 생성 시작...");

        // 관리자 계정 생성
        createAdminUser();

        // 테스트 학생 계정 생성
        createStudentUser();

        // JSON 파일에서 레벨 및 단어 데이터 로드
        loadDataFromJson();

        log.info("초기 데이터 생성 완료!");
    }

    private void createAdminUser() {
        if (userRepository.findByEmail("admin@vocaking.com").isEmpty()) {
            User admin = User.builder()
                    .email("admin@vocaking.com")
                    .password(passwordEncoder.encode("admin123"))
                    .name("관리자")
                    .role(User.Role.ADMIN)
                    .active(true)
                    .build();
            userRepository.save(admin);
            log.info("관리자 계정 생성: admin@vocaking.com / admin123");
        }
    }

    private void createStudentUser() {
        if (userRepository.findByEmail("student@vocaking.com").isEmpty()) {
            User student = User.builder()
                    .email("student@vocaking.com")
                    .password(passwordEncoder.encode("student123"))
                    .name("테스트학생")
                    .role(User.Role.STUDENT)
                    .active(true)
                    .build();
            userRepository.save(student);
            log.info("학생 계정 생성: student@vocaking.com / student123");
        }
    }

    private void loadDataFromJson() {
        try {
            ClassPathResource resource = new ClassPathResource("data/initial-data.json");
            InputStream inputStream = resource.getInputStream();

            List<LevelData> levelsData = objectMapper.readValue(
                inputStream,
                new TypeReference<List<LevelData>>() {}
            );

            int totalDays = 0;
            int totalWords = 0;

            for (int levelIdx = 0; levelIdx < levelsData.size(); levelIdx++) {
                LevelData levelData = levelsData.get(levelIdx);

                // 레벨 생성
                Level level = Level.builder()
                        .name(levelData.getName())
                        .color(levelData.getColor())
                        .lightColor(levelData.getLightColor())
                        .orderIndex(levelIdx + 1)
                        .build();
                levelRepository.save(level);

                // Days 생성
                for (DayData dayData : levelData.getDays()) {
                    Day day = Day.builder()
                            .level(level)
                            .dayNumber(dayData.getDayNumber())
                            .title("Day " + dayData.getDayNumber())
                            .build();
                    dayRepository.save(day);
                    totalDays++;

                    // 단어 생성
                    List<List<String>> words = dayData.getWords();
                    for (int i = 0; i < words.size(); i++) {
                        List<String> wordPair = words.get(i);
                        if (wordPair.size() >= 2) {
                            Word word = Word.builder()
                                    .day(day)
                                    .english(wordPair.get(0))
                                    .korean(wordPair.get(1))
                                    .orderIndex(i + 1)
                                    .build();
                            wordRepository.save(word);
                            totalWords++;
                        }
                    }
                }

                log.info("레벨 {} 생성 완료 ({} days)", levelData.getName(), levelData.getDays().size());
            }

            log.info("총 레벨 {}개, Day {}개, 단어 {}개 생성 완료", levelsData.size(), totalDays, totalWords);

        } catch (Exception e) {
            log.error("JSON 데이터 로드 실패", e);
            throw new RuntimeException("초기 데이터 로드 실패", e);
        }
    }

    // JSON 파싱용 DTO 클래스들
    @Data
    static class LevelData {
        private int id;
        private String name;
        private String color;
        private String lightColor;
        private List<DayData> days;
    }

    @Data
    static class DayData {
        private int dayNumber;
        private List<List<String>> words;
    }
}
