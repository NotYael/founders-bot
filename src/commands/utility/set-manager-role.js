import { InteractionContextType, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { getGuild, save } from '../../lib/store.js';

export default {
  data: new SlashCommandBuilder()
    .setName('set-manager-role')
    .setDescription('Choose which role can use restricted commands (leave empty to clear).')
    .setContexts(InteractionContextType.Guild)
    // Only admins (Manage Server) can see/use this one — enforced by Discord itself
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addRoleOption((o) => o.setName('role').setDescription('The manager role')),

  async execute(interaction) {
    const role = interaction.options.getRole('role');
    const guild = getGuild(interaction.guildId);

    guild.managerRoleId = role?.id ?? null;
    save();

    const restricted = interaction.client.commands
      .filter((cmd) => cmd.restricted)
      .map((cmd) => `\`/${cmd.data.name}\``)
      .sort()
      .join(', ');

    await interaction.reply({
      content: role
        ? `Members with ${role} can now use: ${restricted}`
        : `Manager role cleared. Only members with Manage Server can use: ${restricted}`,
      flags: MessageFlags.Ephemeral,
      allowedMentions: { parse: [] },
    });
  },
};
