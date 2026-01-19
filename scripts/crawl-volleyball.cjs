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
      
      // 페이지 구조 확인
      const pageInfo = await page.evaluate(() => {
        const bodyText = document.body ? document.body.textContent : '';
        const hasSchedule = bodyText.includes('경기') || bodyText.includes('스케줄');
        const itemCount = document.querySelectorAll('.ScheduleAllGameListItem_item_box__1HDdX').length;
        return {
          hasSchedule,
          itemCount,
          title: document.title,
          url: window.location.href
        };
      });
      console.log(`[CRAWL] Recent matches - Page info: ${JSON.stringify(pageInfo)}`);

      const dayMatchesResult = await page.evaluate((teamName) => {
        // 다양한 셀렉터 시도
        let items = document.querySelectorAll('.ScheduleAllGameListItem_item_box__1HDdX');
        
        // 대체 셀렉터들
        if (items.length === 0) {
          items = document.querySelectorAll('[class*="Schedule"] [class*="Item"]');
        }
        if (items.length === 0) {
          items = document.querySelectorAll('[class*="Game"] [class*="Item"]');
        }
        if (items.length === 0) {
          items = document.querySelectorAll('li[class*="game"], div[class*="game"]');
        }
        
        const debugInfo = {
          totalItems: items.length,
          items: [],
          selectors: {
            primary: document.querySelectorAll('.ScheduleAllGameListItem_item_box__1HDdX').length,
            alt1: document.querySelectorAll('[class*="Schedule"] [class*="Item"]').length,
            alt2: document.querySelectorAll('[class*="Game"] [class*="Item"]').length,
            alt3: document.querySelectorAll('li[class*="game"], div[class*="game"]').length
          }
        };
        
        const results = [];

        items.forEach((item, idx) => {
          // 다양한 상태 셀렉터 시도
          let statusEl = item.querySelector('.ScheduleAllGameListItem_game_state__3lmN2');
          if (!statusEl) {
            statusEl = item.querySelector('[class*="state"], [class*="status"], [class*="game_state"]');
          }
          const status = statusEl ? statusEl.textContent.trim() : null;

          if (status === '경기종료' || status === '종료' || (status && !status.includes('예정') && !status.includes('취소'))) {
            // 다양한 팀 셀렉터 시도
            let teams = item.querySelectorAll('.ScheduleAllGameListItem_team__R-bjK');
            if (teams.length === 0) {
              teams = item.querySelectorAll('[class*="team"], [class*="Team"]');
            }
            if (teams.length === 0) {
              teams = item.querySelectorAll('div[class*="home"], div[class*="away"]');
            }
            
            let homeTeam = '';
            let awayTeam = '';
            
            if (teams.length >= 2) {
              // 팀명 추출 시도
              const homeTeamEl = teams[0].querySelector('.ScheduleAllGameListItem_name__3LNRT') || 
                                teams[0].querySelector('[class*="name"]') ||
                                teams[0].querySelector('span, div');
              const awayTeamEl = teams[1].querySelector('.ScheduleAllGameListItem_name__3LNRT') || 
                                teams[1].querySelector('[class*="name"]') ||
                                teams[1].querySelector('span, div');
              
              homeTeam = homeTeamEl ? homeTeamEl.textContent.trim() : '';
              awayTeam = awayTeamEl ? awayTeamEl.textContent.trim() : '';
            }
            
            debugInfo.items.push({
              idx: idx + 1,
              status,
              teamsCount: teams.length,
              homeTeam,
              awayTeam,
              matchesTeam: homeTeam && awayTeam && (homeTeam.includes(teamName) || awayTeam.includes(teamName))
            });

            if (homeTeam && awayTeam && (homeTeam.includes(teamName) || awayTeam.includes(teamName))) {
              // 스코어 추출 시도
              let homeScoreEl = teams[0].querySelector('.ScheduleAllGameListItem_score__3Xzs7') ||
                               teams[0].querySelector('[class*="score"]') ||
                               teams[0].querySelector('span, div');
              let awayScoreEl = teams[1].querySelector('.ScheduleAllGameListItem_score__3Xzs7') ||
                               teams[1].querySelector('[class*="score"]') ||
                               teams[1].querySelector('span, div');
              
              const homeScoreText = homeScoreEl ? homeScoreEl.textContent.trim() : '';
              const awayScoreText = awayScoreEl ? awayScoreEl.textContent.trim() : '';
              
              // 숫자만 추출
              const homeScoreMatch = homeScoreText.match(/\d+/);
              const awayScoreMatch = awayScoreText.match(/\d+/);
              
              const homeScore = homeScoreMatch ? parseInt(homeScoreMatch[0]) : 0;
              const awayScore = awayScoreMatch ? parseInt(awayScoreMatch[0]) : 0;

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

              if (!isNaN(ourScore) && !isNaN(opponentScore) && (ourScore > 0 || opponentScore > 0)) {
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

        return { results, debugInfo };
      }, TEAM_NAME);

      const dayMatches = dayMatchesResult?.results || [];
      console.log(`[CRAWL] Date ${dateStr}: Debug info: ${JSON.stringify(dayMatchesResult?.debugInfo)}`);
      console.log(`[CRAWL] Date ${dateStr}: Found ${dayMatches.length} matches`);
      if (dayMatches.length > 0) {
        dayMatches.forEach(match => {
          console.log(`[CRAWL] Adding match: ${dateStr} vs ${match.opponent}`);
          matches.push({
            date: dateStr, // ISO 형식으로 저장 (예: "2026-01-04")
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
    // 최신순으로 정렬 (날짜 내림차순)
    matches.sort((a, b) => new Date(b.date) - new Date(a.date));
    return matches.slice(0, 3); // 최대 3개 반환

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
      
      // 페이지 구조 확인
      const pageInfo = await page.evaluate(() => {
        const bodyText = document.body ? document.body.textContent : '';
        const hasSchedule = bodyText.includes('경기') || bodyText.includes('스케줄');
        const itemCount = document.querySelectorAll('.ScheduleAllGameListItem_item_box__1HDdX').length;
        return {
          hasSchedule,
          itemCount,
          title: document.title,
          url: window.location.href
        };
      });
      console.log(`[CRAWL] Upcoming match - Page info: ${JSON.stringify(pageInfo)}`);

      const upcomingMatchResult = await page.evaluate((teamName, matchDate) => {
        // 다양한 셀렉터 시도
        let items = document.querySelectorAll('.ScheduleAllGameListItem_item_box__1HDdX');
        if (items.length === 0) {
          items = document.querySelectorAll('[class*="Schedule"] [class*="Item"]');
        }
        if (items.length === 0) {
          items = document.querySelectorAll('[class*="Game"] [class*="Item"]');
        }
        
        const debugInfo = {
          totalItems: items.length,
          items: []
        };

        for (let item of items) {
          let statusEl = item.querySelector('.ScheduleAllGameListItem_game_state__3lmN2');
          if (!statusEl) {
            statusEl = item.querySelector('[class*="state"], [class*="status"]');
          }
          const status = statusEl ? statusEl.textContent.trim() : null;

          let teams = item.querySelectorAll('.ScheduleAllGameListItem_team__R-bjK');
          if (teams.length === 0) {
            teams = item.querySelectorAll('[class*="team"], [class*="Team"]');
          }
          
          let homeTeam = '';
          let awayTeam = '';
          
          if (teams.length >= 2) {
            const homeTeamEl = teams[0].querySelector('.ScheduleAllGameListItem_name__3LNRT') || 
                              teams[0].querySelector('[class*="name"]') ||
                              teams[0].querySelector('span, div');
            const awayTeamEl = teams[1].querySelector('.ScheduleAllGameListItem_name__3LNRT') || 
                              teams[1].querySelector('[class*="name"]') ||
                              teams[1].querySelector('span, div');
            
            homeTeam = homeTeamEl ? homeTeamEl.textContent.trim() : '';
            awayTeam = awayTeamEl ? awayTeamEl.textContent.trim() : '';
          }
          
          debugInfo.items.push({
            status,
            teamsCount: teams.length,
            homeTeam,
            awayTeam,
            matchesTeam: homeTeam && awayTeam && (homeTeam.includes(teamName) || awayTeam.includes(teamName))
          });

          if (status !== '경기종료' && status !== '종료') {
            if (homeTeam && awayTeam && (homeTeam.includes(teamName) || awayTeam.includes(teamName))) {
              const isHome = homeTeam.includes(teamName);
              const opponent = isHome ? awayTeam : homeTeam;
              const venue = isHome ? '천안유관순체육관' : '원정';
              
              let timeTextEl = item.querySelector('.ScheduleAllGameListItem_time__3xyqM');
              if (!timeTextEl) {
                timeTextEl = item.querySelector('[class*="time"], [class*="Time"]');
              }
              const timeText = timeTextEl ? timeTextEl.textContent.trim() : '';

              return { match: {
                date: `${matchDate} ${timeText}`.trim(),
                opponent,
                venue
              }, debugInfo };
            }
          }
        }

        return { match: null, debugInfo };
      }, TEAM_NAME, dateStr.substring(2).replace(/-/g, '.'));

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

    // 실시간 데이터 크롤링 시도
    const [standings, recentMatches, upcomingMatch] = await Promise.all([
      crawlStandings(),
      crawlRecentMatches(),
      crawlUpcomingMatch(),
    ]);

    console.log(`[RESULT] Standings: ${standings ? 'SUCCESS (' + standings.length + ' teams)' : 'FAILED'}`);
    console.log(`[RESULT] Recent matches: ${recentMatches ? 'SUCCESS (' + recentMatches.length + ' matches)' : 'FAILED'}`);
    console.log(`[RESULT] Upcoming match: ${upcomingMatch ? 'SUCCESS (' + JSON.stringify(upcomingMatch) + ')' : 'FAILED'}`);

    // 크롤링 실패 시 폴백 데이터 사용
    const fallbackData = getFallbackData();
    const standingsData = standings || fallbackData.standings;
    const matchesData = recentMatches || fallbackData.recentMatches;
    const upcomingMatchData = upcomingMatch || fallbackData.upcomingMatch;

    console.log(`[FINAL] Using standings: ${standings ? 'CRAWLED' : 'FALLBACK'}`);
    console.log(`[FINAL] Using recent matches: ${recentMatches ? 'CRAWLED (' + recentMatches.length + ')' : 'FALLBACK (' + (matchesData ? matchesData.length : 0) + ')'}`);
    console.log(`[FINAL] Using upcoming match: ${upcomingMatch ? 'CRAWLED' : 'FALLBACK'} - ${upcomingMatchData ? JSON.stringify(upcomingMatchData) : 'null'}`);

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
