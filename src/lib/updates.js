import { ThreadAutoArchiveDuration } from 'discord.js';

export const UPDATE_WINDOW_MS = 6 * 3_600_000;

// Monday 7:00 PM in the Philippines (UTC+8, no daylight saving) is Monday 11:00 UTC
const RUN_DAY = 1;
const RUN_HOUR_UTC = 11;

/** Next Monday 7 PM Philippine time strictly after `after` (a timestamp in ms). */
export function nextUpdatesRun(after = Date.now()) {
  const d = new Date(after);
  const run = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), RUN_HOUR_UTC));
  run.setUTCDate(run.getUTCDate() + ((RUN_DAY - run.getUTCDay() + 7) % 7));
  if (run.getTime() <= after) run.setUTCDate(run.getUTCDate() + 7);
  return run.getTime();
}

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
