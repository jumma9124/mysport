import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { VolleyballData } from '@/types';
import { fetchVolleyballData } from '@/utils/dataUpdater';
import { getDaysUntilSeasonStart, getSeasonStatus } from '@/utils/seasonManager';

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
      <div className="bg-gray-900 rounded-lg p-6 animate-pulse">
        <div className="h-8 bg-gray-700 rounded w-1/2 mb-4"></div>
        <div className="h-4 bg-gray-700 rounded w-3/4"></div>
      </div>
    );
  }

  const daysUntilStart = getDaysUntilSeasonStart('volleyball');
  const isInSeason = getSeasonStatus('volleyball') === 'in-season';
  const borderColor = isInSeason ? 'border-orange-500' : 'border-gray-700';

  return (
    <Link to="/volleyball" className="block">
      <div className={`bg-gray-900 rounded-lg p-6 hover:bg-gray-800 transition-colors cursor-pointer border ${borderColor}`}>
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <h2 className="text-xl font-bold text-white">{data.team}</h2>
          </div>
          <span className="text-sm text-gray-400">V-리그</span>
        </div>

        {/* 순위 */}
        <div className="mb-4">
          <div className="text-4xl font-bold text-white mb-2">{data.currentRank}위</div>
          <div className="text-sm text-white">전적 / 승률 / 세트득실률</div>
          <div className="text-sm text-gray-300 mt-1">
            {data.record.wins}승 {data.record.losses}패 / 승률 {data.record.winRate.toFixed(3)} / {data.record.setRate.toFixed(3)}
          </div>
        </div>

        {/* 최근 경기 */}
        <div className="border-t border-gray-700 pt-4 mb-4">
          <h4 className="text-sm text-white mb-2">최근 경기</h4>
          {data.recentMatches.length > 0 ? (
            <div className="flex items-center justify-between">
              <span className="text-sm text-white">vs {data.recentMatches[0].opponent}</span>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-white text-xs rounded ${data.recentMatches[0].result === 'win' ? 'bg-green-600' : 'bg-red-600'}`}>
                  {data.recentMatches[0].result === 'win' ? '승' : '패'} ({data.recentMatches[0].score})
                </span>
                <span className="text-xs text-gray-400">{data.recentMatches[0].date}</span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-400">로딩 중...</div>
          )}
        </div>

        {/* 다음 경기 */}
        <div className="border-t border-gray-700 pt-4">
          <h4 className="text-sm text-white mb-2">다음 경기</h4>
          {data.upcomingMatch ? (
            <div className="flex items-center justify-between">
              <span className="text-sm text-white">vs {data.upcomingMatch.opponent} ({data.upcomingMatch.venue})</span>
              <span className="text-xs text-gray-400">{data.upcomingMatch.date}</span>
            </div>
          ) : (
            <div className="text-sm text-gray-400">로딩 중...</div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default VolleyballCard;