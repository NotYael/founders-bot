// Tiny JSON-file database. Data lives in data/db.json, keyed by server (guild) ID.
// Fine for a small bot on a single server/VM; swap for SQLite/Postgres if you outgrow it.
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DATA_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

const db = existsSync(DATA_FILE) ? JSON.parse(readFileSync(DATA_FILE, 'utf8')) : { guilds: {} };

export function getGuild(guildId) {
  db.guilds[guildId] ??= { randomizer: [], schedules: [], nextScheduleId: 1, managerRoleId: null };
  return db.guilds[guildId];
}

export function allGuilds() {
  return Object.entries(db.guilds);
}

export function save() {
  mkdirSync(DATA_DIR, { recursive: true });
  // Write to a temp file then rename, so a crash mid-write can't corrupt the database
  const tmp = `${DATA_FILE}.tmp`;
  writeFileSync(tmp, JSON.stringify(db, null, 2));
  renameSync(tmp, DATA_FILE);
}
