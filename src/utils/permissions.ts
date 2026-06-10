import { User } from '../../types';

export type Permission =
  | 'manage_system_users'    // God-admin only: Create/delete users system-wide
  | 'manage_garden_access'   // Manage users for a specific garden
  | 'manage_garden_settings' // Edit garden profile (name, image)
  | 'manage_dictionary'      // Add/edit/delete plant archetypes
  | 'manage_addons'          // Add/edit/delete add-ons
  | 'manage_spaces'          // Add/edit/delete locations and zones
  | 'manage_inventory'       // Add/delete plant instances
  | 'perform_actions'        // Water, feed, add journal entries
  | 'view_print_queue'       // View and manage the print queue
  | 'view_system_settings';  // View advanced system settings

export const hasPermission = (user: User | null | undefined, permission: Permission): boolean => {
  if (!user) return false;

  // God-admins can do absolutely everything
  if (user.role === 'god-admin') return true;

  const role = user.workspaceRole || 'viewer';

  switch (permission) {
    case 'manage_system_users':
    case 'view_system_settings':
      return false; // God-admin only
      
    case 'manage_garden_access':
    case 'manage_garden_settings':
    case 'manage_dictionary':
    case 'view_print_queue':
      return role === 'owner'; // Currently owner-level tasks
      
    case 'manage_spaces':
    case 'manage_inventory':
      return role === 'owner' || role === 'admin';
      
    case 'perform_actions':
      return role === 'owner' || role === 'admin' || role === 'helper';
      
    default:
      return false;
  }
};
