# Sports Dashboard 정의서 기반 구현 계획

## 📊 현재 상태 vs 목표 상태

### 현재 상태
- ✅ React + TypeScript + Vite 프론트엔드
- ✅ 다크 테마 UI 완성
- ❌ 하드코딩된 예시 데이터만 사용
- ❌ JSON 파일 연동 없음
- ❌ 크롤링 스크립트 없음

### 목표 상태 (정의서 기준)
- ✅ React 프론트엔드 유지
- ✅ JSON 파일에서 데이터 로드
- ✅ public/data/ 폴더 구조 생성
- ✅ 크롤링 스크립트 (별도 관리 또는 통합)

---

## 🔄 적용 계획

### 1단계: 데이터 구조 준비

#### A. public/data/ 폴더 생성 및 예시 JSON 파일 생성
```
public/
└── data/
    ├── sports.json          # 통합 데이터
    ├── volleyball-detail.json
    ├── baseball-detail.json
    ├── major-events.json
    └── season-config.json
```

#### B. TypeScript 타입 정의 확장
- JSON 파일 구조에 맞는 타입 정의
- season-config.json 타입 추가

### 2단계: 데이터 로딩 로직 변경

#### A. dataUpdater.ts 수정
- 하드코딩된 데이터 → JSON 파일 fetch로 변경
- 에러 처리 추가
- 캐싱 로직 고려

#### B. seasonManager.ts 수정
- season-config.json에서 시즌 날짜 로드
- 하드코딩된 날짜 제거

### 3단계: 크롤링 스크립트 (선택사항)

#### 옵션 1: 별도 저장소로 관리
- 크롤링 스크립트는 별도 Node.js 프로젝트로 관리
- GitHub Actions로 자동 크롤링
- JSON 파일을 현재 프로젝트에 배포

#### 옵션 2: 현재 프로젝트에 통합
- 프로젝트 루트에 crawl-*.js 추가
- package.json에 크롤링 스크립트 추가
- Puppeteer 의존성 추가

---

## 📝 구체적 구현 사항

### 1. JSON 파일 구조

#### sports.json
```json
{
  "volleyball": {
    "team": "현대캐피탈 스카이워커스",
    "currentRank": 2,
    "record": {
      "wins": 12,
      "losses": 7,
      "winRate": 0.632,
      "setRate": 1.517
    }
  },
  "baseball": {
    "team": "한화 이글스",
    "currentRank": 2,
    "record": {
      "wins": 83,
      "losses": 57,
      "draws": 4,
      "winRate": 0.593
    }
  }
}
```

#### season-config.json
```json
{
  "baseball": {
    "start": "2026-03-23",
    "end": "2026-10-31"
  },
  "volleyball": {
    "start": "2025-10-15",
    "end": "2026-03-31"
  },
  "international": {
    "start": "2026-06-15",
    "end": "2026-07-15"
  }
}
```

#### major-events.json
```json
[
  {
    "name": "2026 밀라노-코르티나 동계올림픽",
    "date": "2026-02-06",
    "icon": "snow"
  },
  {
    "name": "2026 월드 베이스볼 클래식",
    "date": "2026-03-08",
    "icon": "baseball"
  },
  {
    "name": "2026 FIFA 월드컵",
    "date": "2026-06-11",
    "icon": "soccer"
  }
]
```

### 2. dataUpdater.ts 변경

```typescript
// 변경 전: 하드코딩
export const fetchBaseballData = async (): Promise<BaseballData> => {
  return { /* 하드코딩된 데이터 */ };
};

// 변경 후: JSON 파일 fetch
export const fetchBaseballData = async (): Promise<BaseballData> => {
  try {
    const response = await fetch('/data/sports.json');
    const sportsData = await response.json();
    const baseballData = sportsData.baseball;
    
    // 상세 데이터도 로드
    const detailResponse = await fetch('/data/baseball-detail.json');
    const detailData = await detailResponse.json();
    
    return {
      ...baseballData,
      ...detailData,
      seasonStatus: getSeasonStatus('baseball'),
    };
  } catch (error) {
    console.error('Failed to fetch baseball data:', error);
    // 폴백 데이터 반환
    return getDefaultBaseballData();
  }
};
```

### 3. seasonManager.ts 변경

```typescript
// 변경 전: 하드코딩된 날짜
const SEASON_DATES = {
  baseball: {
    start: new Date('2024-03-23'),
    end: new Date('2024-10-31'),
  },
  // ...
};

// 변경 후: JSON에서 로드
let SEASON_DATES: Record<SportType, { start: Date; end: Date }> | null = null;

export const loadSeasonConfig = async () => {
  try {
    const response = await fetch('/data/season-config.json');
    const config = await response.json();
    
    SEASON_DATES = {
      baseball: {
        start: new Date(config.baseball.start),
        end: new Date(config.baseball.end),
      },
      volleyball: {
        start: new Date(config.volleyball.start),
        end: new Date(config.volleyball.end),
      },
      international: {
        start: new Date(config.international.start),
        end: new Date(config.international.end),
      },
    };
  } catch (error) {
    console.error('Failed to load season config:', error);
    // 기본값 사용
  }
};
```

---

## 🚀 구현 우선순위

### Phase 1: 기본 구조 (즉시 구현 가능)
1. ✅ public/data/ 폴더 생성
2. ✅ 예시 JSON 파일 생성
3. ✅ dataUpdater.ts에서 JSON fetch로 변경
4. ✅ seasonManager.ts에서 season-config.json 로드

### Phase 2: 상세 페이지 연동
1. ✅ volleyball-detail.json 연동
2. ✅ baseball-detail.json 연동
3. ✅ major-events.json 연동

### Phase 3: 크롤링 스크립트 (나중에)
1. ⏳ Puppeteer 스크립트 작성
2. ⏳ GitHub Actions 워크플로우 설정
3. ⏳ 자동 배포 파이프라인 구축

---

## ❓ 결정 필요 사항

1. **크롤링 스크립트 위치**
   - 현재 프로젝트에 통합할까요?
   - 별도 저장소로 분리할까요?

2. **데이터 소스**
   - 실제 크롤링을 바로 구현할까요?
   - 일단 예시 JSON 파일로 구조만 만들까요?

3. **배포 방식**
   - GitHub Pages 사용?
   - 다른 호스팅 서비스?

---

## ✅ 다음 단계

원하시는 방향을 알려주시면:
1. public/data/ 폴더 구조 생성
2. 예시 JSON 파일 생성
3. dataUpdater.ts 수정
4. seasonManager.ts 수정

을 진행하겠습니다!
