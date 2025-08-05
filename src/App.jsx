import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import { initApp } from './initApp.js';
import Inspector from './components/Inspector.jsx';
import Theatre from './components/Theatre.jsx';
import Timeline from './components/Timeline.jsx';
import { useAppContext } from './AppContext.jsx';
import './style.css';

const drawerWidth = 300;

export default function App() {
  const initRef = useRef(false);
  const { inspectorOpen } = useAppContext();

  useEffect(() => {
    if (initRef.current) return;
    initApp();
    initRef.current = true;
  }, []);

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <Inspector open={inspectorOpen} width={drawerWidth} />
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          ml: inspectorOpen ? `${drawerWidth}px` : 0,
        }}
      >
        <Theatre />
        <Timeline />
      </Box>
    </Box>
  );
}
