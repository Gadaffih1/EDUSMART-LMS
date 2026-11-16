import React, { useState, useEffect, useCallback } from 'react';
import {
  FlaskConical,
  CheckCircle2,
  XCircle,
  Clock,
  CreditCard,
  RefreshCw,
  Search,
  ShieldCheck,
  User,
  Phone,
  Mail,
  Hash,
} from 'lucide-react';

interface VlabPassRecord {
  id?: string;
  ticketId: string;
  tier: string;
  priceKes: number;
  paybillNumber?: string;
  accountNumber?: string;
  mpesaReference?: string;
  holderName: string;
  email: string;
  phone: string;
  schoolName?: string;
  gradeLevel?: string;
  issuedAt?: string;
  createdAt?: string;
  expiresAt?: string | null;
  status: 'pending_approval' | 'active' | 'rejected' | string;
  approvalStatus?: string;
  subscriptionVerified?: boolean;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

export const VirtualLabApprovalsPanel: React.FC = () => {
  const [passes, setPasses] = useState<VlabPassRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending_approval' | 'active' | 'rejected'>('all');
  const [search, setSearch] = useState<string>('');
  const [notice, setNotice] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadPasses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/vlab/admin/tickets', { credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.passes)) {
        setPasses(data.passes);
      }
    } catch {
      // ignore transient error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPasses();
    const handleSync = (evt: Event) => {
      const key = (evt as CustomEvent)?.detail?.key;
      if (key === 'edusmart_vlab_ticket_passes' || key === '*') {
        void loadPasses();
      }
    };
    window.addEventListener('edusmart:data-changed', handleSync);
    return () => window.removeEventListener('edusmart:data-changed', handleSync);
  }, [loadPasses]);

  const handleApprove = async (ticketId: string) => {
    setBusyId(ticketId);
    setNotice(null);
    try {
      const res = await fetch(`/api/vlab/admin/tickets/${encodeURIComponent(ticketId)}/approve`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        setNotice({ text: data?.error || 'Could not approve request.', type: 'error' });
      } else {
        setNotice({ text: `Approved Virtual Lab access for ${ticketId}. Subscriber can now launch the lab.`, type: 'success' });
        await loadPasses();
      }
    } catch {
      setNotice({ text: 'Network error approving request.', type: 'error' });
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (ticketId: string) => {
    setBusyId(ticketId);
    setNotice(null);
    try {
      const res = await fetch(`/api/vlab/admin/tickets/${encodeURIComponent(ticketId)}/reject`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: 'M-Pesa payment not found under Paybill 400200 Account 1164798.',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        setNotice({ text: data?.error || 'Could not decline request.', type: 'error' });
      } else {
        setNotice({ text: `Declined Virtual Lab request ${ticketId}.`, type: 'success' });
        await loadPasses();
      }
    } catch {
      setNotice({ text: 'Network error declining request.', type: 'error' });
    } finally {
      setBusyId(null);
    }
  };

  const pendingCount = passes.filter((p) => p.status === 'pending_approval').length;
  const activeCount = passes.filter((p) => p.status === 'active').length;
  const rejectedCount = passes.filter((p) => p.status === 'rejected').length;

  const filtered = passes.filter((p) => {
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      String(p.ticketId || '').toLowerCase().includes(q) ||
      String(p.mpesaReference || '').toLowerCase().includes(q) ||
      String(p.holderName || '').toLowerCase().includes(q) ||
      String(p.email || '').toLowerCase().includes(q) ||
      String(p.phone || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Paybill Summary & Stats */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-5 text-white border border-slate-800 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
            <FlaskConical className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                Super Admin Payment Gate
              </span>
              <span className="text-[10px] font-mono text-emerald-300">
                Paybill: <strong>400200</strong> · Account: <strong>1164798</strong>
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-extrabold mt-1">
              Public Virtual Lab Subscriptions &amp; Payment Approvals
            </h3>
            <p className="text-xs text-slate-300">
              Verify incoming M-Pesa payments made to Paybill <strong>400200</strong> (Account <strong>1164798</strong>) before public subscribers can launch the Virtual Lab.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void loadPasses()}
          className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/15 flex items-center gap-1.5 cursor-pointer self-start md:self-center shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-amber-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase text-slate-500">Awaiting Approval</div>
            <div className="text-2xl font-black text-amber-700">{pendingCount}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-emerald-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase text-slate-500">Approved &amp; Active</div>
            <div className="text-2xl font-black text-emerald-700">{activeCount}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-100">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase text-slate-500">Declined</div>
            <div className="text-2xl font-black text-rose-700">{rejectedCount}</div>
          </div>
        </div>
      </div>

      {notice && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
            notice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>{notice.text}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {([
              { id: 'all', label: `All (${passes.length})` },
              { id: 'pending_approval', label: `Pending (${pendingCount})` },
              { id: 'active', label: `Approved (${activeCount})` },
              { id: 'rejected', label: `Declined (${rejectedCount})` },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterStatus(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                  filterStatus === tab.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ticket, M-Pesa code, name..."
              className="pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-500">
              {loading ? 'Loading subscription requests...' : 'No Virtual Lab subscription requests match your filter.'}
            </div>
          ) : (
            filtered.map((pass) => {
              const isPending = pass.status === 'pending_approval';
              const isApproved = pass.status === 'active';
              const isBusy = busyId === pass.ticketId;

              return (
                <div
                  key={pass.ticketId}
                  className={`p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors ${
                    isPending ? 'bg-amber-50/40' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-2 text-left">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded-lg bg-slate-900 text-white">
                        {pass.ticketId}
                      </span>
                      {pass.mpesaReference && (
                        <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1">
                          <Hash className="w-3 h-3" />
                          <span>M-Pesa: {pass.mpesaReference}</span>
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                          isPending
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : isApproved
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : 'bg-rose-100 text-rose-900 border-rose-300'
                        }`}
                      >
                        {isPending ? 'Waiting Approval' : isApproved ? 'Approved & Active' : 'Declined'}
                      </span>
                      <span className="text-xs font-extrabold text-slate-800">
                        KES {Number(pass.priceKes || 0).toLocaleString()} ({String(pass.tier || 'term').toUpperCase()})
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                      <span className="flex items-center gap-1 font-semibold text-slate-900">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{pass.holderName}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-mono">{pass.phone}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{pass.email}</span>
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-slate-500">
                        <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                        <span>
                          Paybill {pass.paybillNumber || '400200'} · Acc {pass.accountNumber || '1164798'}
                        </span>
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500">
                      Submitted: {pass.issuedAt || pass.createdAt || 'Recently'} · {pass.schoolName || 'Public Learner'} ({pass.gradeLevel || 'JSS'})
                      {isApproved && pass.approvedBy && (
                        <span className="ml-2 text-emerald-700 font-semibold">· Approved by {pass.approvedBy}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isPending && (
                      <>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => void handleApprove(pass.ticketId)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isBusy ? 'Saving...' : 'Approve Access'}</span>
                        </button>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => void handleReject(pass.ticketId)}
                          className="px-3 py-2 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50"
                        >
                          Decline
                        </button>
                      </>
                    )}
                    {isApproved && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => void handleReject(pass.ticketId)}
                        className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50"
                      >
                        Revoke
                      </button>
                    )}
                    {pass.status === 'rejected' && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => void handleApprove(pass.ticketId)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50"
                      >
                        Approve Now
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
