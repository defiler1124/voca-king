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
}
