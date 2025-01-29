import React from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    List,
    ListItemButton,
    ListItemText,
    ListItemIcon,
    Divider
} from '@mui/material';
import { Casino as DiceIcon } from '@mui/icons-material';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UploadGame } from './UploadGame';

export const GameSelector = ({ 
    selectedGame, 
    games,
    setSelectedGame,
    setLedgerData,
    selectedLeague,
    refreshGames,
    isLoadingGames,
    gamesError,
    setVenmoIds,
    setSelectedPlayer
}) => {
    const resetGameSelection = () => {
        setSelectedGame(null);
        setLedgerData(null);
        setVenmoIds({});
        setSelectedPlayer('');
    };

    // Filter games from last week and sort by startTime in descending order
    const sortedGames = [...games]
        .filter(game => {
            const gameDate = new Date(game.startTime);
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            return gameDate >= oneWeekAgo;
        })
        .sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

    const handleGameClick = async (game) => {
        // Reset all states first
        resetGameSelection();

        // If no game selected, we're done
        if (!game) {
            return;
        }

        try {
            const gameDoc = await getDoc(doc(db, 'leagues', selectedLeague, 'games', game.id));
            if (!gameDoc.exists()) {
                return;
            }

            const gameData = {
                id: gameDoc.id,
                ...gameDoc.data()
            };

            // Set new game data after resetting states
            setSelectedGame(gameData);
            setLedgerData(gameData.sessionResults);

            // Get array of player IDs from the session results
            const playerIds = gameData.sessionResults.map(player => player.id);

            // Fetch Venmo IDs for players
            const venmoData = {};
            for (const playerId of playerIds) {
                try {
                    const venmoDoc = await getDoc(doc(db, 'venmoIds', playerId));
                    if (venmoDoc.exists()) {
                        venmoData[playerId] = venmoDoc.data().venmoId;
                    }
                } catch (err) {
                    // Silently fail for individual Venmo ID fetches
                }
            }

            setVenmoIds(venmoData);
        } catch (err) {
            setVenmoIds({});
        }
    };

    const formatDateTime = (dateString) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                hour12: true
            });
        } catch (error) {
            return 'Invalid Date';
        }
    };

    return (
        <Card>
            <CardContent>
                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2
                }}>
                    <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1
                    }}>
                        <DiceIcon color="primary" />
                        <Typography variant="h6" component="h2">
                            Select Game
                        </Typography>
                    </Box>
                    <UploadGame 
                        selectedLeague={selectedLeague}
                        refreshGames={refreshGames}
                        onResetSelectedGame={resetGameSelection}
                    />
                </Box>

                <List>
                    {sortedGames.map((game, index) => (
                        <React.Fragment key={game.id}>
                            <ListItemButton 
                                selected={selectedGame?.id === game.id}
                                onClick={() => handleGameClick(game)}
                                sx={{
                                    '&.Mui-selected': {
                                        backgroundColor: 'action.selected'
                                    }
                                }}
                            >
                                <ListItemIcon>
                                    <DiceIcon color="primary" />
                                </ListItemIcon>
                                <ListItemText 
                                    primary={formatDateTime(game.startTime)}
                                    secondary={`${game.sessionResults?.length || 0} players`}
                                />
                            </ListItemButton>
                            {index < sortedGames.length - 1 && (
                                <Divider variant="inset" component="li" />
                            )}
                        </React.Fragment>
                    ))}
                </List>
            </CardContent>
        </Card>
    );
}; 