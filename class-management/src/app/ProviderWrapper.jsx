'use client';

import { ThemeProvider } from '../context/ThemeContext';

export default function ProviderWrapper({ children }) {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
}
