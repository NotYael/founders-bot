# founders-bot

A Discord bot for running peer reviews and recurring announcements in a server. Built with
[discord.js](https://discord.js.org) v14 and slash commands.

## Features

- **Review randomizer.** Keep a list of members and shuffle them into a single review circle on demand:
  A reviews B, B reviews C, … and the last person reviews A. Everyone gives and gets exactly one review.
- **Scheduled messages.** Post predefined messages to a channel on a repeating interval (minutes to weeks).
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
| `/randomizer` 🔒 | Shuffle everyone in the list into one review circle and ping them with their pairings |
| `/randomizer-list` | Show who's in the randomizer |
| `/randomizer-add user` 🔒 | Add someone to the randomizer |
| `/randomizer-delete user` 🔒 | Remove someone from the randomizer |
| `/schedule-add channel every unit message [send_now]` 🔒 | Post `message` in `channel` every N minutes/hours/days/weeks (`\n` for line breaks) |
| `/schedule-list` 🔒 | Show scheduled messages and their IDs |
| `/schedule-delete id` 🔒 | Stop a scheduled message |
| `/set-manager-role [role]` | Choose the role that can use 🔒 commands (leave empty to clear). *Manage Server only.* |

## Tech

- **Runtime:** Node.js 22+, discord.js v14
- **Storage:** a JSON file (`data/db.json`), keyed by server ID
- **Scheduling:** a 30-second loop that checks stored next-run times, so schedules survive restarts and
  missed posts are sent once (not repeatedly) after downtime
- **Hosting:** a single always-on Linux VM running the bot as a systemd service

## Project layout

```
src/
  index.js               # Entry point: creates the client, loads commands + events, logs in
  deploy-commands.js     # Registers slash commands with Discord
  lib/
    loadModules.js       # Auto-loads every .js file in a folder (recursively)
    store.js             # JSON-file storage (data/db.json)
    randomizer.js        # Shuffle + circular pairing logic
    scheduler.js         # Sends scheduled messages when they're due
    access.js            # Manager-role check for restricted commands
    membership.js        # Removes departed members from the randomizer
  commands/
    utility/             # commands, ping, server, set-manager-role
    randomizer/          # randomizer, randomizer-list/add/delete
    schedule/            # schedule-add/list/delete
  events/
    ready.js             # On connect: starts the scheduler, prunes departed members
    guildMemberRemove.js # Removes people from the randomizer when they leave
    interactionCreate.js # Routes slash commands (and enforces restricted access)
data/db.json             # Created automatically; git-ignored
```
