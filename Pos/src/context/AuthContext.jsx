import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { ROLES, isAdmin } from '../config/roles';
import { getPermissions, canManageUsers } from '../config/permissions';
import { defaultUsers } from '../data/initialUsers';

const USERS_KEY = 'pos_users';
const SESSION_KEY = 'pos_session_user_id';

const AuthContext = createContext(null);

function mergeDefaultUsers(existing) {
  const byUsername = new Map(existing.map((u) => [u.username.toLowerCase(), u]));
  let changed = false;
  for (const du of defaultUsers) {
    if (!byUsername.has(du.username.toLowerCase())) {
      byUsername.set(du.username.toLowerCase(), du);
      changed = true;
    }
  }
  return changed ? [...byUsername.values()] : existing;
}

function loadUsers() {
  try {
    const stored = localStorage.getItem(USERS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const merged = mergeDefaultUsers(parsed);
        if (merged.length !== parsed.length) {
          localStorage.setItem(USERS_KEY, JSON.stringify(merged));
        }
        return merged;
      }
    }
  } catch {
    /* ignore */
  }
  localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
  return defaultUsers;
}

export function AuthProvider({ children }) {
  const [users, setUsers] = useState(loadUsers);
  const [currentUser, setCurrentUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const sessionId = localStorage.getItem(SESSION_KEY);
    if (sessionId) {
      const list = loadUsers();
      const user = list.find((u) => String(u.id) === sessionId && u.active);
      if (user) {
        setCurrentUser(user);
        setUsers(list);
      } else {
        localStorage.removeItem(SESSION_KEY);
      }
    }
    setAuthReady(true);
  }, []);

  useEffect(() => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }, [users]);

  const login = useCallback((username, password) => {
    const normalized = username.trim().toLowerCase();
    const user = users.find(
      (u) => u.username.toLowerCase() === normalized && u.password === password && u.active
    );
    if (!user) {
      return { ok: false, error: "Login yoki parol noto'g'ri" };
    }
    setCurrentUser(user);
    localStorage.setItem(SESSION_KEY, String(user.id));
    return { ok: true, user };
  }, [users]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem(SESSION_KEY);
  }, []);

  const addUser = useCallback(({ username, password, name, role }) => {
    const un = username.trim().toLowerCase();
    if (!un || !password || !name?.trim()) {
      return { ok: false, error: "Barcha maydonlarni to'ldiring" };
    }
    if (!Object.values(ROLES).includes(role)) {
      return { ok: false, error: 'Rol tanlanmagan' };
    }
    if (users.some((u) => u.username.toLowerCase() === un)) {
      return { ok: false, error: 'Bu login band' };
    }
    const newUser = {
      id: Date.now(),
      username: un,
      password,
      name: name.trim(),
      role,
      active: true,
    };
    setUsers((prev) => [...prev, newUser]);
    return { ok: true };
  }, [users]);

  const addCashier = useCallback((form) => addUser({ ...form, role: ROLES.CASHIER }), [addUser]);

  const updateUserRole = useCallback((userId, role) => {
    if (!Object.values(ROLES).includes(role)) {
      return { ok: false, error: 'Noto\'g\'ri rol' };
    }
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role } : u))
    );
    if (currentUser?.id === userId) {
      setCurrentUser((u) => ({ ...u, role }));
    }
    return { ok: true };
  }, [currentUser]);

  const toggleUserActive = useCallback((userId, active) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, active } : u))
    );
    if (currentUser?.id === userId && !active) {
      logout();
    }
  }, [currentUser, logout]);

  const toggleCashierActive = toggleUserActive;

  const updateOwnPassword = useCallback((currentPassword, newPassword) => {
    if (!currentUser) return { ok: false, error: 'Kirmagansiz' };
    if (currentUser.password !== currentPassword) {
      return { ok: false, error: "Joriy parol noto'g'ri" };
    }
    if (!newPassword || newPassword.length < 4) {
      return { ok: false, error: 'Yangi parol kamida 4 belgi' };
    }
    setUsers((prev) =>
      prev.map((u) => (u.id === currentUser.id ? { ...u, password: newPassword } : u))
    );
    setCurrentUser((u) => ({ ...u, password: newPassword }));
    return { ok: true };
  }, [currentUser]);

  const permissions = useMemo(
    () => getPermissions(currentUser?.role),
    [currentUser?.role]
  );

  const staffUsers = users.filter((u) => u.id !== currentUser?.id || true);

  return (
    <AuthContext.Provider
      value={{
        authReady,
        currentUser,
        users,
        staffUsers,
        cashiers: users.filter((u) => u.role === ROLES.CASHIER),
        permissions,
        login,
        logout,
        addUser,
        addCashier,
        updateUserRole,
        toggleUserActive,
        toggleCashierActive,
        updateOwnPassword,
        isAdmin: isAdmin(currentUser),
        isCashier: currentUser?.role === ROLES.CASHIER,
        canManageUsers: canManageUsers(currentUser?.role),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth AuthProvider ichida ishlatilishi kerak');
  return ctx;
}
