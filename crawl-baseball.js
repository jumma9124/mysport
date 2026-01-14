/**
 * 한화 이글스 야구 데이터 크롤링 스크립트
 * KBO 공식 사이트에서 팀 순위, 선수 기록 등을 수집
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 데이터 파일 경로
const DATA_DIR = join(__dirname, 'public', 'data');
const BASEBALL_DETAIL_PATH = join(DATA_DIR, 'baseball-detail.json');
const SPORTS_PATH = join(DATA_DIR, 'sports.json');

/**
 * 야구 상세 데이터 크롤링
 * TODO: Puppeteer를 사용하여 실제 크롤링 구현
 */
async function crawlBaseballData() {
  console.log('🏃 야구 데이터 크롤링 시작...');
  
  try {
    // TODO: Puppeteer를 사용한 실제 크롤링 로직
    // const browser = await puppeteer.launch({ headless: 'new' });
    // const page = await browser.newPage();
    // await page.goto('https://www.koreabaseball.com/...');
    
    // 임시 예시 데이터 (실제 크롤링으로 대체 필요)
    const baseballDetail = {
      lastUpdate: new Date().toISOString(),
      team: "한화 이글스",
      league: {
        standings: [
          { rank: 1, team: "기아 타이거즈", wins: 87, losses: 55, draws: 2, winRate: 0.613 },
          { rank: 2, team: "한화 이글스", wins: 83, losses: 57, draws: 4, winRate: 0.593 },
          { rank: 3, team: "LG 트윈스", wins: 79, losses: 62, draws: 3, winRate: 0.560 },
          { rank: 4, team: "삼성 라이온즈", wins: 78, losses: 64, draws: 2, winRate: 0.549 },
          { rank: 5, team: "두산 베어스", wins: 73, losses: 69, draws: 2, winRate: 0.514 }
        ]
      },
      pitchers: [
        { rank: 1, name: "문동주", era: 2.15, wins: 12, losses: 8, innings: 165.1 },
        { rank: 2, name: "류현진", era: 3.55, wins: 7, losses: 3, innings: 125.2 }
      ],
      batters: [
        { rank: 1, name: "노시환", avg: 0.312, hr: 28, rbi: 98, hits: 145 },
        { rank: 2, name: "채은성", avg: 0.289, hr: 22, rbi: 76, hits: 132 }
      ],
      recentGames: [
        { date: "2024-10-29", opponent: "KIA", result: "승", score: "5-3" },
        { date: "2024-10-28", opponent: "KIA", result: "패", score: "2-4" }
      ]
    };
    
    console.log('✅ 야구 상세 데이터 수집 완료');
    return baseballDetail;
    
  } catch (error) {
    console.error('❌ 야구 데이터 크롤링 실패:', error);
    throw error;
  }
}

/**
 * sports.json 파일 업데이트
 */
function updateSportsJson(baseballData) {
  try {
    let sportsData = {};
    
    // 기존 파일이 있으면 읽기
    if (existsSync(SPORTS_PATH)) {
      const fileContent = readFileSync(SPORTS_PATH, 'utf-8');
      sportsData = JSON.parse(fileContent);
    }
    
    // 야구 데이터 업데이트
    sportsData.baseball = {
      team: baseballData.team,
      currentRank: baseballData.league.standings.find(t => t.team === baseballData.team)?.rank || 0,
      record: {
        wins: baseballData.league.standings.find(t => t.team === baseballData.team)?.wins || 0,
        losses: baseballData.league.standings.find(t => t.team === baseballData.team)?.losses || 0,
        draws: baseballData.league.standings.find(t => t.team === baseballData.team)?.draws || 0,
        winRate: baseballData.league.standings.find(t => t.team === baseballData.team)?.winRate || 0
      }
    };
    
    writeFileSync(SPORTS_PATH, JSON.stringify(sportsData, null, 2));
    console.log('✅ sports.json 업데이트 완료');
    
  } catch (error) {
    console.error('❌ sports.json 업데이트 실패:', error);
    throw error;
  }
}

/**
 * 메인 실행 함수
 */
async function main() {
  try {
    console.log('='.repeat(50));
    console.log('🏀 야구 데이터 크롤링 시작');
    console.log('='.repeat(50));
    
    // 야구 데이터 크롤링
    const baseballData = await crawlBaseballData();
    
    // baseball-detail.json 저장
    writeFileSync(BASEBALL_DETAIL_PATH, JSON.stringify(baseballData, null, 2));
    console.log(`✅ 데이터 저장 완료: ${BASEBALL_DETAIL_PATH}`);
    
    // sports.json 업데이트
    updateSportsJson(baseballData);
    
    console.log('='.repeat(50));
    console.log('✅ 모든 작업 완료!');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('❌ 크롤링 실패:', error);
    process.exit(1);
  }
}

// 스크립트 실행
main();
