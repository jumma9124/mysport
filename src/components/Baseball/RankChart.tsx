import { useEffect, useState } from 'react';

interface DailyRank {
  date: string;
  rank: number;
}

interface RankChartData {
  team: string;
  season: string;
  dailyRanks: DailyRank[];
  bestRank: number;
  worstRank: number;
  currentRank: number;
}

const RankChart = () => {
  const [data, setData] = useState<RankChartData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/mysport/data/baseball-daily-rank.json')
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Failed to load rank data:', error);
        setLoading(false);
      });
  }, []);

  if (loading || !data) {
    return (
      <div className="bg-gray-800/50 rounded-lg p-4">
        <h3 className="text-lg font-bold text-white mb-4">시즌 순위 변동</h3>
        <div className="h-48 flex items-center justify-center">
          <div className="text-gray-400">로딩 중...</div>
        </div>
      </div>
    );
  }

  const { dailyRanks, bestRank, worstRank } = data;

  // Calculate chart dimensions
  const chartWidth = 800; // pixels
  const chartHeight = 200; // pixels
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };

  // Y axis: rank (inverted, 1 is at top)
  const minRank = 1;
  const maxRank = 10;

  // Calculate SVG path for line chart
  const points = dailyRanks.map((item, index) => {
    const x = (index / (dailyRanks.length - 1)) * (chartWidth - padding.left - padding.right) + padding.left;
    const y = ((item.rank - minRank) / (maxRank - minRank)) * (chartHeight - padding.top - padding.bottom) + padding.top;
    return { x, y, rank: item.rank, date: item.date };
  });

  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // Get unique months from data
  const getMonthLabels = () => {
    const months = ['3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월'];
    const monthPositions = months.map((label, idx) => {
      const monthNum = idx + 3; // 3월부터 시작
      // Find first data point for this month
      const firstPointIndex = dailyRanks.findIndex(item => {
        const month = parseInt(item.date.split('-')[1]);
        return month === monthNum;
      });

      if (firstPointIndex === -1) return null;

      const x = (firstPointIndex / (dailyRanks.length - 1)) * (chartWidth - padding.left - padding.right) + padding.left;
      return { label, x };
    }).filter(item => item !== null);

    return monthPositions;
  };

  return (
    <div className="rounded-lg p-6" style={{
      background: 'rgb(32, 34, 52)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="w-6 h-6 mr-2 flex-shrink-0 inline-flex items-center justify-center rounded border-2" style={{
            background: 'rgba(76, 175, 80, 0.2)',
            borderColor: 'rgba(76, 175, 80, 0.5)',
            color: '#4caf50',
            fontSize: '14px',
            fontWeight: 700
          }}>
            ✓
          </div>
          <h2 className="text-xl font-bold text-white">시즌 순위</h2>
        </div>
        <div className="flex gap-4 text-sm">
          <div>
            <span className="text-gray-400">최고 </span>
            <span className="text-green-400 font-bold">{bestRank}위</span>
          </div>
          <div>
            <span className="text-gray-400">최저 </span>
            <span className="text-red-400 font-bold">{worstRank}위</span>
          </div>
        </div>
      </div>

      <div className="relative" style={{ height: `${chartHeight}px` }}>
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          {/* Grid lines */}
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(rank => {
            const y = ((rank - minRank) / (maxRank - minRank)) * (chartHeight - padding.top - padding.bottom) + padding.top;
            return (
              <g key={rank}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={chartWidth - padding.right}
                  y2={y}
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="0.5"
                />
                <text
                  x={padding.left - 8}
                  y={y}
                  fill="rgba(255,255,255,0.5)"
                  fontSize="12"
                  textAnchor="end"
                  dominantBaseline="middle"
                >
                  {rank}
                </text>
              </g>
            );
          })}

          {/* Line chart */}
          <path
            d={pathData}
            fill="none"
            stroke="#4caf50"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {points.map((point, index) => (
            <g key={index}>
              <circle
                cx={point.x}
                cy={point.y}
                r="2"
                fill="#4caf50"
                stroke="white"
                strokeWidth="1"
              />
              {/* Show label for first, last, and best rank points */}
              {(index === 0 || index === points.length - 1 || point.rank === bestRank) && (
                <text
                  x={point.x}
                  y={point.y - 12}
                  fill="white"
                  fontSize="12"
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  {point.rank}위
                </text>
              )}
            </g>
          ))}

          {/* X-axis labels (months) */}
          {getMonthLabels().map((item, index) => (
            <text
              key={index}
              x={item.x}
              y={chartHeight - 10}
              fill="rgba(255,255,255,0.5)"
              fontSize="12"
              textAnchor="middle"
            >
              {item.label}
            </text>
          ))}
        </svg>
      </div>

      <div className="mt-3 text-xs text-gray-400 text-center">
        2025
      </div>
    </div>
  );
};

export default RankChart;
