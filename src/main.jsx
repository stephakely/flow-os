import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

console.log('[DEBUG] main.jsx started');

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('[DEBUG] Root element NOT FOUND!');
  } else {
    console.log('[DEBUG] Root element found, mounting React...');
    ReactDOM.createRoot(rootElement).render(<App />);
    console.log('[DEBUG] React render called');
  }
} catch (e) {
  console.error('[DEBUG] CRITICAL MOUNT ERROR:', e);
  document.body.innerHTML = '<div style="color:red; background:white; padding:20px;"><h1>CRITICAL MOUNT ERROR</h1><pre>' + e.toString() + '</pre></div>';
}
