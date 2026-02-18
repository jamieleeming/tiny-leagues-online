import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Box,
    Card,
    CardContent,
    Fade,
    Divider
} from '@mui/material';
import { db } from '../firebase';
import { getDoc, doc } from 'firebase/firestore';
import { hasLeagueAccess, saveLeagueAccess } from '../utils/leagueAuth';
import { LeaguePassword } from './LeaguePassword';

export const Rules = () => {
    const [fadeIn, setFadeIn] = useState(false);
    const [selectedLeague, setSelectedLeague] = useState('');
    const [isLeagueValidated, setIsLeagueValidated] = useState(false);
    const [leagueError, setLeagueError] = useState(null);
    const [showLeaguePassword, setShowLeaguePassword] = useState(false);

    // Check for league access on mount
    useEffect(() => {
        const storedLeague = localStorage.getItem('lastLeague');
        if (storedLeague && hasLeagueAccess(storedLeague)) {
            setSelectedLeague(storedLeague);
            setIsLeagueValidated(true);
            setShowLeaguePassword(false);
            setFadeIn(true);
        } else {
            setShowLeaguePassword(true);
        }
    }, []);

    const validateLeague = async () => {
        if (!selectedLeague) return;
        
        try {
            // Check if league exists in Firestore
            const leagueDoc = await getDoc(doc(db, 'leagues', selectedLeague));
            
            if (!leagueDoc.exists()) {
                setLeagueError('League not found. Please check the code and try again.');
                return;
            }
            
            // League exists, save access token
            saveLeagueAccess(selectedLeague);
            
            // Store the last used league for convenience
            localStorage.setItem('lastLeague', selectedLeague);
            
            setIsLeagueValidated(true);
            setLeagueError(null);
            
            // Hide the league password component and show content immediately
            setShowLeaguePassword(false);
            setFadeIn(true);
            
        } catch (error) {
            console.error('Error validating league:', error);
            setLeagueError('Error validating league. Please try again.');
        }
    };

    const handleValidationComplete = () => {
        // This callback is called after the fade-out animation completes
        // No action needed here
    };

    // Show league password if not validated
    if (showLeaguePassword || !isLeagueValidated || !selectedLeague) {
        return (
            <Container 
                maxWidth="lg" 
                sx={{ 
                    mt: 4, 
                    mb: 4,
                    background: (theme) => theme.palette.mode === 'dark' 
                        ? 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(250, 250, 250, 0.04) 0%, transparent 50%)'
                        : undefined,
                }}
            >
                <LeaguePassword 
                    selectedLeague={selectedLeague}
                    setSelectedLeague={setSelectedLeague}
                    isLeagueValidated={isLeagueValidated}
                    validateLeague={validateLeague}
                    leagueError={leagueError}
                    setLeagueError={setLeagueError}
                    onValidationComplete={handleValidationComplete}
                />
            </Container>
        );
    }

    return (
        <Container 
            maxWidth="lg" 
            sx={{ 
                mt: 4, 
                mb: 4,
                background: (theme) => theme.palette.mode === 'dark' 
                    ? 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(250, 250, 250, 0.04) 0%, transparent 50%)'
                    : undefined,
            }}
        >
            <Fade 
                in={fadeIn} 
                timeout={{
                    enter: 300,
                    exit: 300
                }}
                style={{ 
                    transitionDelay: fadeIn ? '200ms' : '0ms'
                }}
            >
                <div>
                    <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, minHeight: 40 }}>
                        <Typography variant="h5" component="h1" fontWeight={600}>
                            Rules
                        </Typography>
                    </Box>
                    <Card elevation={0}>
                        <CardContent sx={{ 
                            textAlign: 'left', 
                            p: 4,
                            '& a': {
                                color: 'primary.main',
                                textDecoration: 'underline',
                                textUnderlineOffset: 2,
                                '&:visited': {
                                    color: 'primary.main',
                                },
                                '&:hover': {
                                    color: 'primary.light',
                                },
                            },
                        }}>
                            <Typography variant="h5" component="h2" gutterBottom fontWeight={600}>
                                👋 Welcome to Tiny Leagues Online (Invite-Only)
                            </Typography>

                            <Typography variant="body1" sx={{ mb: 4 }}>
                                This is a private, admin-approved community. You MUST be in the Tiny Leagues WhatsApp group to play.
                            </Typography>

                            <Divider sx={{ my: 4 }} />

                            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>
                                ⚙️ 1. New Member Setup
                            </Typography>
                            
                            <Typography variant="body1" sx={{ mb: 2 }}>
                                <strong>IRL games:</strong> <a href="https://tinyleagues.co" target="_blank" rel="noopener noreferrer">tinyleagues.co</a>
                            </Typography>

                            <Typography variant="body1" sx={{ mb: 2 }}>
                                <strong>Online games:</strong> <a href="https://online.tinyleagues.co" target="_blank" rel="noopener noreferrer">online.tinyleagues.co</a>
                            </Typography>

                            <Typography variant="body1" sx={{ mb: 2, color: 'error.main', fontWeight: 600 }}>
                                You must be logged into a <a href="https://network.pokernow.com/sessions/new" target="_blank" rel="noopener noreferrer">PokerNow</a> account before sitting at any online table.
                            </Typography>

                            <Divider sx={{ my: 4 }} />

                            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>
                                📜 2. Community Trust
                            </Typography>

                            <Typography variant="body1" sx={{ mb: 2 }}>
                                <strong>No Cheating:</strong> Zero tolerance for Real-Time Assistance (RTA), solvers, or external help. Hand histories are checked; cheaters are permanently removed.
                            </Typography>

                            <Typography variant="body1" sx={{ mb: 2 }}>
                                <strong>No Bullying or Harassment:</strong> Zero tolerance for bullying or harassment of any player. Treat all players with respect.
                            </Typography>

                            <Typography variant="body1" sx={{ mb: 4 }}>
                                <strong>Reporting:</strong> Report suspected foul play to an admin immediately. All reports are investigated discreetly.
                            </Typography>

                            <Divider sx={{ my: 4 }} />

                            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>
                                💸 3. Playing & Payments
                            </Typography>
                            
                            <Typography variant="body1" sx={{ mb: 2 }}>
                                <strong>Game Runner:</strong> Each game has a designated Game Runner responsible for uploading the final ledger to the payment portal.
                            </Typography>

                            <Typography variant="body1" sx={{ mb: 2 }}>
                                <strong>Venmo:</strong> New players: enter your Venmo ID in the payment portal. Returning players' info auto-populates if you've logged into PokerNow before sitting at a table.
                            </Typography>

                            <Typography variant="body1" sx={{ mb: 2 }}>
                                <strong>Approvals:</strong> Get admin approval before inviting someone. You're liable for their actions and must ensure they read these rules.
                            </Typography>

                            <Typography variant="body1" sx={{ mb: 4 }}>
                                <strong>Connection:</strong> A stable internet connection is crucial. If lagging, sit out to avoid disrupting gameplay.
                            </Typography>

                            <Typography variant="body1" sx={{ mb: 2, color: 'error.main', fontWeight: 600 }}>
                                <strong>SETTLEMENTS:</strong> ALL players have 24 HOURS to settle up after the ledger is posted.
                            </Typography>

                            <Divider sx={{ my: 4 }} />

                            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>
                                ♠️ 4. Game Logistics
                            </Typography>

                            <Typography variant="body1" sx={{ mb: 2 }}>
                                <strong>Posting Requirement:</strong> When sharing a game link, include stakes and poker variation (e.g., $1/$2 NLH).
                            </Typography>

                            <Typography variant="body1" sx={{ mb: 2 }}>
                                <strong>Table Consistency:</strong> Once a table is established with specific stakes/variation, those parameters are locked.
                            </Typography>

                            <Typography variant="body1" sx={{ mb: 2 }}>
                                <strong>Creating New Action:</strong> If players want different stakes, variations, or table rules, create a new table. Let the market decide which game runs!
                            </Typography>

                            <Typography variant="body1" sx={{ mb: 2 }}>
                                <strong>Game Runner Transition:</strong> If a runner leaves, the new host maintains original stakes/variation (and bomb pot rules) unless all players unanimously agree to change.
                            </Typography>

                            <Typography variant="body1" sx={{ mb: 2 }}>
                                <strong>Closing the Books:</strong> All ledgers must be uploaded by the Game Runner after the game ends.
                            </Typography>

                            <Typography variant="body1" sx={{ mb: 4 }}>
                                <strong>Rejoin Rule:</strong> If a player leaves and returns to the same table, they must buy in for an amount equal to or greater than their previous stack.
                            </Typography>

                            <Divider sx={{ my: 4 }} />

                            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>
                                ⚖️ 5. Legal Disclaimer & Liability Waiver
                            </Typography>

                            <Typography variant="body1" sx={{ mb: 2 }}>
                                <strong>Social Gaming Only (No Rake):</strong> This community is for social and recreational purposes only. Admins and Tiny Leagues Online charge no rake, entry fee, or administrative fee. No house profit; 100% of funds are redistributed to players.
                            </Typography>

                            <Typography variant="body1" sx={{ mb: 2 }}>
                                <strong>Peer-to-Peer Settlements:</strong> Tiny Leagues Online and its admins never hold or process player funds. All settlements are peer-to-peer between players. Admins are not responsible for collecting debts, resolving payment disputes, or covering losses.
                            </Typography>

                            <Typography variant="body1" sx={{ mb: 2 }}>
                                <strong>Assumption of Risk:</strong> You understand poker is a game of skill and chance. You participate voluntarily and assume full responsibility for your financial decisions and compliance with local social gaming laws.
                            </Typography>

                            <Typography variant="body1" sx={{ mb: 4 }}>
                                <strong>Limitation of Liability:</strong> Admins are facilitators only. You agree to release, indemnify, and hold harmless administrators from any claims, damages, or disputes arising from gameplay, technical issues, or other players' actions.
                            </Typography>

                            <Divider sx={{ my: 4 }} />

                            <Box sx={{ 
                                mt: 4, 
                                p: 3, 
                                bgcolor: 'primary.main', 
                                color: 'primary.contrastText',
                                borderRadius: 2
                            }}>
                                <Typography variant="subtitle1" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
                                    ✅ MANDATORY ACKNOWLEDGEMENT
                                </Typography>
                                <Typography variant="body1">
                                    By participating in any game linked from this group, all players (new or returning) confirm they have read, understood, and agreed to all rules and legal disclaimers above.
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </div>
            </Fade>
        </Container>
    );
};

