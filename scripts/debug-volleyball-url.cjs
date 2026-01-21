const puppeteer = require('puppeteer');

async function debugURL() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15');

  const date = '2026-01-21';
  const teamCode = '1005';
  const url = `https://m.sports.naver.com/volleyball/schedule/index?category=kovo&date=${date}&teamCode=${teamCode}`;

  console.log('Opening URL:', url);
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(resolve => setTimeout(resolve, 3000));

  const data = await page.evaluate(() => {
    const items = document.querySelectorAll('[class*="MatchBox_match_item"]');

    const matches = [];
    items.forEach((item, idx) => {
      const statusEl = item.querySelector('[class*="status"]');
      const status = statusEl ? statusEl.textContent.trim() : 'NO STATUS';

      const teamItems = item.querySelectorAll('[class*="team_item"]');
      const team1NameEl = teamItems[0]?.querySelector('[class*="team_name"]');
      const team2NameEl = teamItems[1]?.querySelector('[class*="team_name"]');

      const team1 = team1NameEl ? team1NameEl.textContent.trim() : 'NO TEAM1';
      const team2 = team2NameEl ? team2NameEl.textContent.trim() : 'NO TEAM2';

      const team1ScoreEl = teamItems[0]?.querySelector('[class*="score"]');
      const team2ScoreEl = teamItems[1]?.querySelector('[class*="score"]');

      const score1 = team1ScoreEl ? team1ScoreEl.textContent.trim() : 'NO SCORE';
      const score2 = team2ScoreEl ? team2ScoreEl.textContent.trim() : 'NO SCORE';

      matches.push({ idx, status, team1, team2, score1, score2 });
    });

    return {
      url: window.location.href,
      title: document.title,
      matchCount: items.length,
      matches
    };
  });

  console.log('\n=== PAGE DATA ===');
  console.log(JSON.stringify(data, null, 2));

  await browser.close();
}

debugURL().catch(console.error);
