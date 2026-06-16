import { User, AuthState } from '../types';

const AUTH_KEY = 'beacon_auth';

const DEMO_USERS: User[] = [
  {
    id: 'user-001',
    email: 'demo@beacon.dev',
    plan: 'pro',
    createdAt: '2025-01-01T00:00:00Z',
  }
];

export function getAuthState(): AuthState {
  try {
    const stored = localStorage.getItem(AUTH_KEY);
    if (!stored) return { user: null, isAuthenticated: false, isLoaded: true };
    const user = JSON.parse(stored) as User;
    return { user, isAuthenticated: true, isLoaded: true };
  } catch {
    return { user: null, isAuthenticated: false, isLoaded: true };
  }
}

export async function login(email: string, password: string): Promise<User> {
  await new Promise(r => setTimeout(r, 800)); // simulate network delay

  // Allow any email/password for demo, or match demo user
  if (!email || !password) throw new Error('Email and password are required');
  if (password.length < 6) throw new Error('Password must be at least 6 characters');

  const existing = DEMO_USERS.find(u => u.email === email);
  const user: User = existing || {
    id: `user-${Date.now()}`,
    email,
    plan: 'free',
    createdAt: new Date().toISOString(),
  };

  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  return user;
}

export async function signup(email: string, password: string): Promise<User> {
  await new Promise(r => setTimeout(r, 1000));

  if (!email || !password) throw new Error('Email and password are required');
  if (password.length < 6) throw new Error('Password must be at least 6 characters');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Invalid email address');

  const user: User = {
    id: `user-${Date.now()}`,
    email,
    plan: 'free',
    createdAt: new Date().toISOString(),
  };

  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  return user;
}

export function logout(): void {
  localStorage.removeItem(AUTH_KEY);
}
