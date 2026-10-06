package com.vocaking.service;

import com.vocaking.dto.LearningDto.*;
import com.vocaking.entity.*;
import com.vocaking.entity.WordAttempt.AttemptType;
import com.vocaking.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 학습 통계 서비스
 */
@Service
@RequiredArgsConstructor
public class LearningService {

    private final WordAttemptRepository wordAttemptRepository;
    private final QuizResultRepository quizResultRepository;
    private final UserRepository userRepository;
    private final WordRepository wordRepository;
    private final DayRepository dayRepository;

    /**
     * 단어 학습 기록
     */
    @Transactional
    public void recordAttempt(Long userId, AttemptRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다"));
        Word word = wordRepository.findById(request.getWordId())
                .orElseThrow(() -> new RuntimeException("단어를 찾을 수 없습니다"));

        WordAttempt attempt = WordAttempt.builder()
                .user(user)
                .word(word)
                .attemptType(request.getAttemptType())
                .correct(request.getCorrect() != null ? request.getCorrect() : true)
                .selectedAnswer(request.getSelectedAnswer())
                .build();

        wordAttemptRepository.save(attempt);
    }

    /**
     * 퀴즈 결과 저장
     */
    @Transactional
    public void saveQuizResult(Long userId, QuizResultRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다"));
        Day day = dayRepository.findById(request.getDayId())
                .orElseThrow(() -> new RuntimeException("Day를 찾을 수 없습니다"));

        // 퀴즈 결과 저장
        int score = (int) Math.round((double) request.getCorrectCount() / request.getTotalCount() * 100);
        QuizResult quizResult = QuizResult.builder()
                .user(user)
                .day(day)
                .correctCount(request.getCorrectCount())
                .totalCount(request.getTotalCount())
                .score(score)
                .build();
        quizResultRepository.save(quizResult);

        // 개별 문제 결과 저장
        if (request.getAttempts() != null) {
            for (AttemptRequest attemptReq : request.getAttempts()) {
                recordAttempt(userId, attemptReq);
            }
        }
    }

    /**
     * 모든 사용자 통계 조회 (관리자용)
     */
    @Transactional(readOnly = true)
    public List<UserStatsResponse> getAllUserStats() {
        List<User> users = userRepository.findAll();
        LocalDateTime today = LocalDate.now().atStartOfDay();

        return users.stream()
                .filter(u -> u.getRole() == User.Role.STUDENT)
                .map(user -> buildUserStats(user, today))
                .collect(Collectors.toList());
    }

    /**
     * 특정 사용자 통계 조회
     */
    @Transactional(readOnly = true)
    public UserStatsResponse getUserStats(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다"));
        LocalDateTime today = LocalDate.now().atStartOfDay();
        return buildUserStats(user, today);
    }

    /**
     * 사용자 상세 통계 조회
     */
    @Transactional(readOnly = true)
    public UserDetailStatsResponse getUserDetailStats(Long userId) {
        UserStatsResponse stats = getUserStats(userId);

        // 오답 단어 목록
        List<Object[]> wrongWordsData = wordAttemptRepository.getWrongWordsByUser(userId);
        List<WrongWordInfo> wrongWords = wrongWordsData.stream()
                .limit(20)
                .map(row -> WrongWordInfo.builder()
                        .wordId((Long) row[0])
                        .english((String) row[1])
                        .korean((String) row[2])
                        .wrongCount((Long) row[3])
                        .build())
                .collect(Collectors.toList());

        // 최근 퀴즈 이력
        List<QuizResult> quizResults = quizResultRepository.findByUserIdOrderByCompletedAtDesc(userId);
        List<QuizHistoryResponse> recentQuizzes = quizResults.stream()
                .limit(20)
                .map(qr -> QuizHistoryResponse.builder()
                        .id(qr.getId())
                        .dayTitle(qr.getDay().getTitle())
                        .dayNumber(qr.getDay().getDayNumber())
                        .levelName(qr.getDay().getLevel().getName())
                        .correctCount(qr.getCorrectCount())
                        .totalCount(qr.getTotalCount())
                        .score(qr.getScore())
                        .completedAt(qr.getCompletedAt())
                        .build())
                .collect(Collectors.toList());

        return UserDetailStatsResponse.builder()
                .stats(stats)
                .wrongWords(wrongWords)
                .recentQuizzes(recentQuizzes)
                .build();
    }

    /**
     * 전체 통계 요약
     */
    @Transactional(readOnly = true)
    public OverallStatsResponse getOverallStats() {
        LocalDateTime today = LocalDate.now().atStartOfDay();

        long totalUsers = userRepository.count();
        long activeUsersToday = wordAttemptRepository.countActiveUsersToday(today);
        long totalAttempts = wordAttemptRepository.count();
        long totalQuizzes = quizResultRepository.count();

        // 평균 정답률 계산
        long totalQuizCorrect = wordAttemptRepository.countByUserIdAndAttemptTypeAndCorrect(null, AttemptType.QUIZ, true);
        long totalQuizAttempts = wordAttemptRepository.countByUserIdAndAttemptType(null, AttemptType.QUIZ);
        double avgAccuracy = totalQuizAttempts > 0 ? (double) totalQuizCorrect / totalQuizAttempts * 100 : 0;

        return OverallStatsResponse.builder()
                .totalUsers(totalUsers)
                .activeUsersToday(activeUsersToday)
                .totalAttempts(totalAttempts)
                .totalQuizzes(totalQuizzes)
                .averageAccuracy(Math.round(avgAccuracy * 10) / 10.0)
                .build();
    }

    /**
     * 사용자 통계 빌드 헬퍼
     */
    private UserStatsResponse buildUserStats(User user, LocalDateTime today) {
        Long userId = user.getId();

        long totalAttempts = wordAttemptRepository.countByUserId(userId);
        long listenCount = wordAttemptRepository.countByUserIdAndAttemptType(userId, AttemptType.LISTEN);
        long flashCount = wordAttemptRepository.countByUserIdAndAttemptType(userId, AttemptType.FLASH);
        long quizAttempts = wordAttemptRepository.countByUserIdAndAttemptType(userId, AttemptType.QUIZ);
        long quizCorrect = wordAttemptRepository.countByUserIdAndAttemptTypeAndCorrect(userId, AttemptType.QUIZ, true);
        long quizWrong = wordAttemptRepository.countByUserIdAndAttemptTypeAndCorrect(userId, AttemptType.QUIZ, false);
        long todayAttempts = wordAttemptRepository.countByUserIdAndCreatedAtAfter(userId, today);

        double accuracyRate = quizAttempts > 0 ? (double) quizCorrect / quizAttempts * 100 : 0;

        // 최근 학습일
        List<WordAttempt> recentAttempts = wordAttemptRepository.findTop50ByUserIdOrderByCreatedAtDesc(userId);
        LocalDateTime lastStudyAt = recentAttempts.isEmpty() ? null : recentAttempts.get(0).getCreatedAt();

        return UserStatsResponse.builder()
                .userId(userId)
                .userName(user.getName())
                .username(user.getUsername())
                .totalAttempts(totalAttempts)
                .listenCount(listenCount)
                .flashCount(flashCount)
                .quizAttempts(quizAttempts)
                .quizCorrect(quizCorrect)
                .quizWrong(quizWrong)
                .accuracyRate(Math.round(accuracyRate * 10) / 10.0)
                .todayAttempts(todayAttempts)
                .lastStudyAt(lastStudyAt)
                .createdAt(user.getCreatedAt())
                .build();
    }
}
