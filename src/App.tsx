import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { BattleView } from './components/Layout/BattleView';

function HomePage() {
  return (
    <div style={{ height: '100vh', width: '100vw', background: '#0a0a1a', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <h1 style={{ fontSize: '1.5em', fontWeight: 'bold' }}>WWII Interactive Map</h1>
      <p style={{ color: '#888' }}>Select a battle from the theatre selector or visit a battle directly.</p>
      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <a href="/battle/stalingrad" style={{ padding: '8px 16px', background: '#333', color: '#fff', textDecoration: 'none', borderRadius: 4 }}>
          Battle of Stalingrad
        </a>
        <a href="/battle/stalingrad/edit" style={{ padding: '8px 16px', background: '#1a0a0a', color: '#ff7f7f', textDecoration: 'none', borderRadius: 4, border: '1px solid #444' }}>
          Stalingrad (Editor)
        </a>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/battle/:battleId/edit" element={<BattleView editor />} />
        <Route path="/battle/:battleId" element={<BattleView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
