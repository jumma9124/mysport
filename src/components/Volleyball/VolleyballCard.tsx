import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { VolleyballData } from '@/types';
import { fetchVolleyballData } from '@/utils/dataUpdater';
import { getSeasonStatus, getDaysUntilSeasonStart } from '@/utils/seasonManager';

const VolleyballCard = () => {
  const [data, setData] = useState<VolleyballData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const result = await fetchVolleyballData();
      setData(result);
      setLoading(false);
    };

    loadData();
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

  const isInSeason = getSeasonStatus('volleyball') === 'in-season';
  const isOffSeason = getSeasonStatus('volleyball') === 'off-season';
  const daysUntilStart = getDaysUntilSeasonStart('volleyball');
  const borderColor = isInSeason ? '2px solid #ff9800' : '1px solid rgba(255, 255, 255, 0.2)';

  return (
    <Link to="/volleyball" className="block h-full">
      <div className="transition-colors cursor-pointer h-full flex flex-col overflow-auto" style={{
        background: 'rgb(32, 34, 52)',
        backdropFilter: 'blur(10px)',
        borderRadius: '15px',
        padding: '20px',
        border: borderColor
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
          <span className="text-sm text-gray-400">V-리그</span>
        </div>

        {/* 순위 */}
        <div className="text-5xl font-bold text-white mb-6 text-center">{data.currentRank}위</div>

        {/* 전적 정보 */}
        <div className="bg-gray-800/50 rounded-lg p-3 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-base" style={{ color: 'rgba(255,255,255,0.7)' }}>
              전적 / 승점{isOffSeason ? ' / 시즌 종료' : ' / 세트득실률'}
            </span>
            <span className="text-base text-white">
              {data.record.wins}승 {data.record.losses}패
              <span style={{ margin: '0 8px', color: 'rgba(255,255,255,0.4)' }}>/</span>
              {data.record.points}점
              {!isOffSeason && (
                <>
                  <span style={{ margin: '0 8px', color: 'rgba(255,255,255,0.4)' }}>/</span>
                  {data.record.setRate.toFixed(3)}
                </>
              )}
            </span>
          </div>
        </div>

        {/* 오프시즌 - 마지막 시리즈 */}
        {isOffSeason && (
          <>
            <h4 className="text-sm text-white mb-2">마지막 시리즈</h4>
            <div className="bg-gray-800/50 rounded-lg p-3">
              {data.recentMatches.length > 0 ? (
                <div className="flex items-center justify-between">
                  <span className="text-base text-white">vs {data.recentMatches[0].opponent}</span>
                  <span className={`px-2 py-1 text-white text-sm rounded ${data.recentMatches[0].result === 'win' ? 'bg-green-600' : 'bg-red-600'}`}>
                    {data.recentMatches[0].result === 'win' ? '승' : '패'} ({data.recentMatches[0].score})
                  </span>
                </div>
              ) : (
                <div className="text-base text-gray-400">데이터 없음</div>
              )}
            </div>
          </>
        )}

        {/* 시즌 중 - 최근/다음 경기 */}
        {!isOffSeason && (
          <>
            <h4 className="text-sm text-white mb-2">최근 경기</h4>
            <div className="bg-gray-800/50 rounded-lg p-3 mb-3">
              {data.recentMatches.length > 0 ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-0.5 rounded text-sm"
                      style={{
                        backgroundColor: data.recentMatches[0].result === 'win' ? 'rgba(76, 175, 80, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: data.recentMatches[0].result === 'win' ? 'rgba(76, 175, 80, 0.7)' : 'rgba(239, 68, 68, 0.7)'
                      }}
                    >
                      {data.recentMatches[0].result === 'win' ? '승' : '패'} ({data.recentMatches[0].score})
                    </span>
                    <span className="text-base text-white">vs {data.recentMatches[0].opponent}</span>
                  </div>
                  <span className="text-sm text-gray-400">{data.recentMatches[0].date}</span>
                </div>
              ) : (
                <div className="text-base text-gray-400">데이터 없음</div>
              )}
            </div>

            <h4 className="text-sm text-white mb-2">다음 경기</h4>
            <div className="bg-gray-800/50 rounded-lg p-3">
              {data.upcomingMatch ? (
                <div className="flex items-center justify-between">
                  <span className="text-base text-white">vs {data.upcomingMatch.opponent} ({data.upcomingMatch.venue})</span>
                  <span className="text-sm text-gray-400">{data.upcomingMatch.date}</span>
                </div>
              ) : (
                <div className="text-base text-gray-400">예정된 경기 없음</div>
              )}
            </div>
          </>
        )}
      </div>
    </Link>
  );
};

export default VolleyballCard;