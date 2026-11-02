# VOCA KING 프로젝트 로드맵

## 프로젝트 개요
영어 단어 학습 웹 애플리케이션 (Spring Boot + MySQL + React)

- **백엔드**: Spring Boot 3.x + Spring Security + JPA + MySQL
- **프론트엔드**: React 18 + TypeScript + Tailwind CSS
- **배포**: Vercel (프론트엔드) + Railway (백엔드/MySQL)

---

## Phase 1: 개발 환경 설정 및 기본 구조

### 1.1 백엔드 환경 설정
- [ ] Spring Boot 3.x 프로젝트 생성 (Gradle)
- [ ] MySQL 연결 설정 (로컬 개발용)
- [ ] JPA 엔티티 설계
  - User (id, email, password, role, createdAt)
  - Level (id, name, color, orderIndex)
  - Day (id, levelId, dayNumber)
  - Word (id, dayId, english, korean, orderIndex)
  - QuizResult (id, userId, dayId, score, createdAt)
- [ ] Swagger/OpenAPI 문서 설정

### 1.2 프론트엔드 환경 설정
- [ ] Vite + React + TypeScript 프로젝트 생성
- [ ] Tailwind CSS 설정
- [ ] React Router 설정
- [ ] Axios HTTP 클라이언트 설정
- [ ] 전역 상태 관리 (Zustand)

### 1.3 공통
- [ ] Docker Compose 개발 환경 (MySQL)
- [ ] 환경변수 관리 (.env)
- [ ] Git 저장소 초기화

---

## Phase 2: 인증 시스템 구현

### 2.1 백엔드 인증
- [ ] Spring Security 설정
- [ ] JWT 토큰 인증 구현
- [ ] 회원가입 API (POST /api/auth/register)
- [ ] 로그인 API (POST /api/auth/login)
- [ ] 비밀번호 암호화 (BCrypt)
- [ ] 역할 기반 접근 제어 (ADMIN, STUDENT)

### 2.2 프론트엔드 인증
- [ ] 로그인 페이지 UI
- [ ] 회원가입 페이지 UI
- [ ] JWT 토큰 저장 (localStorage)
- [ ] 인증 상태 관리
- [ ] Protected Route 구현
- [ ] 자동 로그아웃 (토큰 만료)

---

## Phase 3: 단어 관리 시스템 (관리자)

### 3.1 백엔드 API
- [ ] 레벨 CRUD API
- [ ] Day CRUD API
- [ ] 단어 CRUD API
- [ ] 단어 일괄 등록 API (CSV/Excel 지원)
- [ ] 관리자 권한 검증 미들웨어

### 3.2 관리자 대시보드
- [ ] 관리자 레이아웃
- [ ] 레벨 관리 페이지
- [ ] Day별 단어 입력/수정 페이지
- [ ] 단어 일괄 업로드 기능
- [ ] 사용자 관리 페이지

---

## Phase 4: 학습 기능 구현

### 4.1 백엔드 API
- [ ] 레벨/Day별 단어 조회 API
- [ ] 학습 진도 저장 API
- [ ] 퀴즈 결과 저장 API
- [ ] 통계 조회 API

### 4.2 프론트엔드 학습 UI
- [ ] 메인 학습 페이지
- [ ] 레벨 선택 UI
- [ ] Day 그리드 UI
- [ ] 단어 리스트 뷰
- [ ] 단어 카드 뷰
- [ ] 플래시카드 (스와이프) 뷰
- [ ] 4지선다 퀴즈 기능
- [ ] 학습 진도 표시

### 4.3 TTS (Text-to-Speech)
- [ ] Web Speech API 기본 구현
- [ ] ResponsiveVoice.js 연동 (무료, 더 자연스러운 발음)
- [ ] 발음 재생 버튼 UI

---

## Phase 5: UI/UX 완성

### 5.1 반응형 디자인
- [ ] 모바일 최적화
- [ ] 태블릿/데스크톱 레이아웃
- [ ] PWA 설정 (오프라인 지원)

### 5.2 사용자 경험
- [ ] 로딩 상태 표시
- [ ] 에러 핸들링
- [ ] 토스트 알림
- [ ] 다크모드 지원

---

## Phase 6: 무료 배포 (Railway/Render)

### 6.1 백엔드 배포
- [ ] Railway 계정 생성
- [ ] MySQL 데이터베이스 생성 (Railway)
- [ ] Spring Boot 애플리케이션 배포
- [ ] 환경변수 설정
- [ ] HTTPS 설정

### 6.2 프론트엔드 배포
- [ ] Vercel 또는 Netlify 계정 생성
- [ ] React 앱 빌드 및 배포
- [ ] API 연동 확인
- [ ] 도메인 연결 (무료 서브도메인)

### 6.3 테스트
- [ ] 전체 기능 테스트
- [ ] 모바일 브라우저 테스트
- [ ] 성능 테스트

---


## 기술 스택 상세

### 백엔드
```
- Java 17+
- Spring Boot 3.2.x
- Spring Security 6.x
- Spring Data JPA
- MySQL 8.x
- Gradle
- Lombok
- JWT (jjwt)
- Swagger/OpenAPI 3.0
```

### 프론트엔드
```
- Node.js 18+
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router 6
- Zustand (상태관리)
- Axios
- ResponsiveVoice.js (TTS)
```

### 무료 배포 플랫폼
```
- 백엔드: Railway (무료 티어: 월 500시간)
- 프론트엔드: Vercel (무료: 무제한)
- 데이터베이스: Railway MySQL (무료: 1GB)
```

---

## 예상 디렉토리 구조

```
voca-king/
├── backend/
│   └── voca-king-api/
│       ├── src/main/java/com/vocaking/
│       │   ├── config/           # Security, CORS 설정
│       │   ├── controller/       # REST API 컨트롤러
│       │   ├── dto/              # 요청/응답 DTO
│       │   ├── entity/           # JPA 엔티티
│       │   ├── repository/       # JPA 레포지토리
│       │   ├── service/          # 비즈니스 로직
│       │   └── security/         # JWT, 인증 관련
│       └── src/main/resources/
│           └── application.yml
│
├── frontend/
│   └── voca-king-web/
│       ├── src/
│       │   ├── components/       # 공통 컴포넌트
│       │   ├── pages/            # 페이지 컴포넌트
│       │   ├── hooks/            # 커스텀 훅
│       │   ├── stores/           # Zustand 스토어
│       │   ├── services/         # API 호출
│       │   ├── types/            # TypeScript 타입
│       │   └── utils/            # 유틸리티
│       └── package.json
│
├── docs/                         # 문서
├── docker-compose.yml            # 로컬 개발용
└── ROADMAP.md
```

---

## TTS 옵션 비교

| 서비스 | 무료 한도 | 음질 | 설치 |
|--------|----------|------|------|
| Web Speech API | 무제한 | 보통 | 내장 |
| ResponsiveVoice.js | 무제한(비상업) | 좋음 | CDN |
| Google Cloud TTS | 월 400만자 | 최고 | API키 |

**권장**: ResponsiveVoice.js (비상업용 무료, UK/US 영어 지원)

---

## 무료 배포 방법 요약

### Railway 배포 (백엔드)
1. https://railway.app 가입
2. "New Project" → "Deploy from GitHub repo"
3. 환경변수 설정:
   - `SPRING_DATASOURCE_URL`
   - `SPRING_DATASOURCE_USERNAME`
   - `SPRING_DATASOURCE_PASSWORD`
   - `JWT_SECRET`
4. 자동 배포 완료

### Vercel 배포 (프론트엔드)
1. https://vercel.com 가입
2. "Import Project" → GitHub 연결
3. 환경변수: `VITE_API_URL` 설정
4. 자동 배포 완료

---

## 현재 진행 상황

### Phase 1: 개발 환경 설정 ✅ 완료
- [x] Spring Boot 3.x 프로젝트 생성 (Gradle)
- [x] JPA 엔티티 설계 (User, Level, Day, Word, QuizResult)
- [x] Vite + React + TypeScript 프로젝트 생성
- [x] Tailwind CSS 설정
- [x] Docker Compose 개발 환경 (MySQL)
- [x] Git 저장소 초기화

### Phase 2: 인증 시스템 ✅ 완료
- [x] Spring Security + JWT 인증 구현
- [x] 회원가입/로그인 API
- [x] 로그인/회원가입 페이지 UI
- [x] Protected Route 구현
- [x] Zustand 상태 관리

### Phase 3: 단어 관리 ✅ 완료
- [x] 레벨/Day/단어 CRUD API
- [x] 관리자 단어 관리 페이지

### Phase 4: 학습 기능 ✅ 완료
- [x] 메인 학습 페이지
- [x] 리스트/카드/플래시카드 뷰
- [x] ResponsiveVoice.js TTS 연동

### 배포 설정 ✅ 완료
- [x] Railway 배포용 Dockerfile
- [x] Vercel 배포용 설정

---

## 다음 단계

**배포 준비 완료!** 아래 단계를 따라 무료 배포를 진행하세요.

### 1. 로컬 테스트
```bash
# 백엔드 실행 (H2 인메모리 DB 사용)
cd backend/voca-king-api
./gradlew bootRun

# 프론트엔드 실행 (별도 터미널)
cd frontend/voca-king-web
npm install
npm run dev
```

### 2. GitHub 저장소 생성
```bash
cd /Users/yunkh7/workspaces/flowEng/voca-king
git remote add origin https://github.com/YOUR_USERNAME/voca-king.git
git branch -M main
git push -u origin main
```

### 3. Railway 배포 (백엔드)
1. https://railway.app 가입 (GitHub 연동)
2. "New Project" → "Deploy from GitHub repo" → voca-king/backend/voca-king-api 선택
3. "Add MySQL" 클릭하여 DB 추가
4. 환경변수 설정:
   - `SPRING_PROFILES_ACTIVE=prod`
   - `JWT_SECRET=your-super-secret-key-at-least-32-characters`
5. 배포 완료 후 제공되는 URL 복사 (예: https://xxx.railway.app)

### 4. Vercel 배포 (프론트엔드)
1. https://vercel.com 가입 (GitHub 연동)
2. "Import Project" → voca-king/frontend/voca-king-web 선택
3. 환경변수 설정:
   - `VITE_API_URL=https://xxx.railway.app` (Railway URL)
4. "Deploy" 클릭
5. 배포 완료! (예: https://voca-king.vercel.app)

---

# VOCA KING V2 리뉴얼 로드맵

> **목표**: 기존 서비스에 영향 없이 새로운 UI/UX와 게임형 학습 기능 추가
> **참조**: `VOCAKING_v6_파이널효과음.html`

---

## V2 프로젝트 구조 전략

### 기존 서비스 보존
- 현재 `HomePage.tsx` → 그대로 유지 (`/` 또는 `/classic` 라우트)
- 새 버전 → `/v2` 라우트로 분리
- 회원 정보 및 학습 기록 DB는 공유 (users, word_attempts, quiz_results)

### 새로운 파일 구조
```
frontend/voca-king-web/src/
├── pages/
│   ├── HomePage.tsx          # 기존 (유지)
│   ├── HomePageV2.tsx        # 새 버전 메인
│   └── ...
├── components/v2/
│   ├── Header.tsx            # 새 헤더 (숲 테마)
│   ├── LevelBar.tsx          # 레벨 선택 바
│   ├── DaySelector.tsx       # Day 선택기
│   ├── TabNav.tsx            # 탭 네비게이션
│   ├── WordCard.tsx          # 단어 카드
│   ├── FlashCard.tsx         # 플래시카드
│   ├── GameScreen.tsx        # 게임 스크린 컨테이너
│   ├── games/
│   │   ├── FlashGame.tsx     # 플래시카드 게임
│   │   ├── MatchGame.tsx     # 바나나 던지기 게임
│   │   ├── PopGame.tsx       # 동물 낙하산 구출
│   │   └── ListenGame.tsx    # 리스닝 퀴즈
│   ├── TimerBar.tsx          # 타이머 퓨즈 바
│   └── MusicPlayer.tsx       # 배경음악 플레이어
├── styles/
│   └── v2-theme.css          # 새 테마 CSS (숲/지도 스타일)
├── assets/
│   ├── sounds/               # 효과음
│   ├── music/                # 배경음악
│   └── svg/                  # SVG 아트워크
└── hooks/
    ├── useSound.ts           # 효과음 훅
    ├── useBackgroundMusic.ts # BGM 훅
    └── useGameTimer.ts       # 게임 타이머 훅
```

---

## V2 Phase 1: 기반 설정 (1-2일)

### 1.1 라우팅 설정
- [ ] `/v2` 라우트 추가 (App.tsx)
- [ ] `HomePageV2.tsx` 생성 (빈 껍데기)
- [ ] 기존 서비스 `/` 유지

### 1.2 새 테마 CSS 이식
- [ ] `v2-theme.css` 생성
- [ ] CSS 변수 정의 (숲 테마 색상)
  ```css
  :root {
    --hs: #2b7a1f;
    --bg: #7fd04a;
    --primary: #33a852;
    --accent: #ff8a1d;
  }
  ```
- [ ] 배경 SVG 장면

### 1.3 공통 컴포넌트
- [ ] `Header.tsx` - 새 헤더 (브랜드 배지, 타이틀)
- [ ] `TabNav.tsx` - 탭 버튼
- [ ] `DaySelector.tsx` - Day 선택 바

---

## V2 Phase 2: 기본 학습 기능 (2-3일)

### 2.1 발음연습 탭
- [ ] 새 디자인 단어 카드 (숲 테마)
- [ ] 기존 Azure TTS 연동
- [ ] 재생 중 카드 하이라이트

### 2.2 파이널테스트 탭
- [ ] 새 디자인 퀴즈 UI
- [ ] 랜덤 문제 출제 (기존 로직 재사용)
- [ ] 결과 화면 새 디자인

### 2.3 API 연동
- [ ] 기존 `api.ts` 재사용
- [ ] 학습 기록 저장 (LISTEN, FLASH, QUIZ)

---

## V2 Phase 3: 셀프테스트 게임 허브 (3-4일)

### 3.1 게임 허브 UI
- [ ] `SelfTestHub.tsx` - 4개 게임 스테이지 선택 화면
- [ ] 게임 카드 UI (아이콘, 설명, 별점)
  - Stage 1: 플래시카드 (보라색)
  - Stage 2: 바나나 던지기 (초록색)
  - Stage 3: 동물 구출 (하늘색)
  - Stage 4: 리스닝 퀴즈 (청록색)

### 3.2 게임 공통 시스템
- [ ] `GameScreen.tsx` - 전체화면 게임 컨테이너
- [ ] `TimerBar.tsx` - 퓨즈 바 타이머
  - 초록 → 노랑 → 빨강 단계
  - 불꽃/폭탄 애니메이션
- [ ] `useGameTimer.ts` - 타이머 로직 훅
- [ ] 카운트다운 오버레이 (3, 2, 1, GO!)

---

## V2 Phase 4: 게임 개발 - Stage 1 & 2 (3-4일)

### 4.1 Stage 1: 플래시카드 게임
- [ ] `FlashGame.tsx`
- [ ] 카드 탭하여 뜻 보기
- [ ] 좌우 네비게이션
- [ ] 진행률 점 표시
- [ ] 완료 시 결과 화면

### 4.2 Stage 2: 바나나 던지기 (매칭 게임)
- [ ] `MatchGame.tsx`
- [ ] 원숭이 캐릭터 SVG
- [ ] 바나나 2개 (한글 뜻) 떨어지는 애니메이션
- [ ] 영어 단어 표시 → 맞는 바나나 터치
- [ ] 정답: 원숭이가 먹는 애니메이션
- [ ] 오답: 화난 애니메이션 + 페널티

---

## V2 Phase 5: 게임 개발 - Stage 3 & 4 (3-4일)

### 5.1 Stage 3: 동물 낙하산 구출
- [ ] `PopGame.tsx`
- [ ] 동물 + 낙하산 SVG 아트
- [ ] 한글 뜻 제시 → 맞는 영어 단어 동물 터치
- [ ] 정답: 환호 애니메이션 + 스파클
- [ ] 오답: 화난 표정 + 흔들림
- [ ] 시간 내 구출 못하면 떨어짐

### 5.2 Stage 4: 리스닝 퀴즈
- [ ] `ListenGame.tsx`
- [ ] TTS로 영어 발음 재생
- [ ] 4지선다 한글 뜻 선택
- [ ] 정답/오답 피드백

---

## V2 Phase 6: 사운드 시스템 (1-2일)

### 6.1 효과음
- [ ] `useSound.ts` 훅 구현
- [ ] 효과음 파일 추가
  - 정답: `correct.mp3`
  - 오답: `wrong.mp3`
  - 클릭: `click.mp3`
  - 카운트다운: `countdown.mp3`
  - 게임 완료: `complete.mp3`

### 6.2 배경음악
- [ ] `MusicPlayer.tsx` 컴포넌트
- [ ] `useBackgroundMusic.ts` 훅
- [ ] BGM 선택 UI (바텀시트)
- [ ] 볼륨 조절
- [ ] 자동 재생 옵션

---

## V2 Phase 7: 애니메이션 & 폴리싱 (2-3일)

### 7.1 애니메이션
- [ ] 카드 등장 애니메이션
- [ ] 타이머 바 애니메이션 (stripe 움직임)
- [ ] 폭탄 흔들림 (위험 상태)
- [ ] 불꽃 애니메이션
- [ ] 정답/오답 피드백 애니메이션
- [ ] 결과 화면 이모지 바운스

### 7.2 SVG 아트워크
- [ ] 동물 캐릭터 (원숭이, 펭귄 등)
- [ ] 낙하산, 바나나
- [ ] 폭탄 & 불꽃
- [ ] 배경 장식

### 7.3 UI 폴리싱
- [ ] 터치 피드백
- [ ] 스크롤 부드러움
- [ ] 모바일 최적화

---

## V2 Phase 8: 테스트 & 배포 (1-2일)

### 8.1 테스트
- [ ] 기존 서비스 (`/`) 정상 작동 확인
- [ ] 새 버전 (`/v2`) 테스트
- [ ] 모바일 테스트 (iOS, Android)
- [ ] 학습 기록 저장 확인

### 8.2 배포
- [ ] Vercel 배포 (자동)
- [ ] 사용자 피드백 수집

---

## V2 기술 스택 추가

### 프론트엔드
- **Howler.js** 또는 **use-sound**: 효과음/배경음악
- **Framer Motion** (선택): 고급 애니메이션

### 에셋
- SVG 아트워크 (HTML에서 추출)
- MP3 효과음/배경음악 파일

---

## V2 주의사항

1. **기존 서비스 보존**: 새 버전은 `/v2` 라우트로 개발
2. **회원 정보 공유**: 로그인/인증은 기존 시스템 사용
3. **학습 기록 호환**: 기존 AttemptType (LISTEN, FLASH, QUIZ) 유지
4. **TTS**: 기존 Azure TTS API 재사용
5. **점진적 배포**: 완성 후 메인 페이지로 전환 가능

---

## V2 예상 일정

| Phase | 내용 | 예상 기간 |
|-------|------|----------|
| 1 | 기반 설정 | 1-2일 |
| 2 | 기본 학습 기능 | 2-3일 |
| 3 | 셀프테스트 게임 허브 | 3-4일 |
| 4 | 게임 Stage 1 & 2 | 3-4일 |
| 5 | 게임 Stage 3 & 4 | 3-4일 |
| 6 | 사운드 시스템 | 1-2일 |
| 7 | 애니메이션 & 폴리싱 | 2-3일 |
| 8 | 테스트 & 배포 | 1-2일 |
| **총** | | **16-24일** |

---

## 참조 파일

- **디자인 참조**: `/Users/yunkh7/Downloads/VOCAKING_v6_파이널효과음.html`
- **프로젝트 가이드**: `CLAUDE.md`
- **현재 메인 페이지**: `frontend/voca-king-web/src/pages/HomePage.tsx`
