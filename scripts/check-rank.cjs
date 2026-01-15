const fs = require('fs');

const data = JSON.parse(fs.readFileSync('./public/data/baseball-detail.json', 'utf8'));
const pitchers = data.pitchers.filter(p => p.era > 0).sort((a, b) => (a.rank || 999) - (b.rank || 999));

const ponce = pitchers.find(p => p.name === '폰세');
console.log('폰세 정보:', JSON.stringify(ponce, null, 2));
console.log('\n폰세 순위:', pitchers.findIndex(p => p.name === '폰세') + 1);

console.log('\nTOP 10 (네이버 순위 기준):');
pitchers.slice(0, 10).forEach((p, i) => {
  console.log(`${i+1}. ${p.name} (${p.team}) - 순위: ${p.rank}, ERA: ${p.era}, 승: ${p.wins}, 패: ${p.losses}, 탈삼진: ${p.so}`);
});
