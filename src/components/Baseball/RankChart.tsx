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
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [availableYears, setAvailableYears] = useState<number[]>([2025]);

  useEffect(() => {
    // Try to load available years by checking for files
    const checkYears = async () => {
      const years = [2025, 2024, 2023, 2022];
      const available: number[] = [];

      for (const year of years) {
        try {
          const filename = year === 2025 ? 'baseball-daily-rank.json' : `baseball-daily-rank-${year}.json`;
          const response = await fetch(`/mysport/data/${filename}`, { method: 'HEAD' });
          if (response.ok) {
            available.push(year);
          }
        } catch (e) {
          // File doesn't exist
        }
      }

      if (available.length > 0) {
        setAvailableYears(available);
        setSelectedYear(available[0]);
      }
    };

    checkYears();
  }, []);

  useEffect(() => {
    const filename = selectedYear === 2025 ? 'baseball-daily-rank.json' : `baseball-daily-rank-${selectedYear}.json`;
    fetch(`/mysport/data/${filename}`)
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Failed to load rank data:', error);
        setLoading(false);
      });
  }, [selectedYear]);

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

  // Format date for display (MM.DD)
  const formatDate = (dateStr: string) => {
    const [, month, day] = dateStr.split('-');
    return `${month}.${day}`;
  };

  return (
    <div className="rounded-lg p-6" style={{
      background: 'rgb(32, 34, 52)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
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
            <h2 className="text-xl font-bold text-white">시즌 순위 변동</h2>
          </div>
          {availableYears.length > 1 && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-1 rounded bg-gray-700 text-white border border-gray-600 text-sm"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}시즌</option>
              ))}
            </select>
          )}
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

          {/* X-axis labels (dates) */}
          {[0, Math.floor(points.length / 2), points.length - 1].map(index => {
            const point = points[index];
            return (
              <text
                key={index}
                x={point.x}
                y={chartHeight - 10}
                fill="rgba(255,255,255,0.5)"
                fontSize="12"
                textAnchor="middle"
              >
                {formatDate(point.date)}
              </text>
            );
          })}
        </svg>
      </div>

      <div className="mt-3 text-xs text-gray-400 text-center">
        시즌 시작부터 현재까지의 순위 변동
      </div>
    </div>
  );
};

export default RankChart;
