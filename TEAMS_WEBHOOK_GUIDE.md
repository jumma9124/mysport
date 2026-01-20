# Microsoft Teams 웹훅 URL 생성 방법

## 단계별 가이드

### 1. Teams 채널에서 웹훅 추가

1. Microsoft Teams 앱 실행
2. 알림을 받을 **채널** 선택 (예: "배구 알림" 채널)
3. 채널 이름 옆의 **`···` (점 3개)** 클릭
4. **"커넥터"** 또는 **"Connectors"** 선택

   ![Teams Connectors](https://docs.microsoft.com/ko-kr/microsoftteams/platform/assets/images/connectors/connector-menu.png)

### 2. Incoming Webhook 구성

5. 검색창에 **"Incoming Webhook"** 입력
6. **"Incoming Webhook"** 찾아서 **"구성"** 또는 **"Configure"** 클릭
7. 웹훅 이름 입력 (예: "배구 경기 알림")
8. (선택) 이미지 업로드 (배구 아이콘 등)
9. **"만들기"** 또는 **"Create"** 버튼 클릭

### 3. 웹훅 URL 복사

10. 생성된 URL이 표시됩니다:
    ```
    https://your-company.webhook.office.com/webhookb2/xxxxx-xxxxx-xxxxx/IncomingWebhook/xxxxx/xxxxx
    ```
11. 이 URL 전체를 **복사**합니다
12. **"완료"** 클릭

## 2. 프로젝트에 .env 파일 생성

### Windows에서 .env 파일 만들기

#### 방법 1: 메모장 사용
1. 프로젝트 폴더 열기: `c:\Users\CNXK\Desktop\cursor\mysport`
2. 메모장 열기
3. 다음 내용 입력:
   ```
   TEAMS_WEBHOOK_URL=https://your-company.webhook.office.com/webhookb2/xxxxx
   ```
   (복사한 웹훅 URL로 교체)
4. **"다른 이름으로 저장"** 클릭
5. 파일 이름: `.env` (점 포함!)
6. 파일 형식: **"모든 파일 (*.*)"** 선택
7. 저장 위치: 프로젝트 루트 폴더 (`mysport` 폴더)
8. 저장

#### 방법 2: VS Code 사용
1. VS Code에서 프로젝트 열기
2. 루트 폴더에서 **새 파일** 만들기
3. 파일 이름: `.env`
4. 다음 내용 입력:
   ```
   TEAMS_WEBHOOK_URL=https://your-company.webhook.office.com/webhookb2/xxxxx
   ```
5. 저장 (Ctrl+S)

#### 방법 3: 명령 프롬프트 사용
```bash
cd c:\Users\CNXK\Desktop\cursor\mysport
echo TEAMS_WEBHOOK_URL=https://your-company.webhook.office.com/webhookb2/xxxxx > .env
```

## 3. .env 파일 확인

### 제대로 생성되었는지 확인:
```bash
cd c:\Users\CNXK\Desktop\cursor\mysport
type .env
```

출력 예시:
```
TEAMS_WEBHOOK_URL=https://your-company.webhook.office.com/webhookb2/xxxxx-xxxxx-xxxxx/IncomingWebhook/xxxxx/xxxxx
```

## 4. 테스트

### 알림 테스트:
```bash
npm run notify:teams
```

성공하면 Teams 채널에 테스트 메시지가 도착합니다!

## 주의사항

⚠️ **보안**
- `.env` 파일은 절대 Git에 커밋하지 마세요 (이미 `.gitignore`에 추가됨)
- 웹훅 URL을 공개 저장소에 올리지 마세요
- 웹훅 URL이 노출되면 누구나 이 채널로 메시지를 보낼 수 있습니다

⚠️ **파일 위치**
- `.env` 파일은 반드시 프로젝트 **루트 폴더**에 있어야 합니다
- `package.json`이 있는 폴더와 같은 위치입니다

## 문제 해결

### "파일을 찾을 수 없습니다" 오류
- 파일 이름이 `.env`인지 확인 (`.env.txt`가 아님!)
- Windows에서 파일 확장자가 숨겨져 있을 수 있음

### "웹훅 URL이 유효하지 않습니다" 오류
- URL 전체를 복사했는지 확인
- URL 앞뒤에 공백이 없는지 확인
- `=` 기호 앞뒤에 공백이 없는지 확인

### 알림이 오지 않음
- `.env` 파일 위치 확인
- 웹훅 URL이 만료되지 않았는지 확인
- Teams에서 웹훅이 삭제되지 않았는지 확인
