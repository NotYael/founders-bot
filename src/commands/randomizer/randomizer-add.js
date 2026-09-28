import { InteractionContextType, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { getGuild, save } from '../../lib/store.js';

export default {
  restricted: true,
  data: new SlashCommandBuilder()
    .setName('randomizer-add')
    .setDescription('Add a person to the randomizer.')
    .setContexts(InteractionContextType.Guild)
    .addUserOption((o) => o.setName('user').setDescription('Who to add').setRequired(true)),

  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const guild = getGuild(interaction.guildId);

    if (user.bot) {
      await interaction.reply({ content: "Bots can't be added to the randomizer.", flags: MessageFlags.Ephemeral });
      return;
    }
    if (guild.randomizer.includes(user.id)) {
      await interaction.reply({ content: `${user} is already in the list.`, flags: MessageFlags.Ephemeral });
      return;
    }

    guild.randomizer.push(user.id);
    save();

    await interaction.reply({
      content: `Added ${user} to the randomizer (${guild.randomizer.length} people).`,
      allowedMentions: { users: [] },
    });
  },
};
