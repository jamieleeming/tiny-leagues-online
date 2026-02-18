/**
 * MUI theme - Premium dark-first design
 *
 * A sleek, professional aesthetic with off-white accent (#fafafa).
 * Dark mode is the default and primary experience.
 */

import { createTheme, alpha } from '@mui/material/styles';

// Premium dark palette - zinc/slate base with off-white accent
const darkPalette = {
  primary: {
    main: '#fafafa',
    light: '#ffffff',
    dark: '#e5e5e5',
    contrastText: '#09090b',
  },
  secondary: {
    main: '#71717a',
    light: '#a1a1aa',
    dark: '#52525b',
  },
  success: {
    main: '#10b981',
    light: '#34d399',
  },
  error: {
    main: '#ef4444',
    light: '#f87171',
  },
  background: {
    default: '#09090b',
    paper: '#18181b',
    elevated: '#27272a',
  },
  text: {
    primary: '#fafafa',
    secondary: '#a1a1aa',
    disabled: '#71717a',
  },
  divider: alpha('#ffffff', 0.06),
};

const lightPalette = {
  primary: {
    main: '#525252',
    light: '#737373',
    dark: '#404040',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#64748b',
    light: '#94a3b8',
    dark: '#475569',
  },
  success: {
    main: '#059669',
    light: '#10b981',
  },
  error: {
    main: '#dc2626',
    light: '#ef4444',
  },
  background: {
    default: '#fafafa',
    paper: '#ffffff',
    elevated: '#f4f4f5',
  },
  text: {
    primary: '#09090b',
    secondary: '#71717a',
    disabled: '#a1a1aa',
  },
  divider: alpha('#000000', 0.08),
};

export const createAppTheme = (isDarkMode) => {
  const palette = isDarkMode ? darkPalette : lightPalette;

  return createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      ...palette,
    },
    breakpoints: {
      values: {
        xs: 0,
        sm: 600,
        md: 960,
        lg: 1200,
        xl: 1536,
      },
    },
    typography: {
      fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      h1: {
        fontSize: '2rem',
        fontWeight: 700,
        letterSpacing: '-0.03em',
        lineHeight: 1.2,
      },
      h2: {
        fontSize: '1.5rem',
        fontWeight: 700,
        letterSpacing: '-0.02em',
      },
      h3: {
        fontSize: '1.25rem',
        fontWeight: 600,
        letterSpacing: '-0.01em',
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
        lineHeight: 1.6,
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.5,
      },
      button: {
        fontWeight: 600,
        textTransform: 'none',
        letterSpacing: '-0.01em',
      },
    },
    shape: {
      borderRadius: 10,
    },
    shadows: [
      'none',
      ...Array(24).fill('none'),
    ],
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: palette.background.default,
          },
        },
      },
      MuiButtonBase: {
        styleOverrides: {
          root: {
            '@media (hover: none)': {
              '&:hover': {
                backgroundColor: 'transparent',
              },
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            padding: '10px 20px',
            fontSize: '0.9375rem',
            textTransform: 'none',
            fontWeight: 500,
          },
          contained: {
            boxShadow: 'none',
            fontWeight: 600,
            transition: 'box-shadow 0.2s ease, filter 0.2s ease',
            '@media (hover: hover)': {
              '&:hover': {
                boxShadow: isDarkMode
                  ? '0 0 0 1px rgba(250, 250, 250, 0.25), 0 4px 12px rgba(250, 250, 250, 0.1)'
                  : '0 4px 12px rgba(0, 0, 0, 0.15)',
                filter: 'brightness(1.05)',
              },
            },
          },
          outlined: {
            borderColor: isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
            '@media (hover: hover)': {
              '&:hover': {
                borderColor: palette.primary.main,
                backgroundColor: alpha(palette.primary.main, 0.08),
              },
            },
          },
          text: {
            '@media (hover: hover)': {
              '&:hover': {
                backgroundColor: alpha(palette.primary.main, 0.08),
              },
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            backgroundColor: palette.background.paper,
            border: `1px solid ${palette.divider}`,
            boxShadow: 'none',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            '@media (hover: hover)': {
              '&:hover': {
                borderColor: alpha(palette.primary.main, 0.3),
                boxShadow: isDarkMode
                  ? '0 4px 20px rgba(0,0,0,0.2)'
                  : '0 4px 20px rgba(0,0,0,0.06)',
              },
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            backgroundImage: 'none',
            border: `1px solid ${palette.divider}`,
            backgroundColor: palette.background.paper,
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
              borderRadius: 8,
              backgroundColor: isDarkMode ? alpha('#ffffff', 0.03) : alpha('#000000', 0.02),
              '@media (hover: hover)': {
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: alpha(palette.primary.main, 0.5),
                },
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: palette.primary.main,
                borderWidth: 2,
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: palette.divider,
              },
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isDarkMode ? alpha('#18181b', 0.8) : alpha('#ffffff', 0.8),
            backdropFilter: 'blur(12px)',
            borderBottom: `1px solid ${palette.divider}`,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 16,
            backgroundColor: palette.background.paper,
            border: `1px solid ${palette.divider}`,
            boxShadow: isDarkMode 
              ? '0 24px 48px rgba(0,0,0,0.4)' 
              : '0 24px 48px rgba(0,0,0,0.12)',
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          indicator: {
            backgroundColor: palette.primary.main,
            height: 3,
            borderRadius: '3px 3px 0 0',
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            transition: 'background-color 0.2s ease',
            '&.Mui-selected': {
              backgroundColor: alpha(palette.primary.main, 0.12),
              '@media (hover: hover)': {
                '&:hover': {
                  backgroundColor: alpha(palette.primary.main, 0.18),
                },
              },
            },
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
    },
  });
};
