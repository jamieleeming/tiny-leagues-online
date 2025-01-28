import React from 'react';
import { 
    AppBar, 
    Toolbar, 
    Typography, 
    Box, 
    Container,
    useTheme,
    useMediaQuery,
    SvgIcon,
    IconButton
} from '@mui/material';
import {
    Brightness4 as MoonIcon,
    Brightness7 as SunIcon
} from '@mui/icons-material';

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

    return (
        <AppBar 
            position="static" 
            elevation={1}
            sx={{
                backgroundColor: theme.palette.background.paper,
                color: theme.palette.text.primary,
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                py: 2
            }}
        >
            <Container maxWidth="lg">
                <Toolbar 
                    disableGutters 
                    sx={{ 
                        height: 70,
                        maxWidth: 1200,
                        mx: 'auto'
                    }}
                >
                    <Box 
                        display="flex" 
                        alignItems="center" 
                        width="100%"
                        justifyContent="space-between"
                    >
                        <Box 
                            display="flex" 
                            alignItems="center" 
                            gap={3}
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
                        <IconButton 
                            onClick={onToggleDarkMode}
                            color="inherit"
                            size="large"
                        >
                            {isDarkMode ? <SunIcon /> : <MoonIcon />}
                        </IconButton>
                    </Box>
                </Toolbar>
            </Container>
        </AppBar>
    );
}; 