import { InteractionContextType, MessageFlags, SlashCommandBuilder } from 'discord.js';
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

    const lines = circularPairs(randomizer).map(
      ({ reviewer, reviewee }) => `<@${reviewer}> ➜ reviews ➜ <@${reviewee}>`,
    );

    await interaction.reply({
      content: `🔄 **Review pairings**\n${lines.join('\n')}`,
      allowedMentions: { users: randomizer },
    });
  },
};
