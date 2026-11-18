import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  CheckCircle2,
  Download,
  KeyRound,
  Printer,
  RefreshCw,
  School,
  ShieldCheck,
  X,
} from 'lucide-react';
import {
  ClientDataStore,
  type PrintableCredentialsResponse,
  type PrintableCredentialSchool,
  type PrintableCredentialUser,
} from '../../utils/clientDataStore';
import { useTenant } from '../../context/TenantContext';
import { listSystemRoles } from '../../utils/systemRoles';

interface PrintableCredentialsModalProps {
  isOpen: boolean;
  initialSchoolId?: string;
  onClose: () => void;
}

export const PrintableCredentialsModal: React.FC<PrintableCredentialsModalProps> = ({
  isOpen,
  initialSchoolId = 'all',
  onClose,
}) => {
  const { allTenants } = useTenant();
  const [systemRoles] = useState(() => listSystemRoles());
  const [schoolFilter, setSchoolFilter] = useState<string>(initialSchoolId || 'all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [roster, setRoster] = useState<PrintableCredentialsResponse | null>(null);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);

  // Quick inline reset for any legacy account needing a known printable passphrase
  const [resetTarget, setResetTarget] = useState<{ schoolId: string; user: PrintableCredentialUser } | null>(null);
  const [resetValue, setResetValue] = useState<string>('');
  const [resetBusy, setResetBusy] = useState<boolean>(false);
  const [toast, setToast] = useState<string>('');

  const loadRoster = async (sId = schoolFilter, role = roleFilter, status = statusFilter) => {
    setLoading(true);
    setError('');
    try {
      const data = await ClientDataStore.apiFetchPrintableCredentials({
        schoolId: sId,
        role,
        status,
      });
      setRoster(data);
    } catch (err: any) {
      setError(err?.message || 'Failed loading printable credential roster.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const nextSchool = initialSchoolId || 'all';
    setSchoolFilter(nextSchool);
    void loadRoster(nextSchool, roleFilter, statusFilter);
  }, [isOpen, initialSchoolId]);

  useEffect(() => {
    if (!isPrinting) return;
    const handleAfterPrint = () => {
      document.body.classList.remove('printing-portal-active');
      setIsPrinting(false);
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('afterprint', handleAfterPrint);
      document.body.classList.remove('printing-portal-active');
    };
  }, [isPrinting]);

  if (!isOpen) return null;

  const schools: PrintableCredentialSchool[] = roster?.schools || [];
  const totalAccounts = schools.reduce((sum, s) => sum + s.users.length, 0);

  const handlePrintNow = () => {
    setIsPrinting(true);
    document.body.classList.add('printing-portal-active');
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.body.classList.remove('printing-portal-active');
        setIsPrinting(false);
      }, 600);
    }, 80);
  };

  const handleDownloadCsv = () => {
    const escapeCsv = (val: unknown) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const rows: string[] = [
      ['School Name', 'School Code', 'Domain', 'Full Name', 'Email / Username', 'Password', 'Role', 'Identifier', 'Grade / Stream', 'Phone', 'Status'].join(','),
    ];
    for (const sch of schools) {
      for (const u of sch.users) {
        rows.push(
          [
            escapeCsv(sch.schoolName),
            escapeCsv(sch.code),
            escapeCsv(sch.domain),
            escapeCsv(u.name),
            escapeCsv(u.email),
            escapeCsv(u.password || 'Reset required'),
            escapeCsv(u.roleLabel),
            escapeCsv(u.identifier),
            escapeCsv([u.grade ? `Grade ${u.grade}` : '', u.stream].filter(Boolean).join(' ')),
            escapeCsv(u.phone),
            escapeCsv(u.isActive ? 'Active' : 'Deactivated'),
          ].join(',')
        );
      }
    }
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `edusmart-credentials-${schoolFilter}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleConfirmQuickReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTarget || resetValue.trim().length < 4) return;
    setResetBusy(true);
    try {
      await ClientDataStore.apiResetUserPassword(resetTarget.user.id, resetValue.trim());
      setToast(`Password updated for ${resetTarget.user.name} (${resetTarget.user.email}).`);
      setResetTarget(null);
      setResetValue('');
      await loadRoster(schoolFilter, roleFilter, statusFilter);
    } catch (err: any) {
      setError(err?.message || 'Failed updating password');
    } finally {
      setResetBusy(false);
    }
  };

  const renderPrintableSheets = (forPrint: boolean) => (
    <div className={forPrint ? 'printable-credential-portal p-6 bg-white text-slate-900 font-sans' : 'space-y-6'}>
      {schools.map((sch) => (
        <div
          key={sch.schoolId}
          className={`bg-white border border-slate-200 rounded-2xl overflow-hidden ${
            forPrint ? 'printable-school-section border-slate-400 rounded-none mb-6' : 'shadow-xs'
          }`}
        >
          {/* School Institutional Header */}
          <div className="p-4 sm:p-5 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                <School className="w-3.5 h-3.5" />
                <span>Official Super Admin User Credentials Roster</span>
              </div>
              <h3 className="text-lg font-black tracking-tight mt-0.5">{sch.schoolName}</h3>
              <div className="text-[11px] text-slate-300 flex flex-wrap items-center gap-3 mt-0.5 font-mono">
                <span>Code: {sch.code || sch.schoolId}</span>
                {sch.domain && <span>Domain: {sch.domain}</span>}
                <span>Accounts: {sch.users.length}</span>
              </div>
            </div>

            {sch.schoolAccount && (
              <div className="bg-white/10 border border-white/20 rounded-xl px-3.5 py-2 text-[11px] font-mono">
                <div className="text-[9px] uppercase font-bold text-amber-300">School Master Login</div>
                <div>Email: {sch.schoolAccount.email}</div>
                <div>
                  Password:{' '}
                  <strong className="text-white">
                    {sch.schoolAccount.password || '(Reset Required)'}
                  </strong>
                </div>
              </div>
            )}
          </div>

          {/* Accounts Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 w-10">#</th>
                  <th className="py-2.5 px-3">Full Name</th>
                  <th className="py-2.5 px-3">Email / Username</th>
                  <th className="py-2.5 px-3">Password</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Adm / Staff #</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {sch.users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-400">
                      No user accounts match the active filters for this campus.
                    </td>
                  </tr>
                ) : (
                  sch.users.map((u, idx) => (
                    <tr key={`${sch.schoolId}-${u.id}-${idx}`} className={!u.isActive ? 'bg-rose-50/40' : ''}>
                      <td className="py-2 px-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-2 px-3 font-bold text-slate-900">
                        <div>{u.name}</div>
                        {u.grade && (
                          <div className="text-[10px] font-normal text-slate-500">
                            Grade {u.grade} {u.stream ? `· ${u.stream}` : ''}
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-800 break-all">{u.email}</td>
                      <td className="py-2 px-3 font-mono">
                        {u.password ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-900 border border-emerald-200 font-bold">
                            {u.password}
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-amber-700 italic text-[11px]">Custom (Set to print)</span>
                            {!forPrint && (
                              <button
                                type="button"
                                onClick={() => {
                                  setResetTarget({ schoolId: sch.schoolId, user: u });
                                  setResetValue('edu@2026');
                                }}
                                className="px-2 py-0.5 text-[10px] font-bold bg-indigo-600 text-white rounded hover:bg-indigo-700 cursor-pointer"
                              >
                                Set Password
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-3 capitalize font-semibold text-slate-700">{u.roleLabel}</td>
                      <td className="py-2 px-3 font-mono text-slate-600">{u.identifier || '—'}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            u.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span>Generated by: {roster?.generatedBy || 'Super Admin'}</span>
            <span>Timestamp: {roster?.generatedAt ? new Date(roster.generatedAt).toLocaleString() : new Date().toLocaleString()}</span>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-xs">
        <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
          {/* Header */}
          <div className="px-6 py-4 bg-slate-950 text-white flex items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black tracking-tight">
                  Super Admin Printable User Credentials Roster
                </h2>
                <p className="text-xs text-slate-300">
                  Full names, institutional emails/usernames, and decrypted passwords grouped per tenant school.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close printable credentials modal"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Filter & Action Toolbar */}
          <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <select
                value={schoolFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  setSchoolFilter(val);
                  void loadRoster(val, roleFilter, statusFilter);
                }}
                aria-label="Filter by tenant school"
                className="px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 cursor-pointer"
              >
                <option value="all">All Tenant Schools ({allTenants.length})</option>
                {allTenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.code})
                  </option>
                ))}
              </select>

              <select
                value={roleFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  setRoleFilter(val);
                  void loadRoster(schoolFilter, val, statusFilter);
                }}
                aria-label="Filter by role"
                className="px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 cursor-pointer"
              >
                <option value="all">All Roles</option>
                {systemRoles.map((r) => (
                  <option key={r.id} value={r.slug}>
                    {r.name}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  setStatusFilter(val);
                  void loadRoster(schoolFilter, roleFilter, val);
                }}
                aria-label="Filter by status"
                className="px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>

              <button
                type="button"
                onClick={() => void loadRoster(schoolFilter, roleFilter, statusFilter)}
                disabled={loading}
                className="px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-600 mr-1">
                {schools.length} school(s) · {totalAccounts} user(s)
              </span>
              <button
                type="button"
                onClick={handleDownloadCsv}
                disabled={loading || totalAccounts === 0}
                className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
              <button
                type="button"
                onClick={handlePrintNow}
                disabled={loading || totalAccounts === 0}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Printer className="w-4 h-4" />
                <span>Print Full Credentials (A4)</span>
              </button>
            </div>
          </div>

          {/* Alerts / Quick Password Set Modal Bar */}
          {toast && (
            <div className="mx-6 mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{toast}</span>
              </div>
              <button type="button" onClick={() => setToast('')} className="text-emerald-700 underline cursor-pointer">
                Dismiss
              </button>
            </div>
          )}

          {error && (
            <div className="mx-6 mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-800">
              {error}
            </div>
          )}

          {resetTarget && (
            <form
              onSubmit={handleConfirmQuickReset}
              className="mx-6 mt-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex flex-wrap items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-700" />
                <span>
                  Set new printable password for <strong>{resetTarget.user.name}</strong> ({resetTarget.user.email}):
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  required
                  minLength={4}
                  value={resetValue}
                  onChange={(e) => setResetValue(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-amber-300 bg-white font-mono font-bold"
                />
                <button
                  type="submit"
                  disabled={resetBusy}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {resetBusy ? 'Saving...' : 'Save Password'}
                </button>
                <button
                  type="button"
                  onClick={() => setResetTarget(null)}
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Roster Body */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-100/70">
            {loading && !roster ? (
              <div className="py-16 text-center text-sm font-bold text-slate-500">
                Decrypting institutional credential vault...
              </div>
            ) : schools.length === 0 ? (
              <div className="py-16 text-center text-sm font-bold text-slate-500">
                No schools or accounts found for the selected filters.
              </div>
            ) : (
              renderPrintableSheets(false)
            )}
          </div>
        </div>
      </div>

      {isPrinting && createPortal(renderPrintableSheets(true), document.body)}
    </>
  );
};
