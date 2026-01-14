import MainLayout from '@/components/MainLayout/MainLayout';
import BaseballCard from '@/components/Baseball/BaseballCard';
import VolleyballCard from '@/components/Volleyball/VolleyballCard';
import InternationalSportsCard from '@/components/InternationalSports/InternationalSportsCard';

const MainPage = () => {
  return (
    <MainLayout
      area1={<VolleyballCard />}
      area2={<BaseballCard />}
      area3={<InternationalSportsCard />}
      area4={
        <div className="bg-gray-900 rounded-lg p-6 h-full flex flex-col">
          {/* 빈 영역 */}
        </div>
      }
    />
  );
};

export default MainPage;