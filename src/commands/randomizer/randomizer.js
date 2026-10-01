import { EmbedBuilder, InteractionContextType, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { circularPairs } from '../../lib/randomizer.js';
import { getGuild } from '../../lib/store.js';

export default {
  restricted: true,
  data: new SlashCommandBuilder()
    .setName('randomizer')
    .setDescription('Randomly pair everyone in a review circle (A reviews B, B reviews C, ... last reviews A).')
    .setContexts(InteractionContextType.Guild),

  async execute(interaction) {
    const { randomizer } = getGuild(interaction.guildId);

    if (randomizer.length < 2) {
      await interaction.reply({
        content: 'Need at least 2 people in the list. Add people with `/randomizer-add`.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const pairs = circularPairs(randomizer);

    const announcement =
      '📢 **Announcement:** Tasks need to be finished **2 days before** the meeting and reviewed **1 day before** the meeting.';

    // Separate inline fields render as columns, which keeps every row aligned
    // regardless of how wide each name is.
    const embed = new EmbedBuilder()
      .setTitle('🔄 Review pairings')
      .addFields(
        { name: 'Reviewer', value: pairs.map(({ reviewer }) => `<@${reviewer}>`).join('\n'), inline: true },
        { name: '​', value: pairs.map(() => '➜').join('\n'), inline: true },
        { name: 'Reviews', value: pairs.map(({ reviewee }) => `<@${reviewee}>`).join('\n'), inline: true },
      )
      .setColor(0x5865f2);

    // Mentions inside embeds never ping, so ping everyone in the message text
    await interaction.reply({
      content: `${announcement}\n${randomizer.map((id) => `<@${id}>`).join(' ')}`,
      embeds: [embed],
      allowedMentions: { users: randomizer },
    });
  },
};
