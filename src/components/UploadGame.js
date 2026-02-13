import React, { useRef, useState } from 'react';
import {
    Box,
    Button,
    Snackbar,
    Alert,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    FormGroup,
    FormControlLabel,
    Checkbox,
    Typography,
    Divider,
    Radio,
    TextField
} from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import { setDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import Papa from 'papaparse';

const NicknameModal = React.memo(({ 
    open, 
    onClose, 
    onContinue, 
    selectedFile, 
    nickname, 
    onNicknameChange, 
    error 
}) => (
    <Dialog 
        open={open} 
        onClose={onClose}
    >
        <DialogTitle>Game Details</DialogTitle>
        <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>
                Selected file: {selectedFile?.name}
            </Typography>
            <TextField
                fullWidth
                label="Game Nickname (optional)"
                value={nickname}
                onChange={onNicknameChange}
                error={!!error}
                helperText={error || 'Letters and numbers only, max 30 characters'}
                sx={{ mt: 1 }}
            />
        </DialogContent>
        <DialogActions>
            <Button onClick={onClose}>
                Cancel
            </Button>
            <Button 
                onClick={onContinue}
                disabled={!!error}
                variant="contained"
            >
                Continue
            </Button>
        </DialogActions>
    </Dialog>
));

export const UploadGame = ({ selectedLeague, refreshGames, onResetSelectedGame }) => {
    const fileInputRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
    const [showDuplicatesModal, setShowDuplicatesModal] = useState(false);
    const [potentialDuplicates, setPotentialDuplicates] = useState([]);
    const [selectedDuplicates, setSelectedDuplicates] = useState({});
    const [selectedNames, setSelectedNames] = useState({});
    const [parsedData, setParsedData] = useState(null);
    const [showNicknameModal, setShowNicknameModal] = useState(false);
    const [gameNickname, setGameNickname] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [nicknameError, setNicknameError] = useState('');
    const [currentGameId, setCurrentGameId] = useState(null);
    const [currentNickname, setCurrentNickname] = useState('');

    const resetUploadState = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        setIsUploading(false);
    };

    const extractGameId = (filename) => {
        if (!filename) {
            console.warn('extractGameId: filename is null or undefined');
            return null;
        }
        
        // Handle various filename formats:
        // - ledger_GAMEID.csv
        // - ledger_GAMEID (1).csv (iOS duplicate naming)
        // - ledger_GAMEID(1).csv
        // - ledger_GAMEID-1.csv
        // Case-sensitive matching to preserve exact game ID case
        const patterns = [
            /^ledger_(.+?)(?: \(\d+\))?\.csv$/,  // Standard format with optional iOS duplicate suffix
            /^ledger_(.+?)(?:\(\d+\))?\.csv$/,   // Without space before parentheses
            /^ledger_(.+?)(?:-\d+)?\.csv$/,      // With dash suffix
            /ledger_([^.(\s]+)/                  // Fallback: original pattern (case-sensitive)
        ];
        
        for (const pattern of patterns) {
            const match = filename.match(pattern);
            if (match && match[1]) {
                return match[1].trim();
            }
        }
        
        // Log the problematic filename for debugging
        console.warn('extractGameId: Could not extract game ID from filename:', filename);
        return null;
    };

    const calculateSettlements = (sessionResults) => {
        if (!sessionResults || !Array.isArray(sessionResults) || sessionResults.length === 0) {
            return [];
        }
        
        // Make a deep copy to avoid modifying the original
        const sortedPlayers = sessionResults.map(player => ({
            ...player,
            id: player.id || 'unknown',
            name: player.name || `Player ${player.id || 'unknown'}`,
            net: (player.cashOut || 0) - (player.buyIn || 0)
        })).sort((a, b) => b.net - a.net);
        
        console.log("Sorted players for settlements:", sortedPlayers);
        
        const settlements = [];

        let i = 0;
        let j = sortedPlayers.length - 1;

        while (i < j) {
            const winner = sortedPlayers[i];
            const loser = sortedPlayers[j];

            if (!winner || !loser) {
                console.error("Invalid winner or loser in settlement calculation", { winner, loser, i, j });
                break;
            }

            if (winner.net <= 0) break;
            if (loser.net >= 0) break;

            const amount = Math.min(winner.net, -loser.net);
            
            settlements.push({
                amount,
                from: { 
                    id: loser.id || 'unknown', 
                    name: loser.name || `Player ${loser.id || 'unknown'}`
                },
                to: { 
                    id: winner.id || 'unknown', 
                    name: winner.name || `Player ${winner.id || 'unknown'}`
                },
                status: 'pending'
            });

            winner.net -= amount;
            loser.net += amount;

            if (winner.net === 0) i++;
            if (loser.net === 0) j--;
        }

        return settlements;
    };

    const findPotentialDuplicates = (data) => {
        const normalizedGroups = data.reduce((groups, row) => {
            const name = row.player_nickname.trim();
            const variations = [
                name.toLowerCase(),
                name.toLowerCase().replace(/\s+/g, ''),
                name.toLowerCase().replace(/[0-9]/g, ''),
                name.toLowerCase().replace(/[\s0-9]/g, ''),
                name.toLowerCase().replace(/[^a-z]/g, ''),
                name.toLowerCase().replace(/[^a-z0-9]/g, ''),
                name.toLowerCase().replace(/[._\-'"]/g, ''),
                name.toLowerCase().replace(/[^a-z\s]/g, '').replace(/\s+/g, ''),
            ];

            const uniqueVariations = [...new Set(variations)];
            uniqueVariations.forEach(variant => {
                if (!groups[variant]) {
                    groups[variant] = [];
                }
                if (!groups[variant].find(p => p.player_id === row.player_id)) {
                    groups[variant].push({
                        player_id: row.player_id,
                        player_nickname: row.player_nickname.trim(),
                        normalized: variant
                    });
                }
            });
            return groups;
        }, {});

        // Add case-insensitive comparison
        const caseInsensitiveGroups = data.reduce((groups, row) => {
            const name = row.player_nickname.trim().toLowerCase();
            
            if (!groups[name]) {
                groups[name] = [];
            }
            if (!groups[name].find(p => p.player_id === row.player_id)) {
                groups[name].push({
                    player_id: row.player_id,
                    player_nickname: row.player_nickname.trim(),
                    normalized: name
                });
            }
            return groups;
        }, {});

        const subStringMatches = data.reduce((matches, row1) => {
            const name1 = row1.player_nickname.trim().toLowerCase();
            
            data.forEach(row2 => {
                if (row1.player_id !== row2.player_id) {
                    const name2 = row2.player_nickname.trim().toLowerCase();
                    
                    if (name1.includes(name2) || name2.includes(name1)) {
                        const key = [row1.player_id, row2.player_id].sort().join('|');
                        if (!matches.has(key)) {
                            matches.set(key, [{
                                player_id: row1.player_id,
                                player_nickname: row1.player_nickname.trim(),
                                normalized: name1
                            }, {
                                player_id: row2.player_id,
                                player_nickname: row2.player_nickname.trim(),
                                normalized: name2
                            }]);
                        }
                    }
                }
            });
            return matches;
        }, new Map());

        const potentialDuplicates = new Map();
        
        Object.values(normalizedGroups).forEach(group => {
            if (group.length > 1) {
                const key = group.map(p => p.player_id).sort().join('|');
                if (!potentialDuplicates.has(key)) {
                    potentialDuplicates.set(key, group);
                }
            }
        });

        // Add case-insensitive groups
        Object.values(caseInsensitiveGroups).forEach(group => {
            if (group.length > 1) {
                const key = group.map(p => p.player_id).sort().join('|');
                if (!potentialDuplicates.has(key)) {
                    potentialDuplicates.set(key, group);
                }
            }
        });

        subStringMatches.forEach((group, key) => {
            if (!potentialDuplicates.has(key)) {
                potentialDuplicates.set(key, group);
            }
        });

        return Array.from(potentialDuplicates.values());
    };

    const handleDuplicateSelection = (groupIndex, playerId, checked) => {
        setSelectedDuplicates(prev => ({
            ...prev,
            [groupIndex]: {
                ...prev[groupIndex],
                [playerId]: checked
            }
        }));
    };

    const handleNameSelection = (groupIndex, playerId, name) => {
        setSelectedNames(prev => ({
            ...prev,
            [groupIndex]: { playerId, name }
        }));
    };

    const processDuplicates = async () => {
        const idMappings = {};
        const nameMapping = {};
        
        for (const [groupIndex, selections] of Object.entries(selectedDuplicates)) {
            const selectedIds = Object.entries(selections)
                .filter(([_, isSelected]) => isSelected)
                .map(([id]) => id);
            
            if (selectedIds.length > 1) {
                try {
                    // Check if any of the IDs already have Venmo information
                    const existingVenmoPromises = selectedIds.map(async (playerId) => {
                        try {
                            // Check if player exists in the players collection
                            const venmoDoc = await getDoc(doc(db, 'players', playerId));
                            return {
                                playerId,
                                hasVenmo: venmoDoc.exists(),
                                venmoData: venmoDoc.exists() ? venmoDoc.data() : null
                            };
                        } catch (error) {
                            return { playerId, hasVenmo: false, venmoData: null };
                        }
                    });
                    
                    const venmoResults = await Promise.all(existingVenmoPromises);
                    
                    // Prioritize players that already have Venmo information
                    const playerWithVenmo = venmoResults.find(result => result.hasVenmo);
                    
                    // Use player with Venmo if found, otherwise use the first selected ID
                    const primaryId = playerWithVenmo ? playerWithVenmo.playerId : selectedIds[0];
                    
                    if (selectedNames[groupIndex]) {
                        // selectedNames now stores { playerId, name }, extract the name
                        nameMapping[primaryId] = selectedNames[groupIndex].name;
                    }
                    
                    selectedIds
                        .filter(id => id !== primaryId)
                        .forEach(id => {
                            idMappings[id] = primaryId;
                        });
                } catch (error) {
                    // Fallback to using the first ID if there's an error
                    const primaryId = selectedIds[0];
                    
                    if (selectedNames[groupIndex]) {
                        // selectedNames now stores { playerId, name }, extract the name
                        nameMapping[primaryId] = selectedNames[groupIndex].name;
                    }
                    
                    selectedIds
                        .filter(id => id !== primaryId)
                        .forEach(id => {
                            idMappings[id] = primaryId;
                        });
                }
            }
        }

        // Create a new processed data array with mapped IDs and names
        const processedData = parsedData.map(row => {
            if (!row || typeof row !== 'object') {
                return row;
            }
            
            const mappedId = idMappings[row.player_id];
            if (mappedId) {
                return {
                    ...row,
                    player_id: mappedId,
                    player_nickname: nameMapping[mappedId] || row.player_nickname
                };
            }
            if (nameMapping[row.player_id]) {
                return {
                    ...row,
                    player_nickname: nameMapping[row.player_id]
                };
            }
            return row;
        });

        // Make sure we reset the upload state if there's an error
        try {
            await processCSV(processedData);
            setShowDuplicatesModal(false);
        } catch (error) {
            setNotification({
                open: true,
                message: error.message || 'Error processing duplicates',
                severity: 'error'
            });
            resetUploadState();
        }
    };

    const processCSV = async (fileOrData) => {
        setIsUploading(true);
        try {
            let gameId;
            let data;

            if (Array.isArray(fileOrData)) {
                data = fileOrData;
                
                // Use the stored game ID for merged data
                if (currentGameId) {
                    gameId = currentGameId;
                } else {
                    // Fallback to extracting from file references
                    if (selectedFile) {
                        gameId = extractGameId(selectedFile.name);
                    }
                    
                    if (!gameId && fileInputRef.current && fileInputRef.current.files && fileInputRef.current.files[0]) {
                        gameId = extractGameId(fileInputRef.current.files[0].name);
                    }
                    
                    if (!gameId) {
                        gameId = 'game_' + Math.random().toString(36).substring(2, 15);
                    }
                }
            } else {
                if (!fileOrData || !fileOrData.name) {
                    console.error('processCSV: File object missing or has no name property', fileOrData);
                    throw new Error('Invalid file: missing file name');
                }
                
                // Log the filename for debugging mobile issues
                console.log('processCSV: Processing file with name:', fileOrData.name);
                
                gameId = extractGameId(fileOrData.name);
                
                if (!gameId) {
                    // Enhanced error message with the actual filename
                    console.error('processCSV: Failed to extract game ID from filename:', fileOrData.name);
                    throw new Error(`Invalid file name format. Expected: ledger_GAMEID.csv\nReceived: ${fileOrData.name}`);
                }
                
                // Store the game ID for later use
                setCurrentGameId(gameId);
                
                const text = await fileOrData.text();
                const results = Papa.parse(text, { 
                    header: true,
                    skipEmptyLines: true,
                    transformHeader: (header) => header.trim()
                });

                if (results.errors.length > 0) {
                    throw new Error(`CSV parsing errors: ${results.errors.map(e => e.message).join(', ')}`);
                }
                data = results.data;
            }

            if (!gameId) {
                // This should rarely happen now due to improved extractGameId, but keep as safety check
                const filename = Array.isArray(fileOrData) 
                    ? (selectedFile?.name || 'unknown') 
                    : (fileOrData?.name || 'unknown');
                console.error('processCSV: gameId is null after extraction. Filename:', filename);
                throw new Error(`Invalid file name format. Expected: ledger_GAMEID.csv\nReceived: ${filename}`);
            }

            // Check for potential duplicates before proceeding
            const duplicates = findPotentialDuplicates(data);
            if (duplicates.length > 0 && !Array.isArray(fileOrData)) {
                setPotentialDuplicates(duplicates);
                setParsedData(data);
                setShowDuplicatesModal(true);
                setIsUploading(false);
                return;
            }

            const playerMap = new Map();

            // First pass: create player entries with extra validation
            data.forEach(row => {
                if (!row || typeof row !== 'object') {
                    return;
                }
                
                if (row.player_id && !playerMap.has(row.player_id)) {
                    const playerName = row.player_nickname ? row.player_nickname.trim() : `Player ${row.player_id}`;
                    
                    playerMap.set(row.player_id, {
                        id: row.player_id,
                        name: playerName,
                        buyIn: 0,
                        cashOut: 0
                    });
                }
            });

            // Second pass: accumulate buy-ins and cash-outs with extra validation
            data.forEach(row => {
                if (!row || typeof row !== 'object') return;
                if (!row.player_id || !playerMap.has(row.player_id)) return;

                const player = playerMap.get(row.player_id);
                
                // Safely parse numeric values
                let buyIn = 0;
                let buyOut = 0;
                let stack = 0;
                
                try {
                    buyIn = parseInt(String(row.buy_in || '0').replace(/[^\d-]/g, '') || '0');
                    buyOut = parseInt(String(row.buy_out || '0').replace(/[^\d-]/g, '') || '0');
                    stack = parseInt(String(row.stack || '0').replace(/[^\d-]/g, '') || '0');
                } catch (e) {
                    buyIn = 0;
                    buyOut = 0;
                    stack = 0;
                }

                player.buyIn += buyIn;
                player.cashOut += (buyOut + stack);
            });

            const sessionResults = Array.from(playerMap.values()).map(player => ({
                id: player.id,
                name: player.name,
                buyIn: player.buyIn,
                cashOut: player.cashOut,
                net: player.cashOut - player.buyIn
            }));

            let startTime = null;
            let endTime = null;

            data.forEach(row => {
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

            const settlements = calculateSettlements([...sessionResults]);

            // Find the host (player with earliest start time)
            let hostPlayer = null;
            let earliestStartTime = null;

            data.forEach(row => {
                if (row.session_start_at) {
                    const startTime = new Date(row.session_start_at);
                    if (!earliestStartTime || startTime < earliestStartTime) {
                        earliestStartTime = startTime;
                        hostPlayer = row.player_nickname ? row.player_nickname.trim() : null;
                    }
                }
            });

            // Log session results and settlements for debugging
            console.log("Final session results:", sessionResults);
            console.log("Calculated settlements:", settlements);

            const gameData = {
                id: gameId,
                nickname: currentNickname?.trim() || gameNickname?.trim() || (hostPlayer ? `${hostPlayer}'s Game` : `Game ${gameId}`),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                startTime: startTime ? startTime.toISOString() : null,
                endTime: endTime ? endTime.toISOString() : null,
                leagueId: selectedLeague,
                sessionResults: sessionResults.map(player => ({
                    id: player.id || 'unknown',
                    name: player.name || `Player ${player.id || 'unknown'}`,
                    buyIn: player.buyIn || 0,
                    cashOut: player.cashOut || 0,
                    net: (player.cashOut || 0) - (player.buyIn || 0)
                })),
                settlements: settlements.map(settlement => ({
                    amount: settlement.amount,
                    from: { 
                        id: settlement.from?.id || 'unknown', 
                        name: settlement.from?.name || 'Unknown Player' 
                    },
                    to: { 
                        id: settlement.to?.id || 'unknown', 
                        name: settlement.to?.name || 'Unknown Player' 
                    },
                    status: settlement.status || 'pending'
                }))
            };

            console.log("Final game data with nickname:", currentNickname, gameNickname, gameData.nickname);

            await setDoc(doc(db, 'leagues', selectedLeague, 'games', gameId), gameData);

            // Reset all states and refresh data
            resetUploadState();
            setSelectedDuplicates({});
            setSelectedNames({});
            setPotentialDuplicates([]);
            setParsedData(null);
            
            // Reset selected game and refresh games list
            onResetSelectedGame?.();
            await refreshGames();

            setNotification({
                open: true,
                message: 'Ledger uploaded successfully',
                severity: 'success'
            });

        } catch (error) {
            setNotification({
                open: true,
                message: error.message || 'Error processing file',
                severity: 'error'
            });
            resetUploadState();
            setSelectedFile(null);
        }
    };

    const validateNickname = (value) => {
        const trimmedValue = value.trim();
        if (trimmedValue.length > 30) {
            return 'Nickname must be 30 characters or less';
        }
        if (trimmedValue && !/^[a-zA-Z0-9\s]*$/.test(trimmedValue)) {
            return 'Only letters, numbers, and spaces allowed';
        }
        return '';
    };

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        setSelectedFile(file);
        setShowNicknameModal(true);

        // Reset the file input value so the same file can be selected again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleNicknameChange = (e) => {
        const value = e.target.value;
        setGameNickname(value);
        setCurrentNickname(value);
        setNicknameError(validateNickname(value));
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
                Upload Ledger
            </Button>
            
            <NicknameModal 
                open={showNicknameModal}
                onClose={() => {
                    setShowNicknameModal(false);
                    setSelectedFile(null);
                    setNicknameError('');
                }}
                onContinue={() => {
                    setShowNicknameModal(false);
                    processCSV(selectedFile);
                }}
                selectedFile={selectedFile}
                nickname={gameNickname}
                onNicknameChange={handleNicknameChange}
                error={nicknameError}
            />
            
            <Dialog 
                open={showDuplicatesModal} 
                maxWidth="md" 
                fullWidth
                onClose={() => setShowDuplicatesModal(false)}
            >
                <DialogTitle>
                    Combine Player Records
                </DialogTitle>
                <DialogContent>
                    <Typography sx={{ mb: 2 }}>
                        Select records that belong to the same player and choose the preferred name:
                    </Typography>
                    {potentialDuplicates.map((group, groupIndex) => (
                        <Box key={groupIndex} sx={{ mb: 3 }}>
                            <Typography variant="subtitle1" sx={{ mb: 1 }}>
                                Player Group {groupIndex + 1}
                            </Typography>
                            <Box sx={{ display: 'flex', mb: 2 }}>
                                <Typography sx={{ flex: 1 }}>Select records to combine</Typography>
                                <Typography sx={{ width: 120, textAlign: 'center' }}>
                                    Use this name
                                </Typography>
                            </Box>
                            <FormControl component="fieldset" sx={{ width: '100%' }}>
                                <FormGroup>
                                    {group.map((player) => (
                                        <Box 
                                            key={player.player_id} 
                                            sx={{ 
                                                display: 'flex', 
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                mb: 1
                                            }}
                                        >
                                            <FormControlLabel
                                                sx={{ flex: 1 }}
                                                control={
                                                    <Checkbox
                                                        checked={selectedDuplicates[groupIndex]?.[player.player_id] || false}
                                                        onChange={(e) => handleDuplicateSelection(
                                                            groupIndex,
                                                            player.player_id,
                                                            e.target.checked
                                                        )}
                                                    />
                                                }
                                                label={`${player.player_nickname} (ID: ${player.player_id})`}
                                            />
                                            <Box sx={{ width: 120, display: 'flex', justifyContent: 'center' }}>
                                                {selectedDuplicates[groupIndex]?.[player.player_id] && (
                                                    <Radio
                                                        checked={selectedNames[groupIndex]?.playerId === player.player_id}
                                                        onChange={() => handleNameSelection(groupIndex, player.player_id, player.player_nickname)}
                                                    />
                                                )}
                                            </Box>
                                        </Box>
                                    ))}
                                </FormGroup>
                            </FormControl>
                            <Divider sx={{ my: 2 }} />
                        </Box>
                    ))}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {
                        setShowDuplicatesModal(false);
                        setSelectedDuplicates({});
                        setSelectedNames({});
                    }}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={processDuplicates} 
                        variant="contained"
                        disabled={Object.keys(selectedDuplicates).length === 0}
                    >
                        Combine & Continue
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={notification.open}
                autoHideDuration={6000}
                onClose={() => setNotification({ ...notification, open: false })}
            >
                <Alert 
                    onClose={() => setNotification({ ...notification, open: false })} 
                    severity={notification.severity}
                >
                    {notification.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}; 