import { Events } from 'discord.js';
import { removeFromRandomizer } from '../lib/membership.js';

// Fires when someone leaves, is kicked, or is banned. Requires the GuildMembers intent.
export default {
  name: Events.GuildMemberRemove,
  execute(member) {
    if (removeFromRandomizer(member.guild.id, member.id)) {
      console.log(`${member.user.tag} left ${member.guild.name} — removed from randomizer.`);
    }
  },
};
