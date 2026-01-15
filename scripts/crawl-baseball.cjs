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
    
    // 페이지 스크롤하여 지연 로딩된 콘텐츠 활성화
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 2);
    });
    await new Promise(resolve => setTimeout(resolve, 2000));
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
      
      // 모든 행 찾기 (다양한 구조 지원)
      let rows = [];
      const selectors = [
        'table tbody tr',
        'tbody tr',
        'tr',
        '[class*="Row"]',
        '[class*="Item"]',
        '[class*="Player"]',
        'li[class*="player"]',
        'div[class*="player"]',
        'div[class*="record"]'
      ];
      
      for (const selector of selectors) {
        try {
          const found = document.querySelectorAll(selector);
          if (found.length > 3) {
            rows = Array.from(found);
            break;
          }
        } catch (e) {}
      }
      
      // 행을 찾지 못했으면 모든 클릭 가능한 요소나 블록 요소 찾기
      if (rows.length === 0) {
        const allElements = document.querySelectorAll('div, li, article, section');
        rows = Array.from(allElements).filter(el => {
          const text = el.textContent || '';
          return text.length > 20 && text.length < 500; // 적절한 크기의 텍스트 블록
        });
      }

      // 디버깅 정보를 반환
      const debugInfo = {
        totalRows: rows.length,
        bodyTextLength: (document.body.innerText || '').length,
        hasTeamName: (document.body.innerText || '').includes(teamName),
        sampleRowText: rows.length > 0 ? rows[0].textContent.substring(0, 200) : 'No rows'
      };

      rows.forEach((row) => {
        const rowText = row.textContent || '';
        
        // 한화 소속 선수 찾기 (더 넓은 범위로 검색)
        const hasTeam = rowText.includes(teamName) || 
                       rowText.includes('한화') || 
                       rowText.includes('HH');
        
        if (!hasTeam) return;
        
        // 테이블 셀에서 데이터 추출
        const cells = Array.from(row.querySelectorAll('td, th'));
        if (cells.length < 3) return;
        
        // 각 셀의 텍스트 추출
        const cellTexts = cells.map(c => c.textContent.trim().replace(/\s+/g, ' '));
        const fullRowText = cellTexts.join(' ');
        
        // 선수 이름 찾기 (더 관대한 조건)
        let name = '';
        const excludeWords = ['한화', '이글스', '팀', '순위', '기록', '타자', '투수', '승', '패', 'LG', 'KIA', 'SSG', '삼성', 'NC', 'KT', '롯데', '두산', '키움', '홈런', '타점', '안타', '평균자책점', '탈삼진'];
        
        // 셀 순회하며 이름 찾기
        for (let i = 0; i < cellTexts.length; i++) {
          const text = cellTexts[i];
          // 한글 이름 (2-4자)
          if (/^[가-힣]{2,4}$/.test(text) && !excludeWords.includes(text)) {
            name = text;
            break;
          }
          // 영문 이름
          if (/^[A-Za-z]{3,15}$/.test(text) && !excludeWords.includes(text)) {
            name = text;
            break;
          }
        }
        
        // 이름을 찾지 못했으면 전체 텍스트에서 검색
        if (!name) {
          const nameMatch = fullRowText.match(/\b([가-힣]{2,4}|[A-Za-z]{3,15})\b/);
          if (nameMatch && !excludeWords.includes(nameMatch[1])) {
            name = nameMatch[1];
          }
        }
        
        if (!name || seen.has(name)) return;
        seen.add(name);
        
        // 타율 찾기 (0.xxx 형식)
        let avg = 0;
        const avgMatches = fullRowText.match(/\b(0?\.\d{3})\b/g) || [];
        for (const match of avgMatches) {
          const val = parseFloat(match);
          if (val > 0 && val < 1) {
            avg = val;
            break;
          }
        }
        
        // 숫자 추출 (정수만)
        const allNumbers = fullRowText.match(/\b\d{1,3}\b/g) || [];
        const numbers = allNumbers.map(n => parseInt(n)).filter(n => n > 0 && n < 1000);
        
        // 데이터 추출
        let hits = 0, hr = 0, rbi = 0;
        if (numbers.length >= 2) {
          // 순서 가정: 첫 번째가 안타일 가능성, 중간이 홈런, 마지막이 타점
          hits = numbers[0] || 0;
          hr = numbers.find(n => n >= 1 && n <= 60) || numbers[1] || 0;
          rbi = numbers[numbers.length - 1] || 0;
        }
        
        // 타율이 있으면 추가 (이름만 있어도 일단 추가)
        if (name) {
          result.push({ name, avg: avg || 0, hits, hr, rbi });
        }
      });

      // 중복 제거 및 정렬 (타율 순)
      const finalResult = result
        .filter((item, index, self) => 
          index === self.findIndex(t => t.name === item.name)
        )
        .sort((a, b) => b.avg - a.avg)
        .slice(0, 20); // 상위 20명만
      
      return { data: finalResult, debug: debugInfo };
    }, TEAM_NAME);

    if (batters && batters.debug) {
      console.log('Batters debug:', JSON.stringify(batters.debug, null, 2));
    }
    const battersData = batters?.data || batters || [];

    await browser.close();

    console.log(`✓ Found ${battersData.length} batters`);
    if (battersData.length > 0) {
      console.log('Sample:', JSON.stringify(battersData.slice(0, 3), null, 2));
    }
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
    
    // 페이지 스크롤하여 지연 로딩된 콘텐츠 활성화
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 2);
    });
    await new Promise(resolve => setTimeout(resolve, 2000));
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
      
      // 전체 페이지 텍스트에서 한화 관련 부분 찾기
      const bodyText = document.body.innerText || '';
      if (!bodyText.includes(teamName) && !bodyText.includes('한화')) {
        return { data: [], debug: { message: 'Team not found in page' } };
      }
      
      // 텍스트를 줄 단위로 분리
      const lines = bodyText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      
      // 한화 관련 라인 찾기
      const teamLines = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes(teamName) || line.includes('한화')) {
          for (let j = Math.max(0, i - 2); j < Math.min(lines.length, i + 10); j++) {
            if (!teamLines.includes(lines[j])) {
              teamLines.push(lines[j]);
            }
          }
        }
      }
      
      // 각 라인에서 선수 정보 추출
      for (const line of teamLines) {
        const nameMatches = line.match(/([가-힣]{2,4}|[A-Za-z]{3,15})/g);
        if (!nameMatches) continue;
        
        const excludeWords = ['한화', '이글스', '팀', '순위', '기록', '타자', '투수', '승', '패', 'LG', 'KIA', 'SSG', '삼성', 'NC', 'KT', '롯데', '두산', '키움'];
        
        for (const nameMatch of nameMatches) {
          if (excludeWords.includes(nameMatch) || seen.has(nameMatch)) continue;
          
          // 평균자책점 찾기 (x.xx 형식, 0~20 범위)
          const eraMatches = line.match(/\b(\d+\.\d{2})\b/g) || [];
          let era = 0;
          for (const match of eraMatches) {
            const val = parseFloat(match);
            if (val > 0 && val < 20) {
              era = val;
              break;
            }
          }
          
          // 숫자 추출
          const numbers = (line.match(/\b\d{1,3}\b/g) || []).map(n => parseInt(n)).filter(n => n > 0 && n < 1000);
          
          // 평균자책점이 있거나 숫자가 2개 이상 있으면 선수로 간주 (조건 완화)
          if (era > 0 || numbers.length >= 2) {
            const wins = numbers[0] || 0;
            const losses = numbers[1] || 0;
            const so = numbers.find(n => n >= 30) || (numbers.length > 2 ? numbers[numbers.length - 1] : 0);
            
            seen.add(nameMatch);
            result.push({ name: nameMatch, era, wins, losses, so });
          }
        }
      }
      
      return { 
        data: result
          .filter((item, index, self) => index === self.findIndex(t => t.name === item.name))
          .sort((a, b) => a.era - b.era)
          .slice(0, 20),
        debug: { totalLines: lines.length, teamLines: teamLines.length }
      };
    }, TEAM_NAME);

    if (pitchers && pitchers.debug) {
      console.log('Pitchers debug:', JSON.stringify(pitchers.debug, null, 2));
    }
    const pitchersData = pitchers?.data || pitchers || [];

    await browser.close();

    console.log(`✓ Found ${pitchersData.length} pitchers`);
    if (pitchersData.length > 0) {
      console.log('Sample:', JSON.stringify(pitchersData.slice(0, 3), null, 2));
    }
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
