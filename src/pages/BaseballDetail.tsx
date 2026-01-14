import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BaseballData } from '@/types';
import { fetchBaseballData } from '@/utils/dataUpdater';

const BaseballDetail = () => {
  const [data, setData] = useState<BaseballData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pitcher' | 'batter'>('pitcher');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const result = await fetchBaseballData();
      setData(result);
      setLoading(false);
    };

    loadData();
  }, []);

  if (loading || !data) {
    return <div className="p-4">로딩 중...</div>;
  }

  const isInSeason = data.seasonStatus === 'in-season';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link to="/" className="text-blue-600 hover:text-blue-800">← 돌아가기</Link>
          <h1 className="text-2xl font-bold mt-2">{data.team}</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-10 gap-6">
          {/* 왼쪽: 리그 순위 (4:6 비율) */}
          <div className="md:col-span-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">리그 순위</h2>
              <div className="space-y-2">
                {data.leagueStandings.map((team) => (
                  <div
                    key={team.name}
                    className={`p-3 rounded ${
                      team.name === data.team
                        ? 'bg-blue-100 border-2 border-blue-500'
                        : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">{team.rank}위 {team.name}</span>
                      <span className="text-sm text-gray-600">
                        {team.wins}승 {team.losses}패 ({(team.winRate * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 오른쪽: 투수/타자 기록 (4:6 비율) */}
          <div className="md:col-span-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              {/* 탭 */}
              <div className="flex border-b mb-4">
                <button
                  onClick={() => setActiveTab('pitcher')}
                  className={`px-4 py-2 font-semibold ${
                    activeTab === 'pitcher'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500'
                  }`}
                >
                  투수 기록
                </button>
                <button
                  onClick={() => setActiveTab('batter')}
                  className={`px-4 py-2 font-semibold ${
                    activeTab === 'batter'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500'
                  }`}
                >
                  타자 기록
                </button>
              </div>

              {/* 탭 내용 */}
              <div className="min-h-[300px]">
                {activeTab === 'pitcher' ? (
                  <div>
                    {data.pitchers.length > 0 ? (
                      <div className="space-y-2">
                        {data.pitchers.map((player, idx) => (
                          <div key={idx} className="p-3 bg-gray-50 rounded">
                            <div className="font-semibold">{player.name}</div>
                            <div className="text-sm text-gray-600">{player.position}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-8">데이터 없음</div>
                    )}
                  </div>
                ) : (
                  <div>
                    {data.batters.length > 0 ? (
                      <div className="space-y-2">
                        {data.batters.map((player, idx) => (
                          <div key={idx} className="p-3 bg-gray-50 rounded">
                            <div className="font-semibold">{player.name}</div>
                            <div className="text-sm text-gray-600">{player.position}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-8">데이터 없음</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 시즌 중: 현재 시리즈 */}
        {isInSeason && data.currentSeries && (
          <div className="mt-6 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">현재 시리즈</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">vs {data.currentSeries.opponent}</h3>
                <div className="space-y-2">
                  {data.currentSeries.games.map((game, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded">
                      <div className="flex justify-between">
                        <span>{game.date}</span>
                        <span className={game.result === 'win' ? 'text-blue-600' : game.result === 'loss' ? 'text-red-600' : 'text-gray-600'}>
                          {game.result === 'win' ? '승' : game.result === 'loss' ? '패' : '무'} - {game.score}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 상대전적 - 하단 */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">상대전적</h2>
          {data.headToHead.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.headToHead.map((h2h, idx) => (
                <div key={idx} className="p-4 bg-gray-50 rounded">
                  <div className="font-semibold mb-2">{h2h.opponent}</div>
                  <div className="text-sm text-gray-600">
                    {h2h.wins}승 {h2h.losses}패 {h2h.draws}무
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">데이터 없음</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BaseballDetail;