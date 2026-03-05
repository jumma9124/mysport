'use strict';

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

/**
 * 네이버 스포츠 WBC(월드 베이스볼 클래식) 데이터 크롤링 (Puppeteer 사용)
 * 한국 대표팀 경기 정보 및 조별 순위 수집
 */

const DATA_DIR = path.join(__dirname, '../public/data');

// WBC 대회 기간
const WBC_START = new Date('2026-03-05T00:00:00+09:00');
const WBC_END   = new Date('2026-03-17T23:59:59+09:00');

// 네이버 스포츠 WBC URL
const NAVER_URLS = {
  index:    'https://m.sports.naver.com/wbaseball/index',
  schedule: 'https://m.sports.naver.com/wbaseball/schedule/index',
  record:   'https://m.sports.naver.com/wbaseball/record/index',
};

const isCI = !!process.env.CI;
const PUPPETEER_ARGS = isCI
  ? ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-accelerated-2d-canvas', '--disable-gpu']
  : ['--disable-dev-shm-usage', '--disable-accelerated-2d-canvas', '--disable-gpu'];

const RETRY_COUNT = 3;
const RETRY_DELAY = 5000;

async function retryableCrawl(fn, name, retries = RETRY_COUNT) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`[${name}] Attempt ${i + 1}/${retries}...`);
      const result = await fn();
      console.log(`✓ [${name}] Success on attempt ${i + 1}`);
      return result;
    } catch (error) {
      console.error(`✗ [${name}] Attempt ${i + 1}/${retries} failed:`, error.message);
      if (i === retries - 1) {
        console.error(`✗ [${name}] All ${retries} attempts failed`);
        throw error;
      }
      const delay = RETRY_DELAY * (i + 1);
      console.log(`⏳ [${name}] Waiting ${delay}ms before retry...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

// ──────────────────────────────────────────
// 한국 경기 일정/결과 크롤링
// ──────────────────────────────────────────
async function crawlKoreaGames() {
  let browser;
  try {
    browser = await puppeteer.launch({ headless: true, args: PUPPETEER_ARGS, timeout: 60000 });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15');
    await page.setViewport({ width: 375, height: 667 });

    console.log('[KoreaGames] Navigating to WBC schedule page...');
    await page.goto(NAVER_URLS.schedule, { waitUntil: 'domcontentloaded', timeout: 60000 })
      .catch(async (err) => {
        console.warn('[KoreaGames] First nav failed, retrying...', err.message);
        await page.goto(NAVER_URLS.schedule, { waitUntil: 'domcontentloaded', timeout: 60000 });
      });

    // 페이지 로딩 대기 (Naver React SPA)
    await new Promise(r => setTimeout(r, 3000));

    const games = await page.evaluate(() => {
      const results = [];
      const KOREA_KEYWORDS = ['대한민국', '한국', 'KOR'];

      // 공통 Naver 경기 아이템 셀렉터 시도
      const selectors = [
        '[class*="MatchBox_match_item"]',
        '[class*="ScheduleItem"]',
        '[class*="GameItem"]',
        '[class*="match_item"]',
        '[class*="game_item"]',
      ];

      let matchItems = [];
      for (const sel of selectors) {
        const items = document.querySelectorAll(sel);
        if (items.length > 0) {
          matchItems = Array.from(items);
          break;
        }
      }

      for (const item of matchItems) {
        const text = item.textContent || '';
        const isKorea = KOREA_KEYWORDS.some(k => text.includes(k));
        if (!isKorea) continue;

        // 날짜
        const dateEl = item.querySelector('[class*="date"]') || item.querySelector('[class*="Date"]');
        const date = dateEl ? dateEl.textContent.trim() : '';

        // 시간
        const timeEl = item.querySelector('[class*="time"]') || item.querySelector('[class*="Time"]');
        const time = timeEl ? timeEl.textContent.trim() : '';

        // 팀 이름들
        const teamEls = item.querySelectorAll('[class*="team_name"]') ||
                        item.querySelectorAll('[class*="TeamName"]') ||
                        item.querySelectorAll('[class*="team"]');
        const teamNames = Array.from(teamEls).map(el => el.textContent.trim()).filter(Boolean);

        // 상대팀 (한국이 아닌 팀)
        const opponent = teamNames.find(n => !KOREA_KEYWORDS.some(k => n.includes(k))) || '';

        // 경기 상태
        const statusEl = item.querySelector('[class*="status"]') || item.querySelector('[class*="Status"]');
        const statusText = statusEl ? statusEl.textContent.trim() : '';
        let status = 'scheduled';
        if (statusText.includes('종료') || statusText.includes('최종')) status = 'completed';
        else if (statusText.includes('진행') || statusText.includes('LIVE')) status = 'live';

        // 스코어 (종료된 경기)
        let score = null;
        let result = null;
        if (status === 'completed') {
          const scoreEls = item.querySelectorAll('[class*="score"]') ||
                           item.querySelectorAll('[class*="Score"]');
          const scores = Array.from(scoreEls).map(el => el.textContent.trim()).filter(n => /^\d+$/.test(n));
          if (scores.length >= 2) {
            // 한국 점수 위치 파악
            const koreaIdx = teamNames.findIndex(n => KOREA_KEYWORDS.some(k => n.includes(k)));
            const koreaScore = koreaIdx === 0 ? parseInt(scores[0]) : parseInt(scores[1]);
            const oppScore   = koreaIdx === 0 ? parseInt(scores[1]) : parseInt(scores[0]);
            score = `${koreaScore}-${oppScore}`;
            result = koreaScore > oppScore ? 'win' : koreaScore < oppScore ? 'loss' : 'draw';
          }
        }

        // 장소
        const venueEl = item.querySelector('[class*="venue"]') || item.querySelector('[class*="Venue"]') ||
                        item.querySelector('[class*="stadium"]');
        const venue = venueEl ? venueEl.textContent.trim() : '';

        if (opponent) {
          results.push({ date, time, opponent, venue, status, result, score });
        }
      }

      return results;
    });

    console.log(`[KoreaGames] Parsed ${games.length} games from page`);
    return games;
  } finally {
    if (browser) await browser.close();
  }
}

// ──────────────────────────────────────────
// 조별 순위 크롤링
// ──────────────────────────────────────────
async function crawlGroupStandings() {
  let browser;
  try {
    browser = await puppeteer.launch({ headless: true, args: PUPPETEER_ARGS, timeout: 60000 });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15');
    await page.setViewport({ width: 375, height: 667 });

    console.log('[Standings] Navigating to WBC record page...');
    await page.goto(NAVER_URLS.record, { waitUntil: 'domcontentloaded', timeout: 60000 })
      .catch(async (err) => {
        console.warn('[Standings] First nav failed, retrying...', err.message);
        await page.goto(NAVER_URLS.record, { waitUntil: 'domcontentloaded', timeout: 60000 });
      });

    await new Promise(r => setTimeout(r, 3000));

    const standings = await page.evaluate(() => {
      const groups = [];

      // Naver 표 행 셀렉터 시도
      const tableSels = [
        '[class*="TableBody_list"]',
        '[class*="TableBody_item"]',
        '[class*="standings"]',
        '[class*="Standings"]',
        'table tbody tr',
      ];

      // 조 이름 셀렉터
      const groupSels = [
        '[class*="group_name"]',
        '[class*="GroupName"]',
        '[class*="group_title"]',
        'h3', 'h4',
      ];

      // 조 제목 요소들 찾기
      let groupTitles = [];
      for (const sel of groupSels) {
        const els = document.querySelectorAll(sel);
        const filtered = Array.from(els).filter(el => /[A-Z]조|Group [A-Z]/.test(el.textContent));
        if (filtered.length > 0) { groupTitles = filtered; break; }
      }

      // 조 제목을 기반으로 순위 테이블 파싱
      if (groupTitles.length > 0) {
        for (const titleEl of groupTitles) {
          const groupName = titleEl.textContent.trim().replace(/[^A-Z]/g, '');
          const container = titleEl.closest('[class*="group"]') || titleEl.parentElement;
          if (!container) continue;

          const teams = [];
          let tableItems = null;
          for (const sel of tableSels) {
            const items = container.querySelectorAll(sel);
            if (items.length > 0) { tableItems = items; break; }
          }
          if (!tableItems) continue;

          Array.from(tableItems).forEach((row, idx) => {
            const cells = row.querySelectorAll('td, [class*="cell"], [class*="Cell"]');
            if (cells.length < 3) return;

            const cellTexts = Array.from(cells).map(c => c.textContent.trim());
            // 일반적: 순위, 팀명, 승, 패, 승률 순
            const rankIdx = 0;
            const nameIdx = cellTexts.findIndex(t => /[가-힣A-Za-z]{2,}/.test(t) && !/^\d/.test(t));
            if (nameIdx < 0) return;

            const nums = cellTexts.filter(t => /^\d+$/.test(t)).map(Number);
            const wins   = nums[0] ?? 0;
            const losses = nums[1] ?? 0;
            const winRate = wins + losses > 0 ? wins / (wins + losses) : 0;

            teams.push({
              rank: idx + 1,
              name: cellTexts[nameIdx],
              wins,
              losses,
              winRate: Math.round(winRate * 1000) / 1000,
            });
          });

          if (teams.length > 0) {
            groups.push({ group: groupName || String.fromCharCode(65 + groups.length), teams });
          }
        }
      }

      // 조 구분 없이 전체 테이블만 있는 경우 (단순 파싱)
      if (groups.length === 0) {
        let tableItems = null;
        for (const sel of tableSels) {
          const items = document.querySelectorAll(sel);
          if (items.length > 0) { tableItems = items; break; }
        }
        if (tableItems && tableItems.length > 0) {
          const teams = [];
          Array.from(tableItems).forEach((row, idx) => {
            const cells = row.querySelectorAll('td, [class*="cell"]');
            if (cells.length < 3) return;
            const cellTexts = Array.from(cells).map(c => c.textContent.trim());
            const nameIdx = cellTexts.findIndex(t => /[가-힣]{2,}/.test(t));
            if (nameIdx < 0) return;
            const nums = cellTexts.filter(t => /^\d+$/.test(t)).map(Number);
            const wins   = nums[0] ?? 0;
            const losses = nums[1] ?? 0;
            const winRate = wins + losses > 0 ? wins / (wins + losses) : 0;
            teams.push({ rank: idx + 1, name: cellTexts[nameIdx], wins, losses, winRate: Math.round(winRate * 1000) / 1000 });
          });
          if (teams.length > 0) groups.push({ group: 'C', teams });
        }
      }

      return groups;
    });

    console.log(`[Standings] Parsed ${standings.length} groups from page`);
    return standings;
  } finally {
    if (browser) await browser.close();
  }
}

// ──────────────────────────────────────────
// 폴백 데이터 (한국 C조 고정 일정)
// ──────────────────────────────────────────
function getFallbackData() {
  return {
    koreaGames: [
      { date: '2026-03-05', time: '19:00', opponent: '체코',    venue: '도쿄돔', status: 'scheduled', result: null, score: null },
      { date: '2026-03-07', time: '19:00', opponent: '일본',    venue: '도쿄돔', status: 'scheduled', result: null, score: null },
      { date: '2026-03-08', time: '12:00', opponent: '대만',    venue: '도쿄돔', status: 'scheduled', result: null, score: null },
      { date: '2026-03-09', time: '19:00', opponent: '호주',    venue: '도쿄돔', status: 'scheduled', result: null, score: null },
    ],
    groupStandings: [
      {
        group: 'C',
        teams: [
          { rank: 1, name: '일본',     wins: 0, losses: 0, winRate: 0 },
          { rank: 2, name: '대한민국', wins: 0, losses: 0, winRate: 0 },
          { rank: 3, name: '대만',     wins: 0, losses: 0, winRate: 0 },
          { rank: 4, name: '호주',     wins: 0, losses: 0, winRate: 0 },
        ],
      },
    ],
  };
}

// ──────────────────────────────────────────
// 크롤된 데이터 유효성 검증
// ──────────────────────────────────────────

// WBC 이외 리그 팀명 패턴 (MLB, KBO 등)
const INVALID_TEAM_PATTERNS = [
  /토론토|클리블랜드|시애틀|뉴욕|필라델피아|밀워키|시카고|보스턴|휴스턴|탬파베이/,
  /애틀랜타|마이애미|신시내티|피츠버그|세인트루이스|샌디에이고|샌프란시스코|콜로라도/,
  /두산|삼성|기아|롯데|한화|NC|키움|KT|SSG|LG/,
  /^1위/, // "1위토론토" 같은 패턴
];

function isValidWBCStandings(standings) {
  if (!standings || standings.length === 0) return false;
  for (const group of standings) {
    for (const team of group.teams) {
      if (INVALID_TEAM_PATTERNS.some(p => p.test(team.name))) {
        console.warn(`⚠️  Invalid team name detected: "${team.name}" → using fallback`);
        return false;
      }
    }
  }
  return true;
}

function isValidKoreaGames(games) {
  if (!games || games.length === 0) return false;
  // 시간 필드에 레이블이 포함된 경우 ("경기 시간19:00") → 파싱 실패로 판단
  for (const g of games) {
    if (g.time && g.time.length > 10) return false;
    if (!g.opponent || g.opponent.length === 0) return false;
  }
  return true;
}

// ──────────────────────────────────────────
// 한국 전적 계산 (koreaGames에서)
// ──────────────────────────────────────────
function calcKoreaRecord(games) {
  const wins   = games.filter(g => g.result === 'win').length;
  const losses = games.filter(g => g.result === 'loss').length;
  return { wins, losses };
}

// ──────────────────────────────────────────
// 메인 크롤링 함수
// ──────────────────────────────────────────
async function crawlWBCData() {
  const wbcDetailPath  = path.join(DATA_DIR, 'wbc-detail.json');
  const sportsJsonPath = path.join(DATA_DIR, 'sports.json');

  const fallback = getFallbackData();
  const failedCrawls = [];

  let koreaGames     = null;
  let groupStandings = null;

  // 대회 기간이 아니면 크롤링 불필요 (기간 외에도 수동 실행 허용)
  const now = new Date();
  if (now < WBC_START) {
    console.log('ℹ️  WBC has not started yet. Saving fallback schedule data.');
    koreaGames     = fallback.koreaGames;
    groupStandings = fallback.groupStandings;
  } else {
    // 경기 일정/결과
    try {
      const crawled = await retryableCrawl(crawlKoreaGames, 'KoreaGames');
      if (isValidKoreaGames(crawled)) {
        koreaGames = crawled;
      } else {
        console.warn('⚠️  Games data invalid or empty, using fallback schedule');
        koreaGames = fallback.koreaGames;
      }
    } catch (err) {
      console.error('✗ KoreaGames crawl failed:', err.message);
      failedCrawls.push('koreaGames');
      koreaGames = fallback.koreaGames;
    }

    // 조별 순위
    try {
      const crawled = await retryableCrawl(crawlGroupStandings, 'GroupStandings');
      if (isValidWBCStandings(crawled)) {
        groupStandings = crawled;
      } else {
        console.warn('⚠️  Standings data invalid or empty, using fallback');
        groupStandings = fallback.groupStandings;
      }
    } catch (err) {
      console.error('✗ GroupStandings crawl failed:', err.message);
      failedCrawls.push('groupStandings');
      groupStandings = fallback.groupStandings;
    }
  }

  const koreaRecord = calcKoreaRecord(koreaGames);

  // wbc-detail.json 저장
  const wbcDetail = {
    lastUpdate: new Date().toISOString(),
    crawlStatus: {
      status: failedCrawls.length === 0 ? 'success' : 'partial_failure',
      lastSuccessfulCrawl: failedCrawls.length === 0 ? new Date().toISOString() : undefined,
      failedItems: failedCrawls.length > 0 ? failedCrawls : undefined,
    },
    koreaRecord,
    groupStandings,
    koreaGames,
  };

  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(wbcDetailPath, JSON.stringify(wbcDetail, null, 2), 'utf8');
  console.log(`✅ Saved wbc-detail.json (${koreaGames.length} games, record: ${koreaRecord.wins}W-${koreaRecord.losses}L)`);

  // sports.json wbc 섹션 업데이트
  let sportsData = {};
  if (fs.existsSync(sportsJsonPath)) {
    sportsData = JSON.parse(fs.readFileSync(sportsJsonPath, 'utf8'));
  }

  sportsData.wbc = {
    tournament: '2026 WBC',
    koreaRecord,
  };

  fs.writeFileSync(sportsJsonPath, JSON.stringify(sportsData, null, 2), 'utf8');
  console.log('✅ Updated sports.json (wbc section)');
}

// 직접 실행
if (require.main === module) {
  crawlWBCData()
    .then(() => {
      console.log('🏆 WBC crawl completed');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ WBC crawl failed:', err);
      process.exit(1);
    });
}

module.exports = { crawlWBCData };
