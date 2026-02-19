import MainLayout from '@/components/MainLayout/MainLayout';
import BaseballCard from '@/components/Baseball/BaseballCard';
import VolleyballCard from '@/components/Volleyball/VolleyballCard';
import InternationalSportsCard from '@/components/InternationalSports/InternationalSportsCard';
import { getSortedSports } from '@/utils/seasonManager';
import { SportType } from '@/types';

const MainPage = () => {
  const sortedSports = getSortedSports();

  // 스포츠 타입에 따라 카드 컴포넌트 반환
  const getCardComponent = (sport: SportType, isInSeason: boolean) => {
    switch (sport) {
      case 'baseball':
        return <BaseballCard isInSeason={isInSeason} />;
      case 'volleyball':
        return <VolleyballCard isInSeason={isInSeason} />;
      case 'international':
        return <InternationalSportsCard isInSeason={isInSeason} />;
    }
  };

  return (
    <MainLayout
      area1={getCardComponent(sortedSports[0].sport, sortedSports[0].inSeason)}
      area2={getCardComponent(sortedSports[1].sport, sortedSports[1].inSeason)}
      area3={getCardComponent(sortedSports[2].sport, sortedSports[2].inSeason)}
      area4={
        <div className="h-full flex flex-col overflow-auto bg-card backdrop-blur-card rounded-card p-5 border border-white/20">
          {/* 빈 영역 */}
        </div>
      }
    />
  );
};

export default MainPage;
