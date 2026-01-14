import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { VolleyballData, VolleyballMatch } from '@/types';
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
    return <div className="p-4">로딩 중...</div>;
  }

  const isInSeason = data.seasonStatus === 'in-season';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link to="/" className="text-green-600 hover:text-green-800">← 돌아가기</Link>
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
                        ? 'bg-green-100 border-2 border-green-500'
                        : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">{team.rank}위 {team.name}</span>
                      <span className="text-sm text-gray-600">
                        {team.wins}승 {team.losses}패
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* 다음 예정 경기 */}
              {data.upcomingMatch && (
                <div className="mt-4 pt-4 border-t">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">다음 예정 경기</h3>
                  <div className="text-sm text-gray-600">
                    <div>{data.upcomingMatch.date}</div>
                    <div>vs {data.upcomingMatch.opponent}</div>
                    <div className="text-xs text-gray-500">{data.upcomingMatch.venue}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 오른쪽: 지난 경기 결과 (4:6 비율) */}
          <div className="md:col-span-6">
            {isInSeason ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4">지난 경기 결과 (2주)</h2>
                {data.recentMatches.length > 0 ? (
                  <div className="space-y-3">
                    {data.recentMatches.map((match, idx) => (
                      <div key={idx} className="border rounded-lg">
                        <button
                          onClick={() => toggleMatch(idx)}
                          className="w-full p-4 text-left flex justify-between items-center hover:bg-gray-50"
                        >
                          <div>
                            <div className="font-semibold">{match.date}</div>
                            <div className="text-sm text-gray-600">vs {match.opponent}</div>
                          </div>
                          <div className="flex items-center">
                            <span
                              className={`px-3 py-1 rounded text-sm font-semibold ${
                                match.result === 'win'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {match.result === 'win' ? '승' : '패'}
                            </span>
                            <svg
                              className={`w-5 h-5 ml-2 transition-transform ${
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
                          <div className="p-4 bg-gray-50 border-t">
                            <div className="text-sm font-semibold mb-2">세트 스코어</div>
                            <div className="space-y-1">
                              {match.sets.map((set, setIdx) => (
                                <div key={setIdx} className="flex justify-between text-sm">
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
                  <div className="text-center text-gray-500 py-8">데이터 없음</div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4">공격수 순위</h2>
                {data.attackers && data.attackers.length > 0 ? (
                  <div className="space-y-3">
                    {data.attackers.map((player, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-semibold">
                              {player.rank}위 {player.name}
                            </div>
                            <div className="text-sm text-gray-600">{player.position}</div>
                          </div>
                          <div className="text-sm text-gray-600">
                            {/* 스탯 표시 */}
                          </div>
                        </div>
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
  );
};

export default VolleyballDetail;