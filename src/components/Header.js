import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
    AppBar, 
    Toolbar, 
    Typography, 
    Box, 
    Container,
    useTheme,
    useMediaQuery,
    SvgIcon,
    IconButton,
    Button
} from '@mui/material';
import {
    Settings as SettingsIcon
} from '@mui/icons-material';
import { SettingsModal } from './SettingsModal';
import { hasLeagueAccess } from '../utils/leagueAuth';

const TLLogo = () => {
    const theme = useTheme();
    
    return (
        <SvgIcon 
            viewBox="0 0 100 100"
            sx={{ 
                width: '100%',
                height: '100%'
            }}
        >
            <defs>
                <linearGradient id="tl-ring" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={theme.palette.primary.main} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={theme.palette.primary.main} stopOpacity={0.8} />
                </linearGradient>
            </defs>
            {/* Outer ring */}
            <circle 
                cx="50" 
                cy="50" 
                r="46" 
                fill={theme.palette.background.paper}
                stroke={theme.palette.mode === 'dark' ? 'rgba(148, 163, 184, 0.25)' : 'rgba(15, 23, 42, 0.08)'}
                strokeWidth="2"
            />
            {/* Inner decorative ring */}
            <circle 
                cx="50" 
                cy="50" 
                r="38" 
                fill="none"
                stroke="url(#tl-ring)"
                strokeWidth="2"
                strokeDasharray="6 6"
            />
            <text
                x="50"
                y="60"
                textAnchor="middle"
                style={{
                    font: 'bold 28px Inter, system-ui, sans-serif',
                    fill: theme.palette.text.primary
                }}
            >
                TL
            </text>
        </SvgIcon>
    );
};

const NavLink = ({ to, children, isActive, theme }) => (
    <Button
        component={Link}
        to={to}
        sx={{
            color: isActive ? theme.palette.primary.main : 'text.secondary',
            textTransform: 'none',
            fontWeight: isActive ? 600 : 500,
            fontSize: '0.9375rem',
            px: 2,
            py: 1,
            borderRadius: 2,
            minHeight: 40,
            '&:hover': {
                backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(124, 156, 255, 0.08)' 
                    : 'rgba(37, 99, 235, 0.06)',
                color: theme.palette.primary.main
            }
        }}
    >
        {children}
    </Button>
);

export const Header = ({ isDarkMode, onToggleDarkMode }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const location = useLocation();
    
    const [hasLeague, setHasLeague] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    
    useEffect(() => {
        const checkLeagueAccess = () => {
            const storedLeague = typeof window !== 'undefined' ? localStorage.getItem('lastLeague') : null;
            setHasLeague(storedLeague && hasLeagueAccess(storedLeague));
        };
        
        checkLeagueAccess();
        
        const handleStorageChange = (e) => {
            if (e.key === 'lastLeague' || e.key === null) {
                checkLeagueAccess();
            }
        };
        
        window.addEventListener('storage', handleStorageChange);
        const interval = setInterval(checkLeagueAccess, 1000);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(interval);
        };
    }, [location]);

    return (
        <AppBar 
            position="static" 
            elevation={0}
            sx={{
                backgroundColor: theme.palette.background.paper,
                color: theme.palette.text.primary,
                borderBottom: `1px solid ${theme.palette.divider}`,
                py: { xs: 1, sm: 0 }
            }}
        >
            <Container maxWidth="lg">
                <Toolbar 
                    disableGutters 
                    sx={{ 
                        minHeight: { xs: 56, sm: 72 },
                        maxWidth: 1200,
                        mx: 'auto',
                        justifyContent: 'space-between'
                    }}
                >
                    <Box 
                        display="flex" 
                        alignItems="center" 
                        gap={2}
                    >
                        <Box 
                            sx={{ 
                                width: isMobile ? 40 : 48,
                                height: isMobile ? 40 : 48,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <TLLogo />
                        </Box>
                        <Typography 
                            variant="h6" 
                            component="h1"
                            sx={{ 
                                fontWeight: 600,
                                color: 'text.primary',
                                letterSpacing: '-0.02em',
                                fontSize: { xs: '1.125rem', sm: '1.25rem' }
                            }}
                        >
                            Tiny Leagues Online
                        </Typography>
                    </Box>
                    <Box 
                        display="flex" 
                        alignItems="center" 
                        gap={0.5}
                    >
                        {hasLeague && (
                            <>
                                <NavLink to="/" isActive={location.pathname === '/'} theme={theme}>
                                    Ledgers
                                </NavLink>
                                <NavLink to="/active-games" isActive={location.pathname === '/active-games'} theme={theme}>
                                    Games
                                </NavLink>
                                <NavLink to="/rules" isActive={location.pathname === '/rules'} theme={theme}>
                                    Rules
                                </NavLink>
                                <IconButton 
                                    onClick={() => setSettingsOpen(true)}
                                    color="inherit"
                                    size="medium"
                                    sx={{
                                        ml: 0.5,
                                        color: 'text.secondary',
                                        '&:hover': {
                                            backgroundColor: theme.palette.mode === 'dark' 
                                                ? 'rgba(148, 163, 184, 0.08)' 
                                                : 'rgba(15, 23, 42, 0.04)',
                                            color: 'text.primary'
                                        }
                                    }}
                                >
                                    <SettingsIcon sx={{ fontSize: 22 }} />
                                </IconButton>
                            </>
                        )}
                    </Box>
                </Toolbar>
            </Container>
            {hasLeague && (
                <SettingsModal
                    isDarkMode={isDarkMode}
                    onToggleDarkMode={onToggleDarkMode}
                    open={settingsOpen}
                    onClose={() => setSettingsOpen(false)}
                    onReopen={() => setSettingsOpen(true)}
                />
            )}
        </AppBar>
    );
}; 