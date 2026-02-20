import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BaseballData } from '@/types';
import { fetchBaseballData } from '@/utils/dataUpdater';
import { getDaysUntilSeasonStart } from '@/utils/seasonManager';

interface BaseballCardProps {
  isInSeason?: boolean;
}

const BaseballCard = ({ isInSeason = false }: BaseballCardProps) => {
  const [data, setData] = useState<BaseballData | null>(null);
  const [loading, setLoading] = useState(true);

  // 날짜 형식 변환 함수 (YYYY-MM-DD → MM.DD)
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    // ISO 형식 (2025-10-02)
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [, month, day] = dateStr.split('-');
      return `${month}.${day}`;
    }
    // 이미 YY.MM.DD 형식이면 그대로 반환
    return dateStr;
  };

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      setLoading(true);
      const result = await fetchBaseballData();
      if (isMounted) {
        setData(result);
        setLoading(false);
      }
    };

    loadData();
    // 실제로는 시즌 중일 때 오전 10시, 오후 10시에 업데이트
    // 오프시즌일 때는 일주일에 한번
    
    return () => {
      isMounted = false;
    };
  }, []);

  const borderClass = isInSeason
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

  const daysUntilStart = getDaysUntilSeasonStart('baseball');
  const isOffSeason = data.seasonStatus === 'off-season';

  return (
    <Link to="/baseball" className="block h-full">
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
          <span className="text-lg text-gray-400">KBO 리그</span>
        </div>

        {/* 순위 */}
        <div className="text-7xl font-bold text-white mb-6 text-center">{data.currentRank}위</div>

        {/* 전적 정보 */}
        <div className="bg-gray-800/50 rounded-lg p-3 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-xl text-white/70">
              전적 / 승률{isOffSeason ? ' / 시즌 종료' : ''}
            </span>
            <span className="text-xl text-white">
              {data.record.wins}승 {data.record.losses}패 {data.record.draws}무
              <span className="mx-2 text-white/40">/</span>
              승률 .{(data.record.winRate * 1000).toFixed(0)}
            </span>
          </div>
        </div>

        {/* 오프시즌 - 마지막 시리즈 */}
        {isOffSeason && (
          <>
            <h4 className="text-lg text-white mb-2">마지막 시리즈</h4>
            <div className="bg-gray-800/50 rounded-lg p-3">
              {data.lastSeries ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl text-white">vs {data.lastSeries.opponent}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-lg ${
                        data.lastSeries.result === 'win' ? 'bg-accent-green/[0.15] text-accent-green/70' :
                        data.lastSeries.result === 'loss' ? 'bg-red-500/[0.15] text-red-500/70' :
                        'bg-gray-400/[0.15] text-gray-400/70'
                      }`}
                    >
                      {data.lastSeries.result === 'win' ? '승' : data.lastSeries.result === 'loss' ? '패' : '무'}
                    </span>
                  </div>
                  <span className="text-lg text-gray-400">{formatDate(data.lastSeries.date)}</span>
                </div>
              ) : (
                <div className="text-xl text-gray-400">로딩 중...</div>
              )}
            </div>
          </>
        )}

        {/* 시즌 중 - 현재 시리즈 및 다음 시리즈 */}
        {!isOffSeason && (
          <>
            <h4 className="text-lg text-white mb-2">현재 시리즈</h4>
            <div className="bg-gray-800/50 rounded-lg p-3 mb-3">
              {data.currentSeries ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl text-white">vs {data.currentSeries.opponent}</span>
                    <span className="text-lg text-white/70">
                      {data.currentSeries.wins}승 {data.currentSeries.losses}패
                    </span>
                  </div>
                  <span className="text-lg text-gray-400">{formatDate(data.currentSeries.date)}</span>
                </div>
              ) : (
                <div className="text-xl text-gray-400">진행 중인 시리즈 없음</div>
              )}
            </div>

            <h4 className="text-lg text-white mb-2">다음 시리즈</h4>
            <div className="bg-gray-800/50 rounded-lg p-3">
              {data.nextSeries ? (
                <div className="flex items-center justify-between">
                  <span className="text-xl text-white">vs {data.nextSeries.opponent}</span>
                  <span className="text-lg text-gray-400">{formatDate(data.nextSeries.date)}</span>
                </div>
              ) : (
                <div className="text-xl text-gray-400">예정된 시리즈 없음</div>
              )}
            </div>
          </>
        )}
      </div>
    </Link>
  );
};

export default BaseballCard;