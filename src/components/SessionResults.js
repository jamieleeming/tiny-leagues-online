import React, { useState } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Tabs,
    Tab
} from '@mui/material';
import { 
    AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { SettlementsTab } from './SessionResults/SettlementsTab';
import { ResultsTab } from './SessionResults/ResultsTab';

// TabPanel component
function TabPanel({ children, value, index, ...other }) {
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`session-tabpanel-${index}`}
            aria-labelledby={`session-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ pt: 2 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

export const SessionResults = ({ 
    ledgerData, 
    formatAmount, 
    selectedGame,
    selectedPlayer,
    onSettleUp
}) => {
    const [tabValue, setTabValue] = useState(0);

    if (!ledgerData || !Array.isArray(ledgerData)) {
        return null;
    }

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    return (
        <Card elevation={0}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Box sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'rgba(250, 250, 250, 0.08)',
                    }}>
                        <MoneyIcon sx={{ color: 'primary.main', fontSize: 22 }} />
                    </Box>
                    <Typography variant="subtitle1" component="h2" fontWeight={600}>
                        Results
                    </Typography>
                </Box>

                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 0 }}>
                    <Tabs 
                        value={tabValue} 
                        onChange={handleTabChange}
                        aria-label="session tabs"
                        sx={{
                            minHeight: 44,
                            '& .MuiTab-root': { fontWeight: 500, textTransform: 'none' },
                            '& .Mui-selected': { fontWeight: 600 }
                        }}
                    >
                        <Tab label="Settlements" />
                        <Tab label="Ledger" />
                    </Tabs>
                </Box>

                <TabPanel value={tabValue} index={0}>
                    <SettlementsTab 
                        settlements={selectedGame?.settlements}
                        formatAmount={formatAmount}
                        selectedPlayerId={selectedPlayer}
                        onSettleUp={onSettleUp}
                    />
                </TabPanel>

                <TabPanel value={tabValue} index={1}>
                    <ResultsTab 
                        ledgerData={ledgerData}
                        formatAmount={formatAmount}
                    />
                </TabPanel>
            </CardContent>
        </Card>
    );
}; 