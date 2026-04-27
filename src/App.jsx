import React from 'react';

export default function App() {
  console.log('[DEBUG] Barebones App rendering...');
  return (
    <div style={{ backgroundColor: 'black', color: 'white', height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <h1 style={{ color: '#00FFAA', fontSize: '3rem' }}>FLOW_OS IS ALIVE</h1>
    </div>
  );
}
