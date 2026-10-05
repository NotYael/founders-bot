import { allGuilds, save } from './store.js';
import { LATE_LIMIT_MS, nextWeeklyRun, WEEKLY_JOBS } from './weekly.js';

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
  let running = false;

  const tick = async () => {
    // A slow round (e.g. posting many threads) must not overlap the next one, or posts could double up
    if (running) return;
    running = true;
    try {
      await runDue(client);
    } finally {
      running = false;
    }
  };

  tick();
  setInterval(tick, CHECK_EVERY_MS);
}

async function runDue(client) {
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

    for (const job of WEEKLY_JOBS) {
      const schedule = guild[job.storeKey];
      if (!schedule || schedule.nextRunAt > now) continue;

      // Post late if the bot was down at 7 PM, but not more than 6 hours late
      if (now - schedule.nextRunAt < LATE_LIMIT_MS) {
        try {
          const error = job.validate(guild);
          if (error) throw new Error(error);
          const channel = await client.channels.fetch(schedule.channelId);
          await job.post(channel, guild);
        } catch (error) {
          console.error(`Weekly ${job.label} failed:`, error.message);
        }
      }

      schedule.nextRunAt = nextWeeklyRun(now);
      changed = true;
    }
  }

  if (changed) save();
}
