import React, { useState, useEffect, useCallback } from 'react';
import { db } from './firebase';
import { 
    collection, 
    doc, 
    setDoc, 
    getDocs,
    getDoc,
    query,
    orderBy,
    limit
} from 'firebase/firestore';
import { fetchVenmoIdsBatch } from './utils/venmoIds';
import { queryTracker } from './utils/queryTracker';
import { LeaguePassword } from './components/LeaguePassword';
import { GameSelector } from './components/GameSelector';
import { PlayerDetails } from './components/PlayerDetails';
import { SessionResults } from './components/SessionResults';
import { UploadGame } from './components/UploadGame';
import { 
    Container, 
    Fade, 
    Box, 
    Alert, 
    Snackbar,
    Typography,
    Button,
    Card,
    CardContent,
    Grid,
} from '@mui/material';
import { hasLeagueAccess, saveLeagueAccess } from './utils/leagueAuth';

const PokerLedger = () => {
    const [selectedPlayer, setSelectedPlayer] = useState('');
    const [selectedLeague, setSelectedLeague] = useState('');
    const [leagueError, setLeagueError] = useState(null);
    const [isLeagueValidated, setIsLeagueValidated] = useState(false);
    const [selectedGame, setSelectedGame] = useState(null);
    const [games, setGames] = useState([]);
    const [venmoIds, setVenmoIds] = useState({});
    const [isLoadingGames, setIsLoadingGames] = useState(false);
    const [gamesError, setGamesError] = useState(null);
    const [notification, setNotification] = useState(null);
    const [showGameSelector, setShowGameSelector] = useState(false);
    const [showGameList, setShowGameList] = useState(true);
    const [ledgerData, setLedgerData] = useState(null);
    const [showLeaguePassword, setShowLeaguePassword] = useState(true);

    // Check for existing league access on component mount
    useEffect(() => {
        const checkExistingAccess = () => {
            // Get the league ID from localStorage if it exists
            const storedLeague = localStorage.getItem('lastLeague');
            
            if (storedLeague && hasLeagueAccess(storedLeague)) {
                // If we have valid access to the stored league, auto-select it
                setSelectedLeague(storedLeague);
                setIsLeagueValidated(true);
                setShowLeaguePassword(false);
                setShowGameSelector(true);
                fetchGames(storedLeague);
            }
        };
        
        checkExistingAccess();
    }, []);

    const formatAmount = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount / 100);
    };

    const formatGameDateTime = (dateString) => {
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

    const calculateSettlements = (playersInfos) => {
        // Skip if no players
        if (!playersInfos || playersInfos.length === 0) {
            return [];
        }

        // Sort players by net amount (descending)
        const sortedPlayers = [...playersInfos].sort((a, b) => b.net - a.net);
        
        const settlements = [];
        let i = 0;  // index for winners (from start)
        let j = sortedPlayers.length - 1;  // index for losers (from end)
        
        while (i < j) {
            const winner = sortedPlayers[i];
            const loser = sortedPlayers[j];
            
            if (winner.net <= 0 || loser.net >= 0) break;  // No more settlements needed
            
            const amount = Math.min(winner.net, -loser.net);
            
            if (amount > 0) {
                settlements.push({
                    from: loser.name,
                    to: winner.name,
                    amount: amount
                });
                
                winner.net -= amount;
                loser.net += amount;
            }
            
            if (winner.net === 0) i++;
            if (loser.net === 0) j--;
        }

        // Verify settlements
        const totalToSettle = playersInfos.reduce((sum, player) => 
            player.net > 0 ? sum + player.net : sum, 0);
        
        const settledAmount = settlements.reduce((sum, settlement) => 
            sum + settlement.amount, 0);
        
        console.log('Settlement verification:', {
            totalToSettle,
            settledAmount,
            difference: totalToSettle - settledAmount
        });

        return settlements;
    };


    const fetchVenmoIds = async (playersInfos) => {
        if (!playersInfos || !Array.isArray(playersInfos)) return;
        
        try {
            // Extract player IDs from the players info
            const playerIds = playersInfos.map(player => player.id).filter(Boolean);
            
            // Use secure batch fetch - only fetches Venmo IDs for players in the current game
            // Security: This maintains the same security boundaries as individual fetches
            const venmoData = await fetchVenmoIdsBatch(playerIds);
            
            setVenmoIds(venmoData);
        } catch (error) {
            console.error('Error fetching Venmo IDs:', error);
            setVenmoIds({});
        }
    };




    const handleSettleUp = (settlement, isRequest = false) => {
        const player = isRequest ? settlement.from : settlement.to;
        const recipientVenmoId = venmoIds[player.id];
        
        if (!recipientVenmoId) {
            setNotification({
                type: 'error',
                message: `No Venmo ID saved for ${player.name}. Please ask them to set up their Venmo ID.`
            });
            return;
        }

        const cleanAmount = (settlement.amount / 100).toFixed(2);
        
        // Format the note as "TLOnline-MM.DD.YY" (spaces replaced with dashes)
        let noteText = 'TLOnline';
        if (selectedGame?.startTime) {
            const gameDate = new Date(selectedGame.startTime);
            const month = String(gameDate.getMonth() + 1).padStart(2, '0');
            const day = String(gameDate.getDate()).padStart(2, '0');
            const year = String(gameDate.getFullYear()).slice(-2);
            noteText = `TLOnline-${month}.${day}.${year}`;
        }
        
        const venmoUrl = `https://venmo.com/${recipientVenmoId}?txn=${isRequest ? 'request' : 'pay'}&note=${encodeURIComponent(noteText)}&amount=${cleanAmount}`;
        window.open(venmoUrl, '_blank');
    };

    const processCSVData = (data) => {
        const playerMap = new Map();

        data.forEach((row, index) => {
            const playerName = row.player_nickname?.replace(/^"|"$/g, '').trim();
            const playerId = row.player_id;
            
            if (!playerName || !playerId) {
                return;
            }

            if (!playerMap.has(playerId)) {
                playerMap.set(playerId, {
                    id: playerId,
                    name: playerName,
                    totalBuyIn: 0,
                    totalCashOut: 0,
                    net: 0,
                    buyIns: [],
                    cashOuts: [],
                    stacks: []
                });
            }

            const player = playerMap.get(playerId);

            const buyIn = parseInt(row.buy_in || 0);
            const cashOut = parseInt(row.buy_out || 0);
            const stack = parseInt(row.stack || 0);

            player.buyIns.push(buyIn);
            player.cashOuts.push(cashOut);
            player.stacks.push(stack);
        });

        for (const player of playerMap.values()) {
            player.totalBuyIn = player.buyIns.reduce((sum, value) => sum + value, 0);
            const totalCashOut = player.cashOuts.reduce((sum, value) => sum + value, 0);
            const totalStack = player.stacks.reduce((sum, value) => sum + value, 0);
            player.totalCashOut = totalCashOut + totalStack;
            player.net = player.totalCashOut - player.totalBuyIn;

            delete player.buyIns;
            delete player.cashOuts;
            delete player.stacks;
        }

        const playersArray = Array.from(playerMap.values());

        return playersArray;
    };

    const processFile = async (file) => {
        try {
            const filename = file.name;
            const gameIdMatch = filename.match(/^ledger_(.+?)(?: \(\d+\))?\.csv$/);
            
            if (!gameIdMatch) {
                throw new Error('Invalid filename format. Expected: ledger_GAMEID.csv or ledger_GAMEID (N).csv');
            }
            
            const gameId = gameIdMatch[1];

            const text = await file.text();
            const rows = text.split('\n').map(row => row.split(','));
            const headers = rows[0];
            
            const sessionStartIndex = headers.findIndex(header => 
                header.trim().toLowerCase() === 'session_start_at'
            );

            if (sessionStartIndex === -1) {
                throw new Error('Could not find session_start_at column in CSV');
            }

            const sessionDates = rows.slice(1)
                .map(row => row[sessionStartIndex])
                .filter(date => date && date.trim())
                .map(date => new Date(date.trim()));

            const earliestDate = new Date(Math.min(...sessionDates));

            if (isNaN(earliestDate.getTime())) {
                throw new Error('Invalid date format in session_start_at column');
            }

            const data = rows.slice(1).map(row => {
                const rowData = {};
                headers.forEach((header, index) => {
                    const headerKey = header.trim().toLowerCase();
                    rowData[headerKey] = row[index]?.trim();
                });
                return rowData;
            });

            const playersInfos = processCSVData(data);

            const settlements = calculateSettlements(playersInfos);

            const gameData = {
                gameId: gameId,
                leagueId: selectedLeague,
                createdAt: earliestDate.toISOString(),
                updatedAt: new Date().toISOString(),
                playersInfos: playersInfos,
                settlements: settlements
            };

            const gameRef = doc(db, 'leagues', selectedLeague, 'games', gameId);
            await setDoc(gameRef, gameData);
            
            await fetchLeagueGames();
        } catch (error) {
            console.error('Error processing file:', error);
            alert(`Error uploading file: ${error.message}`);
        }
    };

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
            
            // Fetch games for the validated league
            fetchGames(selectedLeague);
            
            // Hide the league password component and show game selector
            setShowLeaguePassword(false);
            // Small delay for smooth fade-in transition
            setTimeout(() => {
                setShowGameSelector(true);
            }, 100);
            
        } catch (error) {
            console.error('Error validating league:', error);
            setLeagueError('Error validating league. Please try again.');
        }
    };

    // Add this function to fetch games when a league is validated
    const fetchLeagueGames = useCallback(async () => {
        if (!selectedLeague || !isLeagueValidated) return;
        
        try {
            const gamesRef = collection(db, 'leagues', selectedLeague, 'games');
            // Limit to last 100 games - frontend only displays games from last 7 days anyway
            // This significantly reduces database reads for leagues with many games
            const q = query(gamesRef, orderBy('createdAt', 'desc'), limit(100));
            const gamesSnapshot = await getDocs(q);
            
            const gamesData = gamesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            // Games are already sorted by the query, but keep this for safety
            gamesData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            
            // Track the query (limit(100) means it was limited)
            queryTracker.trackGamesFetch(gamesData.length, true);
            
            setGames(gamesData);
        } catch (error) {
            console.error('Error fetching league games:', error);
            setGamesError('Failed to load league games');
        }
    }, [selectedLeague, isLeagueValidated]);

    // Add this to your validateLeagueCode function, after validation succeeds
    useEffect(() => {
        if (isLeagueValidated && selectedLeague) {
            fetchLeagueGames();
        }
    }, [isLeagueValidated, selectedLeague, fetchLeagueGames]);

    const fetchGames = async (leagueId) => {
        if (!leagueId) return;
        
        setIsLoadingGames(true);
        setGamesError(null);
        
        try {
            const gamesRef = collection(db, 'leagues', leagueId, 'games');
            // Limit to last 100 games - frontend only displays games from last 7 days anyway
            // This significantly reduces database reads for leagues with many games
            const q = query(gamesRef, orderBy('createdAt', 'desc'), limit(100));
            const querySnapshot = await getDocs(q);
            
            const gamesList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            // Track the query (limit(100) means it was limited)
            queryTracker.trackGamesFetch(gamesList.length, true);
            
            setGames(gamesList);
        } catch (err) {
            console.error('Error fetching games:', err);
            setGamesError('Failed to load games. Please try again later.');
        } finally {
            setIsLoadingGames(false);
        }
    };

    // Add this handler to close the notification
    const handleCloseNotification = () => {
        setNotification(null);
    };

    useEffect(() => {
        setSelectedGame(null);
        setSelectedPlayer('');
    }, [selectedLeague]);

    // Also call fetchVenmoIds when a game is selected (fallback for older games)
    useEffect(() => {
        if (selectedGame) {
            // Handle both sessionResults (newer format) and playersInfos (older format)
            const playerData = selectedGame.sessionResults || selectedGame.playersInfos;
            if (playerData) {
                fetchVenmoIds(playerData);
            }
        }
    }, [selectedGame]);

    return (
        <>
            <Container 
                maxWidth="lg" 
                sx={{ 
                    mt: 4, 
                    mb: 4, 
                    flex: 1,
                    background: (theme) => theme.palette.mode === 'dark' 
                        ? 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(250, 250, 250, 0.04) 0%, transparent 50%)'
                        : undefined,
                }}
            >
                <Box sx={{ position: 'relative' }}>
                        {showLeaguePassword && (
                            <LeaguePassword 
                                selectedLeague={selectedLeague}
                                setSelectedLeague={setSelectedLeague}
                                isLeagueValidated={isLeagueValidated}
                                validateLeague={validateLeague}
                                leagueError={leagueError}
                                setLeagueError={setLeagueError}
                            />
                        )}
                        
                        <Fade 
                            in={showGameSelector} 
                            timeout={{ enter: 300, exit: 300 }}
                            style={{ transitionDelay: showGameSelector ? '200ms' : '0ms' }}
                            unmountOnExit
                        >
                            <Box>
                                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                                    <Typography variant="h5" component="h1" fontWeight={600}>
                                        Ledgers
                                    </Typography>
                                    <UploadGame 
                                        selectedLeague={selectedLeague}
                                        refreshGames={fetchGames}
                                        onResetSelectedGame={() => {
                                            setSelectedGame(null);
                                            setLedgerData(null);
                                            setVenmoIds({});
                                            setSelectedPlayer('');
                                            setShowGameList(true);
                                        }}
                                    />
                                </Box>

                                <Grid container spacing={3} alignItems="flex-start">
                                    {/* Left panel: Game selector + Player details */}
                                    <Grid item xs={12} md={selectedGame ? 4 : 12}>
                                        {selectedGame && (
                                            <Card sx={{ mb: 2 }} elevation={0}>
                                                <CardContent sx={{ py: 1.5 }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
                                                        <Box 
                                                            onClick={() => setShowGameList(!showGameList)}
                                                            sx={{ flex: 1, cursor: 'pointer', '@media (hover: hover)': { '&:hover': { opacity: 0.8 } } }}
                                                        >
                                                            <Typography variant="body1" fontWeight={500}>
                                                                {selectedGame.nickname || formatGameDateTime(selectedGame.startTime)}
                                                            </Typography>
                                                            <Typography variant="body2" color="text.secondary">
                                                                {formatGameDateTime(selectedGame.startTime)} • {selectedGame.sessionResults?.length || selectedGame.playersInfos?.length || 0} players
                                                            </Typography>
                                                        </Box>
                                                        <Button variant="outlined" onClick={() => setShowGameList(!showGameList)} size="small">
                                                            {showGameList ? 'Hide' : 'Change'}
                                                        </Button>
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                        )}
                                        {(!selectedGame || showGameList) && (
                                            <GameSelector 
                                                selectedGame={selectedGame}
                                                games={games}
                                                setSelectedGame={setSelectedGame}
                                                onGameSelect={(game) => {
                                                    setSelectedGame(game);
                                                    setShowGameList(false);
                                                }}
                                                setLedgerData={setLedgerData}
                                                processFile={processFile}
                                                selectedLeague={selectedLeague}
                                                refreshGames={fetchGames}
                                                isLoadingGames={isLoadingGames}
                                                gamesError={gamesError}
                                                setVenmoIds={setVenmoIds}
                                                setSelectedPlayer={setSelectedPlayer}
                                            />
                                        )}
                                        {selectedGame && !showGameList && (
                                            <PlayerDetails 
                                                selectedPlayer={selectedPlayer}
                                                setSelectedPlayer={setSelectedPlayer}
                                                ledgerData={ledgerData}
                                                venmoIds={venmoIds}
                                            />
                                        )}
                                    </Grid>

                                    {/* Right panel: Session results (desktop only when game selected) */}
                                    {selectedGame && ledgerData && (
                                        <Grid item xs={12} md={8}>
                                            <SessionResults 
                                                ledgerData={ledgerData}
                                                formatAmount={formatAmount}
                                                selectedGame={selectedGame}
                                                selectedPlayer={selectedPlayer}
                                                onSettleUp={handleSettleUp}
                                            />
                                        </Grid>
                                    )}
                                </Grid>
                            </Box>
                        </Fade>
                </Box>
            </Container>
            
            <Snackbar 
                    open={Boolean(notification)} 
                    autoHideDuration={6000} 
                    onClose={handleCloseNotification}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    {notification && (
                        <Alert 
                            onClose={handleCloseNotification} 
                            severity={notification.type}
                            variant="filled"
                            sx={{ width: '100%', borderRadius: 2 }}
                        >
                            {notification.message}
                        </Alert>
                    )}
                </Snackbar>
        </>
    );
};

export default PokerLedger;
