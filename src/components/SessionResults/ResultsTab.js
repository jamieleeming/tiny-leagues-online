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
    useTheme,
    useMediaQuery,
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
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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

    if (isMobile) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {sortedResults.map((result) => (
                    <Paper
                        key={result.id}
                        elevation={0}
                        sx={{
                            p: 2,
                            borderRadius: 2,
                            border: `1px solid ${theme.palette.divider}`,
                        }}
                    >
                        <Typography fontWeight={600} sx={{ mb: 1.5 }}>
                            {result.name}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, fontSize: '0.875rem' }}>
                            <Typography variant="body2" color="text.secondary">
                                Buy-in: {formatAmount(result.buyIn)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Cash out: {formatAmount(result.cashOut)}
                            </Typography>
                            <Typography
                                variant="body2"
                                fontWeight={700}
                                color={result.net > 0 ? 'success.main' : result.net < 0 ? 'error.main' : 'text.primary'}
                                sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                            >
                                {result.net > 0 ? <TrendingUpIcon fontSize="small" /> : null}
                                {result.net < 0 ? <TrendingDownIcon fontSize="small" /> : null}
                                Net: {formatAmount(result.net)}
                            </Typography>
                        </Box>
                    </Paper>
                ))}
            </Box>
        );
    }

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