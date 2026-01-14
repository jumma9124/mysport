# My Sport 프로젝트 파일 경로

## 📂 프로젝트 루트 경로
```
c:\Users\CNXK\Desktop\cursor\mysport\
```

---

## 📁 주요 디렉토리 및 파일 경로

### 루트 디렉토리 파일
```
c:\Users\CNXK\Desktop\cursor\mysport\
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── README.md
└── PROJECT_SUMMARY.md
```

### 소스 코드 디렉토리 (src/)
```
c:\Users\CNXK\Desktop\cursor\mysport\src\
├── App.tsx                    # 라우터 설정
├── main.tsx                   # 애플리케이션 진입점
└── index.css                  # 글로벌 스타일
```

### 컴포넌트 디렉토리 (src/components/)
```
c:\Users\CNXK\Desktop\cursor\mysport\src\components\
├── Baseball\
│   └── BaseballCard.tsx       # 야구 카드 컴포넌트
├── Volleyball\
│   └── VolleyballCard.tsx     # 배구 카드 컴포넌트
├── InternationalSports\
│   └── InternationalSportsCard.tsx  # 국제스포츠 카드 컴포넌트
└── MainLayout\
    └── MainLayout.tsx         # 메인 레이아웃 컴포넌트
```

### 페이지 디렉토리 (src/pages/)
```
c:\Users\CNXK\Desktop\cursor\mysport\src\pages\
├── MainPage.tsx               # 메인 대시보드 페이지
├── BaseballDetail.tsx         # 야구 상세 페이지
├── VolleyballDetail.tsx       # 배구 상세 페이지
└── InternationalSportsDetail.tsx  # 국제스포츠 상세 페이지
```

### 유틸리티 디렉토리 (src/utils/)
```
c:\Users\CNXK\Desktop\cursor\mysport\src\utils\
├── seasonManager.ts           # 시즌 관리 로직
└── dataUpdater.ts             # 데이터 업데이트 로직
```

### 타입 정의 디렉토리 (src/types/)
```
c:\Users\CNXK\Desktop\cursor\mysport\src\types\
└── index.ts                   # TypeScript 타입 정의
```

---

## 📝 상대 경로 (프로젝트 루트 기준)

### 루트 파일
```
./.gitignore
./index.html
./package.json
./package-lock.json
./postcss.config.js
./tailwind.config.js
./tsconfig.json
./tsconfig.node.json
./vite.config.ts
./README.md
./PROJECT_SUMMARY.md
```

### 소스 코드
```
./src/App.tsx
./src/main.tsx
./src/index.css
```

### 컴포넌트
```
./src/components/Baseball/BaseballCard.tsx
./src/components/Volleyball/VolleyballCard.tsx
./src/components/InternationalSports/InternationalSportsCard.tsx
./src/components/MainLayout/MainLayout.tsx
```

### 페이지
```
./src/pages/MainPage.tsx
./src/pages/BaseballDetail.tsx
./src/pages/VolleyballDetail.tsx
./src/pages/InternationalSportsDetail.tsx
```

### 유틸리티
```
./src/utils/seasonManager.ts
./src/utils/dataUpdater.ts
```

### 타입
```
./src/types/index.ts
```

---

## 🔗 프로젝트 내 import 경로 예시

### TypeScript Path Alias (tsconfig.json 기준)
프로젝트에서는 `@/` 경로 별칭을 사용합니다:
- `@/components/*` → `src/components/*`
- `@/pages/*` → `src/pages/*`
- `@/utils/*` → `src/utils/*`
- `@/types/*` → `src/types/*`

### 예시
```typescript
// src/pages/MainPage.tsx에서
import MainLayout from '@/components/MainLayout/MainLayout';
import BaseballCard from '@/components/Baseball/BaseballCard';
import { getMainAreaSport } from '@/utils/seasonManager';
import { BaseballData } from '@/types';
```

---

## 📦 설정 파일 경로

### 빌드 도구
- Vite 설정: `./vite.config.ts`
- TypeScript 설정: `./tsconfig.json`, `./tsconfig.node.json`

### 스타일링
- Tailwind CSS 설정: `./tailwind.config.js`
- PostCSS 설정: `./postcss.config.js`
- 글로벌 CSS: `./src/index.css`

### 패키지 관리
- 패키지 정보: `./package.json`
- 패키지 락: `./package-lock.json`

---

## 🔍 빠른 파일 찾기

### 주요 진입점
- **애플리케이션 시작**: `src/main.tsx`
- **라우터 설정**: `src/App.tsx`
- **메인 페이지**: `src/pages/MainPage.tsx`

### 핵심 로직
- **시즌 관리**: `src/utils/seasonManager.ts`
- **데이터 업데이트**: `src/utils/dataUpdater.ts`
- **타입 정의**: `src/types/index.ts`

### 레이아웃
- **메인 레이아웃**: `src/components/MainLayout/MainLayout.tsx`

### 스포츠별 컴포넌트
- **야구**: `src/components/Baseball/BaseballCard.tsx`
- **배구**: `src/components/Volleyball/VolleyballCard.tsx`
- **국제스포츠**: `src/components/InternationalSports/InternationalSportsCard.tsx`

---

**참고**: 모든 경로는 Windows 환경 기준입니다.