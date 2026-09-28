import { EmbedBuilder, MessageFlags, SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('commands')
    .setDescription('List all available commands.'),

  async execute(interaction) {
    const lines = interaction.client.commands
      .map((cmd) => `**/${cmd.data.name}**${cmd.restricted ? ' 🔒' : ''} — ${cmd.data.description}`)
      .sort();

    const embed = new EmbedBuilder()
      .setTitle('Commands')
      .setDescription(lines.join('\n'))
      .setFooter({ text: '🔒 = manager role only (see /set-manager-role)' })
      .setColor(0x5865f2);

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};
