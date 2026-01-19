import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BaseballData } from '@/types';
import { fetchBaseballData } from '@/utils/dataUpdater';
import { getDaysUntilSeasonStart } from '@/utils/seasonManager';

const BaseballCard = () => {
  const [data, setData] = useState<BaseballData | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading || !data) {
    return (
      <div className="animate-pulse h-full flex flex-col overflow-auto" style={{
        background: 'rgb(32, 34, 52)',
        backdropFilter: 'blur(10px)',
        borderRadius: '15px',
        padding: '20px',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div className="h-8 bg-gray-700 rounded w-1/2 mb-4"></div>
        <div className="h-4 bg-gray-700 rounded w-3/4"></div>
      </div>
    );
  }

  const daysUntilStart = getDaysUntilSeasonStart('baseball');
  const isOffSeason = data.seasonStatus === 'off-season';

  return (
    <Link to="/baseball" className="block h-full">
      <div className="transition-colors cursor-pointer h-full flex flex-col overflow-auto" style={{
        background: 'rgb(32, 34, 52)',
        backdropFilter: 'blur(10px)',
        borderRadius: '15px',
        padding: '20px',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-7 h-7 mr-2 flex-shrink-0 inline-flex items-center justify-center rounded border-2" style={{
              background: 'rgba(76, 175, 80, 0.2)',
              borderColor: 'rgba(76, 175, 80, 0.5)',
              color: '#4caf50',
              fontSize: '16px',
              fontWeight: 700
            }}>
              ✓
            </div>
            <h2 className="text-xl font-bold text-white">
              {data.team}
              {daysUntilStart !== null && (
                <span className="text-sm font-normal ml-2">(D-{daysUntilStart})</span>
              )}
            </h2>
          </div>
          <span className="text-sm text-gray-400">KBO 리그</span>
        </div>

        {/* 순위 */}
        <div className="text-5xl font-bold text-white mb-6 text-center">{data.currentRank}위</div>

        {/* 전적 정보 */}
        <div className="bg-gray-800/50 rounded-lg p-3 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-base" style={{ color: 'rgba(255,255,255,0.7)' }}>
              전적 / 승률{isOffSeason ? ' / 시즌 종료' : ''}
            </span>
            <span className="text-base text-white">
              {data.record.wins}승 {data.record.losses}패 {data.record.draws}무
              <span style={{ margin: '0 8px', color: 'rgba(255,255,255,0.4)' }}>/</span>
              승률 .{(data.record.winRate * 1000).toFixed(0)}
            </span>
          </div>
        </div>

        {/* 마지막 시리즈 */}
        {isOffSeason && (
          <>
            <h4 className="text-sm text-white mb-2">마지막 시리즈</h4>
            <div className="bg-gray-800/50 rounded-lg p-3">
              {data.lastSeries ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base text-white">vs {data.lastSeries.opponent}</span>
                    <span
                      className="px-2 py-0.5 rounded text-sm"
                      style={{
                        backgroundColor: data.lastSeries.result === 'win' ? 'rgba(76, 175, 80, 0.15)' : data.lastSeries.result === 'loss' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(156, 163, 175, 0.15)',
                        color: data.lastSeries.result === 'win' ? 'rgba(76, 175, 80, 0.7)' : data.lastSeries.result === 'loss' ? 'rgba(239, 68, 68, 0.7)' : 'rgba(156, 163, 175, 0.7)'
                      }}
                    >
                      {data.lastSeries.result === 'win' ? '승' : data.lastSeries.result === 'loss' ? '패' : '무'}
                    </span>
                  </div>
                  <span className="text-sm text-gray-400">{data.lastSeries.date}</span>
                </div>
              ) : (
                <div className="text-base text-gray-400">로딩 중...</div>
              )}
            </div>
          </>
        )}

        {!isOffSeason && (
          <>
            <h4 className="text-sm text-white mb-2">다음 경기</h4>
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="text-base text-gray-400">예정된 경기 없음</div>
            </div>
          </>
        )}
      </div>
    </Link>
  );
};

export default BaseballCard;