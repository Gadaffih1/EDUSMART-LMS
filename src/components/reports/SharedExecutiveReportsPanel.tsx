import React, { useCallback, useEffect, useState } from 'react';
import { Building2, FileText, Printer, RefreshCw, Share2 } from 'lucide-react';
import type { ExecutiveReport, User } from '../../types';
import { ClientDataStore } from '../../utils/clientDataStore';
import { useTenant } from '../../context/TenantContext';
import { TenantSchoolLogo } from '../common/TenantSchoolLogo';

interface SharedExecutiveReportsPanelProps {
  currentUser: User;
}

export const SharedExecutiveReportsPanel: React.FC<SharedExecutiveReportsPanelProps> = ({
  currentUser,
}) => {
  const { currentTenant } = useTenant();
  const [reports, setReports] = useState<ExecutiveReport[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ClientDataStore.apiFetchExecutiveReports(currentTenant.id);
      setReports(res.reports);
      setSelectedId((prev) => {
        if (prev && res.reports.some((r) => r.id === prev)) return prev;
        return res.reports[0]?.id || null;
      });
    } catch (err: any) {
      setError(err?.message || 'Unable to load shared reports.');
    } finally {
      setLoading(false);
    }
  }, [currentTenant.id]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  useEffect(() => {
    const onUpdate = () => {
      void loadReports();
    };
    window.addEventListener('executive-reports-updated', onUpdate);
    return () => window.removeEventListener('executive-reports-updated', onUpdate);
  }, [loadReports]);

  const activeReport = reports.find((r) => r.id === selectedId) || reports[0] || null;

  return (
    <section className="space-y-5">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
            <Building2 className="w-3.5 h-3.5" />
            <span>Head Teacher &amp; BoM Briefings</span>
          </div>
          <h3 className="text-base font-black text-slate-900 mt-0.5">
            Shared Executive, BoM &amp; Institutional Reports ({reports.length})
          </h3>
          <p className="text-xs text-slate-600">
            Official briefings and circulars shared directly with your role, department, parent cohort, group, or account by {currentTenant.name} Leadership.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadReports()}
          className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 print:hidden">
          {error}
        </div>
      )}

      {loading && reports.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
          Loading shared reports...
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center space-y-2">
          <FileText className="w-9 h-9 text-slate-300 mx-auto" />
          <div className="text-sm font-bold text-slate-800">No shared Head Teacher reports yet</div>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            When the Head Teacher shares a BoM report, departmental review, or institutional briefing with you ({currentUser.name}), it will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
          <aside className="xl:col-span-4 space-y-2.5 print:hidden">
            {reports.map((rep) => {
              const isSelected = activeReport?.id === rep.id;
              return (
                <div
                  key={rep.id}
                  onClick={() => setSelectedId(rep.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? 'bg-white border-emerald-500 ring-2 ring-emerald-500/15 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {rep.classification}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {rep.updatedAt?.split('T')[0]}
                    </span>
                  </div>
                  <div className="text-sm font-black text-slate-900">{rep.title}</div>
                  <div className="text-[11px] font-mono text-slate-500">{rep.reportingPeriod}</div>
                  {rep.matchedReasons && rep.matchedReasons.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {rep.matchedReasons.map((reason, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700"
                        >
                          <Share2 className="w-2.5 h-2.5 text-emerald-600" />
                          {reason}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </aside>

          <div className="xl:col-span-8">
            {activeReport && (
              <article className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6 border-t-4 border-t-emerald-600 print:m-0 print:border-none print:shadow-none">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b-2 border-slate-900 gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="p-1.5 bg-slate-50 rounded-2xl border border-slate-200 shadow-2xs shrink-0">
                      <TenantSchoolLogo variant="full" size="sm" />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-widest">
                        {currentTenant.name}
                      </div>
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        {activeReport.classification}
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                        {activeReport.title}
                      </h2>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        Reporting Period: {activeReport.reportingPeriod}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3.5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl flex items-center gap-1.5 shadow-xs shrink-0 self-start sm:self-auto cursor-pointer print:hidden"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Dossier</span>
                  </button>
                </div>

                {activeReport.shares?.some((s) => s.sharedNote) && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950">
                    <span className="font-bold">Executive Note: </span>
                    {activeReport.shares.find((s) => s.sharedNote)?.sharedNote}
                  </div>
                )}

                {activeReport.summary && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                    <span className="font-bold text-slate-900 uppercase tracking-wider text-[10px] block mb-1">
                      Executive Abstract
                    </span>
                    {activeReport.summary}
                  </div>
                )}

                <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
                  {activeReport.sections.map((sec, idx) => (
                    <div key={sec.id || idx} className="space-y-1.5">
                      <h3 className="text-sm font-bold text-slate-900 uppercase">
                        {idx + 1}. {sec.heading}
                      </h3>
                      <p className="whitespace-pre-line">{sec.body}</p>
                    </div>
                  ))}

                  <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 font-mono">
                    <div>{activeReport.certifiedBy}</div>
                    <div>{activeReport.directorateLabel}</div>
                  </div>
                </div>
              </article>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
