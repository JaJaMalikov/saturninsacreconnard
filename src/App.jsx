import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Box, Drawer } from '@mui/material';
import Inspector from './components/Inspector.jsx';
import Theatre from './components/Theatre.jsx';
import Timeline from './components/Timeline.jsx';
import { initApp } from './initApp.js';
import './style.css';

const drawerWidth = 300;

export default function App() {
  const [inspectorCollapsed, setInspectorCollapsed] = useState(() =>
    localStorage.getItem('inspector-collapsed') === 'true'
  );

  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initApp();
    initRef.current = true;
  }, []);

  useEffect(() => {
    localStorage.setItem('inspector-collapsed', inspectorCollapsed);
  }, [inspectorCollapsed]);

  const toggleInspector = useCallback(() => {
    setInspectorCollapsed(prev => !prev);
  }, []);

  return (
    <Box id="app-container" sx={{ display: 'flex', height: '100vh' }}>
      <Drawer
        variant="persistent"
        anchor="left"
        open={!inspectorCollapsed}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box'
          }
        }}
      >
        <Inspector />
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          ml: !inspectorCollapsed ? `${drawerWidth}px` : 0
        }}
      >
        <Theatre />
        <Timeline onToggleInspector={toggleInspector} />
      </Box>
    </Box>
  );
}
