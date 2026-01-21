const puppeteer = require('puppeteer');
const fs = require('fs');

async function debugPageStructure() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15');

  const url = 'https://m.sports.naver.com/volleyball/schedule/index?category=kovo&date=2026-01-18';

  console.log('Opening:', url);
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Save full HTML
  const html = await page.content();
  fs.writeFileSync('page-2026-01-18.html', html);
  console.log('Saved full HTML to page-2026-01-18.html');

  // Extract match structure
  const data = await page.evaluate(() => {
    const matchItems = document.querySelectorAll('[class*="MatchBox_match_item"]');

    const matches = [];
    matchItems.forEach((item, idx) => {
      const statusEl = item.querySelector('[class*="status"]');
      const status = statusEl ? statusEl.textContent.trim() : 'NO STATUS';

      const teamItems = item.querySelectorAll('[class*="team_item"]');
      const team1 = teamItems[0]?.querySelector('[class*="team_name"]')?.textContent.trim() || 'NO TEAM';
      const team2 = teamItems[1]?.querySelector('[class*="team_name"]')?.textContent.trim() || 'NO TEAM';

      // Check visibility
      const isVisible = item.offsetParent !== null;
      const displayStyle = window.getComputedStyle(item).display;
      const visibilityStyle = window.getComputedStyle(item).visibility;

      // Check parent containers
      let parent = item.parentElement;
      let parentClasses = [];
      while (parent && parentClasses.length < 3) {
        parentClasses.push(parent.className);
        parent = parent.parentElement;
      }

      matches.push({
        idx,
        status,
        team1,
        team2,
        isVisible,
        displayStyle,
        visibilityStyle,
        classes: item.className,
        parentClasses: parentClasses.join(' | ')
      });
    });

    return matches;
  });

  console.log('\n=== Match Items ===');
  console.log(JSON.stringify(data, null, 2));

  await browser.close();
}

debugPageStructure().catch(console.error);
