import { PermissionFlagsBits } from 'discord.js';
import { getGuild } from './store.js';

/**
 * Commands that export `restricted: true` can only be used by:
 *   - members with the server's manager role (set via /set-manager-role), or
 *   - members with Manage Server permission (so admins are never locked out).
 */
export function canUseRestricted(interaction) {
  if (interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) return true;

  const roleId = getGuild(interaction.guildId).managerRoleId;
  if (!roleId) return false;

  const { roles } = interaction.member;
  return Array.isArray(roles) ? roles.includes(roleId) : roles.cache.has(roleId);
}
