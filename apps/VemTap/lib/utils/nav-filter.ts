export interface NavFilterItem {
  roles?: string[];
  permission?: string;
}

export function canAccessMenuItem(
  item: NavFilterItem,
  userRole: string,
  userPermissions: string[],
  isOwnerOrAdmin: boolean,
): boolean {
  if (isOwnerOrAdmin) return true;

  if (item.permission) {
    return userPermissions.includes(item.permission);
  }

  if (item.roles && !item.roles.includes(userRole)) {
    return false;
  }

  return true;
}
