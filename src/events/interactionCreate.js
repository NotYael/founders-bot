import { Events, MessageFlags } from 'discord.js';
import { canUseRestricted } from '../lib/access.js';
import { getGuild } from '../lib/store.js';

export default {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) {
      console.warn(`No command matching "${interaction.commandName}" was found.`);
      return;
    }

    if (command.restricted && !canUseRestricted(interaction)) {
      const { managerRoleId } = getGuild(interaction.guildId);
      await interaction.reply({
        content: managerRoleId
          ? `Only members with the <@&${managerRoleId}> role can use this command.`
          : 'Only server managers can use this command. An admin can grant access with `/set-manager-role`.',
        flags: MessageFlags.Ephemeral,
        allowedMentions: { parse: [] },
      });
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`Error running /${interaction.commandName}:`, error);
      const reply = { content: 'Something went wrong running that command.', flags: MessageFlags.Ephemeral };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply);
      } else {
        await interaction.reply(reply);
      }
    }
  },
};
