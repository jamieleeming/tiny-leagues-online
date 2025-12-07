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

export const Rules = () => {
    const [fadeIn, setFadeIn] = useState(false);

    useEffect(() => {
        // Trigger fade-in after component mounts
        setFadeIn(true);
    }, []);

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
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
                    <Card>
                        <CardContent sx={{ textAlign: 'left' }}>
                            <Typography variant="h4" component="h1" gutterBottom>
                                👋 Welcome to Tiny Leagues Online (Invite-Only)
                            </Typography>

                            <Typography variant="body1" sx={{ mb: 4 }}>
                                This is currently a private, admin-approved community. You MUST be in the Tiny Leagues WhatsApp group to play, as all game links are shared here.
                            </Typography>

                            <Typography variant="body1" sx={{ mb: 4 }}>
                                <strong>New players should ask an existing member for the community invite link.</strong>
                            </Typography>

                            <Divider sx={{ my: 4 }} />

                            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>
                                ⚙️ 1. New Member Setup
                            </Typography>
                            
                            <Box component="ul" sx={{ pl: 3, mb: 4 }}>
                                <li><Typography variant="body1" component="span"><strong>For IRL games:</strong> tinyleagues.co</Typography></li>
                                <li><Typography variant="body1" component="span"><strong>For Online Games:</strong> pokernow.club</Typography></li>
                                <li><Typography variant="body1" component="span"><strong>For Payments (online games):</strong> online.tinyleagues.co</Typography></li>
                                <li><Typography variant="body1" component="span"><strong>League Code:</strong> See WhatsApp group description</Typography></li>
                            </Box>

                            <Divider sx={{ my: 4 }} />

                            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>
                                💸 2. Playing & Payments
                            </Typography>
                            
                            <Typography variant="body1" sx={{ mb: 2 }}>
                                <strong>Game Runner:</strong> Each game has a designated Runner who hosts the game and is responsible for uploading the final ledger to the payment portal.
                            </Typography>

                            <Typography variant="body1" sx={{ mb: 2 }}>
                                <strong>Joining a Game:</strong> You must be logged into your Pokernow account to join the table.
                            </Typography>

                            <Typography variant="body1" sx={{ mb: 2 }}>
                                <strong>Venmo:</strong> New players must enter their Venmo ID in the payment portal. Returning players' info will auto-populate, provided they have logged into PokerNow before sitting at a table.
                            </Typography>

                            <Typography variant="body1" sx={{ mb: 4, color: 'error.main', fontWeight: 600 }}>
                                <strong>SETTLEMENTS:</strong> ALL players have 24 HOURS to settle up after the ledger is posted. This is a critical trust rule.
                            </Typography>

                            <Divider sx={{ my: 4 }} />

                            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>
                                📜 3. Rules & Community Trust
                            </Typography>

                            <Typography variant="h6" component="h3" gutterBottom sx={{ mt: 3, mb: 2 }}>
                                Zero Tolerance Policy
                            </Typography>

                            <Typography variant="body1" sx={{ mb: 2 }}>
                                <strong>No Cheating:</strong> Zero tolerance for Real-Time Assistance (RTA), solvers, or any external help. We check hand histories and will permanently remove anyone caught cheating.
                            </Typography>

                            <Typography variant="body1" sx={{ mb: 4 }}>
                                <strong>Reporting:</strong> See something, say something. If you suspect foul play, private message an admin immediately. All reports are investigated discreetly.
                            </Typography>

                            <Typography variant="h6" component="h3" gutterBottom sx={{ mt: 3, mb: 2 }}>
                                Invites & Etiquette
                            </Typography>

                            <Typography variant="body1" sx={{ mb: 2 }}>
                                <strong>Approvals:</strong> You must get admin approval before inviting someone. You are liable for their actions and must ensure they read these rules.
                            </Typography>

                            <Typography variant="body1" sx={{ mb: 2 }}>
                                <strong>Connection:</strong> A stable internet connection is crucial. If you are lagging, please sit out to avoid disrupting the flow of the game.
                            </Typography>

                            <Typography variant="body1" sx={{ mb: 4 }}>
                                <strong>DBAD:</strong> If you have to leave, give a fair heads-up. If the original Game Runner needs admin control back, please transfer it. If someone is being a 🍆, screenshot it and send it to an admin for review.
                            </Typography>

                            <Divider sx={{ my: 4 }} />

                            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>
                                ♠️ 4. Game Logistics
                            </Typography>

                            <Typography variant="body1" sx={{ mb: 2 }}>
                                <strong>Posting Requirement:</strong> When sharing a game link, you must include the stakes and the poker variation (e.g., $1/$2 NLH).
                            </Typography>

                            <Typography variant="body1" sx={{ mb: 2 }}>
                                <strong>Table Consistency:</strong> Once a table is established with specific stakes/variation, those parameters are locked.
                            </Typography>

                            <Typography variant="body1" sx={{ mb: 2 }}>
                                <strong>Creating New Action:</strong> If players want different stakes or variations, they must create a new, separate table. Let the market decide which game runs!
                            </Typography>

                            <Typography variant="body1" sx={{ mb: 2 }}>
                                <strong>Game Runner Transition:</strong> If a runner leaves, the new host must maintain the original stakes/variation (and bomb pot rules) unless all players unanimously agree to change.
                            </Typography>

                            <Typography variant="body1" sx={{ mb: 2 }}>
                                <strong>Closing the Books:</strong> As long as ledgers are uploaded for each game, everything is considered fair and square.
                            </Typography>

                            <Typography variant="body1" sx={{ mb: 4 }}>
                                <strong>The Rejoin Rule:</strong> If a player leaves and attempts to sit back down at the same table/ledger, they are required to buy in for an amount equal to or greater than the stack they had when they left.
                            </Typography>

                            <Divider sx={{ my: 4 }} />

                            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>
                                ⚖️ 5. Legal Disclaimer & Liability Waiver
                            </Typography>

                            <Typography variant="body1" sx={{ mb: 2 }}>
                                <strong>Social Gaming Only (No Rake):</strong> This community is strictly for social and recreational purposes. The admins and Tiny Leagues Online DO NOT charge a rake, entry fee, administrative fee, or take any percentage of the pot. No profit is generated by the house; 100% of funds are redistributed among players.
                            </Typography>

                            <Typography variant="body1" sx={{ mb: 2 }}>
                                <strong>Peer-to-Peer Settlements:</strong> Tiny Leagues Online and its admins never hold, process, or touch player funds. All financial settlements are strictly peer-to-peer (P2P) directly between players. The admins are not responsible for collecting debts, resolving payment disputes between individuals, or covering losses.
                            </Typography>

                            <Typography variant="body1" sx={{ mb: 2 }}>
                                <strong>Assumption of Risk:</strong> You understand that poker is a game of skill and chance. You participate voluntarily and assume full responsibility for your own financial decisions and compliance with your local laws regarding social gaming.
                            </Typography>

                            <Typography variant="body1" sx={{ mb: 4 }}>
                                <strong>Limitation of Liability:</strong> Admins are facilitators only. You agree to release, indemnify, and hold harmless the administrators from any claims, damages, or disputes arising from gameplay, technical issues (e.g., internet lag, server crashes), or the actions of other players.
                            </Typography>

                            <Divider sx={{ my: 4 }} />

                            <Box sx={{ 
                                mt: 4, 
                                p: 3, 
                                bgcolor: 'primary.main', 
                                color: 'primary.contrastText',
                                borderRadius: 1
                            }}>
                                <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
                                    ✅ MANDATORY ACKNOWLEDGEMENT
                                </Typography>
                                <Typography variant="body1">
                                    By participating in any game linked from this group, all players (whether new or returning) explicitly confirm that they have read, understood, and agreed to all the rules and legal disclaimers outlined above.
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </div>
            </Fade>
        </Container>
    );
};

