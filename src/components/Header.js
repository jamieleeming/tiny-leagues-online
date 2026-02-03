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
    Brightness4 as MoonIcon,
    Brightness7 as SunIcon
} from '@mui/icons-material';
import { DonateButton } from './DonateButton';
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
            {/* Outer ring */}
            <circle 
                cx="50" 
                cy="50" 
                r="46" 
                fill={theme.palette.background.paper}
                stroke={theme.palette.text.primary}
                strokeWidth="4"
            />
            
            {/* Inner decorative ring */}
            <circle 
                cx="50" 
                cy="50" 
                r="38" 
                fill="none"
                stroke={theme.palette.text.primary}
                strokeWidth="2"
                strokeDasharray="8 4"
            />
            
            <text
                x="50"
                y="60"
                textAnchor="middle"
                style={{
                    font: 'bold 32px Arial',
                    fill: theme.palette.text.primary
                }}
            >
                TL
            </text>
        </SvgIcon>
    );
};

export const Header = ({ isDarkMode, onToggleDarkMode }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const location = useLocation();
    
    // Check if user has league access to show Games button
    // Use state and effect to make it reactive to changes
    const [hasLeague, setHasLeague] = useState(false);
    
    useEffect(() => {
        const checkLeagueAccess = () => {
            const storedLeague = typeof window !== 'undefined' ? localStorage.getItem('lastLeague') : null;
            setHasLeague(storedLeague && hasLeagueAccess(storedLeague));
        };
        
        // Check on mount and when location changes
        checkLeagueAccess();
        
        // Listen for storage changes (when league is validated in another component)
        const handleStorageChange = (e) => {
            if (e.key === 'lastLeague' || e.key === null) {
                checkLeagueAccess();
            }
        };
        
        window.addEventListener('storage', handleStorageChange);
        
        // Also check periodically in case localStorage is updated in same window
        // (storage event only fires for changes in other windows/tabs)
        const interval = setInterval(checkLeagueAccess, 1000);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(interval);
        };
    }, [location]);

    return (
        <AppBar 
            position="static" 
            elevation={1}
            sx={{
                backgroundColor: theme.palette.background.paper,
                color: theme.palette.text.primary,
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                py: { xs: 1, sm: 2 },
                pt: { xs: 2, sm: 2 }
            }}
        >
            <Container maxWidth="lg">
                <Toolbar 
                    disableGutters 
                    sx={{ 
                        minHeight: { xs: 'auto', sm: 70 },
                        height: { xs: 'auto', sm: 70 },
                        maxWidth: 1200,
                        mx: 'auto',
                        py: { xs: 0, sm: 0 }
                    }}
                >
                    <Box 
                        display="flex" 
                        flexDirection={{ xs: 'column', sm: 'row' }}
                        alignItems={{ xs: 'center', sm: 'center' }}
                        width="100%"
                        justifyContent="space-between"
                        gap={{ xs: 0, sm: 0 }}
                    >
                        <Box 
                            display="flex" 
                            alignItems="center" 
                            gap={3}
                            justifyContent={{ xs: 'center', sm: 'flex-start' }}
                            width={{ xs: '100%', sm: 'auto' }}
                        >
                            <Box 
                                sx={{ 
                                    width: isMobile ? 43 : 54,
                                    height: isMobile ? 43 : 54,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <TLLogo />
                            </Box>
                            <Typography 
                                variant={isMobile ? "h6" : "h5"} 
                                component="h1"
                                sx={{ 
                                    fontWeight: 600,
                                    color: 'text.primary',
                                    lineHeight: 1.2,
                                    ml: 1,
                                    m: 0,
                                    fontSize: isMobile ? '1.25rem' : '1.5rem'
                                }}
                            >
                                Tiny Leagues Online
                            </Typography>
                        </Box>
                        <Box 
                            display="flex" 
                            alignItems="center" 
                            gap={2}
                            width={{ xs: '100%', sm: 'auto' }}
                            justifyContent={{ xs: 'center', sm: 'flex-end' }}
                        >
                            {hasLeague && (
                                <Button
                                    component={Link}
                                    to="/"
                                    sx={{
                                        color: location.pathname === '/' 
                                            ? theme.palette.primary.main 
                                            : 'text.primary',
                                        textTransform: 'none',
                                        fontWeight: location.pathname === '/' ? 600 : 400,
                                        '&:hover': {
                                            backgroundColor: 'transparent',
                                            color: theme.palette.primary.main
                                        }
                                    }}
                                >
                                    Ledgers
                                </Button>
                            )}
                            {hasLeague && (
                                <Button
                                    component={Link}
                                    to="/active-games"
                                    sx={{
                                        color: location.pathname === '/active-games' 
                                            ? theme.palette.primary.main 
                                            : 'text.primary',
                                        textTransform: 'none',
                                        fontWeight: location.pathname === '/active-games' ? 600 : 400,
                                        '&:hover': {
                                            backgroundColor: 'transparent',
                                            color: theme.palette.primary.main
                                        }
                                    }}
                                >
                                    Games
                                </Button>
                            )}
                            {hasLeague && (
                                <Button
                                    component={Link}
                                    to="/rules"
                                    sx={{
                                        color: location.pathname === '/rules' 
                                            ? theme.palette.primary.main 
                                            : 'text.primary',
                                        textTransform: 'none',
                                        fontWeight: location.pathname === '/rules' ? 600 : 400,
                                        '&:hover': {
                                            backgroundColor: 'transparent',
                                            color: theme.palette.primary.main
                                        }
                                    }}
                                >
                                    Rules
                                </Button>
                            )}
                            <DonateButton />
                            <IconButton 
                                onClick={onToggleDarkMode}
                                color="inherit"
                                size="large"
                            >
                                {isDarkMode ? <SunIcon /> : <MoonIcon />}
                            </IconButton>
                        </Box>
                    </Box>
                </Toolbar>
            </Container>
        </AppBar>
    );
}; 