import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { InternationalSportsData } from '@/types';
import { fetchInternationalSportsData } from '@/utils/dataUpdater';

interface Event {
  name: string;
  date: string;
  icon: string;
  daysLeft?: number;
}

const InternationalSportsCard = () => {
  const [data, setData] = useState<InternationalSportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const result = await fetchInternationalSportsData();
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
    };

    loadData();
  }, []);

  if (loading || !data) {
    return (
      <div className="animate-pulse h-full flex flex-col overflow-auto" style={{
        background: 'rgb(32, 34, 52)',
        backdropFilter: 'blur(10px)',
        borderRadius: '15px',
        padding: '20px',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div className="h-8 bg-gray-700 rounded w-1/2 mb-4"></div>
        <div className="h-4 bg-gray-700 rounded w-3/4"></div>
      </div>
    );
  }

  const getEventIcon = () => {
    return (
      <div className="w-6 h-6 flex-shrink-0 inline-flex items-center justify-center" style={{
        color: '#4caf50',
        fontSize: '18px',
        fontWeight: 700
      }}>
        ✓
      </div>
    );
  };

  return (
    <Link to="/international" className="block h-full">
      <div className="transition-colors cursor-pointer h-full flex flex-col overflow-auto" style={{
        background: 'rgb(32, 34, 52)',
        backdropFilter: 'blur(10px)',
        borderRadius: '15px',
        padding: '20px',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-7 h-7 mr-2 flex-shrink-0 inline-flex items-center justify-center rounded border-2" style={{
              background: 'rgba(76, 175, 80, 0.2)',
              borderColor: 'rgba(76, 175, 80, 0.5)',
              color: '#4caf50',
              fontSize: '16px',
              fontWeight: 700
            }}>
              ✓
            </div>
            <h2 className="text-xl font-bold text-white">주요 스포츠 이벤트</h2>
          </div>
          <span className="text-sm text-gray-400">국제 스포츠대회</span>
        </div>

        {/* 이벤트 리스트 */}
        <div className="space-y-4 mt-4">
          {events.length > 0 ? (
            events.map((event, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  {getEventIcon()}
                </div>
                <div className="flex-1">
                  <div className="text-base text-white font-medium">{event.name}</div>
                  <div className="text-sm text-gray-400 mt-1">개막 D-{event.daysLeft || 0}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-400">로딩 중...</div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default InternationalSportsCard;