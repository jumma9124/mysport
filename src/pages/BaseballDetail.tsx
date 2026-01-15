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
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-7 h-7 mr-3 flex-shrink-0 inline-flex items-center justify-center rounded border-2" style={{
                background: 'rgba(76, 175, 80, 0.2)',
                borderColor: 'rgba(76, 175, 80, 0.5)',
                color: '#4caf50',
                fontSize: '16px',
                fontWeight: 700
              }}>
                ✓
              </div>
              <h1 className="text-3xl font-bold text-white">{data.team}</h1>
            </div>
            <Link
              to="/"
              className="text-white hover:opacity-80 inline-flex items-center px-4 py-2 rounded-lg transition-opacity"
              style={{
                background: 'rgb(32, 34, 52)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              ← 돌아가기
            </Link>
          </div>
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
              <div className="flex items-center mb-4">
                <div className="w-6 h-6 mr-2 flex-shrink-0 inline-flex items-center justify-center rounded border-2" style={{
                  background: 'rgba(76, 175, 80, 0.2)',
                  borderColor: 'rgba(76, 175, 80, 0.5)',
                  color: '#4caf50',
                  fontSize: '14px',
                  fontWeight: 700
                }}>
                  ✓
                </div>
                <h2 className="text-xl font-bold text-white">리그 순위</h2>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <th style={{ padding: '10px 8px', textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '14px', fontWeight: 600 }}>순위</th>
                      <th style={{ padding: '10px 8px', textAlign: 'left', color: 'rgba(255,255,255,0.7)', fontSize: '14px', fontWeight: 600 }}>팀</th>
                      <th style={{ padding: '10px 8px', textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '14px', fontWeight: 600 }}>전적</th>
                      <th style={{ padding: '10px 8px', textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '14px', fontWeight: 600 }}>승률</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.leagueStandings.map((team) => {
                      const isOurTeam = team.name.includes('한화');

                      return (
                        <tr
                          key={team.name}
                          style={{
                            background: isOurTeam ? 'rgba(76, 175, 80, 0.2)' : 'transparent',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                          }}
                        >
                          <td style={{ padding: '12px 8px', textAlign: 'center', color: 'white', fontSize: '14px', fontWeight: 600 }}>{team.rank}</td>
                          <td style={{ padding: '12px 8px', textAlign: 'left', color: 'white', fontSize: '14px', fontWeight: 600 }}>{team.name}</td>
                          <td style={{ padding: '12px 8px', textAlign: 'center', color: 'white', fontSize: '14px' }}>{team.wins}-{team.losses}-{team.draws}</td>
                          <td style={{ padding: '12px 8px', textAlign: 'center', color: 'white', fontSize: '14px' }}>{team.winRate?.toFixed(3) || '0.000'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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
