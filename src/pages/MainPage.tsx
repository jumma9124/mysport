import MainLayout from '@/components/MainLayout/MainLayout';
import BaseballCard from '@/components/Baseball/BaseballCard';
import VolleyballCard from '@/components/Volleyball/VolleyballCard';
import InternationalSportsCard from '@/components/InternationalSports/InternationalSportsCard';
import { getSortedSports } from '@/utils/seasonManager';
import { SportType } from '@/types';

const SPORT_LABELS: Record<SportType, string> = {
  baseball: '야구',
  volleyball: '배구',
  international: '국제대회',
};

const MainPage = () => {
  const sortedSports = getSortedSports();

  // 동계올림픽 끝났으니 off-season인 국제대회는 메인에서 제외
  const filteredSports = sortedSports.filter(s => {
    if (s.sport === 'international' && !s.inSeason) {
      return false;
    }
    return true;
  });

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

  const slides = filteredSports.map(s => getCardComponent(s.sport, s.inSeason));
  const labels = filteredSports.map(s => SPORT_LABELS[s.sport]);

  return (
    <MainLayout
      slides={slides}
      labels={labels}
    />
  );
};

export default MainPage;
