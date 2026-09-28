#!/usr/bin/env bash
# Runs ON THE SERVER (piped over SSH by .github/workflows/deploy.yml).
# Pulls the latest code, installs dependencies, re-registers slash commands, and restarts the bot.
set -euo pipefail

cd ~/founders-bot

# Match GitHub exactly. Untracked/ignored files (.env, data/db.json) are left alone.
git fetch origin main
git reset --hard origin/main

npm ci --omit=dev
npm run deploy
sudo systemctl restart founders-bot

sleep 3
systemctl is-active --quiet founders-bot && echo "✅ founders-bot is running" || {
  echo "❌ founders-bot failed to start. Recent logs:"
  journalctl -u founders-bot -n 30 --no-pager
  exit 1
}
