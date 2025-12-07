import React, { useState, useMemo, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, useMediaQuery } from '@mui/material';
import './App.css';
import PokerLedger from './PokerLedger';
import { Rules } from './components/Rules';
import { Header } from './components/Header';

// Component to handle GitHub Pages path rewriting
const PathHandler = () => {
  const location = useLocation();

  useEffect(() => {
    // Handle the path rewriting from 404.html
    // The 404.html script converts /rules to /?/rules
    // This code converts it back to /rules for React Router
    if (location.search) {
      const path = location.search.slice(1).split('&')[0];
      if (path && path.startsWith('/')) {
        const newPath = path.replace(/~and~/g, '&');
        window.history.replaceState(null, '', newPath + location.hash);
      }
    }
  }, [location]);

  return null;
};

function App() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [manualDarkMode, setManualDarkMode] = useState(null);
  const isDarkMode = manualDarkMode ?? prefersDarkMode;

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: isDarkMode ? 'dark' : 'light',
        }
      }),
    [isDarkMode]
  );

  const toggleDarkMode = () => {
    setManualDarkMode(prev => 
      prev === null ? !prefersDarkMode : !prev
    );
  };

  return (
    <Router>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <PathHandler />
        <div className="App" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Header 
            isDarkMode={isDarkMode}
            onToggleDarkMode={toggleDarkMode}
          />
          <Routes>
            <Route path="/rules" element={<Rules />} />
            <Route path="/" element={<PokerLedger />} />
          </Routes>
        </div>
      </ThemeProvider>
    </Router>
  );
}

export default App;
