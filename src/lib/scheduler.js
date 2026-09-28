import { allGuilds, save } from './store.js';

const CHECK_EVERY_MS = 30_000;

export const UNITS = {
  minutes: 60_000,
  hours: 3_600_000,
  days: 86_400_000,
  weeks: 604_800_000,
};

export function formatInterval(ms) {
  for (const [unit, size] of Object.entries(UNITS).reverse()) {
    if (ms % size === 0) {
      const n = ms / size;
      return `${n} ${n === 1 ? unit.slice(0, -1) : unit}`;
    }
  }
  return `${ms}ms`;
}

/**
 * Checks every 30s for scheduled messages that are due. Storing the next run time (instead of
 * using setInterval per message) means schedules survive bot restarts and work for long intervals.
 */
export function startScheduler(client) {
  const tick = async () => {
    const now = Date.now();
    let changed = false;

    for (const [, guild] of allGuilds()) {
      for (const schedule of guild.schedules) {
        if (schedule.nextRunAt > now) continue;

        try {
          const channel = await client.channels.fetch(schedule.channelId);
          await channel.send(schedule.message);
        } catch (error) {
          console.error(`Scheduled message #${schedule.id} failed:`, error.message);
        }

        // Skip any runs missed while the bot was offline instead of spamming them all at once
        while (schedule.nextRunAt <= now) schedule.nextRunAt += schedule.intervalMs;
        changed = true;
      }
    }

    if (changed) save();
  };

  tick();
  setInterval(tick, CHECK_EVERY_MS);
}
