import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { VolleyballData } from '@/types';
import { fetchVolleyballData } from '@/utils/dataUpdater';
import { getSeasonStatus, getDaysUntilSeasonStart } from '@/utils/seasonManager';

interface VolleyballCardProps {
  isInSeason?: boolean;
}

const VolleyballCard = ({ isInSeason: isInSeasonProp }: VolleyballCardProps) => {
  const [data, setData] = useState<VolleyballData | null>(null);
  const [loading, setLoading] = useState(true);

  // 날짜 형식 변환 함수 (YYYY-MM-DD → MM.DD 또는 YY.MM.DD)
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    // ISO 형식 (2026-01-21)
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [, month, day] = dateStr.split('-');
      return `${month}.${day}`;
    }
    return dateStr;
  };

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      setLoading(true);
      const result = await fetchVolleyballData();
      if (isMounted) {
        setData(result);
        setLoading(false);
      }
    };

    loadData();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const borderClass = isInSeasonProp
    ? 'border-2 border-orange-500'
    : 'border border-white/20';

  if (loading || !data) {
    return (
      <div className={`animate-pulse h-full flex flex-col overflow-auto bg-card backdrop-blur-card rounded-card p-5 ${borderClass}`}>
        <div className="h-8 bg-gray-700 rounded w-1/2 mb-4"></div>
        <div className="h-4 bg-gray-700 rounded w-3/4"></div>
      </div>
    );
  }

  const isOffSeason = getSeasonStatus('volleyball') === 'off-season';
  const daysUntilStart = getDaysUntilSeasonStart('volleyball');

  return (
    <Link to="/volleyball" className="block h-full">
      <div className={`transition-colors cursor-pointer h-full flex flex-col overflow-auto bg-card backdrop-blur-card rounded-card p-5 ${borderClass}`}>
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-7 h-7 mr-2 flex-shrink-0 inline-flex items-center justify-center rounded border-2 bg-accent-green/20 border-accent-green/50 text-accent-green text-xl font-bold">
              ✓
            </div>
            <h2 className="text-3xl font-bold text-white">
              {data.team}
              {daysUntilStart !== null && (
                <span className="text-lg font-normal ml-2">(D-{daysUntilStart})</span>
              )}
            </h2>
          </div>
          <span className="text-lg text-gray-400">V-리그</span>
        </div>

        {/* 순위 */}
        <div className="text-7xl font-bold text-white mb-6 text-center">{data.currentRank}위</div>

        {/* 오프시즌 - 시즌 총 기록만 표시 */}
        {isOffSeason && (
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h4 className="text-lg text-white/70 mb-3 text-center">시즌 총 기록</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-lg text-white/70">전적</span>
                <span className="text-xl text-white font-semibold">{data.record.wins}승 {data.record.losses}패</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg text-white/70">승점</span>
                <span className="text-xl text-white font-semibold">{data.record.points}점</span>
              </div>
              {data.record.setRate !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-lg text-white/70">세트득실률</span>
                  <span className="text-xl text-white font-semibold">{data.record.setRate.toFixed(3)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 시즌 중 - 전적 정보 */}
        {!isOffSeason && (
          <div className="bg-gray-800/50 rounded-lg p-3 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-xl text-white/70">
                전적 / 승점 / 세트득실률
              </span>
              <span className="text-xl text-white">
                {data.record.wins}승 {data.record.losses}패
                <span className="mx-2 text-white/40">/</span>
                {data.record.points}점
                {data.record.setRate !== undefined && (
                  <>
                    <span className="mx-2 text-white/40">/</span>
                    {data.record.setRate.toFixed(3)}
                  </>
                )}
              </span>
            </div>
          </div>
        )}

        {/* 시즌 중 - 최근/다음 경기 */}
        {!isOffSeason && (
          <>
            <h4 className="text-lg text-white mb-2">최근 경기</h4>
            <div className="bg-gray-800/50 rounded-lg p-3 mb-3">
              {data.recentMatches.length > 0 ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl text-white">vs {data.recentMatches[0].opponent}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-lg ${
                        data.recentMatches[0].result === 'win'
                          ? 'bg-accent-green/[0.15] text-accent-green/70'
                          : 'bg-red-500/[0.15] text-red-500/70'
                      }`}
                    >
                      {data.recentMatches[0].result === 'win' ? '승' : '패'} ({data.recentMatches[0].score})
                    </span>
                  </div>
                  <span className="text-lg text-gray-400">{formatDate(data.recentMatches[0].date)}</span>
                </div>
              ) : (
                <div className="text-xl text-gray-400">데이터 없음</div>
              )}
            </div>

            <h4 className="text-lg text-white mb-2">다음 경기</h4>
            <div className="bg-gray-800/50 rounded-lg p-3">
              {data.upcomingMatch ? (
                <div className="flex items-center justify-between">
                  <span className="text-xl text-white">vs {data.upcomingMatch.opponent} ({data.upcomingMatch.venue})</span>
                  <span className="text-lg text-gray-400">
                    {formatDate(data.upcomingMatch.date)}
                    {data.upcomingMatch.time && ` ${data.upcomingMatch.time}`}
                  </span>
                </div>
              ) : (
                <div className="text-xl text-gray-400">예정된 경기 없음</div>
              )}
            </div>
          </>
        )}
      </div>
    </Link>
  );
};

export default VolleyballCard;