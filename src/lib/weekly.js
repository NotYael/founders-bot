// Weekly posts that go out every Monday at 7 PM Philippine time, each with a start/stop/test command.
import { InteractionContextType, MessageFlags, SlashCommandBuilder } from 'discord.js';
import {
  DEFAULT_CHANNEL_NAME,
  MISSING_PERMS_MESSAGE,
  missingThreadPerms,
  POSTABLE_CHANNEL_TYPES,
  resolveChannel,
} from './channels.js';
import { postPairings } from './randomizer.js';
import { getGuild, save } from './store.js';
import { postUpdates } from './updates.js';

// Monday 7:00 PM in the Philippines (UTC+8, no daylight saving) is Monday 11:00 UTC
const RUN_DAY = 1;
const RUN_HOUR_UTC = 11;
const WHEN = 'every Monday at 7 PM (Philippine time)';

// If the bot was down at 7 PM, still post when it comes back, but not more than 6 hours late
export const LATE_LIMIT_MS = 6 * 3_600_000;

/** Next Monday 7 PM Philippine time strictly after `after` (a timestamp in ms). */
export function nextWeeklyRun(after = Date.now()) {
  const d = new Date(after);
  const run = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), RUN_HOUR_UTC));
  run.setUTCDate(run.getUTCDate() + ((RUN_DAY - run.getUTCDay() + 7) % 7));
  if (run.getTime() <= after) run.setUTCDate(run.getUTCDate() + 7);
  return run.getTime();
}

/**
 * The weekly jobs, in the order they're posted when due at the same time.
 * `storeKey` is where the job's { channelId, nextRunAt } lives on the guild (null when stopped).
 * `validate` returns an error message if the job can't run right now.
 */
export const WEEKLY_JOBS = [
  {
    command: 'randomizer',
    storeKey: 'randomizerSchedule',
    label: 'review pairings',
    validate: (guild) =>
      guild.randomizer.length < 2 ? 'Need at least 2 people in the list. Add people with `/randomizer-add`.' : null,
    post: (channel, guild) => postPairings(channel, guild.randomizer),
  },
  {
    command: 'updates',
    storeKey: 'updates',
    label: 'updates thread',
    validate: () => null,
    post: (channel, guild) => postUpdates(channel, guild.randomizer),
  },
];

/** Builds a `/<command> start|stop|test` slash command for a weekly job. */
export function weeklyCommand(commandName, description) {
  const job = WEEKLY_JOBS.find((j) => j.command === commandName);
  const channelOption = (fallback) => (o) =>
    o
      .setName('channel')
      .setDescription(`Where to post (default: ${fallback})`)
      .addChannelTypes(...POSTABLE_CHANNEL_TYPES);

  return {
    restricted: true,
    data: new SlashCommandBuilder()
      .setName(commandName)
      .setDescription(`${description} Runs ${WHEN}.`)
      .setContexts(InteractionContextType.Guild)
      .addSubcommand((s) =>
        s
          .setName('start')
          .setDescription(`Post the ${job.label} ${WHEN}.`)
          .addChannelOption(channelOption(`#${DEFAULT_CHANNEL_NAME}`)),
      )
      .addSubcommand((s) => s.setName('stop').setDescription(`Stop the weekly ${job.label}.`))
      .addSubcommand((s) =>
        s
          .setName('test')
          .setDescription(`Post the ${job.label} right now (does not change the schedule).`)
          .addChannelOption(channelOption(`the scheduled channel, else #${DEFAULT_CHANNEL_NAME}`)),
      ),

    async execute(interaction) {
      const guild = getGuild(interaction.guildId);
      const subcommand = interaction.options.getSubcommand();

      if (subcommand === 'stop') {
        if (!guild[job.storeKey]) {
          await interaction.reply({ content: `The weekly ${job.label} isn't running.`, flags: MessageFlags.Ephemeral });
          return;
        }
        guild[job.storeKey] = null;
        save();
        await interaction.reply({ content: `Stopped the weekly ${job.label}.`, flags: MessageFlags.Ephemeral });
        return;
      }

      // Posting can take a few seconds, longer than Discord's 3s reply window
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      const channel = await resolveChannel(interaction, subcommand === 'test' ? guild[job.storeKey]?.channelId : null);
      if (!channel) {
        await interaction.editReply(`Couldn't find #${DEFAULT_CHANNEL_NAME}. Pick a channel instead.`);
        return;
      }
      if (missingThreadPerms(channel, interaction.guild.members.me)) {
        await interaction.editReply(MISSING_PERMS_MESSAGE(channel));
        return;
      }

      if (subcommand === 'start') {
        guild[job.storeKey] = { channelId: channel.id, nextRunAt: nextWeeklyRun(), createdBy: interaction.user.id };
        save();
        await interaction.editReply(
          `The ${job.label} will be posted in ${channel} ${WHEN}. Next one <t:${Math.floor(guild[job.storeKey].nextRunAt / 1000)}:F>.`,
        );
        return;
      }

      const error = job.validate(guild);
      if (error) {
        await interaction.editReply(error);
        return;
      }
      await job.post(channel, guild);
      await interaction.editReply(`Posted the ${job.label} in ${channel}.`);
    },
  };
}
