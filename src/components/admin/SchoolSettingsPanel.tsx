import React, { useEffect, useState } from 'react';
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  FlaskConical,
  RefreshCw,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Wallet,
} from 'lucide-react';
import { ClientDataStore } from '../../utils/clientDataStore';
import { useTenant } from '../../context/TenantContext';

interface SchoolSettingsPanelProps {
  schoolId: string;
  allowTenantSwitch?: boolean;
  onTenantChange?: (schoolId: string) => void;
  title?: string;
  subtitle?: string;
}

interface SchoolSettingsShape {
  profile_and_branding: {
    id: string;
    name: string;
    shortName: string;
    code: string;
    motto: string;
    location: string;
    primaryColor: string;
    logoUrl: string;
  };
  academic_calendar: {
    currentYear: string;
    currentTerm: number;
    termLabel: string;
    curriculum: string;
    gradingScale: string;
  };
  portal_and_virtual_lab: {
    virtualLabBundledForSchool: boolean;
    publicVirtualLabRequiresSubscription: boolean;
    allowParentPortal: boolean;
    allowStudentPortal: boolean;
  };
  operations_and_finance: {
    currency: string;
    mpesaIntegrated: boolean;
    strictBudgetEnforcement: boolean;
    approvalThresholdKes: number;
  };
  notifications_and_attendance: {
    smsGateExitAlerts: boolean;
    morningRollCallDeadline: string;
    emailDigestEnabled: boolean;
  };
}

function buildDefaults(schoolId: string, tenant?: any): SchoolSettingsShape {
  return {
    profile_and_branding: {
      id: schoolId,
      name: tenant?.name || 'School Campus',
      shortName: tenant?.shortName || tenant?.name || 'School Campus',
      code: tenant?.code || '',
      motto: tenant?.motto || 'Excellence & Integrity',
      location: tenant?.location || tenant?.city || 'Kenya',
      primaryColor: tenant?.primaryColor || '#2563eb',
      logoUrl: tenant?.logoUrl || '',
    },
    academic_calendar: {
      currentYear: '2026',
      currentTerm: 1,
      termLabel: 'Term 1, 2026',
      curriculum: tenant?.curriculum || 'Kenyan CBC & JSS',
      gradingScale: 'CBC 4-Level (EE, ME, AE, BE)',
    },
    portal_and_virtual_lab: {
      virtualLabBundledForSchool: true,
      publicVirtualLabRequiresSubscription: true,
      allowParentPortal: true,
      allowStudentPortal: true,
    },
    operations_and_finance: {
      currency: 'KES',
      mpesaIntegrated: true,
      strictBudgetEnforcement: true,
      approvalThresholdKes: 50000,
    },
    notifications_and_attendance: {
      smsGateExitAlerts: true,
      morningRollCallDeadline: '08:30 AM',
      emailDigestEnabled: true,
    },
  };
}

export const SchoolSettingsPanel: React.FC<SchoolSettingsPanelProps> = ({
  schoolId,
  allowTenantSwitch = false,
  onTenantChange,
  title,
  subtitle,
}) => {
  const { allTenants } = useTenant();
  const activeTenant = allTenants.find((t) => t.id === schoolId);
  const [settings, setSettings] = useState<SchoolSettingsShape>(() => buildDefaults(schoolId, activeTenant));
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadFromDb = async (targetId: string) => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const remote = await ClientDataStore.loadSchoolSettings(targetId);
      const t = allTenants.find((item) => item.id === targetId);
      const base = buildDefaults(targetId, t);
      setSettings({
        profile_and_branding: { ...base.profile_and_branding, ...(remote?.profile_and_branding || {}) },
        academic_calendar: { ...base.academic_calendar, ...(remote?.academic_calendar || {}) },
        portal_and_virtual_lab: { ...base.portal_and_virtual_lab, ...(remote?.portal_and_virtual_lab || {}) },
        operations_and_finance: { ...base.operations_and_finance, ...(remote?.operations_and_finance || {}) },
        notifications_and_attendance: {
          ...base.notifications_and_attendance,
          ...(remote?.notifications_and_attendance || {}),
        },
      });
    } catch (err: any) {
      setStatusMessage({ text: err?.message || 'Failed loading settings from database.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadFromDb(schoolId);
  }, [schoolId]);

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage(null);
    try {
      const saved = await ClientDataStore.saveSchoolSettings({
        tenantId: schoolId,
        settings,
        tenantUpdates: {
          name: settings.profile_and_branding.name,
          shortName: settings.profile_and_branding.shortName,
          code: settings.profile_and_branding.code,
          motto: settings.profile_and_branding.motto,
          logoUrl: settings.profile_and_branding.logoUrl,
          curriculum: settings.academic_calendar.curriculum,
          term: settings.academic_calendar.termLabel,
          academicYear: `${settings.academic_calendar.currentYear} Academic Year`,
        },
      });
      const base = buildDefaults(schoolId, activeTenant);
      setSettings({
        profile_and_branding: { ...base.profile_and_branding, ...(saved?.profile_and_branding || settings.profile_and_branding) },
        academic_calendar: { ...base.academic_calendar, ...(saved?.academic_calendar || settings.academic_calendar) },
        portal_and_virtual_lab: { ...base.portal_and_virtual_lab, ...(saved?.portal_and_virtual_lab || settings.portal_and_virtual_lab) },
        operations_and_finance: { ...base.operations_and_finance, ...(saved?.operations_and_finance || settings.operations_and_finance) },
        notifications_and_attendance: {
          ...base.notifications_and_attendance,
          ...(saved?.notifications_and_attendance || settings.notifications_and_attendance),
        },
      });
      setStatusMessage({
        text: `Settings saved and retained in the central database for ${settings.profile_and_branding.name}. Changes persist across all browsers.`,
        type: 'success',
      });
    } catch (err: any) {
      setStatusMessage({ text: err?.message || 'Failed saving school settings.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 uppercase tracking-wider mb-1">
            <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
            <span>Database-Retained Institutional Configuration</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            {title || `${activeTenant?.name || 'School'} Institutional Settings`}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {subtitle ||
              'All school profile, academic calendar, portal policies, finance thresholds, and attendance alert settings are persisted per tenant in the central database across all browsers.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {allowTenantSwitch && (
            <select
              value={schoolId}
              onChange={(e) => onTenantChange?.(e.target.value)}
              aria-label="Select tenant school settings"
              className="px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl bg-slate-50 text-slate-900 cursor-pointer"
            >
              {allTenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.code})
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={() => void loadFromDb(schoolId)}
            disabled={loading}
            className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Reload from DB</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          role={statusMessage.type === 'error' ? 'alert' : 'status'}
          className={`p-3.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
            statusMessage.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMessage.text}</span>
        </div>
      )}

      <form onSubmit={handleSaveAll} className="space-y-6 text-xs">
        {/* 1. Profile & Branding */}
        <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-4">
          <div className="flex items-center gap-2 font-black text-slate-900 uppercase tracking-wider">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span>1. School Profile & Branding</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">School Name</label>
              <input
                type="text"
                required
                value={settings.profile_and_branding.name}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    profile_and_branding: { ...prev.profile_and_branding, name: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Short Name</label>
              <input
                type="text"
                value={settings.profile_and_branding.shortName}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    profile_and_branding: { ...prev.profile_and_branding, shortName: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Campus Code</label>
              <input
                type="text"
                value={settings.profile_and_branding.code}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    profile_and_branding: { ...prev.profile_and_branding, code: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Motto</label>
              <input
                type="text"
                value={settings.profile_and_branding.motto}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    profile_and_branding: { ...prev.profile_and_branding, motto: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Location & Primary Color</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={settings.profile_and_branding.location}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      profile_and_branding: { ...prev.profile_and_branding, location: e.target.value },
                    }))
                  }
                  className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-slate-300 bg-white"
                />
                <input
                  type="color"
                  aria-label="Primary color"
                  value={settings.profile_and_branding.primaryColor || '#2563eb'}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      profile_and_branding: { ...prev.profile_and_branding, primaryColor: e.target.value },
                    }))
                  }
                  className="w-10 h-9 rounded-lg border border-slate-300 bg-white p-0.5 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2. Academic Calendar & Curriculum */}
        <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-4">
          <div className="flex items-center gap-2 font-black text-slate-900 uppercase tracking-wider">
            <CalendarDays className="w-4 h-4 text-emerald-600" />
            <span>2. Academic Calendar & Grading Policy</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Academic Year</label>
              <input
                type="text"
                value={settings.academic_calendar.currentYear}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    academic_calendar: { ...prev.academic_calendar, currentYear: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Active Term</label>
              <select
                value={settings.academic_calendar.currentTerm}
                onChange={(e) => {
                  const termNum = Number(e.target.value);
                  setSettings((prev) => ({
                    ...prev,
                    academic_calendar: {
                      ...prev.academic_calendar,
                      currentTerm: termNum,
                      termLabel: `Term ${termNum}, ${prev.academic_calendar.currentYear}`,
                    },
                  }));
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-bold"
              >
                <option value={1}>Term 1</option>
                <option value={2}>Term 2</option>
                <option value={3}>Term 3</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Curriculum Framework</label>
              <input
                type="text"
                value={settings.academic_calendar.curriculum}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    academic_calendar: { ...prev.academic_calendar, curriculum: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Grading Rubric</label>
              <input
                type="text"
                value={settings.academic_calendar.gradingScale}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    academic_calendar: { ...prev.academic_calendar, gradingScale: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
              />
            </div>
          </div>
        </div>

        {/* 3. Portal & Virtual Lab + Finance & Attendance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
            <div className="flex items-center gap-2 font-black text-slate-900 uppercase tracking-wider">
              <FlaskConical className="w-4 h-4 text-blue-600" />
              <span>3. Portal & Virtual Lab Access</span>
            </div>
            {(
              [
                ['virtualLabBundledForSchool', 'Bundle Virtual STEM Lab for Enrolled Campus Users'],
                ['publicVirtualLabRequiresSubscription', 'Require Paid Subscription for Public Lab Access'],
                ['allowParentPortal', 'Enable Parent / Guardian Portal Access'],
                ['allowStudentPortal', 'Enable Student Learning Portal Access'],
              ] as const
            ).map(([field, label]) => (
              <label
                key={field}
                className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 cursor-pointer"
              >
                <span className="font-semibold text-slate-800">{label}</span>
                <input
                  type="checkbox"
                  checked={Boolean(settings.portal_and_virtual_lab[field])}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      portal_and_virtual_lab: {
                        ...prev.portal_and_virtual_lab,
                        [field]: e.target.checked,
                      },
                    }))
                  }
                  className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                />
              </label>
            ))}
          </div>

          <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
            <div className="flex items-center gap-2 font-black text-slate-900 uppercase tracking-wider">
              <Wallet className="w-4 h-4 text-amber-600" />
              <span>4. Operations, Finance & Attendance Alerts</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Currency</label>
                <input
                  type="text"
                  value={settings.operations_and_finance.currency}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      operations_and_finance: {
                        ...prev.operations_and_finance,
                        currency: e.target.value,
                      },
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Approval Limit</label>
                <input
                  type="number"
                  min={0}
                  value={settings.operations_and_finance.approvalThresholdKes}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      operations_and_finance: {
                        ...prev.operations_and_finance,
                        approvalThresholdKes: Number(e.target.value) || 0,
                      },
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Roll Call Cutoff</label>
                <input
                  type="text"
                  value={settings.notifications_and_attendance.morningRollCallDeadline}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      notifications_and_attendance: {
                        ...prev.notifications_and_attendance,
                        morningRollCallDeadline: e.target.value,
                      },
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono"
                />
              </div>
            </div>
            <label className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 cursor-pointer">
              <span className="font-semibold text-slate-800">Enforce Strict Departmental Budget Checks</span>
              <input
                type="checkbox"
                checked={settings.operations_and_finance.strictBudgetEnforcement}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    operations_and_finance: {
                      ...prev.operations_and_finance,
                      strictBudgetEnforcement: e.target.checked,
                    },
                  }))
                }
                className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
              />
            </label>
            <label className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 cursor-pointer">
              <span className="font-semibold text-slate-800">Enable Gate-Exit SMS & Guardian Alerts</span>
              <input
                type="checkbox"
                checked={settings.notifications_and_attendance.smsGateExitAlerts}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    notifications_and_attendance: {
                      ...prev.notifications_and_attendance,
                      smsGateExitAlerts: e.target.checked,
                    },
                  }))
                }
                className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
              />
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Persisted in central SQLite/MySQL database per tenant school across all browsers.</span>
          </div>
          <button
            type="submit"
            disabled={saving || loading}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Settings to DB...' : 'Save School Settings'}</span>
          </button>
        </div>
      </form>
    </section>
  );
};
