/**
 * MUI theme configuration for Tiny Leagues Online
 *
 * Centralized design tokens for consistent, premium styling.
 * Supports light and dark modes.
 */

import { createTheme } from '@mui/material/styles';

/**
 * Creates the app theme for the given mode (light/dark)
 * @param {boolean} isDarkMode - Whether to use dark mode
 * @returns {object} MUI theme object
 */
export const createAppTheme = (isDarkMode) => {
  const mode = isDarkMode ? 'dark' : 'light';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: isDarkMode ? '#7C9CFF' : '#2563EB',
        light: isDarkMode ? '#A5B8FF' : '#3B82F6',
        dark: isDarkMode ? '#5A7BE8' : '#1D4ED8',
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: isDarkMode ? '#94A3B8' : '#64748B',
        light: isDarkMode ? '#CBD5E1' : '#94A3B8',
        dark: isDarkMode ? '#64748B' : '#475569',
      },
      success: {
        main: isDarkMode ? '#34D399' : '#059669',
        light: isDarkMode ? '#6EE7B7' : '#10B981',
      },
      error: {
        main: isDarkMode ? '#F87171' : '#DC2626',
        light: isDarkMode ? '#FCA5A5' : '#EF4444',
      },
      background: {
        default: isDarkMode ? '#0F172A' : '#F8FAFC',
        paper: isDarkMode ? '#1E293B' : '#FFFFFF',
      },
      text: {
        primary: isDarkMode ? '#F1F5F9' : '#0F172A',
        secondary: isDarkMode ? '#94A3B8' : '#64748B',
        disabled: isDarkMode ? '#64748B' : '#94A3B8',
      },
      divider: isDarkMode ? 'rgba(148, 163, 184, 0.2)' : 'rgba(15, 23, 42, 0.08)',
    },
    typography: {
      fontFamily: [
        'Inter',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ].join(','),
      h1: {
        fontSize: '2rem',
        fontWeight: 700,
        letterSpacing: '-0.02em',
        lineHeight: 1.2,
      },
      h2: {
        fontSize: '1.5rem',
        fontWeight: 600,
        letterSpacing: '-0.01em',
      },
      h3: {
        fontSize: '1.25rem',
        fontWeight: 600,
      },
      h4: {
        fontSize: '1.125rem',
        fontWeight: 600,
      },
      h5: {
        fontSize: '1rem',
        fontWeight: 600,
      },
      h6: {
        fontSize: '0.9375rem',
        fontWeight: 600,
      },
      subtitle1: {
        fontSize: '1rem',
        fontWeight: 500,
      },
      subtitle2: {
        fontSize: '0.875rem',
        fontWeight: 500,
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.5,
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.5,
      },
      button: {
        fontWeight: 600,
        textTransform: 'none',
      },
    },
    shape: {
      borderRadius: 12,
    },
    shadows: [
      'none',
      isDarkMode ? '0 1px 2px rgba(0, 0, 0, 0.3)' : '0 1px 2px rgba(15, 23, 42, 0.05)',
      isDarkMode ? '0 2px 4px rgba(0, 0, 0, 0.3)' : '0 2px 4px rgba(15, 23, 42, 0.06)',
      isDarkMode ? '0 4px 8px rgba(0, 0, 0, 0.35)' : '0 4px 8px rgba(15, 23, 42, 0.08)',
      isDarkMode ? '0 8px 16px rgba(0, 0, 0, 0.4)' : '0 8px 16px rgba(15, 23, 42, 0.1)',
      isDarkMode ? '0 12px 24px rgba(0, 0, 0, 0.45)' : '0 12px 24px rgba(15, 23, 42, 0.12)',
      isDarkMode ? '0 16px 32px rgba(0, 0, 0, 0.5)' : '0 16px 32px rgba(15, 23, 42, 0.14)',
      isDarkMode ? '0 20px 40px rgba(0, 0, 0, 0.55)' : '0 20px 40px rgba(15, 23, 42, 0.16)',
      isDarkMode ? '0 24px 48px rgba(0, 0, 0, 0.6)' : '0 24px 48px rgba(15, 23, 42, 0.18)',
      isDarkMode ? '0 28px 56px rgba(0, 0, 0, 0.65)' : '0 28px 56px rgba(15, 23, 42, 0.2)',
      isDarkMode ? '0 32px 64px rgba(0, 0, 0, 0.7)' : '0 32px 64px rgba(15, 23, 42, 0.22)',
      ...Array(14).fill('none'),
    ],
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            fontFeatureSettings: '"cv02", "cv03", "cv04", "cv11"',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            padding: '10px 20px',
            fontSize: '0.9375rem',
          },
          contained: {
            boxShadow: 'none',
            '&:hover': {
              boxShadow: isDarkMode ? '0 4px 12px rgba(124, 156, 255, 0.25)' : '0 4px 12px rgba(37, 99, 235, 0.25)',
            },
          },
          outlined: {
            borderWidth: 1.5,
            '&:hover': {
              borderWidth: 1.5,
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: isDarkMode ? '0 4px 12px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(15, 23, 42, 0.06)',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            backgroundImage: 'none',
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          variant: 'outlined',
          size: 'small',
        },
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 10,
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: isDarkMode ? '#7C9CFF' : '#2563EB',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderWidth: 2,
              },
            },
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 12,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 20,
            boxShadow: isDarkMode ? '0 24px 48px rgba(0, 0, 0, 0.5)' : '0 24px 48px rgba(15, 23, 42, 0.2)',
          },
        },
      },
      MuiSnackbar: {
        styleOverrides: {
          root: {
            '& .MuiPaper-root': {
              borderRadius: 12,
            },
          },
        },
      },
    },
  });
};
