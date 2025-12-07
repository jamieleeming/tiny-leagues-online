import React, { useState, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, useMediaQuery } from '@mui/material';
import './App.css';
import PokerLedger from './PokerLedger';
import { Rules } from './components/Rules';
import { Header } from './components/Header';

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
