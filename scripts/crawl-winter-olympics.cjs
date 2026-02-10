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
  medalists: 'https://m.sports.naver.com/milanocortina2026/medals?pageType=MEDALIST&sortType=recentMedalEarned',
  scheduleToday: (date) => `https://m.sports.naver.com/milanocortina2026/schedule?type=date&date=${date}&disciplineId=&isKorean=Y&isMedal=N`,
  scheduleTotal: 'https://m.sports.naver.com/milanocortina2026/schedule?type=total&date=&disciplineId=&isKorean=Y&isMedal=N',
  // isKorean 파라미터 제거 - 전체 경기를 가져온 후 한국 선수 경기만 필터링
  scheduleDiscipline: (disciplineId) => `https://m.sports.naver.com/milanocortina2026/schedule?type=discipline&date=&disciplineId=${disciplineId}&isMedal=N`,
};

// 종목별 disciplineId 목록
const DISCIPLINE_LIST = [
  { id: 'STK', name: '쇼트트랙' },
  { id: 'SSK', name: '스피드스케이팅' },
  { id: 'FSK', name: '피겨스케이팅' },
  { id: 'CUR', name: '컬링' },
  { id: 'ICH', name: '아이스하키' },
  { id: 'BOB', name: '봅슬레이' },
  { id: 'LUG', name: '루지' },
  { id: 'SKE', name: '스켈레톤' },
  { id: 'ALP', name: '알파인스키' },
  { id: 'CCS', name: '크로스컨트리스키' },
  { id: 'SKJ', name: '스키점프' },
  { id: 'NCB', name: '노르딕복합' },
  { id: 'FRS', name: '프리스타일스키' },
  { id: 'SNB', name: '스노보드' },
  { id: 'BIA', name: '바이애슬론' },
];

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

      let koreaMedals = {
        gold: 0,
        silver: 0,
        bronze: 0,
        total: 0,
      };

      if (koreaBox) {
        // 메달 개수 추출 - cell의 텍스트에서 직접 숫자 추출
        const medalCells = koreaBox.querySelectorAll('.OlympicMedal_cell_medal__Wfc1U');

        medalCells.forEach((cell) => {
          // 텍스트에서 숫자만 추출 (예: "<span class='blind'>금</span>1" -> "1")
          const textContent = cell.textContent.replace(/[^0-9]/g, '');
          const count = parseInt(textContent) || 0;

          // cell 자체의 클래스로 메달 종류 판단
          if (cell.classList.contains('OlympicMedal_type_gold__4ubSW')) {
            koreaMedals.gold = count;
          } else if (cell.classList.contains('OlympicMedal_type_silver__70ph7')) {
            koreaMedals.silver = count;
          } else if (cell.classList.contains('OlympicMedal_type_bronze__+HbZO')) {
            koreaMedals.bronze = count;
          } else if (cell.classList.contains('OlympicMedal_type_total__ifDFM')) {
            koreaMedals.total = count;
          }
        });

        // total이 0이면 금+은+동으로 계산
        if (koreaMedals.total === 0) {
          koreaMedals.total = koreaMedals.gold + koreaMedals.silver + koreaMedals.bronze;
        }
      }

      // 전체 국가 메달 순위 추출
      const allCountries = [];
      const countryItems = document.querySelectorAll('.OlympicMedal_medal_rank_item__KNY6g');

      console.log('[DEBUG] Found country items:', countryItems.length);

      countryItems.forEach((item) => {
        try {
          // 순위
          const rankEl = item.querySelector('.OlympicMedal_cell_rank__IAXn7');
          const rank = rankEl ? parseInt(rankEl.textContent.trim()) || 0 : 0;

          // 국가명
          const nationEl = item.querySelector('.OlympicMedal_nation__OrKUv');
          const nation = nationEl ? nationEl.textContent.trim() : '';

          // 메달 개수들 - cell의 텍스트에서 직접 숫자 추출
          const medalCells = item.querySelectorAll('.OlympicMedal_cell_medal__Wfc1U');
          let gold = 0, silver = 0, bronze = 0, total = 0;

          medalCells.forEach((cell) => {
            // 텍스트에서 숫자만 추출 (예: "<span class='blind'>금</span>3" -> "3")
            const textContent = cell.textContent.replace(/[^0-9]/g, '');
            const count = parseInt(textContent) || 0;

            // cell 자체의 클래스로 메달 종류 판단
            if (cell.classList.contains('OlympicMedal_type_gold__4ubSW')) {
              gold = count;
            } else if (cell.classList.contains('OlympicMedal_type_silver__70ph7')) {
              silver = count;
            } else if (cell.classList.contains('OlympicMedal_type_bronze__+HbZO')) {
              bronze = count;
            } else if (cell.classList.contains('OlympicMedal_type_total__ifDFM')) {
              total = count;
            }
          });

          if (nation && rank > 0) {
            allCountries.push({
              rank,
              nation,
              gold,
              silver,
              bronze,
              total: total || (gold + silver + bronze)
            });
          }
        } catch (err) {
          console.error('국가 메달 파싱 오류:', err);
        }
      });

      // allCountries 정렬
      const sortedCountries = allCountries.sort((a, b) => a.rank - b.rank);

      // 대한민국 전용 박스에서 추출 실패시, allCountries에서 대한민국 찾기
      if (koreaMedals.total === 0) {
        const koreaFromList = sortedCountries.find(c => c.nation === '대한민국');
        if (koreaFromList) {
          koreaMedals = {
            gold: koreaFromList.gold,
            silver: koreaFromList.silver,
            bronze: koreaFromList.bronze,
            total: koreaFromList.total
          };
        }
      }

      return {
        korea: koreaMedals,
        allCountries: sortedCountries
      };
    });

    await browser.close();

    if (!medalData) {
      console.warn('메달 정보를 찾을 수 없습니다');
      return {
        korea: { gold: 0, silver: 0, bronze: 0, total: 0 },
        allCountries: []
      };
    }

    console.log(`✓ 대한민국 메달 정보: 금 ${medalData.korea.gold}, 은 ${medalData.korea.silver}, 동 ${medalData.korea.bronze}, 합계 ${medalData.korea.total}`);
    console.log(`✓ 전체 국가 순위: ${medalData.allCountries.length}개국`);
    return medalData;

  } catch (error) {
    if (browser) await browser.close();
    console.error('메달 정보 크롤링 실패:', error.message);
    return { gold: 0, silver: 0, bronze: 0, total: 0 };
  }
}

/**
 * 대한민국 메달리스트 정보 크롤링
 */
async function crawlKoreaMedalists() {
  let browser;
  try {
    console.log('대한민국 메달리스트 정보 크롤링 시작...');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15');

    await page.goto(NAVER_URLS.medalists, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // React 렌더링 대기
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 메달리스트 데이터 추출 - 네이버 스포츠 메달리스트 페이지 구조 기반
    const medalistsData = await page.evaluate(() => {
      const medalists = [];

      // 메달리스트 목록 아이템: li.OlympicMedal_medal_list_item__fOQcv
      const listItems = document.querySelectorAll('.OlympicMedal_medal_list_item__fOQcv');

      console.log('[DEBUG] Found medalist items:', listItems.length);

      listItems.forEach((item) => {
        try {
          // 선수명: strong.OlympicMedal_name__cCJ+U
          const nameEl = item.querySelector('[class*="OlympicMedal_name"]');
          const name = nameEl ? nameEl.textContent.trim() : '';

          // 종목: em.OlympicMedal_discipline__T3wnb
          const disciplineEl = item.querySelector('[class*="OlympicMedal_discipline"]');
          const discipline = disciplineEl ? disciplineEl.textContent.trim() : '';

          // 세부 종목/이벤트: em.OlympicMedal_event__I0Bzw (상세 펼침 시 표시)
          const eventEl = item.querySelector('[class*="OlympicMedal_event"]');
          const event = eventEl ? eventEl.textContent.trim() : '';

          // 메달 개수 추출
          const medalArea = item.querySelector('[class*="OlympicMedal_medal_area"]');
          if (!medalArea) return;

          const medalSpans = medalArea.querySelectorAll('.OlympicMedal_medal__XB68Z');
          let gold = 0, silver = 0, bronze = 0;

          medalSpans.forEach((span) => {
            // 숫자만 추출 (span 안에 "금0", "은1" 등의 텍스트)
            const text = span.textContent.replace(/[^0-9]/g, '');
            const count = parseInt(text) || 0;

            if (span.classList.contains('OlympicMedal_type_gold__4ubSW')) {
              gold = count;
            } else if (span.classList.contains('OlympicMedal_type_silver__70ph7')) {
              silver = count;
            } else if (span.className.includes('type_bronze')) {
              bronze = count;
            }
          });

          // 메달이 있는 선수만 추가 (한국 선수만 표시되는 페이지이므로 국가 필터 불필요)
          if (name && (gold > 0 || silver > 0 || bronze > 0)) {
            const fullDiscipline = event ? `${discipline} ${event}` : discipline;

            if (gold > 0) {
              medalists.push({ name, medalType: 'gold', discipline: fullDiscipline, date: '' });
            }
            if (silver > 0) {
              medalists.push({ name, medalType: 'silver', discipline: fullDiscipline, date: '' });
            }
            if (bronze > 0) {
              medalists.push({ name, medalType: 'bronze', discipline: fullDiscipline, date: '' });
            }
          }
        } catch (err) {
          console.error('메달리스트 파싱 오류:', err);
        }
      });

      return medalists;
    });

    await browser.close();

    console.log(`✓ 대한민국 메달리스트: ${medalistsData.length}명`);
    return medalistsData;

  } catch (error) {
    if (browser) await browser.close();
    console.error('메달리스트 정보 크롤링 실패:', error.message);
    return [];
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
          let time = '';
          if (timeEl) {
            const datetime = timeEl.getAttribute('datetime');
            if (datetime) {
              const timePart = datetime.split('T')[1];
              time = timePart ? timePart.substring(0, 5) : '';
            } else {
              time = timeEl.textContent.replace(/경기\s*시간/g, '').trim();
            }
          }

          // 종목 정보 (date 타입 페이지에서는 discipline, discipline 타입에서는 title)
          const disciplineEl = box.querySelector('.GameInfo_discipline__NmqXP') || box.querySelector('.GameInfo_title__jLOhV');
          const discipline = disciplineEl ? disciplineEl.textContent.trim() : '';

          // 상태 정보 (LIVE, 종료 등)
          const statusBadge = box.querySelector('.GameInfo_status_badge__TiQiR');
          const status = statusBadge ? statusBadge.textContent.trim() : '';

          // 선수/팀 정보: 정확한 클래스 사용
          const playerEls = box.querySelectorAll('.GamePlayer_player__jZDrh');
          const players = [];
          playerEls.forEach(el => {
            const name = el.textContent.trim();
            if (name) players.push(name);
          });

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
            let time = '';
            if (timeEl) {
              const datetime = timeEl.getAttribute('datetime');
              if (datetime) {
                const timePart = datetime.split('T')[1];
                time = timePart ? timePart.substring(0, 5) : '';
              } else {
                time = timeEl.textContent.replace(/경기\s*시간/g, '').trim();
              }
            }

            const disciplineEl = box.querySelector('.GameInfo_discipline__NmqXP') || box.querySelector('.GameInfo_title__jLOhV');
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
 * 종목별 경기 일정 크롤링 (날짜별로 크롤링 후 종목별 그룹화)
 * isKorean=Y 파라미터가 날짜별 페이지에서 잘 작동하므로 이 방식 사용
 */
async function crawlAllDisciplineSchedules() {
  let browser;
  try {
    console.log('종목별 경기 일정 크롤링 시작 (날짜별 크롤링 방식)...');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15');

    // 올림픽 기간: 2/6 ~ 2/22 (17일)
    const startDate = new Date('2026-02-06');
    const endDate = new Date('2026-02-22');
    const allGames = [];

    // 각 날짜별로 크롤링
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      console.log(`  ${dateStr} 크롤링 중...`);

      try {
        const url = NAVER_URLS.scheduleToday(dateStr);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(resolve => setTimeout(resolve, 2000));

        const dayGames = await page.evaluate((targetDate) => {
          const games = [];
          const gameBoxes = document.querySelectorAll('.GameBox_game_box__tYM7H');

          gameBoxes.forEach((box) => {
            try {
              // 시간
              const timeEl = box.querySelector('.GameInfo_time__xl0OG');
              let time = '';
              if (timeEl) {
                const datetime = timeEl.getAttribute('datetime');
                if (datetime) {
                  const timePart = datetime.split('T')[1];
                  time = timePart ? timePart.substring(0, 5) : '';
                } else {
                  time = timeEl.textContent.replace(/경기\s*시간/g, '').trim();
                }
              }

              // 종목명 (discipline 태그에서)
              const disciplineEl = box.querySelector('.GameInfo_discipline__NmqXP');
              const discipline = disciplineEl ? disciplineEl.textContent.trim() : '';

              // 세부 종목명 (title 태그에서)
              const titleEl = box.querySelector('.GameInfo_title__jLOhV');
              const disciplineDetail = titleEl ? titleEl.textContent.trim() : '';

              // 상태
              const statusBadge = box.querySelector('.GameInfo_status_badge__TiQiR');
              const status = statusBadge ? statusBadge.textContent.trim() : '';

              // 선수/팀 정보
              const playerEls = box.querySelectorAll('.GamePlayer_player__jZDrh');
              const players = [];
              playerEls.forEach(el => {
                const name = el.textContent.trim();
                if (name) players.push(name);
              });

              // 스코어 정보
              const scores = [];
              const scoreEls = box.querySelectorAll('.GamePlayer_score__IVnBH');
              scoreEls.forEach(el => {
                const text = el.textContent.replace(/스코어/g, '').trim();
                if (text && /\d/.test(text)) {
                  scores.push(text);
                }
              });

              // 승/패 정보
              let result = null;
              if (players.length >= 2 && scores.length >= 2) {
                const firstPlayerItem = box.querySelector('.GamePlayer_player_item__UIYmq');
                if (firstPlayerItem) {
                  const firstResultWrap = firstPlayerItem.querySelector('[class*="type_win"]');
                  if (firstResultWrap) {
                    result = players[0] + ' 승';
                  } else if (box.querySelector('[class*="type_win"]')) {
                    result = players[1] + ' 승';
                  }
                }
              }

              // 올림픽특집 제외
              if (discipline && discipline !== '올림픽특집') {
                games.push({
                  date: targetDate,
                  time,
                  discipline,
                  disciplineDetail: disciplineDetail || discipline,
                  status,
                  players: players.length > 0 ? players : null,
                  scores: scores.length > 0 ? scores : null,
                  result,
                });
              }
            } catch (err) {
              // skip
            }
          });

          return games;
        }, dateStr);

        allGames.push(...dayGames);
        console.log(`    -> ${dayGames.length}개 경기`);
      } catch (err) {
        console.error(`    -> ${dateStr} 크롤링 실패:`, err.message);
      }
    }

    await browser.close();

    // 종목별로 그룹화
    const disciplineSchedules = {};
    const disciplineNameMap = {};

    // DISCIPLINE_LIST에서 이름 매핑 생성
    DISCIPLINE_LIST.forEach(d => {
      disciplineNameMap[d.name] = d.id;
    });

    allGames.forEach(game => {
      // 종목 이름으로 ID 찾기
      const disciplineId = disciplineNameMap[game.discipline];
      if (disciplineId) {
        if (!disciplineSchedules[disciplineId]) {
          disciplineSchedules[disciplineId] = {
            name: game.discipline,
            games: [],
          };
        }
        // 중복 제거 (같은 날짜, 시간, 세부종목)
        const isDuplicate = disciplineSchedules[disciplineId].games.some(
          g => g.date === game.date && g.time === game.time && g.disciplineDetail === game.disciplineDetail
        );
        if (!isDuplicate) {
          disciplineSchedules[disciplineId].games.push({
            date: game.date,
            time: game.time,
            disciplineDetail: game.disciplineDetail,
            status: game.status,
            players: game.players,
            scores: game.scores,
            result: game.result,
          });
        }
      }
    });

    // 각 종목의 경기를 날짜순 정렬
    Object.values(disciplineSchedules).forEach(discipline => {
      discipline.games.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time || '00:00'}`);
        const dateB = new Date(`${b.date}T${b.time || '00:00'}`);
        return dateA - dateB;
      });
      // 최대 30경기
      discipline.games = discipline.games.slice(0, 30);
    });

    console.log(`✓ 종목별 일정: ${Object.keys(disciplineSchedules).length}개 종목`);
    Object.entries(disciplineSchedules).forEach(([id, data]) => {
      console.log(`  - ${data.name}: ${data.games.length}개 경기`);
    });

    return disciplineSchedules;

  } catch (error) {
    if (browser) await browser.close();
    console.error('종목별 경기 일정 크롤링 실패:', error.message);
    return {};
  }
}

/**
 * 모든 동계올림픽 데이터 수집
 */
async function crawlWinterOlympicsData() {
  try {
    console.log('동계올림픽 데이터 크롤링 시작...');

    // 순차 실행으로 변경 (병렬 실행 시 타임아웃 발생)
    const medals = await crawlMedals();
    const koreaMedalists = await crawlKoreaMedalists();
    const todaySchedule = await crawlTodaySchedule();
    const upcomingSchedule = await crawlUpcomingSchedule();
    const disciplineSchedules = await crawlAllDisciplineSchedules();

    // 기본값 처리
    const safemedals = medals || { korea: { gold: 0, silver: 0, bronze: 0, total: 0 }, allCountries: [] };

    console.log('\n[RESULT] 대한민국 메달:', safemedals.korea);
    console.log('[RESULT] 전체 국가:', safemedals.allCountries?.length || 0, '개국');
    console.log('[RESULT] 대한민국 메달리스트:', koreaMedalists?.length || 0, '명');
    console.log('[RESULT] 오늘의 경기:', todaySchedule?.length || 0, '개');
    console.log('[RESULT] 다가오는 경기:', upcomingSchedule?.length || 0, '개');
    console.log('[RESULT] 종목별 일정:', Object.keys(disciplineSchedules || {}).length, '개 종목');

    // winter-olympics-detail.json 생성
    const winterOlympicsDetail = {
      lastUpdate: new Date().toISOString(),
      medals: safemedals.korea,
      allCountriesMedals: safemedals.allCountries || [],
      koreaMedalists: koreaMedalists || [],
      todaySchedule: todaySchedule || [],
      upcomingSchedule: upcomingSchedule || [],
      disciplineSchedules: disciplineSchedules || {},
    };

    // sports.json 업데이트
    const sportsJsonPath = path.join(DATA_DIR, 'sports.json');
    let sportsData = {};

    if (fs.existsSync(sportsJsonPath)) {
      sportsData = JSON.parse(fs.readFileSync(sportsJsonPath, 'utf8'));
    }

    sportsData.winterOlympics = {
      eventName: '밀라노-코르티나 2026',
      medals: safemedals.korea,
      todayGames: todaySchedule?.length || 0,
      upcomingGames: (upcomingSchedule || []).slice(0, 3), // 최대 3개
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
    console.log(`  - 대한민국 메달: 금 ${safemedals.korea.gold}, 은 ${safemedals.korea.silver}, 동 ${safemedals.korea.bronze}`);
    console.log(`  - 전체 국가: ${safemedals.allCountries?.length || 0}개국`);
    console.log(`  - 대한민국 메달리스트: ${koreaMedalists?.length || 0}명`);
    console.log(`  - 오늘의 경기: ${todaySchedule?.length || 0}개`);
    console.log(`  - 다가오는 경기: ${upcomingSchedule?.length || 0}개`);
    console.log(`  - 종목별 일정: ${Object.keys(disciplineSchedules || {}).length}개 종목`);

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
