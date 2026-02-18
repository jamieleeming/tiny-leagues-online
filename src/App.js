import React, { useState, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider, CssBaseline, useMediaQuery, Fade } from '@mui/material';
import { createAppTheme } from './theme';
import './App.css';
import PokerLedger from './PokerLedger';
import { Rules } from './components/Rules';
import { AppShell } from './components/AppShell';
import { ActiveGames } from './components/ActiveGames';

function RoutesWithTransition() {
  const location = useLocation();
  return (
    <Fade in timeout={{ enter: 220, exit: 150 }} key={location.pathname}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Routes>
          <Route path="/rules" element={<Rules />} />
          <Route path="/active-games" element={<ActiveGames />} />
          <Route path="/" element={<PokerLedger />} />
        </Routes>
      </div>
    </Fade>
  );
}

function App() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [manualDarkMode, setManualDarkMode] = useState(null);
  const isDarkMode = manualDarkMode !== null ? manualDarkMode : (prefersDarkMode ?? true);

  const theme = useMemo(() => createAppTheme(isDarkMode), [isDarkMode]);

  const toggleDarkMode = () => {
    setManualDarkMode(prev => 
      prev === null ? !prefersDarkMode : !prev
    );
  };

  return (
    <Router>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div className="App" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <AppShell isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode}>
            <RoutesWithTransition />
          </AppShell>
        </div>
      </ThemeProvider>
    </Router>
  );
}

export default App;
