const https = require('https');

async function testNaverAPI() {
  const date = '2026-01-18';

  // Try different API endpoints
  const apis = [
    `https://api-gw.sports.naver.com/schedule/index?category=kovo&date=${date}`,
    `https://sports.naver.com/api/schedule?category=kovo&date=${date}`,
    `https://m.sports.naver.com/api/schedule?category=kovo&date=${date}`,
  ];

  for (const url of apis) {
    console.log('\n=== Testing API ===');
    console.log('URL:', url);

    try {
      const data = await fetchJSON(url);
      console.log('SUCCESS!');
      console.log(JSON.stringify(data, null, 2).substring(0, 2000)); // First 2000 chars
    } catch (error) {
      console.log('FAILED:', error.message);
    }
  }
}

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
        'Accept': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error('Invalid JSON'));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    }).on('error', reject);
  });
}

testNaverAPI().catch(console.error);
