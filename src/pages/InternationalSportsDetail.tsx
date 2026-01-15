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
      <div className="max-w-7xl mx-auto w-full flex flex-col flex-1">
        {/* 헤더 */}
        <header className="mb-6">
          <Link to="/" className="text-white hover:text-gray-300 inline-flex items-center mb-4">
            ← 돌아가기
          </Link>
          <h1 className="text-3xl font-bold text-white">{data.name}</h1>
        </header>

        <div style={{
          background: 'rgb(32, 34, 52)',
          backdropFilter: 'blur(10px)',
          borderRadius: '15px',
          padding: '20px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <p style={{ color: 'rgba(255,255,255,0.7)' }}>국제스포츠 상세 정보</p>
        </div>
      </div>
    </div>
  );
};

export default InternationalSportsDetail;
