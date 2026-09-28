import {
  EmbedBuilder,
  InteractionContextType,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import { formatInterval } from '../../lib/scheduler.js';
import { getGuild } from '../../lib/store.js';

const PREVIEW_LENGTH = 80;

export default {
  restricted: true,
  data: new SlashCommandBuilder()
    .setName('schedule-list')
    .setDescription('Show all scheduled messages in this server.')
    .setContexts(InteractionContextType.Guild),

  async execute(interaction) {
    const { schedules } = getGuild(interaction.guildId);

    const description = schedules.length
      ? schedules
          .map((s) => {
            const preview = s.message.replaceAll('\n', ' ');
            const text = preview.length > PREVIEW_LENGTH ? `${preview.slice(0, PREVIEW_LENGTH)}…` : preview;
            return `**#${s.id}** · <#${s.channelId}> · every ${formatInterval(s.intervalMs)} · next <t:${Math.floor(s.nextRunAt / 1000)}:R>\n> ${text}`;
          })
          .join('\n\n')
      : 'No scheduled messages. Create one with `/schedule-add`.';

    const embed = new EmbedBuilder()
      .setTitle(`Scheduled messages (${schedules.length})`)
      .setDescription(description.slice(0, 4096))
      .setColor(0x5865f2);

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};
