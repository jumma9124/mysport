import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import ErrorBoundary from './components/ErrorBoundary';

// Code Splitting - Lazy Loading
const MainPage = lazy(() => import('./pages/MainPage'));
const BaseballDetail = lazy(() => import('./pages/BaseballDetail'));
const VolleyballDetail = lazy(() => import('./pages/VolleyballDetail'));
const InternationalSportsDetail = lazy(() => import('./pages/InternationalSportsDetail'));

// 로딩 컴포넌트
const LoadingFallback = () => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <div className="text-white text-xl">로딩 중...</div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<MainPage />} />
            <Route path="/baseball" element={<BaseballDetail />} />
            <Route path="/volleyball" element={<VolleyballDetail />} />
            <Route path="/international" element={<InternationalSportsDetail />} />
          </Routes>
        </Suspense>
      </Router>
    </ErrorBoundary>
  );
}

export default App;