import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { BaseballData, BaseballPitcher, BaseballBatter } from '@/types';
import { fetchBaseballData } from '@/utils/dataUpdater';
import RankChart from '@/components/Baseball/RankChart';

const BaseballDetail = () => {
  const [data, setData] = useState<BaseballData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pitcher' | 'batter'>('pitcher');
  const [playerRecordsHeight, setPlayerRecordsHeight] = useState<number | null>(null);
  const [expandedGames, setExpandedGames] = useState<{ [key: number]: boolean }>({});
  const leagueStandingsRef = useRef<HTMLDivElement>(null);

  const toggleGame = (index: number) => {
    setExpandedGames(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      setLoading(true);
      const result = await fetchBaseballData();
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

        {/* 순위 변동 그래프 - 상단 전체 너비 */}
        <div className="mb-6">
          <RankChart />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-10 gap-6 items-stretch">
          {/* 왼쪽: 리그 순위 (4:6 비율) */}
          <div className="md:col-span-4">
            <div ref={leagueStandingsRef} className="w-full bg-card backdrop-blur-card rounded-card p-5 border border-white/20">
              <div className="flex items-center mb-4">
                <div className="w-6 h-6 mr-2 flex-shrink-0 inline-flex items-center justify-center rounded border-2 bg-accent-green/20 border-accent-green/50 text-accent-green text-sm font-bold">
                  ✓
                </div>
                <h2 className="text-xl font-bold text-white">리그 순위</h2>
              </div>

              <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="px-2 py-2.5 text-center text-white/70 text-sm font-semibold">순위</th>
                      <th className="px-2 py-2.5 text-left text-white/70 text-sm font-semibold">팀</th>
                      <th className="px-2 py-2.5 text-center text-white/70 text-sm font-semibold">전적</th>
                      <th className="px-2 py-2.5 text-center text-white/70 text-sm font-semibold">승률</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.leagueStandings.map((team) => {
                      const isOurTeam = team.name.includes('한화');

                      return (
                        <tr
                          key={team.name}
                          className={`border-b border-white/5 ${isOurTeam ? 'bg-accent-green/20' : ''}`}
                        >
                          <td className="px-2 py-3 text-center text-white text-sm font-semibold">{team.rank}</td>
                          <td className="px-2 py-3 text-left text-white text-sm font-semibold">{team.name}</td>
                          <td className="px-2 py-3 text-center text-white text-sm">{team.wins}-{team.losses}-{team.draws}</td>
                          <td className="px-2 py-3 text-center text-white text-sm">{team.winRate?.toFixed(3) || '0.000'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
            </div>
          </div>

          {/* 오른쪽: 투수/타자 기록 (4:6 비율) */}
          <div className="md:col-span-6 flex">
            <div
              className="flex flex-col w-full bg-card backdrop-blur-card rounded-card p-5 border border-white/20"
              style={playerRecordsHeight ? { height: `${playerRecordsHeight}px` } : {}}
            >
              {/* 헤더 */}
              <div className="flex items-center mb-4">
                <div className="w-6 h-6 mr-2 flex-shrink-0 inline-flex items-center justify-center rounded border-2 bg-accent-green/20 border-accent-green/50 text-accent-green text-sm font-bold">
                  ✓
                </div>
                <h2 className="text-xl font-bold text-white">선수 기록</h2>
              </div>

              {/* 탭 */}
              <div className="flex mb-4 border-b border-white/10">
                <button
                  onClick={() => setActiveTab('pitcher')}
                  className={`px-4 py-2 font-semibold ${
                    activeTab === 'pitcher'
                      ? 'text-white border-b-2 border-accent-green/50'
                      : 'text-gray-500'
                  }`}
                >
                  투수 기록
                </button>
                <button
                  onClick={() => setActiveTab('batter')}
                  className={`px-4 py-2 font-semibold ${
                    activeTab === 'batter'
                      ? 'text-white border-b-2 border-accent-green/50'
                      : 'text-gray-500'
                  }`}
                >
                  타자 기록
                </button>
              </div>

              {/* 탭 내용 */}
              <div className="flex-1 overflow-y-auto overflow-x-auto min-h-0">
                {activeTab === 'pitcher' ? (
                  <div>
                    {data.pitchers.length > 0 ? (
                      <div>
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b border-white/10">
                              <th className="px-2 py-2.5 text-center text-white/70 text-xs font-semibold">순위</th>
                              <th className="px-2 py-2.5 text-left text-white/70 text-xs font-semibold">선수</th>
                              <th className="px-2 py-2.5 text-center text-white/70 text-xs font-semibold">평균자책</th>
                              <th className="px-2 py-2.5 text-center text-white/70 text-xs font-semibold">경기</th>
                              <th className="px-2 py-2.5 text-center text-white/70 text-xs font-semibold">승</th>
                              <th className="px-2 py-2.5 text-center text-white/70 text-xs font-semibold">패</th>
                              <th className="px-2 py-2.5 text-center text-white/70 text-xs font-semibold">탈삼진</th>
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
                                    className={`border-b border-white/5 ${isHanwha ? 'bg-accent-green/20' : ''}`}
                                  >
                                    <td className="px-2 py-3 text-center text-white text-sm font-semibold">{idx + 1}</td>
                                    <td className="px-2 py-3 text-left">
                                      <div className="flex flex-col gap-0.5">
                                        <span className={`text-sm font-semibold ${isHanwha ? 'text-accent-green' : 'text-white'}`}>{player.name}</span>
                                        {player.team && (
                                          <span className="text-white/50 text-[11px]">{player.team}</span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-2 py-3 text-center text-white text-sm">{player.era > 0 ? player.era.toFixed(2) : '-'}</td>
                                    <td className="px-2 py-3 text-center text-white text-sm">-</td>
                                    <td className="px-2 py-3 text-center text-white text-sm">{player.wins || 0}</td>
                                    <td className="px-2 py-3 text-center text-white text-sm">{player.losses || 0}</td>
                                    <td className="px-2 py-3 text-center text-white text-sm">{player.so || 0}</td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-white/50">
                        데이터 없음
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {data.batters.length > 0 ? (
                      <div>
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b border-white/10">
                              <th className="px-2 py-2.5 text-center text-white/70 text-xs font-semibold">순위</th>
                              <th className="px-2 py-2.5 text-left text-white/70 text-xs font-semibold">선수</th>
                              <th className="px-2 py-2.5 text-center text-white/70 text-xs font-semibold">타율</th>
                              <th className="px-2 py-2.5 text-center text-white/70 text-xs font-semibold">안타</th>
                              <th className="px-2 py-2.5 text-center text-white/70 text-xs font-semibold">홈런</th>
                              <th className="px-2 py-2.5 text-center text-white/70 text-xs font-semibold">타점</th>
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
                                    className={`border-b border-white/5 ${isHanwha ? 'bg-accent-green/20' : ''}`}
                                  >
                                    <td className="px-2 py-3 text-center text-white text-sm font-semibold">{idx + 1}</td>
                                    <td className="px-2 py-3 text-left">
                                      <div className="flex flex-col gap-0.5">
                                        <span className={`text-sm font-semibold ${isHanwha ? 'text-accent-green' : 'text-white'}`}>{player.name}</span>
                                        {player.team && (
                                          <span className="text-white/50 text-[11px]">{player.team}</span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-2 py-3 text-center text-white text-sm">{player.avg > 0 ? player.avg.toFixed(3) : '-'}</td>
                                    <td className="px-2 py-3 text-center text-white text-sm">{player.hits || 0}</td>
                                    <td className="px-2 py-3 text-center text-white text-sm">{player.hr || 0}</td>
                                    <td className="px-2 py-3 text-center text-white text-sm">{player.rbi || 0}</td>
                                  </tr>
                                );
                              })}
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

        {/* 시즌 중: 지난 시리즈 경기결과 */}
        {isInSeason && (
          <div className="mt-6 bg-card backdrop-blur-card rounded-card p-5 border border-white/20">
            <div className="flex items-center mb-4">
              <div className="w-6 h-6 mr-2 flex-shrink-0 inline-flex items-center justify-center rounded border-2 bg-accent-green/20 border-accent-green/50 text-accent-green text-sm font-bold">
                ✓
              </div>
              <h2 className="text-xl font-bold text-white">한화 지난 시리즈 경기결과</h2>
            </div>
            {data.currentSeries && data.currentSeries.games && data.currentSeries.games.length > 0 ? (
              <div className="space-y-3">
                {data.currentSeries.games.map((game, idx) => (
                  <div key={idx} className="rounded-lg border border-white/10">
                    <button
                      onClick={() => toggleGame(idx)}
                      className="w-full p-4 text-left flex justify-between items-center hover:bg-white/5"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-white font-semibold">vs {data.currentSeries?.opponent}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-sm ${
                            game.result === 'win' ? 'bg-accent-green/[0.15] text-accent-green/70' :
                            game.result === 'loss' ? 'bg-red-500/[0.15] text-red-500/70' :
                            'bg-gray-400/[0.15] text-gray-400/70'
                          }`}
                        >
                          {game.result === 'win' ? '승' : game.result === 'loss' ? '패' : '무'} ({game.score})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">{game.date}</span>
                        <span className="text-white">{expandedGames[idx] ? '▼' : '▶'}</span>
                      </div>
                    </button>
                    {expandedGames[idx] && (
                      <div className="px-4 pb-4 space-y-4">
                        <div className="pt-4 border-t border-white/10">
                          {/* 이닝별 점수 */}
                          {game.innings && game.innings.length > 0 && (
                            <div className="mb-4">
                              <h4 className="text-sm font-semibold text-white mb-2">이닝별 점수</h4>
                              <div className="overflow-x-auto">
                                <table className="w-full min-w-[500px] border-collapse">
                                  <thead>
                                    <tr className="border-b border-white/10">
                                      <th className="p-2 text-left text-white/70 text-xs">팀</th>
                                      {game.innings.map((inning) => (
                                        <th key={inning.inning} className="p-2 text-center text-white/70 text-xs">
                                          {inning.inning}
                                        </th>
                                      ))}
                                      <th className="p-2 text-center text-white/70 text-xs font-semibold">R</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr className="border-b border-white/5">
                                      <td className="p-2 text-white text-[13px] font-semibold">{data.team}</td>
                                      {game.innings.map((inning) => (
                                        <td key={inning.inning} className="p-2 text-center text-white text-[13px]">
                                          {inning.ourScore}
                                        </td>
                                      ))}
                                      <td className="p-2 text-center text-white text-[13px] font-semibold">
                                        {game.innings.reduce((sum, inning) => sum + inning.ourScore, 0)}
                                      </td>
                                    </tr>
                                    <tr>
                                      <td className="p-2 text-white text-[13px] font-semibold">{data.currentSeries?.opponent}</td>
                                      {game.innings.map((inning) => (
                                        <td key={inning.inning} className="p-2 text-center text-white text-[13px]">
                                          {inning.opponentScore}
                                        </td>
                                      ))}
                                      <td className="p-2 text-center text-white text-[13px] font-semibold">
                                        {game.innings.reduce((sum, inning) => sum + inning.opponentScore, 0)}
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {/* 팀 기록 */}
                          {(game.ourTeamStats || game.opponentStats) && (
                            <div>
                              <h4 className="text-sm font-semibold text-white mb-2">팀 기록</h4>
                              <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                  <thead>
                                    <tr className="border-b border-white/10">
                                      <th className="p-2 text-left text-white/70 text-xs">팀</th>
                                      <th className="p-2 text-center text-white/70 text-xs">안타</th>
                                      <th className="p-2 text-center text-white/70 text-xs">홈런</th>
                                      <th className="p-2 text-center text-white/70 text-xs">실책</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {game.ourTeamStats && (
                                      <tr className="border-b border-white/5">
                                        <td className="p-2 text-white text-[13px] font-semibold">{data.team}</td>
                                        <td className="p-2 text-center text-white text-[13px]">{game.ourTeamStats.hits}</td>
                                        <td className="p-2 text-center text-white text-[13px]">{game.ourTeamStats.homeRuns}</td>
                                        <td className="p-2 text-center text-white text-[13px]">{game.ourTeamStats.errors}</td>
                                      </tr>
                                    )}
                                    {game.opponentStats && (
                                      <tr>
                                        <td className="p-2 text-white text-[13px] font-semibold">{data.currentSeries?.opponent}</td>
                                        <td className="p-2 text-center text-white text-[13px]">{game.opponentStats.hits}</td>
                                        <td className="p-2 text-center text-white text-[13px]">{game.opponentStats.homeRuns}</td>
                                        <td className="p-2 text-center text-white text-[13px]">{game.opponentStats.errors}</td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
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
        )}

        {/* 상대전적 - 하단 */}
        <div className="mt-6 bg-card backdrop-blur-card rounded-card p-5 border border-white/20">
          <div className="flex items-center mb-4">
            <div className="w-6 h-6 mr-2 flex-shrink-0 inline-flex items-center justify-center rounded border-2 bg-accent-green/20 border-accent-green/50 text-accent-green text-sm font-bold">
              ✓
            </div>
            <h2 className="text-xl font-bold text-white">상대전적</h2>
          </div>
          {data.headToHead.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    {data.headToHead.map((h2h, idx) => (
                      <th key={idx} className="px-3 py-2.5 text-center text-white/70 text-sm font-semibold">
                        {h2h.opponent}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {data.headToHead.map((h2h, idx) => (
                      <td key={idx} className="p-3 text-center text-white text-sm border-b border-white/5">
                        {h2h.wins}-{h2h.losses}-{h2h.draws}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-white/50">
              데이터 없음
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BaseballDetail;
