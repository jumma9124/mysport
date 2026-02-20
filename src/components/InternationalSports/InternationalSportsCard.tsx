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

interface InternationalSportsCardProps {
  isInSeason?: boolean;
}

const InternationalSportsCard = ({ isInSeason = false }: InternationalSportsCardProps) => {
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

  const borderClass = isInSeason
    ? 'border-2 border-orange-500'
    : 'border border-white/20';

  if (loading || !data) {
    return (
      <div className={`animate-pulse h-full flex flex-col overflow-auto bg-card backdrop-blur-card rounded-card p-5 ${borderClass}`}>
        <div className="h-8 bg-gray-700 rounded w-1/2 mb-4"></div>
        <div className="h-4 bg-gray-700 rounded w-3/4"></div>
      </div>
    );
  }

  const getEventIcon = () => {
    return (
      <div className="w-6 h-6 flex-shrink-0 inline-flex items-center justify-center text-accent-green text-lg font-bold">
        ✓
      </div>
    );
  };

  return (
    <Link to="/international" className="block h-full">
      <div className={`transition-colors cursor-pointer h-full flex flex-col overflow-auto bg-card backdrop-blur-card rounded-card p-5 ${borderClass}`}>
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-7 h-7 mr-2 flex-shrink-0 inline-flex items-center justify-center rounded border-2 bg-accent-green/20 border-accent-green/50 text-accent-green text-xl font-bold">
              ✓
            </div>
            <h2 className="text-3xl font-bold text-white">대한민국 대표팀</h2>
          </div>
          <span className="text-lg text-gray-400">국제 스포츠대회</span>
        </div>

        {/* 이벤트 리스트 */}
        <div className="space-y-4 mt-6">
          {events.length > 0 ? (
            events.map((event, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  {getEventIcon()}
                </div>
                <div className="flex-1">
                  <div className="text-xl text-white font-medium">{event.name}</div>
                  <div className="text-lg text-gray-400 mt-1">개막 D-{event.daysLeft || 0}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-lg text-gray-400">로딩 중...</div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default InternationalSportsCard;