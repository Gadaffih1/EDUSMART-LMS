import React, { useState } from 'react';
import { Eye, EyeOff, KeyRound, Mail } from 'lucide-react';
import { Storage } from '../../utils/storage';
import {
  toPlatformAdminSession,
  updatePlatformAdminCredentials,
  type PlatformAdmin,
} from '../../utils/platformAdminAuth';

interface PlatformAdminSettingsProps {
  admin: PlatformAdmin;
}

function applySession(admin: PlatformAdmin) {
  const sessionUser = toPlatformAdminSession(admin);
  Storage.setCurrentUser(sessionUser);
  window.dispatchEvent(new CustomEvent('platform-admin-session', { detail: sessionUser }));
}

export const PlatformAdminSettings: React.FC<PlatformAdminSettingsProps> = ({ admin }) => {
  const [email, setEmail] = useState(admin.email);
  const [emailPassword, setEmailPassword] = useState('');
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const saveEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    setEmailError('');
    setEmailSuccess('');
    setSavingEmail(true);
    const result = await updatePlatformAdminCredentials(admin.id, {
      currentPassword: emailPassword,
      email,
    });
    setSavingEmail(false);
    if (!result.ok) {
      setEmailError(result.message);
      return;
    }
    applySession(result.admin);
    setEmail(result.admin.email);
    setEmailPassword('');
    setEmailSuccess('Sign-in email updated. The password is unchanged.');
  };

  const savePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }
    setSavingPassword(true);
    const result = await updatePlatformAdminCredentials(admin.id, {
      currentPassword,
      newPassword,
    });
    setSavingPassword(false);
    if (!result.ok) {
      setPasswordError(result.message);
      return;
    }
    applySession(result.admin);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordSuccess('Password updated. The sign-in email is unchanged.');
  };

  return (
    <div className="grid max-w-5xl gap-5 lg:grid-cols-2">
      <form onSubmit={saveEmail} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" autoComplete="off">
        <div>
          <h3 className="text-base font-extrabold text-slate-950">Email</h3>
          <p className="mt-1 text-xs text-slate-600">
            Change the sign-in email on its own. The password stays the same.
          </p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="platform-admin-email" className="block text-xs font-bold text-slate-700">
            Email
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="platform-admin-email"
              type="email"
              required
              autoComplete="off"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="platform-admin-email-password" className="block text-xs font-bold text-slate-700">
            Current password
          </label>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="platform-admin-email-password"
              type={showEmailPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={emailPassword}
              onChange={(event) => setEmailPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pl-10 pr-10 text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <button
              type="button"
              onClick={() => setShowEmailPassword((open) => !open)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
              aria-label={showEmailPassword ? 'Hide current password' : 'Show current password'}
            >
              {showEmailPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-[11px] text-slate-500">Confirms this change. It is not replaced.</p>
        </div>

        {emailError && (
          <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700" role="alert">
            {emailError}
          </p>
        )}
        {emailSuccess && (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800" role="status">
            {emailSuccess}
          </p>
        )}

        <button
          type="submit"
          disabled={savingEmail}
          className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {savingEmail ? 'Saving…' : 'Save email'}
        </button>
      </form>

      <form onSubmit={savePassword} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" autoComplete="off">
        <div>
          <h3 className="text-base font-extrabold text-slate-950">Password</h3>
          <p className="mt-1 text-xs text-slate-600">
            Change the password on its own. The sign-in email stays {admin.email}.
          </p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="platform-admin-current-password" className="block text-xs font-bold text-slate-700">
            Current password
          </label>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="platform-admin-current-password"
              type={showCurrent ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pl-10 pr-10 text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <button
              type="button"
              onClick={() => setShowCurrent((open) => !open)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
              aria-label={showCurrent ? 'Hide current password' : 'Show current password'}
            >
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="platform-admin-new-password" className="block text-xs font-bold text-slate-700">
            New password
          </label>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="platform-admin-new-password"
              type={showNew ? 'text' : 'password'}
              required
              minLength={4}
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pl-10 pr-10 text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <button
              type="button"
              onClick={() => setShowNew((open) => !open)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
              aria-label={showNew ? 'Hide new password' : 'Show new password'}
            >
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="platform-admin-confirm-password" className="block text-xs font-bold text-slate-700">
            Confirm new password
          </label>
          <input
            id="platform-admin-confirm-password"
            type={showNew ? 'text' : 'password'}
            required
            minLength={4}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {passwordError && (
          <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700" role="alert">
            {passwordError}
          </p>
        )}
        {passwordSuccess && (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800" role="status">
            {passwordSuccess}
          </p>
        )}

        <button
          type="submit"
          disabled={savingPassword}
          className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {savingPassword ? 'Saving…' : 'Save password'}
        </button>
      </form>
    </div>
  );
};
