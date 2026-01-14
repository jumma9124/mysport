import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BaseballData } from '@/types';
import { fetchBaseballData } from '@/utils/dataUpdater';
import { getDaysUntilSeasonStart } from '@/utils/seasonManager';

const BaseballCard = () => {
  const [data, setData] = useState<BaseballData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const result = await fetchBaseballData();
      setData(result);
      setLoading(false);
    };

    loadData();
    // 실제로는 시즌 중일 때 오전 10시, 오후 10시에 업데이트
    // 오프시즌일 때는 일주일에 한번
  }, []);

  if (loading || !data) {
    return (
      <div className="bg-gray-900 rounded-lg p-6 animate-pulse h-full flex flex-col">
        <div className="h-8 bg-gray-700 rounded w-1/2 mb-4"></div>
        <div className="h-4 bg-gray-700 rounded w-3/4"></div>
      </div>
    );
  }

  const daysUntilStart = getDaysUntilSeasonStart('baseball');
  const isOffSeason = data.seasonStatus === 'off-season';

  return (
    <Link to="/baseball" className="block h-full">
      <div className="bg-gray-900 rounded-lg p-6 hover:bg-gray-800 transition-colors cursor-pointer h-full flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <h2 className="text-xl font-bold text-white">
              {data.team}
              {daysUntilStart !== null && daysUntilStart <= 7 && (
                <span className="text-sm font-normal ml-2">(D-{daysUntilStart})</span>
              )}
            </h2>
          </div>
          <span className="text-sm text-gray-400">KBO 리그</span>
        </div>

        {/* 순위 */}
        <div className="mb-4">
          <div className="text-4xl font-bold text-white mb-2">{data.currentRank}위</div>
          <div className="text-sm text-white">
            전적 / 승률
            {isOffSeason && <span className="text-gray-400 ml-2">시즌 종료</span>}
          </div>
          <div className="text-sm text-gray-300 mt-1">
            {data.record.wins}승 {data.record.losses}패 {data.record.draws}무 / 승률 {(data.record.winRate * 100).toFixed(3)}
          </div>
        </div>

        {/* 마지막 시리즈 */}
        {isOffSeason && (
          <div className="border-t border-gray-700 pt-4">
            <h4 className="text-sm text-white mb-2">마지막 시리즈</h4>
            {data.lastSeries ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white">vs {data.lastSeries.opponent}</span>
                  <span className="px-2 py-1 bg-red-600 text-white text-xs rounded">
                    {data.lastSeries.result === 'win' ? '승' : data.lastSeries.result === 'loss' ? '패' : '무'}
                  </span>
                </div>
                <div className="text-xs text-gray-400 mt-2">2025 시즌 최종 순위 (2026년 3월 재개)</div>
              </>
            ) : (
              <div className="text-sm text-gray-400">로딩 중...</div>
            )}
          </div>
        )}

        {!isOffSeason && (
          <div className="border-t border-gray-700 pt-4">
            <h4 className="text-sm text-white mb-2">다음 경기</h4>
            <div className="text-sm text-gray-400">로딩 중...</div>
          </div>
        )}
      </div>
    </Link>
  );
};

export default BaseballCard;