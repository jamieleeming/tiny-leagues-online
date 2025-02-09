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
import { collection, setDoc, doc, getDoc } from 'firebase/firestore';
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

    const resetUploadState = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        setIsUploading(false);
    };

    const extractGameId = (filename) => {
        const match = filename.match(/ledger_([^.(\s]+)/);
        return match ? match[1] : null;
    };

    const calculateSettlements = (sessionResults) => {
        const sortedPlayers = [...sessionResults].sort((a, b) => b.net - a.net);
        const settlements = [];

        let i = 0;
        let j = sortedPlayers.length - 1;

        while (i < j) {
            const winner = sortedPlayers[i];
            const loser = sortedPlayers[j];

            if (winner.net <= 0) break;
            if (loser.net >= 0) break;

            const amount = Math.min(winner.net, -loser.net);
            
            settlements.push({
                amount,
                from: { id: loser.id, name: loser.name },
                to: { id: winner.id, name: winner.name },
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

    const handleNameSelection = (groupIndex, name) => {
        setSelectedNames(prev => ({
            ...prev,
            [groupIndex]: name
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
                    const venmoPromises = selectedIds.map(async (playerId) => {
                        const venmoDoc = await getDoc(doc(db, 'venmo_ids', playerId));
                        return {
                            playerId,
                            hasVenmo: venmoDoc.exists(),
                            venmoData: venmoDoc.data()
                        };
                    });
                    
                    const venmoResults = await Promise.all(venmoPromises);
                    const playerWithVenmo = venmoResults.find(result => result.hasVenmo);
                    const primaryId = playerWithVenmo ? playerWithVenmo.playerId : selectedIds[0];
                    
                    if (selectedNames[groupIndex]) {
                        nameMapping[primaryId] = selectedNames[groupIndex];
                    }
                    
                    selectedIds
                        .filter(id => id !== primaryId)
                        .forEach(id => {
                            idMappings[id] = primaryId;
                        });
                } catch (error) {
                    const primaryId = selectedIds[0];
                    if (selectedNames[groupIndex]) {
                        nameMapping[primaryId] = selectedNames[groupIndex];
                    }
                    selectedIds.slice(1).forEach(id => {
                        idMappings[id] = primaryId;
                    });
                }
            }
        }

        const processedData = parsedData.map(row => {
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

        processCSV(processedData);
        setShowDuplicatesModal(false);
    };

    const processCSV = async (fileOrData) => {
        setIsUploading(true);
        try {
            let gameId;
            let data;

            if (Array.isArray(fileOrData)) {
                data = fileOrData;
                gameId = extractGameId(fileInputRef.current.files[0].name);
            } else {
                gameId = extractGameId(fileOrData.name);
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
                throw new Error('Invalid file name format. Expected: ledger_GAMEID.csv');
            }

            const playerMap = new Map();

            data.forEach(row => {
                if (row.player_id && !playerMap.has(row.player_id)) {
                    playerMap.set(row.player_id, {
                        id: row.player_id,
                        name: row.player_nickname.trim(),
                        buyIn: 0,
                        cashOut: 0
                    });
                }
            });

            data.forEach(row => {
                if (!row.player_id || !playerMap.has(row.player_id)) return;

                const player = playerMap.get(row.player_id);
                const buyIn = parseInt(row.buy_in.replace(/[^\d-]/g, '')) || 0;
                const buyOut = parseInt(row.buy_out.replace(/[^\d-]/g, '')) || 0;
                const stack = parseInt(row.stack.replace(/[^\d-]/g, '')) || 0;

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
                        hostPlayer = row.player_nickname.trim();
                    }
                }
            });

            const gameData = {
                id: gameId,
                nickname: gameNickname?.trim() || (hostPlayer ? `${hostPlayer}'s Game` : null),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                startTime: startTime ? startTime.toISOString() : null,
                endTime: endTime ? endTime.toISOString() : null,
                leagueId: selectedLeague,
                sessionResults,
                settlements
            };

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
                message: 'Game data uploaded successfully',
                severity: 'success'
            });

        } catch (error) {
            setNotification({
                open: true,
                message: error.message || 'Error processing file',
                severity: 'error'
            });
            resetUploadState();
            setGameNickname('');
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
            
            <NicknameModal 
                open={showNicknameModal}
                onClose={() => {
                    setShowNicknameModal(false);
                    setGameNickname('');
                    setSelectedFile(null);
                    setNicknameError('');
                }}
                onContinue={() => {
                    setShowNicknameModal(false);
                    processCSV(selectedFile);
                    setGameNickname('');
                }}
                selectedFile={selectedFile}
                nickname={gameNickname}
                onNicknameChange={(e) => {
                    const value = e.target.value;
                    setGameNickname(value);
                    setNicknameError(validateNickname(value));
                }}
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
                                                        checked={selectedNames[groupIndex] === player.player_nickname}
                                                        onChange={() => handleNameSelection(groupIndex, player.player_nickname)}
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