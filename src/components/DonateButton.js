import React, { useState, useEffect } from 'react';
import {
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Box,
    TextField,
    Grid,
    IconButton,
    useMediaQuery,
    useTheme
} from '@mui/material';
import {
    Close as CloseIcon
} from '@mui/icons-material';

export const DonateButton = ({ controlledOpen, onControlledClose, hideButton = false }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [internalOpen, setInternalOpen] = useState(false);
    const [customAmount, setCustomAmount] = useState('');
    const [selectedAmount, setSelectedAmount] = useState(null);
    const [error, setError] = useState('');
    
    // Use controlled state if provided, otherwise use internal state
    const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const setOpen = controlledOpen !== undefined ? (onControlledClose || (() => {})) : setInternalOpen;

    // Preset donation amounts
    const presetAmounts = [5, 10, 20, 50];

    // Venmo username - should be stored in environment variable or config
    const DONATION_VENMO_ID = process.env.REACT_APP_DONATION_VENMO_ID || 'YOUR_VENMO_ID';

    const handleOpen = () => {
        if (controlledOpen === undefined) {
            setInternalOpen(true);
        }
        setCustomAmount('');
        setSelectedAmount(null);
        setError('');
    };

    const handleClose = () => {
        if (controlledOpen === undefined) {
            setInternalOpen(false);
        } else if (onControlledClose) {
            onControlledClose();
        }
        setCustomAmount('');
        setSelectedAmount(null);
        setError('');
    };
    
    // If controlled, reset form when controlledOpen becomes true
    useEffect(() => {
        if (controlledOpen === true) {
            setCustomAmount('');
            setSelectedAmount(null);
            setError('');
        }
    }, [controlledOpen]);

    const validateAmount = (amount) => {
        const num = parseFloat(amount);
        if (isNaN(num) || num <= 0) {
            return 'Please enter a valid amount greater than 0';
        }
        if (num < 1) {
            return 'Minimum donation is $1.00';
        }
        if (num > 1000) {
            return 'Maximum donation is $1,000.00';
        }
        return '';
    };

    const handlePresetClick = (amount) => {
        setSelectedAmount(amount);
        setCustomAmount('');
        setError('');
    };

    const handleCustomAmountChange = (e) => {
        const value = e.target.value;
        setCustomAmount(value);
        setSelectedAmount(null);
        
        if (value) {
            const validationError = validateAmount(value);
            setError(validationError);
        } else {
            setError('');
        }
    };

    const handleDonate = () => {
        const amount = selectedAmount || customAmount;
        
        if (!amount) {
            setError('Please select or enter an amount');
            return;
        }

        const validationError = validateAmount(amount);
        if (validationError) {
            setError(validationError);
            return;
        }

        const cleanAmount = parseFloat(amount).toFixed(2);
        const noteText = 'TLOnline-Donation';
        
        // Open Venmo with pre-filled donation
        const venmoUrl = `https://venmo.com/${DONATION_VENMO_ID}?txn=pay&note=${encodeURIComponent(noteText)}&amount=${cleanAmount}`;
        window.open(venmoUrl, '_blank');
        
        // Close dialog after opening Venmo
        handleClose();
    };

    return (
        <>
            {!hideButton && (
                <Button
                    onClick={handleOpen}
                    variant="text"
                    sx={{ color: 'text.primary' }}
                >
                    Support
                </Button>
            )}

            <Dialog 
                open={open} 
                onClose={handleClose}
                maxWidth="sm"
                fullWidth
                fullScreen={isMobile}
            >
                <DialogTitle sx={{ 
                    pb: isMobile ? 1 : 2,
                    pt: isMobile ? 2 : 3
                }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant={isMobile ? "subtitle1" : "h6"}>
                            {isMobile ? 'Support Tiny Leagues' : 'Support Tiny Leagues Online'}
                        </Typography>
                        <IconButton
                            edge="end"
                            onClick={handleClose}
                            size="small"
                        >
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>
                
                <DialogContent sx={{ 
                    px: isMobile ? 2 : 3,
                    pb: isMobile ? 1 : 2
                }}>
                    <Typography variant="body2" color="text.secondary" sx={{ 
                        mb: isMobile ? 2 : 3,
                        fontSize: isMobile ? '0.875rem' : 'inherit'
                    }}>
                        Your support helps keep Tiny Leagues Online running smoothly. All donations go directly to 
                        maintaining the platform and community infrastructure.
                    </Typography>

                    <Typography variant="subtitle2" gutterBottom sx={{ mb: isMobile ? 1.5 : 2, mt: isMobile ? 1 : 2 }}>
                        Select Amount
                    </Typography>

                    <Grid container spacing={isMobile ? 1.5 : 2} sx={{ mb: isMobile ? 2 : 3 }}>
                        {presetAmounts.map((amount) => (
                            <Grid item xs={3} key={amount}>
                                <Button
                                    fullWidth
                                    variant={selectedAmount === amount ? 'contained' : 'outlined'}
                                    onClick={() => handlePresetClick(amount)}
                                    sx={{
                                        minHeight: isMobile ? '44px' : '48px',
                                        fontWeight: selectedAmount === amount ? 600 : 400,
                                        fontSize: isMobile ? '1rem' : 'inherit'
                                    }}
                                >
                                    ${amount}
                                </Button>
                            </Grid>
                        ))}
                    </Grid>

                    <Typography variant="subtitle2" gutterBottom sx={{ mb: 1 }}>
                        Or Custom Amount
                    </Typography>

                    <TextField
                        fullWidth
                        type="number"
                        label="Amount"
                        value={customAmount}
                        onChange={handleCustomAmountChange}
                        error={!!error}
                        helperText={error || (isMobile ? '$1-$1,000' : 'Minimum $1.00, Maximum $1,000.00')}
                        InputProps={{
                            startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
                        }}
                        inputProps={{
                            min: 1,
                            max: 1000,
                            step: 0.01
                        }}
                        size={isMobile ? 'small' : 'medium'}
                        sx={{ mb: isMobile ? 2 : 2 }}
                    />

                    <Typography 
                        variant="caption" 
                        color="text.secondary" 
                        sx={{ 
                            mt: 2,
                            fontSize: '0.75rem',
                            lineHeight: 1.4
                        }}
                    >
                        Donations are voluntary and completely separate from game funds. Donations do not affect gameplay, settlements, or any game-related transactions. Donations are not tax-deductible. All donations are final and non-refundable.
                    </Typography>
                </DialogContent>

                <DialogActions sx={{ 
                    p: isMobile ? 2 : 2, 
                    pt: isMobile ? 1 : 1,
                    gap: isMobile ? 1 : 0
                }}>
                    <Button
                        onClick={handleDonate}
                        variant="contained"
                        color="primary"
                        disabled={!selectedAmount && !customAmount}
                        fullWidth={isMobile}
                    >
                        Support
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};
