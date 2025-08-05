import React, { useEffect, useState, useRef, useCallback } from 'react';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import './style.css';
import { initApp } from './initApp.js';
import Inspector from './components/Inspector.jsx';
import Theatre from './components/Theatre.jsx';
import Timeline from './components/Timeline.jsx';

export default function App() {
  const [inspectorOpen, setInspectorOpen] = useState(() => {
    return localStorage.getItem('inspector-open') !== 'false';
  });

  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initApp();
    initRef.current = true;
  }, []);

  useEffect(() => {
    localStorage.setItem('inspector-open', inspectorOpen);
  }, [inspectorOpen]);

  const toggleInspector = useCallback(() => {
    setInspectorOpen(prev => !prev);
  }, []);

  return (
    <Box id="app-container" className="app-container" sx={{ display: 'flex', height: '100vh' }}>
      <CssBaseline />
      <Inspector open={inspectorOpen} />
      <Box className="main-content" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Theatre />
        <Timeline onToggleInspector={toggleInspector} />
      </Box>
    </Box>
  );
}
