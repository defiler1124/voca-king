# V2 학습 데이터 DB화 계획

> 작성일: 2026-11-04
> 상태: 검토 완료, 구현 대기

## 현재 상태

### localStorage 저장 방식
- `voca-king-flash-cleared`: 플래시카드 클리어한 Day ID 목록
- `voca-king-banana-cleared`: 바나나 게임 클리어한 Day ID 목록
- `voca-king-animal-cleared`: 동물 게임 클리어한 Day ID 목록

### 문제점
1. 브라우저 데이터 초기화 시 삭제됨
2. 다른 기기에서 접근 불가
3. 관리자/선생님이 학생 진행 상황 확인 불가
4. 통계 분석 불가

---

## 저장할 데이터

| 데이터 | 설명 | 용도 |
|--------|------|------|
| **게임 클리어 기록** | userId, dayId, gameType, clearedAt, score, totalWords | 진행률 표시, 다음 스테이지 잠금 해제 |
| **게임 시도 기록** | userId, dayId, gameType, attemptAt, score, timeSpent | 학습 통계, 시간 분석 |
| **단어별 오답 기록** | userId, wordId, gameType, wrongCount, lastWrongAt | 취약 단어 분석, 오답노트 |

---

## DB 스키마 (제안)

### 옵션 A: 새 테이블 생성

```sql
-- 게임 클리어 기록 (스테이지 잠금 해제용)
CREATE TABLE game_clears (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  day_id BIGINT NOT NULL,
  game_type ENUM('FLASH', 'MATCH', 'POP', 'LISTEN') NOT NULL,
  score INT NOT NULL,
  total_words INT NOT NULL,
  cleared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_day_game (user_id, day_id, game_type),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (day_id) REFERENCES days(id)
);

-- 게임 시도 기록 (통계용)
CREATE TABLE game_attempts (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  day_id BIGINT NOT NULL,
  game_type ENUM('FLASH', 'MATCH', 'POP', 'LISTEN') NOT NULL,
  score INT NOT NULL,
  total_words INT NOT NULL,
  time_spent_sec INT,
  is_perfect BOOLEAN DEFAULT FALSE,
  attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (day_id) REFERENCES days(id)
);

-- 단어별 오답 기록 (오답노트용)
CREATE TABLE word_mistakes (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  word_id BIGINT NOT NULL,
  game_type ENUM('FLASH', 'MATCH', 'POP', 'LISTEN') NOT NULL,
  wrong_count INT DEFAULT 1,
  last_wrong_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_word_game (user_id, word_id, game_type),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (word_id) REFERENCES words(id)
);
```

### 옵션 B: 기존 테이블 확장

기존 `word_attempts` 테이블에 `game_type` 컬럼 추가하고 활용

---

## API 엔드포인트 (제안)

### 학생용
```
POST /api/v2/games/clear
  - Body: { dayId, gameType, score, totalWords, timeSpentSec }
  - 게임 클리어 시 호출

GET /api/v2/games/progress
  - Response: { flashCleared: [dayId...], matchCleared: [...], ... }
  - 로그인 시 클리어 현황 로드
```

### 관리자용
```
GET /api/v2/stats/users
  - 전체 학생 진행률 목록

GET /api/v2/stats/user/{userId}
  - 특정 학생 상세 통계

GET /api/v2/stats/day/{dayId}
  - Day별 학생들 통과율

GET /api/v2/stats/mistakes
  - 오답 빈도 높은 단어 목록
```

---

## 프론트엔드 변경사항

### 게임 종료 시
```typescript
// 현재: localStorage만 저장
localStorage.setItem('voca-king-banana-cleared', JSON.stringify(clearedDays));

// 변경: API 호출 + localStorage 병행 (오프라인 대비)
try {
  await api.post('/v2/games/clear', { dayId, gameType: 'MATCH', score, totalWords });
} catch (e) {
  // 오프라인 시 localStorage에만 저장, 나중에 동기화
}
localStorage.setItem('voca-king-banana-cleared', JSON.stringify(clearedDays));
```

### 로그인 시
```typescript
// 서버에서 클리어 현황 로드 → localStorage 동기화
const progress = await api.get('/v2/games/progress');
localStorage.setItem('voca-king-banana-cleared', JSON.stringify(progress.matchCleared));
// ...
```

---

## 관리자 대시보드 기능 (제안)

1. **학생별 진행률**
   - 레벨/Day별 클리어 현황 (체크 표시)
   - 각 게임 최고 점수

2. **Day별 통계**
   - 학생별 통과율
   - 평균 시도 횟수

3. **오답 분석**
   - 자주 틀리는 단어 TOP 20
   - 단어별 오답률

---

## 구현 순서 (제안)

1. **1단계: 백엔드 API**
   - Entity 생성 (GameClear, GameAttempt)
   - Repository, Service, Controller
   - Flyway 마이그레이션

2. **2단계: 프론트엔드 연동**
   - 게임 종료 시 API 호출
   - 로그인 시 진행 상황 로드
   - localStorage와 서버 동기화

3. **3단계: 관리자 대시보드**
   - AdminPage에 통계 탭 추가
   - 차트/테이블 UI

---

## 고려사항

- **오프라인 모드**: localStorage 우선 저장 → 온라인 시 서버 동기화
- **데이터 충돌**: 서버 vs localStorage 불일치 시 서버 우선
- **성능**: 게임 중 실시간 저장 vs 게임 종료 시 일괄 저장 → **종료 시 저장 권장**
- **기존 데이터**: V1의 `word_attempts` 테이블과 역할 구분 필요
