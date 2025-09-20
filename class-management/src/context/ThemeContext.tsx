'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>('light');

  // 从 localStorage 读取主题设置
  useEffect(() => {
    const savedMode = localStorage.getItem('theme-mode') as ThemeMode;
    if (savedMode && (savedMode === 'light' || savedMode === 'dark')) {
      setMode(savedMode);
    } else {
      // 检查系统偏好
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setMode(systemPrefersDark ? 'dark' : 'light');
    }
  }, []);

  const toggleMode = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    localStorage.setItem('theme-mode', newMode);
  };

  // 创建 MUI 主题
  const theme = createTheme({
    palette: {
      mode,
      ...(mode === 'light'
        ? {
            // 浅色模式配色
            primary: {
              main: '#1976d2',
              light: '#42a5f5',
              dark: '#1565c0',
            },
            secondary: {
              main: '#f50057',
            },
            background: {
              default: '#f5f7fa',
              paper: '#ffffff',
            },
            text: {
              primary: '#212529',
              secondary: '#6c757d',
            },
            divider: '#e9ecef',
            action: {
              hover: 'rgba(0, 0, 0, 0.04)',
            },
            success: {
              main: '#28a745',
              light: '#71dd8a',
              dark: '#19692c',
            },
            warning: {
              main: '#ffc107',
              light: '#ffcd39',
              dark: '#d39e00',
            },
            error: {
              main: '#dc3545',
              light: '#f1556c',
              dark: '#a02834',
            },
            info: {
              main: '#17a2b8',
              light: '#58c4dc',
              dark: '#117288',
            },
          }
        : {
            // 深色模式配色
            primary: {
              main: '#64b5f6', // 更柔和的蓝色
              light: '#90caf9',
              dark: '#42a5f5',
            },
            secondary: {
              main: '#f8bbd9', // 柔和的粉色
            },
            background: {
              default: '#0a0e13', // 深色背景
              paper: '#1a1f2e', // 卡片背景
            },
            text: {
              primary: '#ffffff',
              secondary: '#b8c5d1', // 更柔和的次要文字色
            },
            divider: '#2d3748', // 深色分割线
            action: {
              hover: 'rgba(255, 255, 255, 0.08)',
              selected: 'rgba(255, 255, 255, 0.12)',
            },
            success: {
              main: '#68d391', // 温和的绿色
              light: '#9ae6b4',
              dark: '#48bb78',
            },
            warning: {
              main: '#fbb040', // 温和的橙色
              light: '#fbd38d',
              dark: '#ed8936',
            },
            error: {
              main: '#f56565', // 温和的红色
              light: '#fc8181',
              dark: '#e53e3e',
            },
            info: {
              main: '#63b3ed', // 温和的蓝色
              light: '#90cdf4',
              dark: '#4299e1',
            },
          }),
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontWeight: 600,
      },
      h2: {
        fontWeight: 600,
      },
      h3: {
        fontWeight: 600,
      },
      h4: {
        fontWeight: 600,
      },
      h5: {
        fontWeight: 600,
      },
      h6: {
        fontWeight: 600,
      },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: ({ theme }) => ({
            boxShadow: theme.palette.mode === 'light' 
              ? '0 2px 8px rgba(0,0,0,0.08)' 
              : '0 4px 16px rgba(0,0,0,0.4)',
            border: theme.palette.mode === 'light' 
              ? '1px solid #e9ecef' 
              : '1px solid #2d3748',
            backgroundImage: 'none',
          }),
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 8,
            fontWeight: 500,
          },
          outlined: ({ theme }) => ({
            borderColor: theme.palette.mode === 'light' 
              ? theme.palette.divider 
              : theme.palette.divider,
            '&:hover': {
              backgroundColor: theme.palette.mode === 'light'
                ? 'rgba(0, 0, 0, 0.04)'
                : 'rgba(255, 255, 255, 0.08)',
            },
          }),
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: ({ theme }) => ({
            backgroundColor: theme.palette.background.paper,
            borderRight: `1px solid ${theme.palette.divider}`,
          }),
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            boxShadow: theme.palette.mode === 'light'
              ? '0 1px 3px rgba(0, 0, 0, 0.1)'
              : '0 2px 8px rgba(0, 0, 0, 0.3)',
          }),
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundColor: theme.palette.mode === 'light'
              ? '#e9ecef'
              : '#2d3748',
          }),
        },
      },
      MuiCircularProgress: {
        styleOverrides: {
          circle: {
            strokeLinecap: 'round',
          },
        },
      },
    },
  });

  return (
    <ThemeContext.Provider value={{ mode, toggleMode }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};