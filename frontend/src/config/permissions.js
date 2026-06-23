import { ROLES } from './roles';

/** Rol bo'yicha funksional huquqlar */
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: {
    viewProfit: true,
    viewNetProfitReports: true,
    editProducts: true,
    viewProductCost: true,
    viewStaff: true,
    manageUsers: true,
    systemSettings: true,
    viewMarketReadOnly: false,
    canModifyData: true,
    canRecordCreditPayment: true,
    viewPlatformMonitor: false,
  },
  [ROLES.BOSS]: {
    viewProfit: true,
    viewNetProfitReports: true,
    editProducts: true,
    viewProductCost: true,
    viewStaff: true,
    manageUsers: true,
    systemSettings: false,
    viewMarketReadOnly: true,
    canModifyData: true,
    canRecordCreditPayment: true,
    viewPlatformMonitor: false,
  },
  [ROLES.MANAGER]: {
    viewProfit: false,
    viewNetProfitReports: false,
    editProducts: true,
    viewProductCost: true,
    viewStaff: true,
    manageUsers: false,
    systemSettings: false,
    viewMarketReadOnly: false,
    canModifyData: true,
    canRecordCreditPayment: true,
    viewPlatformMonitor: false,
  },
  [ROLES.CASHIER]: {
    viewProfit: false,
    viewNetProfitReports: false,
    editProducts: false,
    viewProductCost: false,
    viewStaff: false,
    manageUsers: false,
    systemSettings: false,
    viewMarketReadOnly: false,
    canModifyData: false,
    canRecordCreditPayment: true,
    viewPlatformMonitor: false,
  },
};

export function getPermissions(role) {
  return ROLE_PERMISSIONS[role] ?? ROLE_PERMISSIONS[ROLES.CASHIER];
}

/** Platform egasi (superadmin) — hammasini ko'radi, hech narsani o'zgartirmaydi */
export function resolvePermissions(user) {
  const base = getPermissions(user?.role);
  if (user?.isGlobalAdmin) {
    return {
      ...base,
      editProducts: false,
      manageUsers: false,
      systemSettings: false,
      viewMarketReadOnly: true,
      canModifyData: false,
      canRecordCreditPayment: false,
      viewPlatformMonitor: true,
    };
  }
  return base;
}

export function canViewProfit(role) {
  return getPermissions(role).viewProfit;
}

export function canEditProducts(role) {
  return getPermissions(role).editProducts;
}

export function canManageUsers(role) {
  return getPermissions(role).manageUsers;
}
