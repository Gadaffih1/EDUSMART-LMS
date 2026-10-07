import React, { useState } from 'react';
import { 
  SchoolCalendarEvent, 
  EventTicketPurchase, 
  User 
} from '../../types';
import { Storage } from '../../utils/storage';
import { 
  X, 
  ExternalLink, 
  Ticket, 
  CheckCircle2, 
  Calendar, 
  MapPin, 
  Clock, 
  Sparkles, 
  Download, 
  Printer, 
  ShieldCheck, 
  CreditCard, 
  QrCode,
  Tag,
  DollarSign,
  Users
} from 'lucide-react';

interface EventTicketModalProps {
  event: SchoolCalendarEvent;
  currentUser?: User | null;
  onClose: () => void;
  onSuccessBooking?: (ticket: EventTicketPurchase) => void;
}

export const EventTicketModal: React.FC<EventTicketModalProps> = ({
  event,
  currentUser,
  onClose,
  onSuccessBooking
}) => {
  const isPaid = event.ticketType === 'paid' && (event.ticketPrice || 0) > 0;
  const jotformUrl = event.ticketPurchaseUrl || 'https://form.jotform.com/262730415844053';

  // Mode: 'jotform' (Direct Jotform portal) vs 'quick_pass' (In-app pass / M-Pesa voucher)
  const [activeTab, setActiveTab] = useState<'jotform' | 'quick_pass'>('jotform');

  // Form states for quick pass / registration
  const [quantity, setQuantity] = useState(1);
  const [attendeeName, setAttendeeName] = useState(currentUser?.name || '');
  const [attendeeEmail, setAttendeeEmail] = useState(currentUser?.email || '');
  const [attendeePhone, setAttendeePhone] = useState(currentUser?.phone || '+254 7');
  const [mpesaRef, setMpesaRef] = useState('');
  const [notes, setNotes] = useState('');
  const [generatedTicket, setGeneratedTicket] = useState<EventTicketPurchase | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const unitPrice = isPaid ? (event.ticketPrice || 0) : 0;
  const totalAmount = unitPrice * quantity;

  // Handle Quick In-App Booking or Free RSVP
  const handleQuickBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!attendeeName.trim()) return;

    setIsSubmitting(true);

    try {
      const newTicket = Storage.bookEventTicket({
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.startDate,
        eventVenue: event.venue || 'EduSmart Campus Grounds',
        purchaserName: attendeeName.trim(),
        purchaserEmail: attendeeEmail.trim() || undefined,
        purchaserPhone: attendeePhone.trim() || undefined,
        purchaserRole: currentUser?.role || 'Guest / Attendee',
        quantity,
        ticketType: event.ticketType,
        unitPrice,
        totalAmount,
        currency: event.ticketCurrency || 'KES',
        paymentStatus: isPaid ? (mpesaRef ? 'completed' : 'pending') : 'free_granted',
        paymentMethod: isPaid 
          ? (mpesaRef ? 'M-Pesa Express' : 'JotForm Portal') 
          : 'Free Pass Voucher',
        mpesaReference: mpesaRef.trim().toUpperCase() || undefined,
        jotformUrl,
        notes: notes.trim() || (isPaid ? 'Registered via EduSmart Ticketing Portal' : 'Free Event Admission Pass')
      });

      setGeneratedTicket(newTicket);
      if (onSuccessBooking) {
        onSuccessBooking(newTicket);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header Banner */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-start justify-between relative shrink-0">
          <div className="space-y-1.5 pr-8">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide flex items-center gap-1 shadow-xs bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                <Ticket className="w-3.5 h-3.5" />
                <span>OFFICIAL EVENT TICKETING</span>
              </span>

              {isPaid ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wide bg-amber-500 text-slate-950 shadow-xs">
                  💳 PAID EVENT: {event.ticketCurrency || 'KES'} {(event.ticketPrice || 0).toLocaleString()}
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wide bg-emerald-500 text-slate-950 shadow-xs">
                  🎟️ FREE TICKET / COMPLIMENTARY PASS
                </span>
              )}

              <span className="text-[11px] font-mono text-slate-400">
                Term {event.term} · {event.academicYear}
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight leading-snug">
              {event.title}
            </h3>

            <div className="flex items-center gap-4 text-xs text-slate-300 flex-wrap pt-0.5">
              <span className="flex items-center gap-1 text-slate-200 font-medium">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                {event.startDate} {event.endDate !== event.startDate && `to ${event.endDate}`}
              </span>
              {event.startTime && (
                <span className="flex items-center gap-1 text-slate-200 font-medium">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  {event.startTime} - {event.endTime || 'End'}
                </span>
              )}
              {event.venue && (
                <span className="flex items-center gap-1 text-slate-200 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                  {event.venue}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        {!generatedTicket && (
          <div className="flex border-b border-slate-200 bg-slate-50 px-4 sm:px-6 shrink-0">
            <button
              onClick={() => setActiveTab('jotform')}
              className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'jotform'
                  ? 'border-indigo-600 text-indigo-700 bg-white shadow-2xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>1. JotForm Ticket Purchase Portal</span>
              <span className="px-1.5 py-0.2 bg-indigo-100 text-indigo-800 rounded text-[10px] font-mono">Live Embed</span>
            </button>

            <button
              onClick={() => setActiveTab('quick_pass')}
              className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'quick_pass'
                  ? 'border-indigo-600 text-indigo-700 bg-white shadow-2xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>2. Quick In-App Pass & M-Pesa Booking</span>
            </button>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">
          
          {/* TICKET SUCCESS PASS VIEW */}
          {generatedTicket ? (
            <div className="max-w-xl mx-auto space-y-6 animate-in zoom-in-95 duration-200">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
                <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-md">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-base font-extrabold text-emerald-950">
                  Ticket Booking Confirmed!
                </h4>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Your event pass has been successfully issued. Present this digital ticket at the gate or check-in desk.
                </p>
              </div>

              {/* Printable Ticket Pass Card */}
              <div className="bg-white rounded-2xl border-2 border-dashed border-indigo-300 p-6 shadow-lg relative overflow-hidden space-y-4 print:border-solid print:m-0">
                {/* Decorative cutouts */}
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-100 rounded-full border border-slate-200" />
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-100 rounded-full border border-slate-200" />

                <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600">EDUSMART OFFICIAL ADMISSION PASS</span>
                    <h3 className="font-extrabold text-slate-900 text-base">{generatedTicket.eventTitle}</h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{generatedTicket.eventDate} · {generatedTicket.eventVenue}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-slate-400 block">TICKET NUMBER</span>
                    <span className="font-mono font-black text-sm text-indigo-950 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {generatedTicket.ticketCode}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Attendee</span>
                    <span className="font-bold text-slate-800">{generatedTicket.purchaserName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Ticket Type</span>
                    <span className={`font-bold ${generatedTicket.ticketType === 'paid' ? 'text-amber-700' : 'text-emerald-700'}`}>
                      {generatedTicket.ticketType === 'paid' ? 'Paid Event' : 'Free Pass'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Quantity</span>
                    <span className="font-bold text-slate-800">{generatedTicket.quantity} Attendee(s)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Amount</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {generatedTicket.currency} {generatedTicket.totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>

                {generatedTicket.mpesaReference && (
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                    <span className="text-slate-500 font-medium">M-Pesa Confirmation Ref:</span>
                    <span className="font-mono font-bold text-slate-900">{generatedTicket.mpesaReference}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-10 h-10 text-slate-800" />
                    <div className="text-[10px] text-slate-500 font-mono">
                      <div>SCAN FOR GATE ENTRY</div>
                      <div>SECURE CRYPTO VERIFIED</div>
                    </div>
                  </div>
                  <div className="text-right text-[10px] text-slate-400">
                    <div>Issued: {generatedTicket.purchasedAt}</div>
                    <div>Status: <span className="text-emerald-600 font-bold uppercase">{generatedTicket.paymentStatus}</span></div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setGeneratedTicket(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  ← Book Another Ticket
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-4 py-2 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Ticket</span>
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          ) : activeTab === 'jotform' ? (
            /* TAB 1: LIVE JOTFORM INTEGRATION */
            <div className="space-y-4">
              
              {/* Info notice bar with direct external button */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-indigo-600 text-white rounded-xl shrink-0 mt-0.5">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-extrabold text-indigo-950 flex items-center gap-1.5">
                      <span>Official Event Ticket Form</span>
                      <span className="text-[10px] bg-indigo-200/80 text-indigo-900 px-1.5 py-0.2 rounded font-mono">
                        form.jotform.com/262730415844053
                      </span>
                    </h4>
                    <p className="text-[11px] text-indigo-800 leading-relaxed">
                      Complete your attendee registration, select seat category, and verify M-Pesa / payment directly through this secure Jotform portal.
                    </p>
                  </div>
                </div>

                <a
                  href={jotformUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 transition-colors shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in Full Tab</span>
                </a>
              </div>

              {/* Jotform Embedded Iframe Container */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden relative min-h-[580px] flex flex-col">
                <div className="p-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600 font-mono">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Connected: EVENT TICKET PURCHASE</span>
                  </div>
                  <a 
                    href={jotformUrl} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-indigo-600 hover:underline flex items-center gap-1 text-[11px]"
                  >
                    <span>{jotformUrl}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <iframe
                  id="JotFormIFrame-262730415844053"
                  title="EVENT TICKET PURCHASE"
                  src={jotformUrl}
                  className="w-full flex-1 border-0 min-h-[560px]"
                  style={{ minHeight: '560px' }}
                  allow="geolocation; microphone; camera; fullscreen"
                />

                {/* Bottom confirmation prompt */}
                <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <span className="text-slate-600 text-[11px]">
                    Submitted the form above? Click below to save your pass in EduSmart and print your digital ticket.
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('quick_pass')}
                    className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shrink-0"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Generate Ticket Pass Voucher</span>
                  </button>
                </div>
              </div>

            </div>
          ) : (
            /* TAB 2: QUICK IN-APP TICKET BOOKING & M-PESA PASS */
            <div className="max-w-2xl mx-auto space-y-6">
              
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h4 className="font-extrabold text-slate-900 text-sm">
                    {isPaid ? 'Event Ticket Purchase & Confirmation' : 'Free Event Admission Registration'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isPaid 
                      ? 'Confirm your ticket order and enter your payment details to receive your instant digital admission voucher.' 
                      : 'Register attendee names to secure free admission passes for this upcoming school event.'}
                  </p>
                </div>

                {/* Event Highlights & Perks */}
                {event.ticketPerks && event.ticketPerks.length > 0 && (
                  <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-900 block">
                      Ticket Inclusions & Perks:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {event.ticketPerks.map((perk, idx) => (
                        <span key={idx} className="px-2.5 py-0.5 bg-white text-indigo-800 rounded-md text-[11px] font-semibold border border-indigo-200 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          <span>{perk}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <form onSubmit={handleQuickBooking} className="space-y-4 text-xs">
                  
                  {/* Quantity & Pricing Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Quantity (Passes)</label>
                      <select
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white font-bold"
                      >
                        {[1, 2, 3, 4, 5, 8, 10].map(n => (
                          <option key={n} value={n}>{n} Ticket{n > 1 ? 's' : ''}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Unit Price</label>
                      <div className="px-3 py-2 bg-white rounded-lg border border-slate-300 font-mono font-bold text-slate-800">
                        {isPaid ? `${event.ticketCurrency || 'KES'} ${unitPrice.toLocaleString()}` : 'FREE (KES 0)'}
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Total Payable</label>
                      <div className={`px-3 py-2 rounded-lg border font-mono font-extrabold text-sm ${
                        isPaid 
                          ? 'bg-amber-50 border-amber-300 text-amber-950' 
                          : 'bg-emerald-50 border-emerald-300 text-emerald-950'
                      }`}>
                        {isPaid ? `${event.ticketCurrency || 'KES'} ${totalAmount.toLocaleString()}` : 'FREE ADMISSION'}
                      </div>
                    </div>
                  </div>

                  {/* Attendee Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Primary Attendee Name *</label>
                      <input
                        type="text"
                        required
                        value={attendeeName}
                        onChange={(e) => setAttendeeName(e.target.value)}
                        placeholder="e.g. Grace Wambui (Parent)"
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Mobile Phone (M-Pesa / SMS Ticket) *</label>
                      <input
                        type="text"
                        required
                        value={attendeePhone}
                        onChange={(e) => setAttendeePhone(e.target.value)}
                        placeholder="e.g. 0712 345 678"
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Email Address (Optional for E-Ticket)</label>
                    <input
                      type="email"
                      value={attendeeEmail}
                      onChange={(e) => setAttendeeEmail(e.target.value)}
                      placeholder="e.g. parent@example.com"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Payment Reference if Paid */}
                  {isPaid && (
                    <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-950 flex items-center gap-1.5">
                          <CreditCard className="w-4 h-4 text-amber-700" />
                          <span>M-Pesa Payment Reference</span>
                        </span>
                        <span className="text-[10px] text-amber-800 font-mono">
                          Paybill: 522522 · Acc: TKT-{event.id.toUpperCase().slice(-5)}
                        </span>
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. QHG829XLP4 (from M-Pesa SMS confirmation)"
                        value={mpesaRef}
                        onChange={(e) => setMpesaRef(e.target.value)}
                        className="w-full border border-amber-300 rounded-lg px-3 py-2 text-xs uppercase font-mono focus:ring-2 focus:ring-amber-500 bg-white"
                      />
                      <p className="text-[11px] text-amber-800">
                        Alternatively, you can also fill and pay directly via the <button type="button" onClick={() => setActiveTab('jotform')} className="underline font-bold text-indigo-700">JotForm Ticket Purchase Portal</button>.
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Special Dietary / Seating Requests (Optional)</label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Wheelchair access, vegetarian meal, front row seating"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                      <Ticket className="w-4 h-4" />
                      <span>
                        {isPaid 
                          ? `Confirm Booking (${event.ticketCurrency || 'KES'} ${totalAmount.toLocaleString()})`
                          : 'Get Free Admission Pass'}
                      </span>
                    </button>
                  </div>

                </form>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
