import { ThreadAutoArchiveDuration } from 'discord.js';

const UPDATE_WINDOW_MS = 6 * 3_600_000;

/** Posts the weekly updates message, starts a thread on it, and pings everyone in the randomizer list. */
export async function postUpdates(channel, userIds) {
  const deadline = Math.floor((Date.now() + UPDATE_WINDOW_MS) / 1000);
  const pings = userIds.map((id) => `<@${id}>`).join(' ');

  const message = await channel.send({
    content:
      `📝 **Weekly updates**\nPost your update in the thread below within the next 6 hours (by <t:${deadline}:t>, <t:${deadline}:R>).` +
      (pings ? `\n${pings}` : ''),
    allowedMentions: { users: userIds },
  });

  const date = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric' });
  return message.startThread({
    name: `Updates – ${date}`,
    autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
  });
}
