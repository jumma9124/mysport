const puppeteer = require('puppeteer');

async function testNaverAPI() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

  const date = '2026-01-18';
  const teamCode = '1005'; // 현대캐피탈

  // Desktop API URL
  const url = `https://sports.naver.com/game/kovo/schedule/index?date=${date}&teamCode=${teamCode}`;

  console.log('Testing Desktop URL:', url);

  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Check if there's any JSON data in network requests
  const responses = [];
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('api') || url.includes('json')) {
      console.log('Found API URL:', url);
      try {
        const data = await response.json();
        console.log('API Data:', JSON.stringify(data, null, 2));
      } catch (e) {
        // Not JSON
      }
    }
  });

  // Extract match data
  const matches = await page.evaluate(() => {
    // Try different selectors
    const selectors = [
      '.ScheduleAllGameListItem_item_box__1HDdX',
      '[class*="Schedule"]',
      '[class*="Game"]',
      '[class*="Match"]'
    ];

    const results = {};
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      results[selector] = elements.length;
    });

    return {
      selectors: results,
      html: document.body.innerHTML.substring(0, 2000) // First 2000 chars
    };
  });

  console.log('\n=== Match Data ===');
  console.log(JSON.stringify(matches, null, 2));

  await browser.close();
}

testNaverAPI().catch(console.error);
