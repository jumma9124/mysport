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

// 네이버 스포츠 모바일 URL
const NAVER_URLS = {
  standings: 'https://m.sports.naver.com/kbaseball/record/kbo?seasonCode=2025&tab=teamRank',
  batters: 'https://m.sports.naver.com/kbaseball/record/kbo?seasonCode=2025&tab=hitter',
  pitchers: 'https://m.sports.naver.com/kbaseball/record/kbo?seasonCode=2025&tab=pitcher',
  headToHead: 'https://m.sports.naver.com/kbaseball/record/kbo?seasonCode=2025&tab=vsTeam',
};

async function crawlStandings() {
  let browser;
  try {
    console.log('Launching browser for standings...');
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu'
        ],
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
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu'
        ],
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
        
        // 안타, 홈런, 타점 추출 - 모든 셀의 텍스트를 직접 가져와서 순서대로 추출
        let hits = 0, hr = 0, rbi = 0;
        
        // 모든 셀에서 실제 텍스트 값 추출 (원시 텍스트에서 숫자 추출)
        const cellValues = [];
        cells.forEach((cell) => {
          // 셀의 전체 텍스트 가져오기
          const text = cell.textContent.trim();
          // 텍스트에서 첫 번째 숫자만 추출 (소수점 포함)
          const numMatch = text.match(/(\d+\.?\d*)/);
          if (numMatch) {
            cellValues.push(numMatch[1]);
          } else {
            // 숫자가 없으면 null로 표시
            cellValues.push(null);
          }
        });
        
        // 셀 순서 확인: 0=순위, 1=타율, 2=타석, 3=타수, 4=안타, 5=2루타, 6=3루타, 7=홈런, 8=타점, ...
        // 타율 인덱스 찾기 (0.xxx 형식)
        const avgIdx = cellValues.findIndex(v => v && v.match(/^0?\.\d{3}$/));
        
        if (avgIdx >= 0 && cellValues.length > avgIdx + 8) {
          // 안타는 타율 다음에 타석(2), 타수(3) 뒤 (인덱스 + 4)
          if (cellValues[avgIdx + 4]) {
            const val = parseInt(cellValues[avgIdx + 4]);
            if (!isNaN(val) && val >= 0 && val < 500) hits = val;
          }
          // 홈런은 안타(4), 2루타(5), 3루타(6) 뒤 (인덱스 + 7)
          if (cellValues[avgIdx + 7]) {
            const val = parseInt(cellValues[avgIdx + 7]);
            if (!isNaN(val) && val >= 0 && val < 80) hr = val; // 홈런은 보통 80개 이하
          }
          // 타점은 홈런(7) 다음 (인덱스 + 8)
          if (cellValues[avgIdx + 8]) {
            const val = parseInt(cellValues[avgIdx + 8]);
            if (!isNaN(val) && val >= 0 && val < 200) rbi = val;
          }
        }
        
        // 위 방법이 실패하면 숫자 배열에서 범위로 찾기
        if (hits === 0 || hr === 0 || rbi === 0) {
          const allNumbers = cellValues
            .filter(v => v !== null)
            .map(v => parseInt(v))
            .filter(n => !isNaN(n) && n > 0 && n < 1000);
          
          if (hits === 0) {
            // 안타는 보통 50-250 사이
            hits = allNumbers.find(n => n >= 50 && n <= 250) || 0;
          }
          if (hr === 0) {
            // 홈런은 보통 1-60 사이
            hr = allNumbers.find(n => n >= 1 && n <= 60) || 0;
          }
          if (rbi === 0) {
            // 타점은 보통 20-150 사이, 안타와는 다름
            rbi = allNumbers.find(n => n >= 20 && n <= 150 && n !== hits && n !== hr) || 0;
          }
        }
        
        // 모든 선수 추가 (타율이 0이어도 추가, 팀 정보 포함)
        if (name) {
          result.push({ name, team, avg, hits, hr, rbi });
        }
      });
      
      return { 
        data: result
          .filter((item, index, self) => index === self.findIndex(t => t.name === item.name && t.team === item.team))
          .sort((a, b) => b.avg - a.avg),
        debug: { totalRows: rows.length, found: result.length }
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
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu'
        ],
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
        
        // 모든 선수 추가 (평균자책점이 0이어도 추가, 팀 정보 포함)
        if (name) {
          result.push({ name, team, era, wins, losses, so });
        }
      });
      
      return { 
        data: result
          .filter((item, index, self) => index === self.findIndex(t => t.name === item.name && t.team === item.team))
          .sort((a, b) => a.era - b.era),
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
    console.log('Fetching head-to-head data...');
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu'
        ],
        timeout: 60000
      });
    } catch (launchError) {
      console.error('Failed to launch browser:', launchError.message);
      throw launchError;
    }

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15');
    await page.setViewport({ width: 375, height: 667 });

    await page.goto(NAVER_URLS.headToHead, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    }).catch(async (err) => {
      console.warn('Head-to-head page navigation failed, retrying...', err.message);
      await new Promise(resolve => setTimeout(resolve, 2000));
      await page.goto(NAVER_URLS.headToHead, {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });
    });

    await new Promise(resolve => setTimeout(resolve, 5000));

    const hasSelector = await page.evaluate(() => {
      return document.querySelector('.TableBody_list__P8yRn') !== null;
    });

    if (!hasSelector) {
      console.log('Selector not found for head-to-head');
      await browser.close();
      return null;
    }

    const headToHead = await page.evaluate((teamName) => {
      const rows = document.querySelectorAll('.TableBody_item__eCenH');
      const result = [];

      rows.forEach((row) => {
        const teamEl = row.querySelector('.TeamInfo_team_name__dni7F');
        const ourTeam = teamEl ? teamEl.textContent.trim() : '';

        if (ourTeam.includes(teamName)) {
          const opponentRows = row.parentElement.querySelectorAll('.TableBody_item__eCenH');

          opponentRows.forEach((opRow, idx) => {
            if (idx === 0) return; // Skip first row (our team)

            const opTeamEl = opRow.querySelector('.TeamInfo_team_name__dni7F');
            const opponent = opTeamEl ? opTeamEl.textContent.trim() : '';

            const textElements = opRow.querySelectorAll('.TextInfo_text__ysEqh');
            const values = [];
            textElements.forEach(el => {
              const text = el.textContent.trim();
              const numMatch = text.match(/\d+/);
              if (numMatch) {
                values.push(parseInt(numMatch[0]));
              }
            });

            const wins = values[0] || 0;
            const losses = values[1] || 0;
            const draws = values[2] || 0;

            if (opponent) {
              result.push({ opponent, wins, losses, draws });
            }
          });
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
      opponent: 'KIA',
      date: '24.10.02',
      result: 'loss',
      score: '3-4',
    },
  };
}

async function crawlBaseballData() {
  try {
    console.log('Starting baseball data crawl...');

    // 모든 데이터 병렬로 크롤링
    const [standings, batters, pitchers, headToHead] = await Promise.all([
      crawlStandings(),
      crawlBatters(),
      crawlPitchers(),
      crawlHeadToHead(),
    ]);

    // 크롤링 실패 시 폴백 데이터 사용
    const fallbackData = getFallbackData();
    const standingsData = standings || fallbackData.standings;
    const battersData = batters || fallbackData.batters;
    const pitchersData = pitchers || fallbackData.pitchers;
    const headToHeadData = headToHead || fallbackData.headToHead;

    // baseball-detail.json 생성
    const baseballDetail = {
      leagueStandings: standingsData,
      batters: battersData,
      pitchers: pitchersData,
      headToHead: headToHeadData,
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
