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
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">로딩 중...</div>
      </div>
    );
  }

  const isInSeason = data.seasonStatus === 'in-season';

  return (
    <div className="min-h-screen bg-black flex flex-col p-4 md:p-6">
      <div className="max-w-7xl mx-auto w-full flex flex-col flex-1">
        {/* 헤더 */}
        <header className="mb-6">
          <Link to="/" className="text-white hover:text-gray-300 inline-flex items-center mb-4">
            ← 돌아가기
          </Link>
          <h1 className="text-3xl font-bold text-white">{data.team}</h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-10 gap-6">
          {/* 왼쪽: 리그 순위 (4:6 비율) */}
          <div className="md:col-span-4">
            <div className="h-full flex flex-col overflow-auto" style={{
              background: 'rgb(32, 34, 52)',
              backdropFilter: 'blur(10px)',
              borderRadius: '15px',
              padding: '20px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <h2 className="text-xl font-bold mb-4 text-white">리그 순위</h2>
              <div className="space-y-2">
                {data.leagueStandings.map((team) => (
                  <div
                    key={team.name}
                    className="p-3 rounded"
                    style={{
                      background: team.name === data.team
                        ? 'rgba(76, 175, 80, 0.2)'
                        : 'rgba(255, 255, 255, 0.05)',
                      border: team.name === data.team
                        ? '2px solid rgba(76, 175, 80, 0.5)'
                        : '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-white">{team.rank}위 {team.name}</span>
                      <span className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
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
            <div className="h-full flex flex-col overflow-auto" style={{
              background: 'rgb(32, 34, 52)',
              backdropFilter: 'blur(10px)',
              borderRadius: '15px',
              padding: '20px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              {/* 탭 */}
              <div className="flex mb-4" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <button
                  onClick={() => setActiveTab('pitcher')}
                  className={`px-4 py-2 font-semibold ${
                    activeTab === 'pitcher'
                      ? 'text-white'
                      : 'text-gray-500'
                  }`}
                  style={activeTab === 'pitcher' ? {
                    borderBottom: '2px solid rgba(76, 175, 80, 0.5)'
                  } : {}}
                >
                  투수 기록
                </button>
                <button
                  onClick={() => setActiveTab('batter')}
                  className={`px-4 py-2 font-semibold ${
                    activeTab === 'batter'
                      ? 'text-white'
                      : 'text-gray-500'
                  }`}
                  style={activeTab === 'batter' ? {
                    borderBottom: '2px solid rgba(76, 175, 80, 0.5)'
                  } : {}}
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
                          <div key={idx} className="p-3 rounded" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                            <div className="font-semibold text-white">{player.name}</div>
                            <div className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                              {player.position}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        데이터 없음
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {data.batters.length > 0 ? (
                      <div className="space-y-2">
                        {data.batters.map((player, idx) => (
                          <div key={idx} className="p-3 rounded" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                            <div className="font-semibold text-white">{player.name}</div>
                            <div className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                              {player.position}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        데이터 없음
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 시즌 중: 현재 시리즈 */}
        {isInSeason && data.currentSeries && (
          <div className="mt-6" style={{
            background: 'rgb(32, 34, 52)',
            backdropFilter: 'blur(10px)',
            borderRadius: '15px',
            padding: '20px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h2 className="text-xl font-bold mb-4 text-white">현재 시리즈</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2 text-white">vs {data.currentSeries.opponent}</h3>
                <div className="space-y-2">
                  {data.currentSeries.games.map((game, idx) => (
                    <div key={idx} className="p-3 rounded" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                      <div className="flex justify-between text-white">
                        <span>{game.date}</span>
                        <span className={game.result === 'win' ? 'text-green-400' : game.result === 'loss' ? 'text-red-400' : 'text-gray-400'}>
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
        <div className="mt-6" style={{
          background: 'rgb(32, 34, 52)',
          backdropFilter: 'blur(10px)',
          borderRadius: '15px',
          padding: '20px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <h2 className="text-xl font-bold mb-4 text-white">상대전적</h2>
          {data.headToHead.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.headToHead.map((h2h, idx) => (
                <div key={idx} className="p-4 rounded" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                  <div className="font-semibold mb-2 text-white">{h2h.opponent}</div>
                  <div className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    {h2h.wins}승 {h2h.losses}패 {h2h.draws}무
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8" style={{ color: 'rgba(255,255,255,0.5)' }}>
              데이터 없음
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BaseballDetail;
