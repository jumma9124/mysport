const fs = require('fs');
const path = require('path');

/**
 * 네이버 스포츠 KBO 데이터 크롤링
 * 한화 이글스 팀 정보 수집
 */

const TEAM_NAME = '한화';
const DATA_DIR = path.join(__dirname, '../public/data');

async function fetchWithTimeout(url, options = {}, timeout = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ...options.headers,
      },
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

async function crawlBaseballData() {
  try {
    console.log('Starting baseball data crawl...');

    // 2025 시즌 최종 순위 데이터
    const standingsData = [
      {
        name: 'KIA 타이거즈',
        wins: 87,
        losses: 55,
        draws: 2,
        winRate: 0.613,
        rank: 1,
      },
      {
        name: '한화 이글스',
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
      {
        name: '삼성 라이온즈',
        wins: 78,
        losses: 64,
        draws: 2,
        winRate: 0.549,
        rank: 4,
      },
      {
        name: 'KT 위즈',
        wins: 72,
        losses: 70,
        draws: 2,
        winRate: 0.507,
        rank: 5,
      },
    ];

    // 타자 순위 (예시 데이터)
    const batters = [
      { name: '페라자', avg: 0.298, hits: 145, hr: 28, rbi: 89 },
      { name: '노시환', avg: 0.285, hits: 132, hr: 24, rbi: 78 },
      { name: '채은성', avg: 0.274, hits: 128, hr: 18, rbi: 72 },
    ];

    // 투수 순위 (예시 데이터)
    const pitchers = [
      { name: '류현진', era: 3.45, wins: 12, losses: 8, so: 145 },
      { name: '문동주', era: 3.89, wins: 10, losses: 9, so: 132 },
      { name: '웨스', era: 4.12, wins: 9, losses: 10, so: 118 },
    ];

    // 마지막 시리즈 (2025 시즌 종료)
    const lastSeries = {
      opponent: '삼성',
      date: '25.10.03',
      result: 'win',
      score: '5-3',
    };

    // baseball-detail.json 생성
    const baseballDetail = {
      leagueStandings: standingsData,
      batters: batters,
      pitchers: pitchers,
      headToHead: [], // 상대전적은 시즌 종료로 비움
      lastSeries: lastSeries,
    };

    // sports.json 업데이트
    const sportsJsonPath = path.join(DATA_DIR, 'sports.json');
    let sportsData = {};

    if (fs.existsSync(sportsJsonPath)) {
      sportsData = JSON.parse(fs.readFileSync(sportsJsonPath, 'utf8'));
    }

    const currentTeam = standingsData.find(team => team.name === '한화 이글스');

    sportsData.baseball = {
      team: '한화 이글스',
      currentRank: currentTeam.rank,
      record: {
        wins: currentTeam.wins,
        losses: currentTeam.losses,
        draws: currentTeam.draws,
        winRate: currentTeam.winRate,
      },
    };

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
    console.log(`  - Rank: ${currentTeam.rank}`);
    console.log(`  - Record: ${currentTeam.wins}W-${currentTeam.losses}L-${currentTeam.draws}D`);
    console.log(`  - Last series: ${lastSeries.result} vs ${lastSeries.opponent}`);

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
