const data = require('./public/data/baseball-detail.json');

const pitchers = data.pitchers.filter(p => p.era > 0).sort((a, b) => a.era - b.era).slice(0, 10);
const batters = data.batters.sort((a, b) => b.avg - a.avg).slice(0, 10);

console.log('=== 투수 TOP 10 ===');
pitchers.forEach((p, i) => {
  console.log(`${i + 1}. ${p.name} (${p.team}) - ERA: ${p.era}`);
});

const hanwhaPitchers = pitchers.filter(p => p.team && (p.team.includes('한화') || p.team.includes('HH')));
console.log('\n한화 투수:', hanwhaPitchers.length > 0 ? hanwhaPitchers.map(p => p.name).join(', ') : '없음');

console.log('\n=== 타자 TOP 10 ===');
batters.forEach((p, i) => {
  console.log(`${i + 1}. ${p.name} (${p.team}) - AVG: ${p.avg}`);
});

const hanwhaBatters = batters.filter(p => p.team && (p.team.includes('한화') || p.team.includes('HH')));
console.log('\n한화 타자:', hanwhaBatters.length > 0 ? hanwhaBatters.map(p => p.name).join(', ') : '없음');
