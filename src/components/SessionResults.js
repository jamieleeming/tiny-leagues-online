import React, { useState } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Tabs,
    Tab,
    useTheme
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
    const theme = useTheme();
    const [tabValue, setTabValue] = useState(0);

    if (!ledgerData || !Array.isArray(ledgerData)) {
        return null;
    }

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    return (
        <Card sx={{ mt: 2 }}>
            <CardContent>
                <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1, 
                    mb: 2
                }}>
                    <MoneyIcon color="primary" />
                    <Typography variant="h6" component="h2">
                        Results
                    </Typography>
                </Box>

                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs 
                        value={tabValue} 
                        onChange={handleTabChange}
                        aria-label="session tabs"
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