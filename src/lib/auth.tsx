"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "jee_tracker_users";
const SESSION_KEY = "jee_tracker_session";

function getUsers(): Record<string, { user: User; passwordHash: string }> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveUsers(users: Record<string, { user: User; passwordHash: string }>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

// Simple deterministic hash (not cryptographic — fine for local demo)
function hashPassword(password: string): string {
  let h = 0;
  for (let i = 0; i < password.length; i++) {
    h = (Math.imul(31, h) + password.charCodeAt(i)) | 0;
  }
  return h.toString(36) + password.length.toString(36);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const session = localStorage.getItem(SESSION_KEY);
      if (session) {
        const parsed = JSON.parse(session) as User;
        setUser(parsed);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<{ error?: string }> => {
    const users = getUsers();
    const key = email.toLowerCase().trim();
    const record = users[key];
    if (!record) return { error: "No account found with that email." };
    if (record.passwordHash !== hashPassword(password)) return { error: "Incorrect password." };
    setUser(record.user);
    localStorage.setItem(SESSION_KEY, JSON.stringify(record.user));
    return {};
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string): Promise<{ error?: string }> => {
    const users = getUsers();
    const key = email.toLowerCase().trim();
    if (users[key]) return { error: "An account with that email already exists." };
    if (password.length < 6) return { error: "Password must be at least 6 characters." };
    const newUser: User = {
      id: Math.random().toString(36).slice(2, 10),
      name: name.trim(),
      email: key,
      createdAt: new Date().toISOString(),
    };
    users[key] = { user: newUser, passwordHash: hashPassword(password) };
    saveUsers(users);
    setUser(newUser);
    localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
    return {};
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
