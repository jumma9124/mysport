import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { InternationalSportsData } from '@/types';
import { fetchInternationalSportsData } from '@/utils/dataUpdater';

interface Event {
  name: string;
  date: string;
  icon: string;
  daysLeft?: number;
  medals?: {
    gold: number;
    silver: number;
    bronze: number;
  };
  rank?: number;
}

// 모든 동계올림픽 종목 목록 (크롤러와 동일)
const ALL_DISCIPLINES = [
  { id: 'STK', name: '쇼트트랙' },
  { id: 'SSK', name: '스피드스케이팅' },
  { id: 'FSK', name: '피겨스케이팅' },
  { id: 'CUR', name: '컬링' },
  { id: 'ICH', name: '아이스하키' },
  { id: 'BOB', name: '봅슬레이' },
  { id: 'LUG', name: '루지' },
  { id: 'SKE', name: '스켈레톤' },
  { id: 'ALP', name: '알파인스키' },
  { id: 'CCS', name: '크로스컨트리스키' },
  { id: 'SKJ', name: '스키점프' },
  { id: 'NCB', name: '노르딕복합' },
  { id: 'FRS', name: '프리스타일스키' },
  { id: 'SNB', name: '스노보드' },
  { id: 'BIA', name: '바이애슬론' },
];

// 동계올림픽 종료일
const WINTER_OLYMPICS_END_DATE = new Date('2026-02-22T23:59:59');

const InternationalSportsDetail = () => {
  const [data, setData] = useState<InternationalSportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [expandedEvents, setExpandedEvents] = useState<{ [key: number]: boolean }>({});
  const [winterOlympicsTab, setWinterOlympicsTab] = useState<'medals' | 'schedule' | 'discipline'>('medals');
  const [expandedMedal, setExpandedMedal] = useState<'gold' | 'silver' | 'bronze' | 'total' | null>(null);
  const [selectedDiscipline, setSelectedDiscipline] = useState<string | null>('STK');
  const [winterOlympicsExpanded, setWinterOlympicsExpanded] = useState(true);
  const medalContainerRef = useRef<HTMLDivElement>(null);

  // 동계올림픽 종료 여부 확인
  const isWinterOlympicsEnded = new Date() > WINTER_OLYMPICS_END_DATE;

  const toggleEvent = (index: number) => {
    setExpandedEvents(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      const result = await fetchInternationalSportsData();
      if (isMounted) {
        setData(result);

        // major-events.json에서 이벤트 데이터 로드
        if (result.data?.events) {
          const eventsWithDays = result.data.events.map((event: Event) => {
            const eventDate = new Date(event.date);
            const now = new Date();
            const diffTime = eventDate.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            return {
              ...event,
              daysLeft: diffDays > 0 ? diffDays : 0,
            };
          });
          setEvents(eventsWithDays);
        }

        // 동계올림픽 종료 시 토글 닫기
        if (new Date() > WINTER_OLYMPICS_END_DATE) {
          setWinterOlympicsExpanded(false);
        }

        setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  // 외부 클릭 시 말풍선 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (medalContainerRef.current && !medalContainerRef.current.contains(event.target as Node)) {
        setExpandedMedal(null);
      }
    };

    if (expandedMedal) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [expandedMedal]);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">로딩 중...</div>
      </div>
    );
  }

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
              <h1 className="text-3xl font-bold text-white">주요 스포츠 이벤트</h1>
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

        {/* 동계올림픽 섹션 - 종료 전에만 상단에 표시 */}
        {data.winterOlympics && !isWinterOlympicsEnded && (
          <div className="mb-4" style={{
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
              <h2 className="text-xl font-bold text-white">밀라노-코르티나 2026 동계올림픽</h2>
            </div>

            {/* 탭 버튼 */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setWinterOlympicsTab('medals')}
                style={{
                  flex: 1,
                  padding: '10px',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  background: winterOlympicsTab === 'medals' ? 'rgba(102, 126, 234, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                  color: winterOlympicsTab === 'medals' ? 'white' : 'rgba(255,255,255,0.6)',
                  transition: 'all 0.2s'
                }}
              >
                메달 순위
              </button>
              <button
                onClick={() => setWinterOlympicsTab('schedule')}
                style={{
                  flex: 1,
                  padding: '10px',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  background: winterOlympicsTab === 'schedule' ? 'rgba(102, 126, 234, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                  color: winterOlympicsTab === 'schedule' ? 'white' : 'rgba(255,255,255,0.6)',
                  transition: 'all 0.2s'
                }}
              >
                경기 일정
              </button>
              <button
                onClick={() => {
                  setWinterOlympicsTab('discipline');
                  if (!selectedDiscipline && data.winterOlympics?.disciplineSchedules) {
                    const ids = Object.keys(data.winterOlympics.disciplineSchedules);
                    if (ids.length > 0) setSelectedDiscipline(ids[0]);
                  }
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  background: winterOlympicsTab === 'discipline' ? 'rgba(102, 126, 234, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                  color: winterOlympicsTab === 'discipline' ? 'white' : 'rgba(255,255,255,0.6)',
                  transition: 'all 0.2s'
                }}
              >
                종목별 일정
              </button>
            </div>

            {/* 탭 콘텐츠 */}
            <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
              {winterOlympicsTab === 'medals' && (
                <div className="space-y-6">
                  {/* 대한민국 메달 현황 */}
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-3">대한민국 메달 현황</h4>
                    <div ref={medalContainerRef} className="grid grid-cols-4 gap-4">
                      {/* 금메달 */}
                      <div className="relative">
                        <div
                          className="bg-yellow-500/10 rounded-lg p-3 text-center border border-yellow-500/20 cursor-pointer hover:bg-yellow-500/5 transition-colors"
                          onClick={() => setExpandedMedal(expandedMedal === 'gold' ? null : 'gold')}
                        >
                          <div className="text-2xl mb-1">🥇</div>
                          <div className="text-sm text-gray-400">금메달</div>
                          <div className="text-xl font-bold text-white mt-1">{data.winterOlympics.medals.gold}</div>
                        </div>
                        {expandedMedal === 'gold' && (
                          <div
                            className="absolute left-2/3 top-1/2 -translate-y-1/2 bg-gray-800 rounded-lg p-3 shadow-xl border border-yellow-500/30 z-50"
                            style={{ minWidth: '200px', maxWidth: '300px' }}
                          >
                            <div className="space-y-2 max-h-[500px] overflow-y-auto">
                              {data.winterOlympics.koreaMedalists && data.winterOlympics.koreaMedalists.filter(m => m.medalType === 'gold').length > 0 ? (
                                data.winterOlympics.koreaMedalists.filter(m => m.medalType === 'gold').map((medalist, idx) => (
                                  <div key={idx} className="bg-white/5 rounded p-2 text-xs">
                                    <div className="text-white font-semibold">{medalist.name}</div>
                                    {medalist.discipline && <div className="text-gray-400">{medalist.discipline}</div>}
                                    {medalist.date && <div className="text-gray-500">{medalist.date}</div>}
                                  </div>
                                ))
                              ) : (
                                <div className="text-center py-2 text-gray-400 text-xs">없음</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 은메달 */}
                      <div className="relative">
                        <div
                          className="bg-gray-400/10 rounded-lg p-3 text-center border border-gray-400/20 cursor-pointer hover:bg-gray-400/5 transition-colors"
                          onClick={() => setExpandedMedal(expandedMedal === 'silver' ? null : 'silver')}
                        >
                          <div className="text-2xl mb-1">🥈</div>
                          <div className="text-sm text-gray-400">은메달</div>
                          <div className="text-xl font-bold text-white mt-1">{data.winterOlympics.medals.silver}</div>
                        </div>
                        {expandedMedal === 'silver' && (
                          <div
                            className="absolute left-2/3 top-1/2 -translate-y-1/2 bg-gray-800 rounded-lg p-3 shadow-xl border border-gray-400/30 z-50"
                            style={{ minWidth: '200px', maxWidth: '300px' }}
                          >
                            <div className="space-y-2 max-h-[500px] overflow-y-auto">
                              {data.winterOlympics.koreaMedalists && data.winterOlympics.koreaMedalists.filter(m => m.medalType === 'silver').length > 0 ? (
                                data.winterOlympics.koreaMedalists.filter(m => m.medalType === 'silver').map((medalist, idx) => (
                                  <div key={idx} className="bg-white/5 rounded p-2 text-xs">
                                    <div className="text-white font-semibold">{medalist.name}</div>
                                    {medalist.discipline && <div className="text-gray-400">{medalist.discipline}</div>}
                                    {medalist.date && <div className="text-gray-500">{medalist.date}</div>}
                                  </div>
                                ))
                              ) : (
                                <div className="text-center py-2 text-gray-400 text-xs">없음</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 동메달 */}
                      <div className="relative">
                        <div
                          className="bg-orange-600/10 rounded-lg p-3 text-center border border-orange-600/20 cursor-pointer hover:bg-orange-600/5 transition-colors"
                          onClick={() => setExpandedMedal(expandedMedal === 'bronze' ? null : 'bronze')}
                        >
                          <div className="text-2xl mb-1">🥉</div>
                          <div className="text-sm text-gray-400">동메달</div>
                          <div className="text-xl font-bold text-white mt-1">{data.winterOlympics.medals.bronze}</div>
                        </div>
                        {expandedMedal === 'bronze' && (
                          <div
                            className="absolute left-2/3 top-1/2 -translate-y-1/2 bg-gray-800 rounded-lg p-3 shadow-xl border border-orange-600/30 z-50"
                            style={{ minWidth: '200px', maxWidth: '300px' }}
                          >
                            <div className="space-y-2 max-h-[500px] overflow-y-auto">
                              {data.winterOlympics.koreaMedalists && data.winterOlympics.koreaMedalists.filter(m => m.medalType === 'bronze').length > 0 ? (
                                data.winterOlympics.koreaMedalists.filter(m => m.medalType === 'bronze').map((medalist, idx) => (
                                  <div key={idx} className="bg-white/5 rounded p-2 text-xs">
                                    <div className="text-white font-semibold">{medalist.name}</div>
                                    {medalist.discipline && <div className="text-gray-400">{medalist.discipline}</div>}
                                    {medalist.date && <div className="text-gray-500">{medalist.date}</div>}
                                  </div>
                                ))
                              ) : (
                                <div className="text-center py-2 text-gray-400 text-xs">없음</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 합계 */}
                      <div className="bg-blue-500/10 rounded-lg p-3 text-center border border-blue-500/20">
                        <div className="text-2xl mb-1">🏆</div>
                        <div className="text-sm text-gray-400">합계</div>
                        <div className="text-xl font-bold text-white mt-1">{data.winterOlympics.medals.total}</div>
                      </div>
                    </div>
                  </div>

                  {/* 전체 국가 메달 순위 */}
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-3">전체 국가 메달 순위</h4>
                    {data.winterOlympics.allCountriesMedals && data.winterOlympics.allCountriesMedals.length > 0 ? (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                              <th style={{ padding: '10px 8px', textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '14px', fontWeight: 600 }}>순위</th>
                              <th style={{ padding: '10px 8px', textAlign: 'left', color: 'rgba(255,255,255,0.7)', fontSize: '14px', fontWeight: 600 }}>국가</th>
                              <th style={{ padding: '10px 8px', textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '14px', fontWeight: 600 }}>🥇</th>
                              <th style={{ padding: '10px 8px', textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '14px', fontWeight: 600 }}>🥈</th>
                              <th style={{ padding: '10px 8px', textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '14px', fontWeight: 600 }}>🥉</th>
                              <th style={{ padding: '10px 8px', textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '14px', fontWeight: 600 }}>합계</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.winterOlympics.allCountriesMedals.map((country) => {
                              const isKorea = country.nation.includes('대한민국') || country.nation.includes('Korea');

                              return (
                                <tr
                                  key={country.nation}
                                  style={{
                                    background: isKorea ? 'rgba(76, 175, 80, 0.2)' : 'transparent',
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                                  }}
                                >
                                  <td style={{ padding: '12px 8px', textAlign: 'center', color: 'white', fontSize: '14px', fontWeight: 600 }}>{country.rank}</td>
                                  <td style={{ padding: '12px 8px', textAlign: 'left', color: 'white', fontSize: '14px', fontWeight: 600 }}>{country.nation}</td>
                                  <td style={{ padding: '12px 8px', textAlign: 'center', color: 'white', fontSize: '14px' }}>{country.gold}</td>
                                  <td style={{ padding: '12px 8px', textAlign: 'center', color: 'white', fontSize: '14px' }}>{country.silver}</td>
                                  <td style={{ padding: '12px 8px', textAlign: 'center', color: 'white', fontSize: '14px' }}>{country.bronze}</td>
                                  <td style={{ padding: '12px 8px', textAlign: 'center', color: 'white', fontSize: '14px', fontWeight: 600 }}>{country.total}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-400 text-sm">
                        아직 메달 순위가 없습니다
                      </div>
                    )}
                  </div>
                </div>
              )}

              {winterOlympicsTab === 'schedule' && (
                <div className="space-y-4">
                  {/* 오늘의 경기 */}
                  {data.winterOlympics.todaySchedule.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-3">오늘의 경기</h4>
                      <div className="space-y-2">
                        {data.winterOlympics.todaySchedule.map((game, idx) => (
                          <div
                            key={idx}
                            className="bg-white/5 rounded-lg p-3 border border-white/10"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-white font-semibold">{game.discipline} ({game.time})</span>
                              <span
                                className="px-2 py-0.5 rounded text-xs"
                                style={{
                                  backgroundColor: game.status === 'LIVE' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                                  color: game.status === 'LIVE' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(59, 130, 246, 0.7)'
                                }}
                              >
                                {game.status}
                              </span>
                            </div>
                            {game.players && game.players.length > 0 && (
                              <div className="text-sm text-gray-300 mt-1">{game.players.join(', ')}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 다가오는 경기 (지난 날짜 제외) */}
                  {data.winterOlympics.upcomingSchedule.filter(game => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return new Date(game.date) >= today;
                  }).length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-3">다가오는 경기</h4>
                      <div className="space-y-2">
                        {data.winterOlympics.upcomingSchedule.filter(game => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return new Date(game.date) >= today;
                        }).map((game, idx) => (
                          <div
                            key={idx}
                            className="bg-white/5 rounded-lg p-3 border border-white/10"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-white font-semibold">
                                {game.discipline} ({new Date(game.date).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })} {game.time})
                              </span>
                              <span className="text-xs text-gray-400">{game.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {data.winterOlympics.todaySchedule.length === 0 && data.winterOlympics.upcomingSchedule.length === 0 && (
                    <div className="text-center py-4 text-gray-400">
                      예정된 경기가 없습니다
                    </div>
                  )}
                </div>
              )}

              {winterOlympicsTab === 'discipline' && (
                <div>
                  {/* 종목 선택 칩 - 모든 종목 표시 */}
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    overflowX: 'auto',
                    paddingBottom: '12px',
                    marginBottom: '12px',
                  }} className="hide-scrollbar">
                    {ALL_DISCIPLINES.map((discipline) => {
                      const hasData = data.winterOlympics?.disciplineSchedules?.[discipline.id];
                      return (
                        <button
                          key={discipline.id}
                          onClick={() => setSelectedDiscipline(discipline.id)}
                          style={{
                            padding: '6px 14px',
                            border: 'none',
                            borderRadius: '20px',
                            cursor: 'pointer',
                            fontWeight: 500,
                            fontSize: '13px',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                            background: selectedDiscipline === discipline.id ? 'rgba(102, 126, 234, 0.4)' : 'rgba(255, 255, 255, 0.08)',
                            color: selectedDiscipline === discipline.id ? 'white' : hasData ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.3)',
                            transition: 'all 0.2s',
                          }}
                        >
                          {discipline.name}
                        </button>
                      );
                    })}
                  </div>

                  {/* 선택된 종목의 경기 리스트 */}
                  {selectedDiscipline && data.winterOlympics?.disciplineSchedules?.[selectedDiscipline] ? (
                    <div className="space-y-2">
                      {data.winterOlympics.disciplineSchedules[selectedDiscipline].games.map((game, idx) => (
                        <div
                          key={idx}
                          className="bg-white/5 rounded-lg p-3 border border-white/10"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-white font-semibold text-sm">{game.disciplineDetail || '-'}</span>
                            <span
                              className="px-2 py-0.5 rounded text-xs flex-shrink-0 ml-2"
                              style={{
                                backgroundColor: game.status === 'LIVE' ? 'rgba(239, 68, 68, 0.15)' :
                                                game.status === '종료' ? 'rgba(107, 114, 128, 0.15)' :
                                                'rgba(59, 130, 246, 0.15)',
                                color: game.status === 'LIVE' ? 'rgba(239, 68, 68, 0.9)' :
                                       game.status === '종료' ? 'rgba(107, 114, 128, 0.7)' :
                                       'rgba(59, 130, 246, 0.7)'
                              }}
                            >
                              {game.status}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mb-2">
                            {game.date && (
                              <span className="mr-2">
                                {new Date(game.date).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
                              </span>
                            )}
                            {game.time}
                          </div>
                          {/* 팀 대결 (선수 2명 + 스코어) */}
                          {game.players && game.players.length === 2 && game.scores && game.scores.length === 2 ? (
                            <div className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2 mt-1">
                              <span className={`text-sm font-medium ${game.result?.includes(game.players[0]) ? 'text-white' : 'text-gray-400'}`}>
                                {game.players[0]}
                              </span>
                              <span className="text-sm font-bold text-white mx-3">
                                {game.scores[0]} - {game.scores[1]}
                              </span>
                              <span className={`text-sm font-medium ${game.result?.includes(game.players[1]) ? 'text-white' : 'text-gray-400'}`}>
                                {game.players[1]}
                              </span>
                            </div>
                          ) : game.players && game.players.length === 2 ? (
                            <div className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2 mt-1">
                              <span className="text-sm text-gray-300">{game.players[0]}</span>
                              <span className="text-xs text-gray-500">vs</span>
                              <span className="text-sm text-gray-300">{game.players[1]}</span>
                            </div>
                          ) : game.players && game.players.length > 0 ? (
                            <div className="text-sm text-gray-300 mt-1">
                              {game.players.join(', ')}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : selectedDiscipline ? (
                    <div className="text-center py-8 text-gray-400">
                      <div className="text-lg mb-2">{ALL_DISCIPLINES.find(d => d.id === selectedDiscipline)?.name}</div>
                      <div className="text-sm">한국 선수 경기 일정이 없습니다</div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-400 text-sm">
                      종목을 선택해주세요
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 이벤트 리스트 (동계올림픽은 위에 전용 섹션이 있으므로 제외) */}
        {events.filter(e => !e.name.includes('동계올림픽')).length > 0 ? (
          <div className="space-y-4">
            {events.filter(e => !e.name.includes('동계올림픽')).map((event, idx) => (
              <div key={idx} style={{
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
                  <h2 className="text-xl font-bold text-white">{event.name}</h2>
                </div>

                <div className="rounded-lg" style={{ border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <button
                    onClick={() => toggleEvent(idx)}
                    className="w-full p-4 text-left flex justify-between items-center hover:bg-white/5"
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className="px-2 py-0.5 rounded text-sm"
                        style={{
                          backgroundColor: event.daysLeft === 0 ? 'rgba(76, 175, 80, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                          color: event.daysLeft === 0 ? 'rgba(76, 175, 80, 0.7)' : 'rgba(59, 130, 246, 0.7)'
                        }}
                      >
                        {event.daysLeft === 0 ? '진행 중' : `개막 D-${event.daysLeft}`}
                      </span>
                      <span className="text-sm text-gray-400">{event.date}</span>
                    </div>
                    <span className="text-white">{expandedEvents[idx] ? '▼' : '▶'}</span>
                  </button>

                  {expandedEvents[idx] && (
                    <div className="px-4 pb-4 space-y-4">
                      <div className="pt-4 border-t border-white/10">
                        {event.daysLeft === 0 ? (
                          <>
                            {/* 대회 진행 중 - 메달 및 순위 정보 */}
                            {event.medals && (
                              <div className="mb-4">
                                <h4 className="text-sm font-semibold text-white mb-3">대한민국 메달 현황</h4>
                                <div className="grid grid-cols-3 gap-4">
                                  <div className="bg-yellow-500/10 rounded-lg p-3 text-center border border-yellow-500/20">
                                    <div className="text-2xl mb-1">🥇</div>
                                    <div className="text-sm text-gray-400">금메달</div>
                                    <div className="text-xl font-bold text-white mt-1">{event.medals.gold}</div>
                                  </div>
                                  <div className="bg-gray-400/10 rounded-lg p-3 text-center border border-gray-400/20">
                                    <div className="text-2xl mb-1">🥈</div>
                                    <div className="text-sm text-gray-400">은메달</div>
                                    <div className="text-xl font-bold text-white mt-1">{event.medals.silver}</div>
                                  </div>
                                  <div className="bg-orange-600/10 rounded-lg p-3 text-center border border-orange-600/20">
                                    <div className="text-2xl mb-1">🥉</div>
                                    <div className="text-sm text-gray-400">동메달</div>
                                    <div className="text-xl font-bold text-white mt-1">{event.medals.bronze}</div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {event.rank && (
                              <div className="bg-gray-800/50 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-400">종합 순위</span>
                                  <span className="text-2xl font-bold text-white">{event.rank}위</span>
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-center py-4">
                            <div className="text-sm text-gray-400">대회 시작 전입니다</div>
                            <div className="text-lg font-semibold text-white mt-2">개막까지 {event.daysLeft}일 남음</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8" style={{ color: 'rgba(255,255,255,0.5)' }}>
            예정된 이벤트가 없습니다
          </div>
        )}

        {/* 동계올림픽 섹션 - 종료 후에는 하단에 토글로 표시 */}
        {data.winterOlympics && isWinterOlympicsEnded && (
          <div className="mt-4" style={{
            background: 'rgb(32, 34, 52)',
            backdropFilter: 'blur(10px)',
            borderRadius: '15px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            overflow: 'hidden'
          }}>
            {/* 토글 헤더 */}
            <button
              onClick={() => setWinterOlympicsExpanded(!winterOlympicsExpanded)}
              className="w-full p-5 text-left flex justify-between items-center hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center">
                <div className="w-6 h-6 mr-2 flex-shrink-0 inline-flex items-center justify-center rounded border-2" style={{
                  background: 'rgba(107, 114, 128, 0.2)',
                  borderColor: 'rgba(107, 114, 128, 0.5)',
                  color: '#6b7280',
                  fontSize: '14px',
                  fontWeight: 700
                }}>
                  ✓
                </div>
                <h2 className="text-xl font-bold text-white">밀라노-코르티나 2026 동계올림픽</h2>
                <span className="ml-3 px-2 py-0.5 rounded text-xs" style={{
                  backgroundColor: 'rgba(107, 114, 128, 0.15)',
                  color: 'rgba(107, 114, 128, 0.9)'
                }}>종료</span>
              </div>
              <span className="text-white text-lg">{winterOlympicsExpanded ? '▼' : '▶'}</span>
            </button>

            {/* 토글 콘텐츠 */}
            {winterOlympicsExpanded && (
              <div className="px-5 pb-5">
                {/* 탭 버튼 */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setWinterOlympicsTab('medals')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      background: winterOlympicsTab === 'medals' ? 'rgba(102, 126, 234, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                      color: winterOlympicsTab === 'medals' ? 'white' : 'rgba(255,255,255,0.6)',
                      transition: 'all 0.2s'
                    }}
                  >
                    메달 순위
                  </button>
                  <button
                    onClick={() => setWinterOlympicsTab('schedule')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      background: winterOlympicsTab === 'schedule' ? 'rgba(102, 126, 234, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                      color: winterOlympicsTab === 'schedule' ? 'white' : 'rgba(255,255,255,0.6)',
                      transition: 'all 0.2s'
                    }}
                  >
                    경기 일정
                  </button>
                  <button
                    onClick={() => {
                      setWinterOlympicsTab('discipline');
                      if (!selectedDiscipline && data.winterOlympics?.disciplineSchedules) {
                        const ids = Object.keys(data.winterOlympics.disciplineSchedules);
                        if (ids.length > 0) setSelectedDiscipline(ids[0]);
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: '10px',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      background: winterOlympicsTab === 'discipline' ? 'rgba(102, 126, 234, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                      color: winterOlympicsTab === 'discipline' ? 'white' : 'rgba(255,255,255,0.6)',
                      transition: 'all 0.2s'
                    }}
                  >
                    종목별 일정
                  </button>
                </div>

                {/* 탭 콘텐츠 */}
                <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
                  {winterOlympicsTab === 'medals' && (
                    <div className="space-y-6">
                      {/* 대한민국 메달 현황 */}
                      <div>
                        <h4 className="text-sm font-semibold text-white mb-3">대한민국 메달 현황</h4>
                        <div ref={medalContainerRef} className="grid grid-cols-4 gap-4">
                          {/* 금메달 */}
                          <div className="relative">
                            <div
                              className="bg-yellow-500/10 rounded-lg p-3 text-center border border-yellow-500/20 cursor-pointer hover:bg-yellow-500/5 transition-colors"
                              onClick={() => setExpandedMedal(expandedMedal === 'gold' ? null : 'gold')}
                            >
                              <div className="text-2xl mb-1">🥇</div>
                              <div className="text-sm text-gray-400">금메달</div>
                              <div className="text-xl font-bold text-white mt-1">{data.winterOlympics.medals.gold}</div>
                            </div>
                            {expandedMedal === 'gold' && (
                              <div
                                className="absolute left-2/3 top-1/2 -translate-y-1/2 bg-gray-800 rounded-lg p-3 shadow-xl border border-yellow-500/30 z-50"
                                style={{ minWidth: '200px', maxWidth: '300px' }}
                              >
                                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                                  {data.winterOlympics.koreaMedalists && data.winterOlympics.koreaMedalists.filter(m => m.medalType === 'gold').length > 0 ? (
                                    data.winterOlympics.koreaMedalists.filter(m => m.medalType === 'gold').map((medalist, idx) => (
                                      <div key={idx} className="bg-white/5 rounded p-2 text-xs">
                                        <div className="text-white font-semibold">{medalist.name}</div>
                                        {medalist.discipline && <div className="text-gray-400">{medalist.discipline}</div>}
                                        {medalist.date && <div className="text-gray-500">{medalist.date}</div>}
                                      </div>
                                    ))
                                  ) : (
                                    <div className="text-center py-2 text-gray-400 text-xs">없음</div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* 은메달 */}
                          <div className="relative">
                            <div
                              className="bg-gray-400/10 rounded-lg p-3 text-center border border-gray-400/20 cursor-pointer hover:bg-gray-400/5 transition-colors"
                              onClick={() => setExpandedMedal(expandedMedal === 'silver' ? null : 'silver')}
                            >
                              <div className="text-2xl mb-1">🥈</div>
                              <div className="text-sm text-gray-400">은메달</div>
                              <div className="text-xl font-bold text-white mt-1">{data.winterOlympics.medals.silver}</div>
                            </div>
                            {expandedMedal === 'silver' && (
                              <div
                                className="absolute left-2/3 top-1/2 -translate-y-1/2 bg-gray-800 rounded-lg p-3 shadow-xl border border-gray-400/30 z-50"
                                style={{ minWidth: '200px', maxWidth: '300px' }}
                              >
                                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                                  {data.winterOlympics.koreaMedalists && data.winterOlympics.koreaMedalists.filter(m => m.medalType === 'silver').length > 0 ? (
                                    data.winterOlympics.koreaMedalists.filter(m => m.medalType === 'silver').map((medalist, idx) => (
                                      <div key={idx} className="bg-white/5 rounded p-2 text-xs">
                                        <div className="text-white font-semibold">{medalist.name}</div>
                                        {medalist.discipline && <div className="text-gray-400">{medalist.discipline}</div>}
                                        {medalist.date && <div className="text-gray-500">{medalist.date}</div>}
                                      </div>
                                    ))
                                  ) : (
                                    <div className="text-center py-2 text-gray-400 text-xs">없음</div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* 동메달 */}
                          <div className="relative">
                            <div
                              className="bg-orange-600/10 rounded-lg p-3 text-center border border-orange-600/20 cursor-pointer hover:bg-orange-600/5 transition-colors"
                              onClick={() => setExpandedMedal(expandedMedal === 'bronze' ? null : 'bronze')}
                            >
                              <div className="text-2xl mb-1">🥉</div>
                              <div className="text-sm text-gray-400">동메달</div>
                              <div className="text-xl font-bold text-white mt-1">{data.winterOlympics.medals.bronze}</div>
                            </div>
                            {expandedMedal === 'bronze' && (
                              <div
                                className="absolute left-2/3 top-1/2 -translate-y-1/2 bg-gray-800 rounded-lg p-3 shadow-xl border border-orange-600/30 z-50"
                                style={{ minWidth: '200px', maxWidth: '300px' }}
                              >
                                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                                  {data.winterOlympics.koreaMedalists && data.winterOlympics.koreaMedalists.filter(m => m.medalType === 'bronze').length > 0 ? (
                                    data.winterOlympics.koreaMedalists.filter(m => m.medalType === 'bronze').map((medalist, idx) => (
                                      <div key={idx} className="bg-white/5 rounded p-2 text-xs">
                                        <div className="text-white font-semibold">{medalist.name}</div>
                                        {medalist.discipline && <div className="text-gray-400">{medalist.discipline}</div>}
                                        {medalist.date && <div className="text-gray-500">{medalist.date}</div>}
                                      </div>
                                    ))
                                  ) : (
                                    <div className="text-center py-2 text-gray-400 text-xs">없음</div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* 합계 */}
                          <div className="bg-blue-500/10 rounded-lg p-3 text-center border border-blue-500/20">
                            <div className="text-2xl mb-1">🏆</div>
                            <div className="text-sm text-gray-400">합계</div>
                            <div className="text-xl font-bold text-white mt-1">{data.winterOlympics.medals.total}</div>
                          </div>
                        </div>
                      </div>

                      {/* 전체 국가 메달 순위 */}
                      <div>
                        <h4 className="text-sm font-semibold text-white mb-3">전체 국가 메달 순위</h4>
                        {data.winterOlympics.allCountriesMedals && data.winterOlympics.allCountriesMedals.length > 0 ? (
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                              <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                  <th style={{ padding: '10px 8px', textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '14px', fontWeight: 600 }}>순위</th>
                                  <th style={{ padding: '10px 8px', textAlign: 'left', color: 'rgba(255,255,255,0.7)', fontSize: '14px', fontWeight: 600 }}>국가</th>
                                  <th style={{ padding: '10px 8px', textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '14px', fontWeight: 600 }}>🥇</th>
                                  <th style={{ padding: '10px 8px', textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '14px', fontWeight: 600 }}>🥈</th>
                                  <th style={{ padding: '10px 8px', textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '14px', fontWeight: 600 }}>🥉</th>
                                  <th style={{ padding: '10px 8px', textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '14px', fontWeight: 600 }}>합계</th>
                                </tr>
                              </thead>
                              <tbody>
                                {data.winterOlympics.allCountriesMedals.map((country) => {
                                  const isKorea = country.nation.includes('대한민국') || country.nation.includes('Korea');

                                  return (
                                    <tr
                                      key={country.nation}
                                      style={{
                                        background: isKorea ? 'rgba(76, 175, 80, 0.2)' : 'transparent',
                                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                                      }}
                                    >
                                      <td style={{ padding: '12px 8px', textAlign: 'center', color: 'white', fontSize: '14px', fontWeight: 600 }}>{country.rank}</td>
                                      <td style={{ padding: '12px 8px', textAlign: 'left', color: 'white', fontSize: '14px', fontWeight: 600 }}>{country.nation}</td>
                                      <td style={{ padding: '12px 8px', textAlign: 'center', color: 'white', fontSize: '14px' }}>{country.gold}</td>
                                      <td style={{ padding: '12px 8px', textAlign: 'center', color: 'white', fontSize: '14px' }}>{country.silver}</td>
                                      <td style={{ padding: '12px 8px', textAlign: 'center', color: 'white', fontSize: '14px' }}>{country.bronze}</td>
                                      <td style={{ padding: '12px 8px', textAlign: 'center', color: 'white', fontSize: '14px', fontWeight: 600 }}>{country.total}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center py-4 text-gray-400 text-sm">
                            아직 메달 순위가 없습니다
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {winterOlympicsTab === 'schedule' && (
                    <div className="space-y-4">
                      {/* 오늘의 경기 */}
                      {data.winterOlympics.todaySchedule.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-white mb-3">오늘의 경기</h4>
                          <div className="space-y-2">
                            {data.winterOlympics.todaySchedule.map((game, idx) => (
                              <div
                                key={idx}
                                className="bg-white/5 rounded-lg p-3 border border-white/10"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-white font-semibold">{game.discipline} ({game.time})</span>
                                  <span
                                    className="px-2 py-0.5 rounded text-xs"
                                    style={{
                                      backgroundColor: game.status === 'LIVE' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                                      color: game.status === 'LIVE' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(59, 130, 246, 0.7)'
                                    }}
                                  >
                                    {game.status}
                                  </span>
                                </div>
                                {game.players && game.players.length > 0 && (
                                  <div className="text-sm text-gray-300 mt-1">{game.players.join(', ')}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 전체 경기 일정 (종료 후에는 모두 표시) */}
                      {data.winterOlympics.upcomingSchedule.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-white mb-3">전체 경기 일정</h4>
                          <div className="space-y-2">
                            {data.winterOlympics.upcomingSchedule.map((game, idx) => (
                              <div
                                key={idx}
                                className="bg-white/5 rounded-lg p-3 border border-white/10"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-white font-semibold">
                                    {game.discipline} ({new Date(game.date).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })} {game.time})
                                  </span>
                                  <span className="text-xs text-gray-400">{game.status}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {data.winterOlympics.todaySchedule.length === 0 && data.winterOlympics.upcomingSchedule.length === 0 && (
                        <div className="text-center py-4 text-gray-400">
                          경기 일정이 없습니다
                        </div>
                      )}
                    </div>
                  )}

                  {winterOlympicsTab === 'discipline' && (
                    <div>
                      {/* 종목 선택 칩 - 모든 종목 표시 */}
                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        overflowX: 'auto',
                        paddingBottom: '12px',
                        marginBottom: '12px',
                      }} className="hide-scrollbar">
                        {ALL_DISCIPLINES.map((discipline) => {
                          const hasData = data.winterOlympics?.disciplineSchedules?.[discipline.id];
                          return (
                            <button
                              key={discipline.id}
                              onClick={() => setSelectedDiscipline(discipline.id)}
                              style={{
                                padding: '6px 14px',
                                border: 'none',
                                borderRadius: '20px',
                                cursor: 'pointer',
                                fontWeight: 500,
                                fontSize: '13px',
                                whiteSpace: 'nowrap',
                                flexShrink: 0,
                                background: selectedDiscipline === discipline.id ? 'rgba(102, 126, 234, 0.4)' : 'rgba(255, 255, 255, 0.08)',
                                color: selectedDiscipline === discipline.id ? 'white' : hasData ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.3)',
                                transition: 'all 0.2s',
                              }}
                            >
                              {discipline.name}
                            </button>
                          );
                        })}
                      </div>

                      {/* 선택된 종목의 경기 리스트 */}
                      {selectedDiscipline && data.winterOlympics?.disciplineSchedules?.[selectedDiscipline] ? (
                        <div className="space-y-2">
                          {data.winterOlympics.disciplineSchedules[selectedDiscipline].games.map((game, idx) => (
                            <div
                              key={idx}
                              className="bg-white/5 rounded-lg p-3 border border-white/10"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-white font-semibold text-sm">{game.disciplineDetail || '-'}</span>
                                <span
                                  className="px-2 py-0.5 rounded text-xs flex-shrink-0 ml-2"
                                  style={{
                                    backgroundColor: game.status === 'LIVE' ? 'rgba(239, 68, 68, 0.15)' :
                                                    game.status === '종료' ? 'rgba(107, 114, 128, 0.15)' :
                                                    'rgba(59, 130, 246, 0.15)',
                                    color: game.status === 'LIVE' ? 'rgba(239, 68, 68, 0.9)' :
                                           game.status === '종료' ? 'rgba(107, 114, 128, 0.7)' :
                                           'rgba(59, 130, 246, 0.7)'
                                  }}
                                >
                                  {game.status}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 mb-2">
                                {game.date && (
                                  <span className="mr-2">
                                    {new Date(game.date).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
                                  </span>
                                )}
                                {game.time}
                              </div>
                              {/* 팀 대결 (선수 2명 + 스코어) */}
                              {game.players && game.players.length === 2 && game.scores && game.scores.length === 2 ? (
                                <div className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2 mt-1">
                                  <span className={`text-sm font-medium ${game.result?.includes(game.players[0]) ? 'text-white' : 'text-gray-400'}`}>
                                    {game.players[0]}
                                  </span>
                                  <span className="text-sm font-bold text-white mx-3">
                                    {game.scores[0]} - {game.scores[1]}
                                  </span>
                                  <span className={`text-sm font-medium ${game.result?.includes(game.players[1]) ? 'text-white' : 'text-gray-400'}`}>
                                    {game.players[1]}
                                  </span>
                                </div>
                              ) : game.players && game.players.length === 2 ? (
                                <div className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2 mt-1">
                                  <span className="text-sm text-gray-300">{game.players[0]}</span>
                                  <span className="text-xs text-gray-500">vs</span>
                                  <span className="text-sm text-gray-300">{game.players[1]}</span>
                                </div>
                              ) : game.players && game.players.length > 0 ? (
                                <div className="text-sm text-gray-300 mt-1">
                                  {game.players.join(', ')}
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      ) : selectedDiscipline ? (
                        <div className="text-center py-8 text-gray-400">
                          <div className="text-lg mb-2">{ALL_DISCIPLINES.find(d => d.id === selectedDiscipline)?.name}</div>
                          <div className="text-sm">한국 선수 경기 일정이 없습니다</div>
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-400 text-sm">
                          종목을 선택해주세요
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InternationalSportsDetail;
