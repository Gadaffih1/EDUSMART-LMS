import React, { useState, useEffect } from 'react';
import { ClientDataStore } from '../../utils/clientDataStore';
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
  AlertCircle,
  Copy,
  RefreshCw
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
  const [mpesaReference, setMpesaReference] = useState('');
  const [schoolName, setSchoolName] = useState('Public STEM Learner / Homeschool');
  const [gradeLevel, setGradeLevel] = useState('Grade 7 (JSS)');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedField, setCopiedField] = useState<'paybill' | 'account' | null>(null);
  
  // Generated Ticket Info & Server Verification State
  const [ticketNumber, setTicketNumber] = useState(
    initialTicketCode && !initialTicketCode.toUpperCase().includes('DEMO') ? initialTicketCode : ''
  );
  const [verifiedPass, setVerifiedPass] = useState<any | null>(null);
  const [pendingPass, setPendingPass] = useState<any | null>(null);
  const [ticketDate, setTicketDate] = useState('');
  const [existingTicketInput, setExistingTicketInput] = useState(initialTicketCode || '');
  const [ticketValidationNotice, setTicketValidationNotice] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (initialTier) setSelectedTier(initialTier);
    setCheckoutError(null);

    if (initialStep === 'launch_lab') {
      const serverSessionPass = ClientDataStore.getActiveVlabPass();
      const targetCode = (initialTicketCode || serverSessionPass?.ticketId || '').trim().toUpperCase();

      if (!targetCode || targetCode.includes('DEMO')) {
        setVerifiedPass(null);
        setStep('select');
        setActiveTab('buy');
        setTicketValidationNotice('Free access is disabled. Public access to the virtual lab workspace strictly requires an active paid subscription pass.');
        return;
      }

      if (
        serverSessionPass &&
        String(serverSessionPass.ticketId || '').toUpperCase() === targetCode &&
        serverSessionPass.status === 'active' &&
        serverSessionPass.subscriptionVerified !== false
      ) {
        setVerifiedPass(serverSessionPass);
        setTicketNumber(serverSessionPass.ticketId);
        if (serverSessionPass.holderName) setFullName(serverSessionPass.holderName);
        setStep('launch_lab');
        setTicketValidationNotice(null);
        return;
      }

      void fetch(`/api/vlab/tickets/${encodeURIComponent(targetCode)}`, { credentials: 'include' })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (
            data?.valid &&
            data?.pass &&
            data.pass.status === 'active' &&
            data.pass.subscriptionVerified !== false &&
            !String(data.pass.ticketId || '').toUpperCase().includes('DEMO')
          ) {
            setVerifiedPass(data.pass);
            ClientDataStore.setActiveVlabPass(data.pass);
            setTicketNumber(data.pass.ticketId);
            if (data.pass.holderName) setFullName(data.pass.holderName);
            setStep('launch_lab');
            setTicketValidationNotice(null);
          } else {
            setVerifiedPass(null);
            setStep('select');
            setActiveTab('buy');
            setTicketValidationNotice('Free access is disabled. Public access to the virtual lab workspace strictly requires an active paid subscription pass.');
          }
        })
        .catch(() => {
          setVerifiedPass(null);
          setStep('select');
          setActiveTab('buy');
          setTicketValidationNotice('Could not verify active paid subscription pass with server.');
        });
    } else if (initialStep) {
      setStep(initialStep);
      if (initialStep === 'enter_ticket') {
        setActiveTab('redeem');
        setPendingPass(null);
      } else {
        setActiveTab('buy');
        if (initialStep !== 'ticket') {
          setPendingPass(null);
        }
      }
    }

    if (initialTicketCode && !initialTicketCode.toUpperCase().includes('DEMO')) {
      setTicketNumber(initialTicketCode);
      setExistingTicketInput(initialTicketCode);
    }
  }, [initialTier, initialStep, initialTicketCode, isOpen]);

  const checkPendingApprovalStatus = async (codeToCheck?: string) => {
    const code = (codeToCheck || ticketNumber || pendingPass?.ticketId || '').trim().toUpperCase();
    if (!code) return;
    setIsCheckingStatus(true);
    try {
      const res = await fetch(`/api/vlab/tickets/${encodeURIComponent(code)}`, { credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (
        res.ok &&
        data?.valid &&
        data?.pass &&
        data.pass.status === 'active' &&
        data.pass.subscriptionVerified !== false
      ) {
        setVerifiedPass(data.pass);
        setPendingPass(null);
        ClientDataStore.setActiveVlabPass(data.pass);
        setTicketNumber(data.pass.ticketId);
        if (onSubscriptionSuccess) {
          onSubscriptionSuccess(data.pass.ticketId);
        }
      } else if (data?.pass) {
        setPendingPass(data.pass);
      }
    } catch {
      // ignore transient network check
    } finally {
      setIsCheckingStatus(false);
    }
  };

  useEffect(() => {
    if (
      !isOpen ||
      step !== 'ticket' ||
      verifiedPass?.status === 'active' ||
      !pendingPass?.ticketId ||
      pendingPass?.status === 'rejected'
    ) {
      return;
    }
    const timer = setInterval(() => {
      void checkPendingApprovalStatus(pendingPass.ticketId);
    }, 5000);
    return () => clearInterval(timer);
  }, [isOpen, step, verifiedPass?.status, pendingPass?.ticketId, pendingPass?.status]);

  if (!isOpen) return null;

  const selectedPass = PASS_OPTIONS.find(p => p.id === selectedTier) || PASS_OPTIONS[1];

  const handleProceedToCheckout = () => {
    setStep('checkout');
  };

  const handleCopyDetail = (field: 'paybill' | 'account', value: string) => {
    try {
      void navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleCompleteSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !phone || !mpesaReference.trim()) {
      setCheckoutError('Please enter subscriber name, email, phone number, and your M-Pesa confirmation code after paying via Paybill 400200 Account 1164798.');
      return;
    }

    setIsProcessing(true);
    setCheckoutError(null);
    const nowStr = new Date().toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
    const newPass = {
      tier: selectedTier,
      priceKes: selectedPass.priceKes,
      holderName: fullName,
      email,
      phone,
      mpesaReference: mpesaReference.trim().toUpperCase(),
      schoolName,
      gradeLevel,
      issuedAt: nowStr,
    };

    try {
      const res = await fetch('/api/vlab/tickets', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pass: newPass }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success || !data?.pass) {
        setCheckoutError(data?.error || 'Could not submit payment details. Please verify your M-Pesa code and try again.');
        setIsProcessing(false);
        return;
      }

      const submittedPass = data.pass;
      if (submittedPass.status === 'active' && submittedPass.subscriptionVerified === true) {
        setVerifiedPass(submittedPass);
        setPendingPass(null);
        ClientDataStore.setActiveVlabPass(submittedPass);
        if (onSubscriptionSuccess) {
          onSubscriptionSuccess(submittedPass.ticketId);
        }
      } else {
        setVerifiedPass(null);
        setPendingPass(submittedPass);
      }

      const existing = ClientDataStore.getCollection<any[]>('edusmart_vlab_ticket_passes', []);
      ClientDataStore.setCollection('edusmart_vlab_ticket_passes', [submittedPass, ...existing], { persist: false });

      setTicketNumber(submittedPass.ticketId);
      setTicketDate(submittedPass.issuedAt || nowStr);
      setIsProcessing(false);
      setStep('ticket');
    } catch {
      setCheckoutError('Network error communicating with ticketing server. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleValidateTicket = async (codeToTest?: string) => {
    const raw = (codeToTest || existingTicketInput).trim().toUpperCase();
    if (!raw) {
      setTicketValidationNotice('Please enter your paid subscription pass or ticket ID (e.g. VLAB-TICKET-XXXXXX).');
      return;
    }

    if (raw.includes('DEMO')) {
      setTicketValidationNotice('Free demo access has been disabled. Public access to the laboratory workspace strictly requires an active paid subscription pass. Please select a pass below to subscribe.');
      return;
    }

    try {
      const res = await fetch(`/api/vlab/tickets/${encodeURIComponent(raw)}`, { credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (
        res.ok &&
        data?.valid &&
        data?.pass &&
        data.pass.status === 'active' &&
        data.pass.subscriptionVerified !== false &&
        !String(data.pass.ticketId || '').toUpperCase().includes('DEMO')
      ) {
        const found = data.pass;
        const activeCode = found.ticketId;
        setVerifiedPass(found);
        setPendingPass(null);
        ClientDataStore.setActiveVlabPass(found);
        setTicketNumber(activeCode);
        if (found.holderName) setFullName(found.holderName);
        setTicketDate(found.issuedAt || new Date().toLocaleString());
        if (onSubscriptionSuccess) {
          onSubscriptionSuccess(activeCode);
        }
        setStep('launch_lab');
        setTicketValidationNotice(null);
      } else if (data?.status === 'pending_approval' && data?.pass) {
        setVerifiedPass(null);
        setPendingPass(data.pass);
        setTicketNumber(data.pass.ticketId);
        if (data.pass.holderName) setFullName(data.pass.holderName);
        setActiveTab('buy');
        setStep('ticket');
        setTicketValidationNotice(null);
      } else {
        setVerifiedPass(null);
        setTicketValidationNotice(
          data?.error || `No active paid subscription found for "${raw}". Public access to the virtual lab workspace is strictly restricted to paid subscribers approved by Super Admin.`
        );
      }
    } catch {
      setVerifiedPass(null);
      setTicketValidationNotice('Could not verify pass with the server right now. Please try again.');
    }
  };

  const hasVerifiedActiveWorkspacePass = Boolean(
    step === 'launch_lab' &&
      verifiedPass &&
      verifiedPass.status === 'active' &&
      verifiedPass.subscriptionVerified !== false &&
      ticketNumber &&
      !ticketNumber.toUpperCase().includes('DEMO')
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      {hasVerifiedActiveWorkspacePass ? (
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
                      placeholder="e.g. VLAB-TICKET-XXXXXX"
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
                      className="w-full py-3 bg-blue-700 hover:bg-blue-800 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verify Paid Pass & Launch Workspace</span>
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

                {/* Official Paybill & Account Instructions */}
                <div className="p-4 sm:p-5 bg-slate-900 text-white rounded-2xl border border-emerald-500/40 shadow-md space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4" />
                      <span>M-Pesa Paybill Payment Details</span>
                    </span>
                    <span className="text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full">
                      Super Admin Approval Required
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-slate-950/90 border border-slate-700 rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Paybill</span>
                        <strong className="text-lg font-mono font-black text-emerald-400">400200</strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyDetail('paybill', '400200')}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                        title="Copy Paybill 400200"
                      >
                        {copiedField === 'paybill' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="bg-slate-950/90 border border-slate-700 rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Account</span>
                        <strong className="text-lg font-mono font-black text-amber-300">1164798</strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyDetail('account', '1164798')}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                        title="Copy Account 1164798"
                      >
                        {copiedField === 'account' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="bg-slate-950/90 border border-slate-700 rounded-xl p-3">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Amount to Pay</span>
                      <strong className="text-lg font-mono font-black text-white">KES {selectedPass.priceKes.toLocaleString()}</strong>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Go to <strong>M-Pesa → Lipa na M-Pesa → Paybill</strong>, enter Business No. <strong className="font-mono text-emerald-300">400200</strong> and Account No. <strong className="font-mono text-amber-300">1164798</strong>. Once cash is paid, submit your M-Pesa confirmation code below and wait for Super Admin approval in order to proceed.
                  </p>
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
                      <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                      <span>M-Pesa Transaction / Receipt Code *</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. UA12XYZ345"
                      value={mpesaReference}
                      onChange={(e) => setMpesaReference(e.target.value.toUpperCase())}
                      className="w-full px-3.5 py-2.5 border border-emerald-400 bg-emerald-50/40 rounded-xl text-xs font-mono font-black uppercase focus:ring-2 focus:ring-emerald-500 outline-none"
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
                </div>

                {checkoutError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{checkoutError}</span>
                  </div>
                )}

                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">
                      Paybill 400200 · Account 1164798
                    </span>
                    <div className="text-xl font-black text-emerald-950">
                      KES {selectedPass.priceKes.toLocaleString()}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <span>Submitting Payment Verification...</span>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        <span>Confirm Payment &amp; Await Super Admin Approval</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: PENDING APPROVAL OR APPROVED TICKETING PASS */}
            {activeTab === 'buy' && step === 'ticket' && (
              <div className="space-y-6">
                {verifiedPass?.status === 'active' && verifiedPass?.subscriptionVerified === true ? (
                  <>
                    <div className="p-6 bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl border border-emerald-500/40 shadow-xl relative overflow-hidden">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/20">
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-300 bg-white/10 px-2.5 py-1 rounded-full">
                            Official Pass Ticket · Approved by Super Admin
                          </span>
                          <h4 className="text-xl font-black tracking-tight text-white mt-2">
                            {selectedPass.title}
                          </h4>
                          <p className="text-xs text-emerald-100/80">
                            EduSmart CBC Virtual Science &amp; Scratch Computer Lab
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

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                      <div className="text-xs text-slate-500">
                        Approved! You have full non-member access to all 75 science apparatus and Scratch coding simulations.
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
                          className="flex-1 sm:flex-initial px-6 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
                        >
                          <FlaskConical className="w-4 h-4" />
                          <span>Launch Virtual Lab Now</span>
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-6 bg-gradient-to-br from-slate-900 via-amber-950/60 to-slate-900 text-white rounded-3xl border border-amber-400/40 shadow-xl space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/15">
                        <div>
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-amber-300 bg-amber-400/15 border border-amber-400/30 px-2.5 py-1 rounded-full">
                            <Clock className="w-3 h-3 animate-pulse" />
                            <span>{pendingPass?.status === 'rejected' ? 'Payment Declined' : 'Waiting for Super Admin Approval'}</span>
                          </span>
                          <h4 className="text-xl font-black tracking-tight text-white mt-2">
                            {pendingPass?.status === 'rejected'
                              ? 'Payment Verification Declined'
                              : 'Payment Submitted — Awaiting Super Admin Approval'}
                          </h4>
                          <p className="text-xs text-slate-300 mt-1">
                            {pendingPass?.status === 'rejected'
                              ? pendingPass.rejectionReason || 'Super Admin could not verify payment under Paybill 400200 Account 1164798.'
                              : 'Once cash is paid to Paybill 400200 Account 1164798, your Virtual Lab access remains locked until Super Admin approves your transaction in order to proceed.'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                        <div>
                          <span className="text-[10px] text-amber-300 uppercase tracking-wider block">Request Ticket ID:</span>
                          <strong className="font-mono text-sm text-white">{ticketNumber}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-amber-300 uppercase tracking-wider block">Paybill / Account:</span>
                          <strong className="font-mono text-white">400200 · 1164798</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-amber-300 uppercase tracking-wider block">M-Pesa Code:</span>
                          <strong className="font-mono text-white">{pendingPass?.mpesaReference || mpesaReference}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-amber-300 uppercase tracking-wider block">Status:</span>
                          <span className="inline-flex items-center gap-1 text-amber-300 font-bold">
                            <Lock className="w-3.5 h-3.5" />
                            <span>{pendingPass?.status === 'rejected' ? 'Declined' : 'Pending Approval'}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                      <div className="text-xs text-slate-600">
                        Keep your ticket ID <strong className="font-mono">{ticketNumber}</strong>. This screen refreshes automatically every few seconds once Super Admin approves access.
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => void checkPendingApprovalStatus()}
                          disabled={isCheckingStatus}
                          className="flex-1 sm:flex-initial px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-60"
                        >
                          <RefreshCw className={`w-4 h-4 ${isCheckingStatus ? 'animate-spin' : ''}`} />
                          <span>{isCheckingStatus ? 'Checking Approval...' : 'Check Approval Status'}</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};
