import React, { useState, useEffect } from 'react';
import { api, apiContext } from './lib/apiService';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('Initializing...');

  useEffect(() => {
    console.log('[DEBUG] App started');
    setStatus('Checking Firebase...');
    
    const timeout = setTimeout(() => {
      console.log('[DEBUG] Safety timeout triggered');
      setLoading(false);
    }, 5000);

    api.getCollection('global_users').then(users => {
      console.log('[DEBUG] Users fetched:', users?.length);
      setStatus(`Users: ${users?.length || 0}`);
    }).catch(err => {
      console.error('[DEBUG] Fetch error:', err);
      setStatus('Error: ' + err.message);
    }).finally(() => {
      clearTimeout(timeout);
      setLoading(false);
    });
  }, []);

  return (
    <div style={{ backgroundColor: 'black', color: 'white', height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace' }}>
      <h1 style={{ color: '#00FFAA' }}>FLOW_OS DEBUG CONSOLE</h1>
      <p>Status: {status}</p>
      <p>Loading: {loading ? 'YES' : 'NO'}</p>
      <div style={{ marginTop: '20px', border: '1px solid #333', padding: '10px' }}>
         Check console for [DEBUG] logs
      </div>
    </div>
  );
}
