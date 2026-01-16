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
import { UploadGame } from './UploadGame';
import { fetchVenmoIdsBatch } from '../utils/venmoIds';

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

    // Filter and sort games:
    // 1. Show games from last 7 days, up to max 20 games
    // 2. OR if no games in last 7 days, show last 5 games (regardless of date)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    // Sort all games by startTime descending (most recent first)
    const allGamesSorted = [...games].sort((a, b) => {
        const dateA = new Date(a.startTime || a.createdAt || 0);
        const dateB = new Date(b.startTime || b.createdAt || 0);
        return dateB - dateA;
    });
    
    // Filter games from last 7 days
    const recentGames = allGamesSorted.filter(game => {
        const gameDate = new Date(game.startTime || game.createdAt);
        return gameDate >= oneWeekAgo;
    });
    
    // If we have recent games, show up to 20 of them
    // Otherwise, show the last 5 games (regardless of date)
    const sortedGames = recentGames.length > 0 
        ? recentGames.slice(0, 20)
        : allGamesSorted.slice(0, 5);

    const handleGameClick = async (game) => {
        // Reset all states first
        resetGameSelection();

        // If no game selected, we're done
        if (!game) {
            return;
        }

        try {
            // Use game data already available in the games array
            // This eliminates an unnecessary database read
            const gameData = {
                id: game.id,
                ...game
            };

            // Set new game data after resetting states
            setSelectedGame(gameData);
            
            // Handle both sessionResults (newer format) and playersInfos (older format)
            const playerData = gameData.sessionResults || gameData.playersInfos || [];
            setLedgerData(playerData);

            // Get array of player IDs from the session results
            const playerIds = playerData.map(player => player.id).filter(Boolean);

            // Fetch Venmo IDs for players using secure batch fetch
            // Security: Only fetches Venmo IDs for players in this specific game
            const venmoData = await fetchVenmoIdsBatch(playerIds);

            setVenmoIds(venmoData);
        } catch (err) {
            console.error('Error handling game selection:', err);
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

                <List
                    sx={{
                        maxHeight: '320px',
                        overflowY: 'overlay',  // Changed from 'auto' to 'overlay'
                        '&::-webkit-scrollbar': {
                            width: '8px',
                            display: 'none',  // Hide by default
                        },
                        '&:hover::-webkit-scrollbar': {
                            display: 'block',  // Show on hover
                        },
                        '&::-webkit-scrollbar-track': {
                            background: '#f1f1f1',
                            borderRadius: '4px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                            background: '#888',
                            borderRadius: '4px',
                            '&:hover': {
                                background: '#666',
                            },
                        },
                    }}
                >
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
                                    primary={game.nickname || formatDateTime(game.startTime)}
                                    secondary={`${formatDateTime(game.startTime)} • ${game.sessionResults?.length || 0} players`}
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