# Gmail 이메일 알림 설정 가이드

배구 경기 결과를 Gmail로 자동 알림받는 방법입니다.

## 1. Gmail 앱 비밀번호 생성

Gmail에서 외부 앱이 이메일을 전송하려면 앱 비밀번호가 필요합니다.

### 단계별 설정

1. **Google 계정 관리** 페이지로 이동
   - https://myaccount.google.com/ 접속
   - 또는 Gmail → 프로필 사진 클릭 → "Google 계정 관리"

2. **보안** 메뉴 선택 (왼쪽 사이드바)

3. **2단계 인증 활성화** (필수)
   - "2단계 인증" 섹션에서 설정
   - 이미 활성화되어 있으면 다음 단계로

4. **앱 비밀번호 생성**
   - https://myaccount.google.com/apppasswords 직접 접속
   - 또는 "2단계 인증" → 하단의 "앱 비밀번호" 클릭

5. **앱 선택**
   - "앱 선택" 드롭다운: **"기타(맞춤 이름)"** 선택
   - 이름 입력: `배구 알림` (또는 원하는 이름)

6. **비밀번호 생성**
   - **"생성"** 버튼 클릭
   - 16자리 앱 비밀번호가 표시됩니다
   - 예: `abcd efgh ijkl mnop`

7. **비밀번호 복사**
   - 공백 포함해서 전체 복사 (공백은 자동으로 제거됨)
   - 이 비밀번호는 다시 볼 수 없으니 잘 보관하세요

## 2. 프로젝트 .env 파일 설정

프로젝트 루트 폴더에 `.env` 파일을 만들고 다음 내용을 입력하세요:

```bash
# Gmail 이메일 알림 설정
EMAIL_USER=your-email@gmail.com
EMAIL_APP_PASSWORD=abcdefghijklmnop
EMAIL_TO=recipient@gmail.com
```

### 설정 값 설명

- **EMAIL_USER**: Gmail 주소 (이메일을 보내는 계정)
  - 예: `myemail@gmail.com`

- **EMAIL_APP_PASSWORD**: 위에서 생성한 16자리 앱 비밀번호
  - 공백 없이 입력: `abcdefghijklmnop`
  - 또는 공백 포함: `abcd efgh ijkl mnop` (자동으로 제거됨)

- **EMAIL_TO**: 알림을 받을 이메일 주소
  - 자기 자신에게 보내려면 `EMAIL_USER`와 같은 주소 입력
  - 다른 사람에게 보낼 수도 있음

### .env 파일 예시

```bash
# Gmail 이메일 알림 설정
EMAIL_USER=myemail@gmail.com
EMAIL_APP_PASSWORD=abcdefghijklmnop
EMAIL_TO=myemail@gmail.com
```

## 3. 테스트

### 수동 테스트

```bash
npm run notify:teams
```

성공하면 설정한 이메일 주소로 알림이 도착합니다!

### 자동 알림

배구 크롤링 실행 시 자동으로 이메일이 전송됩니다:

```bash
npm run crawl:volleyball
```

## 4. 알림 작동 방식

### 자동 알림
- 배구 크롤링 스크립트 실행 시 자동으로 경기 결과 확인
- **새로운 경기 결과가 추가된 경우에만** 이메일 전송
- 같은 경기는 한 번만 알림 (중복 알림 방지)
- 크롤링 스케줄: **매일 저녁 10시** 권장
  - 경기가 없는 날: 알림 안 보냄
  - 경기가 있는 날: 경기 결과 업데이트 후 한 번만 알림

### 이메일 내용
- 승패에 따라 다른 색상 (승리: 초록색, 패배: 빨간색)
- 경기 정보 (팀, 상대팀, 결과, 스코어, 날짜)
- 상세 페이지 링크 버튼

## 5. 문제 해결

### 이메일이 오지 않는 경우

1. **.env 파일 확인**
   - 파일이 프로젝트 루트에 있는지 확인
   - `EMAIL_USER`, `EMAIL_APP_PASSWORD`, `EMAIL_TO` 모두 설정되어 있는지 확인

2. **앱 비밀번호 확인**
   - 16자리가 맞는지 확인
   - 공백 없이 입력했는지 확인
   - 일반 Gmail 비밀번호가 아닌 앱 비밀번호인지 확인

3. **2단계 인증 확인**
   - Google 계정에서 2단계 인증이 활성화되어 있는지 확인
   - 2단계 인증 없이는 앱 비밀번호를 생성할 수 없습니다

4. **로그 확인**
   ```bash
   npm run notify:teams
   ```
   - `[EMAIL]` 태그로 시작하는 로그 확인
   - 에러 메시지 확인

### "Invalid login" 에러

- 앱 비밀번호가 잘못되었습니다
- 새로운 앱 비밀번호를 생성하고 다시 시도하세요

### "Authentication failed" 에러

- 2단계 인증이 활성화되어 있지 않습니다
- Google 계정에서 2단계 인증을 활성화하세요

### 스팸 폴더 확인

- 첫 이메일은 스팸 폴더로 갈 수 있습니다
- 스팸함 확인 후 "스팸 아님"으로 표시

### 테스트용으로 같은 경기 다시 알림받기

```bash
# Windows
del public\data\.last-notified.json
npm run notify:teams

# Mac/Linux
rm public/data/.last-notified.json
npm run notify:teams
```

## 6. 보안 모범 사례

- ✅ `.env` 파일은 절대 Git에 커밋하지 마세요 (이미 `.gitignore`에 포함됨)
- ✅ 앱 비밀번호를 공개 저장소에 올리지 마세요
- ✅ 앱 비밀번호가 노출되면 즉시 삭제하고 새로 생성하세요
  - https://myaccount.google.com/apppasswords 에서 삭제 가능

## 7. 여러 사람에게 알림 보내기

`EMAIL_TO`에 여러 이메일 주소를 쉼표로 구분해서 입력:

```bash
EMAIL_TO=email1@gmail.com,email2@gmail.com,email3@gmail.com
```

## 8. Outlook/Hotmail 사용하기

Gmail 대신 Outlook을 사용하려면 `.env` 파일을 다음과 같이 수정:

```bash
EMAIL_USER=your-email@outlook.com
EMAIL_APP_PASSWORD=your-outlook-password
EMAIL_TO=recipient@example.com
```

그리고 `scripts/send-teams-notification.cjs` 파일에서 `service` 변경:

```javascript
const transporter = nodemailer.createTransport({
  service: 'hotmail',  // 'gmail' 대신 'hotmail'
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_APP_PASSWORD
  }
});
```

## 9. 참고 자료

- [Google 앱 비밀번호 만들기](https://support.google.com/accounts/answer/185833)
- [2단계 인증 설정](https://support.google.com/accounts/answer/185839)
- [Nodemailer 문서](https://nodemailer.com/)
