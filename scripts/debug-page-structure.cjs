const puppeteer = require('puppeteer');

async function debugPageStructure() {
  const browser = await puppeteer.launch({
    headless: false, // 화면에 보이도록
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15');
  await page.setViewport({ width: 375, height: 667 });

  // 타자 페이지
  console.log('\n=== BATTERS PAGE STRUCTURE ===');
  await page.goto('https://m.sports.naver.com/kbaseball/record/kbo?seasonCode=2025&tab=hitter', {
    waitUntil: 'networkidle2',
    timeout: 60000
  });

  await new Promise(resolve => setTimeout(resolve, 10000));

  const battersStructure = await page.evaluate(() => {
    const result = {
      tables: document.querySelectorAll('table').length,
      rows: document.querySelectorAll('tr').length,
      firstRow: null,
      sampleRows: []
    };

    // 첫 번째 테이블 행 찾기
    const rows = Array.from(document.querySelectorAll('tr'));
    if (rows.length > 0) {
      const firstRow = rows.find(row => row.textContent.includes('한화'));
      if (firstRow) {
        const cells = Array.from(firstRow.querySelectorAll('td, th'));
        result.firstRow = {
          html: firstRow.outerHTML.substring(0, 1000),
          text: firstRow.textContent,
          cells: cells.map((c, i) => ({
            index: i,
            text: c.textContent.trim(),
            class: c.className
          }))
        };

        // 한화 관련 행 3개 샘플
        const hwRows = rows.filter(row => row.textContent.includes('한화')).slice(0, 3);
        result.sampleRows = hwRows.map(row => ({
          text: row.textContent.trim().substring(0, 200),
          cells: Array.from(row.querySelectorAll('td, th')).map(c => c.textContent.trim())
        }));
      }
    }

    return result;
  });

  console.log('Batters structure:', JSON.stringify(battersStructure, null, 2));

  // 투수 페이지
  console.log('\n=== PITCHERS PAGE STRUCTURE ===');
  await page.goto('https://m.sports.naver.com/kbaseball/record/kbo?seasonCode=2025&tab=pitcher', {
    waitUntil: 'networkidle2',
    timeout: 60000
  });

  await new Promise(resolve => setTimeout(resolve, 10000));

  const pitchersStructure = await page.evaluate(() => {
    const result = {
      tables: document.querySelectorAll('table').length,
      rows: document.querySelectorAll('tr').length,
      firstRow: null,
      sampleRows: []
    };

    const rows = Array.from(document.querySelectorAll('tr'));
    if (rows.length > 0) {
      const firstRow = rows.find(row => row.textContent.includes('한화'));
      if (firstRow) {
        const cells = Array.from(firstRow.querySelectorAll('td, th'));
        result.firstRow = {
          html: firstRow.outerHTML.substring(0, 1000),
          text: firstRow.textContent,
          cells: cells.map((c, i) => ({
            index: i,
            text: c.textContent.trim(),
            class: c.className
          }))
        };

        const hwRows = rows.filter(row => row.textContent.includes('한화')).slice(0, 3);
        result.sampleRows = hwRows.map(row => ({
          text: row.textContent.trim().substring(0, 200),
          cells: Array.from(row.querySelectorAll('td, th')).map(c => c.textContent.trim())
        }));
      }
    }

    return result;
  });

  console.log('Pitchers structure:', JSON.stringify(pitchersStructure, null, 2));

  await browser.close();
}

debugPageStructure();
