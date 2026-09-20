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

    // 12개 레벨 정의
    private static final String[][] LEVELS = {
        {"Lv.1 Newbie", "#D32F3F", "#FFE5E5"},
        {"Lv.2 Starter", "#E64A19", "#FBE9E7"},
        {"Lv.3 Beginner", "#F57C00", "#FFF3E0"},
        {"Lv.4 Elementary", "#FFA000", "#FFF8E1"},
        {"Lv.5 Pre-Intermediate", "#AFB42B", "#F9FBE7"},
        {"Lv.6 Intermediate", "#689F38", "#DCEDC8"},
        {"Lv.7 Upper-Intermediate", "#00897B", "#E0F2F1"},
        {"Lv.8 Pre-Advanced", "#0097A7", "#E0F7FA"},
        {"Lv.9 Advanced", "#1976D2", "#E3F2FD"},
        {"Lv.10 Upper-Advanced", "#512DA8", "#EDE7F6"},
        {"Lv.11 Expert", "#7B1FA2", "#F3E5F5"},
        {"Lv.12 Voca King", "#C2185B", "#FCE4EC"}
    };

    // 샘플 단어 데이터 (레벨별로 다양한 주제)
    private static final String[][][] SAMPLE_WORDS = {
        // Level 1 - 기초 단어
        {
            {"apple", "사과"}, {"banana", "바나나"}, {"cat", "고양이"}, {"dog", "개"}, {"egg", "달걀"},
            {"fish", "물고기"}, {"grape", "포도"}, {"hat", "모자"}, {"ice", "얼음"}, {"juice", "주스"}
        },
        // Level 2 - 가족/사람
        {
            {"father", "아버지"}, {"mother", "어머니"}, {"brother", "형제"}, {"sister", "자매"}, {"baby", "아기"},
            {"friend", "친구"}, {"teacher", "선생님"}, {"doctor", "의사"}, {"police", "경찰"}, {"chef", "요리사"}
        },
        // Level 3 - 학교
        {
            {"school", "학교"}, {"classroom", "교실"}, {"desk", "책상"}, {"chair", "의자"}, {"book", "책"},
            {"pencil", "연필"}, {"eraser", "지우개"}, {"notebook", "공책"}, {"ruler", "자"}, {"bag", "가방"}
        },
        // Level 4 - 음식
        {
            {"bread", "빵"}, {"rice", "밥"}, {"meat", "고기"}, {"soup", "수프"}, {"salad", "샐러드"},
            {"pizza", "피자"}, {"pasta", "파스타"}, {"chicken", "닭고기"}, {"coffee", "커피"}, {"tea", "차"}
        },
        // Level 5 - 날씨/자연
        {
            {"sun", "태양"}, {"moon", "달"}, {"star", "별"}, {"cloud", "구름"}, {"rain", "비"},
            {"snow", "눈"}, {"wind", "바람"}, {"mountain", "산"}, {"river", "강"}, {"ocean", "바다"}
        },
        // Level 6 - 교통
        {
            {"car", "자동차"}, {"bus", "버스"}, {"train", "기차"}, {"airplane", "비행기"}, {"ship", "배"},
            {"bicycle", "자전거"}, {"taxi", "택시"}, {"subway", "지하철"}, {"motorcycle", "오토바이"}, {"helicopter", "헬리콥터"}
        },
        // Level 7 - 직업
        {
            {"engineer", "엔지니어"}, {"lawyer", "변호사"}, {"nurse", "간호사"}, {"pilot", "조종사"}, {"scientist", "과학자"},
            {"artist", "예술가"}, {"musician", "음악가"}, {"journalist", "기자"}, {"architect", "건축가"}, {"accountant", "회계사"}
        },
        // Level 8 - 감정/성격
        {
            {"happy", "행복한"}, {"sad", "슬픈"}, {"angry", "화난"}, {"excited", "신나는"}, {"nervous", "긴장된"},
            {"confident", "자신감 있는"}, {"curious", "호기심 많은"}, {"patient", "인내심 있는"}, {"generous", "관대한"}, {"humble", "겸손한"}
        },
        // Level 9 - 비즈니스
        {
            {"meeting", "회의"}, {"project", "프로젝트"}, {"deadline", "마감일"}, {"budget", "예산"}, {"contract", "계약"},
            {"negotiation", "협상"}, {"presentation", "발표"}, {"strategy", "전략"}, {"investment", "투자"}, {"revenue", "수익"}
        },
        // Level 10 - 과학
        {
            {"experiment", "실험"}, {"hypothesis", "가설"}, {"theory", "이론"}, {"research", "연구"}, {"discovery", "발견"},
            {"molecule", "분자"}, {"atom", "원자"}, {"gravity", "중력"}, {"evolution", "진화"}, {"ecosystem", "생태계"}
        },
        // Level 11 - 철학/추상
        {
            {"philosophy", "철학"}, {"consciousness", "의식"}, {"existence", "존재"}, {"morality", "도덕"}, {"ethics", "윤리"},
            {"metaphysics", "형이상학"}, {"epistemology", "인식론"}, {"aesthetics", "미학"}, {"logic", "논리"}, {"wisdom", "지혜"}
        },
        // Level 12 - 고급 어휘
        {
            {"ubiquitous", "어디에나 있는"}, {"ephemeral", "덧없는"}, {"paradigm", "패러다임"}, {"eloquent", "웅변적인"}, {"pragmatic", "실용적인"},
            {"meticulous", "꼼꼼한"}, {"resilient", "회복력 있는"}, {"ambiguous", "모호한"}, {"profound", "심오한"}, {"unprecedented", "전례 없는"}
        }
    };

    @Override
    @Transactional
    public void run(String... args) {
        // 12개 레벨이 모두 있으면 스킵
        if (levelRepository.count() >= 12) {
            log.info("데이터가 이미 존재합니다. 초기화를 건너뜁니다.");
            return;
        }

        log.info("초기 데이터 생성 시작...");

        // 관리자 계정 생성
        createAdminUser();

        // 테스트 학생 계정 생성
        createStudentUser();

        // 전체 레벨 및 단어 생성
        createAllLevelsAndWords();

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

    private void createAllLevelsAndWords() {
        int totalDays = 0;
        int totalWords = 0;

        for (int levelIdx = 0; levelIdx < LEVELS.length; levelIdx++) {
            // 레벨 생성
            Level level = Level.builder()
                    .name(LEVELS[levelIdx][0])
                    .color(LEVELS[levelIdx][1])
                    .lightColor(LEVELS[levelIdx][2])
                    .orderIndex(levelIdx + 1)
                    .build();
            levelRepository.save(level);

            // 각 레벨에 20일 생성
            for (int dayNum = 1; dayNum <= 20; dayNum++) {
                Day day = Day.builder()
                        .level(level)
                        .dayNumber(dayNum)
                        .title("Day " + dayNum)
                        .build();
                dayRepository.save(day);
                totalDays++;

                // 샘플 단어 추가 (해당 레벨의 단어 데이터 사용)
                String[][] words = SAMPLE_WORDS[levelIdx];
                for (int i = 0; i < words.length; i++) {
                    Word word = Word.builder()
                            .day(day)
                            .english(words[i][0])
                            .korean(words[i][1])
                            .orderIndex(i + 1)
                            .build();
                    wordRepository.save(word);
                    totalWords++;
                }
            }

            log.info("레벨 {} 생성 완료 (20일, 단어 {}개)", LEVELS[levelIdx][0], SAMPLE_WORDS[levelIdx].length * 20);
        }

        log.info("총 레벨 12개, Day {}개, 단어 {}개 생성 완료", totalDays, totalWords);
    }
}
