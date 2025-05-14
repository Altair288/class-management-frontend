import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from '../themes';

export default function ProviderWrapper({ children }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      {children}
    </ThemeProvider>
  );
}
