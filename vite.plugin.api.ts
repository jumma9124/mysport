import type { Plugin } from 'vite';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execFileAsync = promisify(execFile);

// localhost origin만 허용하는 CORS 헤더 설정
function setCorsHeaders(req: any, res: any): void {
  const origin = req.headers.origin || '';
  if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// 크롤링 스크립트 실행 (쉘을 거치지 않는 execFile 사용)
async function runCrawlScript(scriptName: string): Promise<void> {
  const scriptPath = path.resolve(process.cwd(), `scripts/${scriptName}`);
  try {
    await execFileAsync('node', [scriptPath], {
      cwd: process.cwd(),
      maxBuffer: 10 * 1024 * 1024, // 10MB
    });
  } catch (execError: any) {
    console.warn(`[API] Crawl script error (continuing):`, execError.message);
  }
}

export function baseballCrawlPlugin(): Plugin {
  return {
    name: 'baseball-crawl-api',
    configureServer(server) {
      server.middlewares.use('/api/crawl-baseball', async (req, res, next) => {
        try {
          setCorsHeaders(req, res);

          if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
          }

          console.log('[API] Baseball crawl requested');

          await runCrawlScript('crawl-baseball.cjs');

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
          res.end(JSON.stringify({ error: 'Baseball crawl failed' }));
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
          setCorsHeaders(req, res);

          if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
          }

          console.log('[API] International sports crawl requested');

          await runCrawlScript('crawl-winter-olympics.cjs');

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
          res.end(JSON.stringify({ error: 'International sports crawl failed' }));
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
          setCorsHeaders(req, res);

          if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
          }

          console.log('[API] Volleyball crawl requested');

          await runCrawlScript('crawl-volleyball.cjs');

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
          res.end(JSON.stringify({ error: 'Volleyball crawl failed' }));
        }
      });
    },
  };
}
