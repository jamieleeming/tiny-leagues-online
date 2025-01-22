import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { 
    collection, 
    doc, 
    setDoc, 
    getDocs,
    query 
} from 'firebase/firestore';

function PokerLedger() {
    const [url, setUrl] = useState('');
    const [ledgerData, setLedgerData] = useState(null);
    const [error, setError] = useState(null);
    const [selectedPlayer, setSelectedPlayer] = useState('');
    const [venmoId, setVenmoId] = useState('');
    const [saveMessage, setSaveMessage] = useState(null);
    const [playerVenmoMap, setPlayerVenmoMap] = useState({});

    // Load Venmo IDs from Firebase on component mount
    useEffect(() => {
        const loadVenmoIds = async () => {
            console.log('Starting to load Venmo IDs...');
            try {
                if (!db) {
                    console.error('Firebase DB not initialized');
                    setSaveMessage({ 
                        type: 'error', 
                        text: 'Database connection error' 
                    });
                    return;
                }

                const venmoCollection = collection(db, 'venmoIds');
                const q = query(venmoCollection);
                const querySnapshot = await getDocs(q);
                
                const venmoData = {};
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    if (data.playerName && data.venmoId) {
                        venmoData[data.playerName] = data.venmoId;
                    }
                });
                
                setPlayerVenmoMap(venmoData);
            } catch (error) {
                console.error('Error loading Venmo IDs:', error);
                console.error('Error details:', {
                    message: error.message,
                    code: error.code,
                    stack: error.stack
                });
                setSaveMessage({ 
                    type: 'error', 
                    text: `Error loading saved Venmo IDs: ${error.message}` 
                });
            }
        };

        loadVenmoIds();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Extract the game ID from the full URL
            const gameId = url.split('/games/')[1]?.split('/')[0];
            if (!gameId) {
                throw new Error('Invalid URL format. Please provide a valid Poker Now game URL.');
            }

            // Use the proxy endpoint
            const formattedUrl = `/api/games/${gameId}/players_sessions`;

            const response = await fetch(formattedUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log('Received data:', data);
            setLedgerData(data);
            setError(null);
        } catch (err) {
            console.error('Fetch error:', err);
            setError('Error fetching data: ' + err.message);
            setLedgerData(null);
        }
    };

    const formatAmount = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount / 100);
    };

    const calculateSettlements = (playersInfos) => {
        // Create arrays of debtors and creditors
        let debtors = [];
        let creditors = [];

        Object.entries(playersInfos).forEach(([id, player]) => {
            if (player.net < 0) {
                debtors.push({ id, name: player.names[0], amount: -player.net });
            } else if (player.net > 0) {
                creditors.push({ id, name: player.names[0], amount: player.net });
            }
        });

        // Sort by amount (largest first)
        debtors.sort((a, b) => b.amount - a.amount);
        creditors.sort((a, b) => b.amount - a.amount);

        let settlements = [];

        while (debtors.length > 0 && creditors.length > 0) {
            const debtor = debtors[0];
            const creditor = creditors[0];

            const amount = Math.min(debtor.amount, creditor.amount);
            
            if (amount > 0) {
                settlements.push({
                    from: debtor.name,
                    to: creditor.name,
                    amount: amount
                });
            }

            debtor.amount -= amount;
            creditor.amount -= amount;

            if (debtor.amount === 0) debtors.shift();
            if (creditor.amount === 0) creditors.shift();
        }

        return settlements;
    };

    const handlePlayerSelect = (e) => {
        const playerId = e.target.value;
        setSelectedPlayer(playerId);
        
        // Get player name from ledgerData
        if (playerId && ledgerData) {
            const playerName = ledgerData.playersInfos[playerId].names[0];
            setVenmoId(playerVenmoMap[playerName] ? `@${playerVenmoMap[playerName]}` : '');
        } else {
            setVenmoId('');
        }
    };

    const handleVenmoIdChange = (e) => {
        setVenmoId(e.target.value);
    };

    const handleSaveSettings = async () => {
        if (!selectedPlayer) {
            setSaveMessage({ type: 'error', text: 'Please select a player first' });
            return;
        }
        if (!venmoId) {
            setSaveMessage({ type: 'error', text: 'Please enter your Venmo ID' });
            return;
        }

        // Additional validation
        const venmoIdRegex = /^@?[\w.-]+$/;
        if (!venmoIdRegex.test(venmoId)) {
            setSaveMessage({ type: 'error', text: 'Invalid Venmo ID format' });
            return;
        }

        // Rate limiting in the client
        const lastUpdateTime = localStorage.getItem('lastUpdateTime');
        const now = Date.now();
        if (lastUpdateTime && now - parseInt(lastUpdateTime) < 10000) {
            setSaveMessage({ type: 'error', text: 'Please wait a few seconds before trying again' });
            return;
        }

        try {
            const playerName = ledgerData.playersInfos[selectedPlayer].names[0];
            const cleanVenmoId = venmoId.replace('@', '');

            // Save to Firebase
            await setDoc(doc(db, 'venmoIds', selectedPlayer), {
                playerName: playerName,
                pokerNowId: selectedPlayer,
                venmoId: cleanVenmoId,
                updatedAt: new Date().toISOString()
            });

            // Update local rate limit
            localStorage.setItem('lastUpdateTime', now.toString());

            // Update local state
            setPlayerVenmoMap(prev => ({
                ...prev,
                [playerName]: cleanVenmoId
            }));

            setSaveMessage({ type: 'success', text: 'Settings saved successfully!' });
            setTimeout(() => {
                setSaveMessage(null);
            }, 3000);
        } catch (error) {
            console.error('Error saving Venmo ID:', error);
            setSaveMessage({ 
                type: 'error', 
                text: 'Error saving settings. Please try again.' 
            });
        }
    };

    const getSortedPlayers = (playersInfos) => {
        return Object.entries(playersInfos)
            .sort((a, b) => a[1].names[0].localeCompare(b[1].names[0]))
            .map(([id, player]) => ({
                id,
                name: player.names[0]
            }));
    };

    const getSortedResults = (playersInfos) => {
        return Object.entries(playersInfos)
            .sort((a, b) => b[1].net - a[1].net)
            .map(([id, player]) => ({
                id,
                name: player.names[0],
                buyIn: player.buyInSum,
                cashOut: player.buyOutSum,
                net: player.net
            }));
    };

    const getPlayerNameById = (playersInfos, id) => {
        return playersInfos[id]?.names[0] || '';
    };

    const handleSettleUp = (settlement) => {
        // Get the recipient's Venmo ID from the mapping
        const recipientVenmoId = playerVenmoMap[settlement.to];
        
        if (!recipientVenmoId) {
            alert(`No Venmo ID saved for ${settlement.to}. Please ask them to set up their Venmo ID.`);
            return;
        }

        // Convert amount from cents to dollars
        const cleanAmount = (settlement.amount / 100).toFixed(2);
        
        // Construct the Venmo URL
        const venmoUrl = `https://venmo.com/${recipientVenmoId}?txn=pay&note=TL%20Online&amount=${cleanAmount}`;
        
        // Open in new tab
        window.open(venmoUrl, '_blank');
    };

    return (
        <div className="poker-ledger">
            <nav className="navbar">
                <div className="navbar-content">
                    <div className="navbar-brand">
                        <svg 
                            className="navbar-logo" 
                            viewBox="0 0 40 40" 
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            {/* Circle background */}
                            <circle 
                                cx="20" 
                                cy="20" 
                                r="18" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="4"
                            />
                            
                            {/* Letters "TL" with increased weight */}
                            <text
                                x="20"
                                y="25"
                                fontSize="16"
                                fontWeight="900"
                                fill="currentColor"
                                textAnchor="middle"
                                fontFamily="Arial Black, Arial, sans-serif"
                            >
                                TL
                            </text>
                        </svg>
                        <h1>Tiny Leagues Online</h1>
                    </div>
                    {/* Add more nav items here in the future */}
                </div>
            </nav>
            
            <div className="main-content">
                <div className="search-form">
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="Enter your Poker Now game URL"
                    />
                    <button type="submit" onClick={handleSubmit}>Analyze Session</button>
                </div>

                {error && <div className="error">⚠️ {error}</div>}
                
                {ledgerData && (
                    <div className="ledger-table">
                        <h2>Player Settings</h2>
                        <div className="settings-content">
                            <div className="settings-group">
                                <label htmlFor="playerSelect">Select your player name:</label>
                                <select 
                                    id="playerSelect"
                                    value={selectedPlayer}
                                    onChange={handlePlayerSelect}
                                >
                                    <option value="">Select player...</option>
                                    {getSortedPlayers(ledgerData.playersInfos).map(player => (
                                        <option key={player.id} value={player.id}>
                                            {player.name}
                                        </option>
                                    ))}
                                </select>

                                <label htmlFor="venmoId">Your Venmo ID:</label>
                                <input
                                    id="venmoId"
                                    type="text"
                                    value={venmoId}
                                    onChange={handleVenmoIdChange}
                                    placeholder="@your-venmo-id"
                                />

                                <button onClick={handleSaveSettings} className="save-button">
                                    Save Settings
                                </button>
                            </div>
                            
                            {saveMessage && (
                                <span className={`save-message ${saveMessage.type}`}>
                                    {saveMessage.text}
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {selectedPlayer && ledgerData && (
                    <>
                        <div className="ledger-table">
                            <h2>Session Results</h2>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Player</th>
                                        <th>Buy In</th>
                                        <th>Cash Out</th>
                                        <th>Net P/L</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {getSortedResults(ledgerData.playersInfos).map(player => (
                                        <tr 
                                            key={player.id}
                                            className={player.id === selectedPlayer ? 'selected-player' : ''}
                                        >
                                            <td>{player.name}</td>
                                            <td>{formatAmount(player.buyIn)}</td>
                                            <td>{formatAmount(player.cashOut)}</td>
                                            <td className={player.net > 0 ? 'profit' : player.net < 0 ? 'loss' : ''}>
                                                {formatAmount(player.net)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td>Total</td>
                                        <td>{formatAmount(ledgerData.buyInTotal)}</td>
                                        <td>{formatAmount(ledgerData.buyOutTotal)}</td>
                                        <td>{formatAmount(ledgerData.buyOutTotal - ledgerData.buyInTotal)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        <div className="ledger-table">
                            <h2>Settlement</h2>
                            <table>
                                <thead>
                                    <tr>
                                        <th>From</th>
                                        <th></th>
                                        <th>To</th>
                                        <th>Amount</th>
                                        <th>Venmo</th>
                                        <th>Settle Up</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {calculateSettlements(ledgerData.playersInfos).map((settlement, index) => {
                                        const recipientVenmoId = playerVenmoMap[settlement.to];
                                        return (
                                            <tr key={index}>
                                                <td>{settlement.from}</td>
                                                <td className="arrow-cell">→</td>
                                                <td>{settlement.to}</td>
                                                <td>${Math.abs(settlement.amount / 100).toFixed(2)}</td>
                                                <td className="venmo-status">
                                                    {recipientVenmoId ? `@${recipientVenmoId}` : 'Not set'}
                                                </td>
                                                <td>
                                                    {ledgerData.playersInfos[selectedPlayer]?.names[0] === settlement.from && (
                                                        <button 
                                                            onClick={() => handleSettleUp(settlement)} 
                                                            disabled={!recipientVenmoId}
                                                        >
                                                            Settle Up
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {!selectedPlayer && ledgerData && (
                    <div className="select-player-message">
                        Please select your player name above to view session results and settlements.
                    </div>
                )}
            </div>
        </div>
    );
}

export default PokerLedger;
