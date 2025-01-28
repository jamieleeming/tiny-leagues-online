import React from 'react';
import {
    Table,
    TableBody,
    TableContainer,
    TableHead,
    TableRow,
    Box,
    Paper,
    Typography
} from '@mui/material';
import { 
    TrendingUp as TrendingUpIcon, 
    TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import {
    HeaderCell,
    PlayerCell,
    NetCell,
    NetAmountBox,
    StyledTableRow
} from './ResultsTab.styles';

export const ResultsTab = ({ ledgerData, formatAmount }) => {
    if (!ledgerData || !Array.isArray(ledgerData)) {
        return (
            <Box sx={{ p: 2 }}>
                <Typography color="text.secondary">
                    No session results available.
                </Typography>
            </Box>
        );
    }
    
    // Calculate net for each player
    const resultsWithNet = ledgerData.map(player => ({
        ...player,
        net: player.cashOut - player.buyIn
    }));
    
    // Sort players by net amount (highest to lowest)
    const sortedResults = resultsWithNet.sort((a, b) => b.net - a.net);

    return (
        <TableContainer component={Paper} elevation={0}>
            <Table size="medium">
                <TableHead>
                    <TableRow>
                        <HeaderCell>Player</HeaderCell>
                        <HeaderCell align="right">Buy-in</HeaderCell>
                        <HeaderCell align="right">Cash Out</HeaderCell>
                        <HeaderCell align="right">Net</HeaderCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {sortedResults.map((result) => (
                        <StyledTableRow key={result.id}>
                            <PlayerCell>
                                {result.name}
                            </PlayerCell>
                            <PlayerCell align="right">
                                {formatAmount(result.buyIn)}
                            </PlayerCell>
                            <PlayerCell align="right">
                                {formatAmount(result.cashOut)}
                            </PlayerCell>
                            <NetCell 
                                align="right"
                                isPositive={result.net > 0}
                                isNegative={result.net < 0}
                            >
                                <NetAmountBox>
                                    {result.net > 0 ? (
                                        <TrendingUpIcon color="success" fontSize="small" />
                                    ) : result.net < 0 ? (
                                        <TrendingDownIcon color="error" fontSize="small" />
                                    ) : null}
                                    {formatAmount(result.net)}
                                </NetAmountBox>
                            </NetCell>
                        </StyledTableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}; 