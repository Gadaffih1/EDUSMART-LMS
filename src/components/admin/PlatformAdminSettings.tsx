import React, { useEffect, useState } from 'react';
import { CheckCircle2, Database, Download, Eye, EyeOff, KeyRound, Mail } from 'lucide-react';
import { Storage } from '../../utils/storage';
import { ClientDataStore } from '../../utils/clientDataStore';
import {
  toPlatformAdminSession,
  updatePlatformAdminCredentials,
  type PlatformAdmin,
} from '../../utils/platformAdminAuth';
import { BiometricPasskeysCard } from '../auth/BiometricPasskeysCard';

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

  const [dbSummary, setDbSummary] = useState<{
    tables: Array<{ name: string; rows: number }>;
    totalTables: number;
    totalRows: number;
    dbSizeBytes: number;
    mysql?: {
      configured: boolean;
      connected: boolean;
      driver: 'mysql2' | 'sqlite-fallback';
      host: string | null;
      port: number | null;
      database: string | null;
      lastSyncedAt: string | null;
      lastError: string | null;
      syncSourceOfTruth: 'mysql' | 'local-sqlite';
    };
  } | null>(null);
  const [exportingMysql, setExportingMysql] = useState(false);
  const [syncingMysql, setSyncingMysql] = useState(false);
  const [exportStatus, setExportStatus] = useState('');
  const [exportError, setExportError] = useState('');

  useEffect(() => {
    let active = true;
    ClientDataStore.getMySqlExportSummary()
      .then((summary) => {
        if (active) setDbSummary(summary);
      })
      .catch(() => {
        // Summary stays hidden until Super Admin session cookie/token is active
      });
    return () => {
      active = false;
    };
  }, []);

  const handleDownloadMysql = async () => {
    setExportError('');
    setExportStatus('');
    setExportingMysql(true);
    try {
      const res = await ClientDataStore.downloadMySqlDump();
      const kb = Math.max(1, Math.round(res.sizeBytes / 1024));
      setExportStatus(
        `Saved ${res.filename} to your downloads (${res.tableCount} tables, ${res.totalRows.toLocaleString()} rows, ${kb.toLocaleString()} KB).`
      );
    } catch (err: any) {
      setExportError(err?.message || 'Unable to export MySQL dump.');
    } finally {
      setExportingMysql(false);
    }
  };

  const handleSyncMysql = async () => {
    setExportError('');
    setExportStatus('');
    setSyncingMysql(true);
    try {
      const res = await ClientDataStore.syncMySqlNow();
      const updated = await ClientDataStore.getMySqlExportSummary().catch(() => null);
      if (updated) setDbSummary(updated);
      setExportStatus(
        `Synced live to MySQL (${res.mysql?.host}:${res.mysql?.port}/${res.mysql?.database}).`
      );
    } catch (err: any) {
      setExportError(err?.message || 'Unable to sync with MySQL server.');
    } finally {
      setSyncingMysql(false);
    }
  };

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

      <div className="lg:col-span-2">
        <BiometricPasskeysCard />
      </div>

      <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-emerald-700" />
              <h3 className="text-base font-extrabold text-slate-950">Central Database Backup & MySQL Dump Export</h3>
            </div>
            <p className="text-xs text-slate-600">
              Download a full MySQL 8.0+ / MariaDB compatible <code className="font-mono">.sql</code> dump containing all schemas, indexes, schools, users, students, settings, and records directly to this PC.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleSyncMysql}
              disabled={syncingMysql}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-100 px-3.5 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-200 disabled:opacity-60 cursor-pointer"
            >
              <span>{syncingMysql ? 'Syncing…' : 'Sync MySQL Now'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadMysql}
              disabled={exportingMysql}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60 cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>{exportingMysql ? 'Generating MySQL Dump…' : 'Download MySQL Dump (.sql)'}</span>
            </button>
          </div>
        </div>

        {dbSummary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">SQL Tables</div>
              <div className="text-lg font-extrabold text-slate-900">{dbSummary.totalTables}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Records</div>
              <div className="text-lg font-extrabold text-slate-900">{dbSummary.totalRows.toLocaleString()}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Database Size</div>
              <div className="text-lg font-extrabold text-slate-900">
                {Math.max(1, Math.round(dbSummary.dbSizeBytes / 1024)).toLocaleString()} KB
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">MySQL Engine</div>
              <div className={`text-sm font-extrabold pt-1 ${dbSummary.mysql?.connected ? 'text-emerald-700' : 'text-amber-700'}`}>
                {dbSummary.mysql?.connected
                  ? `Live (${dbSummary.mysql.database})`
                  : dbSummary.mysql?.configured
                    ? 'Reconnect Needed'
                    : 'Set MYSQL_* in .env'}
              </div>
            </div>
          </div>
        )}

        {exportError && (
          <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700" role="alert">
            {exportError}
          </p>
        )}
        {exportStatus && (
          <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800" role="status">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{exportStatus}</span>
          </p>
        )}
      </div>
    </div>
  );
};
