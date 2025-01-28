import React, { useRef, useState } from 'react';
import {
    Box,
    Button,
    Snackbar,
    Alert,
    CircularProgress
} from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import { collection, setDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import Papa from 'papaparse';

export const UploadGame = ({ selectedLeague, refreshGames }) => {
    const fileInputRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

    const resetUploadState = () => {
        // Reset the file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        setIsUploading(false);
    };

    const extractGameId = (filename) => {
        // Extract gameId from "ledger_XXXX.csv" or "ledger_XXXX (1).csv"
        const match = filename.match(/ledger_([^.(\s]+)/);
        return match ? match[1] : null;
    };

    const calculateSettlements = (sessionResults) => {
        // Sort players by net amount (descending)
        const sortedPlayers = [...sessionResults].sort((a, b) => b.net - a.net);
        const settlements = [];

        let i = 0;  // index for winners (from start)
        let j = sortedPlayers.length - 1;  // index for losers (from end)

        while (i < j) {
            const winner = sortedPlayers[i];
            const loser = sortedPlayers[j];

            if (winner.net <= 0) break; // No more winners
            if (loser.net >= 0) break;  // No more losers

            const amount = Math.min(winner.net, -loser.net);
            
            settlements.push({
                amount,
                from: {
                    id: loser.id,
                    name: loser.name
                },
                to: {
                    id: winner.id,
                    name: winner.name
                },
                status: 'pending'
            });

            winner.net -= amount;
            loser.net += amount;

            if (winner.net === 0) i++;
            if (loser.net === 0) j--;
        }

        // Log settlements for verification
        console.log('Calculated settlements:', settlements.map(s => ({
            amount: s.amount,
            from: `${s.from.name} (${s.from.id})`,
            to: `${s.to.name} (${s.to.id})`
        })));

        return settlements;
    };

    const processCSV = async (file) => {
        setIsUploading(true);
        try {
            // Extract game ID from filename
            const gameId = extractGameId(file.name);
            if (!gameId) {
                throw new Error('Invalid file name format. Expected: ledger_GAMEID.csv');
            }

            const text = await file.text();
            const results = Papa.parse(text, { 
                header: true,
                skipEmptyLines: true,
                transformHeader: (header) => header.trim()
            });

            console.log('Raw CSV data:', results.data);

            if (results.errors.length > 0) {
                throw new Error(`CSV parsing errors: ${results.errors.map(e => e.message).join(', ')}`);
            }

            // Process session results
            const playerMap = new Map();

            // First pass: collect first nickname for each player and initialize totals
            results.data.forEach(row => {
                if (row.player_id && !playerMap.has(row.player_id)) {
                    playerMap.set(row.player_id, {
                        id: row.player_id,
                        name: row.player_nickname.trim(),
                        buyIn: 0,
                        cashOut: 0
                    });
                }
            });

            // Second pass: sum up the values
            results.data.forEach(row => {
                if (!row.player_id || !playerMap.has(row.player_id)) return;

                const player = playerMap.get(row.player_id);
                
                // Parse values, ensuring we handle negative numbers correctly
                const buyIn = parseInt(row.buy_in.replace(/[^\d-]/g, '')) || 0;
                const buyOut = parseInt(row.buy_out.replace(/[^\d-]/g, '')) || 0;
                const stack = parseInt(row.stack.replace(/[^\d-]/g, '')) || 0;

                player.buyIn += buyIn;
                player.cashOut += (buyOut || stack); // Use stack if buy_out is 0
            });

            // Create final session results with calculated net values
            const sessionResults = Array.from(playerMap.values()).map(player => {
                // Calculate net explicitly
                const calculatedNet = player.cashOut - player.buyIn;
                
                console.log(`Calculating net for ${player.name}:`, {
                    buyIn: player.buyIn,
                    cashOut: player.cashOut,
                    calculatedNet: calculatedNet,
                    calculation: `${player.cashOut} - ${player.buyIn} = ${calculatedNet}`
                });

                return {
                    id: player.id,
                    name: player.name,
                    buyIn: player.buyIn,
                    cashOut: player.cashOut,
                    net: calculatedNet  // Use the calculated net value
                };
            });

            // Verify the results immediately after creation
            console.log('Verifying session results:', 
                sessionResults.map(player => ({
                    name: player.name,
                    buyIn: player.buyIn,
                    cashOut: player.cashOut,
                    net: player.net,
                    verifyNet: player.cashOut - player.buyIn
                }))
            );

            // Find start and end times
            let startTime = null;
            let endTime = null;

            results.data.forEach(row => {
                if (row.session_start_at) {
                    const currentStart = new Date(row.session_start_at);
                    if (!startTime || currentStart < startTime) {
                        startTime = currentStart;
                    }
                }
                if (row.session_end_at) {
                    const currentEnd = new Date(row.session_end_at);
                    if (!endTime || currentEnd > endTime) {
                        endTime = currentEnd;
                    }
                }
            });

            // Calculate settlements
            const settlements = calculateSettlements([...sessionResults]);

            // Create game document with explicit net values
            const gameData = {
                id: gameId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                startTime: startTime ? startTime.toISOString() : null,
                endTime: endTime ? endTime.toISOString() : null,
                leagueId: selectedLeague,
                sessionResults: sessionResults.map(player => {
                    const calculatedNet = player.cashOut - player.buyIn;
                    return {
                        id: player.id,
                        name: player.name,
                        buyIn: player.buyIn,
                        cashOut: player.cashOut,
                        net: calculatedNet  // Explicitly calculate and include net
                    };
                }),
                settlements
            };

            // Verify the final data structure
            console.log('Verifying final gameData:', {
                id: gameData.id,
                sessionResults: gameData.sessionResults.map(player => ({
                    name: player.name,
                    buyIn: player.buyIn,
                    cashOut: player.cashOut,
                    net: player.net,
                    verifyCalculation: `${player.cashOut} - ${player.buyIn} = ${player.net}`
                }))
            });

            // Save to Firestore using the game ID from filename
            await setDoc(doc(db, 'leagues', selectedLeague, 'games', gameId), gameData);

            setNotification({
                open: true,
                message: 'Game data uploaded successfully',
                severity: 'success'
            });

            // Reset the upload state
            resetUploadState();
            
            // Refresh the games list
            refreshGames();
        } catch (error) {
            console.error('Error processing file:', error);
            setNotification({
                open: true,
                message: error.message || 'Error processing file',
                severity: 'error'
            });
            resetUploadState();
        }
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            processCSV(file);
        }
    };

    const handleCloseNotification = () => {
        setNotification({ ...notification, open: false });
    };

    return (
        <Box>
            <input
                type="file"
                accept=".csv"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
            />
            <Button
                variant="contained"
                startIcon={isUploading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
                onClick={() => fileInputRef.current.click()}
                disabled={isUploading || !selectedLeague}
            >
                Upload Game
            </Button>
            <Snackbar 
                open={notification.open} 
                autoHideDuration={6000} 
                onClose={handleCloseNotification}
            >
                <Alert 
                    onClose={handleCloseNotification} 
                    severity={notification.severity}
                >
                    {notification.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}; 