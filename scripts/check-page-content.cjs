const puppeteer = require('puppeteer');

async function checkPageContent() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15');
  await page.setViewport({ width: 375, height: 667 });

  console.log('Checking batters page...');
  await page.goto('https://m.sports.naver.com/kbaseball/record/kbo?seasonCode=2025&tab=hitter', {
    waitUntil: 'networkidle2',
    timeout: 60000
  });

  await new Promise(resolve => setTimeout(resolve, 10000));
  
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  await new Promise(resolve => setTimeout(resolve, 3000));

  const pageInfo = await page.evaluate(() => {
    const bodyText = document.body.innerText || '';
    const hasTeam = bodyText.includes('한화');
    
    // 모든 가능한 선택자 시도
    const selectors = {
      tr: document.querySelectorAll('tr').length,
      div: document.querySelectorAll('div').length,
      li: document.querySelectorAll('li').length,
      table: document.querySelectorAll('table').length,
      rowsWithTeam: Array.from(document.querySelectorAll('*')).filter(el => {
        const text = el.textContent || '';
        return text.includes('한화') && text.length > 10 && text.length < 500;
      }).length
    };
    
    // 한화 관련 요소 샘플
    const hwElements = Array.from(document.querySelectorAll('*')).filter(el => {
      const text = el.textContent || '';
      return text.includes('한화') && text.length > 10 && text.length < 500;
    }).slice(0, 3).map(el => ({
      tag: el.tagName,
      class: el.className,
      text: el.textContent.trim().substring(0, 100)
    }));
    
    return {
      hasTeam,
      bodyTextLength: bodyText.length,
      selectors,
      hwElements,
      sampleText: bodyText.substring(0, 500)
    };
  });

  console.log(JSON.stringify(pageInfo, null, 2));
  await browser.close();
}

checkPageContent();
