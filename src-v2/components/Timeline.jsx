import React from 'react';
import { Box, Typography } from '@mui/material';

export default function Timeline() {
  return (
    <Box sx={{ height: 80, bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Typography>Timeline</Typography>
    </Box>
  );
}
