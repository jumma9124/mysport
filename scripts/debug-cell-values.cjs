const puppeteer = require('puppeteer');

async function debugCellValues() {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15');

    console.log('\n=== 타자 페이지 ===');
    await page.goto('https://m.sports.naver.com/kbaseball/record/kbo?seasonCode=2025&tab=hitter', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    console.log('페이지 로드 완료');

  await new Promise(resolve => setTimeout(resolve, 5000));

  // 페이지 스크롤
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  await new Promise(resolve => setTimeout(resolve, 2000));

  const battersInfo = await page.evaluate((teamName) => {
    const result = {
      totalRows: 0,
      hwRows: [],
      allRows: []
    };

    // 테이블 행 찾기 - 다양한 선택자 시도
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
    
    result.totalRows = rows.length;
    
    rows.forEach((row) => {
      const playerInfo = row.querySelector('[class*="PlayerInfo_player_info"]');
      if (!playerInfo) return;

      const nameEl = playerInfo.querySelector('[class*="PlayerInfo_name"]');
      if (!nameEl) return;
      const name = nameEl.textContent.trim();

      const teamEl = playerInfo.querySelector('[class*="PlayerInfo_team"]');
      if (!teamEl) return;
      const team = teamEl.textContent.trim();

      // 한화 선수만
      if (!team.includes(teamName) && !team.includes('한화')) return;

      // 모든 셀 찾기
      const cells = Array.from(row.querySelectorAll('[class*="TableBody_cell"], .TableBody_cell__0H8Ds'));
      
      // 각 셀의 모든 정보 추출
      const cellData = cells.map((cell, idx) => {
        const textEl = cell.querySelector('[class*="TextInfo_text"], .TextInfo_text__y5AWv') || cell;
        const text = textEl.textContent.trim();
        const numMatch = text.match(/^(\d+\.?\d*)$/);
        
        return {
          index: idx,
          rawText: text,
          isNumber: numMatch ? true : false,
          value: numMatch ? numMatch[1] : '',
          html: cell.innerHTML.substring(0, 200)
        };
      });

      result.hwRows.push({
        name,
        team,
        cellCount: cells.length,
        cells: cellData
      });
    });

    // 처음 5개 행 정보도 저장 (디버깅용)
    rows.slice(0, 5).forEach((row, idx) => {
      const playerInfo = row.querySelector('[class*="PlayerInfo_player_info"]');
      if (playerInfo) {
        const nameEl = playerInfo.querySelector('[class*="PlayerInfo_name"]');
        const teamEl = playerInfo.querySelector('[class*="PlayerInfo_team"]');
        result.allRows.push({
          index: idx,
          name: nameEl ? nameEl.textContent.trim() : '',
          team: teamEl ? teamEl.textContent.trim() : ''
        });
      }
    });

    return result;
  }, '한화');

  console.log(`\n총 행 개수: ${battersInfo.totalRows}`);
  console.log('처음 5개 행:', JSON.stringify(battersInfo.allRows, null, 2));
  console.log('\n한화 타자 셀 데이터:');
  battersInfo.hwRows.forEach((row, idx) => {
    console.log(`\n[${idx + 1}] ${row.name} (${row.team}) - 셀 ${row.cellCount}개`);
    row.cells.forEach((cell, i) => {
      console.log(`  셀[${i}]: "${cell.rawText}" (숫자: ${cell.isNumber ? cell.value : '아님'})`);
    });
  });

  // 투수 페이지
  console.log('\n\n=== 투수 페이지 ===');
  await page.goto('https://m.sports.naver.com/kbaseball/record/kbo?seasonCode=2025&tab=pitcher', {
    waitUntil: 'networkidle2',
    timeout: 60000
  });

  await new Promise(resolve => setTimeout(resolve, 5000));

  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  await new Promise(resolve => setTimeout(resolve, 2000));

  const pitchersInfo = await page.evaluate((teamName) => {
    const result = {
      totalRows: 0,
      hwRows: []
    };

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
    
    result.totalRows = rows.length;
    
    rows.forEach((row) => {
      const playerInfo = row.querySelector('[class*="PlayerInfo_player_info"]');
      if (!playerInfo) return;

      const nameEl = playerInfo.querySelector('[class*="PlayerInfo_name"]');
      if (!nameEl) return;
      const name = nameEl.textContent.trim();

      const teamEl = playerInfo.querySelector('[class*="PlayerInfo_team"]');
      if (!teamEl) return;
      const team = teamEl.textContent.trim();

      if (!team.includes(teamName) && !team.includes('한화')) return;

      const cells = Array.from(row.querySelectorAll('[class*="TableBody_cell"], .TableBody_cell__0H8Ds'));
      
      const cellData = cells.map((cell, idx) => {
        const textEl = cell.querySelector('[class*="TextInfo_text"], .TextInfo_text__y5AWv') || cell;
        const text = textEl.textContent.trim();
        const numMatch = text.match(/^(\d+\.?\d*)$/);
        
        return {
          index: idx,
          rawText: text,
          isNumber: numMatch ? true : false,
          value: numMatch ? numMatch[1] : '',
        };
      });

      result.hwRows.push({
        name,
        team,
        cellCount: cells.length,
        cells: cellData
      });
    });

    return result;
  }, '한화');

  console.log('\n한화 투수 셀 데이터:');
  pitchersInfo.hwRows.forEach((row, idx) => {
    console.log(`\n[${idx + 1}] ${row.name} (${row.team}) - 셀 ${row.cellCount}개`);
    row.cells.forEach((cell, i) => {
      console.log(`  셀[${i}]: "${cell.rawText}" (숫자: ${cell.isNumber ? cell.value : '아님'})`);
    });
  });

    await browser.close();
  } catch (error) {
    console.error('에러 발생:', error.message);
    console.error(error.stack);
    if (browser) await browser.close();
  }
}

debugCellValues();
