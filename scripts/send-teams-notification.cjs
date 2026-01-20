const fs = require('fs');
const path = require('path');

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
  const envPath = path.join(__dirname, '../.env');
  if (!fs.existsSync(envPath)) {
    console.warn('[TEAMS] .env file not found. Skipping notification.');
    console.warn('[TEAMS] Please create .env file with TEAMS_WEBHOOK_URL');
    return;
  }

  // .env 파일 파싱
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  });

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
      console.log('[TEAMS] New match result detected. Sending notification...');
      console.log('[TEAMS] Previous matchId:', lastMatchId);
      console.log('[TEAMS] Current matchId:', matchId);

      await sendTeamsNotification({
        team: data.team || '현대캐피탈',
        opponent: latestMatch.opponent,
        result: latestMatch.result,
        score: latestMatch.score,
        date: latestMatch.date
      });

      // 알림 보낸 경기 정보 저장
      fs.writeFileSync(lastNotifiedPath, JSON.stringify({
        matchId,
        date: latestMatch.date,
        opponent: latestMatch.opponent,
        score: latestMatch.score,
        notifiedAt: new Date().toISOString()
      }, null, 2), 'utf8');

      console.log('[TEAMS] Notification sent and recorded');
    } else {
      console.log('[TEAMS] This match was already notified. Skipping...');
      console.log('[TEAMS] MatchId:', matchId);
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

module.exports = { sendTeamsNotification, checkAndNotifyVolleyballResult };
