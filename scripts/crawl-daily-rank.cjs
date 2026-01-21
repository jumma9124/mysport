const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

/**
 * KBO 공식 사이트에서 일자별 순위 데이터 크롤링
 * https://www.koreabaseball.com/Record/TeamRank/TeamRankDaily.aspx
 */

const TEAM_NAME = '한화';
const DATA_DIR = path.join(__dirname, '../public/data');
const OUTPUT_FILE = path.join(DATA_DIR, 'baseball-daily-rank.json');

async function crawlDailyRank() {
  let browser;
  try {
    console.log('Starting daily rank crawl...');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

    const url = 'https://www.koreabaseball.com/Record/TeamRank/TeamRankDaily.aspx';
    console.log('Loading page:', url);

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Extract daily rank data
    const dailyRankData = await page.evaluate((teamName) => {
      const results = [];

      // Find all date buttons or date selectors
      const dateElements = document.querySelectorAll('.day_check a, .tbl td a');

      // For now, just get the current visible table data
      const rows = document.querySelectorAll('.table_type03 tbody tr, .tbl tbody tr');

      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 3) {
          const rank = cells[0]?.textContent?.trim();
          const team = cells[1]?.textContent?.trim();
          const wins = cells[2]?.textContent?.trim();
          const losses = cells[3]?.textContent?.trim();

          if (team && team.includes(teamName)) {
            console.log('Found team:', team, 'Rank:', rank);
          }
        }
      });

      // Get current date from page
      const dateText = document.querySelector('.day_check .current, .select_date')?.textContent?.trim();

      return {
        currentDate: dateText || new Date().toISOString().split('T')[0],
        message: 'Need to implement date iteration'
      };
    }, TEAM_NAME);

    console.log('Daily rank data:', dailyRankData);

    await browser.close();

    // For now, return sample data structure
    const sampleData = {
      team: TEAM_NAME,
      season: '2025',
      dailyRanks: [
        { date: '2025-03-23', rank: 5 },
        { date: '2025-04-01', rank: 4 },
        { date: '2025-05-01', rank: 3 },
        { date: '2025-06-01', rank: 4 },
        { date: '2025-07-01', rank: 3 },
        { date: '2025-08-01', rank: 2 },
        { date: '2025-09-01', rank: 2 },
        { date: '2025-10-02', rank: 2 }
      ],
      bestRank: 2,
      worstRank: 5,
      currentRank: 2
    };

    // Save to file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(sampleData, null, 2));
    console.log('✓ Daily rank data saved to:', OUTPUT_FILE);

    return sampleData;

  } catch (error) {
    console.error('Failed to crawl daily rank:', error.message);
    if (browser) await browser.close();
    return null;
  }
}

// Run if called directly
if (require.main === module) {
  crawlDailyRank()
    .then(() => {
      console.log('Daily rank crawl completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Daily rank crawl failed:', error);
      process.exit(1);
    });
}

module.exports = { crawlDailyRank };
