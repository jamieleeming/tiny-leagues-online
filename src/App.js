import React, { useState, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, useMediaQuery } from '@mui/material';
import './App.css';
import PokerLedger from './PokerLedger';
import { Rules } from './components/Rules';
import { Header } from './components/Header';

// Handle GitHub Pages path rewriting before React Router initializes
if (window.location.search && window.location.search[1] === '/') {
  const queryString = window.location.search.slice(1);
  const pathParts = queryString.split('&');
  let path = pathParts[0].replace(/~and~/g, '&');
  const remainingParams = pathParts.slice(1).join('&').replace(/~and~/g, '&');
  const searchParams = remainingParams ? '?' + remainingParams : '';
  window.history.replaceState(null, '', path + searchParams + window.location.hash);
}

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
