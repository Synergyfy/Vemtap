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
  if (item.roles && !item.roles.includes(userRole)) {
    return false;
  }

  if (isOwnerOrAdmin) return true;

  if (item.permission) {
    return userPermissions.includes(item.permission);
  }

  return true;
}
