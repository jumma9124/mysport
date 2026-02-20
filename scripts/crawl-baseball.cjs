const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

/**
 * 네이버 스포츠 KBO 실시간 데이터 크롤링 (Puppeteer 사용)
 * 한화 이글스 팀 정보 수집
 */

const TEAM_NAME = '한화';
const TEAM_FULL_NAME = '한화 이글스';
const TEAM_CODE = 'HH';
const DATA_DIR = path.join(__dirname, '../public/data');

// 현재 시즌 년도 계산 (동적, season-config.json 기반)
const getCurrentSeasonYear = () => {
  const now = new Date();
  const year = now.getFullYear();

  try {
    // season-config.json 읽기
    const configPath = path.join(__dirname, '../public/data/season-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const seasonStart = new Date(config.baseball.start);

      // 현재 날짜가 시즌 시작일 이전이면 이전 년도 시즌 데이터
      if (now < seasonStart) {
        console.log(`⚾ Season hasn't started yet (starts ${config.baseball.start}), using previous season data`);
        return year - 1;
      }

      console.log(`⚾ Current season is active (started ${config.baseball.start})`);
      return year;
    }
  } catch (error) {
    console.warn('Failed to read season-config.json, using fallback logic:', error.message);
  }

  // 폴백: season-config.json 읽기 실패 시 월 기반 판별
  const month = now.getMonth() + 1;
  if (month >= 1 && month <= 2) {
    return year - 1;
  }
  return year;
};

const SEASON_CODE = getCurrentSeasonYear();
console.log(`🏟️  Current season year: ${SEASON_CODE}`);

// 네이버 스포츠 모바일 URL
const NAVER_URLS = {
  standings: `https://m.sports.naver.com/kbaseball/record/kbo?seasonCode=${SEASON_CODE}&tab=teamRank`,
  batters: `https://m.sports.naver.com/kbaseball/record/kbo?seasonCode=${SEASON_CODE}&tab=hitter`,
  pitchers: `https://m.sports.naver.com/kbaseball/record/kbo?seasonCode=${SEASON_CODE}&tab=pitcher`,
};

// KBO 공식 사이트 URL
const KBO_URLS = {
  headToHead: 'https://www.koreabaseball.com/Record/TeamRank/TeamRank.aspx',
};

const isCI = !!process.env.CI;
const PUPPETEER_ARGS = isCI
  ? ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-accelerated-2d-canvas', '--disable-gpu']
  : ['--disable-dev-shm-usage', '--disable-accelerated-2d-canvas', '--disable-gpu'];

async function crawlStandings() {
  let browser;
  try {
    console.log('Launching browser for standings...');
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: PUPPETEER_ARGS,
        timeout: 60000
      });
    } catch (launchError) {
      console.error('Failed to launch browser:', launchError.message);
      console.error('Make sure Chromium is installed. Run: npm install puppeteer');
      throw launchError;
    }

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15');
    await page.setViewport({ width: 375, height: 667 });

    console.log('Navigating to Naver Sports...');
    await page.goto(NAVER_URLS.standings, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    }).catch(async (err) => {
      console.warn('First navigation attempt failed, retrying...', err.message);
      await page.goto(NAVER_URLS.standings, {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });
    });

    // React 렌더링 대기
    await page.waitForSelector('.TableBody_list__P8yRn', { timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 2000));

    const standings = await page.evaluate(() => {
      const rows = document.querySelectorAll('.TableBody_item__eCenH');
      const result = [];
      const seenTeams = new Set(); // 중복 팀 체크

      rows.forEach((row) => {
        const rankEl = row.querySelector('.TeamInfo_ranking__MqHpq');
        const rank = rankEl ? parseInt(rankEl.textContent.trim()) : 0;

        const teamEl = row.querySelector('.TeamInfo_team_name__dni7F');
        const teamName = teamEl ? teamEl.textContent.trim() : '';

        // 중복 팀 제외
        if (seenTeams.has(teamName)) {
          return;
        }

        const textElements = row.querySelectorAll('.TextInfo_text__ysEqh');
        const values = [];
        textElements.forEach(el => {
          const text = el.textContent.trim();
          values.push(text);
        });

        // values 배열: ["wra0.613", "gameBehind0.0", "winGameCount87", "drawnGameCount2", "loseGameCount55", ...]
        let winRate = 0;
        let wins = 0;
        let losses = 0;
        let draws = 0;

        values.forEach(val => {
          if (val.startsWith('wra')) {
            winRate = parseFloat(val.replace('wra', ''));
          } else if (val.startsWith('winGameCount')) {
            wins = parseInt(val.replace('winGameCount', ''));
          } else if (val.startsWith('loseGameCount')) {
            losses = parseInt(val.replace('loseGameCount', ''));
          } else if (val.startsWith('drawnGameCount')) {
            draws = parseInt(val.replace('drawnGameCount', ''));
          }
        });

        // 유효한 데이터만 추가 (wins나 losses가 0이 아닌 경우)
        if (!isNaN(rank) && teamName && (wins > 0 || losses > 0)) {
          seenTeams.add(teamName);
          result.push({
            name: teamName,
            wins,
            losses,
            draws,
            winRate,
            rank,
          });
        }
      });

      return result;
    });

    await browser.close();

    if (standings.length === 0) {
      console.warn('No standings data found');
      return null;
    }

    console.log(`✓ Found ${standings.length} teams in standings`);
    return standings;

  } catch (error) {
    if (browser) await browser.close();
    console.error('Failed to crawl standings:', error.message);
    console.error('Error details:', error.stack);
    return null;
  }
}

async function crawlBatters() {
  let browser;
  try {
    console.log('Fetching batters data...');
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: PUPPETEER_ARGS,
        timeout: 60000
      });
    } catch (launchError) {
      console.error('Failed to launch browser:', launchError.message);
      throw launchError;
    }

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15');
    await page.setViewport({ width: 375, height: 667 });

    console.log('Navigating to batters page:', NAVER_URLS.batters);
    await page.goto(NAVER_URLS.batters, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    // React 렌더링 대기 - 더 긴 대기 시간
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // 페이지 스크롤하여 지연 로딩된 콘텐츠 활성화 - 여러 번 반복
    let previousHeight = 0;
    let currentHeight = await page.evaluate(() => document.body.scrollHeight);
    let scrollAttempts = 0;
    const maxScrollAttempts = 10;
    
    while (scrollAttempts < maxScrollAttempts && currentHeight > previousHeight) {
      previousHeight = currentHeight;
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await new Promise(resolve => setTimeout(resolve, 3000));
      currentHeight = await page.evaluate(() => document.body.scrollHeight);
      scrollAttempts++;
    }
    
    // 마지막으로 한 번 더 스크롤
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 테이블이 나타날 때까지 대기
    await page.waitForSelector('table, [class*="Table"], [class*="Record"], [class*="Player"]', { timeout: 15000 }).catch(() => {
      console.log('Waiting for table content...');
    });

    const batters = await page.evaluate((teamName) => {
      const result = [];
      const seen = new Set(); // 중복 방지
      
      // 테이블 행 찾기: 다양한 선택자 시도 (투수와 동일한 구조)
      let rows = [];
      const selectors = [
        'ol[class*="TableBody_list"] > li[class*="TableBody_item"]',
        'ol.TableBody_list__n3Qd7 > li.TableBody_item__PeA+h',
        '[class*="TableBody_list"] li[class*="TableBody_item"]',
        '.TableBody_table_body__TiTrv li'
      ];
      
      for (const selector of selectors) {
        rows = Array.from(document.querySelectorAll(selector));
        if (rows.length > 10) break;
      }

      rows.forEach((row) => {
        // 선수 정보 영역 찾기 (다양한 선택자)
        const playerInfo = row.querySelector('[class*="PlayerInfo_player_info"]') ||
                          row.querySelector('.PlayerInfo_player_info__4+7eS');
        if (!playerInfo) return;
        
        // 선수 이름
        const nameEl = playerInfo.querySelector('[class*="PlayerInfo_name"]') ||
                      playerInfo.querySelector('.PlayerInfo_name__GG7ms') ||
                      playerInfo.querySelector('a[href*="/player/"]');
        if (!nameEl) return;
        const name = nameEl.textContent.trim();
        if (!name || name.length < 2) return;
        
        // 팀 이름 확인
        const teamEl = playerInfo.querySelector('[class*="PlayerInfo_team"]') ||
                      playerInfo.querySelector('.PlayerInfo_team__OYuwW');
        if (!teamEl) return;
        const team = teamEl.textContent.trim();
        
        // 중복 방지 (이름+팀 조합으로)
        const key = `${name}_${team}`;
        if (seen.has(key)) return;
        seen.add(key);
        
        // 모든 셀 찾기
        const cells = Array.from(row.querySelectorAll('[class*="TableBody_cell"], .TableBody_cell__0H8Ds'));
        if (cells.length < 5) return;
        
        // 순위 찾기 (첫 번째 셀 또는 순위 표시 요소)
        let rank = 0;
        const rankEl = row.querySelector('[class*="ranking"], [class*="rank"]') || cells[0];
        if (rankEl) {
          const rankText = rankEl.textContent.trim();
          const rankMatch = rankText.match(/(\d+)/);
          if (rankMatch) {
            rank = parseInt(rankMatch[1]);
          }
        }
        // 순위가 없으면 행 인덱스로 설정
        if (rank === 0) {
          rank = rows.indexOf(row) + 1;
        }
        
        // 타율 찾기 (highlight 클래스를 가진 셀 또는 두 번째 셀)
        let avg = 0;
        const highlightCell = row.querySelector('[class*="highlight"], .TextInfo_highlight__XWSuq');
        const avgCell = highlightCell || cells[1];
        if (avgCell) {
          const avgText = avgCell.textContent.trim();
          const avgMatch = avgText.match(/(0?\.\d{3})/);
          if (avgMatch) {
            const val = parseFloat(avgMatch[1]);
            if (val > 0 && val < 1) avg = val;
          }
        }
        
        // 안타, 홈런, 타점 추출 - 각 셀에서 숫자 추출
        let hits = 0, hr = 0, rbi = 0;

        // 각 셀에서 모든 숫자 추출
        const cellNumbers = [];
        cells.forEach(cell => {
          const text = cell.textContent.trim();
          const numbers = text.match(/\d+/g);
          if (numbers) {
            numbers.forEach(num => {
              const val = parseInt(num);
              // 유효한 통계 범위의 숫자만 수집
              if (val > 0 && val < 500) {
                cellNumbers.push(val);
              }
            });
          }
        });

        // 네이버 KBO 타자 기록 실제 순서: [순위, 타율숫자, 경기, 타수, 안타, 홈런, 2루타, 3루타, 타점, 득점, ...]
        // cellNumbers 배열의 실제 인덱스: [0:순위, 1:타율숫자, 2:경기, 3:타수, 4:안타, 5:홈런, 6:2루타번호, 7:2루타, 8:3루타번호, 9:3루타, 10:타점, 11:득점, ...]

        if (cellNumbers.length >= 11) {
          hits = cellNumbers[4];   // 안타
          hr = cellNumbers[5];     // 홈런
          rbi = cellNumbers[10];   // 타점
        }
        
        // 모든 선수 추가 (순위 정보 포함)
        if (name) {
          result.push({ name, team, rank, avg, hits, hr, rbi });
        }
      });

      return {
        data: result
          .filter((item, index, self) => index === self.findIndex(t => t.name === item.name && t.team === item.team))
          .sort((a, b) => (a.rank || 999) - (b.rank || 999)),
        debug: {
          totalRows: rows.length,
          found: result.length
        }
      };
    }, TEAM_NAME);

    if (batters && batters.debug) {
      console.log('Batters debug:', JSON.stringify(batters.debug, null, 2));
    }
    const battersData = batters?.data || batters || [];

    await browser.close();

    console.log(`✓ Found ${battersData.length} 타자`);
    return battersData.length > 0 ? battersData : null;

  } catch (error) {
    if (browser) await browser.close();
    console.error('⚠ Batters crawl error:', error.message);
    console.error('Error details:', error.stack);
    return null;
  }
}

async function crawlPitchers() {
  let browser;
  try {
    console.log('Fetching pitchers data...');
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: PUPPETEER_ARGS,
        timeout: 60000
      });
    } catch (launchError) {
      console.error('Failed to launch browser:', launchError.message);
      throw launchError;
    }

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15');
    await page.setViewport({ width: 375, height: 667 });

    console.log('Navigating to pitchers page:', NAVER_URLS.pitchers);
    await page.goto(NAVER_URLS.pitchers, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    // React 렌더링 대기 - 더 긴 대기 시간
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // 페이지 스크롤하여 지연 로딩된 콘텐츠 활성화 - 여러 번 반복
    let previousHeight = 0;
    let currentHeight = await page.evaluate(() => document.body.scrollHeight);
    let scrollAttempts = 0;
    const maxScrollAttempts = 10;
    
    while (scrollAttempts < maxScrollAttempts && currentHeight > previousHeight) {
      previousHeight = currentHeight;
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await new Promise(resolve => setTimeout(resolve, 3000));
      currentHeight = await page.evaluate(() => document.body.scrollHeight);
      scrollAttempts++;
    }
    
    // 마지막으로 한 번 더 스크롤
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 테이블이 나타날 때까지 대기
    await page.waitForSelector('table, [class*="Table"], [class*="Record"], [class*="Player"]', { timeout: 15000 }).catch(() => {
      console.log('Waiting for table content...');
    });

    const pitchers = await page.evaluate((teamName) => {
      const result = [];
      const seen = new Set();
      
      // 테이블 행 찾기: 다양한 선택자 시도
      let rows = [];
      const selectors = [
        'ol[class*="TableBody_list"] > li[class*="TableBody_item"]',
        'ol.TableBody_list__n3Qd7 > li.TableBody_item__PeA+h',
        '[class*="TableBody_list"] li[class*="TableBody_item"]',
        '.TableBody_table_body__TiTrv li'
      ];
      
      for (const selector of selectors) {
        rows = Array.from(document.querySelectorAll(selector));
        if (rows.length > 10) break;
      }
      
      rows.forEach((row) => {
        // 선수 정보 영역 찾기 (다양한 선택자)
        const playerInfo = row.querySelector('[class*="PlayerInfo_player_info"]') ||
                          row.querySelector('.PlayerInfo_player_info__4+7eS');
        if (!playerInfo) return;
        
        // 선수 이름
        const nameEl = playerInfo.querySelector('[class*="PlayerInfo_name"]') ||
                      playerInfo.querySelector('.PlayerInfo_name__GG7ms') ||
                      playerInfo.querySelector('a[href*="/player/"]');
        if (!nameEl) return;
        const name = nameEl.textContent.trim();
        if (!name || name.length < 2) return;
        
        // 팀 이름 확인
        const teamEl = playerInfo.querySelector('[class*="PlayerInfo_team"]') ||
                      playerInfo.querySelector('.PlayerInfo_team__OYuwW');
        if (!teamEl) return;
        const team = teamEl.textContent.trim();
        
        // 중복 방지 (이름+팀 조합으로)
        const key = `${name}_${team}`;
        if (seen.has(key)) return;
        seen.add(key);
        
        // 모든 셀 찾기
        const cells = Array.from(row.querySelectorAll('[class*="TableBody_cell"], .TableBody_cell__0H8Ds'));
        if (cells.length < 5) return;
        
        // 순위 찾기 (첫 번째 셀 또는 순위 표시 요소)
        let rank = 0;
        const rankEl = row.querySelector('[class*="ranking"], [class*="rank"]') || cells[0];
        if (rankEl) {
          const rankText = rankEl.textContent.trim();
          const rankMatch = rankText.match(/(\d+)/);
          if (rankMatch) {
            rank = parseInt(rankMatch[1]);
          }
        }
        // 순위가 없으면 행 인덱스로 설정
        if (rank === 0) {
          rank = rows.indexOf(row) + 1;
        }
        
        // 셀에서 직접 텍스트 추출 - 순서대로
        const cellTexts = [];
        cells.forEach((cell) => {
          const textEl = cell.querySelector('[class*="TextInfo_text"], .TextInfo_text__y5AWv') || cell;
          const text = textEl.textContent.trim();
          cellTexts.push(text);
        });
        
        // 셀 순서: 0=순위(숨김), 1=평균자책점, 2=경기, 3=승, 4=패, 5=세이브, 6=홀드, 7=이닝, 8=탈삼진, ...
        // 평균자책점 찾기 (highlight 셀 또는 두 번째 셀)
        let era = 0;
        const highlightCell = row.querySelector('[class*="highlight"], .TextInfo_highlight__XWSuq');
        if (highlightCell) {
          const eraText = highlightCell.textContent.trim();
          const eraMatch = eraText.match(/(\d+\.\d{2})/);
          if (eraMatch) {
            era = parseFloat(eraMatch[1]);
          }
        } else if (cellTexts.length > 1) {
          const eraMatch = cellTexts[1].match(/(\d+\.\d{2})/);
          if (eraMatch) {
            era = parseFloat(eraMatch[1]);
          }
        }
        
        // 승, 패, 탈삼진 추출 - 셀 인덱스로 직접 추출
        let wins = 0, losses = 0, so = 0, games = 0;
        
        // 경기 수 (인덱스 2)
        if (cellTexts.length > 2) {
          const gamesMatch = cellTexts[2].match(/(\d+)/);
          if (gamesMatch) games = parseInt(gamesMatch[1]);
        }
        
        // 승 (인덱스 3)
        if (cellTexts.length > 3) {
          const winsMatch = cellTexts[3].match(/(\d+)/);
          if (winsMatch) wins = parseInt(winsMatch[1]);
        }
        
        // 패 (인덱스 4)
        if (cellTexts.length > 4) {
          const lossesMatch = cellTexts[4].match(/(\d+)/);
          if (lossesMatch) losses = parseInt(lossesMatch[1]);
        }
        
        // 탈삼진 (인덱스 8)
        if (cellTexts.length > 8) {
          const soMatch = cellTexts[8].match(/(\d+)/);
          if (soMatch) so = parseInt(soMatch[1]);
        }
        
        // 모든 선수 추가 (순위 정보 포함)
        if (name) {
          result.push({ name, team, rank, era, wins, losses, so });
        }
      });
      
      return { 
        data: result
          .filter((item, index, self) => index === self.findIndex(t => t.name === item.name && t.team === item.team))
          .sort((a, b) => (a.rank || 999) - (b.rank || 999)),
        debug: { totalRows: rows.length, found: result.length }
      };
    }, TEAM_NAME);

    if (pitchers && pitchers.debug) {
      console.log('Pitchers debug:', JSON.stringify(pitchers.debug, null, 2));
    }
    const pitchersData = pitchers?.data || pitchers || [];

    await browser.close();

    console.log(`✓ Found ${pitchersData.length} 투수`);
    return pitchersData.length > 0 ? pitchersData : null;

  } catch (error) {
    if (browser) await browser.close();
    console.error('⚠ Pitchers crawl error:', error.message);
    console.error('Error details:', error.stack);
    return null;
  }
}

async function crawlHeadToHead() {
  let browser;
  try {
    console.log('Fetching head-to-head data from KBO...');
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: PUPPETEER_ARGS,
        timeout: 60000
      });
    } catch (launchError) {
      console.error('Failed to launch browser:', launchError.message);
      throw launchError;
    }

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });

    await page.goto(KBO_URLS.headToHead, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    // 디버깅: 페이지 구조 확인
    const debugInfo = await page.evaluate(() => {
      const tables = document.querySelectorAll('table');
      const info = {
        tablesCount: tables.length,
        tables: []
      };

      tables.forEach((table, idx) => {
        const tableInfo = {
          index: idx,
          className: table.className,
          id: table.id,
          rowsCount: table.querySelectorAll('tr').length,
          headersCount: table.querySelectorAll('th').length,
          firstRowText: ''
        };

        const firstRow = table.querySelector('tbody tr');
        if (firstRow) {
          tableInfo.firstRowText = firstRow.textContent.trim().substring(0, 200);
        }

        info.tables.push(tableInfo);
      });

      return info;
    });

    console.log('=== KBO Page Debug ===');
    console.log(JSON.stringify(debugInfo, null, 2));

    const headToHead = await page.evaluate((teamName) => {
      const result = [];

      // KBO 사이트의 두 번째 테이블 (팀간 승패표) 찾기
      const tables = document.querySelectorAll('table.tData');
      if (tables.length < 2) {
        console.log('Head-to-head table not found');
        return result;
      }

      const table = tables[1]; // 두 번째 테이블이 팀간 승패표
      const rows = Array.from(table.querySelectorAll('tbody tr'));
      console.log(`Found ${rows.length} rows in head-to-head table`);

      // 테이블 헤더에서 팀 이름 순서 확인
      const headerRow = table.querySelector('thead tr');
      if (!headerRow) {
        console.log('Header row not found');
        return result;
      }

      const headers = Array.from(headerRow.querySelectorAll('th'));
      console.log(`Found ${headers.length} header cells`);

      // 헤더에서 팀 이름만 추출 (첫 번째는 "팀명", 마지막은 "합계" 제외)
      const teamNames = [];
      for (let i = 1; i < headers.length - 1; i++) {
        const headerText = headers[i].textContent.trim();
        // 형식: "LG\n(승-패-무)" -> "LG"만 추출
        const teamName = headerText.split('\n')[0].trim();
        teamNames.push(teamName);
      }

      console.log('Team names from headers:', teamNames);

      rows.forEach((row) => {
        const cells = Array.from(row.querySelectorAll('td'));
        if (cells.length < 2) return;

        // 첫 번째 셀에서 팀 이름 찾기
        const teamCell = cells[0];
        const teamText = teamCell.textContent.trim();

        if (teamText.includes(teamName) || teamText.includes('한화')) {
          console.log(`Found our team row: ${teamText}`);

          // 각 팀별 전적 파싱 (첫 번째 셀은 팀 이름, 마지막 셀은 합계이므로 건너뜀)
          for (let i = 1; i < cells.length - 1 && i - 1 < teamNames.length; i++) {
            const cellText = cells[i].textContent.trim();

            // "■"는 자기 자신이므로 건너뜀
            if (cellText === '■') continue;

            // 형식: "5-4-1" (승-패-무)
            const parts = cellText.split('-').map(p => parseInt(p.trim()) || 0);

            if (parts.length >= 2) {
              const opponent = teamNames[i - 1];
              result.push({
                opponent: opponent,
                wins: parts[0],
                losses: parts[1],
                draws: parts.length > 2 ? parts[2] : 0
              });
              console.log(`${opponent}: ${parts[0]}-${parts[1]}-${parts.length > 2 ? parts[2] : 0}`);
            }
          }
        }
      });

      return result;
    }, TEAM_NAME);

    await browser.close();

    console.log(`✓ Found head-to-head data for ${headToHead.length} teams`);
    return headToHead;

  } catch (error) {
    if (browser) await browser.close();
    console.error('⚠ Head-to-head crawl error:', error.message);
    console.error('Error details:', error.stack);
    return null;
  }
}

async function crawlLastSeries() {
  let browser;
  try {
    console.log('Fetching last series data (off-season mode)...');
    browser = await puppeteer.launch({
      headless: true,
      args: PUPPETEER_ARGS,
      timeout: 60000
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15');
    await page.setViewport({ width: 375, height: 667 });

    // 시즌 종료 후: 10월부터 역순으로 한화 마지막 경기 찾기
    const seasonYear = getCurrentSeasonYear(); // 동적으로 시즌 년도 계산

    // 10월 마지막 날부터 시작해서 한화 마지막 경기 찾기
    for (let day = 31; day >= 1; day--) {
      const dateStr = `${seasonYear}-10-${String(day).padStart(2, '0')}`;
      const scheduleUrl = `https://m.sports.naver.com/kbaseball/schedule/index?date=${dateStr}`;

      await page.goto(scheduleUrl, {
        waitUntil: 'networkidle2',
        timeout: 60000
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      const lastSeries = await page.evaluate((teamName, dateStr) => {
        // 모든 경기 아이템 찾기
        const matchItems = document.querySelectorAll('[class*="MatchBox_match_item"]');

        for (const item of matchItems) {
          const itemText = item.textContent || '';

          // 한화 경기인지 확인
          if (!itemText.includes('한화')) continue;

          // 종료된 경기인지 확인
          const statusEl = item.querySelector('[class*="MatchBox_status"]');
          if (!statusEl || !statusEl.textContent.includes('종료')) continue;

          // 팀 이름 추출 (정확한 클래스명 사용)
          const teamEls = item.querySelectorAll('[class*="MatchBoxHeadToHeadArea_team__"]');
          const scoreEls = item.querySelectorAll('[class*="MatchBoxHeadToHeadArea_score__"]');

          if (teamEls.length < 2 || scoreEls.length < 2) continue;

          const team1 = teamEls[0].textContent.trim();
          const team2 = teamEls[1].textContent.trim();
          const score1 = parseInt(scoreEls[0].textContent.trim()) || 0;
          const score2 = parseInt(scoreEls[1].textContent.trim()) || 0;

          // 한화 기준으로 정리
          const isHanwha1 = team1.includes('한화');
          const hanwhaScore = isHanwha1 ? score1 : score2;
          const opponentScore = isHanwha1 ? score2 : score1;
          const opponent = isHanwha1 ? team2 : team1;

          // 승패 판정
          let result = 'draw';
          if (hanwhaScore > opponentScore) result = 'win';
          else if (hanwhaScore < opponentScore) result = 'loss';

          return {
            opponent: opponent,
            date: dateStr,
            result: result,
            score: `${hanwhaScore}-${opponentScore}`
          };
        }

        return null;
      }, TEAM_NAME, dateStr);

      if (lastSeries) {
        await browser.close();
        console.log(`✓ Found last series: vs ${lastSeries.opponent} (${lastSeries.result}) ${lastSeries.score} on ${lastSeries.date}`);
        return lastSeries;
      }
    }

    await browser.close();
    console.warn('Could not find last series data in October');
    return null;

  } catch (error) {
    if (browser) await browser.close();
    console.error('⚠ Last series crawl error:', error.message);
    return null;
  }
}

function getFallbackData() {
  console.log('Using fallback data (previous season stats)...');

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
        wins: 66,
        losses: 76,
        draws: 2,
        winRate: 0.465,
        rank: 8,
      },
      {
        name: 'LG 트윈스',
        wins: 76,
        losses: 66,
        draws: 2,
        winRate: 0.535,
        rank: 3,
      },
    ],
    batters: [
      { name: '페라자', avg: 0.298, hits: 145, hr: 28, rbi: 89 },
      { name: '노시환', avg: 0.285, hits: 132, hr: 24, rbi: 78 },
      { name: '채은성', avg: 0.274, hits: 128, hr: 18, rbi: 72 },
      { name: '문현빈', avg: 0.263, hits: 95, hr: 8, rbi: 45 },
      { name: '안치홍', avg: 0.275, hits: 112, hr: 12, rbi: 56 },
    ],
    pitchers: [
      { name: '류현진', era: 3.45, wins: 7, losses: 6, so: 80 },
      { name: '문동주', era: 3.89, wins: 10, losses: 9, so: 132 },
      { name: '엔스', era: 4.88, wins: 8, losses: 13, so: 91 },
      { name: '바리아', era: 5.40, wins: 6, losses: 7, so: 72 },
      { name: '위니', era: 4.25, wins: 6, losses: 8, so: 68 },
    ],
    headToHead: [
      { opponent: 'KIA', wins: 5, losses: 11, draws: 0 },
      { opponent: '삼성', wins: 6, losses: 10, draws: 0 },
      { opponent: 'LG', wins: 8, losses: 8, draws: 0 },
      { opponent: '두산', wins: 9, losses: 7, draws: 0 },
      { opponent: 'KT', wins: 8, losses: 8, draws: 0 },
      { opponent: 'SSG', wins: 9, losses: 7, draws: 0 },
      { opponent: '롯데', wins: 9, losses: 7, draws: 0 },
      { opponent: 'NC', wins: 6, losses: 10, draws: 0 },
      { opponent: '키움', wins: 6, losses: 8, draws: 0 },
    ],
    lastSeries: {
      opponent: 'LG',
      date: '2025-10-31',
      result: 'loss',
      score: '1-4',
    },
  };
}

async function crawlBaseballData() {
  try {
    console.log('Starting baseball data crawl...');

    // 모든 데이터 병렬로 크롤링
    const [standings, batters, pitchers, headToHead, lastSeries] = await Promise.all([
      crawlStandings(),
      crawlBatters(),
      crawlPitchers(),
      crawlHeadToHead(),
      crawlLastSeries(),
    ]);

    // 크롤링 실패 시 폴백 데이터 사용
    const fallbackData = getFallbackData();
    const standingsData = standings || fallbackData.standings;
    const battersData = batters || fallbackData.batters;
    const pitchersData = pitchers || fallbackData.pitchers;
    const headToHeadData = headToHead || fallbackData.headToHead;
    const lastSeriesData = lastSeries || fallbackData.lastSeries;

    // baseball-detail.json 생성
    const baseballDetail = {
      leagueStandings: standingsData,
      batters: battersData,
      pitchers: pitchersData,
      headToHead: headToHeadData,
      lastSeries: lastSeriesData,
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
