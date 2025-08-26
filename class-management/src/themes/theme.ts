import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: '#007bff',
      light: '#66b2ff',
      dark: '#0056b3',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#6c757d',
      light: '#9fa5aa',
      dark: '#495057',
      contrastText: '#ffffff',
    },
    success: {
      main: '#28a745',
      light: '#5cb85c',
      dark: '#1e7e34',
    },
    warning: {
      main: '#ffc107',
      light: '#ffcd39',
      dark: '#e0a800',
    },
    error: {
      main: '#dc3545',
      light: '#e66771',
      dark: '#bd2130',
    },
    background: {
      default: '#f8f9fa',
      paper: '#ffffff',
    },
    text: {
      primary: '#212529',
      secondary: '#6c757d',
    },
    divider: '#e9ecef',
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.2,
      color: '#212529',
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
      lineHeight: 1.2,
      color: '#212529',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
      lineHeight: 1.2,
      color: '#212529',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.2,
      color: '#212529',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.2,
      color: '#212529',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
      lineHeight: 1.2,
      color: '#212529',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      color: '#212529',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
      color: '#6c757d',
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.4,
      color: '#6c757d',
    },
  },
  shape: {
    borderRadius: 4,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          border: '1px solid #e9ecef',
          borderRadius: 4,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: 4,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 4,
            backgroundColor: '#f8f9fa',
            '& fieldset': {
              borderColor: '#e9ecef',
            },
            '&:hover fieldset': {
              borderColor: '#007bff',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#007bff',
              borderWidth: 1,
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          fontWeight: 500,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.875rem',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: '#e9ecef',
        },
        head: {
          backgroundColor: '#f8f9fa',
          fontWeight: 600,
          color: '#495057',
        },
      },
    },
    MuiSnackbarContent: {
      styleOverrides: {
        root: {
          borderRadius: 50,
        },
      },
    },
  },
  shadows: [
    "none",
    "0 1px 3px rgba(0,0,0,0.1)",
    "0 2px 6px rgba(0,0,0,0.1)",
    "0 4px 12px rgba(0,0,0,0.1)",
    "0 6px 18px rgba(0,0,0,0.1)",
    "0 8px 24px rgba(0,0,0,0.1)",
    "0 10px 30px rgba(0,0,0,0.1)",
    "0 12px 36px rgba(0,0,0,0.1)",
    "0 14px 42px rgba(0,0,0,0.1)",
    "0 16px 48px rgba(0,0,0,0.1)",
    "0 18px 54px rgba(0,0,0,0.1)",
    "0 20px 60px rgba(0,0,0,0.1)",
    "0 22px 66px rgba(0,0,0,0.1)",
    "0 24px 72px rgba(0,0,0,0.1)",
    "0 26px 78px rgba(0,0,0,0.1)",
    "0 28px 84px rgba(0,0,0,0.1)",
    "0 30px 90px rgba(0,0,0,0.1)",
    "0 32px 96px rgba(0,0,0,0.1)",
    "0 34px 102px rgba(0,0,0,0.1)",
    "0 36px 108px rgba(0,0,0,0.1)",
    "0 38px 114px rgba(0,0,0,0.1)",
    "0 40px 120px rgba(0,0,0,0.1)",
    "0 42px 126px rgba(0,0,0,0.1)",
    "0 44px 132px rgba(0,0,0,0.1)",
    "0 46px 138px rgba(0,0,0,0.1)",
  ],
});

export default theme;