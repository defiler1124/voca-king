package com.vocaking.config;

import com.vocaking.entity.Day;
import com.vocaking.entity.Level;
import com.vocaking.entity.User;
import com.vocaking.entity.Word;
import com.vocaking.repository.DayRepository;
import com.vocaking.repository.LevelRepository;
import com.vocaking.repository.UserRepository;
import com.vocaking.repository.WordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * 초기 데이터 생성
 *
 * dev/prod 프로파일 모두에서 실행 (빈 DB일 경우만)
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

        // 레벨 및 샘플 단어 생성
        createLevelsAndWords();

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

    private void createLevelsAndWords() {
        // 레벨 1 생성
        Level level1 = Level.builder()
                .name("Lv.1 Newbie")
                .color("#D32F3F")
                .lightColor("#FFE5E5")
                .orderIndex(1)
                .build();
        levelRepository.save(level1);

        // Day 1 생성
        Day day1 = Day.builder()
                .level(level1)
                .dayNumber(1)
                .title("기초 단어")
                .build();
        dayRepository.save(day1);

        // 샘플 단어 추가
        String[][] words1 = {
            {"apple", "사과"},
            {"banana", "바나나"},
            {"cat", "고양이"},
            {"dog", "개"},
            {"elephant", "코끼리"},
            {"fish", "물고기"},
            {"giraffe", "기린"},
            {"horse", "말"},
            {"ice cream", "아이스크림"},
            {"juice", "주스"}
        };

        for (int i = 0; i < words1.length; i++) {
            Word word = Word.builder()
                    .day(day1)
                    .english(words1[i][0])
                    .korean(words1[i][1])
                    .orderIndex(i + 1)
                    .build();
            wordRepository.save(word);
        }

        // Day 2 생성
        Day day2 = Day.builder()
                .level(level1)
                .dayNumber(2)
                .title("가족")
                .build();
        dayRepository.save(day2);

        String[][] words2 = {
            {"father", "아버지"},
            {"mother", "어머니"},
            {"brother", "형제, 남동생"},
            {"sister", "자매, 여동생"},
            {"grandfather", "할아버지"},
            {"grandmother", "할머니"},
            {"uncle", "삼촌, 외삼촌"},
            {"aunt", "이모, 고모"},
            {"cousin", "사촌"},
            {"family", "가족"}
        };

        for (int i = 0; i < words2.length; i++) {
            Word word = Word.builder()
                    .day(day2)
                    .english(words2[i][0])
                    .korean(words2[i][1])
                    .orderIndex(i + 1)
                    .build();
            wordRepository.save(word);
        }

        // 레벨 2 생성
        Level level2 = Level.builder()
                .name("Lv.2 Newbie")
                .color("#A84D00")
                .lightColor("#FFF3E0")
                .orderIndex(2)
                .build();
        levelRepository.save(level2);

        Day day3 = Day.builder()
                .level(level2)
                .dayNumber(1)
                .title("학교")
                .build();
        dayRepository.save(day3);

        String[][] words3 = {
            {"school", "학교"},
            {"teacher", "선생님"},
            {"student", "학생"},
            {"classroom", "교실"},
            {"desk", "책상"},
            {"chair", "의자"},
            {"book", "책"},
            {"pencil", "연필"},
            {"eraser", "지우개"},
            {"notebook", "공책"}
        };

        for (int i = 0; i < words3.length; i++) {
            Word word = Word.builder()
                    .day(day3)
                    .english(words3[i][0])
                    .korean(words3[i][1])
                    .orderIndex(i + 1)
                    .build();
            wordRepository.save(word);
        }

        log.info("레벨 2개, Day 3개, 단어 30개 생성 완료");
    }
}
