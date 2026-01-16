import React, { useState } from 'react';
import {
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Box,
    TextField,
    Alert,
    Divider,
    Grid,
    IconButton
} from '@mui/material';
import {
    LocalCafe as CoffeeIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import { VenmoIcon } from './icons/VenmoIcon';

export const DonateButton = () => {
    const [open, setOpen] = useState(false);
    const [customAmount, setCustomAmount] = useState('');
    const [selectedAmount, setSelectedAmount] = useState(null);
    const [error, setError] = useState('');

    // Preset donation amounts
    const presetAmounts = [5, 10, 20, 50];

    // Venmo username - should be stored in environment variable or config
    const DONATION_VENMO_ID = process.env.REACT_APP_DONATION_VENMO_ID || 'YOUR_VENMO_ID';

    const handleOpen = () => {
        setOpen(true);
        setCustomAmount('');
        setSelectedAmount(null);
        setError('');
    };

    const handleClose = () => {
        setOpen(false);
        setCustomAmount('');
        setSelectedAmount(null);
        setError('');
    };

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
            <Button
                onClick={handleOpen}
                sx={{
                    color: 'text.primary',
                    textTransform: 'none',
                    fontWeight: 400,
                    '&:hover': {
                        backgroundColor: 'transparent',
                        color: 'primary.main'
                    }
                }}
            >
                Support
            </Button>

            <Dialog 
                open={open} 
                onClose={handleClose}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box display="flex" alignItems="center" gap={1}>
                            <CoffeeIcon color="primary" />
                            <Typography variant="h6">Support Tiny Leagues Online</Typography>
                        </Box>
                        <IconButton
                            edge="end"
                            onClick={handleClose}
                            size="small"
                        >
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>
                
                <DialogContent>
                    <Alert severity="info" sx={{ mb: 3 }}>
                        <Typography variant="body2">
                            <strong>Voluntary Donation:</strong> This is completely optional and separate from all game funds. 
                            Donations help cover hosting, maintenance, and development costs.
                        </Typography>
                    </Alert>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Your support helps keep Tiny Leagues Online running smoothly. All donations go directly to 
                        maintaining the platform and community infrastructure.
                    </Typography>

                    <Divider sx={{ my: 3 }} />

                    <Typography variant="subtitle2" gutterBottom sx={{ mb: 2 }}>
                        Select Amount
                    </Typography>

                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        {presetAmounts.map((amount) => (
                            <Grid item xs={6} sm={3} key={amount}>
                                <Button
                                    fullWidth
                                    variant={selectedAmount === amount ? 'contained' : 'outlined'}
                                    onClick={() => handlePresetClick(amount)}
                                    sx={{
                                        minHeight: '48px',
                                        fontWeight: selectedAmount === amount ? 600 : 400
                                    }}
                                >
                                    ${amount}
                                </Button>
                            </Grid>
                        ))}
                    </Grid>

                    <Typography variant="subtitle2" gutterBottom sx={{ mb: 1, mt: 2 }}>
                        Or Enter Custom Amount
                    </Typography>

                    <TextField
                        fullWidth
                        type="number"
                        label="Amount"
                        value={customAmount}
                        onChange={handleCustomAmountChange}
                        error={!!error}
                        helperText={error || 'Minimum $1.00, Maximum $1,000.00'}
                        InputProps={{
                            startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
                        }}
                        inputProps={{
                            min: 1,
                            max: 1000,
                            step: 0.01
                        }}
                        sx={{ mb: 2 }}
                    />

                    <Divider sx={{ my: 3 }} />

                    <Alert severity="warning" sx={{ mb: 2 }}>
                        <Typography variant="body2" component="div">
                            <strong>Important Legal Notice:</strong>
                            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                                <li>Donations are voluntary and completely separate from game funds</li>
                                <li>Donations do not affect gameplay, settlements, or any game-related transactions</li>
                                <li>Donations are not tax-deductible</li>
                                <li>All donations are final and non-refundable</li>
                            </ul>
                        </Typography>
                    </Alert>

                    <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1, 
                        p: 2, 
                        bgcolor: 'background.default',
                        borderRadius: 1
                    }}>
                        <VenmoIcon />
                        <Typography variant="body2" color="text.secondary">
                            Donations are processed through Venmo
                        </Typography>
                    </Box>
                </DialogContent>

                <DialogActions sx={{ p: 2, pt: 1 }}>
                    <Button onClick={handleClose} color="inherit">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDonate}
                        variant="contained"
                        color="primary"
                        startIcon={<CoffeeIcon />}
                        disabled={!selectedAmount && !customAmount}
                    >
                        Support via Venmo
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};
