// Utility functions for managing league authentication

const STORAGE_PREFIX = 'poker_league_auth_';
const TOKEN_EXPIRY_DAYS = 14;

/**
 * Save league access token to localStorage with expiration
 * @param {string} leagueId - The ID of the league
 */
export const saveLeagueAccess = (leagueId) => {
  if (!leagueId) return;
  
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + TOKEN_EXPIRY_DAYS);
  
  const tokenData = {
    leagueId,
    expiry: expiryDate.getTime()
  };
  
  localStorage.setItem(`${STORAGE_PREFIX}${leagueId}`, JSON.stringify(tokenData));
};

/**
 * Check if user has valid access to a league
 * @param {string} leagueId - The ID of the league
 * @returns {boolean} - Whether the user has valid access
 */
export const hasLeagueAccess = (leagueId) => {
  if (!leagueId) return false;
  
  const tokenJson = localStorage.getItem(`${STORAGE_PREFIX}${leagueId}`);
  if (!tokenJson) return false;
  
  try {
    const tokenData = JSON.parse(tokenJson);
    const now = new Date().getTime();
    
    // Check if token is expired
    if (tokenData.expiry < now) {
      // Clean up expired token
      localStorage.removeItem(`${STORAGE_PREFIX}${leagueId}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error parsing league access token:', error);
    return false;
  }
};

/**
 * Remove league access token
 * @param {string} leagueId - The ID of the league
 */
export const removeLeagueAccess = (leagueId) => {
  if (!leagueId) return;
  localStorage.removeItem(`${STORAGE_PREFIX}${leagueId}`);
}; 