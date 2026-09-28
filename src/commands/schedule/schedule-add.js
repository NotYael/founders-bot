import {
  ChannelType,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';
import { formatInterval, UNITS } from '../../lib/scheduler.js';
import { getGuild, save } from '../../lib/store.js';

export default {
  restricted: true,
  data: new SlashCommandBuilder()
    .setName('schedule-add')
    .setDescription('Post a message to a channel on a repeating interval.')
    .setContexts(InteractionContextType.Guild)
    .addChannelOption((o) =>
      o
        .setName('channel')
        .setDescription('Where to post')
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(true),
    )
    .addIntegerOption((o) => o.setName('every').setDescription('How many units between posts').setMinValue(1).setRequired(true))
    .addStringOption((o) =>
      o
        .setName('unit')
        .setDescription('Interval unit')
        .setRequired(true)
        .addChoices(...Object.keys(UNITS).map((u) => ({ name: u, value: u }))),
    )
    .addStringOption((o) =>
      o.setName('message').setDescription('What to post (use \\n for a new line)').setMaxLength(2000).setRequired(true),
    )
    .addBooleanOption((o) => o.setName('send_now').setDescription('Also post it right away (default: no)')),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');
    const intervalMs = interaction.options.getInteger('every') * UNITS[interaction.options.getString('unit')];
    const message = interaction.options.getString('message').replaceAll('\\n', '\n');
    const sendNow = interaction.options.getBoolean('send_now') ?? false;

    const perms = channel.permissionsFor(interaction.guild.members.me);
    if (!perms?.has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages])) {
      await interaction.reply({ content: `I don't have permission to post in ${channel}.`, flags: MessageFlags.Ephemeral });
      return;
    }

    if (sendNow) await channel.send(message);

    const guild = getGuild(interaction.guildId);
    const schedule = {
      id: guild.nextScheduleId++,
      channelId: channel.id,
      message,
      intervalMs,
      nextRunAt: Date.now() + intervalMs,
      createdBy: interaction.user.id,
    };
    guild.schedules.push(schedule);
    save();

    await interaction.reply({
      content: `Scheduled **#${schedule.id}**: posting in ${channel} every **${formatInterval(intervalMs)}**. Next post <t:${Math.floor(schedule.nextRunAt / 1000)}:R>.`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
