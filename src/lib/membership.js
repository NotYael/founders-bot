import { allGuilds, getGuild, save } from './store.js';

/** Removes a user from a server's randomizer list. Returns true if they were in it. */
export function removeFromRandomizer(guildId, userId) {
  const guild = getGuild(guildId);
  const index = guild.randomizer.indexOf(userId);
  if (index === -1) return false;

  guild.randomizer.splice(index, 1);
  save();
  return true;
}

/**
 * On startup, removes anyone who left a server while the bot was offline
 * (the leave event only fires while the bot is connected).
 */
export async function pruneDepartedMembers(client) {
  for (const [guildId, data] of allGuilds()) {
    const guild = client.guilds.cache.get(guildId);
    if (!guild || data.randomizer.length === 0) continue;

    try {
      const stillHere = new Set();
      // Discord allows fetching up to 100 specific members per request
      for (let i = 0; i < data.randomizer.length; i += 100) {
        const members = await guild.members.fetch({ user: data.randomizer.slice(i, i + 100) });
        for (const id of members.keys()) stillHere.add(id);
      }

      const departed = data.randomizer.filter((id) => !stillHere.has(id));
      for (const id of departed) removeFromRandomizer(guildId, id);
      if (departed.length) console.log(`Removed ${departed.length} departed member(s) from randomizer in ${guild.name}.`);
    } catch (error) {
      console.error(`Couldn't check members in ${guild.name}:`, error.message);
    }
  }
}
