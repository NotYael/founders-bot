import { EmbedBuilder, InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { getGuild } from '../../lib/store.js';

export default {
  data: new SlashCommandBuilder()
    .setName('randomizer-list')
    .setDescription('Show everyone in the randomizer.')
    .setContexts(InteractionContextType.Guild),

  async execute(interaction) {
    const { randomizer } = getGuild(interaction.guildId);

    const embed = new EmbedBuilder()
      .setTitle(`Randomizer list (${randomizer.length})`)
      .setDescription(
        randomizer.length
          ? randomizer.map((id, i) => `${i + 1}. <@${id}>`).join('\n')
          : 'Nobody yet. Add people with `/randomizer-add`.',
      )
      .setColor(0x5865f2);

    // Mentions inside embeds never ping, so this is safe to show publicly
    await interaction.reply({ embeds: [embed] });
  },
};
