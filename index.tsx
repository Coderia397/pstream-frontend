import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import App from './App';
import BootIntro from './components/intro/BootIntro';
import { GlobalProvider } from './context/GlobalContext';
import { TitleProvider } from './context/TitleContext';
import { HeroColorProvider } from './context/HeroColorContext';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';
import './i18n';
// Block third-party embed players from clearing our console log
if (typeof window !== 'undefined') {
  console.clear = () => {
    console.info('[System] Blocked attempt to clear the console.');
  };
}


const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  // reducedMotion="user" makes every framer-motion animation follow the OS
  // "reduce motion" setting: transform/layout movement is dropped while opacity
  // fades are kept, so the UI still reads as responsive without the motion that
  // triggers vestibular discomfort. CSS animations are handled in index.css.
  <MotionConfig reducedMotion="user">
    <TitleProvider>
      <HeroColorProvider>
      <GlobalProvider>
        <ErrorBoundary>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <App />
            {/* App-open ident (mobile only) — covers cold-boot loading, then fades */}
            <BootIntro />
          </BrowserRouter>
        </ErrorBoundary>
      </GlobalProvider>
      </HeroColorProvider>
    </TitleProvider>
  </MotionConfig>
);

// Register Service Worker for Media Background Interceptor
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
            console.log('[SW] Registered with scope:', registration.scope);
        }).catch(err => {
            console.error('[SW] Registration failed:', err);
        });
    });
}
