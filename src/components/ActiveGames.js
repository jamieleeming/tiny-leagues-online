import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
    Container,
    Card,
    CardContent,
    Typography,
    Box,
    TextField,
    Button,
    Alert,
    CircularProgress,
    List,
    ListItem,
    ListItemText,
    Divider,
    Snackbar,
    Grid,
    Fade,
    MenuItem
} from '@mui/material';
import {
    Add as AddIcon,
    OpenInNew as OpenInNewIcon,
    Share as ShareIcon
} from '@mui/icons-material';
import { db } from '../firebase';
import {
    collection,
    query,
    where,
    orderBy,
    getDocs,
    getDoc,
    setDoc,
    updateDoc,
    doc,
    onSnapshot,
    arrayUnion,
    arrayRemove
} from 'firebase/firestore';
import { extractGameId, isValidPokerNowUrl } from '../utils/gameUtils';
import { hasLeagueAccess, saveLeagueAccess } from '../utils/leagueAuth';
import { LeaguePassword } from './LeaguePassword';

const POKER_VARIANTS = [
    "No Limit Texas Hold'em",
    'Pot Limit Omaha Hi',
    'Pot Limit Omaha Hi/Lo (8 or Better)',
    'Pot Limit Omaha 5 Hi',
    'Pot Limit Omaha 5 Hi/Lo (8 or Better)'
];

export const ActiveGames = () => {
    const location = useLocation();
    const gameRefs = useRef({});
    
    const [selectedLeague, setSelectedLeague] = useState('');
    const [games, setGames] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isLeagueValidated, setIsLeagueValidated] = useState(false);
    const [leagueError, setLeagueError] = useState(null);
    const [showLeaguePassword, setShowLeaguePassword] = useState(false);
    const [fadeIn, setFadeIn] = useState(false);
    
    // Post game form state
    const [showPostForm, setShowPostForm] = useState(false);
    const [title, setTitle] = useState('');
    const [link, setLink] = useState('');
    const [host, setHost] = useState('');
    const [variant, setVariant] = useState("No Limit Texas Hold'em");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const [notification, setNotification] = useState(null);
    
    // Waitlist state
    const [waitlistInputs, setWaitlistInputs] = useState({});

    // Check for league access on mount
    useEffect(() => {
        const storedLeague = localStorage.getItem('lastLeague');
        if (storedLeague && hasLeagueAccess(storedLeague)) {
            setSelectedLeague(storedLeague);
            setIsLeagueValidated(true);
            setShowLeaguePassword(false);
            setFadeIn(true);
        } else {
            setShowLeaguePassword(true);
            setIsLoading(false);
        }
    }, []);

    const validateLeague = async () => {
        if (!selectedLeague) return;
        
        try {
            // Check if league exists in Firestore
            const leagueDoc = await getDoc(doc(db, 'leagues', selectedLeague));
            
            if (!leagueDoc.exists()) {
                setLeagueError('League not found. Please check the code and try again.');
                return;
            }
            
            // League exists, save access token
            saveLeagueAccess(selectedLeague);
            
            // Store the last used league for convenience
            localStorage.setItem('lastLeague', selectedLeague);
            
            setIsLeagueValidated(true);
            setLeagueError(null);
            
            // Hide the league password component and show content with fade
            setShowLeaguePassword(false);
            setFadeIn(true);
            
        } catch (error) {
            console.error('Error validating league:', error);
            setLeagueError('Error validating league. Please try again.');
        }
    };

    const handleValidationComplete = () => {
        // This callback is called after the fade-out animation completes
        // The games will automatically load once selectedLeague is set
        // No action needed here as selectedLeague is already set in validateLeague
    };


    // Handle scrolling to game when hash is present in URL
    useEffect(() => {
        if (!isLeagueValidated || !selectedLeague || games.length === 0) return;
        
        const hash = location.hash;
        if (hash && hash.startsWith('#game-')) {
            const gameId = hash.substring(6); // Remove '#game-' prefix
            const gameElement = gameRefs.current[gameId];
            
            if (gameElement) {
                // Small delay to ensure DOM is ready
                setTimeout(() => {
                    gameElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    // Highlight the card briefly
                    gameElement.style.transition = 'box-shadow 0.3s';
                    gameElement.style.boxShadow = '0 0 0 3px rgba(25, 118, 210, 0.5)';
                    setTimeout(() => {
                        gameElement.style.boxShadow = '';
                    }, 2000);
                }, 300);
            }
        }
    }, [location.hash, isLeagueValidated, selectedLeague, games]);

    // Fetch active games and set up real-time listener
    useEffect(() => {
        if (!selectedLeague) return;

        setIsLoading(true);
        setError(null);

        // Calculate 24 hours ago (games stay live for 24 hours)
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        const gamesRef = collection(db, 'leagues', selectedLeague, 'activeGames');
        const q = query(
            gamesRef,
            where('createdAt', '>', twentyFourHoursAgo.toISOString()),
            orderBy('createdAt', 'desc')
        );

        // Set up real-time listener
        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const gamesData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                // Additional client-side filter for safety
                const now = new Date();
                const filteredGames = gamesData.filter(game => {
                    const createdAt = new Date(game.createdAt);
                    const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);
                    return hoursSinceCreation < 24;
                });
                
                setGames(filteredGames);
                setIsLoading(false);
            },
            (err) => {
                console.error('Error fetching active games:', err);
                setError('Failed to load active games');
                setIsLoading(false);
            }
        );

        return () => unsubscribe();
    }, [selectedLeague]);

    const validateForm = () => {
        const errors = {};

        // Validate description
        if (!title.trim()) {
            errors.title = 'Description is required';
        } else if (title.trim().length > 50) {
            errors.title = 'Description must be 50 characters or less';
        }

        // Validate link
        if (!link.trim()) {
            errors.link = 'Link is required';
        } else if (!isValidPokerNowUrl(link.trim())) {
            errors.link = 'Link must be from pokernow.club or pokernow.com domain';
        } else if (!extractGameId(link.trim())) {
            errors.link = 'Invalid game URL format';
        }

        // Validate host
        if (!host.trim()) {
            errors.host = 'Host is required';
        } else if (host.trim().length > 50) {
            errors.host = 'Host name must be 50 characters or less';
        }

        // Validate variant
        if (!variant || !variant.trim()) {
            errors.variant = 'Variant is required';
        } else if (!POKER_VARIANTS.includes(variant)) {
            errors.variant = 'Please select a valid variant';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const checkDuplicateLink = async (linkToCheck, gameId) => {
        try {
            // Check if document with this gameId already exists (since gameId is the document ID)
            const gameRef = doc(db, 'leagues', selectedLeague, 'activeGames', gameId);
            const gameDoc = await getDoc(gameRef);
            
            if (gameDoc.exists()) {
                return true;
            }
            
            // Also check for duplicate link (in case someone uses a different URL format for same game)
            const gamesRef = collection(db, 'leagues', selectedLeague, 'activeGames');
            const q = query(gamesRef, where('link', '==', linkToCheck.trim()));
            const snapshot = await getDocs(q);
            
            return !snapshot.empty;
        } catch (error) {
            console.error('Error checking duplicate link:', error);
            return false;
        }
    };

    const handlePostGame = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        const trimmedLink = link.trim();
        const trimmedTitle = title.trim();
        const trimmedHost = host.trim();

        setIsSubmitting(true);
        setError(null);

        try {
            const gameId = extractGameId(trimmedLink);
            if (!gameId) {
                throw new Error('Could not extract game ID from URL');
            }

            // Check for duplicate link
            const isDuplicate = await checkDuplicateLink(trimmedLink, gameId);
            if (isDuplicate) {
                setFormErrors({ link: 'This game link has already been posted' });
                setIsSubmitting(false);
                return;
            }

            const gameData = {
                link: trimmedLink,
                title: trimmedTitle,
                host: trimmedHost,
                variant: variant.trim(),
                createdAt: new Date().toISOString(),
                waitlist: [],
                strikethroughNames: []
            };

            // Use gameId as document ID
            const gameRef = doc(db, 'leagues', selectedLeague, 'activeGames', gameId);
            await setDoc(gameRef, gameData);

            // Reset form
            setTitle('');
            setLink('');
            setHost('');
            setVariant("No Limit Texas Hold'em");
            setShowPostForm(false);
            setFormErrors({});
            setNotification({ type: 'success', message: 'Game posted successfully!' });
        } catch (err) {
            console.error('Error posting game:', err);
            setError(err.message || 'Failed to post game');
            setNotification({ type: 'error', message: err.message || 'Failed to post game' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleJoinWaitlist = async (gameId) => {
        const name = waitlistInputs[gameId]?.trim();
        if (!name) {
            return;
        }

        try {
            const gameRef = doc(db, 'leagues', selectedLeague, 'activeGames', gameId);
            await updateDoc(gameRef, {
                waitlist: arrayUnion(name)
            });

            // Clear input
            setWaitlistInputs(prev => ({ ...prev, [gameId]: '' }));
            setNotification({ type: 'success', message: 'Added to waitlist!' });
        } catch (err) {
            console.error('Error joining waitlist:', err);
            setNotification({ type: 'error', message: 'Failed to join waitlist' });
        }
    };

    const formatTimeAgo = (createdAt) => {
        const now = new Date();
        const created = new Date(createdAt);
        const hoursAgo = Math.floor((now - created) / (1000 * 60 * 60));
        
        if (hoursAgo < 1) {
            return 'Just now';
        } else if (hoursAgo === 1) {
            return '1 hour ago';
        } else {
            return `${hoursAgo} hours ago`;
        }
    };

    const handleCloseNotification = () => {
        setNotification(null);
    };

    const handleShareGame = (gameId) => {
        const shareUrl = `${window.location.origin}/games#game-${gameId}`;
        
        // Try to use Web Share API if available
        if (navigator.share) {
            navigator.share({
                title: 'Active Game',
                text: 'Check out this active poker game!',
                url: shareUrl
            }).catch((err) => {
                // Fallback to clipboard if share fails
                navigator.clipboard.writeText(shareUrl).then(() => {
                    setNotification({ type: 'success', message: 'Link copied to clipboard!' });
                });
            });
        } else {
            // Fallback to clipboard
            navigator.clipboard.writeText(shareUrl).then(() => {
                setNotification({ type: 'success', message: 'Link copied to clipboard!' });
            }).catch(() => {
                // Last resort: show the URL
                setNotification({ type: 'info', message: `Share URL: ${shareUrl}` });
            });
        }
    };

    const handleToggleStrikethrough = async (gameId, name) => {
        try {
            const gameRef = doc(db, 'leagues', selectedLeague, 'activeGames', gameId);
            const game = games.find(g => g.id === gameId);
            
            // Check if name is already in strikethroughNames array
            const isStrikethrough = game?.strikethroughNames?.includes(name) || false;
            
            if (isStrikethrough) {
                // Remove from strikethrough array
                await updateDoc(gameRef, {
                    strikethroughNames: arrayRemove(name)
                });
            } else {
                // Add to strikethrough array
                // If strikethroughNames doesn't exist, arrayUnion will create it
                await updateDoc(gameRef, {
                    strikethroughNames: arrayUnion(name)
                });
            }
        } catch (err) {
            console.error('Error toggling strikethrough:', err);
            setNotification({ type: 'error', message: 'Failed to update strikethrough' });
        }
    };

    // Show league password if not validated
    if (showLeaguePassword || !isLeagueValidated || !selectedLeague) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <LeaguePassword 
                    selectedLeague={selectedLeague}
                    setSelectedLeague={setSelectedLeague}
                    isLeagueValidated={isLeagueValidated}
                    validateLeague={validateLeague}
                    leagueError={leagueError}
                    setLeagueError={setLeagueError}
                    onValidationComplete={handleValidationComplete}
                />
            </Container>
        );
    }

    return (
        <Container 
            maxWidth="lg" 
            sx={{ 
                mt: 4, 
                mb: 4,
                background: (theme) => theme.palette.mode === 'dark' 
                    ? 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(250, 250, 250, 0.04) 0%, transparent 50%)'
                    : undefined,
            }}
        >
            <Fade 
                in={fadeIn} 
                timeout={{
                    enter: 300,
                    exit: 300
                }}
                style={{ 
                    transitionDelay: fadeIn ? '200ms' : '0ms'
                }}
            >
                <div>
                    <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h5" component="h1" fontWeight={600}>
                            Games
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => setShowPostForm(!showPostForm)}
                            sx={{ fontWeight: 600 }}
                        >
                            Post Game
                        </Button>
                    </Box>

            {showPostForm && (
                <Card sx={{ mb: 3 }} elevation={0}>
                    <CardContent sx={{ p: 3 }}>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                            Post New Game
                        </Typography>
                        <form onSubmit={handlePostGame}>
                            <TextField
                                fullWidth
                                select
                                label="Variant"
                                value={variant}
                                onChange={(e) => {
                                    setVariant(e.target.value);
                                    if (formErrors.variant) setFormErrors({ ...formErrors, variant: '' });
                                }}
                                error={!!formErrors.variant}
                                helperText={formErrors.variant || 'Poker format or game variant'}
                                margin="normal"
                                InputProps={{
                                    sx: {
                                        '& .MuiSelect-select': {
                                            textAlign: 'left'
                                        }
                                    }
                                }}
                            >
                                {POKER_VARIANTS.map((v) => (
                                    <MenuItem key={v} value={v}>
                                        {v}
                                    </MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                fullWidth
                                label="Game Link"
                                value={link}
                                onChange={(e) => {
                                    setLink(e.target.value);
                                    if (formErrors.link) setFormErrors({ ...formErrors, link: '' });
                                }}
                                error={!!formErrors.link}
                                helperText={formErrors.link || 'Poker Now game URL (pokernow.club or pokernow.com)'}
                                margin="normal"
                                placeholder="https://pokernow.club/games/..."
                            />
                            <TextField
                                fullWidth
                                label="Host"
                                value={host}
                                onChange={(e) => {
                                    setHost(e.target.value);
                                    if (formErrors.host) setFormErrors({ ...formErrors, host: '' });
                                }}
                                error={!!formErrors.host}
                                helperText={formErrors.host || `${host.length}/50 characters`}
                                margin="normal"
                                inputProps={{ maxLength: 50 }}
                            />
                            <TextField
                                fullWidth
                                label="Description"
                                value={title}
                                onChange={(e) => {
                                    setTitle(e.target.value);
                                    if (formErrors.title) setFormErrors({ ...formErrors, title: '' });
                                }}
                                error={!!formErrors.title}
                                helperText={formErrors.title || `${title.length}/50 characters`}
                                margin="normal"
                                inputProps={{ maxLength: 50 }}
                            />
                            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    disabled={isSubmitting}
                                    sx={{ fontWeight: 600 }}
                                >
                                    {isSubmitting ? <CircularProgress size={24} /> : 'Post Game'}
                                </Button>
                                <Button
                                    onClick={() => {
                                        setShowPostForm(false);
                                        setTitle('');
                                        setLink('');
                                        setHost('');
                                        setVariant("No Limit Texas Hold'em");
                                        setFormErrors({});
                                    }}
                                >
                                    Cancel
                                </Button>
                            </Box>
                        </form>
                    </CardContent>
                </Card>
            )}

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            ) : games.length === 0 ? (
                <Card elevation={0} sx={{ py: 6 }}>
                    <CardContent>
                        <Typography variant="body1" color="text.secondary" align="center">
                            No active games. Be the first to post one!
                        </Typography>
                    </CardContent>
                </Card>
            ) : (
                <Grid container spacing={2}>
                    {games.map((game) => (
                        <Grid item xs={12} sm={6} key={game.id}>
                            <Card 
                                ref={(el) => {
                                    if (el) {
                                        gameRefs.current[game.id] = el;
                                    }
                                }}
                                id={`game-${game.id}`}
                                elevation={0}
                                sx={{ 
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                }}
                            >
                            <CardContent sx={{ 
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                p: 2.5
                            }}>
                                <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ mb: 1 }}>
                                    {game.variant || game.title}
                                </Typography>
                                
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    Host: {game.host} • {formatTimeAgo(game.createdAt)}
                                </Typography>

                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: '1.5em' }}>
                                    {game.variant && game.title ? game.title : '\u00A0'}
                                </Typography>

                                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                    <Button
                                        variant="contained"
                                        startIcon={<OpenInNewIcon />}
                                        href={game.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        sx={{ flex: 1, fontWeight: 600 }}
                                    >
                                        Go to Game
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        startIcon={<ShareIcon />}
                                        onClick={() => handleShareGame(game.id)}
                                    >
                                        Share
                                    </Button>
                                </Box>

                                <Divider sx={{ mb: 2 }} />

                                <Typography variant="subtitle2" gutterBottom sx={{ mb: 1.5 }}>
                                    Waitlist
                                </Typography>
                                
                                {game.waitlist && game.waitlist.length > 0 ? (
                                    <List dense sx={{ mb: 2 }}>
                                        {game.waitlist.map((name, index) => {
                                            const isStrikethrough = game.strikethroughNames?.includes(name) || false;
                                            return (
                                                <ListItem 
                                                    key={index} 
                                                    sx={{ 
                                                        py: 0.5,
                                                        px: 1,
                                                        cursor: 'pointer',
                                                        borderRadius: 1,
                                                        '&:hover': {
                                                            backgroundColor: 'action.hover'
                                                        }
                                                    }}
                                                    onClick={() => handleToggleStrikethrough(game.id, name)}
                                                >
                                                    <ListItemText
                                                        primary={
                                                            <Typography
                                                                sx={{
                                                                    textDecoration: isStrikethrough ? 'line-through' : 'none',
                                                                    color: isStrikethrough ? 'text.secondary' : 'text.primary',
                                                                    userSelect: 'none'
                                                                }}
                                                            >
                                                                {index + 1}. {name}
                                                            </Typography>
                                                        }
                                                    />
                                                </ListItem>
                                            );
                                        })}
                                    </List>
                                ) : (
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        No one has joined the waitlist yet
                                    </Typography>
                                )}

                                <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                                    <TextField
                                        size="small"
                                        placeholder="Your name"
                                        value={waitlistInputs[game.id] || ''}
                                        onChange={(e) =>
                                            setWaitlistInputs(prev => ({
                                                ...prev,
                                                [game.id]: e.target.value
                                            }))
                                        }
                                        sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                    />
                                    <Button
                                        variant="outlined"
                                        onClick={() => handleJoinWaitlist(game.id)}
                                        disabled={!waitlistInputs[game.id]?.trim()}
                                    >
                                        Join waitlist
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

                    <Snackbar
                        open={!!notification}
                        autoHideDuration={6000}
                        onClose={handleCloseNotification}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                    >
                        {notification && (
                            <Alert
                                onClose={handleCloseNotification}
                                severity={notification.type}
                                variant="filled"
                                sx={{ width: '100%' }}
                            >
                                {notification.message}
                            </Alert>
                        )}
                    </Snackbar>
                </div>
            </Fade>
        </Container>
    );
};
