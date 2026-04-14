import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  registerSW({
    onNeedRefresh() {
      if (confirm('새로운 버전 업데이트가 있습니다. 지금 업데이트할까요?')) {
        window.location.reload();
      }
    },
    onOfflineReady() {
      console.log('앱이 오프라인에서 실행될 준비가 되었습니다.');
    },
  });
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
