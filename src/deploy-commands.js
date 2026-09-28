// Registers slash commands with Discord. Run with `npm run deploy` whenever you
// add, remove, or change a command's name/description/options (not needed for code-only changes).
import { REST, Routes } from 'discord.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadModules } from './lib/loadModules.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID) {
  console.error('Missing DISCORD_TOKEN or CLIENT_ID in .env');
  process.exit(1);
}

const commands = (await loadModules(path.join(__dirname, 'commands')))
  .filter(({ module }) => module?.data)
  .map(({ module }) => module.data.toJSON());

const rest = new REST().setToken(DISCORD_TOKEN);
const route = GUILD_ID
  ? Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID)
  : Routes.applicationCommands(CLIENT_ID);

try {
  const data = await rest.put(route, { body: commands });
  console.log(`Registered ${data.length} command(s) ${GUILD_ID ? `to guild ${GUILD_ID}` : 'globally'}.`);
} catch (error) {
  console.error(error);
  process.exit(1);
}
