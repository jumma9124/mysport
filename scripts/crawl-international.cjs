const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function crawlInternationalSports() {
  console.log('Starting international sports crawling...');

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

    // major-events.json에서 이벤트 목록 읽기
    const eventsPath = path.join(__dirname, '../public/data/major-events.json');
    const events = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));

    const updatedEvents = [];

    for (const event of events) {
      console.log(`Processing event: ${event.name}`);

      // D-day 계산
      const eventDate = new Date(event.date);
      const now = new Date();
      const diffTime = eventDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const daysLeft = diffDays > 0 ? diffDays : 0;

      // D-10 이상이면 기본 정보만
      if (daysLeft > 10) {
        updatedEvents.push({
          ...event,
          daysLeft
        });
        console.log(`  D-${daysLeft}: Using static data`);
        continue;
      }

      // D-10 이하면 네이버에서 크롤링 시도
      console.log(`  D-${daysLeft}: Attempting to crawl from Naver...`);

      try {
        // 네이버 스포츠 페이지 URL (실제 URL은 D-10이 되면 확인 필요)
        // 예: https://sports.news.naver.com/olympics/2026/index
        const sportUrl = getNaverSportUrl(event);

        if (sportUrl) {
          await page.goto(sportUrl, { waitUntil: 'networkidle0', timeout: 30000 });
          await page.waitForTimeout(2000);

          // 메달 정보 크롤링 (대회 진행 중인 경우)
          let medals = null;
          let rank = null;

          if (daysLeft === 0) {
            // 메달 정보 선택자 (실제 페이지 구조에 맞춰 수정 필요)
            medals = await page.evaluate(() => {
              // 실제 선택자는 네이버 페이지 구조에 맞춰 수정 필요
              const goldEl = document.querySelector('.medal_gold');
              const silverEl = document.querySelector('.medal_silver');
              const bronzeEl = document.querySelector('.medal_bronze');

              if (goldEl && silverEl && bronzeEl) {
                return {
                  gold: parseInt(goldEl.textContent) || 0,
                  silver: parseInt(silverEl.textContent) || 0,
                  bronze: parseInt(bronzeEl.textContent) || 0
                };
              }
              return null;
            });

            // 순위 정보
            rank = await page.evaluate(() => {
              const rankEl = document.querySelector('.rank_number');
              return rankEl ? parseInt(rankEl.textContent) : null;
            });

            console.log(`  Medals: ${medals ? JSON.stringify(medals) : 'N/A'}`);
            console.log(`  Rank: ${rank || 'N/A'}`);
          }

          updatedEvents.push({
            ...event,
            daysLeft,
            medals,
            rank
          });
        } else {
          // URL이 없으면 기본 정보만
          updatedEvents.push({
            ...event,
            daysLeft
          });
        }
      } catch (error) {
        console.error(`  Error crawling ${event.name}:`, error.message);
        // 크롤링 실패 시 기본 정보만
        updatedEvents.push({
          ...event,
          daysLeft
        });
      }
    }

    // 업데이트된 이벤트 정보를 major-events.json에 저장
    fs.writeFileSync(eventsPath, JSON.stringify(updatedEvents, null, 2), 'utf8');
    console.log('International sports data updated successfully');

  } catch (error) {
    console.error('Error during crawling:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// 이벤트별 네이버 스포츠 URL 반환
function getNaverSportUrl(event) {
  const eventName = event.name.toLowerCase();

  // D-10 이후에 생성될 URL 패턴 (실제 URL은 확인 후 수정 필요)
  if (eventName.includes('올림픽') || eventName.includes('olympic')) {
    return 'https://sports.news.naver.com/olympics/2026/index';
  } else if (eventName.includes('월드컵') || eventName.includes('world cup')) {
    return 'https://sports.news.naver.com/worldcup/2026/index';
  } else if (eventName.includes('wbc') || eventName.includes('베이스볼 클래식')) {
    return 'https://sports.news.naver.com/wbc/2026/index';
  }

  return null;
}

// 스크립트 직접 실행 시
if (require.main === module) {
  crawlInternationalSports()
    .then(() => {
      console.log('Crawling completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Crawling failed:', error);
      process.exit(1);
    });
}

module.exports = { crawlInternationalSports };
