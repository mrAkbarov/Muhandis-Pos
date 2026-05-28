import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ROLES } from '../config/roles';
import { defaultUsers } from '../data/initialUsers';

const USERS_KEY = 'pos_users';
const SESSION_KEY = 'pos_session_user_id';

const AuthContext = createContext(null);

function loadUsers() {
  const stored = localStorage.getItem(USERS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      /* ignore */
    }
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

  const addCashier = useCallback(({ username, password, name }) => {
    const un = username.trim().toLowerCase();
    if (!un || !password || !name?.trim()) {
      return { ok: false, error: "Barcha maydonlarni to'ldiring" };
    }
    if (users.some((u) => u.username.toLowerCase() === un)) {
      return { ok: false, error: 'Bu login band' };
    }
    const newUser = {
      id: Date.now(),
      username: un,
      password,
      name: name.trim(),
      role: ROLES.CASHIER,
      active: true,
    };
    setUsers((prev) => [...prev, newUser]);
    return { ok: true };
  }, [users]);

  const toggleCashierActive = useCallback((userId, active) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId && u.role === ROLES.CASHIER ? { ...u, active } : u))
    );
    if (currentUser?.id === userId && !active) {
      logout();
    }
  }, [currentUser, logout]);

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

  const cashiers = users.filter((u) => u.role === ROLES.CASHIER);

  return (
    <AuthContext.Provider
      value={{
        authReady,
        currentUser,
        users,
        cashiers,
        login,
        logout,
        addCashier,
        toggleCashierActive,
        updateOwnPassword,
        isAdmin: currentUser?.role === ROLES.ADMIN,
        isCashier: currentUser?.role === ROLES.CASHIER,
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
