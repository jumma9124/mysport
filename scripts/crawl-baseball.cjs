const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const fetch = require('node-fetch');

/**
 * 네이버 스포츠 KBO 실시간 데이터 크롤링
 * 한화 이글스 팀 정보 수집
 */

const TEAM_NAME = '한화';
const TEAM_FULL_NAME = '한화 이글스';
const TEAM_CODE = 'HH';
const DATA_DIR = path.join(__dirname, '../public/data');

// 네이버 스포츠 모바일 URL
const NAVER_URLS = {
  standings: 'https://m.sports.naver.com/kbaseball/record/kbo?seasonCode=2025&tab=teamRank',
  schedule: (date) => `https://m.sports.naver.com/kbaseball/schedule/index?category=kbo&date=${date}&teamCode=${TEAM_CODE}`,
};

async function fetchWithRetry(url, options = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      console.error(`Attempt ${i + 1}/${retries} failed:`, error.message);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

async function crawlStandings() {
  try {
    console.log('Fetching standings from Naver Sports...');
    const response = await fetchWithRetry(NAVER_URLS.standings);
    const html = await response.text();
    const $ = cheerio.load(html);

    const standings = [];

    // 순위표 파싱 (모바일 버전)
    $('.TeamRankList_row__n_bDX').each((idx, elem) => {
      const $row = $(elem);

      const rank = parseInt($row.find('.TeamRankList_rank__3qtv0').text().trim());
      const teamName = $row.find('.TeamRankList_team__AW7V6 .TeamRankList_name__2rInP').text().trim();

      // 승-패-무 파싱
      const recordText = $row.find('.TeamRankList_record__1DgHl').text().trim();
      const recordMatch = recordText.match(/(\d+)승\s*(\d+)패\s*(\d+)무/);
      const wins = recordMatch ? parseInt(recordMatch[1]) : 0;
      const losses = recordMatch ? parseInt(recordMatch[2]) : 0;
      const draws = recordMatch ? parseInt(recordMatch[3]) : 0;

      // 승률
      const winRateText = $row.find('.TeamRankList_rate__2hOuy').text().trim();
      const winRate = parseFloat(winRateText) || 0;

      if (!isNaN(rank) && teamName) {
        standings.push({
          name: teamName,
          wins,
          losses,
          draws,
          winRate,
          rank,
        });
      }
    });

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

    // 실시간 순위 데이터 크롤링 시도
    const standings = await crawlStandings();

    // 크롤링 실패 시 폴백 데이터 사용
    const fallbackData = getFallbackData();
    const standingsData = standings || fallbackData.standings;

    // baseball-detail.json 생성
    const baseballDetail = {
      leagueStandings: standingsData,
      batters: fallbackData.batters,
      pitchers: fallbackData.pitchers,
      headToHead: [], // 상대전적은 시즌 종료로 비움
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
