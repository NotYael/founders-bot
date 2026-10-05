import { InteractionContextType, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { getGuild, save } from '../../lib/store.js';

export default {
  restricted: true,
  data: new SlashCommandBuilder()
    .setName('schedule-delete')
    .setDescription('Stop a scheduled message.')
    .setContexts(InteractionContextType.Guild)
    .addIntegerOption((o) => o.setName('id').setDescription('Schedule number from /schedule-list').setRequired(true)),

  async execute(interaction) {
    const id = interaction.options.getInteger('id');
    const guild = getGuild(interaction.guildId);
    const index = guild.schedules.findIndex((s) => s.id === id);

    if (index === -1) {
      await interaction.reply({ content: `No schedule #${id}. See \`/schedule-list\`.`, flags: MessageFlags.Ephemeral });
      return;
    }

    guild.schedules.splice(index, 1);
    save();

    await interaction.reply({ content: `Stopped scheduled message #${id}. Messages it already posted are kept.`, flags: MessageFlags.Ephemeral });
  },
};
