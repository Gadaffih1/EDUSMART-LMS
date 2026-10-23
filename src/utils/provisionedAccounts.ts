import { User } from '../types';

const STORAGE_KEY = 'edusmart_provisioned_accounts_v1';

function readAll(): User[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(users: User[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

export function listProvisionedAccounts(): User[] {
  return readAll();
}

export function findProvisionedAccount(identifier: string): User | undefined {
  const clean = identifier.trim().toLowerCase();
  if (!clean) return undefined;
  return readAll().find((user) =>
    (user.email && user.email.toLowerCase() === clean) ||
    (user.admissionNumber && user.admissionNumber.toLowerCase() === clean) ||
    (user.staffNumber && user.staffNumber.toLowerCase() === clean)
  );
}

/** Kept outside the per-login cache so a new account can still sign in. */
export function saveProvisionedAccount(user: User): User {
  const all = readAll();
  const email = (user.email || '').trim().toLowerCase();
  const index = all.findIndex((item) => item.id === user.id || (email && item.email.toLowerCase() === email));
  const saved: User = { ...user, email };
  if (index >= 0) all[index] = { ...all[index], ...saved };
  else all.push(saved);
  writeAll(all);
  return saved;
}

export function removeProvisionedAccount(id: string): void {
  writeAll(readAll().filter((user) => user.id !== id));
}
