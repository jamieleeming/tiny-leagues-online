import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    Box,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Typography,
    useTheme,
    useMediaQuery,
    SvgIcon,
    BottomNavigation,
    BottomNavigationAction,
    Paper,
} from '@mui/material';
import {
    MenuBook as LedgersIcon,
    Info as RulesIcon,
    Settings as SettingsIcon,
} from '@mui/icons-material';
import { SpadeSuitIcon } from './icons/SpadeSuitIcon';
import { SettingsModal } from './SettingsModal';
import { hasLeagueAccess } from '../utils/leagueAuth';

const SIDEBAR_WIDTH = 240;

const TLLogo = ({ size = 36 }) => {
    const theme = useTheme();
    const accent = theme.palette.primary.main;

    return (
        <SvgIcon viewBox="0 0 100 100" sx={{ width: size, height: size }}>
            <defs>
                <linearGradient id="tl-glow" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={accent} stopOpacity={0.6} />
                    <stop offset="100%" stopColor={accent} stopOpacity={1} />
                </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="44" fill="none" stroke="url(#tl-glow)" strokeWidth="2" />
            <circle cx="50" cy="50" r="36" fill="none" stroke={accent} strokeWidth="1.5" strokeOpacity={0.4} strokeDasharray="4 4" />
            <text x="50" y="58" textAnchor="middle" style={{ font: 'bold 26px "Plus Jakarta Sans", sans-serif', fill: accent }}>
                TL
            </text>
        </SvgIcon>
    );
};

const navItems = [
    { path: '/', label: 'Ledgers', icon: <LedgersIcon /> },
    { path: '/games', label: 'Games', icon: <SpadeSuitIcon /> },
    { path: '/rules', label: 'Rules', icon: <RulesIcon /> },
];

export const AppShell = ({ children, isDarkMode, onToggleDarkMode }) => {
    const theme = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

    const [hasLeague, setHasLeague] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);

    useEffect(() => {
        const checkLeagueAccess = () => {
            const storedLeague = typeof window !== 'undefined' ? localStorage.getItem('lastLeague') : null;
            setHasLeague(storedLeague && hasLeagueAccess(storedLeague));
        };
        checkLeagueAccess();
        const handleStorageChange = (e) => {
            if (e.key === 'lastLeague' || e.key === null) checkLeagueAccess();
        };
        window.addEventListener('storage', handleStorageChange);
        const interval = setInterval(checkLeagueAccess, 1000);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(interval);
        };
    }, [location]);

    const sidebarContent = (
        <Box
            sx={{
                width: SIDEBAR_WIDTH,
                minWidth: SIDEBAR_WIDTH,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRight: `1px solid ${theme.palette.divider}`,
                bgcolor: 'background.paper',
                overflow: 'hidden',
            }}
        >
            <Box sx={{ p: 2.5, borderBottom: `1px solid ${theme.palette.divider}`, minWidth: 0, overflow: 'hidden' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                    <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                        <TLLogo size={44} />
                    </Box>
                    <Typography variant="subtitle1" fontWeight={700} letterSpacing="-0.02em" noWrap sx={{ minWidth: 0 }}>
                        Tiny Leagues
                    </Typography>
                </Box>
            </Box>
            <List sx={{ flex: 1, pt: 2, px: 1 }}>
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                            <ListItemButton
                                component={Link}
                                to={item.path}
                                selected={isActive}
                                sx={{
                                    borderRadius: 2,
                                    '&.Mui-selected': {
                                        bgcolor: (t) => t.palette.mode === 'dark'
                                            ? 'rgba(250, 250, 250, 0.08)'
                                            : 'rgba(82, 82, 82, 0.12)',
                                        '&:hover': {
                                            bgcolor: (t) => t.palette.mode === 'dark'
                                                ? 'rgba(250, 250, 250, 0.12)'
                                                : 'rgba(82, 82, 82, 0.16)',
                                        },
                                    },
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 40, color: isActive ? 'primary.main' : 'text.secondary' }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: isActive ? 600 : 500, fontSize: '0.9375rem' }} />
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>
            <Box sx={{ p: 1, borderTop: `1px solid ${theme.palette.divider}` }}>
                <ListItem disablePadding>
                    <ListItemButton
                        onClick={() => setSettingsOpen(true)}
                        sx={{ borderRadius: 2 }}
                    >
                        <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>
                            <SettingsIcon />
                        </ListItemIcon>
                        <ListItemText primary="Settings" primaryTypographyProps={{ fontWeight: 500, fontSize: '0.9375rem' }} />
                    </ListItemButton>
                </ListItem>
            </Box>
        </Box>
    );

    const bottomNavValue = navItems.findIndex((item) => item.path === location.pathname);

    const handleBottomNavChange = (_, newValue) => {
        if (newValue < navItems.length) {
            navigate(navItems[newValue].path);
        } else {
            setSettingsOpen(true);
        }
    };

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
            {!hasLeague && (
                <Box
                    sx={{
                        py: 2,
                        px: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1.5,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        bgcolor: 'background.paper',
                    }}
                >
                    <TLLogo size={32} />
                    <Typography variant="subtitle1" fontWeight={700} letterSpacing="-0.02em">
                        Tiny Leagues Online
                    </Typography>
                </Box>
            )}

            {hasLeague && isDesktop && (
                <Drawer
                    variant="permanent"
                    sx={{
                        '& .MuiDrawer-paper': {
                            width: SIDEBAR_WIDTH,
                            minWidth: SIDEBAR_WIDTH,
                            maxWidth: SIDEBAR_WIDTH,
                            boxSizing: 'border-box',
                            top: 0,
                            left: 0,
                            borderRight: 'none',
                            zIndex: theme.zIndex.appBar - 1,
                            overflowX: 'hidden',
                            overflowY: 'auto',
                        },
                    }}
                >
                    {sidebarContent}
                </Drawer>
            )}

            <Box
                component="main"
                sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    width: hasLeague && isDesktop ? `calc(100% - ${SIDEBAR_WIDTH}px)` : '100%',
                    minWidth: hasLeague && isDesktop ? 0 : undefined,
                    ml: hasLeague && isDesktop ? `${SIDEBAR_WIDTH}px` : 0,
                    pb: hasLeague && !isDesktop ? 'calc(56px + env(safe-area-inset-bottom, 0px))' : 0,
                }}
            >
                {children}
            </Box>

            {hasLeague && !isDesktop && (
                <Paper
                    elevation={8}
                    sx={{
                        position: 'fixed',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        width: '100%',
                        maxWidth: '100vw',
                        boxSizing: 'border-box',
                        zIndex: theme.zIndex.appBar,
                        borderTop: `1px solid ${theme.palette.divider}`,
                        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                    }}
                >
                    <BottomNavigation
                        value={bottomNavValue >= 0 ? bottomNavValue : 0}
                        onChange={handleBottomNavChange}
                        showLabels
                        sx={{
                            bgcolor: 'background.paper',
                            '& .MuiBottomNavigationAction-root': {
                                minWidth: 0,
                                py: 1.5,
                            },
                            '& .Mui-selected': {
                                color: 'primary.main',
                                '& .MuiSvgIcon-root': { fontSize: 24 },
                                '& .MuiBottomNavigationAction-label': { fontSize: '0.75rem' },
                            },
                            '& .MuiBottomNavigationAction-root .MuiSvgIcon-root': { fontSize: 24 },
                            '& .MuiBottomNavigationAction-root .MuiBottomNavigationAction-label': { fontSize: '0.75rem' },
                        }}
                    >
                        {navItems.map((item) => (
                            <BottomNavigationAction
                                key={item.path}
                                label={item.label}
                                icon={item.icon}
                            />
                        ))}
                        <BottomNavigationAction
                            label="Settings"
                            icon={<SettingsIcon />}
                            onClick={() => setSettingsOpen(true)}
                        />
                    </BottomNavigation>
                </Paper>
            )}

            {hasLeague && (
                <SettingsModal
                    isDarkMode={isDarkMode}
                    onToggleDarkMode={onToggleDarkMode}
                    open={settingsOpen}
                    onClose={() => setSettingsOpen(false)}
                    onReopen={() => setSettingsOpen(true)}
                />
            )}
        </Box>
    );
};
