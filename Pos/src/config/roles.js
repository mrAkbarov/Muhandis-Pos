export const ROLES = {
  ADMIN: 'admin',
  CASHIER: 'cashier',
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Administrator',
  [ROLES.CASHIER]: 'Kassir',
};

/** Marshrut → ruxsat berilgan rollar */
export const ROUTE_ROLES = {
  '/': [ROLES.ADMIN, ROLES.CASHIER],
  '/pos': [ROLES.CASHIER],
  '/products': [ROLES.ADMIN, ROLES.CASHIER],
  '/inventory': [ROLES.ADMIN, ROLES.CASHIER],
  '/agents': [ROLES.ADMIN, ROLES.CASHIER],
  '/dilerlar/zakaz': [ROLES.ADMIN],
  '/dilerlar/prixod': [ROLES.ADMIN],
  '/suppliers': [ROLES.ADMIN],
  '/purchase-orders': [ROLES.ADMIN],
  '/ai-analytics': [ROLES.ADMIN],
  '/expire-management': [ROLES.ADMIN, ROLES.CASHIER],
  '/reports': [ROLES.ADMIN],
  '/settings': [ROLES.ADMIN, ROLES.CASHIER],
};

export function canAccessRoute(role, pathname) {
  if (!role) return false;
  const allowed = ROUTE_ROLES[pathname];
  if (allowed) return allowed.includes(role);
  if (pathname.startsWith('/dilerlar')) {
    return ROUTE_ROLES['/dilerlar/zakaz'].includes(role);
  }
  return false;
}

export function getHomePath(role) {
  return role === ROLES.CASHIER ? '/pos' : '/';
}

export function hasRole(user, role) {
  return user?.role === role;
}

export function isAdmin(user) {
  return hasRole(user, ROLES.ADMIN);
}
