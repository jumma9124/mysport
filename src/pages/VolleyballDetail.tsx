import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { VolleyballData } from '@/types';
import { fetchVolleyballData } from '@/utils/dataUpdater';

const VolleyballDetail = () => {
  const [data, setData] = useState<VolleyballData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedMatch, setExpandedMatch] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'men' | 'women'>('men');

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

  const toggleMatch = (index: number) => {
    setExpandedMatch(expandedMatch === index ? null : index);
  };

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
          {/* 왼쪽: 리그 순위 + 다음 경기 (4:6 비율) */}
          <div className="md:col-span-4 flex flex-col gap-6">
            {/* 리그 순위 */}
            <div className="flex flex-col" style={{
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

              {/* 탭 */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setActiveTab('men')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    background: activeTab === 'men' ? 'rgba(102, 126, 234, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                    color: activeTab === 'men' ? 'white' : 'rgba(255,255,255,0.6)',
                    transition: 'all 0.2s'
                  }}
                >
                  남자부
                </button>
                <button
                  onClick={() => setActiveTab('women')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    background: activeTab === 'women' ? 'rgba(102, 126, 234, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                    color: activeTab === 'women' ? 'white' : 'rgba(255,255,255,0.6)',
                    transition: 'all 0.2s'
                  }}
                >
                  여자부
                </button>
              </div>

              {/* 테이블 */}
              {activeTab === 'men' ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        <th style={{ padding: '10px 8px', textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '14px', fontWeight: 600 }}>순위</th>
                        <th style={{ padding: '10px 8px', textAlign: 'left', color: 'rgba(255,255,255,0.7)', fontSize: '14px', fontWeight: 600 }}>팀</th>
                        <th style={{ padding: '10px 8px', textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '14px', fontWeight: 600 }}>승점</th>
                        <th style={{ padding: '10px 8px', textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '14px', fontWeight: 600 }}>전적</th>
                        <th style={{ padding: '10px 8px', textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '14px', fontWeight: 600 }}>세트득실률</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.leagueStandings.map((team) => {
                        const isOurTeam = team.name.includes('현대캐피탈');

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
                            <td style={{ padding: '12px 8px', textAlign: 'center', color: 'white', fontSize: '14px' }}>{team.points}</td>
                            <td style={{ padding: '12px 8px', textAlign: 'center', color: 'white', fontSize: '14px' }}>{team.wins}-{team.losses}</td>
                            <td style={{ padding: '12px 8px', textAlign: 'center', color: 'white', fontSize: '14px' }}>{team.setRate?.toFixed(3) || '0.000'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.5)' }}>
                  로딩 중...
                </div>
              )}
            </div>

            {/* 다음 경기 */}
            {data.upcomingMatch && (
              <div style={{
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
                  <h2 className="text-xl font-bold text-white">다음 경기</h2>
                </div>
                <div className="p-4 rounded" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>{data.upcomingMatch.date}</div>
                      <div className="text-lg font-semibold text-white">vs {data.upcomingMatch.opponent}</div>
                    </div>
                    <div className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                      {data.upcomingMatch.venue}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 오른쪽: 지난 경기 결과 (4:6 비율) */}
          <div className="md:col-span-6">
            {isInSeason ? (
              <div className="flex flex-col" style={{
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
                  <h2 className="text-xl font-bold text-white">지난 경기 결과</h2>
                </div>
                {data.recentMatches.length > 0 ? (
                  <div className="space-y-3">
                    {data.recentMatches.map((match, idx) => (
                      <div key={idx} className="rounded-lg" style={{ border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        <button
                          onClick={() => toggleMatch(idx)}
                          className="w-full p-4 text-left flex justify-between items-center hover:bg-white/5"
                        >
                          <div className="flex-1">
                            <div className="text-sm mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                              {match.date.includes('-') 
                                ? match.date.replace(/(\d{4})-(\d{2})-(\d{2})/, '$1.$2.$3')
                                : match.date}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="text-lg font-semibold text-white">
                                vs {match.opponent}
                              </div>
                              <span
                                className="px-2 py-0.5 rounded text-sm whitespace-nowrap"
                                style={{
                                  backgroundColor: match.result === 'win' ? 'rgba(76, 175, 80, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                  color: match.result === 'win' ? 'rgba(76, 175, 80, 0.7)' : 'rgba(239, 68, 68, 0.7)'
                                }}
                              >
                                {match.result === 'win' ? '승' : '패'} ({match.score})
                              </span>
                            </div>
                          </div>
                          <svg
                            className={`w-5 h-5 transition-transform text-white ${
                              expandedMatch === idx ? 'transform rotate-180' : ''
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>
                        {expandedMatch === idx && (
                          <div className="p-4 border-t" style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderColor: 'rgba(255, 255, 255, 0.1)'
                          }}>
                            <div className="text-sm text-white">세트 스코어 ({match.score})</div>
                          </div>
                        )}
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
              <div className="flex flex-col" style={{
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
                  <h2 className="text-xl font-bold text-white">공격수 순위</h2>
                </div>
                {data.attackers && data.attackers.length > 0 ? (
                  <div className="space-y-3">
                    {data.attackers.map((player, idx) => (
                      <div key={idx} className="p-3 rounded" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-semibold text-white">
                              {player.rank}위 {player.name}
                            </div>
                            <div className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                              {player.position}
                            </div>
                          </div>
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
  );
};

export default VolleyballDetail;
