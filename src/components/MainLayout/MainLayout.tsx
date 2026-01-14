import { ReactNode } from 'react';

interface MainLayoutProps {
  area1: ReactNode;
  area2: ReactNode;
  area3: ReactNode;
  area4: ReactNode;
}

const MainLayout = ({ area1, area2, area3, area4 }: MainLayoutProps) => {
  const getLastUpdateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const period = now.getHours() >= 12 ? '오후' : '오전';
    const displayHours = now.getHours() > 12 ? now.getHours() - 12 : now.getHours() === 0 ? 12 : now.getHours();
    
    return `${year}. ${month}. ${day}. ${period} ${displayHours}:${minutes}:${seconds}`;
  };

  return (
    <div className="min-h-screen bg-black p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">MY SPORT</h1>
          <div className="text-sm text-white">
            마지막 업데이트: {getLastUpdateTime()}
          </div>
        </header>

        {/* 모바일: 세로 배치, 데스크톱: 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* 영역 1 - 상단 좌측 (모바일: 상단) */}
          <div className="md:col-span-1">
            {area1}
          </div>
          
          {/* 영역 2 - 상단 우측 (모바일: 두번째) */}
          <div className="md:col-span-1">
            {area2}
          </div>
          
          {/* 영역 3 - 하단 좌측 (모바일: 세번째) */}
          <div className="md:col-span-1">
            {area3}
          </div>
          
          {/* 영역 4 - 하단 우측 (모바일: 네번째) - 고정 */}
          <div className="md:col-span-1">
            {area4}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;