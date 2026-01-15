const puppeteer = require('puppeteer');

async function debugPage(url, label) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15');

  await page.goto(url, {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

  await new Promise(resolve => setTimeout(resolve, 5000));

  const debugInfo = await page.evaluate(() => {
    return {
      hasTableBody: document.querySelector('.TableBody_list__P8yRn') !== null,
      hasTableItem: document.querySelector('.TableBody_item__eCenH') !== null,
      bodyHTML: document.body.innerHTML.substring(0, 1000),
      allClasses: Array.from(document.querySelectorAll('[class*="Table"]')).map(el => el.className).slice(0, 10)
    };
  });

  console.log(`\n=== ${label} ===`);
  console.log('Has .TableBody_list__P8yRn:', debugInfo.hasTableBody);
  console.log('Has .TableBody_item__eCenH:', debugInfo.hasTableItem);
  console.log('Classes with "Table":', debugInfo.allClasses);
  console.log('First 1000 chars:', debugInfo.bodyHTML);

  await browser.close();
}

(async () => {
  await debugPage('https://m.sports.naver.com/kbaseball/record/kbo?seasonCode=2024&tab=player&category=batting', 'BATTERS');
})();
