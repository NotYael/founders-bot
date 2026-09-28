import { Events } from 'discord.js';
import { pruneDepartedMembers } from '../lib/membership.js';
import { startScheduler } from '../lib/scheduler.js';

export default {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(`Logged in as ${client.user.tag} — serving ${client.guilds.cache.size} server(s).`);
    startScheduler(client);
    await pruneDepartedMembers(client);
  },
};
