const fs = require('fs');
const path = require('path');
const { crawlVolleyballData } = require('./crawl-volleyball.cjs');

// API 서버 (Vite 미들웨어로 사용)
async function volleyballCrawlAPI(req, res) {
  try {
    console.log('[API] Volleyball crawl requested');
    
    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    // 크롤링 실행
    await crawlVolleyballData();
    
    // 업데이트된 데이터 읽기
    const dataDir = path.join(__dirname, '../public/data');
    const volleyballDetailPath = path.join(dataDir, 'volleyball-detail.json');
    const sportsJsonPath = path.join(dataDir, 'sports.json');
    
    let volleyballDetail = {};
    let sportsData = {};
    
    if (fs.existsSync(volleyballDetailPath)) {
      volleyballDetail = JSON.parse(fs.readFileSync(volleyballDetailPath, 'utf8'));
    }
    
    if (fs.existsSync(sportsJsonPath)) {
      sportsData = JSON.parse(fs.readFileSync(sportsJsonPath, 'utf8'));
    }
    
    const result = {
      ...sportsData.volleyball,
      leagueStandings: volleyballDetail.leagueStandings || [],
      recentMatches: volleyballDetail.recentMatches || [],
      upcomingMatch: volleyballDetail.upcomingMatch,
    };
    
    res.writeHead(200);
    res.end(JSON.stringify(result));
    
  } catch (error) {
    console.error('[API] Error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message }));
  }
}

module.exports = { volleyballCrawlAPI };
