import type { Plugin } from 'vite';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export function volleyballCrawlPlugin(): Plugin {
  return {
    name: 'volleyball-crawl-api',
    configureServer(server) {
      server.middlewares.use('/api/crawl-volleyball', async (req, res, next) => {
        try {
          // CORS 헤더 설정
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
          
          if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
          }

          console.log('[API] Volleyball crawl requested');
          
          // 크롤링 스크립트 실행
          const scriptPath = path.resolve(process.cwd(), 'scripts/crawl-volleyball.cjs');
          const { exec } = await import('child_process');
          const { promisify } = await import('util');
          const execAsync = promisify(exec);
          
          try {
            await execAsync(`node "${scriptPath}"`, {
              cwd: process.cwd(),
              maxBuffer: 10 * 1024 * 1024, // 10MB
            });
          } catch (execError: any) {
            // 실행 에러는 무시하고 계속 진행 (크롤링 실패 가능)
            console.warn('[API] Crawl script error (continuing):', execError.message);
          }
          
          // 업데이트된 데이터 읽기
          const dataDir = path.resolve(process.cwd(), 'public/data');
          const volleyballDetailPath = path.join(dataDir, 'volleyball-detail.json');
          const sportsJsonPath = path.join(dataDir, 'sports.json');
          
          let volleyballDetail: any = {};
          let sportsData: any = {};
          
          if (fs.existsSync(volleyballDetailPath)) {
            volleyballDetail = JSON.parse(fs.readFileSync(volleyballDetailPath, 'utf8'));
            console.log('[API] Loaded volleyball-detail.json:', {
              recentMatches: volleyballDetail.recentMatches?.length || 0,
              upcomingMatch: volleyballDetail.upcomingMatch ? 'exists' : 'null'
            });
          } else {
            console.warn('[API] volleyball-detail.json not found');
          }
          
          if (fs.existsSync(sportsJsonPath)) {
            sportsData = JSON.parse(fs.readFileSync(sportsJsonPath, 'utf8'));
            console.log('[API] Loaded sports.json:', {
              volleyballRecentMatches: sportsData.volleyball?.recentMatches?.length || 0,
              volleyballUpcomingMatch: sportsData.volleyball?.upcomingMatch ? 'exists' : 'null'
            });
          } else {
            console.warn('[API] sports.json not found');
          }
          
          const result = {
            ...sportsData.volleyball,
            leagueStandings: volleyballDetail.leagueStandings || [],
            leagueStandingsWomen: volleyballDetail.leagueStandingsWomen || [],
            recentMatches: volleyballDetail.recentMatches || [],
            upcomingMatch: volleyballDetail.upcomingMatch,
          };
          
          console.log('[API] Returning data:', {
            recentMatchesCount: result.recentMatches?.length || 0,
            upcomingMatch: result.upcomingMatch ? 'exists' : 'null',
            recentMatches: result.recentMatches
          });
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
          
        } catch (error: any) {
          console.error('[API] Error:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message }));
        }
      });
    },
  };
}
