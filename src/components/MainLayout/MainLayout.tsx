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
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const period = now.getHours() >= 12 ? '오후' : '오전';
    const displayHours = now.getHours() > 12 ? now.getHours() - 12 : now.getHours() === 0 ? 12 : now.getHours();
    
    return `${year}. ${month}. ${day}. ${period} ${displayHours}:${minutes}:${seconds}`;
  };

  return (
    <div className="min-h-screen bg-black flex flex-col p-4 md:p-6">
      <div className="max-w-[1400px] mx-auto w-full flex flex-col flex-1">
        {/* 헤더 */}
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">MY SPORT</h1>
          <div className="text-sm text-white">
            마지막 업데이트: {getLastUpdateTime()}
          </div>
        </header>

        {/* 2×2 그리드 레이아웃 - 동일한 크기의 4개 영역 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 flex-1" style={{ gridTemplateRows: 'repeat(2, 1fr)' }}>
          {/* 영역 1 - 상단 좌측 */}
          <div>
            {area1}
          </div>

          {/* 영역 2 - 상단 우측 */}
          <div>
            {area2}
          </div>

          {/* 영역 3 - 하단 좌측 */}
          <div>
            {area3}
          </div>

          {/* 영역 4 - 하단 우측 */}
          <div>
            {area4}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;