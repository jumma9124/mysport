import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { InternationalSportsData } from '@/types';
import { fetchInternationalSportsData } from '@/utils/dataUpdater';

const InternationalSportsDetail = () => {
  const [data, setData] = useState<InternationalSportsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const result = await fetchInternationalSportsData();
      setData(result);
      setLoading(false);
    };

    loadData();
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
      <div className="max-w-[1400px] mx-auto w-full flex flex-col flex-1">
        {/* 헤더 */}
        <header className="mb-6">
          <Link to="/" className="text-white hover:text-gray-300 inline-flex items-center mb-4">
            ← 돌아가기
          </Link>
          <h1 className="text-3xl font-bold text-white">{data.name}</h1>
        </header>

        {/* 2×2 그리드 레이아웃 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 flex-1">
          {/* 왼쪽 상단 */}
          <div className="min-h-[300px] md:min-h-0">
            <div className="h-full flex flex-col overflow-auto" style={{
              background: 'rgb(32, 34, 52)',
              backdropFilter: 'blur(10px)',
              borderRadius: '15px',
              padding: '20px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <h2 className="text-xl font-bold mb-4 text-white">국제스포츠 정보</h2>
              <p style={{ color: 'rgba(255,255,255,0.7)' }}>상세 정보 준비 중...</p>
            </div>
          </div>

          {/* 오른쪽 상단 */}
          <div className="min-h-[300px] md:min-h-0">
            <div className="h-full flex flex-col overflow-auto" style={{
              background: 'rgb(32, 34, 52)',
              backdropFilter: 'blur(10px)',
              borderRadius: '15px',
              padding: '20px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              {/* 빈 영역 */}
            </div>
          </div>

          {/* 왼쪽 하단 */}
          <div className="min-h-[300px] md:min-h-0">
            <div className="h-full flex flex-col overflow-auto" style={{
              background: 'rgb(32, 34, 52)',
              backdropFilter: 'blur(10px)',
              borderRadius: '15px',
              padding: '20px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              {/* 빈 영역 */}
            </div>
          </div>

          {/* 오른쪽 하단 */}
          <div className="min-h-[300px] md:min-h-0">
            <div className="h-full flex flex-col overflow-auto" style={{
              background: 'rgb(32, 34, 52)',
              backdropFilter: 'blur(10px)',
              borderRadius: '15px',
              padding: '20px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              {/* 빈 영역 */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InternationalSportsDetail;
