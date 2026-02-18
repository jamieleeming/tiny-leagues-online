import React, { useState } from 'react';
import {
    Card,
    CardContent,
    Typography,
    FormControl,
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
            
            await setDoc(doc(db, 'players', selectedPlayer), {
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

    return (
        <Card sx={{ mt: 2 }} elevation={0}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                    <Box sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'rgba(250, 250, 250, 0.08)',
                    }}>
                        <PersonIcon sx={{ color: 'primary.main', fontSize: 22 }} />
                    </Box>
                    <Typography variant="subtitle1" component="h2" fontWeight={600}>
                        Player Details
                    </Typography>
                </Box>
                
                <FormControl fullWidth sx={{ mb: 3 }}>
                    <Select
                        value={selectedPlayer || ''}
                        onChange={(e) => setSelectedPlayer(e.target.value)}
                        size="small"
                        displayEmpty
                        renderValue={(value) => value ? sortedPlayers.find(p => p.id === value)?.name ?? '' : 'Select Player'}
                        sx={{
                            borderRadius: 2,
                            '& .MuiSelect-select': {
                                display: 'flex',
                                alignItems: 'center',
                                py: 1.25,
                            },
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
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <Paper 
                                elevation={0} 
                                sx={{ 
                                    p: 2.5, 
                                    borderRadius: 2,
                                    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(39,39,42,0.5)' : 'grey.50',
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                    <PaymentIcon sx={{ color: 'primary.main', fontSize: 22 }} />
                                    <Typography variant="subtitle1" fontWeight={600}>Payment Information</Typography>
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
                                    <Box sx={{ mt: 1 }}>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                                            No Venmo ID set for this player
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                                            <TextField
                                                label="Enter Venmo ID"
                                                value={newVenmoId}
                                                onChange={(e) => setNewVenmoId(e.target.value)}
                                                size="small"
                                                placeholder="@username"
                                                sx={{ flexGrow: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                            />
                                            <Button 
                                                variant="contained" 
                                                onClick={handleSaveVenmoId}
                                                disabled={!newVenmoId.trim()}
                                                sx={{ minWidth: 90 }}
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