/**
 * Utility functions for game-related operations
 */

/**
 * Extracts gameId from Poker Now URL
 * Handles both https://www.pokernow.club/games/{gameId} and https://pokernow.club/games/{gameId}
 * Also handles https://www.pokernow.com/games/{gameId} and https://pokernow.com/games/{gameId}
 * 
 * @param {string} url - The Poker Now game URL
 * @returns {string|null} - The extracted gameId or null if not found
 */
export const extractGameId = (url) => {
  if (!url || typeof url !== 'string') {
    return null;
  }
  
  // Match pokernow.club or pokernow.com /games/{gameId} (with or without www.)
  const match = url.match(/pokernow\.(club|com)\/games\/([^\/\?]+)/);
  return match ? match[2] : null;
};

/**
 * Validates that a URL is from pokernow.club or pokernow.com domain
 * Accepts both www. and non-www. versions for both domains
 * 
 * @param {string} url - The URL to validate
 * @returns {boolean} - True if valid pokernow.club or pokernow.com URL
 */
export const isValidPokerNowUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  try {
    const urlObj = new URL(url);
    // Check if domain is pokernow.club or pokernow.com (with or without www.)
    const validDomains = [
      'pokernow.club',
      'www.pokernow.club',
      'pokernow.com',
      'www.pokernow.com'
    ];
    return validDomains.includes(urlObj.hostname);
  } catch (error) {
    return false;
  }
};
