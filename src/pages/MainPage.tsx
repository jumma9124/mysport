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
        <div className="h-full flex flex-col overflow-auto" style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '15px',
          padding: '20px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          {/* 빈 영역 */}
        </div>
      }
    />
  );
};

export default MainPage;