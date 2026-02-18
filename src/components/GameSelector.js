import React from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    List,
    ListItemButton,
    ListItemText,
    Divider
} from '@mui/material';
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
    setSelectedPlayer,
    onGameSelect
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
            if (onGameSelect) {
                onGameSelect(gameData);
            } else {
                setSelectedGame(gameData);
            }
            
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

    const getDateGroupLabel = (dateString) => {
        try {
            const date = new Date(dateString);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const gameDay = new Date(date);
            gameDay.setHours(0, 0, 0, 0);
            const diffDays = Math.floor((today - gameDay) / (1000 * 60 * 60 * 24));
            if (diffDays === 0) return 'Today';
            if (diffDays === 1) return 'Yesterday';
            if (diffDays < 7) return date.toLocaleDateString('en-US', { weekday: 'long' });
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch {
            return 'Other';
        }
    };

    const gamesByDate = sortedGames.reduce((acc, game) => {
        const dateKey = new Date(game.startTime || game.createdAt).toDateString();
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(game);
        return acc;
    }, {});

    const dateGroups = Object.entries(gamesByDate).map(([dateKey, games]) => ({
        label: getDateGroupLabel(games[0].startTime || games[0].createdAt),
        games,
    }));

    return (
        <Card elevation={0}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="subtitle1" component="h2" fontWeight={600} sx={{ mb: 1.5, px: 1, color: 'text.primary' }}>
                    Select Game
                </Typography>

                <List disablePadding>
                    {dateGroups.map(({ label, games }) => (
                        <React.Fragment key={label}>
                            <Typography
                                variant="caption"
                                sx={{
                                    px: 1.5,
                                    py: 1,
                                    color: 'text.secondary',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    display: 'block',
                                }}
                            >
                                {label}
                            </Typography>
                            {games.map((game, index) => (
                                <React.Fragment key={game.id}>
                                    <ListItemButton 
                                        selected={selectedGame?.id === game.id}
                                        onClick={() => handleGameClick(game)}
                                        sx={{
                                            borderRadius: 2,
                                            mx: 0.5,
                                            mb: 0.5,
'&.Mui-selected': {
                                        backgroundColor: 'rgba(250, 250, 250, 0.08)',
                                        '@media (hover: hover)': {
                                            '&:hover': { backgroundColor: 'rgba(250, 250, 250, 0.12)' },
                                        },
                                    },
                                        }}
                                    >
                                        <ListItemText 
                                            primary={game.nickname || formatDateTime(game.startTime)}
                                            secondary={`${formatDateTime(game.startTime)} • ${game.sessionResults?.length || 0} players`}
                                            primaryTypographyProps={{ fontWeight: 500, fontSize: '0.9375rem' }}
                                            secondaryTypographyProps={{ fontSize: '0.8125rem', color: 'text.secondary' }}
                                        />
                                    </ListItemButton>
                                    {index < games.length - 1 && (
                                        <Divider variant="inset" component="li" sx={{ mx: 0 }} />
                                    )}
                                </React.Fragment>
                            ))}
                        </React.Fragment>
                    ))}
                </List>
            </CardContent>
        </Card>
    );
}; 