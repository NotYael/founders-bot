import { ThreadAutoArchiveDuration } from 'discord.js';

/** Fisher–Yates shuffle; returns a new array. */
export function shuffle(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Shuffles people into a single circle: each person reviews the next, and the last reviews the first.
 * Everyone reviews exactly one person and is reviewed by exactly one person (never themselves).
 * Returns [{ reviewer, reviewee }, ...].
 */
export function circularPairs(people) {
  const order = shuffle(people);
  return order.map((reviewer, i) => ({ reviewer, reviewee: order[(i + 1) % order.length] }));
}

const ANNOUNCEMENT =
  '📢 **Announcement:** Tasks need to be finished **2 days before** the meeting and reviewed **1 day before** the meeting.';

/**
 * Posts the announcement, then one message per pair (pinging both) with its own thread for the pair to talk in.
 */
export async function postPairings(channel, people) {
  const members = await channel.guild.members.fetch({ user: people });
  const name = (id) => members.get(id)?.displayName ?? 'Unknown';

  await channel.send(`${ANNOUNCEMENT}\n\n🔄 **Review pairings** are below. Use your pairing's thread to coordinate.`);

  for (const { reviewer, reviewee } of circularPairs(people)) {
    const message = await channel.send({
      content: `<@${reviewer}> ➜ reviews ➜ <@${reviewee}>`,
      allowedMentions: { users: [reviewer, reviewee] },
    });
    await message.startThread({
      name: `${name(reviewer)} ➜ ${name(reviewee)}`.slice(0, 100),
      autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
    });
  }
}
