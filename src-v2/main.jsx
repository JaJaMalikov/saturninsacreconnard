import React from 'react';
import ReactDOM from 'react-dom/client';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App.jsx';
import { AnimationProvider } from './context/AnimationContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <CssBaseline />
    <AnimationProvider>
      <App />
    </AnimationProvider>
  </React.StrictMode>
);
