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
    const loadData = async () => {
      setLoading(true);
      const result = await fetchVolleyballData();
      setData(result);
      setLoading(false);
    };

    loadData();
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
          <Link to="/" className="text-white hover:text-gray-300 inline-flex items-center mb-4">
            ← 돌아가기
          </Link>
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
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
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
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab('men')}
                    className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${
                      activeTab === 'men'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    남자부
                  </button>
                  <button
                    onClick={() => setActiveTab('women')}
                    className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${
                      activeTab === 'women'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    여자부
                  </button>
                </div>
              </div>
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
                        {team.wins}승 {team.losses}패
                      </span>
                    </div>
                  </div>
                ))}
              </div>
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
                      <div className="text-base text-white font-semibold mb-1">{data.upcomingMatch.date}</div>
                      <div className="text-base text-white">vs {data.upcomingMatch.opponent}</div>
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
                          <div>
                            <div className="font-semibold text-white">{match.date}</div>
                            <div className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                              vs {match.opponent}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span
                              className={`px-3 py-1 rounded text-sm font-semibold text-white ${
                                match.result === 'win' ? 'bg-green-600/40' : 'bg-red-600/40'
                              }`}
                            >
                              {match.result === 'win' ? '승' : '패'} ({match.score})
                            </span>
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
                          </div>
                        </button>
                        {expandedMatch === idx && (
                          <div className="p-4 border-t" style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderColor: 'rgba(255, 255, 255, 0.1)'
                          }}>
                            <div className="text-sm font-semibold mb-2 text-white">세트 스코어</div>
                            <div className="space-y-1">
                              {match.sets.map((set, setIdx) => {
                                const ourWin = set.ourScore > set.opponentScore;
                                return (
                                  <div key={setIdx} className="flex justify-between text-sm text-white">
                                    <span>{setIdx + 1}세트</span>
                                    <span>
                                      {ourWin ? `${set.ourScore}-${set.opponentScore}` : `${set.opponentScore}-${set.ourScore}`}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
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
