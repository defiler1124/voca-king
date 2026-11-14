package com.vocaking.service;

import com.vocaking.dto.GameProgressDto.Response;
import com.vocaking.dto.GameProgressDto.SaveRequest;
import com.vocaking.dto.GameProgressDto.SummaryResponse;
import com.vocaking.entity.Day;
import com.vocaking.entity.GameProgress;
import com.vocaking.entity.User;
import com.vocaking.repository.DayRepository;
import com.vocaking.repository.GameProgressRepository;
import com.vocaking.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 게임 진도 서비스
 */
@Service
@RequiredArgsConstructor
@Transactional
public class GameProgressService {

    private final GameProgressRepository progressRepository;
    private final UserRepository userRepository;
    private final DayRepository dayRepository;

    /**
     * 진도 저장/업데이트
     */
    public Response saveProgress(String username, SaveRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));
        Day day = dayRepository.findById(request.getDayId())
                .orElseThrow(() -> new IllegalArgumentException("Day를 찾을 수 없습니다"));

        GameProgress.GameType gameType = GameProgress.GameType.valueOf(request.getGameType());

        // 기존 진도가 있으면 업데이트, 없으면 새로 생성
        GameProgress progress = progressRepository
                .findByUserIdAndDayIdAndGameType(user.getId(), day.getId(), gameType)
                .orElse(GameProgress.builder()
                        .user(user)
                        .day(day)
                        .gameType(gameType)
                        .build());

        progress.setCompleted(true);
        progress.setScore(request.getScore());
        progress.setTotalWords(request.getTotalWords());
        progress.setStars(request.getStars());
        progress.setClearTime(request.getClearTime());

        return Response.from(progressRepository.save(progress));
    }

    /**
     * 사용자 전체 진도 요약 조회
     */
    @Transactional(readOnly = true)
    public SummaryResponse getProgressSummary(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));

        List<Long> listenCleared = progressRepository
                .findByUserIdAndGameTypeAndCompletedTrue(user.getId(), GameProgress.GameType.LISTEN)
                .stream()
                .map(p -> p.getDay().getId())
                .toList();

        List<Long> bananaCleared = progressRepository
                .findByUserIdAndGameTypeAndCompletedTrue(user.getId(), GameProgress.GameType.BANANA)
                .stream()
                .map(p -> p.getDay().getId())
                .toList();

        List<Long> animalCleared = progressRepository
                .findByUserIdAndGameTypeAndCompletedTrue(user.getId(), GameProgress.GameType.ANIMAL)
                .stream()
                .map(p -> p.getDay().getId())
                .toList();

        return SummaryResponse.builder()
                .listenCleared(listenCleared)
                .bananaCleared(bananaCleared)
                .animalCleared(animalCleared)
                .build();
    }

    /**
     * 전체 학생 진도 조회 (관리자용)
     */
    @Transactional(readOnly = true)
    public List<com.vocaking.dto.GameProgressDto.UserProgressResponse> getAllUsersProgress() {
        List<User> students = userRepository.findAll().stream()
                .filter(u -> u.getRole() == User.Role.STUDENT)
                .toList();

        return students.stream().map(user -> {
            List<GameProgress> progresses = progressRepository.findByUserId(user.getId());

            int listenCount = (int) progresses.stream()
                    .filter(p -> p.getGameType() == GameProgress.GameType.LISTEN && p.getCompleted())
                    .count();
            int bananaCount = (int) progresses.stream()
                    .filter(p -> p.getGameType() == GameProgress.GameType.BANANA && p.getCompleted())
                    .count();
            int animalCount = (int) progresses.stream()
                    .filter(p -> p.getGameType() == GameProgress.GameType.ANIMAL && p.getCompleted())
                    .count();

            // 최근 학습일
            java.time.LocalDateTime lastStudyAt = progresses.stream()
                    .map(GameProgress::getUpdatedAt)
                    .filter(java.util.Objects::nonNull)
                    .max(java.time.LocalDateTime::compareTo)
                    .orElse(null);

            return com.vocaking.dto.GameProgressDto.UserProgressResponse.builder()
                    .userId(user.getId())
                    .username(user.getUsername())
                    .name(user.getName())
                    .listenCleared(listenCount)
                    .bananaCleared(bananaCount)
                    .animalCleared(animalCount)
                    .totalCleared(listenCount + bananaCount + animalCount)
                    .lastStudyAt(lastStudyAt)
                    .build();
        }).toList();
    }

    /**
     * 특정 학생의 상세 진도 조회 (관리자용)
     */
    @Transactional(readOnly = true)
    public List<Response> getUserProgressDetail(Long userId) {
        return progressRepository.findByUserId(userId).stream()
                .filter(GameProgress::getCompleted)
                .map(Response::from)
                .toList();
    }
}
