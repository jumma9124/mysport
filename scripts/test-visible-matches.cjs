const puppeteer = require('puppeteer');

async function testVisibleMatches() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 812 }); // iPhone size
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15');

  const url = 'https://m.sports.naver.com/volleyball/schedule/index?category=kovo&date=2026-01-18';

  console.log('Testing URL:', url);
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Take screenshot
  await page.screenshot({ path: 'naver-volleyball-2026-01-18.png', fullPage: true });
  console.log('Screenshot saved to naver-volleyball-2026-01-18.png');

  // Check which matches are actually in viewport or have non-zero dimensions
  const visibleMatches = await page.evaluate(() => {
    const items = document.querySelectorAll('[class*="MatchBox_match_item"]');
    const results = [];

    items.forEach((item, idx) => {
      const rect = item.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(item);

      const statusEl = item.querySelector('[class*="status"]');
      const status = statusEl ? statusEl.textContent.trim() : 'NO STATUS';

      const teamItems = item.querySelectorAll('[class*="team_item"]');
      const team1 = teamItems[0]?.querySelector('[class*="team_name"]')?.textContent.trim() || 'NO TEAM';
      const team2 = teamItems[1]?.querySelector('[class*="team_name"]')?.textContent.trim() || 'NO TEAM';

      // Check if element has actual dimensions (visible on page)
      const hasSize = rect.width > 0 && rect.height > 0;
      const isDisplayed = computedStyle.display !== 'none';
      const isVisible = computedStyle.visibility !== 'hidden';
      const hasOpacity = parseFloat(computedStyle.opacity) > 0;

      // Only include if actually visible
      if (hasSize && isDisplayed && isVisible && hasOpacity) {
        results.push({
          idx,
          status,
          team1,
          team2,
          rect: { width: rect.width, height: rect.height, top: rect.top },
          isInViewport: rect.top >= 0 && rect.top < window.innerHeight
        });
      }
    });

    return results;
  });

  console.log('\n=== Visible Matches (with dimensions) ===');
  console.log(JSON.stringify(visibleMatches, null, 2));
  console.log(`\nTotal visible matches: ${visibleMatches.length}`);

  await browser.close();
}

testVisibleMatches().catch(console.error);
