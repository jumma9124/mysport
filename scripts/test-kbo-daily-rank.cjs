const puppeteer = require('puppeteer');

async function testKBODailyRank() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

  const url = 'https://www.koreabaseball.com/Record/TeamRank/TeamRankDaily.aspx';
  console.log('Testing URL:', url);

  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Take screenshot
  await page.screenshot({ path: 'kbo-daily-rank.png', fullPage: true });
  console.log('Screenshot saved');

  // Analyze page structure
  const pageData = await page.evaluate(() => {
    // Find date selector
    const dateInputs = [];
    document.querySelectorAll('input[type="text"], input[type="date"], select').forEach(el => {
      if (el.id || el.name || el.className) {
        dateInputs.push({
          tag: el.tagName,
          id: el.id,
          name: el.name,
          className: el.className,
          value: el.value
        });
      }
    });

    // Find table structure
    const tables = [];
    document.querySelectorAll('table').forEach((table, idx) => {
      const headers = [];
      table.querySelectorAll('thead th, tr:first-child th').forEach(th => {
        headers.push(th.textContent.trim());
      });

      const firstRowCells = [];
      const firstRow = table.querySelector('tbody tr:first-child');
      if (firstRow) {
        firstRow.querySelectorAll('td').forEach(td => {
          firstRowCells.push(td.textContent.trim());
        });
      }

      tables.push({
        idx,
        className: table.className,
        headers,
        firstRowCells
      });
    });

    // Find date navigation buttons
    const dateButtons = [];
    document.querySelectorAll('a, button').forEach(el => {
      const text = el.textContent.trim();
      if (text.includes('월') || text.includes('일') || text.includes('날짜') || text.includes('이전') || text.includes('다음')) {
        dateButtons.push({
          text: text.substring(0, 50),
          className: el.className,
          href: el.href
        });
      }
    });

    return {
      title: document.title,
      dateInputs: dateInputs.slice(0, 5),
      tables: tables.slice(0, 3),
      dateButtons: dateButtons.slice(0, 10)
    };
  });

  console.log('\n=== Page Structure ===');
  console.log(JSON.stringify(pageData, null, 2));

  await browser.close();
}

testKBODailyRank().catch(console.error);
