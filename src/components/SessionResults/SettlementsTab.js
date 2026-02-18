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
    Button,
    useTheme,
    useMediaQuery,
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
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const filteredSettlements = selectedPlayerId && settlements
        ? settlements.filter(s => s.from?.id === selectedPlayerId || s.to?.id === selectedPlayerId)
        : [];

    const handleVenmoClick = (settlement) => {
        const isRequest = settlement.to.id === selectedPlayerId;
        onSettleUp(settlement, isRequest);
    };

    if (!selectedPlayerId) {
        return (
            <Box sx={{ p: 2 }}>
                <Typography color="text.secondary">
                    Select a player to see your settlements and make payments.
                </Typography>
            </Box>
        );
    }

    if (!settlements || settlements.length === 0) {
        return (
            <Box sx={{ p: 2 }}>
                <Typography color="text.secondary">
                    No settlements found for this session.
                </Typography>
            </Box>
        );
    }

    if (filteredSettlements.length === 0) {
        return (
            <Box sx={{ p: 2 }}>
                <Typography color="text.secondary">
                    No settlements for this player.
                </Typography>
            </Box>
        );
    }

    if (isMobile) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {filteredSettlements.map((settlement, index) => (
                    <Paper
                        key={`${settlement.from.id}-${settlement.to.id}-${index}`}
                        elevation={0}
                        sx={{
                            p: 2,
                            borderRadius: 2,
                            border: `1px solid ${theme.palette.divider}`,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1.5,
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography fontWeight={500}>{settlement.from.name}</Typography>
                            <EastIcon sx={{ color: 'text.secondary', fontSize: '1rem' }} />
                            <Typography fontWeight={500}>{settlement.to.name}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                                {formatAmount(settlement.amount)}
                            </Typography>
                            <Button
                                variant="contained"
                                size="small"
                                startIcon={<VenmoIcon sx={{ color: 'inherit' }} />}
                                onClick={() => handleVenmoClick(settlement)}
                                sx={{ flexShrink: 0 }}
                            >
                                Settle Up
                            </Button>
                        </Box>
                    </Paper>
                ))}
            </Box>
        );
    }

    return (
        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2, overflow: 'hidden' }}>
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
                    {filteredSettlements.map((settlement, index) => (
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
                                <IconButton
                                    size="small"
                                    onClick={() => handleVenmoClick(settlement)}
                                >
                                    <VenmoIcon />
                                </IconButton>
                            </PlayerCell>
                        </StyledTableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}; 