const fs = require('fs');
const path = require('path');

/**
 * 네이버 스포츠 V리그 데이터 크롤링
 * 현대캐피탈 스카이워커스 팀 정보 수집
 */

const TEAM_NAME = '현대캐피탈';
const DATA_DIR = path.join(__dirname, '../public/data');

// 네이버 스포츠 API 엔드포인트
const NAVER_VOLLEYBALL_API = {
  standings: 'https://sports.news.naver.com/kovo/record/index?category=kovo&year=2025',
  schedule: 'https://sports.news.naver.com/kovo/schedule/index?category=kovo&year=2026&month=01',
};

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

async function crawlVolleyballData() {
  try {
    console.log('Starting volleyball data crawl...');

    // 순위표 데이터 (하드코딩 - 실제로는 네이버에서 크롤링)
    // 네이버 스포츠는 직접 크롤링이 어려우므로 수동 업데이트 필요
    const standingsData = [
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
        name: '현대캐피탈 스카이워커스',
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
    ];

    // 최근 경기 데이터 (예시)
    const recentMatches = [
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
    ];

    // volleyball-detail.json 생성
    const volleyballDetail = {
      leagueStandings: standingsData,
      recentMatches: recentMatches,
    };

    // sports.json 업데이트
    const sportsJsonPath = path.join(DATA_DIR, 'sports.json');
    let sportsData = {};

    if (fs.existsSync(sportsJsonPath)) {
      sportsData = JSON.parse(fs.readFileSync(sportsJsonPath, 'utf8'));
    }

    const currentTeam = standingsData.find(team => team.name === '현대캐피탈 스카이워커스');

    sportsData.volleyball = {
      team: '현대캐피탈 스카이워커스',
      currentRank: currentTeam.rank,
      record: {
        wins: currentTeam.wins,
        losses: currentTeam.losses,
        winRate: parseFloat((currentTeam.wins / (currentTeam.wins + currentTeam.losses)).toFixed(3)),
        setRate: currentTeam.setRate,
      },
    };

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
    console.log(`  - Rank: ${currentTeam.rank}`);
    console.log(`  - Record: ${currentTeam.wins}W-${currentTeam.losses}L`);
    console.log(`  - Recent matches: ${recentMatches.length}`);

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
