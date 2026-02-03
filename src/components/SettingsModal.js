import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Box,
    Typography,
    Switch,
    FormControlLabel,
    Button,
    Divider
} from '@mui/material';
import {
    Close as CloseIcon,
    Settings as SettingsIcon
} from '@mui/icons-material';
import { DonateButton } from './DonateButton';
import { removeLeagueAccess } from '../utils/leagueAuth';

export const SettingsModal = ({ isDarkMode, onToggleDarkMode, open, onClose, onReopen }) => {
    const navigate = useNavigate();
    const [showDonateDialog, setShowDonateDialog] = useState(false);

    const handleSwitchLeague = () => {
        // Get the current league from localStorage
        const storedLeague = localStorage.getItem('lastLeague');
        
        if (storedLeague) {
            // Remove league access token
            removeLeagueAccess(storedLeague);
        }
        
        // Clear the last league from localStorage
        localStorage.removeItem('lastLeague');
        
        // Close the settings modal
        onClose();
        
        // Navigate to home page (which will show the league entry field)
        navigate('/');
        
        // Force a page reload to reset all state
        window.location.reload();
    };

    const handleSupportClick = () => {
        onClose(); // Close settings modal first
        setShowDonateDialog(true);
    };

    const handleDonateClose = () => {
        setShowDonateDialog(false);
        // Reopen the settings modal when donation modal closes
        // Use setTimeout to ensure smooth transition between modals
        if (onReopen) {
            setTimeout(() => {
                onReopen();
            }, 100);
        }
    };

    return (
        <>
            <Dialog
                open={open}
                onClose={onClose}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 2
                    }
                }}
            >
                <DialogTitle sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    pb: 2
                }}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <SettingsIcon color="primary" />
                        <Typography variant="h6">
                            Settings
                        </Typography>
                    </Box>
                    <IconButton
                        edge="end"
                        onClick={onClose}
                        size="small"
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {/* Dark Mode Toggle */}
                        <Box>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={isDarkMode}
                                        onChange={onToggleDarkMode}
                                        color="primary"
                                    />
                                }
                                label={
                                    <Typography variant="body1">
                                        Dark Mode
                                    </Typography>
                                }
                            />
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, ml: 4.5 }}>
                                Toggle between light and dark theme
                            </Typography>
                        </Box>

                        <Divider />

                        {/* Switch League */}
                        <Box>
                            <Typography variant="body1" gutterBottom>
                                League
                            </Typography>
                            <Button
                                variant="outlined"
                                onClick={handleSwitchLeague}
                                fullWidth
                                sx={{ mt: 1 }}
                            >
                                Switch League
                            </Button>
                        </Box>

                        <Divider />

                        {/* Support */}
                        <Box>
                            <Typography variant="body1" gutterBottom>
                                Support
                            </Typography>
                            <Button
                                variant="outlined"
                                onClick={handleSupportClick}
                                fullWidth
                                sx={{ mt: 1 }}
                            >
                                Support Tiny Leagues
                            </Button>
                        </Box>
                    </Box>
                </DialogContent>
            </Dialog>

            {/* Render DonateButton with controlled state */}
            <DonateButton 
                controlledOpen={showDonateDialog}
                onControlledClose={handleDonateClose}
                hideButton={true}
            />
        </>
    );
};
