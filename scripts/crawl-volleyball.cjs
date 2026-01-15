const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const fetch = require('node-fetch');

/**
 * 네이버 스포츠 V리그 실시간 데이터 크롤링
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

      // 승-패 파싱
      const recordText = $row.find('.TeamRankList_record__1DgHl').text().trim();
      const recordMatch = recordText.match(/(\d+)승\s*(\d+)패/);
      const wins = recordMatch ? parseInt(recordMatch[1]) : 0;
      const losses = recordMatch ? parseInt(recordMatch[2]) : 0;

      // 세트득실 파싱
      const setRecordText = $row.find('.TeamRankList_setWinLose__2FcZx').text().trim();
      const setMatch = setRecordText.match(/(\d+)-(\d+)/);
      const setWins = setMatch ? parseInt(setMatch[1]) : 0;
      const setLosses = setMatch ? parseInt(setMatch[2]) : 0;

      // 세트득실률
      const setRateText = $row.find('.TeamRankList_etc__1XFqX').eq(0).text().trim();
      const setRate = parseFloat(setRateText) || 0;

      if (!isNaN(rank) && teamName) {
        standings.push({
          name: teamName,
          wins,
          losses,
          setWins,
          setLosses,
          setRate,
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

async function crawlRecentMatches() {
  try {
    console.log('Fetching recent matches from Naver Sports...');

    // 최근 30일간의 경기 확인
    const matches = [];
    const now = new Date();

    for (let i = 0; i < 30; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const url = NAVER_URLS.schedule(dateStr);
      const response = await fetchWithRetry(url);
      const html = await response.text();
      const $ = cheerio.load(html);

      // 경기 정보 파싱
      $('.ScheduleAllGameListItem_item_box__1HDdX').each((_, elem) => {
        const $match = $(elem);

        const status = $match.find('.ScheduleAllGameListItem_game_state__3lmN2').text().trim();

        // 종료된 경기만
        if (status === '경기종료') {
          const homeTeam = $match.find('.ScheduleAllGameListItem_team__R-bjK').eq(0).find('.ScheduleAllGameListItem_name__3LNRT').text().trim();
          const awayTeam = $match.find('.ScheduleAllGameListItem_team__R-bjK').eq(1).find('.ScheduleAllGameListItem_name__3LNRT').text().trim();

          const homeScore = parseInt($match.find('.ScheduleAllGameListItem_team__R-bjK').eq(0).find('.ScheduleAllGameListItem_score__3Xzs7').text().trim());
          const awayScore = parseInt($match.find('.ScheduleAllGameListItem_team__R-bjK').eq(1).find('.ScheduleAllGameListItem_score__3Xzs7').text().trim());

          const matchDate = dateStr.substring(2).replace(/-/g, '.');

          if (!isNaN(homeScore) && !isNaN(awayScore)) {
            const isHome = homeTeam.includes(TEAM_NAME);
            const opponent = isHome ? awayTeam : homeTeam;
            const ourScore = isHome ? homeScore : awayScore;
            const opponentScore = isHome ? awayScore : homeScore;

            matches.push({
              date: matchDate,
              opponent: opponent,
              venue: '천안유관순체육관',
              result: ourScore > opponentScore ? 'win' : 'loss',
              score: `${ourScore}-${opponentScore}`,
            });
          }
        }
      });

      if (matches.length >= 2) break;
    }

    if (matches.length === 0) {
      console.warn('No recent matches found');
      return null;
    }

    console.log(`✓ Found ${matches.length} recent matches`);
    return matches.slice(0, 2);

  } catch (error) {
    console.error('Failed to crawl recent matches:', error.message);
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
  };
}

async function crawlVolleyballData() {
  try {
    console.log('Starting volleyball data crawl...');

    // 실시간 데이터 크롤링 시도
    const [standings, recentMatches] = await Promise.all([
      crawlStandings(),
      crawlRecentMatches(),
    ]);

    // 크롤링 실패 시 폴백 데이터 사용
    const fallbackData = getFallbackData();
    const standingsData = standings || fallbackData.standings;
    const matchesData = recentMatches || fallbackData.recentMatches;

    // volleyball-detail.json 생성
    const volleyballDetail = {
      leagueStandings: standingsData,
      recentMatches: matchesData,
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
