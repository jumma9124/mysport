import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { VolleyballData } from '@/types';
import { fetchVolleyballData } from '@/utils/dataUpdater';

const VolleyballDetail = () => {
  const [data, setData] = useState<VolleyballData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedMatch, setExpandedMatch] = useState<number | null>(null);

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
      <div className="max-w-[1400px] mx-auto w-full flex flex-col flex-1">
        {/* 헤더 */}
        <header className="mb-6">
          <Link to="/" className="text-white hover:text-gray-300 inline-flex items-center mb-4">
            ← 돌아가기
          </Link>
          <h1 className="text-3xl font-bold text-white">{data.team}</h1>
        </header>

        {/* 2×2 그리드 레이아웃 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 flex-1">
          {/* 왼쪽 상단: 리그 순위 */}
          <div className="min-h-[300px] md:min-h-0">
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
                        {team.wins}승 {team.losses}패
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* 다음 예정 경기 */}
              {data.upcomingMatch && (
                <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <h3 className="text-sm font-semibold text-white mb-2">다음 예정 경기</h3>
                  <div className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    <div>{data.upcomingMatch.date}</div>
                    <div>vs {data.upcomingMatch.opponent}</div>
                    <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      {data.upcomingMatch.venue}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 오른쪽 상단: 지난 경기 결과 */}
          <div className="min-h-[300px] md:min-h-0">
            {isInSeason ? (
              <div className="h-full flex flex-col overflow-auto" style={{
                background: 'rgb(32, 34, 52)',
                backdropFilter: 'blur(10px)',
                borderRadius: '15px',
                padding: '20px',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <h2 className="text-xl font-bold mb-4 text-white">지난 경기 결과 (2주)</h2>
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
                          <div className="flex items-center">
                            <span
                              className={`px-3 py-1 rounded text-sm font-semibold ${
                                match.result === 'win' ? 'bg-green-600' : 'bg-red-600'
                              } text-white`}
                            >
                              {match.result === 'win' ? '승' : '패'} ({match.score})
                            </span>
                            <svg
                              className={`w-5 h-5 ml-2 transition-transform text-white ${
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
                              {match.sets.map((set, setIdx) => (
                                <div key={setIdx} className="flex justify-between text-sm text-white">
                                  <span>{setIdx + 1}세트</span>
                                  <span>
                                    {set.ourScore} - {set.opponentScore}
                                  </span>
                                </div>
                              ))}
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
              <div className="h-full flex flex-col overflow-auto" style={{
                background: 'rgb(32, 34, 52)',
                backdropFilter: 'blur(10px)',
                borderRadius: '15px',
                padding: '20px',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <h2 className="text-xl font-bold mb-4 text-white">공격수 순위</h2>
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

          {/* 하단 영역들 - 빈 영역 */}
          <div className="min-h-[300px] md:min-h-0">
            <div className="h-full flex flex-col overflow-auto" style={{
              background: 'rgb(32, 34, 52)',
              backdropFilter: 'blur(10px)',
              borderRadius: '15px',
              padding: '20px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              {/* 빈 영역 */}
            </div>
          </div>

          <div className="min-h-[300px] md:min-h-0">
            <div className="h-full flex flex-col overflow-auto" style={{
              background: 'rgb(32, 34, 52)',
              backdropFilter: 'blur(10px)',
              borderRadius: '15px',
              padding: '20px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              {/* 빈 영역 */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VolleyballDetail;
