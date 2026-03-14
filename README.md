# Tiny Leagues Online

A web application for managing poker game settlements and Venmo payments. Built with React and Firebase, this tool helps poker players:

- Import game results from Poker Now
- View session results and profits/losses
- Calculate settlements between players
- Send Venmo payments directly through the app

## Design

- **Layout:** Sidebar navigation on desktop (≥960px), bottom navigation on mobile
- **Theme:** Dark-first with off-white accent (#fafafa), Plus Jakarta Sans
- **Pages:** Ledgers (two-panel layout), Games, Rules, Settings (modal)
- **Ledgers:** Full league game history (up to 500 games per league), paginated at 15 games per page for mobile-friendly browsing
- **Polish:** Page fade transitions, card hover effects, mobile safe-area support
- **Buttons:** Unified design with subtle hover (contained/outlined/text variants, startIcon support)

## Project structure

- `src/` - React application
- `scripts/` - Build utilities (e.g. `generate-icon`)
- `archive/` - One-off scripts, migrations, exports, and reference docs (gitignored; see `archive/README.md` for details)