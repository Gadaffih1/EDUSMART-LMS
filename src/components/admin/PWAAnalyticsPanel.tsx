import React, { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  Download,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Tablet,
  Monitor,
  Globe,
  BarChart3,
} from 'lucide-react';
import { ClientDataStore } from '../../utils/clientDataStore';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PwaAnalyticsResponse {
  success: boolean;
  scope: string;
  summary: {
    totalInstalls: number;
    standaloneLaunches: number;
    promptShown: number;
    promptAccepted: number;
    promptDismissed: number;
    iosGuideViews: number;
    promptConversionRate: number;
  };
  byDeviceCategory: Record<string, { installs: number; launches: number }>;
  byBrowserFamily: Record<string, { installs: number; launches: number }>;
  byVersion: Record<string, number>;
  recentEvents: Array<{
    eventType: string;
    deviceCategory: string;
    browserFamily: string;
    displayMode: string;
    appVersion: string;
    createdAt: string;
  }>;
  generatedAt: string;
}

const DEVICE_LABELS: Record<string, string> = {
  android_phone: 'Android Phones',
  iphone: 'iPhones',
  android_tablet: 'Android Tablets',
  ipad: 'iPads',
  desktop: 'Desktop Computers',
  other: 'Other Devices',
};

const BROWSER_LABELS: Record<string, string> = {
  chrome: 'Google Chrome',
  samsung_internet: 'Samsung Internet',
  safari: 'Apple Safari',
  edge: 'Microsoft Edge',
  firefox: 'Firefox',
  other: 'Other Browsers',
};

export const PWAAnalyticsPanel: React.FC = () => {
  const {
    swRegistered,
    isStandalone,
    isInstalled,
    needRefresh,
    appVersion,
    checkForUpdate,
    applyUpdate,
  } = usePWAInstall();

  const [data, setData] = useState<PwaAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateCheckNote, setUpdateCheckNote] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/pwa/analytics', {
        credentials: 'include',
        headers: ClientDataStore.getAuthHeaders(),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error || `Failed loading PWA statistics (HTTP ${res.status})`);
      }
      setData(body as PwaAnalyticsResponse);
    } catch (err: any) {
      setError(err?.message || 'Unable to load PWA analytics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  const handleManualUpdateCheck = async () => {
    setCheckingUpdate(true);
    setUpdateCheckNote(null);
    const hasUpdate = await checkForUpdate();
    setCheckingUpdate(false);
    setUpdateCheckNote(
      hasUpdate
        ? 'New version ready — click Update & Refresh to activate.'
        : `EduSmart LMS v${appVersion} is up to date.`
    );
  };

  return (
    <div className="space-y-6 text-left">
      {/* Live App & Service Worker Readiness Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl border border-slate-200 bg-white p-1 shrink-0 flex items-center justify-center">
            <img src="/pwa-192x192.png" alt="EduSmart PWA Icon" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-950">
                EduSmart LMS Progressive Web App
              </h3>
              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[#0B3075] border border-blue-200 text-[11px] font-mono font-bold">
                v{appVersion}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
                <CheckCircle2 className="w-3 h-3" />
                <span>{swRegistered ? 'Service Worker Active' : 'Manifest & SW Configured'}</span>
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Privacy-preserving installation analytics &amp; update control. Display mode:{' '}
              <strong className="text-slate-900">{isStandalone ? 'Standalone App' : isInstalled ? 'Installed (Browser View)' : 'Browser'}</strong> · API caching strictly set to{' '}
              <strong className="text-slate-900">NetworkOnly</strong>.
            </p>
            {updateCheckNote && (
              <p className="text-xs font-bold text-[#0B3075] mt-1">{updateCheckNote}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {needRefresh ? (
            <button
              type="button"
              onClick={() => void applyUpdate()}
              className="px-4 py-2 rounded-xl bg-[#0B3075] hover:bg-[#072357] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Update &amp; Refresh</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handleManualUpdateCheck()}
              disabled={checkingUpdate}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checkingUpdate ? 'animate-spin' : ''}`} />
              <span>Check for Updates</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => void loadAnalytics()}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-[#0B3075] hover:bg-[#072357] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Refresh Stats</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800">
          {error}
        </div>
      )}

      {/* Aggregate KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
            <span>Total Installs</span>
            <Download className="w-4 h-4 text-[#0B3075]" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-950">
            {loading ? '—' : (data?.summary.totalInstalls ?? 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Deduplicated device installations</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
            <span>App Launches</span>
            <Smartphone className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-emerald-700">
            {loading ? '—' : (data?.summary.standaloneLaunches ?? 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Standalone Home Screen opens</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
            <span>Prompt Accept Rate</span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-blue-800">
            {loading ? '—' : `${data?.summary.promptConversionRate ?? 0}%`}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {data?.summary.promptAccepted ?? 0} accepted / {data?.summary.promptShown ?? 0} shown
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
            <span>iOS Guide Opens</span>
            <Tablet className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-950">
            {loading ? '—' : (data?.summary.iosGuideViews ?? 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Share → Add to Home Screen views</p>
        </div>
      </div>

      {/* Breakdowns: Device Category & Browser Family */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4 text-[#0B3075]" />
            <h4 className="text-sm font-extrabold text-slate-950">Installations by Device Category</h4>
          </div>
          {Object.keys(data?.byDeviceCategory || {}).length === 0 ? (
            <p className="text-xs text-slate-500 py-4">
              No device installation events recorded yet. Aggregate metrics populate automatically as users install and launch EduSmart LMS.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {Object.entries(data?.byDeviceCategory || {}).map(([key, counts]) => (
                <div key={key} className="py-2.5 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">{DEVICE_LABELS[key] || key}</span>
                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-[#0B3075] font-bold">{counts.installs} installs</span>
                    <span className="text-slate-500">{counts.launches} launches</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-600" />
            <h4 className="text-sm font-extrabold text-slate-950">Installations by Browser Engine</h4>
          </div>
          {Object.keys(data?.byBrowserFamily || {}).length === 0 ? (
            <p className="text-xs text-slate-500 py-4">
              Browser telemetry awaits the first mobile/desktop PWA installation.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {Object.entries(data?.byBrowserFamily || {}).map(([key, counts]) => (
                <div key={key} className="py-2.5 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">{BROWSER_LABELS[key] || key}</span>
                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-emerald-700 font-bold">{counts.installs} installs</span>
                    <span className="text-slate-500">{counts.launches} launches</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Privacy Notice + Recent Aggregate Events */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-extrabold text-slate-950">Recent Aggregate PWA Activity</h4>
            <p className="text-xs text-slate-500">
              Zero personal identifiers stored — only event type, device category, browser family, version, and timestamp.
            </p>
          </div>
          {data?.byVersion && Object.keys(data.byVersion).length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(data.byVersion).map(([ver, cnt]) => (
                <span key={ver} className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px] font-mono text-slate-700">
                  v{ver}: {cnt}
                </span>
              ))}
            </div>
          )}
        </div>

        {(data?.recentEvents || []).length === 0 ? (
          <p className="text-xs text-slate-500 py-3">No recent events recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-mono text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">Event</th>
                  <th className="py-2 px-3">Device Category</th>
                  <th className="py-2 px-3">Browser</th>
                  <th className="py-2 px-3">Version</th>
                  <th className="py-2 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {data?.recentEvents.map((ev, idx) => (
                  <tr key={`${ev.createdAt}-${idx}`}>
                    <td className="py-2 px-3 font-bold text-slate-900">{ev.eventType}</td>
                    <td className="py-2 px-3">{DEVICE_LABELS[ev.deviceCategory] || ev.deviceCategory}</td>
                    <td className="py-2 px-3">{BROWSER_LABELS[ev.browserFamily] || ev.browserFamily}</td>
                    <td className="py-2 px-3 font-mono">v{ev.appVersion}</td>
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-500">
                      {new Date(ev.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
