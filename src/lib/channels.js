import { ChannelType, PermissionFlagsBits } from 'discord.js';

export const DEFAULT_CHANNEL_NAME = 'reviews-and-updates';
export const POSTABLE_CHANNEL_TYPES = [ChannelType.GuildText, ChannelType.GuildAnnouncement];

const THREAD_PERMS = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.CreatePublicThreads,
  PermissionFlagsBits.SendMessagesInThreads,
];

export const MISSING_PERMS_MESSAGE = (channel) =>
  `I need permission to send messages, create public threads, and send messages in threads in ${channel}.`;

/** The channel picked in the command, else `fallbackChannelId` (if it still exists), else #reviews-and-updates. */
export async function resolveChannel(interaction, fallbackChannelId) {
  const picked = interaction.options.getChannel('channel');
  if (picked) return picked;

  if (fallbackChannelId) {
    const fallback = await interaction.guild.channels.fetch(fallbackChannelId).catch(() => null);
    if (fallback) return fallback;
  }

  const channels = await interaction.guild.channels.fetch();
  return channels.find((c) => c?.name === DEFAULT_CHANNEL_NAME && POSTABLE_CHANNEL_TYPES.includes(c.type)) ?? null;
}

/** True if the bot can't post and start threads in `channel`. */
export function missingThreadPerms(channel, me) {
  return !channel.permissionsFor(me)?.has(THREAD_PERMS);
}
