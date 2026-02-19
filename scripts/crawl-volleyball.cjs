const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

/**
 * 네이버 스포츠 V리그 실시간 데이터 크롤링 (Puppeteer 사용)
 * 현대캐피탈 스카이워커스 팀 정보 수집
 */

const TEAM_NAME = '현대캐피탈';
const TEAM_FULL_NAME = '현대캐피탈 스카이워커스';
const TEAM_CODE = '1005';
const DATA_DIR = path.join(__dirname, '../public/data');

// 네이버 스포츠 모바일 URL
const NAVER_URLS = {
  standings: 'https://m.sports.naver.com/volleyball/record/kovo?seasonCode=022&tab=teamRank',
  standingsWomen: 'https://m.sports.naver.com/volleyball/record/index?category=wkovo',
  schedule: (date) => `https://m.sports.naver.com/volleyball/schedule/index?category=kovo&date=${date}`, // teamCode 제거
};

const isCI = !!process.env.CI;
const PUPPETEER_ARGS = isCI
  ? ['--no-sandbox', '--disable-setuid-sandbox']
  : [];

async function crawlStandings() {
  let browser;
  try {
    console.log('Launching browser for standings...');
    browser = await puppeteer.launch({
      headless: true,
      args: PUPPETEER_ARGS
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15');

    console.log('Navigating to Naver Sports...');
    await page.goto(NAVER_URLS.standings, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // React가 렌더링될 때까지 대기
    await page.waitForSelector('.TableBody_list__P8yRn', { timeout: 10000 });

    // 추가 대기 시간 (React 렌더링 완료 보장)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // JavaScript로 페이지 내에서 데이터 추출
    const standings = await page.evaluate(() => {
      const rows = document.querySelectorAll('.TableBody_item__eCenH');
      const result = [];

      rows.forEach((row) => {
        // 순위
        const rankEl = row.querySelector('.TeamInfo_ranking__MqHpq');
        const rank = rankEl ? parseInt(rankEl.textContent.trim()) : 0;

        // 팀명
        const teamEl = row.querySelector('.TeamInfo_team_name__dni7F');
        const teamName = teamEl ? teamEl.textContent.trim() : '';

        // 모든 텍스트 요소 직접 가져오기
        const textElements = row.querySelectorAll('.TextInfo_text__ysEqh');

        // blind 클래스가 없는 실제 데이터만 추출
        const values = [];
        textElements.forEach(el => {
          const text = el.textContent.trim();
          // blind span 제외하고 숫자만 추출
          const numMatch = text.match(/\d+\.?\d*/);
          if (numMatch) {
            values.push(numMatch[0]);
          }
        });

        // values 배열: [승점, 경기, 승, 패, 세트득실률, 점수득실률, ...]
        const points = values[0] ? parseInt(values[0]) : 0;
        const wins = values[2] ? parseInt(values[2]) : 0;
        const losses = values[3] ? parseInt(values[3]) : 0;
        const setRate = values[4] ? parseFloat(values[4]) : 0;

        if (!isNaN(rank) && teamName) {
          result.push({
            name: teamName,
            wins,
            losses,
            setWins: 0,
            setLosses: 0,
            setRate,
            rank,
            points,
          });
        }
      });

      return result;
    });

    await browser.close();

    if (standings.length === 0) {
      console.warn('No standings data found');
      return null;
    }

    console.log(`✓ Found ${standings.length} teams in standings`);
    return standings;

  } catch (error) {
    console.error('Failed to crawl standings:', error.message);
    return null;
  }
}

async function crawlStandingsWomen() {
  let browser;
  try {
    console.log('Launching browser for women\'s standings...');
    browser = await puppeteer.launch({
      headless: true,
      args: PUPPETEER_ARGS
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15');

    console.log('Navigating to Naver Sports Women\'s Division...');
    await page.goto(NAVER_URLS.standingsWomen, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // React가 렌더링될 때까지 대기
    await page.waitForSelector('.TableBody_list__P8yRn', { timeout: 10000 });

    // 추가 대기 시간 (React 렌더링 완료 보장)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // JavaScript로 페이지 내에서 데이터 추출
    const standings = await page.evaluate(() => {
      const rows = document.querySelectorAll('.TableBody_item__eCenH');
      const result = [];

      rows.forEach((row) => {
        // 순위
        const rankEl = row.querySelector('.TeamInfo_ranking__MqHpq');
        const rank = rankEl ? parseInt(rankEl.textContent.trim()) : 0;

        // 팀명
        const teamEl = row.querySelector('.TeamInfo_team_name__dni7F');
        const teamName = teamEl ? teamEl.textContent.trim() : '';

        // 모든 텍스트 요소 직접 가져오기
        const textElements = row.querySelectorAll('.TextInfo_text__ysEqh');

        // blind 클래스가 없는 실제 데이터만 추출
        const values = [];
        textElements.forEach(el => {
          const text = el.textContent.trim();
          // blind span 제외하고 숫자만 추출
          const numMatch = text.match(/\d+\.?\d*/);
          if (numMatch) {
            values.push(numMatch[0]);
          }
        });

        // values 배열: [승점, 경기, 승, 패, 세트득실률, 점수득실률, ...]
        const points = values[0] ? parseInt(values[0]) : 0;
        const wins = values[2] ? parseInt(values[2]) : 0;
        const losses = values[3] ? parseInt(values[3]) : 0;
        const setRate = values[4] ? parseFloat(values[4]) : 0;

        if (!isNaN(rank) && teamName) {
          result.push({
            name: teamName,
            wins,
            losses,
            setWins: 0,
            setLosses: 0,
            setRate,
            rank,
            points,
          });
        }
      });

      return result;
    });

    await browser.close();

    if (standings.length === 0) {
      console.warn('No women\'s standings data found');
      return null;
    }

    console.log(`✓ Found ${standings.length} teams in women's standings`);
    return standings;

  } catch (error) {
    console.error('Failed to crawl women\'s standings:', error.message);
    return null;
  }
}

async function crawlRecentMatches() {
  let browser;
  try {
    console.log('Fetching recent matches with Puppeteer...');
    browser = await puppeteer.launch({
      headless: true,
      args: PUPPETEER_ARGS
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15');

    const matches = [];
    const now = new Date();
    console.log(`[CRAWL] Starting recent matches crawl at ${now.toISOString()}`);

    // 최근 30일간 경기 확인 (최대 3개까지)
    for (let i = 0; i < 30 && matches.length < 3; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      console.log(`[CRAWL] Checking date ${i} days ago: ${dateStr}`);

      const url = NAVER_URLS.schedule(dateStr);
      console.log(`[CRAWL] Fetching URL: ${url}`);
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      // React 렌더링 대기
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 페이지 구조 확인 및 URL 검증
      const pageInfo = await page.evaluate((requestedDate) => {
        const bodyText = document.body ? document.body.textContent : '';
        const hasSchedule = bodyText.includes('경기') || bodyText.includes('스케줄');
        const itemCount = document.querySelectorAll('.ScheduleAllGameListItem_item_box__1HDdX').length;
        const actualUrl = window.location.href;

        // URL에서 실제 날짜 추출
        const dateMatch = actualUrl.match(/date=(\d{4}-\d{2}-\d{2})/);
        const actualDate = dateMatch ? dateMatch[1] : null;

        return {
          hasSchedule,
          itemCount,
          title: document.title,
          url: actualUrl,
          requestedDate,
          actualDate,
          dateMatches: actualDate === requestedDate
        };
      }, dateStr);
      console.log(`[CRAWL] Recent matches - Page info: ${JSON.stringify(pageInfo)}`);

      // 날짜가 일치하지 않으면 건너뛰기 (Naver가 다른 날짜로 리다이렉트함)
      if (!pageInfo.dateMatches) {
        console.log(`[CRAWL] Skipping date ${dateStr} - Naver redirected to ${pageInfo.actualDate}`);
        continue;
      }

      const dayMatchesResult = await page.evaluate((teamName, targetDate) => {
        // 날짜 헤더 찾기 (예: "1월 18일")
        const dateParts = targetDate.split('-'); // "2026-01-18" -> ["2026", "01", "18"]
        const month = parseInt(dateParts[1]); // "01" -> 1
        const day = parseInt(dateParts[2]); // "18" -> 18
        const datePattern = `${month}월 ${day}일`; // "1월 18일"

        // 모든 날짜 그룹 찾기
        const dateGroups = document.querySelectorAll('[class*="ScheduleLeagueType_match_list_group"]');

        let targetGroup = null;
        for (const group of dateGroups) {
          const titleEl = group.querySelector('[class*="ScheduleLeagueType_title"]');
          if (titleEl && titleEl.textContent.includes(datePattern)) {
            targetGroup = group;
            break;
          }
        }

        const debugInfo = {
          targetDate,
          datePattern,
          foundGroup: !!targetGroup,
          totalGroups: dateGroups.length,
          items: []
        };

        const results = [];

        // 해당 날짜 그룹에서만 경기 추출
        if (targetGroup) {
          const items = targetGroup.querySelectorAll('[class*="MatchBox_match_item"]');

          items.forEach((item, idx) => {
            const statusEl = item.querySelector('[class*="status"]');
            const status = statusEl ? statusEl.textContent.trim() : null;

            // 종료된 경기만 처리
            if (status === '종료') {
              const teamItems = item.querySelectorAll('[class*="team_item"]');

              if (teamItems.length >= 2) {
                const team1NameEl = teamItems[0].querySelector('[class*="team_name"]');
                const team2NameEl = teamItems[1].querySelector('[class*="team_name"]');

                let team1Name = team1NameEl ? team1NameEl.textContent.trim() : '';
                let team2Name = team2NameEl ? team2NameEl.textContent.trim() : '';

                // "홈" 텍스트 제거
                team1Name = team1Name.replace('홈', '');
                team2Name = team2Name.replace('홈', '');

                // 스코어 추출
                const team1ScoreEl = teamItems[0].querySelector('[class*="score"]');
                const team2ScoreEl = teamItems[1].querySelector('[class*="score"]');

                const team1ScoreText = team1ScoreEl ? team1ScoreEl.textContent.trim() : '';
                const team2ScoreText = team2ScoreEl ? team2ScoreEl.textContent.trim() : '';

                // 숫자만 추출
                const team1ScoreMatch = team1ScoreText.match(/\d+/);
                const team2ScoreMatch = team2ScoreText.match(/\d+/);

                const team1Score = team1ScoreMatch ? parseInt(team1ScoreMatch[0]) : 0;
                const team2Score = team2ScoreMatch ? parseInt(team2ScoreMatch[0]) : 0;

                debugInfo.items.push({
                  idx: idx + 1,
                  status,
                  team1Name,
                  team2Name,
                  team1Score,
                  team2Score,
                  matchesTeam: team1Name.includes(teamName) || team2Name.includes(teamName)
                });

                // 우리 팀이 포함된 경기인지 확인
                if (team1Name.includes(teamName) || team2Name.includes(teamName)) {
                  const isTeam1 = team1Name.includes(teamName);
                  const opponent = isTeam1 ? team2Name : team1Name;
                  const ourScore = isTeam1 ? team1Score : team2Score;
                  const opponentScore = isTeam1 ? team2Score : team1Score;

                  if (!isNaN(ourScore) && !isNaN(opponentScore)) {
                    results.push({
                      opponent,
                      ourScore,
                      opponentScore,
                      result: ourScore > opponentScore ? 'win' : 'loss',
                      sets: []
                    });
                  }
                }
              }
            }
          });
        }

        return { results, debugInfo };
      }, TEAM_NAME, dateStr);

      const dayMatches = dayMatchesResult?.results || [];
      console.log(`[CRAWL] Date ${dateStr}: Debug info: ${JSON.stringify(dayMatchesResult?.debugInfo)}`);
      console.log(`[CRAWL] Date ${dateStr}: Found ${dayMatches.length} matches`);

      // 여러 경기가 있으면 마지막 경기를 사용 (가장 최신 경기)
      // 네이버가 전체 시즌 데이터를 반환하므로, 그 날짜의 실제 경기는 리스트의 마지막에 위치
      if (dayMatches && dayMatches.length > 0) {
        const match = dayMatches[dayMatches.length - 1]; // 마지막 경기 사용
        if (match && match.opponent) {
          console.log(`[CRAWL] Adding match: ${dateStr} vs ${match.opponent}, result: ${match.result}, score: ${match.ourScore}-${match.opponentScore}`);
          if (dayMatches.length > 1) {
            console.log(`[CRAWL] Warning: Found ${dayMatches.length} matches on same date, using the last one (most recent)`);
          }
          matches.push({
            date: dateStr, // ISO 형식으로 저장 (예: "2026-01-04")
            opponent: match.opponent,
            venue: '천안유관순체육관',
            result: match.result,
            score: `${match.ourScore}-${match.opponentScore}`,
            sets: match.sets || []
          });
        } else {
          console.warn(`[CRAWL] Skipping invalid match: ${JSON.stringify(match)}`);
        }
      }
    }

    await browser.close();

    if (matches.length === 0) {
      console.warn('No recent matches found after checking 30 days');
      return []; // null 대신 빈 배열 반환
    }

    console.log(`✓ Found ${matches.length} recent matches`);
    // 최신순으로 정렬 (날짜 내림차순)
    matches.sort((a, b) => new Date(b.date) - new Date(a.date));
    const result = matches.slice(0, 3); // 최대 3개 반환
    console.log(`✓ Returning ${result.length} recent matches: ${JSON.stringify(result)}`);
    return result;

  } catch (error) {
    if (browser) await browser.close();
    console.error('Failed to crawl recent matches:', error.message);
    return null;
  }
}

async function crawlUpcomingMatch() {
  let browser;
  try {
    console.log('Fetching upcoming match with Puppeteer...');
    browser = await puppeteer.launch({
      headless: true,
      args: PUPPETEER_ARGS
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15');

    const now = new Date();
    console.log(`[CRAWL] Starting upcoming match crawl at ${now.toISOString()}`);

    // 앞으로 30일간 경기 확인 (오늘 제외, 내일부터)
    for (let i = 1; i <= 30; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      console.log(`[CRAWL] Checking upcoming date ${i} days ahead: ${dateStr}`);

      const url = NAVER_URLS.schedule(dateStr);
      console.log(`[CRAWL] Fetching URL: ${url}`);
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      // React 렌더링 대기
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 페이지 구조 확인 및 URL 검증
      const pageInfo = await page.evaluate((requestedDate) => {
        const bodyText = document.body ? document.body.textContent : '';
        const hasSchedule = bodyText.includes('경기') || bodyText.includes('스케줄');
        const itemCount = document.querySelectorAll('.ScheduleAllGameListItem_item_box__1HDdX').length;
        const actualUrl = window.location.href;

        // URL에서 실제 날짜 추출
        const dateMatch = actualUrl.match(/date=(\d{4}-\d{2}-\d{2})/);
        const actualDate = dateMatch ? dateMatch[1] : null;

        return {
          hasSchedule,
          itemCount,
          title: document.title,
          url: actualUrl,
          requestedDate,
          actualDate,
          dateMatches: actualDate === requestedDate
        };
      }, dateStr);
      console.log(`[CRAWL] Upcoming match - Page info: ${JSON.stringify(pageInfo)}`);

      // 날짜가 일치하지 않으면 건너뛰기 (Naver가 다른 날짜로 리다이렉트함)
      if (!pageInfo.dateMatches) {
        console.log(`[CRAWL] Skipping date ${dateStr} - Naver redirected to ${pageInfo.actualDate}`);
        continue;
      }

      const upcomingMatchResult = await page.evaluate((teamName, targetDate) => {
        // 날짜 헤더 찾기 (예: "1월 22일")
        const dateParts = targetDate.split('-'); // "2026-01-22" -> ["2026", "01", "22"]
        const month = parseInt(dateParts[1]); // "01" -> 1
        const day = parseInt(dateParts[2]); // "22" -> 22
        const datePattern = `${month}월 ${day}일`; // "1월 22일"

        // 모든 날짜 그룹 찾기
        const dateGroups = document.querySelectorAll('[class*="ScheduleLeagueType_match_list_group"]');

        let targetGroup = null;
        for (const group of dateGroups) {
          const titleEl = group.querySelector('[class*="ScheduleLeagueType_title"]');
          if (titleEl && titleEl.textContent.includes(datePattern)) {
            targetGroup = group;
            break;
          }
        }

        const debugInfo = {
          targetDate,
          datePattern,
          foundGroup: !!targetGroup,
          totalGroups: dateGroups.length,
          items: []
        };

        // 해당 날짜 그룹에서만 경기 추출
        if (targetGroup) {
          const items = targetGroup.querySelectorAll('[class*="MatchBox_match_item"]');

          for (let item of items) {
            const statusEl = item.querySelector('[class*="status"]');
            const status = statusEl ? statusEl.textContent.trim() : null;

            const teamItems = item.querySelectorAll('[class*="team_item"]');

            if (teamItems.length >= 2) {
              const team1NameEl = teamItems[0].querySelector('[class*="team_name"]');
              const team2NameEl = teamItems[1].querySelector('[class*="team_name"]');

              let team1Name = team1NameEl ? team1NameEl.textContent.trim() : '';
              let team2Name = team2NameEl ? team2NameEl.textContent.trim() : '';

              // "홈" 텍스트 제거
              team1Name = team1Name.replace('홈', '');
              team2Name = team2Name.replace('홈', '');

              debugInfo.items.push({
                status,
                team1Name,
                team2Name,
                matchesTeam: team1Name.includes(teamName) || team2Name.includes(teamName)
              });

              // 종료되지 않은 경기이고, 우리 팀이 포함된 경기
              if (status !== '종료' && (team1Name.includes(teamName) || team2Name.includes(teamName))) {
                const isTeam1 = team1Name.includes(teamName);
                const opponent = isTeam1 ? team2Name : team1Name;
                const venue = isTeam1 ? '천안유관순체육관' : '원정';

                const timeEl = item.querySelector('[class*="time"]');
                let timeText = timeEl ? timeEl.textContent.trim() : '';

                // "경기 시간19:00" -> "19:00" 형식으로 변환
                timeText = timeText.replace(/^경기\s*시간\s*/i, '').trim();

                return { match: {
                  date: targetDate, // ISO 형식으로 저장
                  time: timeText,
                  opponent,
                  venue
                }, debugInfo };
              }
            }
          }
        }

        return { match: null, debugInfo };
      }, TEAM_NAME, dateStr);

      const upcomingMatch = upcomingMatchResult?.match || null;
      console.log(`[CRAWL] Date ${dateStr}: Debug info: ${JSON.stringify(upcomingMatchResult?.debugInfo)}`);
      console.log(`[CRAWL] Date ${dateStr}: Found ${upcomingMatch ? '1' : '0'} upcoming matches`);
      if (upcomingMatch) {
        console.log(`[CRAWL] Upcoming match details: ${JSON.stringify(upcomingMatch)}`);
        await browser.close();
        console.log(`✓ Found upcoming match: ${JSON.stringify(upcomingMatch)}`);
        return upcomingMatch;
      }
    }

    await browser.close();
    console.warn('No upcoming match found in next 30 days');
    return null; // upcomingMatch는 null 유지

  } catch (error) {
    if (browser) await browser.close();
    console.error('Failed to crawl upcoming match:', error.message);
    return null;
  }
}

function getFallbackData() {
  console.log('Using fallback data...');

  return {
    standings: [
      {
        name: 'OK저축은행',
        wins: 15,
        losses: 4,
        setWins: 47,
        setLosses: 18,
        setRate: 2.611,
        rank: 1,
        points: 49,
      },
      {
        name: TEAM_FULL_NAME,
        wins: 12,
        losses: 8,
        setWins: 43,
        setLosses: 31,
        setRate: 1.387,
        rank: 2,
        points: 44,
      },
      {
        name: '삼성화재',
        wins: 11,
        losses: 8,
        setWins: 38,
        setLosses: 32,
        setRate: 1.188,
        rank: 3,
        points: 41,
      },
      {
        name: '한국전력',
        wins: 10,
        losses: 9,
        setWins: 37,
        setLosses: 33,
        setRate: 1.121,
        rank: 4,
        points: 39,
      },
      {
        name: 'KB손해보험',
        wins: 9,
        losses: 10,
        setWins: 35,
        setLosses: 37,
        setRate: 0.946,
        rank: 5,
        points: 37,
      },
      {
        name: '우리카드',
        wins: 7,
        losses: 12,
        setWins: 30,
        setLosses: 41,
        setRate: 0.732,
        rank: 6,
        points: 33,
      },
      {
        name: '삼성화재블루팡스',
        wins: 4,
        losses: 15,
        setWins: 21,
        setLosses: 49,
        setRate: 0.429,
        rank: 7,
        points: 27,
      },
    ],
    recentMatches: [],
    upcomingMatch: null,
  };
}

async function crawlVolleyballData() {
  try {
    console.log('Starting volleyball data crawl...');

    // 실시간 데이터 크롤링 시도 (여자부 순위 추가)
    const [standings, standingsWomen, recentMatches, upcomingMatch] = await Promise.all([
      crawlStandings(),
      crawlStandingsWomen(),
      crawlRecentMatches(),
      crawlUpcomingMatch(),
    ]);

    console.log(`[RESULT] Standings: ${standings ? 'SUCCESS (' + standings.length + ' teams)' : 'FAILED'}`);
    console.log(`[RESULT] Women's Standings: ${standingsWomen ? 'SUCCESS (' + standingsWomen.length + ' teams)' : 'FAILED'}`);
    console.log(`[RESULT] Recent matches: ${recentMatches ? 'SUCCESS (' + recentMatches.length + ' matches)' : 'FAILED'}`);
    console.log(`[RESULT] Upcoming match: ${upcomingMatch ? 'SUCCESS (' + JSON.stringify(upcomingMatch) + ')' : 'FAILED'}`);

    // 크롤링 실패 시 폴백 데이터 사용
    const fallbackData = getFallbackData();
    const standingsData = standings || fallbackData.standings;
    const standingsWomenData = standingsWomen || [];
    // recentMatches 처리: null이면 빈 배열, 배열이고 길이가 0보다 크면 사용
    let matchesData = [];
    if (recentMatches) {
      if (Array.isArray(recentMatches) && recentMatches.length > 0) {
        matchesData = recentMatches;
        console.log(`[FINAL] Using CRAWLED recent matches: ${matchesData.length} matches`);
      } else {
        console.warn(`[FINAL] recentMatches is not a valid array or is empty: ${JSON.stringify(recentMatches)}`);
        matchesData = [];
      }
    } else {
      console.warn(`[FINAL] recentMatches is null, using empty array`);
      matchesData = [];
    }
    const upcomingMatchData = upcomingMatch || fallbackData.upcomingMatch;

    console.log(`[FINAL] Using standings: ${standings ? 'CRAWLED (' + standings.length + ' teams)' : 'FALLBACK'}`);
    console.log(`[FINAL] Using recent matches: ${recentMatches && recentMatches.length > 0 ? 'CRAWLED (' + recentMatches.length + ' matches)' : 'EMPTY/FALLBACK'}`);
    console.log(`[FINAL] Recent matches data: ${JSON.stringify(matchesData)}`);
    console.log(`[FINAL] Using upcoming match: ${upcomingMatch ? 'CRAWLED' : 'FALLBACK'} - ${upcomingMatchData ? JSON.stringify(upcomingMatchData) : 'null'}`);

    // volleyball-detail.json 생성
    const volleyballDetail = {
      leagueStandings: standingsData || [],
      leagueStandingsWomen: standingsWomenData || [],
      recentMatches: matchesData || [],
      upcomingMatch: upcomingMatchData || null,
    };

    console.log(`[SAVE] Saving volleyball-detail.json with:`);
    console.log(`  - leagueStandings: ${volleyballDetail.leagueStandings.length} teams`);
    console.log(`  - leagueStandingsWomen: ${volleyballDetail.leagueStandingsWomen.length} teams`);
    console.log(`  - recentMatches: ${volleyballDetail.recentMatches.length} matches`);
    if (volleyballDetail.recentMatches.length > 0) {
      console.log(`  - recentMatches data: ${JSON.stringify(volleyballDetail.recentMatches)}`);
    }
    console.log(`  - upcomingMatch: ${volleyballDetail.upcomingMatch ? JSON.stringify(volleyballDetail.upcomingMatch) : 'null'}`);

    // sports.json 업데이트
    const sportsJsonPath = path.join(DATA_DIR, 'sports.json');
    let sportsData = {};

    if (fs.existsSync(sportsJsonPath)) {
      sportsData = JSON.parse(fs.readFileSync(sportsJsonPath, 'utf8'));
    }

    const currentTeam = standingsData.find(team => team.name.includes(TEAM_NAME));

    if (currentTeam) {
      sportsData.volleyball = {
        team: TEAM_FULL_NAME,
        currentRank: currentTeam.rank,
        record: {
          wins: currentTeam.wins,
          losses: currentTeam.losses,
          points: currentTeam.points,
          setRate: currentTeam.setRate,
        },
        recentMatches: matchesData,
        upcomingMatch: upcomingMatchData,
      };
    }

    // 파일 저장
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    fs.writeFileSync(
      path.join(DATA_DIR, 'volleyball-detail.json'),
      JSON.stringify(volleyballDetail, null, 2),
      'utf8'
    );

    fs.writeFileSync(
      sportsJsonPath,
      JSON.stringify(sportsData, null, 2),
      'utf8'
    );

    console.log('✓ Volleyball data updated successfully');
    if (currentTeam) {
      console.log(`  - Rank: ${currentTeam.rank}`);
      console.log(`  - Record: ${currentTeam.wins}W-${currentTeam.losses}L`);
    }
    console.log(`  - Recent matches: ${matchesData.length}`);

    // Teams 알림 전송 (경기 결과가 있는 경우)
    try {
      const { checkAndNotifyVolleyballResult } = require('./send-teams-notification.cjs');
      console.log('\n[NOTIFICATION] Checking if notification should be sent...');
      await checkAndNotifyVolleyballResult();
    } catch (notifyError) {
      console.warn('[NOTIFICATION] Failed to send Teams notification:', notifyError.message);
      // 알림 실패는 크롤링 전체를 실패로 처리하지 않음
    }

  } catch (error) {
    console.error('Failed to crawl volleyball data:', error);
    process.exit(1);
  }
}

// 스크립트 직접 실행 시
if (require.main === module) {
  crawlVolleyballData();
}

module.exports = { crawlVolleyballData };
