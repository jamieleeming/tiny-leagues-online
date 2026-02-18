import React, { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    TextField,
    Button,
    Typography,
    Box,
    Alert,
    CircularProgress,
    Fade
} from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';

export const LeaguePassword = ({ 
    selectedLeague, 
    setSelectedLeague, 
    isLeagueValidated, 
    validateLeague, 
    leagueError, 
    setLeagueError,
    onValidationComplete  // New prop for handling the transition
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        if (isLeagueValidated) {
            // Start fade-out immediately
            setIsVisible(false);

            // When fade-out is complete (takes 300ms), trigger the callback
            const transitionTimer = setTimeout(() => {
                if (onValidationComplete) {
                    onValidationComplete();
                }
            }, 300);  // 300ms fade duration

            return () => {
                clearTimeout(transitionTimer);
            };
        }
    }, [isLeagueValidated, onValidationComplete]);

    const handleSubmit = async (e) => {
        // Prevent default form submission
        if (e) e.preventDefault();
        
        if (!selectedLeague || isSubmitting) return;
        
        setIsSubmitting(true);
        await validateLeague();
        setIsSubmitting(false);
    };

    return (
        <Fade in={isVisible} timeout={300}>
            <Card 
                elevation={0}
                sx={{
                    position: 'relative',
                    overflow: 'visible',
                    maxWidth: 400,
                    mx: 'auto',
                    background: (theme) => theme.palette.mode === 'dark' 
                        ? 'linear-gradient(135deg, rgba(24,24,27,0.95) 0%, rgba(39,39,42,0.9) 100%)'
                        : undefined,
                    boxShadow: (theme) => theme.palette.mode === 'dark'
                        ? '0 0 0 1px rgba(255,255,255,0.06), 0 24px 48px -12px rgba(0,0,0,0.5)'
                        : undefined,
                }}
            >
                <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                        <Box
                            sx={{
                                width: 48,
                                height: 48,
                                borderRadius: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: (theme) => theme.palette.mode === 'dark' 
                                    ? 'rgba(250, 250, 250, 0.12)' 
                                    : 'rgba(0, 0, 0, 0.08)',
                                border: (theme) => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(250, 250, 250, 0.15)' : 'rgba(0, 0, 0, 0.12)'}`,
                            }}
                        >
                            <LockIcon sx={{ color: 'primary.main', fontSize: 24 }} />
                        </Box>
                        <Typography variant="h6" component="h2" fontWeight={600}>
                            League Access
                        </Typography>
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Enter your league code to continue
                    </Typography>

                    <form onSubmit={handleSubmit}>
                        <Box sx={{ 
                            display: 'flex', 
                            flexDirection: { xs: 'column', sm: 'row' },
                            gap: 2,
                            alignItems: { xs: 'stretch', sm: 'flex-end' }
                        }}>
                            <TextField
                                value={selectedLeague || ''} 
                                onChange={(e) => {
                                    const input = e.target.value.toUpperCase();
                                    setSelectedLeague(input);
                                    setLeagueError(null);
                                }}
                                placeholder="e.g. ABC123XYZ"
                                inputProps={{ maxLength: 12 }}
                                disabled={isLeagueValidated}
                                fullWidth
                                sx={{ maxWidth: { sm: 220 } }}
                            />
                            
                            {!isLeagueValidated && (
                                <Button 
                                    type="submit"
                                    disabled={!selectedLeague || isSubmitting}
                                    variant="contained"
                                    size="large"
                                    sx={{
                                        minWidth: 120,
                                        height: 48,
                                        fontWeight: 600,
                                        bgcolor: 'primary.main',
                                        '&:hover': { bgcolor: 'primary.dark' },
                                    }}
                                >
                                    {isSubmitting ? (
                                        <CircularProgress size={24} color="inherit" />
                                    ) : (
                                        'Continue'
                                    )}
                                </Button>
                            )}
                        </Box>
                    </form>

                    <Fade in={!!leagueError}>
                        <Box sx={{ mt: 2 }}>
                            {leagueError && (
                                <Alert 
                                    severity="error"
                                    variant="outlined"
                                    sx={{ borderRadius: 2 }}
                                >
                                    {leagueError}
                                </Alert>
                            )}
                        </Box>
                    </Fade>

                    {isLeagueValidated && (
                        <Fade in>
                            <Alert 
                                severity="success"
                                variant="outlined"
                                sx={{ mt: 2, borderRadius: 2 }}
                            >
                                League password validated successfully!
                            </Alert>
                        </Fade>
                    )}
                </CardContent>
            </Card>
        </Fade>
    );
}; 