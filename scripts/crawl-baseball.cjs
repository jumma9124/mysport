const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

/**
 * 네이버 스포츠 KBO 실시간 데이터 크롤링 (Puppeteer 사용)
 * 한화 이글스 팀 정보 수집
 */

const TEAM_NAME = '한화';
const TEAM_FULL_NAME = '한화 이글스';
const TEAM_CODE = 'HH';
const DATA_DIR = path.join(__dirname, '../public/data');

// 네이버 스포츠 모바일 URL
const NAVER_URLS = {
  standings: 'https://m.sports.naver.com/kbaseball/record/kbo?seasonCode=2024&tab=teamRank',
  batters: 'https://m.sports.naver.com/kbaseball/record/kbo?seasonCode=2024&tab=player&category=batting',
  pitchers: 'https://m.sports.naver.com/kbaseball/record/kbo?seasonCode=2024&tab=player&category=pitching',
  headToHead: 'https://m.sports.naver.com/kbaseball/record/kbo?seasonCode=2024&tab=vsTeam',
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

    // React 렌더링 대기
    await page.waitForSelector('.TableBody_list__P8yRn', { timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 2000));

    const standings = await page.evaluate(() => {
      const rows = document.querySelectorAll('.TableBody_item__eCenH');
      const result = [];

      rows.forEach((row) => {
        const rankEl = row.querySelector('.TeamInfo_ranking__MqHpq');
        const rank = rankEl ? parseInt(rankEl.textContent.trim()) : 0;

        const teamEl = row.querySelector('.TeamInfo_team_name__dni7F');
        const teamName = teamEl ? teamEl.textContent.trim() : '';

        const textElements = row.querySelectorAll('.TextInfo_text__ysEqh');
        const values = [];
        textElements.forEach(el => {
          const text = el.textContent.trim();
          values.push(text);
        });

        // values 배열: ["wra0.613", "gameBehind0.0", "winGameCount87", "drawnGameCount2", "loseGameCount55", ...]
        let winRate = 0;
        let wins = 0;
        let losses = 0;
        let draws = 0;

        values.forEach(val => {
          if (val.startsWith('wra')) {
            winRate = parseFloat(val.replace('wra', ''));
          } else if (val.startsWith('winGameCount')) {
            wins = parseInt(val.replace('winGameCount', ''));
          } else if (val.startsWith('loseGameCount')) {
            losses = parseInt(val.replace('loseGameCount', ''));
          } else if (val.startsWith('drawnGameCount')) {
            draws = parseInt(val.replace('drawnGameCount', ''));
          }
        });

        if (!isNaN(rank) && teamName) {
          result.push({
            name: teamName,
            wins,
            losses,
            draws,
            winRate,
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
    if (browser) await browser.close();
    console.error('Failed to crawl standings:', error.message);
    return null;
  }
}

async function crawlBatters() {
  let browser;
  try {
    console.log('Fetching batters data...');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15');

    await page.goto(NAVER_URLS.batters, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    // 더 긴 대기 시간으로 React 렌더링 대기
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 선택자 확인
    const hasSelector = await page.evaluate(() => {
      return document.querySelector('.TableBody_list__P8yRn') !== null;
    });

    if (!hasSelector) {
      console.log('Selector not found, trying alternative...');
      await browser.close();
      return null;
    }

    const batters = await page.evaluate((teamName) => {
      const rows = document.querySelectorAll('.TableBody_item__eCenH');
      const result = [];

      rows.forEach((row) => {
        const teamEl = row.querySelector('.PlayerInfo_team__3jg2Q');
        const playerTeam = teamEl ? teamEl.textContent.trim() : '';

        if (playerTeam.includes(teamName)) {
          const nameEl = row.querySelector('.PlayerInfo_name__3A9qb');
          const name = nameEl ? nameEl.textContent.trim() : '';

          const textElements = row.querySelectorAll('.TextInfo_text__ysEqh');
          const values = [];
          textElements.forEach(el => {
            const text = el.textContent.trim();
            values.push(text);
          });

          // values 배열에서 타율, 안타, 홈런, 타점 추출
          const avg = values[0] ? parseFloat(values[0]) : 0;
          const hits = values[2] ? parseInt(values[2]) : 0;
          const hr = values[4] ? parseInt(values[4]) : 0;
          const rbi = values[5] ? parseInt(values[5]) : 0;

          if (name && result.length < 5) {
            result.push({ name, avg, hits, hr, rbi });
          }
        }
      });

      return result;
    }, TEAM_NAME);

    await browser.close();

    console.log(`✓ Found ${batters.length} batters`);
    return batters;

  } catch (error) {
    if (browser) await browser.close();
    console.log('⚠ Batters data not available (using fallback)');
    return null;
  }
}

async function crawlPitchers() {
  let browser;
  try {
    console.log('Fetching pitchers data...');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15');

    await page.goto(NAVER_URLS.pitchers, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    await new Promise(resolve => setTimeout(resolve, 5000));

    const hasSelector = await page.evaluate(() => {
      return document.querySelector('.TableBody_list__P8yRn') !== null;
    });

    if (!hasSelector) {
      console.log('Selector not found for pitchers');
      await browser.close();
      return null;
    }

    const pitchers = await page.evaluate((teamName) => {
      const rows = document.querySelectorAll('.TableBody_item__eCenH');
      const result = [];

      rows.forEach((row) => {
        const teamEl = row.querySelector('.PlayerInfo_team__3jg2Q');
        const playerTeam = teamEl ? teamEl.textContent.trim() : '';

        if (playerTeam.includes(teamName)) {
          const nameEl = row.querySelector('.PlayerInfo_name__3A9qb');
          const name = nameEl ? nameEl.textContent.trim() : '';

          const textElements = row.querySelectorAll('.TextInfo_text__ysEqh');
          const values = [];
          textElements.forEach(el => {
            const text = el.textContent.trim();
            values.push(text);
          });

          // values 배열에서 평균자책점, 승, 패, 탈삼진 추출
          const era = values[0] ? parseFloat(values[0]) : 0;
          const wins = values[2] ? parseInt(values[2]) : 0;
          const losses = values[3] ? parseInt(values[3]) : 0;
          const so = values[6] ? parseInt(values[6]) : 0;

          if (name && result.length < 5) {
            result.push({ name, era, wins, losses, so });
          }
        }
      });

      return result;
    }, TEAM_NAME);

    await browser.close();

    console.log(`✓ Found ${pitchers.length} pitchers`);
    return pitchers;

  } catch (error) {
    if (browser) await browser.close();
    console.log('⚠ Pitchers data not available (using fallback)');
    return null;
  }
}

async function crawlHeadToHead() {
  let browser;
  try {
    console.log('Fetching head-to-head data...');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15');

    await page.goto(NAVER_URLS.headToHead, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    await new Promise(resolve => setTimeout(resolve, 5000));

    const hasSelector = await page.evaluate(() => {
      return document.querySelector('.TableBody_list__P8yRn') !== null;
    });

    if (!hasSelector) {
      console.log('Selector not found for head-to-head');
      await browser.close();
      return null;
    }

    const headToHead = await page.evaluate((teamName) => {
      const rows = document.querySelectorAll('.TableBody_item__eCenH');
      const result = [];

      rows.forEach((row) => {
        const teamEl = row.querySelector('.TeamInfo_team_name__dni7F');
        const ourTeam = teamEl ? teamEl.textContent.trim() : '';

        if (ourTeam.includes(teamName)) {
          const opponentRows = row.parentElement.querySelectorAll('.TableBody_item__eCenH');

          opponentRows.forEach((opRow, idx) => {
            if (idx === 0) return; // Skip first row (our team)

            const opTeamEl = opRow.querySelector('.TeamInfo_team_name__dni7F');
            const opponent = opTeamEl ? opTeamEl.textContent.trim() : '';

            const textElements = opRow.querySelectorAll('.TextInfo_text__ysEqh');
            const values = [];
            textElements.forEach(el => {
              const text = el.textContent.trim();
              const numMatch = text.match(/\d+/);
              if (numMatch) {
                values.push(parseInt(numMatch[0]));
              }
            });

            const wins = values[0] || 0;
            const losses = values[1] || 0;
            const draws = values[2] || 0;

            if (opponent) {
              result.push({ opponent, wins, losses, draws });
            }
          });
        }
      });

      return result;
    }, TEAM_NAME);

    await browser.close();

    console.log(`✓ Found head-to-head data for ${headToHead.length} teams`);
    return headToHead;

  } catch (error) {
    if (browser) await browser.close();
    console.log('⚠ Head-to-head data not available (using fallback)');
    return null;
  }
}

function getFallbackData() {
  console.log('Using fallback data...');

  return {
    standings: [
      {
        name: 'KIA 타이거즈',
        wins: 87,
        losses: 55,
        draws: 2,
        winRate: 0.613,
        rank: 1,
      },
      {
        name: TEAM_FULL_NAME,
        wins: 83,
        losses: 57,
        draws: 4,
        winRate: 0.593,
        rank: 2,
      },
      {
        name: 'LG 트윈스',
        wins: 79,
        losses: 62,
        draws: 3,
        winRate: 0.560,
        rank: 3,
      },
    ],
    batters: [
      { name: '페라자', avg: 0.298, hits: 145, hr: 28, rbi: 89 },
      { name: '노시환', avg: 0.285, hits: 132, hr: 24, rbi: 78 },
      { name: '채은성', avg: 0.274, hits: 128, hr: 18, rbi: 72 },
    ],
    pitchers: [
      { name: '류현진', era: 3.45, wins: 12, losses: 8, so: 145 },
      { name: '문동주', era: 3.89, wins: 10, losses: 9, so: 132 },
      { name: '웨스', era: 4.12, wins: 9, losses: 10, so: 118 },
    ],
    headToHead: [],
    lastSeries: {
      opponent: '삼성',
      date: '25.10.03',
      result: 'win',
      score: '5-3',
    },
  };
}

async function crawlBaseballData() {
  try {
    console.log('Starting baseball data crawl...');

    // 모든 데이터 병렬로 크롤링
    const [standings, batters, pitchers, headToHead] = await Promise.all([
      crawlStandings(),
      crawlBatters(),
      crawlPitchers(),
      crawlHeadToHead(),
    ]);

    // 크롤링 실패 시 폴백 데이터 사용
    const fallbackData = getFallbackData();
    const standingsData = standings || fallbackData.standings;
    const battersData = batters || fallbackData.batters;
    const pitchersData = pitchers || fallbackData.pitchers;
    const headToHeadData = headToHead || fallbackData.headToHead;

    // baseball-detail.json 생성
    const baseballDetail = {
      leagueStandings: standingsData,
      batters: battersData,
      pitchers: pitchersData,
      headToHead: headToHeadData,
      lastSeries: fallbackData.lastSeries,
    };

    // sports.json 업데이트
    const sportsJsonPath = path.join(DATA_DIR, 'sports.json');
    let sportsData = {};

    if (fs.existsSync(sportsJsonPath)) {
      sportsData = JSON.parse(fs.readFileSync(sportsJsonPath, 'utf8'));
    }

    const currentTeam = standingsData.find(team => team.name.includes(TEAM_NAME));

    if (currentTeam) {
      sportsData.baseball = {
        team: TEAM_FULL_NAME,
        currentRank: currentTeam.rank,
        record: {
          wins: currentTeam.wins,
          losses: currentTeam.losses,
          draws: currentTeam.draws || 0,
          winRate: currentTeam.winRate,
        },
      };
    }

    // 파일 저장
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    fs.writeFileSync(
      path.join(DATA_DIR, 'baseball-detail.json'),
      JSON.stringify(baseballDetail, null, 2),
      'utf8'
    );

    fs.writeFileSync(
      sportsJsonPath,
      JSON.stringify(sportsData, null, 2),
      'utf8'
    );

    console.log('✓ Baseball data updated successfully');
    if (currentTeam) {
      console.log(`  - Rank: ${currentTeam.rank}`);
      console.log(`  - Record: ${currentTeam.wins}W-${currentTeam.losses}L-${currentTeam.draws}D`);
    }

  } catch (error) {
    console.error('Failed to crawl baseball data:', error);
    process.exit(1);
  }
}

// 스크립트 직접 실행 시
if (require.main === module) {
  crawlBaseballData();
}

module.exports = { crawlBaseballData };
