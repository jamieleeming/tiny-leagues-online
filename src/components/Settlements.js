import React from 'react';
import {
    Card,
    CardContent,
    Typography,
    List,
    ListItem,
    ListItemText,
    Box,
    Divider,
    useTheme,
    Paper,
    Alert
} from '@mui/material';
import {
    SwapHoriz as SwapIcon,
    Payment as PaymentIcon
} from '@mui/icons-material';

export const Settlements = ({ ledgerData, formatAmount }) => {
    const theme = useTheme();

    if (!ledgerData || !Array.isArray(ledgerData)) {
        return null;
    }

    const calculateSettlements = (playersInfos) => {
        const sortedPlayers = [...playersInfos].sort((a, b) => b.net - a.net);
        const settlements = [];
        let i = 0;
        let j = sortedPlayers.length - 1;

        while (i < j) {
            const winner = sortedPlayers[i];
            const loser = sortedPlayers[j];

            if (winner.net <= 0 || loser.net >= 0) break;

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

        return settlements;
    };

    const settlements = calculateSettlements(ledgerData);

    return (
        <Card sx={{ mt: 2 }}>
            <CardContent>
                <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1, 
                    mb: 3 
                }}>
                    <PaymentIcon color="primary" />
                    <Typography variant="h6" component="h2">
                        Settlements
                    </Typography>
                </Box>

                {settlements.length === 0 ? (
                    <Alert severity="info" sx={{ mt: 1 }}>
                        No settlements needed for this session.
                    </Alert>
                ) : (
                    <Paper 
                        elevation={0}
                        sx={{ 
                            backgroundColor: theme.palette.grey[50],
                            borderRadius: 1
                        }}
                    >
                        <List>
                            {settlements.map((settlement, index) => (
                                <React.Fragment key={`${settlement.from}-${settlement.to}`}>
                                    {index > 0 && <Divider />}
                                    <ListItem
                                        sx={{
                                            '@media (hover: hover)': {
                                                '&:hover': {
                                                    backgroundColor: theme.palette.action.hover,
                                                },
                                            },
                                            transition: 'background-color 0.2s'
                                        }}
                                    >
                                        <ListItemText>
                                            <Box sx={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: 1,
                                                flexWrap: 'wrap'
                                            }}>
                                                <Typography 
                                                    component="span" 
                                                    sx={{ 
                                                        fontWeight: 500,
                                                        color: theme.palette.error.main
                                                    }}
                                                >
                                                    {settlement.from}
                                                </Typography>
                                                <SwapIcon 
                                                    sx={{ 
                                                        color: theme.palette.text.secondary,
                                                        mx: 1
                                                    }} 
                                                />
                                                <Typography 
                                                    component="span"
                                                    sx={{ 
                                                        fontWeight: 500,
                                                        color: theme.palette.success.main
                                                    }}
                                                >
                                                    {settlement.to}
                                                </Typography>
                                                <Typography 
                                                    component="span"
                                                    sx={{ 
                                                        ml: 'auto',
                                                        fontWeight: 'bold'
                                                    }}
                                                >
                                                    {formatAmount(settlement.amount)}
                                                </Typography>
                                            </Box>
                                        </ListItemText>
                                    </ListItem>
                                </React.Fragment>
                            ))}
                        </List>
                    </Paper>
                )}
            </CardContent>
        </Card>
    );
}; 