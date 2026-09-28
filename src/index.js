import { Client, Collection, GatewayIntentBits } from 'discord.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadModules } from './lib/loadModules.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (!process.env.DISCORD_TOKEN) {
  console.error('Missing DISCORD_TOKEN. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

// Intents control which events Discord sends the bot.
// - Guilds: needed for slash commands
// - GuildMembers: needed to detect members leaving (auto-removal from the randomizer).
//   This is a "privileged" intent — it must be enabled in the Developer Portal (Bot → Server Members Intent).
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

// Load commands into client.commands, keyed by command name
client.commands = new Collection();
for (const { file, module: command } of await loadModules(path.join(__dirname, 'commands'))) {
  if (!command?.data || !command?.execute) {
    console.warn(`[WARN] ${file} is missing "data" or "execute" — skipped.`);
    continue;
  }
  client.commands.set(command.data.name, command);
}

// Register event handlers
for (const { file, module: event } of await loadModules(path.join(__dirname, 'events'))) {
  if (!event?.name || !event?.execute) {
    console.warn(`[WARN] ${file} is missing "name" or "execute" — skipped.`);
    continue;
  }
  const handler = (...args) => event.execute(...args);
  event.once ? client.once(event.name, handler) : client.on(event.name, handler);
}

// Graceful shutdown so hosts (pm2, systemd, Docker) can restart cleanly
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    console.log(`Received ${signal}, shutting down.`);
    client.destroy();
    process.exit(0);
  });
}

try {
  await client.login(process.env.DISCORD_TOKEN);
} catch (error) {
  if (error.message.includes('disallowed intents')) {
    console.error(
      'Discord rejected the bot\'s intents. Enable "Server Members Intent" in the Developer Portal: ' +
        'https://discord.com/developers/applications → your app → Bot → Privileged Gateway Intents.',
    );
  } else {
    console.error('Login failed:', error.message);
  }
  process.exit(1);
}
