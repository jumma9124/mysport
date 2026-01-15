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
  schedule: (date) => `https://m.sports.naver.com/volleyball/schedule/index?category=kovo&date=${date}&teamCode=${TEAM_CODE}`,
};

async function crawlStandings() {
  let browser;
  try {
    console.log('Launching browser for standings...');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
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

async function crawlRecentMatches() {
  let browser;
  try {
    console.log('Fetching recent matches with Puppeteer...');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15');

    const matches = [];
    const now = new Date();

    // 최근 30일간 경기 확인
    for (let i = 0; i < 30 && matches.length < 2; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const url = NAVER_URLS.schedule(dateStr);
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      // React 렌더링 대기
      await new Promise(resolve => setTimeout(resolve, 1500));

      const dayMatches = await page.evaluate((teamName) => {
        const items = document.querySelectorAll('.ScheduleAllGameListItem_item_box__1HDdX');
        const results = [];

        items.forEach((item) => {
          const status = item.querySelector('.ScheduleAllGameListItem_game_state__3lmN2')?.textContent.trim();

          if (status === '경기종료') {
            const teams = item.querySelectorAll('.ScheduleAllGameListItem_team__R-bjK');
            const homeTeam = teams[0]?.querySelector('.ScheduleAllGameListItem_name__3LNRT')?.textContent.trim();
            const awayTeam = teams[1]?.querySelector('.ScheduleAllGameListItem_name__3LNRT')?.textContent.trim();

            if (homeTeam && awayTeam && (homeTeam.includes(teamName) || awayTeam.includes(teamName))) {
              const homeScore = parseInt(teams[0]?.querySelector('.ScheduleAllGameListItem_score__3Xzs7')?.textContent.trim());
              const awayScore = parseInt(teams[1]?.querySelector('.ScheduleAllGameListItem_score__3Xzs7')?.textContent.trim());

              const isHome = homeTeam.includes(teamName);
              const opponent = isHome ? awayTeam : homeTeam;
              const ourScore = isHome ? homeScore : awayScore;
              const opponentScore = isHome ? awayScore : homeScore;

              // 세트 스코어 파싱
              const setsEl = item.querySelectorAll('.ScheduleGameListItem_score__18lAy');
              const sets = [];
              setsEl.forEach((setEl, idx) => {
                const scores = setEl.querySelectorAll('span');
                if (scores.length >= 2) {
                  const homeSetScore = parseInt(scores[0].textContent.trim());
                  const awaySetScore = parseInt(scores[1].textContent.trim());
                  sets.push({
                    setNumber: idx + 1,
                    ourScore: isHome ? homeSetScore : awaySetScore,
                    opponentScore: isHome ? awaySetScore : homeSetScore
                  });
                }
              });

              if (!isNaN(ourScore) && !isNaN(opponentScore)) {
                results.push({
                  opponent,
                  ourScore,
                  opponentScore,
                  result: ourScore > opponentScore ? 'win' : 'loss',
                  sets
                });
              }
            }
          }
        });

        return results;
      }, TEAM_NAME);

      if (dayMatches.length > 0) {
        const matchDate = dateStr.substring(2).replace(/-/g, '.');
        dayMatches.forEach(match => {
          matches.push({
            date: matchDate,
            opponent: match.opponent,
            venue: '천안유관순체육관',
            result: match.result,
            score: `${match.ourScore}-${match.opponentScore}`,
            sets: match.sets
          });
        });
      }
    }

    await browser.close();

    if (matches.length === 0) {
      console.warn('No recent matches found');
      return null;
    }

    console.log(`✓ Found ${matches.length} recent matches`);
    return matches.slice(0, 2);

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
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15');

    const now = new Date();

    // 앞으로 30일간 경기 확인
    for (let i = 0; i < 30; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      const url = NAVER_URLS.schedule(dateStr);
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      // React 렌더링 대기
      await new Promise(resolve => setTimeout(resolve, 1500));

      const upcomingMatch = await page.evaluate((teamName, matchDate) => {
        const items = document.querySelectorAll('.ScheduleAllGameListItem_item_box__1HDdX');

        for (let item of items) {
          const status = item.querySelector('.ScheduleAllGameListItem_game_state__3lmN2')?.textContent.trim();

          if (status !== '경기종료') {
            const teams = item.querySelectorAll('.ScheduleAllGameListItem_team__R-bjK');
            const homeTeam = teams[0]?.querySelector('.ScheduleAllGameListItem_name__3LNRT')?.textContent.trim();
            const awayTeam = teams[1]?.querySelector('.ScheduleAllGameListItem_name__3LNRT')?.textContent.trim();

            if (homeTeam && awayTeam && (homeTeam.includes(teamName) || awayTeam.includes(teamName))) {
              const isHome = homeTeam.includes(teamName);
              const opponent = isHome ? awayTeam : homeTeam;
              const venue = isHome ? '천안유관순체육관' : '원정';
              const timeText = item.querySelector('.ScheduleAllGameListItem_time__3xyqM')?.textContent.trim() || '';

              return {
                date: `${matchDate} ${timeText}`,
                opponent,
                venue
              };
            }
          }
        }

        return null;
      }, TEAM_NAME, dateStr.substring(2).replace(/-/g, '.'));

      if (upcomingMatch) {
        await browser.close();
        console.log('✓ Found upcoming match');
        return upcomingMatch;
      }
    }

    await browser.close();
    console.warn('No upcoming match found');
    return null;

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
      },
      {
        name: TEAM_FULL_NAME,
        wins: 12,
        losses: 8,
        setWins: 43,
        setLosses: 31,
        setRate: 1.387,
        rank: 2,
      },
      {
        name: '삼성화재',
        wins: 11,
        losses: 8,
        setWins: 38,
        setLosses: 32,
        setRate: 1.188,
        rank: 3,
      },
      {
        name: '한국전력',
        wins: 10,
        losses: 9,
        setWins: 37,
        setLosses: 33,
        setRate: 1.121,
        rank: 4,
      },
      {
        name: 'KB손해보험',
        wins: 9,
        losses: 10,
        setWins: 35,
        setLosses: 37,
        setRate: 0.946,
        rank: 5,
      },
      {
        name: '우리카드',
        wins: 7,
        losses: 12,
        setWins: 30,
        setLosses: 41,
        setRate: 0.732,
        rank: 6,
      },
      {
        name: '삼성화재블루팡스',
        wins: 4,
        losses: 15,
        setWins: 21,
        setLosses: 49,
        setRate: 0.429,
        rank: 7,
      },
    ],
    recentMatches: [
      {
        date: '26.01.14',
        opponent: '삼성화재',
        venue: '천안유관순체육관',
        result: 'win',
        score: '3-0',
        sets: [
          { setNumber: 1, ourScore: 25, opponentScore: 20 },
          { setNumber: 2, ourScore: 25, opponentScore: 22 },
          { setNumber: 3, ourScore: 25, opponentScore: 18 },
        ],
      },
      {
        date: '26.01.09',
        opponent: 'OK저축은행',
        venue: '천안유관순체육관',
        result: 'loss',
        score: '0-3',
        sets: [
          { setNumber: 1, ourScore: 18, opponentScore: 25 },
          { setNumber: 2, ourScore: 22, opponentScore: 25 },
          { setNumber: 3, ourScore: 19, opponentScore: 25 },
        ],
      },
    ],
    upcomingMatch: {
      date: '26.01.18 14:00',
      opponent: 'KB손해보험',
      venue: '천안유관순체육관',
    },
  };
}

async function crawlVolleyballData() {
  try {
    console.log('Starting volleyball data crawl...');

    // 실시간 데이터 크롤링 시도
    const [standings, recentMatches, upcomingMatch] = await Promise.all([
      crawlStandings(),
      crawlRecentMatches(),
      crawlUpcomingMatch(),
    ]);

    // 크롤링 실패 시 폴백 데이터 사용
    const fallbackData = getFallbackData();
    const standingsData = standings || fallbackData.standings;
    const matchesData = recentMatches || fallbackData.recentMatches;
    const upcomingMatchData = upcomingMatch || fallbackData.upcomingMatch;

    // volleyball-detail.json 생성
    const volleyballDetail = {
      leagueStandings: standingsData,
      recentMatches: matchesData,
      upcomingMatch: upcomingMatchData,
    };

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
          winRate: parseFloat((currentTeam.wins / (currentTeam.wins + currentTeam.losses)).toFixed(3)),
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
