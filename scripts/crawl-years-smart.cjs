const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function crawlYearsSmart() {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

  const url = 'https://www.koreabaseball.com/Record/TeamRank/TeamRankDaily.aspx';

  const yearsTocrawl = [2024, 2023, 2022];

  for (const year of yearsTocrawl) {
    console.log(`\n=== Crawling year ${year} ===`);
    const yearData = [];

    // Crawl March to October
    for (let month = 3; month <= 10; month++) {
      console.log(`\nChecking ${year}-${String(month).padStart(2, '0')}`);

      // Navigate and open datepicker
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise(resolve => setTimeout(resolve, 2000));

      await page.click('img.ui-datepicker-trigger');
      await new Promise(resolve => setTimeout(resolve, 1500));

      await page.select('#ui-datepicker-div .ui-datepicker-year', String(year));
      await new Promise(resolve => setTimeout(resolve, 1000));

      await page.select('#ui-datepicker-div .ui-datepicker-month', String(month - 1));
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get all available days for this month
      const availableDays = await page.evaluate(() => {
        const dayLinks = document.querySelectorAll('#ui-datepicker-div .ui-datepicker-calendar a');
        return Array.from(dayLinks).map(link => parseInt(link.textContent.trim()));
      });

      if (availableDays.length === 0) {
        console.log(`  No data available for this month`);
        continue;
      }

      console.log(`  Found ${availableDays.length} available days`);

      // Sample every Nth day (take ~5-7 samples per month)
      const step = Math.max(1, Math.floor(availableDays.length / 6));
      const sampledDays = [];
      for (let i = 0; i < availableDays.length; i += step) {
        sampledDays.push(availableDays[i]);
      }

      // Always include first and last day
      if (!sampledDays.includes(availableDays[0])) sampledDays.unshift(availableDays[0]);
      if (!sampledDays.includes(availableDays[availableDays.length - 1])) sampledDays.push(availableDays[availableDays.length - 1]);

      console.log(`  Sampling ${sampledDays.length} days: ${sampledDays.join(', ')}`);

      // Crawl each sampled day
      for (const day of sampledDays) {
        try {
          console.log(`    Crawling day ${day}...`);

          // Navigate fresh
          await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
          await new Promise(resolve => setTimeout(resolve, 2000));

          await page.click('img.ui-datepicker-trigger');
          await new Promise(resolve => setTimeout(resolve, 1500));

          await page.select('#ui-datepicker-div .ui-datepicker-year', String(year));
          await new Promise(resolve => setTimeout(resolve, 1000));

          await page.select('#ui-datepicker-div .ui-datepicker-month', String(month - 1));
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Click the day
          await page.evaluate((targetDay) => {
            const dayLinks = document.querySelectorAll('#ui-datepicker-div .ui-datepicker-calendar a');
            for (const link of dayLinks) {
              if (parseInt(link.textContent.trim()) === targetDay) {
                link.click();
                return;
              }
            }
          }, day);

          await new Promise(resolve => setTimeout(resolve, 4000));

          // Extract data
          const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const rankData = await page.evaluate((date) => {
            const rows = document.querySelectorAll('table.tData tbody tr');
            const teams = [];

            rows.forEach(row => {
              const cells = row.querySelectorAll('td');
              if (cells.length >= 2) {
                const rank = cells[0].textContent.trim();
                const teamName = cells[1].textContent.trim();

                if (rank && teamName && !isNaN(parseInt(rank))) {
                  teams.push({
                    rank: parseInt(rank),
                    team: teamName,
                    date: date
                  });
                }
              }
            });

            return teams;
          }, dateStr);

          if (rankData && rankData.length > 0) {
            console.log(`      ✓ Found ${rankData.length} teams`);
            yearData.push(...rankData);
          } else {
            console.log(`      ✗ No data`);
          }

        } catch (error) {
          console.error(`      Error: ${error.message}`);
        }
      }
    }

    // Save year data
    if (yearData.length > 0) {
      const outputPath = path.join(__dirname, '..', 'public', 'data', `baseball-daily-rank-${year}.json`);

      // Find KIA team data
      const kiaData = yearData.filter(item => item.team === 'KIA');
      const dailyRanks = kiaData.map(item => ({
        date: item.date,
        rank: item.rank
      })).sort((a, b) => a.date.localeCompare(b.date));

      const ranks = dailyRanks.map(d => d.rank);
      const chartData = {
        team: 'KIA',
        season: `${year}`,
        dailyRanks: dailyRanks,
        bestRank: Math.min(...ranks),
        worstRank: Math.max(...ranks),
        currentRank: ranks[ranks.length - 1]
      };

      fs.writeFileSync(outputPath, JSON.stringify(chartData, null, 2), 'utf8');
      console.log(`\n✓ Saved ${year} data: ${dailyRanks.length} records`);
      console.log(`  File: ${outputPath}`);
    } else {
      console.log(`\n✗ No data collected for ${year}`);
    }
  }

  await browser.close();
  console.log('\n=== Crawling complete ===');
}

crawlYearsSmart().catch(console.error);
