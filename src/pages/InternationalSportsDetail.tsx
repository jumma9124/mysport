import { useEffect, useState } from 'react';
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

const InternationalSportsDetail = () => {
  const [data, setData] = useState<InternationalSportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [expandedEvents, setExpandedEvents] = useState<{ [key: number]: boolean }>({});

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

        setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

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

        {/* 이벤트 리스트 */}
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
            <h2 className="text-xl font-bold text-white">국제 스포츠 대회</h2>
          </div>

          {events.length > 0 ? (
            <div className="space-y-3">
              {events.map((event, idx) => (
                <div key={idx} className="rounded-lg" style={{ border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <button
                    onClick={() => toggleEvent(idx)}
                    className="w-full p-4 text-left flex justify-between items-center hover:bg-white/5"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-white font-semibold">{event.name}</span>
                      <span
                        className="px-2 py-0.5 rounded text-sm"
                        style={{
                          backgroundColor: event.daysLeft === 0 ? 'rgba(76, 175, 80, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                          color: event.daysLeft === 0 ? 'rgba(76, 175, 80, 0.7)' : 'rgba(59, 130, 246, 0.7)'
                        }}
                      >
                        {event.daysLeft === 0 ? '진행 중' : `개막 D-${event.daysLeft}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">{event.date}</span>
                      <span className="text-white">{expandedEvents[idx] ? '▼' : '▶'}</span>
                    </div>
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
              ))}
            </div>
          ) : (
            <div className="text-center py-8" style={{ color: 'rgba(255,255,255,0.5)' }}>
              예정된 이벤트가 없습니다
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InternationalSportsDetail;
