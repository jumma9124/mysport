const puppeteer = require('puppeteer');

async function testTeamPage() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15');

  // Try team-specific URLs
  const urls = [
    'https://m.sports.naver.com/volleyball/team/index?category=kovo&teamCode=1005', // 팀 홈
    'https://m.sports.naver.com/volleyball/schedule/index?category=kovo&teamCode=1005', // 팀 스케줄 (날짜 없이)
  ];

  for (const url of urls) {
    console.log('\n=================');
    console.log('Testing URL:', url);
    console.log('=================');

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 2000));

    const data = await page.evaluate(() => {
      // Check for match items
      const matchItems = document.querySelectorAll('[class*="MatchBox_match_item"]');
      const scheduleItems = document.querySelectorAll('[class*="Schedule"]');

      const matches = [];
      matchItems.forEach((item, idx) => {
        const statusEl = item.querySelector('[class*="status"]');
        const status = statusEl ? statusEl.textContent.trim() : 'NO STATUS';

        const teamItems = item.querySelectorAll('[class*="team_item"]');
        const team1 = teamItems[0]?.querySelector('[class*="team_name"]')?.textContent.trim() || 'NO TEAM';
        const team2 = teamItems[1]?.querySelector('[class*="team_name"]')?.textContent.trim() || 'NO TEAM';

        const score1 = teamItems[0]?.querySelector('[class*="score"]')?.textContent.trim() || 'NO SCORE';
        const score2 = teamItems[1]?.querySelector('[class*="score"]')?.textContent.trim() || 'NO SCORE';

        matches.push({ idx, status, team1, team2, score1, score2 });
      });

      return {
        url: window.location.href,
        title: document.title,
        matchItemsCount: matchItems.length,
        scheduleItemsCount: scheduleItems.length,
        matches: matches.slice(0, 10) // First 10 matches only
      };
    });

    console.log(JSON.stringify(data, null, 2));
  }

  await browser.close();
}

testTeamPage().catch(console.error);
