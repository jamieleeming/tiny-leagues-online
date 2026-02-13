/**
 * Query Tracking Utility
 * 
 * Tracks database query patterns to monitor optimization effectiveness.
 * Logs query counts and patterns to help identify any remaining inefficiencies.
 * 
 * In production, you might want to send this data to an analytics service.
 */

class QueryTracker {
    constructor() {
        this.queries = {
            players: {
                count: 0,
                batchCount: 0,
                individualCount: 0,
                totalPlayers: 0
            },
            games: {
                count: 0,
                totalFetched: 0,
                limited: 0
            },
            gameDocuments: {
                count: 0,
                redundant: 0
            }
        };
        
        // Only track in development or if explicitly enabled
        this.enabled = process.env.NODE_ENV === 'development' || 
                      localStorage.getItem('enableQueryTracking') === 'true';
    }

    /**
     * Track a Venmo ID batch fetch
     */
    trackVenmoBatch(playerCount, batchCount) {
        if (!this.enabled) return;
        
        this.queries.players.count++;
        this.queries.players.batchCount += batchCount;
        this.queries.players.totalPlayers += playerCount;
        
        console.log(`[QueryTracker] Player payment info: ${playerCount} players fetched in ${batchCount} batch(es)`);
    }

    /**
     * Track a games list fetch
     */
    trackGamesFetch(totalFetched, wasLimited) {
        if (!this.enabled) return;
        
        this.queries.games.count++;
        this.queries.games.totalFetched += totalFetched;
        if (wasLimited) {
            this.queries.games.limited++;
        }
        
        console.log(`[QueryTracker] Games: Fetched ${totalFetched} games${wasLimited ? ' (limited)' : ''}`);
    }

    /**
     * Track a redundant game document fetch (should be 0 after optimization)
     */
    trackRedundantGameFetch() {
        if (!this.enabled) return;
        
        this.queries.gameDocuments.count++;
        this.queries.gameDocuments.redundant++;
        
        console.warn('[QueryTracker] ⚠️ Redundant game document fetch detected!');
    }

    /**
     * Get current statistics
     */
    getStats() {
        return {
            ...this.queries,
            summary: {
                totalPlayerPaymentQueries: this.queries.players.count,
                averagePlayersPerQuery: this.queries.players.count > 0 
                    ? Math.round(this.queries.players.totalPlayers / this.queries.players.count)
                    : 0,
                averageBatchesPerQuery: this.queries.players.count > 0
                    ? (this.queries.players.batchCount / this.queries.players.count).toFixed(2)
                    : 0,
                totalGameQueries: this.queries.games.count,
                averageGamesPerQuery: this.queries.games.count > 0
                    ? Math.round(this.queries.games.totalFetched / this.queries.games.count)
                    : 0,
                redundantGameFetches: this.queries.gameDocuments.redundant
            }
        };
    }

    /**
     * Log summary statistics
     */
    logSummary() {
        if (!this.enabled) return;
        
        const stats = this.getStats();
        console.group('[QueryTracker] Summary Statistics');
        console.log('Player Payment Queries:', stats.summary);
        console.log('Game Queries:', {
            total: stats.games.count,
            averageGamesPerQuery: stats.summary.averageGamesPerQuery,
            limitedQueries: stats.games.limited
        });
        console.log('Redundant Game Fetches:', stats.gameDocuments.redundant);
        console.groupEnd();
    }

    /**
     * Reset all tracking data
     */
    reset() {
        this.queries = {
            players: {
                count: 0,
                batchCount: 0,
                individualCount: 0,
                totalPlayers: 0
            },
            games: {
                count: 0,
                totalFetched: 0,
                limited: 0
            },
            gameDocuments: {
                count: 0,
                redundant: 0
            }
        };
    }
}

// Export singleton instance
export const queryTracker = new QueryTracker();

// Make it available globally in development for easy access
if (process.env.NODE_ENV === 'development') {
    window.queryTracker = queryTracker;
}
