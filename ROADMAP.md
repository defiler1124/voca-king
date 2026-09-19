# VOCA KING 프로젝트 로드맵

## 프로젝트 개요
영어 단어 학습 웹 애플리케이션 (Spring Boot + MySQL + React)

- **백엔드**: Spring Boot 3.x + Spring Security + JPA + MySQL
- **프론트엔드**: React 18 + TypeScript + Tailwind CSS
- **배포**: Railway(무료) → 카페24(유료)

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

## Phase 7: 카페24 호스팅 이전

### 7.1 서버 준비
- [ ] 카페24 호스팅 신청 (리눅스 서버)
- [ ] JDK 17+ 설치
- [ ] MySQL 8.x 설치 및 설정
- [ ] Nginx 리버스 프록시 설정

### 7.2 배포
- [ ] 도메인 구매 및 DNS 설정
- [ ] SSL 인증서 설정 (Let's Encrypt)
- [ ] Spring Boot JAR 배포
- [ ] React 빌드 파일 배포
- [ ] 서비스 자동 시작 설정 (systemd)

### 7.3 운영
- [ ] 백업 설정
- [ ] 모니터링 설정
- [ ] 로그 관리

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
