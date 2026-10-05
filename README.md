# founders-bot

A Discord bot for running peer reviews and recurring announcements in a server. Built with
[discord.js](https://discord.js.org) v14 and slash commands.

## Features

- **Review randomizer.** Keep a list of members and shuffle them into a single review circle on demand:
  A reviews B, B reviews C, … and the last person reviews A. Everyone gives and gets exactly one review.
- **Scheduled messages.** Post predefined messages to a channel on a repeating interval (minutes to weeks).
- **Weekly updates.** Every Monday at 7 PM (Philippine time), post a message in a channel, start a thread on it,
  and ping everyone in the randomizer list to post their update there within 6 hours.
- **Role-based access.** Sensitive commands are limited to a configurable manager role (plus server admins).
- **Self-maintaining list.** Members who leave the server are removed from the randomizer automatically,
  including anyone who left while the bot was offline.
- **Persistent.** Lists, schedules, and settings are stored per server and survive restarts.

## Commands

🔒 = restricted: only members with the **manager role** or **Manage Server** permission can use it.

| Command | What it does |
|---|---|
| `/commands` | List all commands |
| `/ping` | Check the bot is alive + latency |
| `/server` | Show server info |
| `/randomizer [channel]` 🔒 | Shuffle everyone into one review circle and post it in `channel` (default: `#reviews-and-updates`): an announcement, then one message per pairing with its own thread |
| `/randomizer-list` | Show who's in the randomizer |
| `/randomizer-add user` 🔒 | Add someone to the randomizer |
| `/randomizer-delete user` 🔒 | Remove someone from the randomizer |
| `/schedule-add channel every unit message [send_now]` 🔒 | Post `message` in `channel` every N minutes/hours/days/weeks (`\n` for line breaks) |
| `/schedule-list` 🔒 | Show scheduled messages and their IDs |
| `/schedule-delete id` 🔒 | Stop a scheduled message |
| `/updates start [channel]` 🔒 | Post a weekly updates thread every Monday at 7 PM (Philippine time) in `channel` (default: `#reviews-and-updates`) |
| `/updates stop` 🔒 | Stop the weekly updates thread |
| `/updates test [channel]` 🔒 | Post an updates thread right now (defaults to the scheduled channel, else `#reviews-and-updates`; doesn't change the schedule) |
| `/set-manager-role [role]` | Choose the role that can use 🔒 commands (leave empty to clear). *Manage Server only.* |

## Tech

- **Runtime:** Node.js 22+, discord.js v14
- **Storage:** a JSON file (`data/db.json`), keyed by server ID
- **Scheduling:** a 30-second loop that checks stored next-run times, so schedules survive restarts and
  missed posts are sent once (not repeatedly) after downtime
- **Hosting:** a single always-on Linux VM running the bot as a systemd service
- **CI/CD:** GitHub Actions checks every push to `main`, then deploys it to the VM over SSH

## Project layout

```
src/
  index.js               # Entry point: creates the client, loads commands + events, logs in
  deploy-commands.js     # Registers slash commands with Discord
  lib/
    loadModules.js       # Auto-loads every .js file in a folder (recursively)
    store.js             # JSON-file storage (data/db.json)
    randomizer.js        # Shuffle + circular pairing logic
    scheduler.js         # Sends scheduled messages (and the weekly updates thread) when they're due
    updates.js           # Weekly updates: next Monday 7 PM run time + posting the thread
    access.js            # Manager-role check for restricted commands
    channels.js          # Finds #reviews-and-updates (or the chosen channel) + thread permission check
    membership.js        # Removes departed members from the randomizer
  commands/
    utility/             # commands, ping, server, set-manager-role
    randomizer/          # randomizer, randomizer-list/add/delete
    schedule/            # schedule-add/list/delete
    updates/             # updates (start/stop/test)
  events/
    ready.js             # On connect: starts the scheduler, prunes departed members
    guildMemberRemove.js # Removes people from the randomizer when they leave
    interactionCreate.js # Routes slash commands (and enforces restricted access)
scripts/deploy.sh        # Runs on the server during deploys (pull, install, restart)
.github/workflows/       # CI/CD: check + auto-deploy on push to main
data/db.json             # Created automatically; git-ignored
```
