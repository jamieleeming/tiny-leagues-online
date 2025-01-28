import React from 'react';
import {
    Table,
    TableBody,
    TableContainer,
    TableHead,
    TableRow,
    Box,
    Paper,
    Typography,
    IconButton,
} from '@mui/material';
import { VenmoIcon } from '../icons/VenmoIcon';
import { East as EastIcon } from '@mui/icons-material';
import {
    HeaderCell,
    PlayerCell,
    StyledTableRow
} from './ResultsTab.styles';

export const SettlementsTab = ({ 
    settlements, 
    formatAmount, 
    selectedPlayerId,
    onSettleUp
}) => {
    if (!settlements || settlements.length === 0) {
        return (
            <Box sx={{ p: 2 }}>
                <Typography color="text.secondary">
                    No settlements found for this session.
                </Typography>
            </Box>
        );
    }

    const showActionButton = (settlement) => {
        if (!selectedPlayerId || !settlement) return false;
        return (settlement.from?.id === selectedPlayerId || 
                settlement.to?.id === selectedPlayerId);
    };

    const handleVenmoClick = (settlement) => {
        const isRequest = settlement.to.id === selectedPlayerId;
        onSettleUp(settlement, isRequest);
    };

    return (
        <TableContainer component={Paper} elevation={0}>
            <Table size="medium">
                <TableHead>
                    <TableRow>
                        <HeaderCell>From</HeaderCell>
                        <HeaderCell sx={{ width: '50px', padding: '6px' }} />
                        <HeaderCell>To</HeaderCell>
                        <HeaderCell align="right">Amount</HeaderCell>
                        <HeaderCell align="right">Settle Up</HeaderCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {settlements.map((settlement, index) => (
                        <StyledTableRow 
                            key={`${settlement.from.id}-${settlement.to.id}-${index}`}
                        >
                            <PlayerCell>
                                <Typography>
                                    {settlement.from.name}
                                </Typography>
                            </PlayerCell>
                            <PlayerCell sx={{ width: '50px', padding: '6px' }}>
                                <EastIcon 
                                    sx={{ 
                                        color: 'text.secondary',
                                        fontSize: '1.2rem'
                                    }} 
                                />
                            </PlayerCell>
                            <PlayerCell>
                                <Typography>
                                    {settlement.to.name}
                                </Typography>
                            </PlayerCell>
                            <PlayerCell align="right">
                                <Typography>
                                    {formatAmount(settlement.amount)}
                                </Typography>
                            </PlayerCell>
                            <PlayerCell align="right">
                                {showActionButton(settlement) && (
                                    <IconButton
                                        size="small"
                                        onClick={() => handleVenmoClick(settlement)}
                                    >
                                        <VenmoIcon />
                                    </IconButton>
                                )}
                            </PlayerCell>
                        </StyledTableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}; 