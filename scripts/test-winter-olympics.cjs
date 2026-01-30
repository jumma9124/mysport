const puppeteer = require('puppeteer');

/**
 * 네이버 동계올림픽 페이지 구조 분석 테스트 스크립트
 */

const URLS = {
  medals: 'https://m.sports.naver.com/milanocortina2026/medals?pageType=COUNTRY&sortType=goldMedal',
  scheduleToday: `https://m.sports.naver.com/milanocortina2026/schedule?type=date&date=${new Date().toISOString().split('T')[0]}&disciplineId=&isKorean=Y&isMedal=N`,
  scheduleTotal: 'https://m.sports.naver.com/milanocortina2026/schedule?type=total&date=&disciplineId=&isKorean=Y&isMedal=N',
};

async function testMedalsPage() {
  let browser;
  try {
    console.log('\n=== 메달 페이지 분석 ===');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15');

    console.log('메달 페이지 로딩 중...');
    await page.goto(URLS.medals, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // React 렌더링 대기
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 페이지 구조 분석
    const pageStructure = await page.evaluate(() => {
      // 모든 클래스명 수집
      const allElements = document.querySelectorAll('*');
      const classNames = new Set();

      allElements.forEach(el => {
        if (el.className && typeof el.className === 'string') {
          el.className.split(' ').forEach(cls => {
            if (cls.includes('Medal') || cls.includes('Country') || cls.includes('Rank') || cls.includes('Table')) {
              classNames.add(cls);
            }
          });
        }
      });

      return {
        title: document.title,
        url: window.location.href,
        bodyText: document.body.textContent.substring(0, 500),
        medalClasses: Array.from(classNames),
        hasKoreaText: document.body.textContent.includes('대한민국') || document.body.textContent.includes('Korea'),
      };
    });

    console.log('페이지 구조:', JSON.stringify(pageStructure, null, 2));

    // 메달 테이블 데이터 추출 시도
    const medalData = await page.evaluate(() => {
      const results = [];

      // 여러 선택자 패턴 시도
      const selectors = [
        '[class*="Medal"]',
        '[class*="Country"]',
        '[class*="Rank"]',
        'table tbody tr',
        '[class*="Table"] [class*="item"]',
        '[class*="List"] [class*="item"]',
      ];

      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          results.push({
            selector,
            count: elements.length,
            firstElementText: elements[0]?.textContent?.substring(0, 200),
            firstElementHTML: elements[0]?.innerHTML?.substring(0, 300),
          });
        }
      }

      return results;
    });

    console.log('\n메달 데이터 추출 시도:');
    medalData.forEach((item, idx) => {
      console.log(`\n${idx + 1}. ${item.selector}`);
      console.log(`   개수: ${item.count}`);
      console.log(`   첫 번째 요소 텍스트: ${item.firstElementText?.substring(0, 100)}`);
    });

    // 스크린샷 저장
    await page.screenshot({ path: 'debug-medals-page.png', fullPage: true });
    console.log('\n스크린샷 저장: debug-medals-page.png');

    await browser.close();
    return pageStructure;

  } catch (error) {
    if (browser) await browser.close();
    console.error('메달 페이지 분석 실패:', error.message);
    throw error;
  }
}

async function testSchedulePage() {
  let browser;
  try {
    console.log('\n=== 일정 페이지 분석 ===');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15');

    console.log('일정 페이지 로딩 중...');
    await page.goto(URLS.scheduleToday, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // React 렌더링 대기
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 페이지 구조 분석
    const pageStructure = await page.evaluate(() => {
      const allElements = document.querySelectorAll('*');
      const classNames = new Set();

      allElements.forEach(el => {
        if (el.className && typeof el.className === 'string') {
          el.className.split(' ').forEach(cls => {
            if (cls.includes('Schedule') || cls.includes('Game') || cls.includes('Match') || cls.includes('Event')) {
              classNames.add(cls);
            }
          });
        }
      });

      return {
        title: document.title,
        url: window.location.href,
        bodyText: document.body.textContent.substring(0, 500),
        scheduleClasses: Array.from(classNames),
        hasScheduleText: document.body.textContent.includes('일정') || document.body.textContent.includes('경기'),
      };
    });

    console.log('페이지 구조:', JSON.stringify(pageStructure, null, 2));

    // 일정 데이터 추출 시도
    const scheduleData = await page.evaluate(() => {
      const results = [];

      const selectors = [
        '[class*="Schedule"]',
        '[class*="Game"]',
        '[class*="Match"]',
        '[class*="Event"]',
        '[class*="List"] [class*="item"]',
      ];

      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          results.push({
            selector,
            count: elements.length,
            firstElementText: elements[0]?.textContent?.substring(0, 200),
            firstElementHTML: elements[0]?.innerHTML?.substring(0, 300),
          });
        }
      }

      return results;
    });

    console.log('\n일정 데이터 추출 시도:');
    scheduleData.forEach((item, idx) => {
      console.log(`\n${idx + 1}. ${item.selector}`);
      console.log(`   개수: ${item.count}`);
      console.log(`   첫 번째 요소 텍스트: ${item.firstElementText?.substring(0, 100)}`);
    });

    // 스크린샷 저장
    await page.screenshot({ path: 'debug-schedule-page.png', fullPage: true });
    console.log('\n스크린샷 저장: debug-schedule-page.png');

    await browser.close();
    return pageStructure;

  } catch (error) {
    if (browser) await browser.close();
    console.error('일정 페이지 분석 실패:', error.message);
    throw error;
  }
}

async function main() {
  try {
    console.log('='.repeat(60));
    console.log('네이버 동계올림픽 페이지 구조 분석 시작');
    console.log('='.repeat(60));

    await testMedalsPage();
    await testSchedulePage();

    console.log('\n='.repeat(60));
    console.log('분석 완료!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('분석 실패:', error);
    process.exit(1);
  }
}

main();
