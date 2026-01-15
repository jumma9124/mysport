const fs = require('fs');
const path = require('path');

/**
 * 주요 국제 스포츠 이벤트 데이터 크롤링
 * 2026년 주요 대회 정보 수집
 */

const DATA_DIR = path.join(__dirname, '../public/data');

async function crawlMajorEvents() {
  try {
    console.log('Starting major events data crawl...');

    // 2026년 주요 국제 스포츠 이벤트
    const events = [
      {
        name: '2026 밀라노-코르티나 동계올림픽',
        date: '2026-02-06',
        icon: 'snow',
        description: '이탈리아 밀라노-코르티나에서 개최되는 제25회 동계 올림픽',
      },
      {
        name: '2026 월드 베이스볼 클래식',
        date: '2026-03-08',
        icon: 'baseball',
        description: '세계 최고의 야구 국가대표팀이 겨루는 국제 대회',
      },
      {
        name: '2026 FIFA 월드컵',
        date: '2026-06-11',
        icon: 'soccer',
        description: '미국, 캐나다, 멕시코 공동 개최 FIFA 월드컵',
      },
    ];

    // major-events.json 생성 (아이콘 정보만 포함)
    const majorEventsData = events.map(event => ({
      name: event.name,
      date: event.date,
      icon: event.icon,
    }));

    // 파일 저장
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    fs.writeFileSync(
      path.join(DATA_DIR, 'major-events.json'),
      JSON.stringify(majorEventsData, null, 2),
      'utf8'
    );

    console.log('✓ Major events data updated successfully');
    console.log(`  - Total events: ${events.length}`);
    events.forEach(event => {
      const daysUntil = Math.ceil((new Date(event.date) - new Date()) / (1000 * 60 * 60 * 24));
      console.log(`  - ${event.name}: D-${daysUntil}`);
    });

  } catch (error) {
    console.error('Failed to crawl major events data:', error);
    process.exit(1);
  }
}

// 스크립트 직접 실행 시
if (require.main === module) {
  crawlMajorEvents();
}

module.exports = { crawlMajorEvents };
