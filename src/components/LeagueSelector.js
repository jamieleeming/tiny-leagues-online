import React, { useState, useEffect } from 'react';
import { 
  Box, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  TextField, 
  Button, 
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { saveLeagueAccess, hasLeagueAccess, getAccessibleLeagues } from '../utils/leagueAuth';

export const LeagueSelector = ({ onLeagueSelect }) => {
  const [leagues, setLeagues] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Fetch leagues on component mount
  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        const leaguesSnapshot = await getDocs(collection(db, 'leagues'));
        const leaguesList = leaguesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setLeagues(leaguesList);
        
        // Check if user has access to any leagues
        const accessibleLeagues = getAccessibleLeagues();
        if (accessibleLeagues.length > 0) {
          // Auto-select the first accessible league
          setSelectedLeague(accessibleLeagues[0]);
          onLeagueSelect(accessibleLeagues[0]);
        }
      } catch (error) {
        console.error('Error fetching leagues:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLeagues();
  }, [onLeagueSelect]);
  
  const handleLeagueChange = (event) => {
    const leagueId = event.target.value;
    setSelectedLeague(leagueId);
    setError('');
    
    // Check if user already has access to this league
    if (hasLeagueAccess(leagueId)) {
      onLeagueSelect(leagueId);
    } else {
      // Show password dialog
      setShowPasswordDialog(true);
      setPassword('');
    }
  };
  
  const handlePasswordSubmit = async () => {
    try {
      // Verify password against Firestore
      const leagueDoc = await getDoc(doc(db, 'leagues', selectedLeague));
      
      if (!leagueDoc.exists()) {
        setError('League not found');
        return;
      }
      
      const leagueData = leagueDoc.data();
      
      if (leagueData.password === password) {
        // Password is correct
        saveLeagueAccess(selectedLeague);
        onLeagueSelect(selectedLeague);
        setShowPasswordDialog(false);
      } else {
        setError('Incorrect password');
      }
    } catch (error) {
      console.error('Error verifying password:', error);
      setError('Error verifying password');
    }
  };
  
  if (loading) {
    return <Typography>Loading leagues...</Typography>;
  }
  
  return (
    <Box sx={{ mb: 3 }}>
      <FormControl fullWidth>
        <InputLabel id="league-select-label">Select League</InputLabel>
        <Select
          labelId="league-select-label"
          id="league-select"
          value={selectedLeague}
          label="Select League"
          onChange={handleLeagueChange}
        >
          {leagues.map(league => (
            <MenuItem key={league.id} value={league.id}>
              {league.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      <Dialog open={showPasswordDialog} onClose={() => setShowPasswordDialog(false)}>
        <DialogTitle>Enter League Password</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Password"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={!!error}
            helperText={error}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPasswordDialog(false)}>Cancel</Button>
          <Button onClick={handlePasswordSubmit}>Submit</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 