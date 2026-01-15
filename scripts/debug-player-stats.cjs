const puppeteer = require('puppeteer');

async function debugPlayerStats() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15');

  // 타자 페이지 확인
  console.log('\n=== BATTERS PAGE ===');
  await page.goto('https://m.sports.naver.com/kbaseball/record/kbo?seasonCode=2025&tab=player&category=batting', {
    waitUntil: 'networkidle2',
    timeout: 60000
  });

  await new Promise(resolve => setTimeout(resolve, 3000));

  const battersInfo = await page.evaluate(() => {
    const hasTable = document.querySelector('.TableBody_list__P8yRn') !== null;
    const allClasses = Array.from(document.querySelectorAll('[class*="Record"]')).map(el => el.className).slice(0, 5);
    const bodyText = document.body.innerText.substring(0, 500);

    return {
      hasTable,
      allClasses,
      bodyText,
      url: window.location.href
    };
  });

  console.log('Has TableBody:', battersInfo.hasTable);
  console.log('Classes with "Record":', battersInfo.allClasses);
  console.log('Body text sample:', battersInfo.bodyText);
  console.log('Current URL:', battersInfo.url);

  // 투수 페이지 확인
  console.log('\n=== PITCHERS PAGE ===');
  await page.goto('https://m.sports.naver.com/kbaseball/record/kbo?seasonCode=2025&tab=player&category=pitching', {
    waitUntil: 'networkidle2',
    timeout: 60000
  });

  await new Promise(resolve => setTimeout(resolve, 3000));

  const pitchersInfo = await page.evaluate(() => {
    const hasTable = document.querySelector('.TableBody_list__P8yRn') !== null;
    const allClasses = Array.from(document.querySelectorAll('[class*="Record"]')).map(el => el.className).slice(0, 5);

    return {
      hasTable,
      allClasses,
      url: window.location.href
    };
  });

  console.log('Has TableBody:', pitchersInfo.hasTable);
  console.log('Classes with "Record":', pitchersInfo.allClasses);
  console.log('Current URL:', pitchersInfo.url);

  // 상대전적 페이지 확인
  console.log('\n=== HEAD TO HEAD PAGE ===');
  await page.goto('https://m.sports.naver.com/kbaseball/record/kbo?seasonCode=2025&tab=vsTeam', {
    waitUntil: 'networkidle2',
    timeout: 60000
  });

  await new Promise(resolve => setTimeout(resolve, 3000));

  const h2hInfo = await page.evaluate(() => {
    const hasTable = document.querySelector('.TableBody_list__P8yRn') !== null;
    const allClasses = Array.from(document.querySelectorAll('[class*="Record"]')).map(el => el.className).slice(0, 5);

    return {
      hasTable,
      allClasses,
      url: window.location.href
    };
  });

  console.log('Has TableBody:', h2hInfo.hasTable);
  console.log('Classes with "Record":', h2hInfo.allClasses);
  console.log('Current URL:', h2hInfo.url);

  await browser.close();
}

debugPlayerStats();
