const fs = require('fs');
const path = require('path');

/**
 * 환경 변수 로드 함수
 */
function loadEnvVars() {
  const envPath = path.join(__dirname, '../.env');
  if (!fs.existsSync(envPath)) {
    return null;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  });

  return envVars;
}

/**
 * Microsoft Teams 웹훅으로 알림 전송
 * @param {Object} matchResult - 경기 결과 정보
 * @param {string} matchResult.team - 팀 이름
 * @param {string} matchResult.opponent - 상대팀
 * @param {string} matchResult.result - 승패 결과 ('win', 'loss')
 * @param {string} matchResult.score - 스코어 (예: "3-1")
 * @param {string} matchResult.date - 경기 날짜
 */
async function sendTeamsNotification(matchResult) {
  console.log('[TEAMS] Preparing to send notification...');

  // 환경 변수 로드 (.env 파일)
  const envVars = loadEnvVars();
  if (!envVars) {
    console.warn('[TEAMS] .env file not found. Skipping Teams notification.');
    return;
  }

  const { TEAMS_WEBHOOK_URL } = envVars;

  // 필수 환경 변수 체크
  if (!TEAMS_WEBHOOK_URL) {
    console.warn('[TEAMS] TEAMS_WEBHOOK_URL not found in .env file. Skipping notification.');
    return;
  }

  // 승패에 따른 색상 및 메시지
  const resultText = matchResult.result === 'win' ? '승리' : '패배';
  const themeColor = matchResult.result === 'win' ? '00FF00' : 'FF0000'; // 승리: 초록색, 패배: 빨간색
  const resultEmoji = matchResult.result === 'win' ? '🎉' : '😢';

  // Teams 메시지 카드 구성
  const messageCard = {
    "@type": "MessageCard",
    "@context": "https://schema.org/extensions",
    "summary": `${matchResult.team} 경기 결과`,
    "themeColor": themeColor,
    "title": `${resultEmoji} ${matchResult.team} 경기 결과 ${resultEmoji}`,
    "sections": [
      {
        "activityTitle": "경기 상세 정보",
        "facts": [
          {
            "name": "상대팀:",
            "value": matchResult.opponent
          },
          {
            "name": "결과:",
            "value": `**${resultText}**`
          },
          {
            "name": "스코어:",
            "value": matchResult.score
          },
          {
            "name": "경기 날짜:",
            "value": matchResult.date
          }
        ],
        "text": "오늘도 열심히 응원했습니다! 🏐"
      }
    ],
    "potentialAction": [
      {
        "@type": "OpenUri",
        "name": "자세히 보기",
        "targets": [
          {
            "os": "default",
            "uri": "https://jumma9124.github.io/mysport/#/volleyball"
          }
        ]
      }
    ]
  };

  // Teams 웹훅으로 전송
  try {
    const fetch = (await import('node-fetch')).default;

    const response = await fetch(TEAMS_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messageCard)
    });

    if (response.ok) {
      const responseText = await response.text();
      console.log('[TEAMS] Notification sent successfully:', responseText);
    } else {
      const errorText = await response.text();
      console.error('[TEAMS] Failed to send notification:', response.status, errorText);
    }

  } catch (error) {
    console.error('[TEAMS] Error sending notification:', error);
  }
}

/**
 * 이메일 알림 전송 (Gmail/Nodemailer)
 * @param {Object} matchResult - 경기 결과 정보
 * @param {string} matchResult.team - 팀 이름
 * @param {string} matchResult.opponent - 상대팀
 * @param {string} matchResult.result - 승패 결과 ('win', 'loss')
 * @param {string} matchResult.score - 스코어 (예: "3-1")
 * @param {string} matchResult.date - 경기 날짜
 */
async function sendEmailNotification(matchResult) {
  console.log('[EMAIL] Preparing to send notification...');

  // 환경 변수 로드 (.env 파일)
  const envVars = loadEnvVars();
  if (!envVars) {
    console.warn('[EMAIL] .env file not found. Skipping email notification.');
    return;
  }

  const { EMAIL_USER, EMAIL_APP_PASSWORD, EMAIL_TO } = envVars;

  // 필수 환경 변수 체크
  if (!EMAIL_USER || !EMAIL_APP_PASSWORD || !EMAIL_TO) {
    console.warn('[EMAIL] Email configuration not found in .env file. Skipping email notification.');
    console.warn('[EMAIL] Required: EMAIL_USER, EMAIL_APP_PASSWORD, EMAIL_TO');
    return;
  }

  try {
    const nodemailer = require('nodemailer');

    // Gmail SMTP 설정
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_APP_PASSWORD
      }
    });

    // 승패에 따른 색상 및 메시지
    const resultText = matchResult.result === 'win' ? '승리' : '패배';
    const themeColor = matchResult.result === 'win' ? '#107c10' : '#d83b01';
    const resultEmoji = matchResult.result === 'win' ? '🎉' : '😢';

    // HTML 이메일 본문
    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
        }
        .header {
            background-color: ${themeColor};
            color: white;
            padding: 20px;
            border-radius: 5px;
            text-align: center;
            margin-bottom: 20px;
        }
        .content {
            background-color: white;
            padding: 20px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        .info-row {
            padding: 10px 0;
            border-bottom: 1px solid #eee;
        }
        .info-label {
            font-weight: bold;
            color: #666;
            display: inline-block;
            width: 100px;
        }
        .info-value {
            color: #333;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #0078d4;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            text-align: center;
        }
        .footer {
            text-align: center;
            color: #666;
            font-size: 12px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${resultEmoji} ${matchResult.team} 경기 결과</h1>
            <h2>${resultText}!</h2>
        </div>

        <div class="content">
            <h3>경기 정보</h3>
            <div class="info-row">
                <span class="info-label">팀:</span>
                <span class="info-value">${matchResult.team}</span>
            </div>
            <div class="info-row">
                <span class="info-label">상대팀:</span>
                <span class="info-value">${matchResult.opponent}</span>
            </div>
            <div class="info-row">
                <span class="info-label">결과:</span>
                <span class="info-value"><strong>${resultText}</strong></span>
            </div>
            <div class="info-row">
                <span class="info-label">스코어:</span>
                <span class="info-value"><strong>${matchResult.score}</strong></span>
            </div>
            <div class="info-row">
                <span class="info-label">경기 날짜:</span>
                <span class="info-value">${matchResult.date}</span>
            </div>
        </div>

        <div style="text-align: center;">
            <a href="https://jumma9124.github.io/mysport/#/volleyball" class="button">자세히 보기</a>
        </div>

        <div class="footer">
            <p>오늘도 열심히 응원했습니다! 🏐</p>
            <p>이 메일은 자동으로 발송되었습니다.</p>
        </div>
    </div>
</body>
</html>
    `;

    // 이메일 전송
    const info = await transporter.sendMail({
      from: `"배구 경기 알림" <${EMAIL_USER}>`,
      to: EMAIL_TO,
      subject: `🏐 ${matchResult.team} 경기 결과 - ${resultText}`,
      html: htmlBody
    });

    console.log('[EMAIL] Notification sent successfully:', info.messageId);

  } catch (error) {
    console.error('[EMAIL] Error sending notification:', error);
  }
}

/**
 * 배구 경기 결과 확인 및 알림 전송
 * 이전 크롤링과 비교하여 새로운 경기 결과가 추가된 경우에만 알림
 */
async function checkAndNotifyVolleyballResult() {
  console.log('[TEAMS] Checking volleyball match result...');

  try {
    // volleyball-detail.json에서 최근 경기 결과 읽기
    const dataPath = path.join(__dirname, '../public/data/volleyball-detail.json');
    const lastNotifiedPath = path.join(__dirname, '../public/data/.last-notified.json');

    if (!fs.existsSync(dataPath)) {
      console.warn('[TEAMS] volleyball-detail.json not found');
      return;
    }

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    // 최근 경기 결과 확인
    if (!data.recentMatches || data.recentMatches.length === 0) {
      console.warn('[TEAMS] No recent matches found');
      return;
    }

    // 가장 최근 경기 (첫 번째 항목)
    const latestMatch = data.recentMatches[0];

    console.log('[TEAMS] Latest match:', {
      opponent: latestMatch.opponent,
      result: latestMatch.result,
      score: latestMatch.score,
      date: latestMatch.date
    });

    // 이전에 알림 보낸 경기 정보 읽기
    let lastNotified = null;
    if (fs.existsSync(lastNotifiedPath)) {
      try {
        lastNotified = JSON.parse(fs.readFileSync(lastNotifiedPath, 'utf8'));
      } catch (err) {
        console.warn('[TEAMS] Failed to read last notified data:', err.message);
      }
    }

    // 고유 식별자 생성 (날짜 + 상대팀 + 스코어)
    const matchId = `${latestMatch.date}_${latestMatch.opponent}_${latestMatch.score}`;
    const lastMatchId = lastNotified?.matchId;

    // 새로운 경기 결과인지 확인
    if (matchId !== lastMatchId) {
      console.log('[NOTIFY] New match result detected. Sending notifications...');
      console.log('[NOTIFY] Previous matchId:', lastMatchId);
      console.log('[NOTIFY] Current matchId:', matchId);

      const matchData = {
        team: data.team || '현대캐피탈',
        opponent: latestMatch.opponent,
        result: latestMatch.result,
        score: latestMatch.score,
        date: latestMatch.date
      };

      // Teams 알림 전송 (설정된 경우)
      await sendTeamsNotification(matchData);

      // 이메일 알림 전송 (설정된 경우)
      await sendEmailNotification(matchData);

      // 알림 보낸 경기 정보 저장
      fs.writeFileSync(lastNotifiedPath, JSON.stringify({
        matchId,
        date: latestMatch.date,
        opponent: latestMatch.opponent,
        score: latestMatch.score,
        notifiedAt: new Date().toISOString()
      }, null, 2), 'utf8');

      console.log('[NOTIFY] All notifications processed and recorded');
    } else {
      console.log('[NOTIFY] This match was already notified. Skipping...');
      console.log('[NOTIFY] MatchId:', matchId);
    }

  } catch (error) {
    console.error('[TEAMS] Error checking match result:', error);
  }
}

// 스크립트 직접 실행 시
if (require.main === module) {
  checkAndNotifyVolleyballResult()
    .then(() => {
      console.log('[TEAMS] Notification check completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('[TEAMS] Notification check failed:', error);
      process.exit(1);
    });
}

module.exports = {
  sendTeamsNotification,
  sendEmailNotification,
  checkAndNotifyVolleyballResult
};
