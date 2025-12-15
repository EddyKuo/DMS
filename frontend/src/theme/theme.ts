import { createTheme, type Theme } from '@mui/material/styles';

const getDesignTokens = (mode: 'light' | 'dark') => ({
    palette: {
        mode,
        ...(mode === 'dark'
            ? {
                // Dark mode colors
                primary: {
                    main: '#00bcd4', // Tech Blue
                },
                secondary: {
                    main: '#00e676', // Neon Green
                },
                background: {
                    default: '#121212',
                    paper: '#1e1e1e',
                },
            }
            : {
                // Light mode colors
                primary: {
                    main: '#0097a7', // Darker cyan for light mode
                },
                secondary: {
                    main: '#00c853', // Green
                },
                background: {
                    default: '#f5f5f5',
                    paper: '#ffffff',
                },
            }),
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: { fontFamily: '"Orbitron", "Inter", sans-serif' },
        h2: { fontFamily: '"Orbitron", "Inter", sans-serif' },
        h3: { fontFamily: '"Orbitron", "Inter", sans-serif' },
        h4: { fontFamily: '"Orbitron", "Inter", sans-serif' },
        h5: { fontFamily: '"Orbitron", "Inter", sans-serif' },
        h6: { fontFamily: '"Orbitron", "Inter", sans-serif' },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none' as const,
                    borderRadius: 8,
                },
                containedPrimary: {
                    boxShadow: mode === 'dark'
                        ? '0 0 10px rgba(0, 188, 212, 0.5)'
                        : '0 2px 8px rgba(0, 151, 167, 0.3)',
                    '&:hover': {
                        boxShadow: mode === 'dark'
                            ? '0 0 20px rgba(0, 188, 212, 0.7)'
                            : '0 4px 12px rgba(0, 151, 167, 0.4)',
                    }
                }
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                }
            }
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backdropFilter: 'blur(10px)',
                    backgroundColor: mode === 'dark'
                        ? 'rgba(30, 30, 30, 0.7)'
                        : 'rgba(255, 255, 255, 0.8)',
                    borderBottom: mode === 'dark'
                        ? '1px solid rgba(255, 255, 255, 0.1)'
                        : '1px solid rgba(0, 0, 0, 0.1)',
                }
            }
        }
    },
});

export const createAppTheme = (mode: 'light' | 'dark'): Theme => {
    return createTheme(getDesignTokens(mode));
};

// Default dark theme for backwards compatibility
export const theme = createAppTheme('dark');
