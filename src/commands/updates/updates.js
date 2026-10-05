import { InteractionContextType, MessageFlags, SlashCommandBuilder } from 'discord.js';
import {
  DEFAULT_CHANNEL_NAME,
  MISSING_PERMS_MESSAGE,
  missingThreadPerms,
  POSTABLE_CHANNEL_TYPES,
  resolveChannel,
} from '../../lib/channels.js';
import { getGuild, save } from '../../lib/store.js';
import { nextUpdatesRun, postUpdates } from '../../lib/updates.js';

export default {
  restricted: true,
  data: new SlashCommandBuilder()
    .setName('updates')
    .setDescription('Weekly updates thread every Monday at 7 PM (Philippine time): start, stop, or test.')
    .setContexts(InteractionContextType.Guild)
    .addSubcommand((s) =>
      s
        .setName('start')
        .setDescription('Post an updates thread in a channel every Monday at 7 PM (Philippine time).')
        .addChannelOption((o) =>
          o
            .setName('channel')
            .setDescription(`Where to post (default: #${DEFAULT_CHANNEL_NAME})`)
            .addChannelTypes(...POSTABLE_CHANNEL_TYPES),
        ),
    )
    .addSubcommand((s) => s.setName('stop').setDescription('Stop the weekly updates thread.'))
    .addSubcommand((s) =>
      s
        .setName('test')
        .setDescription('Post an updates thread right now (does not change the schedule).')
        .addChannelOption((o) =>
          o
            .setName('channel')
            .setDescription(`Where to post (default: the scheduled channel, else #${DEFAULT_CHANNEL_NAME})`)
            .addChannelTypes(...POSTABLE_CHANNEL_TYPES),
        ),
    ),

  async execute(interaction) {
    const guild = getGuild(interaction.guildId);
    const me = interaction.guild.members.me;

    switch (interaction.options.getSubcommand()) {
      case 'start': {
        const channel = await resolveChannel(interaction);
        if (!channel) {
          await interaction.reply({
            content: `Couldn't find #${DEFAULT_CHANNEL_NAME}. Pick a channel instead.`,
            flags: MessageFlags.Ephemeral,
          });
          return;
        }
        if (missingThreadPerms(channel, me)) {
          await interaction.reply({
            content: MISSING_PERMS_MESSAGE(channel),
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        guild.updates = { channelId: channel.id, nextRunAt: nextUpdatesRun(), createdBy: interaction.user.id };
        save();

        await interaction.reply({
          content: `Weekly updates will be posted in ${channel} every Monday at 7 PM (Philippine time). Next one <t:${Math.floor(guild.updates.nextRunAt / 1000)}:F>.`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      case 'stop': {
        if (!guild.updates) {
          await interaction.reply({ content: 'Weekly updates aren\'t running.', flags: MessageFlags.Ephemeral });
          return;
        }

        guild.updates = null;
        save();

        await interaction.reply({ content: 'Stopped the weekly updates.', flags: MessageFlags.Ephemeral });
        return;
      }

      case 'test': {
        const channel = await resolveChannel(interaction, guild.updates?.channelId);
        if (!channel) {
          await interaction.reply({
            content: `Couldn't find #${DEFAULT_CHANNEL_NAME}. Pick a channel instead.`,
            flags: MessageFlags.Ephemeral,
          });
          return;
        }
        if (missingThreadPerms(channel, me)) {
          await interaction.reply({
            content: MISSING_PERMS_MESSAGE(channel),
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        const thread = await postUpdates(channel, guild.randomizer);
        await interaction.reply({ content: `Posted a test updates thread: ${thread}`, flags: MessageFlags.Ephemeral });
        return;
      }
    }
  },
};
