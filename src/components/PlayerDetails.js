import React, { useState } from 'react';
import {
    Card,
    CardContent,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    Grid,
    Paper,
    List,
    ListItem,
    ListItemText,
    TextField,
    Button,
    Alert
} from '@mui/material';
import {
    Person as PersonIcon,
    Payment as PaymentIcon
} from '@mui/icons-material';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const PlayerDetails = ({ 
    selectedPlayer, 
    setSelectedPlayer, 
    ledgerData,
    venmoIds
}) => {
    const [newVenmoId, setNewVenmoId] = useState('');
    const [saveMessage, setSaveMessage] = useState(null);

    // Sort players alphabetically by name
    const sortedPlayers = Array.isArray(ledgerData) 
        ? [...ledgerData].sort((a, b) => a.name.localeCompare(b.name))
        : [];

    const getPlayerStats = (playerId) => {
        if (!ledgerData || !Array.isArray(ledgerData)) return null;
        
        const player = ledgerData.find(p => p.id === playerId);
        if (!player) return null;

        return {
            id: player.id,
            name: player.name,
            venmoId: venmoIds[player.id] || null
        };
    };

    const handleSaveVenmoId = async () => {
        if (!selectedPlayer || !newVenmoId.trim()) return;

        const playerStats = getPlayerStats(selectedPlayer);
        if (!playerStats) return;

        try {
            const cleanVenmoId = newVenmoId.trim().replace('@', '');
            const now = new Date().toISOString();
            
            await setDoc(doc(db, 'venmoIds', selectedPlayer), {
                playerName: playerStats.name,
                pokerNowId: selectedPlayer,
                createdAt: now,
                updatedAt: now,
                venmoId: cleanVenmoId
            });

            // Update local state immediately
            venmoIds[selectedPlayer] = cleanVenmoId;
            setNewVenmoId('');
            
        } catch (error) {
            setSaveMessage({ type: 'error', text: `Error saving Venmo ID: ${error.message}` });
        }
    };

    const playerStats = selectedPlayer ? getPlayerStats(selectedPlayer) : null;
    const venmoId = selectedPlayer ? venmoIds[selectedPlayer] || '' : '';

    return (
        <Card sx={{ mt: 2 }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                    <PersonIcon color="primary" />
                    <Typography variant="h6" component="h2">
                        Player Details
                    </Typography>
                </Box>
                
                <FormControl fullWidth sx={{ mb: 4 }}>
                    <InputLabel sx={{ 
                        transform: 'translate(14px, 8px) scale(1)',
                        '&.Mui-focused': {
                            transform: 'translate(14px, -9px) scale(0.75)'
                        },
                        '&.MuiInputLabel-shrink': {
                            transform: 'translate(14px, -9px) scale(0.75)'
                        }
                    }}>
                        Select Player
                    </InputLabel>
                    <Select
                        value={selectedPlayer || ''}
                        onChange={(e) => setSelectedPlayer(e.target.value)}
                        label="Select Player"
                        size="small"
                        displayEmpty
                        sx={{
                            '& .MuiSelect-select': {
                                display: 'flex',
                                alignItems: 'center',
                                minHeight: '40px',
                                padding: '8px 14px'
                            },
                            '& .MuiSelect-select.MuiSelect-select': {
                                paddingTop: '8px',
                                paddingBottom: '8px',
                                display: 'flex',
                                alignItems: 'center'
                            }
                        }}
                    >
                        {sortedPlayers.map(player => (
                            <MenuItem key={player.id} value={player.id}>
                                {player.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {selectedPlayer && playerStats && (
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <PaymentIcon sx={{ mr: 1 }} color="primary" />
                                    <Typography variant="h6">Payment Information</Typography>
                                </Box>
                                {saveMessage && (
                                    <Alert 
                                        severity={saveMessage.type} 
                                        sx={{ mb: 2 }}
                                        onClose={() => setSaveMessage(null)}
                                    >
                                        {saveMessage.text}
                                    </Alert>
                                )}
                                {playerStats.venmoId ? (
                                    <List dense>
                                        <ListItem>
                                            <ListItemText 
                                                primary="Venmo ID"
                                                secondary={playerStats.venmoId}
                                            />
                                        </ListItem>
                                    </List>
                                ) : (
                                    <Box sx={{ mt: 2 }}>
                                        <Typography color="text.secondary" sx={{ mb: 1 }}>
                                            No Venmo ID set for this player
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                                            <TextField
                                                label="Enter Venmo ID"
                                                value={newVenmoId}
                                                onChange={(e) => setNewVenmoId(e.target.value)}
                                                size="small"
                                                placeholder="@username"
                                                sx={{ flexGrow: 1 }}
                                            />
                                            <Button 
                                                variant="contained" 
                                                onClick={handleSaveVenmoId}
                                                disabled={!newVenmoId.trim()}
                                            >
                                                Save
                                            </Button>
                                        </Box>
                                    </Box>
                                )}
                            </Paper>
                        </Grid>
                    </Grid>
                )}
            </CardContent>
        </Card>
    );
}; 