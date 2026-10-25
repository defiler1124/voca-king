# VOCA KING 프로젝트

영어 단어 학습 웹 애플리케이션 (플로우어학원)

## 기술 스택

### 백엔드
- Spring Boot 3.2.5 + Java 17
- Spring Security + JWT 인증
- Spring Data JPA + MySQL 8.x
- Azure Speech Services (TTS)
- 경로: `backend/voca-king-api/`

### 프론트엔드
- React 19 + TypeScript + Vite
- Zustand (상태관리)
- Tailwind CSS
- 경로: `frontend/voca-king-web/`

## 배포

- **프론트엔드**: Vercel (`voca-king-web` 프로젝트)
  - Root Directory: `frontend/voca-king-web`
  - GitHub 연결 필요 (Settings → Git)
- **백엔드**: Railway (`voca-king-api`)

## 주요 파일

### 프론트엔드
| 파일 | 설명 |
|------|------|
| `src/pages/HomePage.tsx` | 메인 학습 페이지 (발음연습, 셀프테스트, 파이널테스트, 통계) |
| `src/pages/AdminPage.tsx` | 관리자 페이지 (레벨/Day/단어 관리) |
| `src/pages/LoginPage.tsx` | 로그인 페이지 |
| `src/stores/authStore.ts` | 인증 상태 관리 |
| `src/stores/wordStore.ts` | 단어/레벨/Day 상태 관리 |
| `src/services/api.ts` | API 클라이언트 |
| `src/utils/tts.ts` | TTS 유틸리티 (Azure + Web Speech API) |

### 백엔드
| 파일 | 설명 |
|------|------|
| `controller/AuthController.java` | 인증 API |
| `controller/LearningController.java` | 학습 기록/통계 API |
| `controller/WordController.java` | 단어 CRUD API |
| `service/LearningService.java` | 학습 비즈니스 로직 |
| `entity/WordAttempt.java` | 학습 시도 기록 (LISTEN, FLASH, QUIZ) |

## 학습 모드

1. **발음연습** (`viewMode: 'cards'`)
   - 단어 목록 표시, 클릭하면 TTS 재생
   - AttemptType: `LISTEN`

2. **셀프테스트** (`viewMode: 'flash'`)
   - 플래시카드 형태, 탭하면 뜻 표시
   - BACK/NEXT 버튼 순환 (마지막→첫번째, 첫번째→마지막)
   - AttemptType: `FLASH`

3. **파이널테스트** (`viewMode: 'final'`)
   - 4지선다 퀴즈
   - 문제 순서 랜덤 (`shuffledQuizWords` state)
   - Day/Level 변경 시 자동 초기화
   - AttemptType: `QUIZ`

4. **통계** (`viewMode: 'stats'`)
   - 학습 현황, 오답 노트, 최근 퀴즈 결과

## 데이터 구조

```
Level (레벨)
  └── Day (일차)
       └── Word (단어)
            - english: 영어
            - korean: 한글 뜻
```

## 자주 수정하는 부분

### HomePage.tsx 주요 함수
- `flashPrev()` / `flashNext()`: 셀프테스트 카드 이동
- `startQuiz()`: 파이널테스트 시작 (단어 셔플)
- `buildQuizQuestion()`: 퀴즈 문제 생성
- `selectQuizAnswer()`: 답 선택 처리

### Day/Level 변경 시 초기화
```typescript
useEffect(() => {
  // 셀프테스트 초기화
  setFlashIndex(0);
  setShowKorean(false);
  // 파이널테스트 초기화
  setShuffledQuizWords([]);
  setQuizIndex(0);
  setQuizScore(0);
  setQuizFinished(false);
  setQuizChoices([]);
}, [currentDay?.id, currentLevelId]);
```

## 개발 명령어

```bash
# 프론트엔드 개발 서버
cd frontend/voca-king-web && npm run dev

# 백엔드 개발 서버
cd backend/voca-king-api && ./gradlew bootRun

# 로컬 MySQL (Docker)
docker-compose up -d
```

## Git 커밋 컨벤션

- `feat:` 새 기능
- `fix:` 버그 수정
- `refactor:` 리팩토링
- `trigger:` Vercel 재배포용 빈 커밋

## 주의사항

- Vercel GitHub 연결이 끊어지면 Settings → Git에서 재연결 필요
- Root Directory가 `frontend/voca-king-web`으로 설정되어 있어야 함
- 프론트엔드 수정 후 push하면 Vercel 자동 배포
