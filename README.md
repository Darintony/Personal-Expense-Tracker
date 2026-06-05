# FinTrack — Personal Expense Tracker

FinTrack is a client-side personal expense tracker (HTML/CSS/JS) that stores data in browser localStorage. This repository contains the static site you can run locally or deploy as a PWA.

## Quick start

1. Start a local server in the project folder:

```bash
# Python 3
python -m http.server 8000

# or using npx
npx http-server -p 8000
```

2. Open http://localhost:8000 in your browser.

## Make it an installable app (PWA)

This project now includes a `manifest.json` and `service-worker.js` so it can be installed like an app on supported browsers.

To install:

1. Open the app in Chrome/Edge on desktop or mobile.
2. Choose the browser menu and select `Install FinTrack` or `Add to Home screen`.
3. Launch it from the shortcut or home screen.

The site will open in standalone mode with its own app window and keep working locally using cached files.

## Push to GitHub

If you want to push this project to `https://github.com/Darintony/Personal-Expense-Tracker`, run the commands below (replace `main` with your preferred branch name):

```bash
# initialize git if not already initialized
git init
git add .
git commit -m "Initial commit — FinTrack"

# add remote (use your GitHub repo URL)
git remote add origin https://github.com/Darintony/Personal-Expense-Tracker.git

# push to GitHub
git branch -M main
git push -u origin main
```

If the GitHub repo does not exist yet, create it on GitHub first (or use the GitHub CLI: `gh repo create Darintony/Personal-Expense-Tracker --public --source=. --remote=origin`) and then run the `git push` commands above.

## Notes

- Data is stored in `localStorage`; installing to home screen keeps data on-device.
- The app should work offline for the main shell files after the first load.
