import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { BaseballData, BaseballPitcher, BaseballBatter } from '@/types';
import { fetchBaseballData } from '@/utils/dataUpdater';

const BaseballDetail = () => {
  const [data, setData] = useState<BaseballData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pitcher' | 'batter'>('pitcher');
  const [playerRecordsHeight, setPlayerRecordsHeight] = useState<number | null>(null);
  const leagueStandingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const result = await fetchBaseballData();
      setData(result);
      setLoading(false);
    };

    loadData();
  }, []);

  // 리그 순위 섹션의 높이를 측정해서 선수 기록 섹션 높이에 적용
  useEffect(() => {
    if (leagueStandingsRef.current && data) {
      const updateHeight = () => {
        if (leagueStandingsRef.current) {
          setPlayerRecordsHeight(leagueStandingsRef.current.offsetHeight);
        }
      };
      
      updateHeight();
      window.addEventListener('resize', updateHeight);
      
      return () => {
        window.removeEventListener('resize', updateHeight);
      };
    }
  }, [data]);

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

        <div className="grid grid-cols-1 md:grid-cols-10 gap-6" style={{ alignItems: 'stretch' }}>
          {/* 왼쪽: 리그 순위 (4:6 비율) */}
          <div className="md:col-span-4" style={{ display: 'flex' }}>
            <div ref={leagueStandingsRef} className="flex flex-col w-full" style={{
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

          {/* 오른쪽: 투수/타자 기록 (4:6 비율) */}
          <div className="md:col-span-6" style={{ display: 'flex' }}>
            <div className="flex flex-col w-full" style={{
              background: 'rgb(32, 34, 52)',
              backdropFilter: 'blur(10px)',
              borderRadius: '15px',
              padding: '20px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              height: playerRecordsHeight ? `${playerRecordsHeight}px` : 'auto'
            }}>
              {/* 헤더 */}
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
                <h2 className="text-xl font-bold text-white">선수 기록</h2>
              </div>

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
              <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', minHeight: 0 }}>
                {activeTab === 'pitcher' ? (
                  <div>
                    {data.pitchers.length > 0 ? (
                      <div>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                              <th style={{ padding: '10px 8px', textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: 600 }}>순위</th>
                              <th style={{ padding: '10px 8px', textAlign: 'left', color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: 600 }}>선수</th>
                              <th style={{ padding: '10px 8px', textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: 600 }}>평균자책</th>
                              <th style={{ padding: '10px 8px', textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: 600 }}>경기</th>
                              <th style={{ padding: '10px 8px', textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: 600 }}>승</th>
                              <th style={{ padding: '10px 8px', textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: 600 }}>패</th>
                              <th style={{ padding: '10px 8px', textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: 600 }}>탈삼진</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[...data.pitchers]
                              .filter(p => p.era > 0)
                              .sort((a, b) => (a.rank || 999) - (b.rank || 999))
                              .slice(0, 10)
                              .map((player: BaseballPitcher, idx) => {
                                const isHanwha = player.team && (player.team.includes('한화') || player.team.includes('HH'));
                                return (
                                  <tr
                                    key={idx}
                                    style={{
                                      background: isHanwha ? 'rgba(76, 175, 80, 0.2)' : 'transparent',
                                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                                    }}
                                  >
                                    <td style={{ padding: '12px 8px', textAlign: 'center', color: 'white', fontSize: '14px', fontWeight: 600 }}>{idx + 1}</td>
                                    <td style={{ padding: '12px 8px', textAlign: 'left' }}>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <span style={{ color: isHanwha ? '#4caf50' : 'white', fontSize: '14px', fontWeight: 600 }}>{player.name}</span>
                                        {player.team && (
                                          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>{player.team}</span>
                                        )}
                                      </div>
                                    </td>
                                    <td style={{ padding: '12px 8px', textAlign: 'center', color: 'white', fontSize: '14px' }}>{player.era > 0 ? player.era.toFixed(2) : '-'}</td>
                                    <td style={{ padding: '12px 8px', textAlign: 'center', color: 'white', fontSize: '14px' }}>-</td>
                                    <td style={{ padding: '12px 8px', textAlign: 'center', color: 'white', fontSize: '14px' }}>{player.wins || 0}</td>
                                    <td style={{ padding: '12px 8px', textAlign: 'center', color: 'white', fontSize: '14px' }}>{player.losses || 0}</td>
                                    <td style={{ padding: '12px 8px', textAlign: 'center', color: 'white', fontSize: '14px' }}>{player.so || 0}</td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
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
                      <div>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                              <th style={{ padding: '10px 8px', textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: 600 }}>순위</th>
                              <th style={{ padding: '10px 8px', textAlign: 'left', color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: 600 }}>선수</th>
                              <th style={{ padding: '10px 8px', textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: 600 }}>타율</th>
                              <th style={{ padding: '10px 8px', textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: 600 }}>안타</th>
                              <th style={{ padding: '10px 8px', textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: 600 }}>홈런</th>
                              <th style={{ padding: '10px 8px', textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: 600 }}>타점</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[...data.batters]
                              .sort((a, b) => (a.rank || 999) - (b.rank || 999))
                              .slice(0, 10)
                              .map((player: BaseballBatter, idx) => {
                                const isHanwha = player.team && (player.team.includes('한화') || player.team.includes('HH'));
                                return (
                                  <tr
                                    key={idx}
                                    style={{
                                      background: isHanwha ? 'rgba(76, 175, 80, 0.2)' : 'transparent',
                                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                                    }}
                                  >
                                    <td style={{ padding: '12px 8px', textAlign: 'center', color: 'white', fontSize: '14px', fontWeight: 600 }}>{idx + 1}</td>
                                    <td style={{ padding: '12px 8px', textAlign: 'left' }}>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <span style={{ color: isHanwha ? '#4caf50' : 'white', fontSize: '14px', fontWeight: 600 }}>{player.name}</span>
                                        {player.team && (
                                          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>{player.team}</span>
                                        )}
                                      </div>
                                    </td>
                                    <td style={{ padding: '12px 8px', textAlign: 'center', color: 'white', fontSize: '14px' }}>{player.avg > 0 ? player.avg.toFixed(3) : '-'}</td>
                                    <td style={{ padding: '12px 8px', textAlign: 'center', color: 'white', fontSize: '14px' }}>{player.hits || 0}</td>
                                    <td style={{ padding: '12px 8px', textAlign: 'center', color: 'white', fontSize: '14px' }}>{player.hr || 0}</td>
                                    <td style={{ padding: '12px 8px', textAlign: 'center', color: 'white', fontSize: '14px' }}>{player.rbi || 0}</td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
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
            <h2 className="text-xl font-bold text-white">상대전적</h2>
          </div>
          {data.headToHead.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    {data.headToHead.map((h2h, idx) => (
                      <th key={idx} style={{
                        padding: '10px 12px',
                        textAlign: 'center',
                        color: 'rgba(255,255,255,0.7)',
                        fontSize: '14px',
                        fontWeight: 600
                      }}>
                        {h2h.opponent}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {data.headToHead.map((h2h, idx) => (
                      <td key={idx} style={{
                        padding: '12px',
                        textAlign: 'center',
                        color: 'white',
                        fontSize: '14px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                      }}>
                        {h2h.wins}-{h2h.losses}-{h2h.draws}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
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
