package com.vocaking.service;

import com.vocaking.dto.WordDto.*;
import com.vocaking.entity.Day;
import com.vocaking.entity.Level;
import com.vocaking.entity.Word;
import com.vocaking.repository.DayRepository;
import com.vocaking.repository.LevelRepository;
import com.vocaking.repository.WordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 단어 서비스
 *
 * 레벨/Day/단어 CRUD 처리
 */
@Service
@RequiredArgsConstructor
@Transactional
public class WordService {

    private final LevelRepository levelRepository;
    private final DayRepository dayRepository;
    private final WordRepository wordRepository;

    // ==================== 레벨 ====================

    /**
     * 모든 레벨 조회
     */
    @Transactional(readOnly = true)
    public List<LevelResponse> getAllLevels() {
        return levelRepository.findAllByOrderByOrderIndexAsc()
                .stream()
                .map(LevelResponse::from)
                .toList();
    }

    /**
     * 레벨 상세 조회 (Day 목록 포함)
     */
    @Transactional(readOnly = true)
    public LevelResponse getLevel(Long levelId) {
        Level level = levelRepository.findById(levelId)
                .orElseThrow(() -> new IllegalArgumentException("레벨을 찾을 수 없습니다: " + levelId));
        return LevelResponse.from(level);
    }

    /**
     * 레벨 생성
     */
    public LevelResponse createLevel(LevelRequest request) {
        Level level = Level.builder()
                .name(request.getName())
                .color(request.getColor())
                .lightColor(request.getLightColor())
                .orderIndex(request.getOrderIndex() != null ? request.getOrderIndex() : 0)
                .build();

        Level savedLevel = levelRepository.save(level);
        return LevelResponse.from(savedLevel);
    }

    /**
     * 레벨 수정
     */
    public LevelResponse updateLevel(Long levelId, LevelRequest request) {
        Level level = levelRepository.findById(levelId)
                .orElseThrow(() -> new IllegalArgumentException("레벨을 찾을 수 없습니다: " + levelId));

        level.setName(request.getName());
        level.setColor(request.getColor());
        level.setLightColor(request.getLightColor());
        if (request.getOrderIndex() != null) {
            level.setOrderIndex(request.getOrderIndex());
        }

        return LevelResponse.from(level);
    }

    /**
     * 레벨 삭제
     */
    public void deleteLevel(Long levelId) {
        if (!levelRepository.existsById(levelId)) {
            throw new IllegalArgumentException("레벨을 찾을 수 없습니다: " + levelId);
        }
        levelRepository.deleteById(levelId);
    }

    // ==================== Day ====================

    /**
     * 특정 레벨의 모든 Day 조회
     */
    @Transactional(readOnly = true)
    public List<DayResponse> getDaysByLevel(Long levelId) {
        return dayRepository.findByLevelIdOrderByDayNumberAsc(levelId)
                .stream()
                .map(DayResponse::from)
                .toList();
    }

    /**
     * Day 상세 조회 (단어 목록 포함)
     */
    @Transactional(readOnly = true)
    public DayDetailResponse getDayDetail(Long dayId) {
        Day day = dayRepository.findById(dayId)
                .orElseThrow(() -> new IllegalArgumentException("Day를 찾을 수 없습니다: " + dayId));
        return DayDetailResponse.from(day);
    }

    /**
     * Day 생성
     */
    public DayResponse createDay(DayRequest request) {
        Level level = levelRepository.findById(request.getLevelId())
                .orElseThrow(() -> new IllegalArgumentException("레벨을 찾을 수 없습니다: " + request.getLevelId()));

        Day day = Day.builder()
                .level(level)
                .dayNumber(request.getDayNumber())
                .title(request.getTitle())
                .build();

        Day savedDay = dayRepository.save(day);
        return DayResponse.from(savedDay);
    }

    /**
     * Day 수정
     */
    public DayResponse updateDay(Long dayId, DayRequest request) {
        Day day = dayRepository.findById(dayId)
                .orElseThrow(() -> new IllegalArgumentException("Day를 찾을 수 없습니다: " + dayId));

        if (!day.getLevel().getId().equals(request.getLevelId())) {
            Level newLevel = levelRepository.findById(request.getLevelId())
                    .orElseThrow(() -> new IllegalArgumentException("레벨을 찾을 수 없습니다: " + request.getLevelId()));
            day.setLevel(newLevel);
        }

        day.setDayNumber(request.getDayNumber());
        day.setTitle(request.getTitle());

        return DayResponse.from(day);
    }

    /**
     * Day 삭제
     */
    public void deleteDay(Long dayId) {
        if (!dayRepository.existsById(dayId)) {
            throw new IllegalArgumentException("Day를 찾을 수 없습니다: " + dayId);
        }
        dayRepository.deleteById(dayId);
    }

    // ==================== 단어 ====================

    /**
     * 특정 Day의 모든 단어 조회
     */
    @Transactional(readOnly = true)
    public List<WordResponse> getWordsByDay(Long dayId) {
        return wordRepository.findByDayIdOrderByOrderIndexAsc(dayId)
                .stream()
                .map(WordResponse::from)
                .toList();
    }

    /**
     * 단어 생성
     */
    public WordResponse createWord(Long dayId, WordRequest request) {
        Day day = dayRepository.findById(dayId)
                .orElseThrow(() -> new IllegalArgumentException("Day를 찾을 수 없습니다: " + dayId));

        Word word = Word.builder()
                .day(day)
                .english(request.getEnglish())
                .korean(request.getKorean())
                .orderIndex(request.getOrderIndex() != null ? request.getOrderIndex() : 0)
                .example(request.getExample())
                .pronunciation(request.getPronunciation())
                .build();

        Word savedWord = wordRepository.save(word);
        return WordResponse.from(savedWord);
    }

    /**
     * 단어 일괄 생성
     */
    public List<WordResponse> createWordsBulk(WordBulkRequest request) {
        Day day = dayRepository.findById(request.getDayId())
                .orElseThrow(() -> new IllegalArgumentException("Day를 찾을 수 없습니다: " + request.getDayId()));

        List<Word> words = request.getWords().stream()
                .map(req -> Word.builder()
                        .day(day)
                        .english(req.getEnglish())
                        .korean(req.getKorean())
                        .orderIndex(req.getOrderIndex() != null ? req.getOrderIndex() : 0)
                        .example(req.getExample())
                        .pronunciation(req.getPronunciation())
                        .build())
                .toList();

        List<Word> savedWords = wordRepository.saveAll(words);
        return savedWords.stream()
                .map(WordResponse::from)
                .toList();
    }

    /**
     * 단어 수정
     */
    public WordResponse updateWord(Long wordId, WordRequest request) {
        Word word = wordRepository.findById(wordId)
                .orElseThrow(() -> new IllegalArgumentException("단어를 찾을 수 없습니다: " + wordId));

        word.setEnglish(request.getEnglish());
        word.setKorean(request.getKorean());
        if (request.getOrderIndex() != null) {
            word.setOrderIndex(request.getOrderIndex());
        }
        word.setExample(request.getExample());
        word.setPronunciation(request.getPronunciation());

        return WordResponse.from(word);
    }

    /**
     * 단어 삭제
     */
    public void deleteWord(Long wordId) {
        if (!wordRepository.existsById(wordId)) {
            throw new IllegalArgumentException("단어를 찾을 수 없습니다: " + wordId);
        }
        wordRepository.deleteById(wordId);
    }

    /**
     * 퀴즈용 - 특정 레벨의 모든 단어 조회 (오답 생성용)
     */
    @Transactional(readOnly = true)
    public List<WordResponse> getAllWordsByLevel(Long levelId) {
        return wordRepository.findAllByLevelId(levelId)
                .stream()
                .map(WordResponse::from)
                .toList();
    }
}
