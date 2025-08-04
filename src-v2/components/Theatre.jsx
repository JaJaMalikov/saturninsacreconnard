import React from 'react';
import { Box, Typography } from '@mui/material';

export default function Theatre() {
  return (
    <Box sx={{ flexGrow: 1, bgcolor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Typography>Zone de scène</Typography>
    </Box>
  );
}
