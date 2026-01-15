const puppeteer = require('puppeteer');

async function debugPitcherStructure() {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15');
  await page.setViewport({ width: 375, height: 667 });

  console.log('\n=== 투수 페이지 ===');
  await page.goto('https://m.sports.naver.com/kbaseball/record/kbo?seasonCode=2025&tab=pitcher', {
    waitUntil: 'networkidle2',
    timeout: 60000
  });

  await new Promise(resolve => setTimeout(resolve, 10000));

  // 스크롤
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

  const info = await page.evaluate(() => {
    const result = {
      firstRow: null,
      allRows: []
    };

    const rows = Array.from(document.querySelectorAll('ol[class*="TableBody_list"] > li[class*="TableBody_item"]'));
    
    if (rows.length > 0) {
      const firstRow = rows[0];
      const playerInfo = firstRow.querySelector('[class*="PlayerInfo_player_info"]');
      
      if (playerInfo) {
        const nameEl = playerInfo.querySelector('[class*="PlayerInfo_name"]');
        const teamEl = playerInfo.querySelector('[class*="PlayerInfo_team"]');
        const name = nameEl ? nameEl.textContent.trim() : '';
        const team = teamEl ? teamEl.textContent.trim() : '';
        
        const cells = Array.from(firstRow.querySelectorAll('[class*="TableBody_cell"], .TableBody_cell__0H8Ds'));
        
        const cellData = cells.map((cell, idx) => {
          const textEl = cell.querySelector('[class*="TextInfo_text"], .TextInfo_text__y5AWv') || cell;
          const text = textEl.textContent.trim();
          const innerHTML = cell.innerHTML.substring(0, 200);
          
          return {
            index: idx,
            text: text,
            innerHTML: innerHTML
          };
        });
        
        result.firstRow = {
          name,
          team,
          cellCount: cells.length,
          cells: cellData
        };
      }
      
      // 처음 5개 행 정보
      rows.slice(0, 5).forEach((row, idx) => {
        const playerInfo = row.querySelector('[class*="PlayerInfo_player_info"]');
        if (playerInfo) {
          const nameEl = playerInfo.querySelector('[class*="PlayerInfo_name"]');
          const teamEl = playerInfo.querySelector('[class*="PlayerInfo_team"]');
          const name = nameEl ? nameEl.textContent.trim() : '';
          const team = teamEl ? teamEl.textContent.trim() : '';
          
          const cells = Array.from(row.querySelectorAll('[class*="TableBody_cell"], .TableBody_cell__0H8Ds'));
          const cellTexts = cells.map(cell => {
            const textEl = cell.querySelector('[class*="TextInfo_text"], .TextInfo_text__y5AWv') || cell;
            return textEl.textContent.trim();
          });
          
          result.allRows.push({
            index: idx,
            name,
            team,
            cells: cellTexts
          });
        }
      });
    }

    return result;
  });

  console.log('\n첫 번째 행 상세 정보:');
  console.log(JSON.stringify(info.firstRow, null, 2));
  
  console.log('\n처음 5개 행:');
  info.allRows.forEach(row => {
    console.log(`\n[${row.index + 1}] ${row.name} (${row.team})`);
    row.cells.forEach((cell, i) => {
      console.log(`  셀[${i}]: "${cell}"`);
    });
  });

  await browser.close();
}

debugPitcherStructure();
