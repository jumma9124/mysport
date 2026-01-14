# My Sport 프로젝트 정리

## 📋 프로젝트 개요

**My Sport**는 실시간 스포츠 데이터를 보여주는 반응형 웹 애플리케이션입니다. 야구(한화이글스), 배구(현대캐피탈 스카이워커스), 국제스포츠의 정보를 한눈에 볼 수 있는 대시보드를 제공합니다.

---

## 🛠 기술 스택

### 핵심 기술
- **React 18.2.0** - UI 라이브러리
- **TypeScript 5.2.2** - 타입 안정성
- **Vite 5.0.0** - 빌드 도구 및 개발 서버
- **React Router DOM 6.20.0** - 라우팅

### 스타일링
- **Tailwind CSS 3.3.5** - 유틸리티 기반 CSS 프레임워크
- **PostCSS 8.4.31** - CSS 후처리
- **Autoprefixer 10.4.16** - 브라우저 호환성

### 개발 도구
- **ESLint** - 코드 품질 관리
- **TypeScript ESLint** - TypeScript 전용 린팅

---

## 📁 프로젝트 구조

```
mysport/
├── src/
│   ├── components/              # 재사용 가능한 컴포넌트
│   │   ├── Baseball/            # 야구 관련 컴포넌트
│   │   │   └── BaseballCard.tsx
│   │   ├── Volleyball/          # 배구 관련 컴포넌트
│   │   │   └── VolleyballCard.tsx
│   │   ├── InternationalSports/ # 국제스포츠 컴포넌트
│   │   │   └── InternationalSportsCard.tsx
│   │   └── MainLayout/          # 메인 레이아웃
│   │       └── MainLayout.tsx
│   ├── pages/                   # 페이지 컴포넌트
│   │   ├── MainPage.tsx         # 메인 대시보드
│   │   ├── BaseballDetail.tsx   # 야구 상세 페이지
│   │   ├── VolleyballDetail.tsx # 배구 상세 페이지
│   │   └── InternationalSportsDetail.tsx
│   ├── types/                   # TypeScript 타입 정의
│   │   └── index.ts
│   ├── utils/                   # 유틸리티 함수
│   │   ├── seasonManager.ts     # 시즌 관리 로직
│   │   └── dataUpdater.ts      # 데이터 업데이트 로직
│   ├── App.tsx                  # 라우터 설정
│   ├── main.tsx                 # 앱 진입점
│   └── index.css               # 글로벌 스타일
├── index.html                   # HTML 템플릿
├── package.json                 # 프로젝트 의존성
├── tsconfig.json                # TypeScript 설정
├── vite.config.ts               # Vite 설정
├── tailwind.config.js           # Tailwind 설정
└── postcss.config.js            # PostCSS 설정
```

---

## 🎯 주요 기능

### 1. 메인 페이지 (MainPage)

#### 레이아웃 구조
- **4개 영역**으로 구성 (2x2 그리드)
- **반응형 디자인**: 모바일은 세로 배치, 데스크톱은 그리드 배치
- **동적 영역 배치**: 시즌 상태에 따라 1번 영역 자동 변경

#### 영역 배치 로직
1. **1번 영역 (우선순위)**:
   - 국제스포츠 시즌 중/시즌 전 → 국제스포츠
   - 야구 시즌 중/시즌 전 → 야구
   - 배구 시즌 중/시즌 전 → 배구
   - 모두 오프시즌 → 야구 (기본값)

2. **2번, 3번 영역**: 1번에 배치되지 않은 나머지 스포츠

3. **4번 영역**: 고정 영역 (현재는 예시 콘텐츠)

### 2. 야구 영역 (한화이글스)

#### 메인 카드 (BaseballCard)
- 현재 순위 및 전적/승률 표시
- 시즌 상태에 따른 정보 표시:
  - **시즌 중**: 현재 진행 중인 시리즈 결과
  - **시즌 종료**: 최종 순위 및 마지막 시리즈 결과
  - **시즌 전**: 시즌 개막 D-Day 표시 (7일 이내)

#### 상세 페이지 (BaseballDetail)
- **왼쪽 40%**: 리그 순위표
- **오른쪽 60%**: 
  - 투수/타자 기록 탭
  - 시즌 중: 현재 시리즈 전적
- **하단**: 상대전적

### 3. 배구 영역 (현대캐피탈 스카이워커스)

#### 메인 카드 (VolleyballCard)
- 시즌 순위
- 전적/승률/세트득실률
- 최근 경기 결과
- 다음 경기 일정

#### 상세 페이지 (VolleyballDetail)
- **왼쪽 40%**: 리그 순위 및 다음 예정 경기
- **오른쪽 60%**:
  - 시즌 중: 지난 경기 결과 (2주)
  - 시즌 종료: 공격수 순위

### 4. 국제스포츠 영역

- 현재 기본 구조만 구현됨
- 향후 확장 예정

---

## ⚙️ 시즌 관리 시스템

### 시즌 상태 (SeasonStatus)
- `in-season`: 시즌 진행 중
- `off-season`: 오프시즌
- `pre-season`: 시즌 시작 1주일 전

### 시즌 날짜 설정 (`src/utils/seasonManager.ts`)
```typescript
const SEASON_DATES = {
  baseball: {
    start: new Date('2024-03-23'),
    end: new Date('2024-10-31'),
  },
  volleyball: {
    start: new Date('2024-10-15'),
    end: new Date('2025-03-31'),
  },
  international: {
    start: new Date('2024-06-15'),
    end: new Date('2024-07-15'),
  },
};
```

### 주요 함수
- `getSeasonStatus(sport)`: 스포츠의 현재 시즌 상태 반환
- `getDaysUntilSeasonStart(sport)`: 시즌 시작까지 남은 일수
- `getMainAreaSport()`: 메인 영역에 배치할 스포츠 결정
- `getUpdateSchedule(sport)`: 데이터 업데이트 주기 반환

---

## 📊 데이터 업데이트 스케줄

### 시즌 중
- **야구, 배구**: 오전 10시, 오후 10시 (하루 2회)
- **국제스포츠**: 설정 필요

### 오프시즌
- 모든 스포츠: 일주일에 한 번

### 시즌 전 (Pre-season)
- 시즌 시작 1주일 전부터 D-7, D-6 등 표시

---

## 🎨 UI/UX 특징

### 반응형 디자인
- **모바일**: 1열 세로 배치
- **태블릿/데스크톱**: 2x2 그리드 배치

### 스타일링
- Tailwind CSS 유틸리티 클래스 사용
- 카드 기반 디자인
- 호버 효과 및 트랜지션 애니메이션
- 로딩 상태 표시 (스켈레톤 UI)

---

## 🔄 라우팅 구조

```
/                    → MainPage (메인 대시보드)
/baseball            → BaseballDetail (야구 상세)
/volleyball          → VolleyballDetail (배구 상세)
/international       → InternationalSportsDetail (국제스포츠 상세)
```

---

## 📝 TypeScript 타입 정의

### 주요 타입 (`src/types/index.ts`)
- `SeasonStatus`: 시즌 상태
- `SportType`: 스포츠 종류
- `BaseballData`: 야구 데이터 구조
- `VolleyballData`: 배구 데이터 구조
- `InternationalSportsData`: 국제스포츠 데이터 구조
- `AreaPosition`: 영역 위치 (1-4)

---

## 🚀 개발 환경 설정

### 설치
```bash
npm install
```

### 개발 서버 실행
```bash
npm run dev
```

### 빌드
```bash
npm run build
```

### 린팅
```bash
npm run lint
```

---

## ⚠️ 현재 상태 및 TODO

### 완료된 기능
✅ 기본 프로젝트 구조 설정
✅ React Router 설정
✅ 메인 페이지 레이아웃
✅ 야구/배구/국제스포츠 카드 컴포넌트
✅ 시즌 관리 로직
✅ 반응형 디자인
✅ TypeScript 타입 정의

### 미완성/개선 필요
⚠️ **데이터 소스**: 현재 예시 데이터만 사용 중, 실제 API 연동 필요
⚠️ **데이터 업데이트**: 스케줄링 로직은 정의되어 있으나 실제 구현 필요
⚠️ **상세 페이지**: BaseballDetail, VolleyballDetail 페이지 구현 필요
⚠️ **국제스포츠**: 기본 구조만 있고 실제 기능 미구현
⚠️ **4번 영역**: 현재 예시 콘텐츠만 있음
⚠️ **에러 처리**: API 호출 실패 시 에러 처리 로직 필요
⚠️ **로딩 상태**: 개선 가능

---

## 📌 주요 파일 설명

### `src/utils/seasonManager.ts`
- 시즌 날짜 관리
- 시즌 상태 판단 로직
- 메인 영역 스포츠 결정 로직

### `src/utils/dataUpdater.ts`
- 데이터 페칭 함수 (현재는 예시 데이터 반환)
- 실제 API 연동 시 이 파일 수정 필요

### `src/components/MainLayout/MainLayout.tsx`
- 메인 페이지의 4개 영역 레이아웃
- 반응형 그리드 시스템

### `src/pages/MainPage.tsx`
- 메인 페이지 로직
- 시즌 상태에 따른 영역 배치

---

## 🔮 향후 개발 방향

1. **API 연동**
   - 실제 스포츠 데이터 API 연결
   - 데이터 업데이트 스케줄링 구현

2. **상세 페이지 완성**
   - BaseballDetail 페이지 구현
   - VolleyballDetail 페이지 구현
   - InternationalSportsDetail 페이지 구현

3. **기능 추가**
   - 경기 일정 캘린더
   - 선수 통계 상세 정보
   - 경기 하이라이트 영상 연동

4. **성능 최적화**
   - 데이터 캐싱
   - 이미지 최적화
   - 코드 스플리팅

5. **사용자 경험 개선**
   - 다크 모드
   - 알림 기능
   - 즐겨찾기 기능

---

## 📞 참고 사항

- 시즌 날짜는 `src/utils/seasonManager.ts`에서 수정 가능
- 현재는 하드코딩된 예시 데이터 사용 중
- 실제 배포 전 API 연동 및 데이터 소스 확보 필요

---

**마지막 업데이트**: 2024년
**프로젝트 버전**: 0.0.0
