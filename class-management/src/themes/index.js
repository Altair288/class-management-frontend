"use client";
import { createTheme } from '@mui/material/styles';
import palette from './palette';
import typography from './typography';
import shadows from './shadow';
import componentsOverride from './overrides';

const theme = createTheme({
  palette,
  typography,
  shadows,
});

theme.components = componentsOverride(theme);

export default theme;
