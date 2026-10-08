import React, { useState } from 'react';
import { 
  SchoolCalendarEvent, 
  EventTicketPurchase, 
  User 
} from '../../types';
import { Storage } from '../../utils/storage';
import { 
  X, 
  Ticket, 
  CheckCircle2, 
  Calendar, 
  MapPin, 
  Clock, 
  Sparkles, 
  Download, 
  Printer, 
  CreditCard, 
  QrCode,
  Tag,
  Users,
  Info
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
  const isCoCurricular = event.category === 'co_curricular';
  const isPaid = event.ticketType === 'paid' && (event.ticketPrice || 0) > 0;

  // Form states for in-app pass / registration
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

  // Handle In-App Booking or Free RSVP
  const handleQuickBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCoCurricular || !attendeeName.trim()) return;

    setIsSubmitting(true);

    try {
      const newTicket = Storage.bookEventTicket({
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.startDate,
        eventVenue: event.venue || 'EduSmart Sports Pavilion & Grounds',
        purchaserName: attendeeName.trim(),
        purchaserEmail: attendeeEmail.trim() || undefined,
        purchaserPhone: attendeePhone.trim() || undefined,
        purchaserRole: currentUser?.role || 'Guest / Attendee',
        quantity,
        ticketType: event.ticketType || 'free',
        unitPrice,
        totalAmount,
        currency: event.ticketCurrency || 'KES',
        paymentStatus: isPaid ? (mpesaRef ? 'completed' : 'pending') : 'free_granted',
        paymentMethod: isPaid 
          ? (mpesaRef ? 'M-Pesa Express' : 'School Cash Desk') 
          : 'Free Pass Voucher',
        mpesaReference: mpesaRef.trim().toUpperCase() || undefined,
        notes: notes.trim() || (isPaid ? 'Official Co-Curricular Admission Pass' : 'Free Co-Curricular Admission Pass')
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
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header Banner */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-start justify-between relative shrink-0">
          <div className="space-y-1.5 pr-8">
            <div className="flex items-center gap-2 flex-wrap">
              {isCoCurricular ? (
                <>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide flex items-center gap-1 shadow-xs bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                    <Ticket className="w-3.5 h-3.5" />
                    <span>CO-CURRICULAR EVENT PASS</span>
                  </span>

                  {isPaid ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wide bg-amber-500 text-slate-950 shadow-xs">
                      💳 PAID PASS: {event.ticketCurrency || 'KES'} {(event.ticketPrice || 0).toLocaleString()}
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wide bg-emerald-500 text-slate-950 shadow-xs">
                      🎟️ FREE ADMISSION PASS
                    </span>
                  )}
                </>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide flex items-center gap-1 shadow-xs bg-slate-800 text-slate-200 border border-slate-700">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  <span>OPEN ACADEMIC SCHEDULE</span>
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
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Non-CoCurricular Guard */}
        {!isCoCurricular ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto">
              <Info className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Academic / Calendar Schedule</h4>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              Event ticketing is exclusively configured for <strong>Co-Curricular & Sports/Talent</strong> activities. 
              Academic dates, exams, and term sessions are open schedules for learners and do not require ticketing passes.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
              >
                Close Window
              </button>
            </div>
          </div>
        ) : (
          /* Body Content */
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">
            
            {/* TICKET SUCCESS PASS VIEW */}
            {generatedTicket ? (
              <div className="max-w-xl mx-auto space-y-6 animate-in zoom-in-95 duration-200">
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
                  <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-md">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h4 className="text-base font-extrabold text-emerald-950">
                    Event Pass Issued Successfully!
                  </h4>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Your digital gate pass is ready. Present this pass or barcode verification at the entrance.
                  </p>
                </div>

                {/* Printable Ticket Pass Card */}
                <div className="bg-white rounded-2xl border-2 border-dashed border-indigo-300 p-6 shadow-lg relative overflow-hidden space-y-4 print:border-solid print:m-0">
                  <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600">EDUSMART OFFICIAL ADMISSION PASS</span>
                      <h3 className="font-extrabold text-slate-900 text-base">{generatedTicket.eventTitle}</h3>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{generatedTicket.eventDate} · {generatedTicket.eventVenue}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-mono text-slate-400 block">PASS NUMBER</span>
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
                      <span className="text-slate-400 block text-[10px] font-bold uppercase">Pass Category</span>
                      <span className={`font-bold ${generatedTicket.ticketType === 'paid' ? 'text-amber-700' : 'text-emerald-700'}`}>
                        {generatedTicket.ticketType === 'paid' ? 'Paid Pass' : 'Complimentary'}
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
                      <span className="text-slate-500 font-medium">M-Pesa Reference:</span>
                      <span className="font-mono font-bold text-slate-900">{generatedTicket.mpesaReference}</span>
                    </div>
                  )}

                  {/* QR & Security Seal */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded-xl border border-slate-200">
                        <QrCode className="w-10 h-10 text-slate-800" />
                      </div>
                      <div className="text-[10px] text-slate-500 leading-tight">
                        <div className="font-bold text-slate-700">Digital Gate Verification</div>
                        <div>Scan at Sports Pavilion / Auditorium Turnstile</div>
                        <div className="text-indigo-600 font-mono">{generatedTicket.purchasedAt}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        VERIFIED VALID
                      </span>
                    </div>
                  </div>
                </div>

                {/* Print & Action Buttons */}
                <div className="flex items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-slate-500" />
                    <span>Print Gate Pass</span>
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* IN-APP TICKET REGISTRATION FORM */
              <div className="max-w-xl mx-auto space-y-5">
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <h4 className="font-extrabold text-slate-900 text-sm">
                      {isPaid ? 'Co-Curricular Event Pass Order' : 'Complimentary Co-Curricular Pass RSVP'}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {isPaid 
                        ? 'Confirm ticket quantities and enter payment details to issue your verified digital admission pass.' 
                        : 'Register attendee names to secure free admission passes for this co-curricular event.'}
                    </p>
                  </div>

                  {/* Event Highlights & Perks */}
                  {event.ticketPerks && event.ticketPerks.length > 0 && (
                    <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-900 block">
                        Pass Perks & Inclusions:
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
                        <label className="block text-slate-600 font-bold mb-1">Passes (Qty)</label>
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
                        <label className="block text-slate-700 font-bold mb-1">Attendee / Parent Name *</label>
                        <input
                          type="text"
                          required
                          value={attendeeName}
                          onChange={(e) => setAttendeeName(e.target.value)}
                          placeholder="e.g. Grace Otieno (Parent)"
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-bold mb-1">Mobile Phone (M-Pesa SMS Pass) *</label>
                        <input
                          type="text"
                          required
                          value={attendeePhone}
                          onChange={(e) => setAttendeePhone(e.target.value)}
                          placeholder="e.g. +254 722 123 456"
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
                        placeholder="e.g. parent.otieno@edusmart.ac.ke"
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
                          Complete M-Pesa payment to EduSmart Paybill and enter the transaction reference to generate your digital gate pass.
                        </p>
                      </div>
                    )}

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Special Dietary / Seating Requests (Optional)</label>
                      <input
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="e.g. Reserved pavilion seating, student athlete cheering section"
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                      />
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-md flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
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
        )}

      </div>
    </div>
  );
};
