# MySport - 실시간 스포츠 대시보드

개인 맞춤형 스포츠 데이터 대시보드. 한화 이글스(야구), 현대캐피탈 스카이워커스(배구), 주요 국제대회(동계올림픽 등) 정보를 실시간으로 수집하여 보여줍니다.

- **GitHub Repository:** https://github.com/jumma9124/mysport
- **Live URL:** https://jumma9124.github.io/mysport/
- **기술 스택:** React 18 + TypeScript + Vite + Tailwind CSS
- **데이터 수집:** Puppeteer + Cheerio (네이버 스포츠 크롤링)
- **배포:** GitHub Pages (자동 배포)
- **자동화:** GitHub Actions (스케줄 크롤링 + 자동 커밋)

---

## 목차

1. [프로젝트 구조](#프로젝트-구조)
2. [앱 초기화 흐름](#앱-초기화-흐름)
3. [페이지별 역할](#페이지별-역할)
4. [컴포넌트 상세](#컴포넌트-상세)
5. [크롤러 스크립트](#크롤러-스크립트)
6. [데이터 파일](#데이터-파일)
7. [데이터 로딩 전략](#데이터-로딩-전략)
8. [GitHub Actions 워크플로우](#github-actions-워크플로우)
9. [사용한 API / 데이터 소스](#사용한-api--데이터-소스)
10. [인증 정보 / 환경 변수](#인증-정보--환경-변수)
11. [시즌 관리 시스템](#시즌-관리-시스템)
12. [디자인 시스템](#디자인-시스템)
13. [로컬 개발 환경](#로컬-개발-환경)
14. [TypeScript 설정](#typescript-설정)
15. [지금까지 작업한 내용](#지금까지-작업한-내용)
16. [앞으로 남은 작업](#앞으로-남은-작업)
17. [트러블슈팅 기록](#트러블슈팅-기록)

---

## 프로젝트 구조

```
mysport/
├── .github/workflows/           # GitHub Actions 자동화
│   ├── crawl-baseball.yml       # 야구 데이터 크롤링
│   ├── crawl-volleyball.yml     # 배구 데이터 크롤링
│   ├── crawl-international-sports.yml  # 동계올림픽 크롤링
│   ├── crawl-major-events.yml   # 주요 이벤트 목록 업데이트
│   ├── deploy.yml               # GitHub Pages 배포
│   └── update-season-config.yml # 시즌 설정 업데이트 (TODO)
│
├── public/data/                 # 크롤링된 JSON 데이터
│   ├── sports.json              # 전체 스포츠 요약 (메인 카드용)
│   ├── baseball-detail.json     # 야구 상세 데이터
│   ├── baseball-daily-rank.json # 야구 일별 순위 (차트용)
│   ├── volleyball-detail.json   # 배구 상세 데이터
│   ├── winter-olympics-detail.json  # 동계올림픽 상세 데이터
│   ├── major-events.json        # 주요 국제대회 목록
│   └── season-config.json       # 시즌 날짜 설정
│
├── scripts/                     # 데이터 크롤링 스크립트 (Node.js/CommonJS)
│   ├── crawl-baseball.cjs       # KBO 야구 크롤러
│   ├── crawl-volleyball.cjs     # V리그 배구 크롤러
│   ├── crawl-winter-olympics.cjs # 동계올림픽 크롤러
│   └── crawl-major-events.cjs   # 주요 이벤트 생성기
│
├── src/
│   ├── components/
│   │   ├── MainLayout/MainLayout.tsx          # 메인 2x2 그리드 레이아웃
│   │   ├── Baseball/BaseballCard.tsx           # 야구 메인 카드 위젯
│   │   ├── Baseball/RankChart.tsx              # 순위 트렌드 SVG 차트
│   │   ├── Volleyball/VolleyballCard.tsx       # 배구 메인 카드 위젯
│   │   └── InternationalSports/InternationalSportsCard.tsx  # 국제대회 카드
│   │
│   ├── pages/
│   │   ├── MainPage.tsx                  # 메인 대시보드 (4영역 그리드)
│   │   ├── BaseballDetail.tsx            # 야구 상세 페이지
│   │   ├── VolleyballDetail.tsx          # 배구 상세 페이지
│   │   └── InternationalSportsDetail.tsx # 국제대회 상세 페이지
│   │
│   ├── types/index.ts           # TypeScript 타입 정의
│   ├── utils/
│   │   ├── dataUpdater.ts       # 데이터 fetch 유틸리티
│   │   └── seasonManager.ts     # 시즌 상태 판별 유틸리티
│   │
│   ├── App.tsx                  # 라우터 설정 (HashRouter)
│   ├── main.tsx                 # React 진입점
│   └── index.css                # 기본 스타일
│
├── vite.config.ts               # Vite 설정 (base: /mysport/)
├── vite.plugin.api.ts           # 개발서버 API 플러그인 (실시간 크롤링)
├── tailwind.config.js           # Tailwind CSS 설정
├── tsconfig.json                # TypeScript 설정
├── package.json                 # 의존성 및 스크립트
└── .env.example                 # 환경변수 예시
```

---

## 앱 초기화 흐름

```
index.html
  └─ src/main.tsx
       └─ loadSeasonConfig()          ← 시즌 설정 먼저 로드
            ├─ season-config.json     ← 야구/배구 시즌 날짜
            └─ major-events.json      ← 국제대회 일정 (동적 시즌 판별용)
       └─ ReactDOM.createRoot()
            └─ <App />
                 └─ HashRouter
                      ├─ /           → MainPage
                      ├─ /baseball   → BaseballDetail
                      ├─ /volleyball → VolleyballDetail
                      └─ /international → InternationalSportsDetail
```

**핵심 포인트:** `loadSeasonConfig()`이 완료된 **후에** React가 렌더링됩니다. 이 함수가 시즌 날짜를 로드해야 `getSeasonStatus()`, `getSortedSports()` 등이 정상 동작합니다.

**라우터:** `HashRouter` 사용 (URL에 `#/` 포함). GitHub Pages에서 SPA 라우팅이 안정적으로 동작하기 위해 선택.

---

## 페이지별 역할

### 1. MainPage (`/`)
메인 대시보드. 2x2 그리드로 스포츠 카드 4개를 배치합니다.

- 시즌 중인 스포츠가 상단에 우선 배치
- 시즌 중: 국제대회 > 야구 > 배구 순
- 비시즌: 야구 > 배구 > 국제대회 순
- 각 카드 클릭 시 상세 페이지로 이동

### 2. BaseballDetail (`/baseball`)
한화 이글스 야구 상세 페이지.

| 영역 | 내용 |
|------|------|
| 상단 | 순위 트렌드 차트 (SVG, 3월~10월) |
| 좌측 (40%) | KBO 리그 순위표 (10개 팀) |
| 우측 (60%) | 투수/타자 순위 탭 (리그 TOP 10) |
| 하단 | 상대전적표 |
| 시리즈 | 현재/이전/다음 시리즈 정보 + 이닝별 스코어 |

### 3. VolleyballDetail (`/volleyball`)
현대캐피탈 스카이워커스 배구 상세 페이지.

| 영역 | 내용 |
|------|------|
| 좌측 (40%) | V리그 순위 (남자부/여자부 탭) + 다가오는 경기 |
| 우측 (60%) | 시즌중: 최근 경기 결과 (세트별 스코어) |
| 우측 (60%) | 비시즌: 공격수 순위 |

### 4. InternationalSportsDetail (`/international`)
주요 국제대회 상세 페이지. 현재는 밀라노-코르티나 2026 동계올림픽이 메인.

| 영역 | 내용 |
|------|------|
| 동계올림픽 (상단) | 대회 진행 중에 상단 고정 표시 |
| 메달 순위 탭 | 대한민국 메달 현황 + 전체 국가 순위 |
| 경기 일정 탭 | 오늘의 경기 + 다가오는 한국선수 경기 |
| 종목별 일정 탭 | 15개 종목 칩 선택 → 해당 종목 경기 목록 |
| 이벤트 리스트 | 기타 국제대회 (WBC, FIFA 월드컵 등) |
| 대회 종료 후 | 하단으로 이동, 토글 접힘 상태로 표시 |

#### 동계올림픽 15개 종목
쇼트트랙(STK), 스피드스케이팅(SSK), 피겨스케이팅(FSK), 컬링(CUR), 아이스하키(ICH), 봅슬레이(BOB), 루지(LUG), 스켈레톤(SKE), 알파인스키(ALP), 크로스컨트리스키(CCS), 스키점프(SKJ), 노르딕복합(NCB), 프리스타일스키(FRS), 스노보드(SNB), 바이애슬론(BIA)

---

## 컴포넌트 상세

### MainLayout (`src/components/MainLayout/MainLayout.tsx`)
메인 페이지의 2x2 그리드 컨테이너.

- **Props:** `area1`, `area2`, `area3`, `area4` (ReactNode)
- **헤더:** "MY SPORT" 타이틀 (중앙) + 마지막 업데이트 날짜 (우측, YYYY.MM.DD)
- **레이아웃:** `grid-cols-1` (모바일) → `md:grid-cols-2` (데스크탑)
- **최대 너비:** 1400px, 중앙 정렬
- **카드 최소 높이:** 모바일 300px, 데스크탑 자동

### BaseballCard (`src/components/Baseball/BaseballCard.tsx`)
메인 페이지 야구 위젯. 클릭 시 `/baseball`로 이동.

- 시즌 중: 주황색 테두리 (`#f97316`), 현재 시리즈 + 다음 시리즈 표시
- 비시즌: 기본 테두리, 마지막 시리즈 결과 표시
- 프리시즌: "개막까지 D-N" 카운트다운
- 순위를 크게 표시 (text-5xl), 전적/승률 하단에 배치
- 로딩 중: `animate-pulse` 스켈레톤 UI

### RankChart (`src/components/Baseball/RankChart.tsx`)
SVG 기반 시즌 순위 트렌드 차트.

- **데이터:** `baseball-daily-rank.json`에서 일별 순위 로드
- **차트:** 800x200px SVG, 1~10위 Y축, 3월~10월 X축
- **라인:** 녹색 (#4caf50) 실선, 각 포인트에 원형 마커
- **뱃지:** 최고 순위 (녹색), 최저 순위 (빨간색) 표시
- **반응형:** `preserveAspectRatio="none"`으로 컨테이너에 맞춤

### VolleyballCard (`src/components/Volleyball/VolleyballCard.tsx`)
메인 페이지 배구 위젯. 클릭 시 `/volleyball`로 이동.

- 시즌 중: 전적 + 승점 + 세트득실률, 최근 경기, 다음 경기 표시
- 비시즌: 시즌 총 기록 (전적, 승점, 세트득실률)
- 경기 결과: 승(녹색) / 패(빨간색) 배지 + 스코어

### InternationalSportsCard (`src/components/InternationalSports/InternationalSportsCard.tsx`)
메인 페이지 국제대회 위젯. 클릭 시 `/international`로 이동.

- 헤더: "대한민국 대표팀 / 국제 스포츠대회"
- 등록된 이벤트 목록 + "개막 D-N" 카운트다운
- 이벤트별 녹색 체크마크 아이콘

---

## 크롤러 스크립트

### crawl-baseball.cjs
KBO 야구 데이터 크롤링. 네이버 스포츠 + KBO 공식 사이트.

```
크롤링 대상:
- 리그 순위 (10개 팀): 승, 패, 무, 승률
- 투수 순위 (TOP 10): 이름, 팀, ERA, 승, 패, 탈삼진
- 타자 순위 (TOP 10): 이름, 팀, 타율, 안타, 홈런, 타점
- 상대전적: 한화 vs 각 팀 (승-패-무)
- 시리즈 정보: 현재/이전/다음 시리즈, 이닝별 스코어

출력 파일:
- public/data/baseball-detail.json
- public/data/sports.json (야구 섹션 업데이트)
```

### crawl-volleyball.cjs
V리그 배구 데이터 크롤링. 네이버 스포츠.

```
크롤링 대상:
- 남자부 순위: 팀명, 승, 패, 세트승률, 승점
- 여자부 순위: 동일 구조
- 최근 경기 결과: 날짜, 상대, 스코어, 세트별 점수
- 다가오는 경기: 날짜, 시간, 상대, 장소
- 공격수 순위: 이름, 포지션, 통계

출력 파일:
- public/data/volleyball-detail.json
- public/data/sports.json (배구 섹션 업데이트)
```

### crawl-winter-olympics.cjs
밀라노-코르티나 2026 동계올림픽 크롤링. 네이버 스포츠.

```
크롤링 방식:
- 순차 실행 (Promise.all X → 타임아웃 방지)
- 날짜 기반 크롤링 (2/6~2/22, 17일간)
- isKorean=Y 파라미터로 한국선수 경기 필터링

크롤링 대상:
1. 메달 정보: 대한민국 금/은/동/합계
2. 전체 국가 메달 순위: 순위, 국가명, 금/은/동/합계
3. 한국 메달리스트: 이름, 메달종류, 종목, 날짜
4. 오늘의 경기: 시간, 종목, 상태, 선수
5. 다가오는 경기: 7일 이내 예정 경기
6. 종목별 일정: 15개 종목 × 날짜별 한국선수 경기

출력 파일:
- public/data/winter-olympics-detail.json
- public/data/sports.json (국제대회 섹션 업데이트)
```

### crawl-major-events.cjs
주요 국제대회 목록 생성 (정적 데이터).

```
현재 등록된 이벤트:
- 2026 밀라노-코르티나 동계올림픽 (2026-02-06)
- 2026 월드 베이스볼 클래식 (2026-03-08)
- 2026 FIFA 월드컵 (2026-06-11)

출력 파일: public/data/major-events.json
```

---

## 데이터 파일

### sports.json
메인 페이지 카드에 표시할 요약 데이터.

```json
{
  "baseball": {
    "team": "한화 이글스",
    "currentRank": 5,
    "record": { "wins": 0, "losses": 0, "draws": 0, "winRate": 0 },
    "seasonStatus": "off-season"
  },
  "volleyball": {
    "team": "현대캐피탈 스카이워커스",
    "currentRank": 3,
    "record": { "wins": 21, "losses": 15, "points": 67, "setRate": 1.2 },
    "seasonStatus": "in-season"
  },
  "international": {
    "name": "주요 스포츠 이벤트",
    "data": { "events": [...] }
  }
}
```

### season-config.json
시즌 시작/종료 날짜 설정.

```json
{
  "baseball": { "start": "2026-03-23", "end": "2026-10-31" },
  "volleyball": { "start": "2025-10-15", "end": "2026-03-31" },
  "international": { "start": "2026-01-01", "end": "2026-01-01" }
}
```

### winter-olympics-detail.json
동계올림픽 상세 데이터 (가장 큰 파일, ~23KB).

```json
{
  "lastUpdate": "2026-02-11T13:04:00Z",
  "medals": { "gold": 0, "silver": 1, "bronze": 1, "total": 2 },
  "allCountriesMedals": [
    { "rank": 1, "nation": "노르웨이", "gold": 10, ... }
  ],
  "koreaMedalists": [
    { "name": "유승은", "medalType": "bronze", "discipline": "스노보드 여자 빅에어", "date": "..." },
    { "name": "김상겸", "medalType": "silver", "discipline": "스노보드", "date": "..." }
  ],
  "todaySchedule": [...],
  "upcomingSchedule": [...],
  "disciplineSchedules": {
    "STK": { "name": "쇼트트랙", "games": [...] },
    "SNB": { "name": "스노보드", "games": [...] },
    ...
  }
}
```

---

## 데이터 로딩 전략

앱에서 데이터를 로드하는 3단계 폴백 구조 (`dataUpdater.ts`):

```
1단계: 실시간 크롤링 (개발 환경 전용)
  └─ /api/crawl-baseball, /api/crawl-volleyball, /api/crawl-international
  └─ Vite 플러그인이 child_process로 크롤러 실행 (10MB maxBuffer)
  └─ localhost에서만 시도, 실패 시 2단계로

2단계: 정적 JSON 파일 (프로덕션 기본)
  └─ /mysport/data/sports.json + 각 스포츠 detail JSON
  └─ GitHub Actions가 주기적으로 업데이트
  └─ base path: 프로덕션 /mysport/, 개발 /

3단계: 기본값 폴백
  └─ 모든 소스 실패 시 하드코딩된 기본 데이터 반환
  └─ 순위 0, 전적 0-0-0 등
```

**메모리 누수 방지:** 모든 컴포넌트에서 `isMounted` 패턴 사용. 비동기 데이터 로드 완료 전 컴포넌트가 언마운트되면 state 업데이트를 건너뜁니다.

---

## GitHub Actions 워크플로우

### 1. crawl-baseball.yml - 야구 크롤링
| 항목 | 내용 |
|------|------|
| 실행 시점 | 시즌중(3~10월): 매일 10시, 22시 KST / 비시즌: 매주 월요일 |
| cron | `0 1,13 * 3-10 *` (시즌) / `0 1 * 11-12,1-2 *` (비시즌) |
| 커밋 메시지 | `chore: update baseball data` |
| 충돌 방지 | `git pull --rebase origin main` 후 push |

### 2. crawl-volleyball.yml - 배구 크롤링
| 항목 | 내용 |
|------|------|
| 실행 시점 | 시즌중(10~4월): 매일 10시, 22시 KST / 비시즌: 매주 월요일 |
| cron | `0 1,13 * 10-12,1-4 *` (시즌) / `0 1 * 5-9 *` (비시즌) |
| 커밋 메시지 | `chore: update volleyball data` |
| 충돌 방지 | `git pull --rebase origin main` 후 push |

### 3. crawl-international-sports.yml - 동계올림픽 크롤링
| 항목 | 내용 |
|------|------|
| 실행 시점 | 하루 5회 (한국시간 09:00, 17:00, 21:00, 01:00, 05:00) |
| cron | `0 0,8,12,16,20 * * *` |
| 커밋 메시지 | `chore: update international sports data` |
| 충돌 방지 | `git pull --rebase origin main` 후 push |

### 4. crawl-major-events.yml - 주요 이벤트 목록
| 항목 | 내용 |
|------|------|
| 실행 시점 | 매년 1월 1일 자정 UTC |
| cron | `0 0 1 1 *` |
| 커밋 메시지 | `chore: update major events data` |

### 5. deploy.yml - GitHub Pages 배포
| 항목 | 내용 |
|------|------|
| 트리거 | main 브랜치 push 시 자동 배포 |
| 빌드 | `npm ci && npm run build` |
| 배포 대상 | `./dist` 폴더 → GitHub Pages |
| 동시성 | `cancel-in-progress: true` |

### 6. update-season-config.yml - 시즌 설정 업데이트
| 항목 | 내용 |
|------|------|
| 실행 시점 | 매년 2월 15일 (야구), 9월 15일 (배구) |
| 상태 | TODO - 크롤링 스크립트 미구현 (현재 echo만 실행) |

---

## 사용한 API / 데이터 소스

### 네이버 스포츠 (Naver Sports) - 메인 데이터 소스
크롤링 방식: Puppeteer (headless Chrome)로 모바일 페이지 렌더링 후 DOM에서 데이터 추출.

#### 야구 (KBO)
| URL | 용도 |
|-----|------|
| `m.sports.naver.com/kbaseball/record/kbo?seasonCode=2025&tab=teamRank` | 팀 순위 |
| `m.sports.naver.com/kbaseball/record/kbo?seasonCode=2025&tab=hitter` | 타자 순위 |
| `m.sports.naver.com/kbaseball/record/kbo?seasonCode=2025&tab=pitcher` | 투수 순위 |

#### 배구 (V리그)
| URL | 용도 |
|-----|------|
| `m.sports.naver.com/volleyball/record/kovo?seasonCode=022&tab=teamRank` | 남자부 순위 |
| `m.sports.naver.com/volleyball/record/index?category=wkovo` | 여자부 순위 |
| `m.sports.naver.com/volleyball/schedule/index?category=kovo&date={date}` | 경기 일정 |

#### 동계올림픽 (밀라노-코르티나 2026)
| URL | 용도 |
|-----|------|
| `m.sports.naver.com/milanocortina2026/medals?pageType=COUNTRY&sortType=goldMedal` | 국가별 메달 순위 |
| `m.sports.naver.com/milanocortina2026/medals?pageType=MEDALIST&sortType=recentMedalEarned` | 메달리스트 목록 |
| `m.sports.naver.com/milanocortina2026/schedule?type=date&date={date}&isKorean=Y` | 날짜별 한국선수 경기 |
| `m.sports.naver.com/milanocortina2026/schedule?type=total&isKorean=Y` | 전체 한국선수 경기 |
| `m.sports.naver.com/milanocortina2026/schedule?type=discipline&disciplineId={id}` | 종목별 경기 |

### KBO 공식 사이트
| URL | 용도 |
|-----|------|
| `www.koreabaseball.com/Record/TeamRank/TeamRank.aspx` | 상대전적 |

> **참고:** 모든 데이터는 공개 웹페이지 크롤링으로 수집. 별도의 API 키나 인증은 필요하지 않습니다.

---

## 인증 정보 / 환경 변수

### GitHub Actions에서 사용하는 시크릿
| 시크릿 | 용도 | 설정 위치 |
|--------|------|-----------|
| `GITHUB_TOKEN` | GitHub Actions 자동 커밋/푸시 | GitHub 자동 제공 (별도 설정 불필요) |

### 로컬 환경변수 (.env) - 선택사항
현재는 사용하지 않지만 향후 알림 기능용으로 준비됨.

```bash
# .env.example 참고
TEAMS_WEBHOOK_URL=https://your-org.webhook.office.com/webhookb2/...  # MS Teams 알림 (선택)
EMAIL_USER=your-email@gmail.com        # Gmail 발신자 (선택)
EMAIL_APP_PASSWORD=your-app-password    # Gmail 앱 비밀번호 (선택)
EMAIL_TO=recipient@gmail.com            # 알림 수신자 (선택)
```

### Puppeteer 설정
```javascript
// 모든 크롤러에서 동일하게 사용
browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});

// User-Agent: iPhone으로 모바일 페이지 접근
await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15');
```

> **중요:** 별도의 API 키, 인증 토큰, 유료 API는 사용하지 않습니다. 모든 데이터는 네이버 스포츠 공개 페이지에서 Puppeteer로 크롤링합니다.

---

## 시즌 관리 시스템

### 시즌 판별 로직 (`seasonManager.ts`)

```
야구 시즌:  3월 23일 ~ 10월 31일
배구 시즌: 10월 15일 ~ 3월 31일
국제대회:   major-events.json 기반 동적 판별
```

| 상태 | 조건 |
|------|------|
| `pre-season` | 시작일 7일 전 ~ 시작일 |
| `in-season` | 시작일 ~ 종료일 |
| `off-season` | 그 외 기간 |

### 메인 페이지 정렬 우선순위
1. 시즌 중인 스포츠가 먼저 (국제대회 > 야구 > 배구)
2. 비시즌 스포츠는 뒤로 (야구 > 배구 > 국제대회)

### 데이터 업데이트 주기
| 스포츠 | 시즌 중 | 비시즌 |
|--------|---------|--------|
| 야구 | 하루 2회 (10시, 22시) | 주 1회 (월요일) |
| 배구 | 하루 2회 (10시, 22시) | 주 1회 (월요일) |
| 동계올림픽 | 하루 5회 | - |

---

## 디자인 시스템

### 색상 팔레트
| 용도 | 색상 | 값 |
|------|------|-----|
| 배경 | 검정 | `#000000` (body) |
| 카드 배경 | 다크 블루그레이 | `rgb(32, 34, 52)` |
| 카드 글래스 효과 | 블러 | `backdropFilter: blur(10px)` |
| 기본 테두리 | 반투명 흰색 | `rgba(255, 255, 255, 0.2)` |
| 시즌 강조 테두리 | 주황 | `#f97316` (2px solid) |
| 체크마크 아이콘 | 녹색 | `#4caf50` |
| 승리 | 녹색 | `rgba(76, 175, 80, 0.7)` |
| 패배 | 빨간 | `rgba(239, 68, 68, 0.7)` |
| LIVE 상태 | 빨간 | `rgba(239, 68, 68, 0.9)` |
| 예정 상태 | 파란 | `rgba(59, 130, 246, 0.7)` |
| 종료 상태 | 회색 | `rgba(107, 114, 128, 0.7)` |
| 탭 활성 | 보라 | `rgba(102, 126, 234, 0.3)` |

### 카드 공통 스타일
```css
background: rgb(32, 34, 52);
backdropFilter: blur(10px);
borderRadius: 15px;
padding: 20px;
border: 1px solid rgba(255, 255, 255, 0.2);
```

### 반응형 브레이크포인트
| 화면 | 동작 |
|------|------|
| 모바일 (< 768px) | 1열 세로 스택, 카드 최소 높이 300px, padding 16px |
| 데스크탑 (>= 768px) | 2x2 그리드, 자동 높이, padding 24px |

### 폰트
- **기본:** Apple system fonts (`-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', ...`)
- **코드:** `source-code-pro, Menlo, Monaco, Consolas, 'Courier New'`
- **크기:** Tailwind 유틸리티 (text-sm ~ text-5xl)
- **안티앨리어싱:** `-webkit-font-smoothing: antialiased`

### 애니메이션
- 로딩 스켈레톤: `animate-pulse` (Tailwind 내장)
- 버튼/탭 전환: `transition: all 0.2s`
- 호버 효과: `hover:bg-white/5`, `hover:opacity-80`

---

## 로컬 개발 환경

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (http://localhost:5173)
npm run dev

# 빌드
npm run build

# 미리보기
npm run preview
```

### 수동 크롤링

```bash
# 야구 데이터 크롤링
npm run crawl:baseball

# 배구 데이터 크롤링
npm run crawl:volleyball

# 동계올림픽 데이터 크롤링
npm run crawl:winter

# 주요 이벤트 목록 생성
npm run crawl:events

# 전체 크롤링
npm run crawl:all
```

### 개발서버 실시간 크롤링
`vite.plugin.api.ts`가 개발 서버에 API 엔드포인트를 추가하여, 개발 모드에서는 페이지 로드 시 실시간으로 크롤링을 실행할 수 있습니다.

| 엔드포인트 | 기능 |
|------------|------|
| `/api/crawl-baseball` | 야구 데이터 실시간 크롤링 |
| `/api/crawl-volleyball` | 배구 데이터 실시간 크롤링 |
| `/api/crawl-international` | 동계올림픽 데이터 실시간 크롤링 |

### 주요 설정 파일

| 파일 | 역할 |
|------|------|
| `vite.config.ts` | Vite 설정, base path `/mysport/`, 경로 별칭 `@/` → `./src/` |
| `tailwind.config.js` | Tailwind CSS 설정 |
| `tsconfig.json` | TypeScript 설정 (ES2020, strict 모드) |

---

## TypeScript 설정

### tsconfig.json (소스 코드용)
| 설정 | 값 | 설명 |
|------|-----|------|
| target | ES2020 | 최신 JS 기능 사용 |
| module | ESNext | ES 모듈 |
| jsx | react-jsx | React 17+ JSX 변환 |
| strict | true | 모든 strict 검사 활성화 |
| noUnusedLocals | true | 미사용 변수 에러 |
| noUnusedParameters | true | 미사용 파라미터 에러 |
| baseUrl / paths | `@/*` → `./src/*` | 경로 별칭 |

### tsconfig.node.json (빌드 도구용)
- `vite.config.ts` 전용 설정
- strict 미적용, `allowSyntheticDefaultImports: true`

### 타입 정의 (`src/types/index.ts`)

```typescript
// 시즌/스포츠 타입
SeasonStatus = 'in-season' | 'off-season' | 'pre-season'
SportType = 'baseball' | 'volleyball' | 'international'
AreaPosition = 1 | 2 | 3 | 4

// 야구 타입
BaseballData         ← 전체 야구 데이터 (팀, 시즌, 순위, 전적)
  ├─ BaseballTeam    ← 리그 순위표 행 (팀명, 승패무, 승률)
  ├─ BaseballPitcher ← 투수 (이름, 팀, ERA, 승패, 탈삼진)
  ├─ BaseballBatter  ← 타자 (이름, 팀, 타율, 안타, 홈런, 타점)
  └─ BaseballSeries  ← 시리즈 (상대, 날짜, 경기별 이닝 스코어)

// 배구 타입
VolleyballData       ← 전체 배구 데이터
  ├─ VolleyballTeam  ← 순위표 행 (팀명, 승패, 세트율, 승점)
  ├─ VolleyballMatch ← 경기 결과 (날짜, 상대, 스코어, 세트별)
  └─ VolleyballPlayer← 선수 (이름, 포지션, 통계)

// 동계올림픽 타입
InternationalSportsData  ← 국제대회 전체
  └─ WinterOlympicsData  ← 올림픽 상세
       ├─ medals          ← 금/은/동/합계
       ├─ allCountriesMedals ← 전체 국가 메달 순위
       ├─ koreaMedalists  ← 한국 메달리스트 목록
       ├─ todaySchedule   ← 오늘의 경기
       ├─ upcomingSchedule← 다가오는 경기
       └─ disciplineSchedules ← 종목별 경기 (15개 종목)
```

---

## 지금까지 작업한 내용

### 핵심 기능 구현
- [x] 메인 대시보드 (2x2 그리드, 시즌 기반 자동 정렬)
- [x] 야구 상세 페이지 (순위, 투수/타자, 시리즈, 상대전적, 순위차트)
- [x] 배구 상세 페이지 (순위, 경기결과, 공격수 순위)
- [x] 국제대회 상세 페이지 (동계올림픽 메달/일정/종목별)
- [x] 라우팅 (HashRouter, 4개 페이지)

### 데이터 크롤링
- [x] 야구 크롤러 (네이버 스포츠 KBO + KBO 공식)
- [x] 배구 크롤러 (네이버 스포츠 V리그)
- [x] 동계올림픽 크롤러 (메달, 일정, 15개 종목별 일정)
- [x] 주요 이벤트 목록 생성기
- [x] 개발서버 실시간 크롤링 (Vite 플러그인)

### 자동화
- [x] GitHub Actions 스케줄 크롤링 (야구, 배구, 올림픽)
- [x] 자동 커밋 + 자동 배포 (GitHub Pages)
- [x] git pull --rebase로 워크플로우 충돌 방지

### 동계올림픽 관련 (최근 작업)
- [x] 15개 종목 전체 UI에 표시 (데이터 없는 종목도 "한국 선수 경기 일정이 없습니다" 표시)
- [x] 날짜 기반 크롤링으로 전환 (isKorean=Y 파라미터 활용)
- [x] 순차 실행으로 타임아웃 방지 (Promise.all → for loop)
- [x] 메달리스트 정보 표시 (금/은/동 클릭 시 말풍선)
- [x] 올림픽 종료 후 하단 토글로 이동 (2026-02-22 이후)

---

## 앞으로 남은 작업

### 필수
- [ ] `update-season-config.yml` 크롤링 스크립트 구현 (시즌 날짜 자동 업데이트)
- [ ] 동계올림픽 크롤링 워크플로우 종료 후 비활성화 (올림픽 끝난 후)
- [ ] 야구 시즌 시작 시 `seasonCode=2026` 확인 및 업데이트

### 개선
- [ ] 야구 일별 순위 크롤링 자동화 (현재 수동)
- [ ] 이메일/Teams 알림 기능 활성화 (메달 획득 시 등)
- [ ] 배구 여자부 상세 데이터 추가 (현재 순위만)
- [ ] 모바일 반응형 최적화 개선
- [ ] 에러 모니터링 / 크롤링 실패 알림

### 확장 가능
- [ ] WBC (월드 베이스볼 클래식) 크롤러 추가
- [ ] FIFA 월드컵 크롤러 추가
- [ ] 다른 스포츠 추가 (축구, 농구 등)
- [ ] 데이터 히스토리 저장 (일별 변동 추적)

---

## 트러블슈팅 기록

### 1. GitHub Actions 워크플로우 간 push 충돌
**문제:** 여러 크롤러가 동시에 실행되면 push 시 `non-fast-forward` 에러 발생.
**해결:** 모든 워크플로우에 `git pull --rebase origin main` 추가.

### 2. 동계올림픽 스노보드 경기 0건 문제
**문제:** 종목별 페이지(`type=discipline`)에서 `isKorean=Y`가 제대로 동작하지 않음.
**해결:** 날짜 기반 크롤링으로 전환. 2/6~2/22 기간 동안 매일의 `type=date&isKorean=Y` 페이지를 순회하며 데이터 수집 후 종목별로 그룹핑.

### 3. Puppeteer Promise.all 타임아웃
**문제:** 5개 브라우저 인스턴스를 동시에 실행하면 navigation timeout 발생 (GitHub Actions 환경).
**해결:** `Promise.all` 대신 `for` 루프로 순차 실행.

### 4. 선수 이름 매칭 오류
**문제:** 하드코딩된 선수명으로 종목 매칭 시 잘못된 종목에 배정됨 (예: 곽윤기가 스노보드에 표시).
**해결:** 선수명 매칭 방식 폐기. `isKorean=Y` 파라미터를 사용한 날짜 기반 크롤링으로 완전 대체.

### 5. 네이버 React 페이지 렌더링 대기
**문제:** 네이버 스포츠 페이지가 React SPA라서 `waitUntil: 'domcontentloaded'`만으로는 데이터가 로드되지 않음.
**해결:** `waitUntil: 'networkidle2'` + `waitForSelector()` + `setTimeout(2000~3000ms)` 조합으로 충분한 렌더링 대기.

---

## 의존성 목록

### 런타임 의존성
| 패키지 | 버전 | 용도 |
|--------|------|------|
| react | ^18.2.0 | UI 프레임워크 |
| react-dom | ^18.2.0 | React DOM 렌더러 |
| react-router-dom | ^6.20.0 | 클라이언트 라우팅 |
| puppeteer | ^24.35.0 | 웹 크롤링 (headless Chrome) |
| cheerio | ^1.1.2 | HTML 파싱 |
| node-fetch | ^2.7.0 | HTTP 요청 |
| nodemailer | ^7.0.12 | 이메일 알림 (미사용) |

### 개발 의존성
| 패키지 | 버전 | 용도 |
|--------|------|------|
| vite | ^5.0.0 | 빌드 도구 |
| typescript | ^5.2.2 | 타입 체크 |
| tailwindcss | ^3.3.5 | CSS 프레임워크 |
| @vitejs/plugin-react | ^4.2.0 | React HMR |
| eslint | ^8.53.0 | 코드 린팅 |
| autoprefixer | ^10.4.16 | CSS 벤더 프리픽스 |
| postcss | ^8.4.31 | CSS 후처리 |

---

## 알려진 이슈 / 참고사항

### 미구현 스크립트
- `scripts/send-teams-notification.cjs` - `package.json`에 `notify:teams` 스크립트로 등록되어 있지만 파일이 존재하지 않음. 향후 MS Teams 알림 기능 구현 예정.

### .gitignore 주요 항목
```
node_modules/          # 의존성
dist/, dist-ssr/       # 빌드 출력물
*.local                # 로컬 설정
.env                   # 환경변수 (시크릿 보호)
.vscode/* (단, extensions.json은 추적)
tmpclaude-*            # Claude Code 임시 파일
public/data/.last-notified.json  # 알림 추적 파일
```

### HTML 메타 정보 (`index.html`)
- `lang="ko"` (한국어)
- `<title>My Sport</title>`
- Favicon: Vite 기본 SVG 아이콘
- 표준 모바일 반응형 viewport 메타태그

### Tailwind 커스터마이징
- 현재 커스텀 테마 확장 없음 (기본 Tailwind 설정 사용)
- 모든 커스텀 스타일은 인라인 `style` 속성으로 적용
- PostCSS + Autoprefixer로 크로스 브라우저 호환성 확보

### 크롤러 CSS 셀렉터 (네이버 스포츠)
네이버가 페이지를 업데이트하면 셀렉터가 변경될 수 있어 크롤러가 깨질 수 있습니다. 주요 셀렉터:

```javascript
// 야구 순위
'.TableBody_item__eCenH'         // 순위표 행
'.TeamInfo_ranking__MqHpq'       // 순위 숫자
'.TeamInfo_team_name__dni7F'     // 팀 이름

// 배구 순위
'.TableBody_list__P8yRn'         // 순위표 컨테이너
'.TableBody_item__eCenH'         // 순위표 행

// 동계올림픽 메달
'.OlympicMedal_comp_medal_rank_korea__jbCtr'  // 대한민국 메달 박스
'.OlympicMedal_cell_medal__Wfc1U'             // 메달 셀
```

> 이 셀렉터들은 네이버 React 앱의 CSS Module 해시이므로, 네이버 배포 시 변경될 수 있습니다.
