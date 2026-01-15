const puppeteer = require('puppeteer');

async function debugStandings() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15');

  await page.goto('https://m.sports.naver.com/kbaseball/record/kbo?seasonCode=2024&tab=teamRank', {
    waitUntil: 'networkidle2',
    timeout: 30000
  });

  await page.waitForSelector('.TableBody_list__P8yRn', { timeout: 10000 });
  await new Promise(resolve => setTimeout(resolve, 2000));

  const debugInfo = await page.evaluate(() => {
    const rows = document.querySelectorAll('.TableBody_item__eCenH');
    const result = [];

    rows.forEach((row, idx) => {
      if (idx < 2) { // Only first 2 rows for debugging
        const rankEl = row.querySelector('.TeamInfo_ranking__MqHpq');
        const rank = rankEl ? rankEl.textContent.trim() : '';

        const teamEl = row.querySelector('.TeamInfo_team_name__dni7F');
        const teamName = teamEl ? teamEl.textContent.trim() : '';

        const textElements = row.querySelectorAll('.TextInfo_text__ysEqh');
        const values = [];
        textElements.forEach(el => {
          values.push(el.textContent.trim());
        });

        result.push({
          rank,
          teamName,
          values,
          rawHTML: row.innerHTML.substring(0, 500)
        });
      }
    });

    return result;
  });

  console.log(JSON.stringify(debugInfo, null, 2));

  await browser.close();
}

debugStandings();
