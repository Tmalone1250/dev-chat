import { Server } from '../models/Server';

export type Permission =
  | 'ADMINISTRATOR'
  | 'MANAGE_SERVER'
  | 'MANAGE_CHANNELS'
  | 'MANAGE_ROLES'
  | 'MANAGE_MESSAGES'
  | 'CREATE_INSTANT_INVITE'
  | 'SEND_MESSAGES'
  | 'EMBED_LINKS'
  | 'ATTACH_FILES'
  | 'ADD_REACTIONS'
  | 'USE_EXTERNAL_EMOJIS'
  | 'CONNECT'
  | 'SPEAK'
  | 'VIDEO'
  | 'MUTE_MEMBERS'
  | 'DEAFEN_MEMBERS'
  | 'MOVE_MEMBERS';

interface PermissionOverwrite {
  allow: Permission[];
  deny: Permission[];
}

export const DEFAULT_PERMISSIONS: Record<string, Permission[]> = {
  '@everyone': [
    'SEND_MESSAGES',
    'EMBED_LINKS',
    'ATTACH_FILES',
    'ADD_REACTIONS',
    'USE_EXTERNAL_EMOJIS',
    'CONNECT',
    'SPEAK',
  ],
  'Admin': [
    'ADMINISTRATOR',
  ],
  'Moderator': [
    'MANAGE_MESSAGES',
    'MUTE_MEMBERS',
    'MOVE_MEMBERS',
  ],
};

export const checkPermission = async (
  userId: string,
  serverId: string,
  permission: Permission
): Promise<boolean> => {
  try {
    const server = await Server.findById(serverId);
    if (!server) return false;

    // Server owner has all permissions
    if (server.owner.toString() === userId) return true;

    const member = server.members.find(m => m.user.toString() === userId);
    if (!member) return false;

    // Check if user has administrator role
    const hasAdminRole = member.roles.some(role => {
      const serverRole = server.roles.find(r => r.name === role);
      return serverRole?.permissions.includes('ADMINISTRATOR');
    });

    if (hasAdminRole) return true;

    // Check specific permission
    return member.roles.some(role => {
      const serverRole = server.roles.find(r => r.name === role);
      return serverRole?.permissions.includes(permission);
    });
  } catch (error) {
    console.error('Check permission error:', error);
    return false;
  }
};

export const calculatePermissions = (
  userRoles: string[],
  serverRoles: Array<{ name: string; permissions: Permission[] }>,
  channelOverwrites?: Array<{ role: string; allow: Permission[]; deny: Permission[] }>
): Permission[] => {
  // Start with base permissions from @everyone role
  let permissions = new Set<Permission>(DEFAULT_PERMISSIONS['@everyone']);

  // Add permissions from user roles
  userRoles.forEach(roleName => {
    const role = serverRoles.find(r => r.name === roleName);
    if (role) {
      role.permissions.forEach(permission => permissions.add(permission));
    }
  });

  // Apply channel permission overwrites if they exist
  if (channelOverwrites) {
    userRoles.forEach(roleName => {
      const overwrite = channelOverwrites.find(o => o.role === roleName);
      if (overwrite) {
        // Remove denied permissions
        overwrite.deny.forEach(permission => permissions.delete(permission));
        // Add allowed permissions
        overwrite.allow.forEach(permission => permissions.add(permission));
      }
    });
  }

  return Array.from(permissions);
};

export const hasPermission = (
  userPermissions: Permission[],
  requiredPermission: Permission
): boolean => {
  return userPermissions.includes('ADMINISTRATOR') || 
         userPermissions.includes(requiredPermission);
};
