const puppeteer = require('puppeteer');

async function checkPageTabs() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 812 });
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15');

  const url = 'https://m.sports.naver.com/volleyball/schedule/index?category=kovo&date=2026-01-18';

  console.log('Loading page:', url);
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(resolve => setTimeout(resolve, 3000));

  const pageStructure = await page.evaluate(() => {
    // Find tab buttons
    const tabs = [];
    document.querySelectorAll('button, a, [role="tab"]').forEach(el => {
      const text = el.textContent.trim();
      if (text && (text.includes('전체') || text.includes('남자') || text.includes('여자') || text.includes('V-리그') || text.includes('대한배구'))) {
        tabs.push({
          text,
          className: el.className,
          isActive: el.className.includes('active') || el.className.includes('selected') || el.getAttribute('aria-selected') === 'true'
        });
      }
    });

    // Find league type sections
    const leagueSections = [];
    document.querySelectorAll('[class*="League"], [class*="league"]').forEach((el, idx) => {
      if (idx < 10) { // First 10 only
        const text = el.textContent.substring(0, 100);
        leagueSections.push({
          className: el.className,
          text: text.trim(),
          childCount: el.children.length
        });
      }
    });

    // Check for section headers
    const headers = [];
    document.querySelectorAll('h1, h2, h3, h4, [class*="title"], [class*="header"]').forEach(el => {
      const text = el.textContent.trim();
      if (text && text.length < 50) {
        headers.push({
          tag: el.tagName,
          text,
          className: el.className
        });
      }
    });

    return { tabs, leagueSections: leagueSections.slice(0, 5), headers: headers.slice(0, 10) };
  });

  console.log('\n=== Page Structure ===');
  console.log(JSON.stringify(pageStructure, null, 2));

  await browser.close();
}

checkPageTabs().catch(console.error);
