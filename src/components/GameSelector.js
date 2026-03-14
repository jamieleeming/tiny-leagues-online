import React, { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    Typography,
    List,
    ListItemButton,
    ListItemText,
    Divider,
    Box,
    IconButton
} from '@mui/material';
import { ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon } from '@mui/icons-material';
import { fetchVenmoIdsBatch } from '../utils/venmoIds';

/** Games per page in the selector (mobile-friendly). */
const GAMES_PER_PAGE = 15;
/** Maximum number of pages; selector shows up to 150 games (15 × 10). */
const MAX_PAGES = 10;

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
    const [currentPage, setCurrentPage] = useState(1);

    const resetGameSelection = () => {
        setSelectedGame(null);
        setLedgerData(null);
        setVenmoIds({});
        setSelectedPlayer('');
    };

    // Sort by date descending; show at most GAMES_PER_PAGE × MAX_PAGES (150) games
    const allGamesSorted = [...games].sort((a, b) => {
        const dateA = new Date(a.startTime || a.createdAt || 0);
        const dateB = new Date(b.startTime || b.createdAt || 0);
        return dateB - dateA;
    });

    const displayableGames = allGamesSorted.slice(0, GAMES_PER_PAGE * MAX_PAGES);
    const totalPages = Math.max(1, Math.min(MAX_PAGES, Math.ceil(displayableGames.length / GAMES_PER_PAGE)));
    const effectivePage = Math.min(currentPage, totalPages);
    const pageStart = (effectivePage - 1) * GAMES_PER_PAGE;
    const pageEnd = pageStart + GAMES_PER_PAGE;
    const sortedGames = displayableGames.slice(pageStart, pageEnd);

    // Reset to first page when games list changes (e.g. league switch or refresh)
    useEffect(() => {
        setCurrentPage(1);
    }, [games.length, selectedLeague]);

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

                {totalPages > 1 && (
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 1,
                            mt: 2,
                            pt: 2,
                            borderTop: 1,
                            borderColor: 'divider',
                            px: 0.5,
                        }}
                    >
                        <IconButton
                            size="medium"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage <= 1}
                            aria-label="Previous page"
                            sx={{ mr: -0.5 }}
                        >
                            <ChevronLeftIcon />
                        </IconButton>
                        <Typography variant="body2" color="text.secondary" sx={{ flex: 1, textAlign: 'center' }}>
                            Page {effectivePage} of {totalPages}
                        </Typography>
                        <IconButton
                            size="medium"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage >= totalPages}
                            aria-label="Next page"
                            sx={{ ml: -0.5 }}
                        >
                            <ChevronRightIcon />
                        </IconButton>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
}; 
