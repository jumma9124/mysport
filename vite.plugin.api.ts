import type { Plugin } from 'vite';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export function baseballCrawlPlugin(): Plugin {
  return {
    name: 'baseball-crawl-api',
    configureServer(server) {
      server.middlewares.use('/api/crawl-baseball', async (req, res, next) => {
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

          console.log('[API] Baseball crawl requested');

          // 크롤링 스크립트 실행
          const scriptPath = path.resolve(process.cwd(), 'scripts/crawl-baseball.cjs');
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
          const baseballDetailPath = path.join(dataDir, 'baseball-detail.json');
          const sportsJsonPath = path.join(dataDir, 'sports.json');

          let baseballDetail: any = {};
          let sportsData: any = {};

          if (fs.existsSync(baseballDetailPath)) {
            baseballDetail = JSON.parse(fs.readFileSync(baseballDetailPath, 'utf8'));
            console.log('[API] Loaded baseball-detail.json:', {
              leagueStandings: baseballDetail.leagueStandings?.length || 0,
              pitchers: baseballDetail.pitchers?.length || 0,
              batters: baseballDetail.batters?.length || 0
            });
          } else {
            console.warn('[API] baseball-detail.json not found');
          }

          if (fs.existsSync(sportsJsonPath)) {
            sportsData = JSON.parse(fs.readFileSync(sportsJsonPath, 'utf8'));
            console.log('[API] Loaded sports.json');
          } else {
            console.warn('[API] sports.json not found');
          }

          const result = {
            ...sportsData.baseball,
            leagueStandings: baseballDetail.leagueStandings || [],
            pitchers: baseballDetail.pitchers || [],
            batters: baseballDetail.batters || [],
            headToHead: baseballDetail.headToHead || [],
            lastSeries: baseballDetail.lastSeries,
            currentSeries: baseballDetail.currentSeries,
          };

          console.log('[API] Returning baseball data:', {
            leagueStandingsCount: result.leagueStandings?.length || 0,
            pitchersCount: result.pitchers?.length || 0,
            battersCount: result.batters?.length || 0
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

export function internationalSportsCrawlPlugin(): Plugin {
  return {
    name: 'international-sports-crawl-api',
    configureServer(server) {
      server.middlewares.use('/api/crawl-international', async (req, res, next) => {
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

          console.log('[API] International sports crawl requested');

          // 크롤링 스크립트 실행
          const scriptPath = path.resolve(process.cwd(), 'scripts/crawl-winter-olympics.cjs');
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
          const eventsPath = path.join(dataDir, 'major-events.json');
          const sportsJsonPath = path.join(dataDir, 'sports.json');
          const winterOlympicsPath = path.join(dataDir, 'winter-olympics-detail.json');

          let events: any = [];
          let sportsData: any = {};
          let winterOlympicsData: any = null;

          if (fs.existsSync(eventsPath)) {
            events = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));
            console.log('[API] Loaded major-events.json:', events.length);
          } else {
            console.warn('[API] major-events.json not found');
          }

          if (fs.existsSync(sportsJsonPath)) {
            sportsData = JSON.parse(fs.readFileSync(sportsJsonPath, 'utf8'));
            console.log('[API] Loaded sports.json');
          } else {
            console.warn('[API] sports.json not found');
          }

          if (fs.existsSync(winterOlympicsPath)) {
            winterOlympicsData = JSON.parse(fs.readFileSync(winterOlympicsPath, 'utf8'));
            console.log('[API] Loaded winter-olympics-detail.json');
          } else {
            console.warn('[API] winter-olympics-detail.json not found');
          }

          const result = {
            ...sportsData.international,
            winterOlympics: winterOlympicsData,
            data: {
              events
            }
          };

          console.log('[API] Returning international sports data');

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
