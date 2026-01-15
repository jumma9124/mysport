const puppeteer = require('puppeteer');

async function debugRealStructure() {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15');
  await page.setViewport({ width: 375, height: 667 });

  // 타자 페이지
  console.log('\n=== BATTERS PAGE ===');
  await page.goto('https://m.sports.naver.com/kbaseball/record/kbo?seasonCode=2025&tab=hitter', {
    waitUntil: 'networkidle2',
    timeout: 60000
  });

  await new Promise(resolve => setTimeout(resolve, 10000));
  
  // 페이지 스크롤
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  await new Promise(resolve => setTimeout(resolve, 3000));

  const battersInfo = await page.evaluate((teamName) => {
    const result = {
      bodyText: document.body.innerText.substring(0, 1000),
      hasTeamName: document.body.innerText.includes(teamName),
      allRows: [],
      hwRows: []
    };

    // 모든 tr 찾기
    const allRows = Array.from(document.querySelectorAll('tr'));
    result.allRows = allRows.map((row, idx) => {
      const text = row.textContent.trim();
      return {
        index: idx,
        text: text.substring(0, 150),
        hasTeam: text.includes(teamName),
        cellCount: row.querySelectorAll('td, th').length,
        cells: Array.from(row.querySelectorAll('td, th')).slice(0, 10).map(c => c.textContent.trim())
      };
    }).slice(0, 30); // 처음 30개만

    // 한화 관련 행만
    result.hwRows = result.allRows.filter(r => r.hasTeam).slice(0, 5);

    return result;
  }, '한화');

  console.log('Body text sample:', battersInfo.bodyText);
  console.log('Has team name:', battersInfo.hasTeamName);
  console.log('\nFirst 5 rows with team:');
  console.log(JSON.stringify(battersInfo.hwRows, null, 2));

  await browser.close();
}

debugRealStructure();
