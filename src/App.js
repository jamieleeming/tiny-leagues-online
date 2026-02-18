import React, { useState, useMemo, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider, CssBaseline, useMediaQuery, Fade } from '@mui/material';
import { createAppTheme } from './theme';
import './App.css';
import PokerLedger from './PokerLedger';
import { Rules } from './components/Rules';
import { AppShell } from './components/AppShell.js';
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

const DARK_MODE_KEY = 'tinyLeaguesDarkMode';

function App() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [manualDarkMode, setManualDarkMode] = useState(() => {
    try {
      const stored = localStorage.getItem(DARK_MODE_KEY);
      return stored === null ? null : stored === 'true';
    } catch {
      return null;
    }
  });
  const isDarkMode = manualDarkMode !== null ? manualDarkMode : (prefersDarkMode ?? true);

  const theme = useMemo(() => createAppTheme(isDarkMode), [isDarkMode]);

  // Persist preference and set color-scheme so Chrome Android respects our choice
  useEffect(() => {
    if (manualDarkMode !== null) {
      try {
        localStorage.setItem(DARK_MODE_KEY, String(isDarkMode));
      } catch {}
    }
    document.documentElement.style.colorScheme = isDarkMode ? 'dark' : 'light';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', isDarkMode ? '#09090b' : '#fafafa');
  }, [isDarkMode, manualDarkMode]);

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
