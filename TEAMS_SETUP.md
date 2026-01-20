# Microsoft Teams 웹훅 알림 설정 가이드

배구 경기 결과를 Microsoft Teams로 자동 알림받는 방법입니다.

## 1. Teams 웹훅 URL 생성

1. Microsoft Teams에서 알림을 받을 채널 선택
2. 채널 이름 옆의 `···` 클릭
3. `커넥터` 또는 `Connectors` 선택
4. `Incoming Webhook` 검색 후 `구성` 클릭
5. 웹훅 이름 입력 (예: "배구 경기 알림")
6. (선택) 이미지 업로드
7. `만들기` 클릭
8. 생성된 웹훅 URL 복사 (예: `https://your-org.webhook.office.com/webhookb2/...`)

## 2. 환경 변수 설정

프로젝트 루트에 `.env` 파일 생성:

```bash
# Microsoft Teams 웹훅 설정
TEAMS_WEBHOOK_URL=https://your-org.webhook.office.com/webhookb2/your-webhook-url
```

## 3. 알림 작동 방식

### 자동 알림
- 배구 크롤링 스크립트 실행 시 자동으로 오늘 경기 결과 확인
- 오늘 경기가 있으면 Teams로 알림 전송
- 크롤링 스케줄: **매일 저녁 10시** (경기 종료 후)

### 수동 알림 테스트
```bash
npm run notify:teams
```

## 4. 알림 메시지 예시

```
🎉 현대캐피탈 경기 결과 🎉

경기 상세 정보
상대팀: 대한항공
결과: 승리
스코어: 3-1
경기 날짜: 12.25

오늘도 열심히 응원했습니다! 🏐

[자세히 보기] 버튼 클릭 시 상세 페이지로 이동
```

## 5. 알림 커스터마이징

`scripts/send-teams-notification.cjs` 파일에서:
- 메시지 색상 변경: `themeColor` 수정
- 메시지 내용 변경: `messageCard` 객체 수정
- 버튼 링크 변경: `potentialAction` 수정

## 6. 문제 해결

### 알림이 오지 않는 경우
1. `.env` 파일이 프로젝트 루트에 있는지 확인
2. `TEAMS_WEBHOOK_URL`이 올바른지 확인
3. 웹훅 URL이 만료되지 않았는지 확인
4. 로그 확인: `[TEAMS]` 태그로 시작하는 로그 확인

### 알림 전송 실패
- Teams 웹훅이 비활성화되었을 수 있음
- Teams에서 웹훅 재생성 후 `.env` 업데이트

## 7. 크론 작업 설정 (선택사항)

매일 저녁 10시에 자동으로 크롤링 및 알림:

### Windows (작업 스케줄러)
```powershell
# 작업 스케줄러 열기
taskschd.msc

# 새 작업 생성:
- 트리거: 매일 22:00
- 작업: node.exe
- 인수: scripts/crawl-volleyball.cjs
- 시작 위치: 프로젝트 경로
```

### Linux/Mac (crontab)
```bash
# crontab 편집
crontab -e

# 매일 저녁 10시에 실행
0 22 * * * cd /path/to/mysport && node scripts/crawl-volleyball.cjs
```

### GitHub Actions (추천)
`.github/workflows/volleyball-notify.yml` 파일 생성 후 자동화 가능
