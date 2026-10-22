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
  Lock
} from 'lucide-react';
import { SubscriptionTier, PASS_OPTIONS } from '../virtuallab/VirtualLabSubscriptionModal';

interface PublicVirtualLabSectionProps {
  onOpenTicketModal: (tier?: SubscriptionTier, step?: 'select' | 'checkout' | 'enter_ticket' | 'launch_lab', ticketCode?: string) => void;
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

  const handleVerifyDirectTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const code = ticketInputCode.trim().toUpperCase();
    if (!code) {
      setQuickNotice('Please enter your purchased subscription ticket code (e.g. VLAB-TICKET-829104).');
      return;
    }

    try {
      const stored = JSON.parse(localStorage.getItem('edusmart_vlab_ticket_passes') || '[]');
      const found = stored.find((t: any) => t.ticketId && t.ticketId.toUpperCase() === code);
      if (found) {
        onOpenTicketModal('term', 'launch_lab', found.ticketId);
        setQuickNotice(null);
      } else {
        setQuickNotice(`No active subscription found for "${code}". Public access to the laboratory is restricted to subscribers only. Please purchase a pass below.`);
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
            <span>Open to the Public · Digital Lab Ticketing</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            Public Virtual Laboratory Portal
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
            Hands-on Kenyan CBC junior secondary & primary STEM experiments, PhET interactive physics apparatus (<span className="text-cyan-300 font-bold">Wave on a String</span>, <span className="text-amber-300 font-bold">Circuit Construction</span>, <span className="text-emerald-300 font-bold">Titration</span>), and Scratch coding. Accessible to homeschoolers, students, and the public through flexible ticketing passes.
          </p>

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

          {/* Quick Direct Ticket Access Banner */}
          <div className="pt-2 max-w-xl mx-auto">
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
                  placeholder="Enter Ticket Code (e.g. VLAB-TICKET-829104)"
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
              <span className="text-xs text-slate-400">Instant M-Pesa STK verification</span>
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
