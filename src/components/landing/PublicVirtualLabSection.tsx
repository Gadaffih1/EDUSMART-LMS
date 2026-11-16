import React, { useState } from 'react';
import { 
  FlaskConical, 
  Ticket, 
  Sparkles, 
  CheckCircle2, 
  Zap, 
  Atom, 
  Laptop, 
  ArrowRight, 
  ShieldCheck, 
  KeyRound, 
  Waves, 
  TestTube, 
  Eye, 
  Layers,
  Award,
  Check,
  Activity,
  Code2,
  Lock,
  Mail,
  RefreshCw,
  Clock,
  AlertCircle
} from 'lucide-react';
import { SubscriptionTier, PASS_OPTIONS } from '../virtuallab/VirtualLabSubscriptionModal';
import { ClientDataStore } from '../../utils/clientDataStore';

interface PublicVirtualLabSectionProps {
  onOpenTicketModal: (tier?: SubscriptionTier, step?: 'select' | 'checkout' | 'ticket' | 'enter_ticket' | 'launch_lab', ticketCode?: string) => void;
  isSuperAdminEditMode?: boolean;
  hasActiveSubscription?: boolean;
  activeTicketCode?: string;
}

export const PublicVirtualLabSection: React.FC<PublicVirtualLabSectionProps> = ({
  onOpenTicketModal,
  isSuperAdminEditMode = false,
  hasActiveSubscription = false,
  activeTicketCode = ''
}) => {
  const [ticketInputCode, setTicketInputCode] = useState('');
  const [quickNotice, setQuickNotice] = useState<string | null>(null);
  const [approvalEmail, setApprovalEmail] = useState('');
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailCheckNotice, setEmailCheckNotice] = useState<{ type: 'warning' | 'error'; message: string } | null>(null);

  const handleConfirmApprovalByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = approvalEmail.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setEmailCheckNotice({
        type: 'error',
        message: 'Please enter the valid email address submitted with your Paybill 400200 payment.',
      });
      return;
    }

    setIsCheckingEmail(true);
    setEmailCheckNotice(null);
    try {
      const res = await fetch('/api/vlab/tickets/check-email', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const data = await res.json().catch(() => ({}));
      if (
        res.ok &&
        data?.approved &&
        data?.pass &&
        data.pass.status === 'active' &&
        data.pass.subscriptionVerified !== false
      ) {
        ClientDataStore.setActiveVlabPass(data.pass);
        setEmailCheckNotice(null);
        onOpenTicketModal((data.pass.tier as SubscriptionTier) || 'term', 'ticket', data.pass.ticketId);
      } else if (data?.status === 'pending_approval') {
        setEmailCheckNotice({
          type: 'warning',
          message:
            data?.error ||
            'Your Paybill 400200 (Account 1164798) payment is still awaiting Super Admin approval.',
        });
      } else {
        setEmailCheckNotice({
          type: 'error',
          message:
            data?.error ||
            `No approved Virtual Lab subscription found for "${cleanEmail}".`,
        });
      }
    } catch {
      setEmailCheckNotice({
        type: 'error',
        message: 'Unable to check approval status with the server right now. Please try again.',
      });
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const handleVerifyDirectTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = ticketInputCode.trim().toUpperCase();
    if (!code) {
      setQuickNotice('Please enter your paid subscription ticket code (e.g. VLAB-TICKET-XXXXXX).');
      return;
    }

    if (code.includes('DEMO')) {
      setQuickNotice('Free demo access has been disabled. Public access to the virtual lab workspace strictly requires an active paid subscription pass. Please select a pass below.');
      return;
    }

    try {
      const res = await fetch(`/api/vlab/tickets/${encodeURIComponent(code)}`, { credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (
        res.ok &&
        data?.valid &&
        data?.pass &&
        data.pass.status === 'active' &&
        data.pass.subscriptionVerified !== false &&
        !String(data.pass.ticketId || '').toUpperCase().includes('DEMO')
      ) {
        ClientDataStore.setActiveVlabPass(data.pass);
        onOpenTicketModal('term', 'launch_lab', data.pass.ticketId);
        setQuickNotice(null);
      } else {
        setQuickNotice(
          data?.error || `No active paid subscription found for "${code}". Public access to the laboratory workspace is strictly restricted to paid subscribers. Please select a pass below.`
        );
      }
    } catch {
      onOpenTicketModal('term', 'select');
    }
  };

  const SIMULATION_HIGHLIGHTS = [
    {
      id: 'wave-on-string',
      title: 'Wave on a String & Harmonic Waves',
      category: 'Physics / CBC Grade 7–9',
      icon: Waves,
      accentColor: 'text-cyan-400 bg-cyan-950/80 border-cyan-500/30',
      description: 'Interact with vibrating strings: adjust frequency, amplitude, damping & tension to observe transverse reflections and nodal patterns in real time.',
      badge: 'PhET Simulation'
    },
    {
      id: 'titration-chemistry',
      title: 'Acids, Bases & Neutralization Titration',
      category: 'Chemistry / CBC Grade 8',
      icon: TestTube,
      accentColor: 'text-amber-400 bg-amber-950/80 border-amber-500/30',
      description: 'Calibrated burette dispensing of HCl into NaOH with phenolphthalein indicator, real-time pH tracking, and titration curves.',
      badge: 'CBC Practical'
    },
    {
      id: 'circuit-construction',
      title: 'DC Circuit Construction & Ohm\'s Law',
      category: 'Physics & Technology',
      icon: Zap,
      accentColor: 'text-emerald-400 bg-emerald-950/80 border-emerald-500/30',
      description: 'Build circuits with batteries, variable resistors, switches, and ammeters with animated electron currents and schematic exports.',
      badge: 'Interactive Bench'
    },
    {
      id: 'scratch-coding',
      title: 'Scratch Coding & Algorithm Studio',
      category: 'Computer Science & ICT',
      icon: Code2,
      accentColor: 'text-purple-400 bg-purple-950/80 border-purple-500/30',
      description: 'Block programming studio with drag-and-drop sprites, loops, sensing events, and computational thinking challenges.',
      badge: 'Computer Studio'
    }
  ];

  return (
    <section id="virtuallab-section" className="py-16 sm:py-24 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white relative overflow-hidden border-b border-slate-800">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-[-10%] w-[28rem] h-[28rem] rounded-full bg-emerald-600/15 blur-3xl" />
        <div className="absolute bottom-1/4 right-[-10%] w-[32rem] h-[32rem] rounded-full bg-blue-600/20 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-[11px] font-black uppercase tracking-widest shadow-lg">
            <FlaskConical className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Subscription Required for Public Access · Lab Ticketing</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            Public Virtual Laboratory Portal
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
            Hands-on Kenyan CBC junior secondary &amp; primary STEM experiments, PhET interactive physics apparatus (<span className="text-cyan-300 font-bold">Wave on a String</span>, <span className="text-amber-300 font-bold">Circuit Construction</span>, <span className="text-emerald-300 font-bold">Titration</span>), and Scratch coding. Accessible to homeschoolers, students, and the public through flexible ticketing passes.
          </p>

          {/* Subscribed Schools Free Bundled vs Public Subscription Notice */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900/90 to-blue-950/60 border border-emerald-500/40 text-left max-w-2xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-xs text-slate-300">
                <span className="font-extrabold text-white text-xs block">
                  Institutional Package: 100% Free &amp; Bundled for Subscribed Schools
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Enrolled students, teachers, and school administrators access all 75 CBC apparatus simulations with zero extra fees. Public visitors and non-enrolled learners access strictly upon purchasing an active subscription pass below.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold text-[10px] rounded-lg shrink-0">
              Free to Subscribed Schools
            </span>
          </div>


          {hasActiveSubscription && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-500/60 rounded-2xl max-w-xl mx-auto flex items-center justify-between gap-3 text-xs text-emerald-200 shadow-xl">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Subscription Active: <strong className="font-mono text-white">{activeTicketCode}</strong></span>
              </div>
              <button
                type="button"
                onClick={() => onOpenTicketModal('term', 'launch_lab', activeTicketCode)}
                className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-lg transition-all cursor-pointer shadow-sm"
              >
                Launch Workspace →
              </button>
            </div>
          )}

          {/* Quick Direct Ticket Access & Email Approval Confirmation Banners */}
          <div className="pt-2 max-w-2xl mx-auto space-y-3">
            {/* Confirm Approval by Email -> Pops Ticket Once Approved */}
            <form
              onSubmit={handleConfirmApprovalByEmail}
              className="p-2 sm:p-2.5 bg-gradient-to-r from-emerald-950/90 via-slate-900/95 to-teal-950/90 backdrop-blur-md rounded-2xl border border-emerald-500/40 shadow-xl flex flex-col sm:flex-row items-center gap-2"
            >
              <div className="relative flex-1 w-full">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400" />
                <input
                  type="email"
                  value={approvalEmail}
                  onChange={(e) => {
                    setApprovalEmail(e.target.value);
                    if (emailCheckNotice) setEmailCheckNotice(null);
                  }}
                  placeholder="Confirm approval by email (e.g. parent@gmail.com)"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400"
                />
              </div>

              <button
                type="submit"
                disabled={isCheckingEmail}
                className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-60"
              >
                {isCheckingEmail ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Ticket className="w-3.5 h-3.5" />
                )}
                <span>{isCheckingEmail ? 'Checking...' : 'Confirm Approval & Pop Ticket'}</span>
              </button>
            </form>

            {emailCheckNotice && (
              <div
                className={`p-3 rounded-xl text-xs flex items-start gap-2 text-left border ${
                  emailCheckNotice.type === 'warning'
                    ? 'bg-amber-950/80 border-amber-500/40 text-amber-200'
                    : 'bg-red-950/80 border-red-500/40 text-red-200'
                }`}
              >
                {emailCheckNotice.type === 'warning' ? (
                  <Clock className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                )}
                <span>{emailCheckNotice.message}</span>
              </div>
            )}

            <form onSubmit={handleVerifyDirectTicket} className="p-2 sm:p-2.5 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-700 shadow-xl flex flex-col sm:flex-row items-center gap-2">
              <div className="relative flex-1 w-full">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={ticketInputCode}
                  onChange={(e) => {
                    setTicketInputCode(e.target.value);
                    if (quickNotice) setQuickNotice(null);
                  }}
                  placeholder="Enter Ticket Code (e.g. VLAB-TICKET-XXXXXX)"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 uppercase"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="submit"
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                >
                  <span>Redeem Ticket</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => onOpenTicketModal('term', 'select')}
                  className="px-3.5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer shrink-0 flex items-center gap-1.5"
                  title="Subscribe for Public Access Pass"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Subscribe for Pass</span>
                </button>
              </div>
            </form>
            {quickNotice && (
              <p className="text-[11px] text-amber-300 mt-2 font-medium">{quickNotice}</p>
            )}
          </div>
        </div>

        {/* 4 Core Simulation Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 text-left">
          {SIMULATION_HIGHLIGHTS.map((item) => {
            const Icon = item.icon;
            return (
              <div 
                key={item.id} 
                className="bg-white/[0.04] hover:bg-white/[0.08] backdrop-blur-md rounded-2xl p-5 border border-white/10 hover:border-emerald-400/40 transition-all duration-300 flex flex-col justify-between group space-y-4 shadow-sm"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-2.5 rounded-xl border ${item.accentColor}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-white/10 text-slate-300 px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {item.category}
                    </span>
                    <h3 className="font-extrabold text-base text-white mt-1 group-hover:text-emerald-300 transition-colors">
                      {item.title}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (hasActiveSubscription && activeTicketCode) {
                      onOpenTicketModal('term', 'launch_lab', activeTicketCode);
                    } else {
                      onOpenTicketModal('term', 'select');
                    }
                  }}
                  className={`w-full pt-3 border-t border-white/10 flex items-center justify-between text-xs font-bold transition-colors cursor-pointer ${
                    hasActiveSubscription ? 'text-emerald-400 hover:text-emerald-300' : 'text-amber-400 hover:text-amber-300'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    {hasActiveSubscription ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Launch Simulation (Pass Active)</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Subscribe to Unlock</span>
                      </>
                    )}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Ticketing Passes Pricing Tier Container */}
        <div className="bg-slate-900/80 rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl space-y-8 text-left">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest block">
                Public Admission Passes
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                Choose Your Virtual Lab Ticket
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                All passes include full non-member access to all 75 CBC apparatus items, PhET physics simulations, and Scratch coding.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-emerald-300 font-mono font-bold">
                Paybill: 400200 · Account: 1164798 (Super Admin Approval)
              </span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PASS_OPTIONS.map((pass) => (
              <div 
                key={pass.id} 
                className={`rounded-2xl p-6 border transition-all flex flex-col justify-between ${
                  pass.recommended 
                    ? 'bg-gradient-to-b from-blue-950/80 to-slate-900 border-emerald-500/60 shadow-xl ring-2 ring-emerald-500/20 relative' 
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                {pass.recommended && (
                  <div className="absolute -top-3 right-6 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-[10px] uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
                    Most Popular Pass
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {pass.badge}
                    </span>
                    <Ticket className="w-4 h-4 text-emerald-400" />
                  </div>

                  <div>
                    <h4 className="font-extrabold text-lg text-white">{pass.title}</h4>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-xs font-bold text-slate-400">KES</span>
                      <span className="text-3xl font-black text-white">{pass.priceKes.toLocaleString()}</span>
                      <span className="text-xs text-slate-400 ml-1">/ {pass.duration}</span>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-4 border-t border-slate-800 text-xs">
                    {pass.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-slate-300">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 mt-4">
                  <button
                    type="button"
                    onClick={() => onOpenTicketModal(pass.id, 'checkout')}
                    className={`w-full py-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                      pass.recommended
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 hover:scale-[1.02]'
                        : 'bg-slate-800 hover:bg-slate-700 text-white'
                    }`}
                  >
                    <Ticket className="w-4 h-4" />
                    <span>Get {pass.title}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom guarantee & support notice */}
          <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Works instantly on mobile phones, tablets, Chromebooks, and PCs. No app store installation required.</span>
            </div>
            <button
              type="button"
              onClick={() => onOpenTicketModal('term', 'enter_ticket')}
              className="text-cyan-400 hover:text-cyan-300 font-bold hover:underline cursor-pointer shrink-0"
            >
              Have a School or Institutional Voucher? Redeem Here →
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};
