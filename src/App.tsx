import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import MainPage from './pages/MainPage';
import BaseballDetail from './pages/BaseballDetail';
import VolleyballDetail from './pages/VolleyballDetail';
import InternationalSportsDetail from './pages/InternationalSportsDetail';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/baseball" element={<BaseballDetail />} />
        <Route path="/volleyball" element={<VolleyballDetail />} />
        <Route path="/international" element={<InternationalSportsDetail />} />
      </Routes>
    </Router>
  );
}

export default App;