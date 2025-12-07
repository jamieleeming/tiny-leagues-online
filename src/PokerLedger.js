import React, { useState, useEffect, useCallback } from 'react';
import { db } from './firebase';
import { 
    collection, 
    doc, 
    setDoc, 
    getDocs,
    getDoc,
    query,
    orderBy
} from 'firebase/firestore';
import { Header } from './components/Header';
import { LeaguePassword } from './components/LeaguePassword';
import { GameSelector } from './components/GameSelector';
import { PlayerDetails } from './components/PlayerDetails';
import { SessionResults } from './components/SessionResults';
import { 
    ThemeProvider, 
    createTheme, 
    CssBaseline, 
    Container, 
    Fade, 
    Box, 
    Alert, 
    Snackbar, 
    useMediaQuery 
} from '@mui/material';
import { hasLeagueAccess, saveLeagueAccess } from './utils/leagueAuth';

// Move theme creation inside the component to access system preference
const PokerLedger = () => {
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
    const [manualDarkMode, setManualDarkMode] = useState(null);
    const isDarkMode = manualDarkMode ?? prefersDarkMode;

    // Simplify theme to only what we're using
    const theme = React.useMemo(
        () =>
            createTheme({
                palette: {
                    mode: isDarkMode ? 'dark' : 'light',
                }
            }),
        [isDarkMode]
    );

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
        if (!playersInfos) return;
        
        try {
            const venmoData = {};
            for (const player of playersInfos) {
                const venmoDoc = await getDoc(doc(db, 'venmoIds', player.id));
                if (venmoDoc.exists()) {
                    // Store using player ID as key instead of name
                    venmoData[player.id] = venmoDoc.data().venmoId;
                }
            }
            setVenmoIds(venmoData);
        } catch (error) {
            console.error('Error fetching Venmo IDs:', error);
        }
    };


    const getSortedPlayers = (ledgerData) => {
        if (!ledgerData?.playersInfos) return [];
        return [...ledgerData.playersInfos].sort((a, b) => (b.stack || 0) - (a.stack || 0));
    };

    const getSortedResults = (players) => {
        if (!players || !Array.isArray(players)) return [];
        return players.map(player => ({
            name: player.name || '',
            stack: player.stack || 0,
            totalBuyIn: player.totalBuyIn || 0,
            net: (player.stack || 0) - (player.totalBuyIn || 0)
        })).sort((a, b) => b.net - a.net);
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
        
        // Format the game start date
        let dateString = '';
        if (selectedGame?.startTime) {
            const gameDate = new Date(selectedGame.startTime);
            dateString = gameDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        }
        
        // Create the note with date if available
        const noteText = dateString 
            ? `TL Online - ${dateString}`
            : 'TL Online';
        const encodedNote = encodeURIComponent(noteText);
        
        const venmoUrl = `https://venmo.com/${recipientVenmoId}?txn=${isRequest ? 'request' : 'pay'}&note=${encodedNote}&amount=${cleanAmount}`;
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

    const players = getSortedPlayers(selectedGame);

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
            
            // After a delay, hide the league password component
            setTimeout(() => {
                setShowLeaguePassword(false);
                setTimeout(() => {
                    setShowGameSelector(true);
                }, 300);
            }, 2000);
            
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
            const gamesSnapshot = await getDocs(gamesRef);
            
            const gamesData = gamesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            // Sort games by createdAt date, most recent first
            gamesData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            
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
            const q = query(gamesRef, orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            
            const gamesList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
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

    // Also call fetchVenmoIds when a game is selected
    useEffect(() => {
        if (selectedGame?.playersInfos) {
            fetchVenmoIds(selectedGame.playersInfos);
        }
    }, [selectedGame]);

    const toggleDarkMode = () => {
        setManualDarkMode(prev => 
            prev === null ? !prefersDarkMode : !prev
        );
    };

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                <Header 
                    isDarkMode={isDarkMode}
                    onToggleDarkMode={toggleDarkMode}
                />
                <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flex: 1 }}>
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
                            timeout={{
                                enter: 300,
                                exit: 300
                            }}
                            style={{ 
                                transitionDelay: showGameSelector ? '200ms' : '0ms'
                            }}
                            unmountOnExit
                        >
                            <div>
                                <GameSelector 
                                    selectedGame={selectedGame}
                                    games={games}
                                    setSelectedGame={setSelectedGame}
                                    setLedgerData={setLedgerData}
                                    processFile={processFile}
                                    selectedLeague={selectedLeague}
                                    refreshGames={fetchGames}
                                    isLoadingGames={isLoadingGames}
                                    gamesError={gamesError}
                                    setVenmoIds={setVenmoIds}
                                    setSelectedPlayer={setSelectedPlayer}
                                />
                                <Fade 
                                    in={Boolean(selectedGame)} 
                                    unmountOnExit
                                    timeout={500}
                                >
                                    <div>
                                        <PlayerDetails 
                                            selectedPlayer={selectedPlayer}
                                            setSelectedPlayer={setSelectedPlayer}
                                            ledgerData={ledgerData}
                                            venmoIds={venmoIds}
                                        />
                                    </div>
                                </Fade>
                                <Fade 
                                    in={Boolean(selectedPlayer)} 
                                    unmountOnExit
                                    timeout={500}
                                >
                                    <div>
                                        <SessionResults 
                                            ledgerData={ledgerData}
                                            formatAmount={formatAmount}
                                            selectedGame={selectedGame}
                                            selectedPlayer={selectedPlayer}
                                            onSettleUp={handleSettleUp}
                                        />
                                    </div>
                                </Fade>
                            </div>
                        </Fade>
                    </Box>
                </Container>
                
                {/* Add this near the end of your JSX, before the closing ThemeProvider */}
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
                            sx={{ width: '100%' }}
                        >
                            {notification.message}
                        </Alert>
                    )}
                </Snackbar>
            </div>
        </ThemeProvider>
    );
};

export default PokerLedger;
