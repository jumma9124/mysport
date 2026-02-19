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
              <div className="w-7 h-7 mr-3 flex-shrink-0 inline-flex items-center justify-center rounded border-2 bg-accent-green/20 border-accent-green/50 text-accent-green text-base font-bold">
                ✓
              </div>
              <h1 className="text-3xl font-bold text-white">{data.team}</h1>
            </div>
            <Link
              to="/"
              className="text-white hover:opacity-80 inline-flex items-center px-4 py-2 rounded-lg transition-opacity bg-card border border-white/20"
            >
              ← 돌아가기
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-10 gap-6">
          {/* 왼쪽: 리그 순위 + 다음 경기 (4:6 비율) */}
          <div className="md:col-span-4 flex flex-col gap-6">
            {/* 리그 순위 */}
            <div className="flex flex-col bg-card backdrop-blur-card rounded-card p-5 border border-white/20">
              <div className="flex items-center mb-4">
                <div className="w-6 h-6 mr-2 flex-shrink-0 inline-flex items-center justify-center rounded border-2 bg-accent-green/20 border-accent-green/50 text-accent-green text-sm font-bold">
                  ✓
                </div>
                <h2 className="text-xl font-bold text-white">리그 순위</h2>
              </div>

              {/* 탭 */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setActiveTab('men')}
                  className={`flex-1 p-2.5 border-none rounded-lg cursor-pointer font-semibold transition-all ${
                    activeTab === 'men' ? 'bg-tab-active/30 text-white' : 'bg-white/10 text-white/60'
                  }`}
                >
                  남자부
                </button>
                <button
                  onClick={() => setActiveTab('women')}
                  className={`flex-1 p-2.5 border-none rounded-lg cursor-pointer font-semibold transition-all ${
                    activeTab === 'women' ? 'bg-tab-active/30 text-white' : 'bg-white/10 text-white/60'
                  }`}
                >
                  여자부
                </button>
              </div>

              {/* 테이블 */}
              {activeTab === 'men' ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="px-2 py-2.5 text-center text-white/70 text-sm font-semibold">순위</th>
                        <th className="px-2 py-2.5 text-left text-white/70 text-sm font-semibold">팀</th>
                        <th className="px-2 py-2.5 text-center text-white/70 text-sm font-semibold">승점</th>
                        <th className="px-2 py-2.5 text-center text-white/70 text-sm font-semibold">전적</th>
                        <th className="px-2 py-2.5 text-center text-white/70 text-sm font-semibold">세트득실률</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.leagueStandings.map((team) => {
                        const isOurTeam = team.name.includes('현대캐피탈');

                        return (
                          <tr
                            key={team.name}
                            className={`border-b border-white/5 ${isOurTeam ? 'bg-accent-green/20' : ''}`}
                          >
                            <td className="px-2 py-3 text-center text-white text-sm font-semibold">{team.rank}</td>
                            <td className="px-2 py-3 text-left text-white text-sm font-semibold">{team.name}</td>
                            <td className="px-2 py-3 text-center text-white text-sm">{team.points}</td>
                            <td className="px-2 py-3 text-center text-white text-sm">{team.wins}-{team.losses}</td>
                            <td className="px-2 py-3 text-center text-white text-sm">{team.setRate?.toFixed(3) || '0.000'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  {data.leagueStandingsWomen && data.leagueStandingsWomen.length > 0 ? (
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="px-2 py-2.5 text-center text-white/70 text-sm font-semibold">순위</th>
                          <th className="px-2 py-2.5 text-left text-white/70 text-sm font-semibold">팀</th>
                          <th className="px-2 py-2.5 text-center text-white/70 text-sm font-semibold">승점</th>
                          <th className="px-2 py-2.5 text-center text-white/70 text-sm font-semibold">전적</th>
                          <th className="px-2 py-2.5 text-center text-white/70 text-sm font-semibold">세트득실률</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.leagueStandingsWomen.map((team) => (
                          <tr
                            key={team.name}
                            className="border-b border-white/5"
                          >
                            <td className="px-2 py-3 text-center text-white text-sm font-semibold">{team.rank}</td>
                            <td className="px-2 py-3 text-left text-white text-sm font-semibold">{team.name}</td>
                            <td className="px-2 py-3 text-center text-white text-sm">{team.points}</td>
                            <td className="px-2 py-3 text-center text-white text-sm">{team.wins}-{team.losses}</td>
                            <td className="px-2 py-3 text-center text-white text-sm">{team.setRate?.toFixed(3) || '0.000'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center py-10 text-white/50">
                      데이터 없음
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 다음 경기 */}
            {data.upcomingMatch && (
              <div className="bg-card backdrop-blur-card rounded-card p-5 border border-white/20">
                <div className="flex items-center mb-4">
                  <div className="w-6 h-6 mr-2 flex-shrink-0 inline-flex items-center justify-center rounded border-2 bg-accent-green/20 border-accent-green/50 text-accent-green text-sm font-bold">
                    ✓
                  </div>
                  <h2 className="text-xl font-bold text-white">다음 경기</h2>
                </div>
                <div className="p-4 rounded bg-white/5">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm mb-1 text-white/50">{data.upcomingMatch.date}</div>
                      <div className="text-lg font-semibold text-white">vs {data.upcomingMatch.opponent}</div>
                    </div>
                    <div className="text-sm text-white/70">
                      {data.upcomingMatch.venue}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 오른쪽: 시즌 중에는 지난 경기 결과, 시즌 종료 후에는 공격수 순위 (4:6 비율) */}
          <div className="md:col-span-6">
            {isInSeason ? (
              <div className="flex flex-col bg-card backdrop-blur-card rounded-card p-5 border border-white/20">
                <div className="flex items-center mb-4">
                  <div className="w-6 h-6 mr-2 flex-shrink-0 inline-flex items-center justify-center rounded border-2 bg-accent-green/20 border-accent-green/50 text-accent-green text-sm font-bold">
                    ✓
                  </div>
                  <h2 className="text-xl font-bold text-white">현대캐피탈 지난 경기 결과</h2>
                </div>
                {data.recentMatches.length > 0 ? (
                  <div className="space-y-3">
                    {data.recentMatches.map((match, idx) => (
                      <div key={idx} className="rounded-lg border border-white/10">
                        <button
                          onClick={() => toggleMatch(idx)}
                          className="w-full p-4 text-left flex justify-between items-center hover:bg-white/5"
                        >
                          <div className="flex-1">
                            <div className="text-sm mb-2 text-white/50">
                              {match.date.includes('-')
                                ? match.date.replace(/(\d{4})-(\d{2})-(\d{2})/, '$1.$2.$3')
                                : match.date}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="text-lg font-semibold text-white">
                                vs {match.opponent}
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded text-sm whitespace-nowrap ${
                                  match.result === 'win'
                                    ? 'bg-accent-green/[0.15] text-accent-green/70'
                                    : 'bg-red-500/[0.15] text-red-500/70'
                                }`}
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
                          <div className="p-4 border-t border-white/10 bg-white/5">
                            <div className="text-sm text-white">세트 스코어 ({match.score})</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-white/50">
                    데이터 없음
                  </div>
                )}
              </div>
            ) : (
              /* 시즌 종료 후: 공격수 순위 표시 */
              <div className="flex flex-col bg-card backdrop-blur-card rounded-card p-5 border border-white/20">
                <div className="flex items-center mb-4">
                  <div className="w-6 h-6 mr-2 flex-shrink-0 inline-flex items-center justify-center rounded border-2 bg-accent-green/20 border-accent-green/50 text-accent-green text-sm font-bold">
                    ✓
                  </div>
                  <h2 className="text-xl font-bold text-white">공격수 순위</h2>
                </div>
                {data.attackers && data.attackers.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="px-2 py-2.5 text-center text-white/70 text-sm font-semibold">순위</th>
                          <th className="px-2 py-2.5 text-left text-white/70 text-sm font-semibold">선수</th>
                          <th className="px-2 py-2.5 text-center text-white/70 text-sm font-semibold">포지션</th>
                          <th className="px-2 py-2.5 text-center text-white/70 text-sm font-semibold">득점</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.attackers.map((player, idx) => (
                          <tr
                            key={player.name}
                            className="border-b border-white/5"
                          >
                            <td className="px-2 py-3 text-center text-white text-sm font-semibold">{player.rank || idx + 1}</td>
                            <td className="px-2 py-3 text-left text-white text-sm font-semibold">{player.name}</td>
                            <td className="px-2 py-3 text-center text-white text-sm">{player.position}</td>
                            <td className="px-2 py-3 text-center text-white text-sm">{player.stats?.points || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-white/50">
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
