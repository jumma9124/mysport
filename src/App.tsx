import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import MainPage from './pages/MainPage';
import BaseballDetail from './pages/BaseballDetail';
import VolleyballDetail from './pages/VolleyballDetail';
import InternationalSportsDetail from './pages/InternationalSportsDetail';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/baseball" element={<BaseballDetail />} />
          <Route path="/volleyball" element={<VolleyballDetail />} />
          <Route path="/international" element={<InternationalSportsDetail />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;