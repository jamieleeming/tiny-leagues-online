# Tiny Leagues Online

A web application for managing poker game settlements and Venmo payments. Built with React and Firebase, this tool helps poker players:

- Import game results from Poker Now
- View session results and profits/losses
- Calculate settlements between players
- Send Venmo payments directly through the app

## Scripts

### Analytics

Run money flow analytics on the main league (excludes test leagues):

```bash
npm run analyze-money-flow
```

This script analyzes all games in the main league(s) and provides:
- Total money flow (sum of all buy-ins) across all games
- Breakdown by year showing money flow per year

The script automatically filters out test leagues by checking if the league ID or name contains "test".

### Export Game Results

Export all game results data to CSV files:

```bash
npm run export-game-results
```

This script exports all games from the main league(s) to two CSV files:
- `export_games_summary.csv` - One row per game with totals and summary information
- `export_player_results.csv` - One row per player per game with detailed player results

The export includes:
- Game information (ID, nickname, dates, league)
- Player information (ID, name, buy-ins, cash-outs, net)
- All amounts are in dollars (converted from cents)
- Games are sorted by date (most recent first)

The script automatically filters out test leagues by checking if the league ID or name contains "test".