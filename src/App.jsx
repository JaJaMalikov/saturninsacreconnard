import React, { useEffect, useState, useRef } from 'react';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import { initApp } from './initApp.js';
import Inspector from './components/Inspector.jsx';
import Theatre from './components/Theatre.jsx';
import Timeline from './components/Timeline.jsx';
import './style.css';

export default function App() {
  const [inspectorOpen, setInspectorOpen] = useState(() =>
    localStorage.getItem('inspector-collapsed') !== 'true'
  );
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initApp();
    initRef.current = true;
  }, []);

  useEffect(() => {
    localStorage.setItem('inspector-collapsed', inspectorOpen ? 'false' : 'true');
  }, [inspectorOpen]);

  const toggleInspector = () => {
    setInspectorOpen(prev => !prev);
  };

  return (
    <Box id="app-container" sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <CssBaseline />
      <Inspector open={inspectorOpen} onClose={toggleInspector} />
      <Box sx={{ flexGrow: 1, ml: inspectorOpen ? '250px' : 0, transition: 'margin-left 0.3s' }}>
        <Theatre />
      </Box>
      <Timeline onToggleInspector={toggleInspector} />
    </Box>
  );
}
