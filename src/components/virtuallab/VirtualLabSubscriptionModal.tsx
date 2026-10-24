import React, { useState, useEffect } from 'react';
import { SyncEngine } from '../../utils/syncEngine';
import { 
  X, 
  FlaskConical, 
  Laptop, 
  CheckCircle2, 
  Ticket, 
  Sparkles, 
  ShieldCheck, 
  CreditCard, 
  Phone, 
  User, 
  Mail, 
  GraduationCap, 
  ArrowRight, 
  QrCode, 
  Clock, 
  Printer, 
  Check, 
  Lock,
  Layers,
  Award,
  KeyRound,
  AlertCircle
} from 'lucide-react';
import { Storage } from '../../utils/storage';
import { VirtualLabWorkspace } from './VirtualLabWorkspace';

export type SubscriptionTier = 'day' | 'term' | 'annual';

export interface PassOption {
  id: SubscriptionTier;
  title: string;
  badge: string;
  priceKes: number;
  duration: string;
  features: string[];
  recommended?: boolean;
}

export const PASS_OPTIONS: PassOption[] = [
  {
    id: 'day',
    title: '1-Day Explorer Lab Ticket',
    badge: 'Single Day Access',
    priceKes: 150,
    duration: '24 Hours',
    features: [
      'Access to all 75 CBC apparatus simulations',
      'Wave on a string, Chemistry titrations & Ohm circuit workbench',
      'Scratch Computer Coding visual playground',
      'Instant access on phone, tablet & desktop'
    ]
  },
  {
    id: 'term',
    title: 'Full Term Non-Member Pass',
    badge: 'Most Popular',
    priceKes: 1200,
    duration: '3 Months (Full School Term)',
    recommended: true,
    features: [
      'Unlimited access across all 3 months',
      'Complete 10-Stage CBC learner inquiry steps',
      'Wave on a String & Physics harmonic experiments',
      'Interactive Scratch coding simulations & game labs',
      'Digital lab observation notebooks & downloadable PDF reports'
    ]
  },
  {
    id: 'annual',
    title: 'Annual Homeschooler & STEM Pass',
    badge: 'Best Value',
    priceKes: 3500,
    duration: '12 Months (Full Calendar Year)',
    features: [
      'Full 1-year unlimited access for up to 3 learners',
      'All 75 JSS apparatus + future experiment updates',
      'Advanced Scratch projects & algorithm challenges',
      'Certificate of Practical Completion',
      'Priority STEM teacher consultation sessions'
    ]
  }
];

export interface VirtualLabSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTier?: SubscriptionTier;
  initialStep?: 'select' | 'checkout' | 'ticket' | 'launch_lab' | 'enter_ticket';
  initialTicketCode?: string;
  onSubscriptionSuccess?: (ticketId: string) => void;
}

export const VirtualLabSubscriptionModal: React.FC<VirtualLabSubscriptionModalProps> = ({
  isOpen,
  onClose,
  initialTier = 'term',
  initialStep = 'select',
  initialTicketCode = '',
  onSubscriptionSuccess
}) => {
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>(initialTier);
  const [step, setStep] = useState<'select' | 'checkout' | 'ticket' | 'launch_lab' | 'enter_ticket'>(initialStep);
  const [activeTab, setActiveTab] = useState<'buy' | 'redeem'>('buy');
  
  // Checkout Fields
  const [fullName, setFullName] = useState('Visiting Scholar');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('0712 345 678');
  const [schoolName, setSchoolName] = useState('Public STEM Learner / Homeschool');
  const [gradeLevel, setGradeLevel] = useState('Grade 7 (JSS)');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Generated Ticket Info
  const [ticketNumber, setTicketNumber] = useState(initialTicketCode || 'VLAB-TICKET-829104');
  const [ticketDate, setTicketDate] = useState('');
  const [existingTicketInput, setExistingTicketInput] = useState(initialTicketCode || '');
  const [ticketValidationNotice, setTicketValidationNotice] = useState<string | null>(null);

  useEffect(() => {
    if (initialTier) setSelectedTier(initialTier);
    if (initialStep) {
      setStep(initialStep);
      if (initialStep === 'enter_ticket') setActiveTab('redeem');
    }
    if (initialTicketCode) {
      setTicketNumber(initialTicketCode);
      setExistingTicketInput(initialTicketCode);
    }
  }, [initialTier, initialStep, initialTicketCode, isOpen]);

  if (!isOpen) return null;

  const selectedPass = PASS_OPTIONS.find(p => p.id === selectedTier) || PASS_OPTIONS[1];

  const handleProceedToCheckout = () => {
    setStep('checkout');
  };

  const handleCompleteSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !phone) return;

    setIsProcessing(true);
    setTimeout(() => {
      const generatedTicketId = `VLAB-TICKET-${Date.now().toString().slice(-6)}`;
      const nowStr = new Date().toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
      setTicketNumber(generatedTicketId);
      setTicketDate(nowStr);
      setIsProcessing(false);
      setStep('ticket');

      // Record ticket pass in localStorage for school audit & ticketing system
      const existing = JSON.parse(localStorage.getItem('edusmart_vlab_ticket_passes') || '[]');
      existing.unshift({
        ticketId: generatedTicketId,
        tier: selectedTier,
        priceKes: selectedPass.priceKes,
        holderName: fullName,
        email,
        phone,
        schoolName,
        gradeLevel,
        issuedAt: nowStr,
        status: 'active'
      });
      SyncEngine.persistItem('edusmart_vlab_ticket_passes', JSON.stringify(existing));
      try {
        localStorage.setItem('edusmart_public_active_ticket', generatedTicketId);
      } catch {}
      if (onSubscriptionSuccess) {
        onSubscriptionSuccess(generatedTicketId);
      }
    }, 1200);
  };

  const handleValidateTicket = (codeToTest?: string) => {
    const raw = (codeToTest || existingTicketInput).trim().toUpperCase();
    if (!raw) {
      setTicketValidationNotice('Please enter your subscription pass or ticket ID (e.g. VLAB-TICKET-829104).');
      return;
    }

    const stored = JSON.parse(localStorage.getItem('edusmart_vlab_ticket_passes') || '[]');
    const found = stored.find((t: any) => t.ticketId && t.ticketId.toUpperCase() === raw);

    if (found) {
      const activeCode = found.ticketId;
      setTicketNumber(activeCode);
      if (found.holderName) setFullName(found.holderName);
      setTicketDate(found.issuedAt || new Date().toLocaleString());
      try {
        localStorage.setItem('edusmart_public_active_ticket', activeCode);
      } catch {}
      if (onSubscriptionSuccess) {
        onSubscriptionSuccess(activeCode);
      }
      setStep('launch_lab');
      setTicketValidationNotice(null);
    } else {
      setTicketValidationNotice(`No active subscription found for "${raw}". Public access to the interactive classroom and laboratory via the landing page is restricted to subscribers only. Please purchase a pass.`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      {step === 'launch_lab' ? (
        /* Full-Screen Lab Explorer for Subscribed Non-Member */
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-7xl h-[95vh] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
          <div className="p-3.5 sm:p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md">
                <FlaskConical className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                    Active Ticket: {ticketNumber}
                  </span>
                  <span className="text-[10px] text-slate-300 hidden sm:inline">Pass Holder: {fullName}</span>
                </div>
                <h3 className="text-xs sm:text-sm font-extrabold text-white mt-0.5">
                  EduSmart CBC Virtual Science & Scratch Coding Studio
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep('ticket')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                View Ticket Pass
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <X className="w-4 h-4" />
                <span>Exit Lab</span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-50">
            <VirtualLabWorkspace
              currentUser={{
                id: `usr-vis-${ticketNumber}`,
                name: fullName || 'Subscribed Scholar',
                email: email || 'visitor@edusmart.ac.ke',
                role: 'student',
                grade: 7,
                stream: 'Dove',
                admissionNumber: ticketNumber
              } as any}
              isEmbedded={true}
              onClose={onClose}
            />
          </div>
        </div>
      ) : (
        /* Subscription & Ticketing Flow Modal */
        <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden max-h-[94vh] flex flex-col">
          {/* Top Banner */}
          <div className="p-4 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 via-emerald-400 to-teal-400 p-0.5 shadow-lg flex items-center justify-center shrink-0">
                <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                  <Ticket className="w-6 h-6 text-amber-400 animate-pulse" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full shadow-xs">
                    Public Non-Member Pass
                  </span>
                  <span className="text-[10px] font-bold bg-white/10 text-slate-300 px-2 py-0.5 rounded-full">
                    Ticketing Portal
                  </span>
                </div>
                <h3 className="text-base sm:text-xl font-black tracking-tight text-white mt-1">
                  Virtual Science Laboratory & Scratch Studio Ticketing
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Subheader Navigation: Buy Ticket vs Enter Existing Ticket */}
          <div className="px-5 pt-3 bg-slate-100 border-b border-slate-200 flex items-center gap-2">
            <button
              type="button"
              onClick={() => { setActiveTab('buy'); setStep('select'); }}
              className={`px-4 py-2 font-bold text-xs rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'buy'
                  ? 'bg-white text-slate-900 shadow-xs border-t-2 border-emerald-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Ticket className="w-3.5 h-3.5 text-emerald-600" />
              <span>Purchase Lab Ticket</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('redeem'); setStep('enter_ticket'); }}
              className={`px-4 py-2 font-bold text-xs rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'redeem'
                  ? 'bg-white text-slate-900 shadow-xs border-t-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 text-blue-600" />
              <span>Enter Existing Ticket Code</span>
            </button>

            <div className="ml-auto flex items-center gap-1.5 px-3 py-1 bg-amber-500/15 border border-amber-400/40 text-amber-800 rounded-lg text-[11px] font-extrabold">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>Public Access: Subscription Required</span>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-8 bg-slate-50 space-y-6">
            
            {/* School Bundled vs Public Subscription Notice */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/10 via-emerald-900/5 to-teal-950/10 border border-emerald-300/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold text-emerald-950 block">Subscribed Partner Schools Notice</span>
                  <span className="text-emerald-800 text-[11px] leading-relaxed">
                    Virtual Science Lab &amp; Scratch Studio access is <strong>100% FREE and bundled</strong> for all students, teachers, and staff of subscribed member schools as part of the institutional package. Public visitors and non-enrolled learners access strictly via the subscription passes below.
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-emerald-700 text-white font-bold text-[10px] rounded-lg shrink-0 whitespace-nowrap">
                Free for Member Schools
              </span>
            </div>

            {activeTab === 'redeem' && (
              <div className="max-w-xl mx-auto space-y-5 py-4">
                <div className="text-center space-y-1">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 mx-auto flex items-center justify-center mb-2">
                    <KeyRound className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-black text-slate-900">
                    Redeem Your Lab Admission Ticket
                  </h4>
                  <p className="text-xs text-slate-500">
                    Enter the ticket number or pass code sent via SMS or printed on your receipt.
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Ticket Code / Pass Identifier
                    </label>
                    <input
                      type="text"
                      value={existingTicketInput}
                      onChange={(e) => {
                        setExistingTicketInput(e.target.value);
                        if (ticketValidationNotice) setTicketValidationNotice(null);
                      }}
                      placeholder="e.g. VLAB-TICKET-829104 or VLAB-DEMO-2026"
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                    />
                  </div>

                  {ticketValidationNotice && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                      <span>{ticketValidationNotice}</span>
                    </div>
                  )}

                  <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleValidateTicket()}
                      className="w-full sm:flex-1 py-3 bg-blue-700 hover:bg-blue-800 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verify Ticket & Launch Virtual Lab</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleValidateTicket('VLAB-DEMO-2026')}
                      className="w-full sm:w-auto px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                    >
                      Use Demo Code
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: SELECT PASS TIER */}
            {activeTab === 'buy' && step === 'select' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-base font-extrabold text-slate-900">
                    Choose Your Virtual Lab Access Pass
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Experience all 75 CBC JSS science apparatus items, PhET simulations (Wave on a String, Circuit Construction, Titration), and Scratch computer coding.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {PASS_OPTIONS.map((pass) => {
                    const isSelected = selectedTier === pass.id;
                    return (
                      <div
                        key={pass.id}
                        onClick={() => setSelectedTier(pass.id)}
                        className={`rounded-2xl p-5 border-2 transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-emerald-600 bg-white ring-4 ring-emerald-500/10 shadow-lg'
                            : 'border-slate-200 bg-white hover:border-slate-300 shadow-2xs'
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              pass.recommended 
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {pass.badge}
                            </span>
                            {isSelected && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                          </div>

                          <div>
                            <h5 className="font-extrabold text-sm text-slate-900">{pass.title}</h5>
                            <div className="mt-2 flex items-baseline gap-1">
                              <span className="text-xs font-bold text-slate-500">KES</span>
                              <span className="text-2xl font-black text-slate-900">{pass.priceKes.toLocaleString()}</span>
                            </div>
                            <span className="text-[11px] text-slate-400 font-medium">Valid for {pass.duration}</span>
                          </div>

                          <div className="pt-3 border-t border-slate-100 space-y-2">
                            {pass.features.map((feat, idx) => (
                              <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-600">
                                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                <span>{feat}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <button
                          type="button"
                          className={`mt-4 w-full py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {isSelected ? 'Selected Pass Tier' : 'Select This Pass'}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Feature highlight bar */}
                <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-6 h-6 text-emerald-700 shrink-0" />
                    <div className="text-xs text-emerald-950">
                      <strong>Instant Pass Issuance:</strong> Includes digital ticketing pass, automated M-Pesa receipt, and direct access inside the browser without software installation.
                    </div>
                  </div>

                  <button
                    onClick={handleProceedToCheckout}
                    className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer shrink-0 transition-colors"
                  >
                    <span>Continue to Ticketing Checkout</span>
                    <ArrowRight className="w-4 h-4 text-emerald-400" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: CHECKOUT & M-PESA TICKETING */}
            {activeTab === 'buy' && step === 'checkout' && (
              <form onSubmit={handleCompleteSubscription} className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div>
                    <h4 className="text-base font-extrabold text-slate-900">
                      Non-Member Subscriber & Ticket Registration
                    </h4>
                    <p className="text-xs text-slate-500">
                      Enter your details to generate your official Virtual Lab admission pass.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep('select')}
                    className="text-xs font-bold text-slate-600 hover:underline cursor-pointer"
                  >
                    ← Change Pass
                  </button>
                </div>

                {/* Selected pass summary pill */}
                <div className="p-4 bg-indigo-50/80 rounded-2xl border border-indigo-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Ticket className="w-6 h-6 text-indigo-700" />
                    <div>
                      <h5 className="font-bold text-xs text-indigo-950">{selectedPass.title}</h5>
                      <span className="text-[11px] text-indigo-800">{selectedPass.duration}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black text-indigo-950">KES {selectedPass.priceKes.toLocaleString()}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Full Name of Learner / Scholar *</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Brian Ochieng"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>Parent / Guardian Email Address *</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. joy.parent@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>M-Pesa Mobile Number *</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="07XX XXX XXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-mono font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                      <span>Target Grade / Curriculum Level</span>
                    </label>
                    <select
                      value={gradeLevel}
                      onChange={(e) => setGradeLevel(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      <option value="Grade 4">Grade 4 Primary</option>
                      <option value="Grade 5">Grade 5 Primary</option>
                      <option value="Grade 6">Grade 6 Primary</option>
                      <option value="Grade 7 (JSS)">Grade 7 Junior Secondary</option>
                      <option value="Grade 8 (JSS)">Grade 8 Junior Secondary</option>
                      <option value="Grade 9 (JSS)">Grade 9 Junior Secondary</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    School / Institutional Affiliation:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Visiting Learner / Homeschool / Academy Name"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">
                      Total Payable Amount:
                    </span>
                    <div className="text-xl font-black text-emerald-950">
                      KES {selectedPass.priceKes.toLocaleString()}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <span>Processing M-Pesa STK Prompt...</span>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        <span>Pay via M-Pesa & Generate Pass</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: ISSUED TICKETING PASS */}
            {activeTab === 'buy' && step === 'ticket' && (
              <div className="space-y-6">
                <div className="p-6 bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl border border-emerald-500/40 shadow-xl relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/20">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-300 bg-white/10 px-2.5 py-1 rounded-full">
                        Official Pass Ticket · Verified Non-Member
                      </span>
                      <h4 className="text-xl font-black tracking-tight text-white mt-2">
                        {selectedPass.title}
                      </h4>
                      <p className="text-xs text-emerald-100/80">
                        EduSmart CBC Virtual Science & Scratch Computer Lab
                      </p>
                    </div>

                    <div className="bg-white p-3 rounded-2xl text-slate-950 text-center shadow-lg shrink-0 flex flex-col items-center">
                      <QrCode className="w-16 h-16 text-slate-900" />
                      <span className="text-[9px] font-mono font-bold mt-1 text-slate-600">SCAN TO VERIFY</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 text-xs">
                    <div>
                      <span className="text-[10px] text-emerald-300 uppercase tracking-wider block">Ticket Number:</span>
                      <strong className="font-mono text-sm text-white">{ticketNumber}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-300 uppercase tracking-wider block">Pass Holder:</span>
                      <strong className="text-sm text-white">{fullName}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-300 uppercase tracking-wider block">Validity Period:</span>
                      <strong className="text-white">{selectedPass.duration}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-300 uppercase tracking-wider block">Status:</span>
                      <span className="inline-flex items-center gap-1 text-emerald-300 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Active Pass</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Next actions */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                  <div className="text-xs text-slate-500">
                    Your pass has been activated. You have full non-member access to all 75 science apparatus and Scratch coding simulations.
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print Ticket</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setStep('launch_lab')}
                      className="flex-1 sm:flex-initial px-6 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all animate-pulse"
                    >
                      <FlaskConical className="w-4 h-4" />
                      <span>Launch Virtual Lab Now</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};
