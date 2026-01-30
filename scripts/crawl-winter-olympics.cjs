const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

/**
 * 네이버 스포츠 밀라노-코르티나 2026 동계올림픽 크롤링
 * 대한민국 메달 정보 및 오늘의 경기 일정 수집
 */

const DATA_DIR = path.join(__dirname, '../public/data');

// 네이버 동계올림픽 URL
const NAVER_URLS = {
  medals: 'https://m.sports.naver.com/milanocortina2026/medals?pageType=COUNTRY&sortType=goldMedal',
  scheduleToday: (date) => `https://m.sports.naver.com/milanocortina2026/schedule?type=date&date=${date}&disciplineId=&isKorean=Y&isMedal=N`,
  scheduleTotal: 'https://m.sports.naver.com/milanocortina2026/schedule?type=total&date=&disciplineId=&isKorean=Y&isMedal=N',
};

/**
 * 메달 정보 크롤링
 */
async function crawlMedals() {
  let browser;
  try {
    console.log('메달 정보 크롤링 시작...');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15');

    await page.goto(NAVER_URLS.medals, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // React 렌더링 대기
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 메달 데이터 추출
    const medalData = await page.evaluate(() => {
      // 대한민국 메달 정보 찾기
      const koreaBox = document.querySelector('.OlympicMedal_comp_medal_rank_korea__jbCtr');

      if (!koreaBox) {
        return null;
      }

      // 메달 개수 추출
      const medalNumbers = koreaBox.querySelectorAll('.OlympicMedal_medal_number__k\\+FvQ');

      const medals = {
        gold: 0,
        silver: 0,
        bronze: 0,
        total: 0,
      };

      medalNumbers.forEach((el) => {
        const parent = el.closest('.OlympicMedal_medal__XB68Z');
        if (!parent) return;

        const count = parseInt(el.textContent.trim()) || 0;

        if (parent.classList.contains('OlympicMedal_type_gold__4ubSW')) {
          medals.gold = count;
        } else if (parent.classList.contains('OlympicMedal_type_silver__70ph7')) {
          medals.silver = count;
        } else if (parent.classList.contains('OlympicMedal_type_bronze__+HbZO')) {
          medals.bronze = count;
        } else if (parent.classList.contains('OlympicMedal_type_total__ifDFM')) {
          medals.total = count;
        }
      });

      // total이 0이면 금+은+동으로 계산
      if (medals.total === 0) {
        medals.total = medals.gold + medals.silver + medals.bronze;
      }

      return medals;
    });

    await browser.close();

    if (!medalData) {
      console.warn('대한민국 메달 정보를 찾을 수 없습니다');
      return { gold: 0, silver: 0, bronze: 0, total: 0 };
    }

    console.log(`✓ 메달 정보: 금 ${medalData.gold}, 은 ${medalData.silver}, 동 ${medalData.bronze}, 합계 ${medalData.total}`);
    return medalData;

  } catch (error) {
    if (browser) await browser.close();
    console.error('메달 정보 크롤링 실패:', error.message);
    return { gold: 0, silver: 0, bronze: 0, total: 0 };
  }
}

/**
 * 오늘의 경기 일정 크롤링
 */
async function crawlTodaySchedule() {
  let browser;
  try {
    console.log('오늘의 경기 일정 크롤링 시작...');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15');

    const today = new Date().toISOString().split('T')[0];
    const url = NAVER_URLS.scheduleToday(today);

    console.log(`일정 페이지 로딩: ${url}`);
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // React 렌더링 대기
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 경기 일정 데이터 추출
    const scheduleData = await page.evaluate(() => {
      const games = [];
      const gameBoxes = document.querySelectorAll('.GameBox_game_box__tYM7H');

      gameBoxes.forEach((box) => {
        try {
          // 시간 정보
          const timeEl = box.querySelector('.GameInfo_time__xl0OG');
          const time = timeEl ? timeEl.textContent.trim() : '';

          // 종목 정보
          const disciplineEl = box.querySelector('.GameInfo_discipline__NmqXP');
          const discipline = disciplineEl ? disciplineEl.textContent.trim() : '';

          // 상태 정보 (LIVE, 종료 등)
          const statusBadge = box.querySelector('.GameInfo_status_badge__TiQiR');
          const status = statusBadge ? statusBadge.textContent.trim() : '';

          // 선수 정보 (있는 경우)
          const playerArea = box.querySelector('.GamePlayer_game_player_area__LM2p\\+');
          let players = [];
          if (playerArea) {
            const playerEls = playerArea.querySelectorAll('[class*="player"]');
            playerEls.forEach(el => {
              const name = el.textContent.trim();
              if (name) players.push(name);
            });
          }

          if (discipline) {
            games.push({
              time,
              discipline,
              status,
              players: players.length > 0 ? players : null,
            });
          }
        } catch (err) {
          console.error('경기 정보 파싱 오류:', err);
        }
      });

      return games;
    });

    await browser.close();

    console.log(`✓ 오늘의 경기: ${scheduleData.length}개`);
    scheduleData.forEach((game, idx) => {
      console.log(`  ${idx + 1}. ${game.time} - ${game.discipline} ${game.status ? `[${game.status}]` : ''}`);
    });

    return scheduleData;

  } catch (error) {
    if (browser) await browser.close();
    console.error('경기 일정 크롤링 실패:', error.message);
    return [];
  }
}

/**
 * 다가오는 경기 일정 크롤링 (향후 7일)
 */
async function crawlUpcomingSchedule() {
  let browser;
  try {
    console.log('다가오는 경기 일정 크롤링 시작...');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15');

    const upcomingGames = [];
    const today = new Date();

    // 오늘부터 7일 동안의 경기 확인
    for (let i = 0; i < 7 && upcomingGames.length < 5; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      const url = NAVER_URLS.scheduleToday(dateStr);
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      const dayGames = await page.evaluate((targetDate) => {
        const games = [];
        const gameBoxes = document.querySelectorAll('.GameBox_game_box__tYM7H');

        gameBoxes.forEach((box) => {
          try {
            const timeEl = box.querySelector('.GameInfo_time__xl0OG');
            const time = timeEl ? timeEl.textContent.trim() : '';

            const disciplineEl = box.querySelector('.GameInfo_discipline__NmqXP');
            const discipline = disciplineEl ? disciplineEl.textContent.trim() : '';

            const statusBadge = box.querySelector('.GameInfo_status_badge__TiQiR');
            const status = statusBadge ? statusBadge.textContent.trim() : '';

            // 종료되지 않은 경기만 포함
            if (discipline && status !== '종료') {
              games.push({
                date: targetDate,
                time,
                discipline,
                status,
              });
            }
          } catch (err) {
            console.error('경기 정보 파싱 오류:', err);
          }
        });

        return games;
      }, dateStr);

      upcomingGames.push(...dayGames);
    }

    await browser.close();

    // 최대 5개까지만 반환
    const result = upcomingGames.slice(0, 5);
    console.log(`✓ 다가오는 경기: ${result.length}개`);

    return result;

  } catch (error) {
    if (browser) await browser.close();
    console.error('다가오는 경기 일정 크롤링 실패:', error.message);
    return [];
  }
}

/**
 * 모든 동계올림픽 데이터 수집
 */
async function crawlWinterOlympicsData() {
  try {
    console.log('동계올림픽 데이터 크롤링 시작...');

    const [medals, todaySchedule, upcomingSchedule] = await Promise.all([
      crawlMedals(),
      crawlTodaySchedule(),
      crawlUpcomingSchedule(),
    ]);

    console.log('\n[RESULT] 메달:', medals);
    console.log('[RESULT] 오늘의 경기:', todaySchedule.length, '개');
    console.log('[RESULT] 다가오는 경기:', upcomingSchedule.length, '개');

    // winter-olympics-detail.json 생성
    const winterOlympicsDetail = {
      lastUpdate: new Date().toISOString(),
      medals,
      todaySchedule,
      upcomingSchedule,
    };

    // sports.json 업데이트
    const sportsJsonPath = path.join(DATA_DIR, 'sports.json');
    let sportsData = {};

    if (fs.existsSync(sportsJsonPath)) {
      sportsData = JSON.parse(fs.readFileSync(sportsJsonPath, 'utf8'));
    }

    sportsData.winterOlympics = {
      eventName: '밀라노-코르티나 2026',
      medals,
      todayGames: todaySchedule.length,
      upcomingGames: upcomingSchedule.slice(0, 3), // 최대 3개
    };

    // 파일 저장
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    fs.writeFileSync(
      path.join(DATA_DIR, 'winter-olympics-detail.json'),
      JSON.stringify(winterOlympicsDetail, null, 2),
      'utf8'
    );

    fs.writeFileSync(
      sportsJsonPath,
      JSON.stringify(sportsData, null, 2),
      'utf8'
    );

    console.log('\n✓ 동계올림픽 데이터 업데이트 완료');
    console.log(`  - 메달: 금 ${medals.gold}, 은 ${medals.silver}, 동 ${medals.bronze}`);
    console.log(`  - 오늘의 경기: ${todaySchedule.length}개`);
    console.log(`  - 다가오는 경기: ${upcomingSchedule.length}개`);

  } catch (error) {
    console.error('동계올림픽 데이터 크롤링 실패:', error);
    process.exit(1);
  }
}

// 스크립트 직접 실행 시
if (require.main === module) {
  crawlWinterOlympicsData();
}

module.exports = { crawlWinterOlympicsData };
