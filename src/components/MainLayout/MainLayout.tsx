import { ReactNode, useState, useRef, useCallback } from 'react';

interface MainLayoutProps {
  slides: ReactNode[];
  labels: string[];
}

const MainLayout = ({ slides, labels }: MainLayoutProps) => {
  // 내부 인덱스: 클론 포함 (0=lastClone, 1~N=실제, N+1=firstClone)
  const [innerIndex, setInnerIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const isJumping = useRef(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const count = slides.length;

  // 실제 슬라이드 인덱스 (0-based)
  const realIndex = innerIndex <= 0 ? count - 1 : innerIndex > count ? 0 : innerIndex - 1;

  const getLastUpdateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

  const goTo = useCallback((realIdx: number) => {
    setIsTransitioning(true);
    setInnerIndex(realIdx + 1);
  }, []);

  const goPrev = useCallback(() => {
    setIsTransitioning(true);
    setInnerIndex(prev => prev - 1);
  }, []);

  const goNext = useCallback(() => {
    setIsTransitioning(true);
    setInnerIndex(prev => prev + 1);
  }, []);

  // 클론 위치에 도착하면 애니메이션 없이 실제 위치로 점프
  const handleTransitionEnd = useCallback(() => {
    if (innerIndex <= 0) {
      isJumping.current = true;
      setIsTransitioning(false);
      setInnerIndex(count);
    } else if (innerIndex > count) {
      isJumping.current = true;
      setIsTransitioning(false);
      setInnerIndex(1);
    }
  }, [innerIndex, count]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;

    if (diff > threshold) {
      goNext();
    } else if (diff < -threshold) {
      goPrev();
    }
  }, [goNext, goPrev]);

  // 렌더링용 슬라이드: [마지막클론, ...실제슬라이드, 첫번째클론]
  const renderSlides = [
    slides[count - 1], // 마지막 슬라이드의 클론 (앞에 배치)
    ...slides,
    slides[0],          // 첫 번째 슬라이드의 클론 (뒤에 배치)
  ];

  return (
    <div className="h-screen bg-black flex flex-col p-4 md:p-6 overflow-hidden">
      <div className="max-w-[800px] mx-auto w-full flex flex-col flex-1 min-h-0">
        {/* 헤더 */}
        <header className="mb-4 flex items-center justify-center relative shrink-0">
          <h1 className="text-3xl font-bold text-white">MY SPORT</h1>
          <div className="text-sm text-white absolute right-0">
            {getLastUpdateTime()}
          </div>
        </header>

        {/* 슬라이드 영역 */}
        <div
          className="flex-1 relative min-h-0 overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className={`flex h-full ${isTransitioning ? 'transition-transform duration-300 ease-in-out' : ''}`}
            style={{ transform: `translateX(-${innerIndex * 100}%)` }}
            onTransitionEnd={handleTransitionEnd}
          >
            {renderSlides.map((slide, index) => (
              <div
                key={index}
                className="w-full h-full shrink-0 px-1"
              >
                {slide}
              </div>
            ))}
          </div>

          {/* 좌우 화살표 버튼 */}
          <button
            onClick={goPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/70 hover:bg-white/20 transition-colors z-10"
            aria-label="이전"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            onClick={goNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/70 hover:bg-white/20 transition-colors z-10"
            aria-label="다음"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        {/* 하단 도트 인디케이터 */}
        <div className="flex items-center justify-center gap-3 py-4 shrink-0">
          {labels.map((label, index) => (
            <button
              key={index}
              onClick={() => goTo(index)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                index === realIndex
                  ? 'bg-white/20 text-white'
                  : 'bg-transparent text-white/40 hover:text-white/60'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  index === realIndex ? 'bg-orange-500' : 'bg-white/30'
                }`}
              />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
