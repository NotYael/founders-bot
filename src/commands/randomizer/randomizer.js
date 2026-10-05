import { InteractionContextType, MessageFlags, SlashCommandBuilder, ThreadAutoArchiveDuration } from 'discord.js';
import {
  DEFAULT_CHANNEL_NAME,
  MISSING_PERMS_MESSAGE,
  missingThreadPerms,
  POSTABLE_CHANNEL_TYPES,
  resolveChannel,
} from '../../lib/channels.js';
import { circularPairs } from '../../lib/randomizer.js';
import { getGuild } from '../../lib/store.js';

const ANNOUNCEMENT =
  '📢 **Announcement:** Tasks need to be finished **2 days before** the meeting and reviewed **1 day before** the meeting.';

export default {
  restricted: true,
  data: new SlashCommandBuilder()
    .setName('randomizer')
    .setDescription('Randomly pair everyone in a review circle (A reviews B, B reviews C, ... last reviews A).')
    .setContexts(InteractionContextType.Guild)
    .addChannelOption((o) =>
      o
        .setName('channel')
        .setDescription(`Where to post (default: #${DEFAULT_CHANNEL_NAME})`)
        .addChannelTypes(...POSTABLE_CHANNEL_TYPES),
    ),

  async execute(interaction) {
    const { randomizer } = getGuild(interaction.guildId);

    if (randomizer.length < 2) {
      await interaction.reply({
        content: 'Need at least 2 people in the list. Add people with `/randomizer-add`.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const channel = await resolveChannel(interaction);
    if (!channel) {
      await interaction.reply({
        content: `Couldn't find #${DEFAULT_CHANNEL_NAME}. Pick a channel instead.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    if (missingThreadPerms(channel, interaction.guild.members.me)) {
      await interaction.reply({ content: MISSING_PERMS_MESSAGE(channel), flags: MessageFlags.Ephemeral });
      return;
    }

    // Posting one message + thread per pair can take a few seconds, longer than Discord's 3s reply window
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const members = await interaction.guild.members.fetch({ user: randomizer });
    const name = (id) => members.get(id)?.displayName ?? 'Unknown';

    await channel.send(`${ANNOUNCEMENT}\n\n🔄 **Review pairings** are below. Use your pairing's thread to coordinate.`);

    // One message per pair (pinging both), each with its own thread for the pair to talk in
    for (const { reviewer, reviewee } of circularPairs(randomizer)) {
      const message = await channel.send({
        content: `<@${reviewer}> ➜ reviews ➜ <@${reviewee}>`,
        allowedMentions: { users: [reviewer, reviewee] },
      });
      await message.startThread({
        name: `${name(reviewer)} ➜ ${name(reviewee)}`.slice(0, 100),
        autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
      });
    }

    await interaction.editReply(`Posted the review pairings in ${channel}.`);
  },
};
