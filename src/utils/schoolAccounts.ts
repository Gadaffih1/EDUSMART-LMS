import { generateSchoolPassword } from './accountCredentials';

export interface SchoolAccount {
  id: string;
  schoolId: string;
  email: string;
  password: string;
  domain: string;
  createdAt: string;
}

const STORAGE_KEY = 'edusmart_school_accounts_v1';

function readAll(): SchoolAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(accounts: SchoolAccount[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
}

export function listSchoolAccounts(): SchoolAccount[] {
  return readAll();
}

export function findSchoolAccountByEmail(email: string): SchoolAccount | undefined {
  const clean = email.trim().toLowerCase();
  return readAll().find((account) => account.email.toLowerCase() === clean);
}

export function findSchoolAccountBySchoolId(schoolId: string): SchoolAccount | undefined {
  return readAll().find((account) => account.schoolId === schoolId);
}

export function nextSchoolPassword(): string {
  return generateSchoolPassword(readAll().length + 1);
}

export function saveSchoolAccount(account: SchoolAccount): SchoolAccount {
  const all = readAll();
  const index = all.findIndex((item) => item.schoolId === account.schoolId);
  const saved: SchoolAccount = {
    ...account,
    email: account.email.trim().toLowerCase(),
    domain: account.domain.trim().toLowerCase(),
    id: index >= 0 ? all[index].id : account.id,
    createdAt: index >= 0 ? all[index].createdAt : account.createdAt,
  };
  if (index >= 0) all[index] = saved;
  else all.push(saved);
  writeAll(all);
  return saved;
}

export function removeSchoolAccount(schoolId: string): void {
  writeAll(readAll().filter((account) => account.schoolId !== schoolId));
}
