import { ROLES } from '../config/roles';

/** Demo foydalanuvchilar (frontend; backendda parol hash qilinadi) */
export const defaultUsers = [
  {
    id: 1,
    username: 'admin',
    password: 'admin123',
    name: 'Administrator',
    role: ROLES.ADMIN,
    active: true,
  },
  {
    id: 2,
    username: 'kassir',
    password: 'kassir123',
    name: 'Akmaljon',
    role: ROLES.CASHIER,
    active: true,
  },
];
