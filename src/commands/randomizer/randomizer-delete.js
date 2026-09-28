import { InteractionContextType, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { getGuild, save } from '../../lib/store.js';

export default {
  restricted: true,
  data: new SlashCommandBuilder()
    .setName('randomizer-delete')
    .setDescription('Remove a person from the randomizer.')
    .setContexts(InteractionContextType.Guild)
    .addUserOption((o) => o.setName('user').setDescription('Who to remove').setRequired(true)),

  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const guild = getGuild(interaction.guildId);
    const index = guild.randomizer.indexOf(user.id);

    if (index === -1) {
      await interaction.reply({ content: `${user} isn't in the list.`, flags: MessageFlags.Ephemeral });
      return;
    }

    guild.randomizer.splice(index, 1);
    save();

    await interaction.reply({
      content: `Removed ${user} from the randomizer (${guild.randomizer.length} people).`,
      allowedMentions: { users: [] },
    });
  },
};
