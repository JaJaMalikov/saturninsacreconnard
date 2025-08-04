import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { TimelineProvider } from './context/TimelineContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TimelineProvider>
      <App />
    </TimelineProvider>
  </StrictMode>,
);
