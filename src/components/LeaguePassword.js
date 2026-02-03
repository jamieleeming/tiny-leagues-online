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
import '../styles/LeaguePassword.css';

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
                elevation={2}
                sx={{
                    position: 'relative',
                    overflow: 'visible'
                }}
            >
                <CardContent sx={{ p: 3 }}>
                    <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1, 
                        mb: 2 
                    }}>
                        <LockIcon color="action" />
                        <Typography variant="h6" component="h2">
                            League Password
                        </Typography>
                    </Box>

                    <form onSubmit={handleSubmit}>
                        <Box sx={{ 
                            display: 'flex', 
                            flexDirection: { xs: 'column', sm: 'row' },
                            gap: 2,
                            alignItems: { xs: 'stretch', sm: 'flex-start' }
                        }}>
                            <TextField
                                value={selectedLeague || ''} 
                                onChange={(e) => {
                                    const input = e.target.value.toUpperCase();
                                    setSelectedLeague(input);
                                    setLeagueError(null);
                                }}
                                placeholder="Enter league password"
                                inputProps={{ maxLength: 12 }}
                                disabled={isLeagueValidated}
                                size="medium"
                                fullWidth
                                variant="outlined"
                                sx={{
                                    maxWidth: { sm: '300px' },
                                    '& .MuiOutlinedInput-root': {
                                        backgroundColor: 'background.paper',
                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                            borderColor: 'primary.main'
                                        }
                                    },
                                    '& .MuiOutlinedInput-input': {
                                        color: 'text.primary'
                                    },
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'divider'
                                    }
                                }}
                            />
                            
                            {!isLeagueValidated && (
                                <Button 
                                    type="submit"  // Changed to submit type
                                    disabled={!selectedLeague || isSubmitting}
                                    variant="contained"
                                    size="large"
                                    sx={{
                                        minWidth: '120px',
                                        height: '56px'
                                    }}
                                >
                                    {isSubmitting ? (
                                        <CircularProgress size={24} color="inherit" />
                                    ) : (
                                        'Submit'
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
                                    variant="filled"
                                    sx={{ 
                                        alignItems: 'center',
                                        '& .MuiAlert-message': {
                                            padding: '8px 0'
                                        }
                                    }}
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
                                variant="filled"
                                sx={{ mt: 2 }}
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