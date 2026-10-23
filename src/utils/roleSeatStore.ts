import { User } from '../types';

const STORAGE_KEY = 'edusmart_role_seats_v1';
const EXCLUDED_ROLES = new Set(['student', 'parent']);

export interface KeptRoleProfile {
  designation?: string;
  department?: string;
  subjects: string[];
  gradeLabel?: string;
  tscNumber?: string;
  staffNumber?: string;
}

export interface RoleSeatHolder {
  userId: string;
  userName: string;
  email: string;
  startedAt: string;
  endedAt?: string;
  kept?: KeptRoleProfile;
}

export interface RoleSeat {
  id: string;
  schoolId: string;
  role: string;
  holders: RoleSeatHolder[];
}

function readAll(): RoleSeat[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(seats: RoleSeat[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seats));
}

export function userInSchool(user: User, schoolId: string): boolean {
  if (user.schoolId) return user.schoolId === schoolId;
  return schoolId === 'tenant-riara';
}

export function isDirectoryRole(role: string | undefined): boolean {
  return Boolean(role) && !EXCLUDED_ROLES.has(role || '');
}

export function keptProfile(user: User): KeptRoleProfile {
  const gradeLabel = user.grade ? `Grade ${user.grade}${user.stream ? ` ${user.stream}` : ''}` : undefined;
  return {
    designation: user.designation,
    department: user.department,
    subjects: user.assignedSubjects ? [...user.assignedSubjects] : [],
    gradeLabel,
    tscNumber: user.tscNumber,
    staffNumber: user.staffNumber,
  };
}

export function listRoleSeats(schoolId: string): RoleSeat[] {
  return readAll().filter((seat) => seat.schoolId === schoolId);
}

export function openHolder(seat: RoleSeat): RoleSeatHolder | undefined {
  return [...seat.holders].reverse().find((holder) => !holder.endedAt);
}

export function ensureRoleSeats(schoolId: string, users: User[]): RoleSeat[] {
  const all = readAll();
  const seats = all.filter((seat) => seat.schoolId === schoolId);
  const known = new Set(seats.flatMap((seat) => seat.holders.map((holder) => holder.userId)));
  let changed = false;
  for (const user of users) {
    if (!userInSchool(user, schoolId) || !isDirectoryRole(user.role) || user.roleReleasedAt) continue;
    if (known.has(user.id)) continue;
    if (seats.some((seat) => openHolder(seat)?.userId === user.id)) continue;
    seats.push({
      id: `seat-${schoolId}-${user.role}-${user.id}`,
      schoolId,
      role: user.role,
      holders: [{
        userId: user.id,
        userName: user.name,
        email: user.email,
        startedAt: user.roleStartedAt || '2026-01-08T08:30:00.000Z',
      }],
    });
    known.add(user.id);
    changed = true;
  }
  if (changed) writeAll([...all.filter((seat) => seat.schoolId !== schoolId), ...seats]);
  return seats;
}

function saveSchool(schoolId: string, seats: RoleSeat[]): void {
  const rest = readAll().filter((seat) => seat.schoolId !== schoolId);
  writeAll([...rest, ...seats]);
}

export function releaseRoleSeat(schoolId: string, seatId: string, kept: KeptRoleProfile): RoleSeat | null {
  const seats = listRoleSeats(schoolId);
  const seat = seats.find((item) => item.id === seatId);
  const holder = seat ? openHolder(seat) : undefined;
  if (!seat || !holder) return null;
  holder.endedAt = new Date().toISOString();
  holder.kept = kept;
  saveSchool(schoolId, seats);
  return seat;
}

export function assignUserToSeat(schoolId: string, seatId: string, user: User, kept?: KeptRoleProfile): RoleSeat | null {
  const seats = listRoleSeats(schoolId);
  closeOpenSeatForUser(seats, user.id, kept);
  const seat = seats.find((item) => item.id === seatId);
  if (!seat || openHolder(seat)) return null;
  seat.holders.push({
    userId: user.id,
    userName: user.name,
    email: user.email,
    startedAt: new Date().toISOString(),
  });
  saveSchool(schoolId, seats);
  return seat;
}

export function assignUserToNewSeat(schoolId: string, role: string, user: User, kept?: KeptRoleProfile): RoleSeat {
  const seats = listRoleSeats(schoolId);
  closeOpenSeatForUser(seats, user.id, kept);
  const seat: RoleSeat = {
    id: `seat-${schoolId}-${role}-${user.id}-${Date.now()}`,
    schoolId,
    role,
    holders: [{
      userId: user.id,
      userName: user.name,
      email: user.email,
      startedAt: new Date().toISOString(),
    }],
  };
  seats.push(seat);
  saveSchool(schoolId, seats);
  return seat;
}

/** Fill the latest vacated seat of this role, or open a new seat when none is vacant. */
export function assignUserToRole(schoolId: string, role: string, user: User, kept?: KeptRoleProfile): RoleSeat {
  const seats = listRoleSeats(schoolId);
  const vacant = seats
    .filter((seat) => seat.role === role && !openHolder(seat) && seat.holders.length > 0 && openHolder(seat)?.userId !== user.id)
    .sort((a, b) => {
      const aEnded = [...a.holders].reverse().find((holder) => holder.endedAt)?.endedAt || '';
      const bEnded = [...b.holders].reverse().find((holder) => holder.endedAt)?.endedAt || '';
      return bEnded.localeCompare(aEnded);
    })[0];
  if (vacant) {
    const assigned = assignUserToSeat(schoolId, vacant.id, user, kept);
    if (assigned) return assigned;
  }
  return assignUserToNewSeat(schoolId, role, user, kept);
}

function closeOpenSeatForUser(seats: RoleSeat[], userId: string, kept?: KeptRoleProfile): void {
  for (const seat of seats) {
    const holder = openHolder(seat);
    if (holder?.userId !== userId) continue;
    holder.endedAt = new Date().toISOString();
    if (kept) holder.kept = kept;
  }
}
