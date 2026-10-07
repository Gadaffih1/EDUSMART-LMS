import React, { useState, useEffect, useMemo } from 'react';
import { 
  SchoolCalendarEvent, 
  EventTicketPurchase, 
  EventTicketType,
  User 
} from '../../types';
import { Storage } from '../../utils/storage';
import { EventTicketModal } from './EventTicketModal';
import { 
  Calendar, 
  CalendarDays,
  Ticket, 
  Plus, 
  Search, 
  Filter, 
  ExternalLink, 
  DollarSign, 
  CreditCard, 
  MapPin, 
  Clock, 
  Tag, 
  CheckCircle2, 
  Edit3, 
  Trash2, 
  Users, 
  Sparkles, 
  ShieldCheck, 
  Printer, 
  Download, 
  AlertCircle,
  X,
  Layers,
  ChevronRight,
  TrendingUp,
  Receipt
} from 'lucide-react';

interface SchoolEventsManagerProps {
  currentUser?: User | null;
  readOnly?: boolean;
  defaultCategoryFilter?: string;
}

export const SchoolEventsManager: React.FC<SchoolEventsManagerProps> = ({
  currentUser,
  readOnly = false,
  defaultCategoryFilter = 'all'
}) => {
  // Check authorization to post events: Admin staff, Dean, Deputies, Head Teacher
  const authorizedPostingRoles = [
    'school_admin_staff', 
    'dean_of_studies', 
    'deputy_head', 
    'head_teacher'
  ];

  const canPostEvents = !readOnly && currentUser && authorizedPostingRoles.includes(currentUser.role);

  // Friendly role badge
  const rolePostingTitle = useMemo(() => {
    if (!currentUser) return '';
    switch (currentUser.role) {
      case 'school_admin_staff':
        return 'School Administration Staff & Registrar';
      case 'dean_of_studies':
        return 'Dean of Studies (Academic Authority)';
      case 'deputy_head':
        return 'Deputy Head Teacher (Operations & Logistics)';
      case 'head_teacher':
        return 'Executive Head Teacher (Institutional Authority)';
      default:
        return currentUser.role;
    }
  }, [currentUser]);

  // Event and ticket state
  const [events, setEvents] = useState<SchoolCalendarEvent[]>(() => Storage.getCalendarEvents());
  const [tickets, setTickets] = useState<EventTicketPurchase[]>(() => Storage.getEventTicketPurchases());
  
  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTerm, setSelectedTerm] = useState<string>('all');
  const [selectedTicketType, setSelectedTicketType] = useState<string>('all'); // 'all' | 'free' | 'paid'
  const [selectedCategory, setSelectedCategory] = useState<string>(defaultCategoryFilter);
  const [mainView, setMainView] = useState<'events' | 'tickets'>('events');

  // Modals
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<SchoolCalendarEvent | null>(null);
  const [ticketingEvent, setTicketingEvent] = useState<SchoolCalendarEvent | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  // Form State for Posting / Editing Event
  const initialFormState = {
    title: '',
    description: '',
    category: 'academic' as SchoolCalendarEvent['category'],
    term: 1 as 1 | 2 | 3,
    academicYear: 2026,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '15:30',
    targetAudience: 'All School' as SchoolCalendarEvent['targetAudience'],
    venue: 'Main School Hall',
    isImportant: false,
    status: 'upcoming' as SchoolCalendarEvent['status'],
    ticketType: 'paid' as EventTicketType, // Every event assigned Free Ticket or Paid Event
    ticketPrice: 500,
    ticketCurrency: 'KES',
    ticketPurchaseUrl: 'https://form.jotform.com/262730415844053',
    totalCapacity: 400,
    ticketPerks: 'General Admission, Event Programme, Refreshment Voucher'
  };

  const [formState, setFormState] = useState(initialFormState);

  // Listen to Storage events
  useEffect(() => {
    const handleEventsUpdate = () => {
      setEvents(Storage.getCalendarEvents());
    };
    const handleTicketsUpdate = () => {
      setTickets(Storage.getEventTicketPurchases());
    };

    window.addEventListener('calendar-events-updated', handleEventsUpdate);
    window.addEventListener('event-tickets-updated', handleTicketsUpdate);

    return () => {
      window.removeEventListener('calendar-events-updated', handleEventsUpdate);
      window.removeEventListener('event-tickets-updated', handleTicketsUpdate);
    };
  }, []);

  const showNotification = (text: string, type: 'success' | 'info' = 'success') => {
    setNotificationMsg({ text, type });
    setTimeout(() => setNotificationMsg(null), 4500);
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingEvent(null);
    setFormState({
      ...initialFormState,
      ticketType: 'paid',
      ticketPrice: 500,
      ticketPurchaseUrl: 'https://form.jotform.com/262730415844053'
    });
    setShowEventModal(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (evt: SchoolCalendarEvent) => {
    setEditingEvent(evt);
    setFormState({
      title: evt.title,
      description: evt.description || '',
      category: evt.category,
      term: evt.term,
      academicYear: evt.academicYear,
      startDate: evt.startDate,
      endDate: evt.endDate,
      startTime: evt.startTime || '08:30',
      endTime: evt.endTime || '16:00',
      targetAudience: evt.targetAudience,
      venue: evt.venue || '',
      isImportant: evt.isImportant,
      status: evt.status,
      ticketType: evt.ticketType || 'free',
      ticketPrice: evt.ticketPrice || 0,
      ticketCurrency: evt.ticketCurrency || 'KES',
      ticketPurchaseUrl: evt.ticketPurchaseUrl || 'https://form.jotform.com/262730415844053',
      totalCapacity: evt.totalCapacity || 400,
      ticketPerks: (evt.ticketPerks || []).join(', ')
    });
    setShowEventModal(true);
  };

  // Save Event Handler
  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.title.trim() || !formState.startDate) return;

    const parsedPerks = formState.ticketPerks
      ? formState.ticketPerks.split(',').map(p => p.trim()).filter(Boolean)
      : [];

    const eventPayload = {
      title: formState.title.trim(),
      description: formState.description.trim(),
      category: formState.category,
      term: formState.term,
      academicYear: formState.academicYear,
      startDate: formState.startDate,
      endDate: formState.endDate || formState.startDate,
      startTime: formState.startTime,
      endTime: formState.endTime,
      targetAudience: formState.targetAudience,
      venue: formState.venue.trim(),
      isImportant: formState.isImportant,
      status: formState.status,
      ticketType: formState.ticketType,
      ticketPrice: formState.ticketType === 'paid' ? Number(formState.ticketPrice) : 0,
      ticketCurrency: formState.ticketCurrency,
      ticketPurchaseUrl: formState.ticketPurchaseUrl.trim() || 'https://form.jotform.com/262730415844053',
      totalCapacity: Number(formState.totalCapacity) || 0,
      ticketPerks: parsedPerks,
      authorRole: currentUser?.role || 'authorized_staff',
      authorName: currentUser?.name || 'School Authority',
      updatedBy: `${currentUser?.name || 'Administrator'} (${rolePostingTitle})`,
      updatedAt: new Date().toISOString().split('T')[0]
    };

    if (editingEvent) {
      Storage.updateCalendarEvent(editingEvent.id, eventPayload);
      showNotification(`Event "${eventPayload.title}" updated successfully.`);
    } else {
      Storage.addCalendarEvent({
        ...eventPayload,
        ticketsSold: 0
      });
      showNotification(`New ${formState.ticketType === 'paid' ? 'Paid' : 'Free'} event "${eventPayload.title}" posted to school calendar.`);
    }

    setShowEventModal(false);
    setEvents(Storage.getCalendarEvents());
  };

  // Delete Event Handler
  const handleDeleteEvent = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      Storage.deleteCalendarEvent(id);
      setEvents(Storage.getCalendarEvents());
      showNotification(`"${title}" was removed from the calendar.`, 'info');
    }
  };

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter(evt => {
      const matchSearch = 
        evt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        evt.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (evt.venue && evt.venue.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchTerm = selectedTerm === 'all' || evt.term.toString() === selectedTerm;
      const matchCategory = selectedCategory === 'all' || evt.category === selectedCategory;
      const matchTicket = selectedTicketType === 'all' || evt.ticketType === selectedTicketType;

      return matchSearch && matchTerm && matchCategory && matchTicket;
    });
  }, [events, searchQuery, selectedTerm, selectedCategory, selectedTicketType]);

  // Analytics Metrics
  const metrics = useMemo(() => {
    const total = events.length;
    const paidEvents = events.filter(e => e.ticketType === 'paid');
    const freeEvents = events.filter(e => e.ticketType === 'free');
    const totalTicketsSold = events.reduce((acc, curr) => acc + (curr.ticketsSold || 0), 0);
    const totalRevenue = tickets
      .filter(t => t.paymentStatus === 'completed')
      .reduce((acc, curr) => acc + curr.totalAmount, 0);

    return {
      total,
      paidCount: paidEvents.length,
      freeCount: freeEvents.length,
      totalTicketsSold,
      totalRevenue
    };
  }, [events, tickets]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Alert Banner / Notification */}
      {notificationMsg && (
        <div className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between border shadow-sm ${
          notificationMsg.type === 'success' 
            ? 'bg-emerald-50 text-emerald-900 border-emerald-300' 
            : 'bg-indigo-50 text-indigo-900 border-indigo-300'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{notificationMsg.text}</span>
          </div>
          <button onClick={() => setNotificationMsg(null)} className="text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center gap-1">
              <Ticket className="w-3 h-3 text-indigo-600" />
              <span>Event Ticketing & JotForm Integration</span>
            </span>

            {canPostEvents ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Authorized Rights: {rolePostingTitle}</span>
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                Attendee & Booking Portal
              </span>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            School Events & Ticket Booking Hub
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage, schedule, and purchase tickets for school galas, academic clinics, sports tournaments, and student exhibitions.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* View toggle */}
          <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => setMainView('events')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                mainView === 'events' ? 'bg-white text-indigo-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Events Directory ({filteredEvents.length})</span>
            </button>
            <button
              onClick={() => setMainView('tickets')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                mainView === 'tickets' ? 'bg-white text-indigo-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>My Ticket Passes ({tickets.length})</span>
            </button>
          </div>

          {/* Post New Event Button (Only authorized roles: admin staff, dean, deputies, head teacher) */}
          {canPostEvents && (
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Post New Event</span>
            </button>
          )}
        </div>
      </div>

      {/* Posting Rights Notice for Non-Authorized Roles */}
      {!canPostEvents && (
        <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200/80 text-amber-900 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
          <p className="leading-relaxed">
            <span className="font-bold">Administrative Access Notice:</span> Rights to schedule and publish official school events are restricted to the <strong>Administration Staff</strong>, <strong>Dean of Studies</strong>, <strong>Deputy Heads</strong>, and <strong>Head Teacher</strong>. Parents, students, and staff may freely browse and book Free/Paid tickets below.
          </p>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total School Events</span>
          <div className="text-2xl font-black text-slate-900">{metrics.total}</div>
          <span className="text-[11px] text-slate-500 font-mono">Academic Year 2026</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1">
            <Ticket className="w-3 h-3" />
            <span>Free Ticket Events</span>
          </span>
          <div className="text-2xl font-black text-emerald-700">{metrics.freeCount}</div>
          <span className="text-[11px] text-emerald-800">Complimentary admission</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1">
            <CreditCard className="w-3 h-3" />
            <span>Paid Events</span>
          </span>
          <div className="text-2xl font-black text-amber-700">{metrics.paidCount}</div>
          <span className="text-[11px] text-amber-800">JotForm ticketing integrated</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>Total Tickets Booked</span>
          </span>
          <div className="text-2xl font-black text-indigo-900">{metrics.totalTicketsSold.toLocaleString()}</div>
          <span className="text-[11px] text-indigo-700 font-mono">
            KES {metrics.totalRevenue.toLocaleString()} processed
          </span>
        </div>
      </div>

      {/* ========================================================
          VIEW 1: EVENTS DIRECTORY
          ======================================================== */}
      {mainView === 'events' && (
        <div className="space-y-4">
          
          {/* Search & Filters Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events by title, description, or venue..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Ticket Type Filter */}
              <select
                value={selectedTicketType}
                onChange={(e) => setSelectedTicketType(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
              >
                <option value="all">All Ticket Types</option>
                <option value="free">🎟️ Free Tickets Only</option>
                <option value="paid">💳 Paid Events Only</option>
              </select>

              {/* Term Filter */}
              <select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
              >
                <option value="all">All Terms</option>
                <option value="1">Term 1</option>
                <option value="2">Term 2</option>
                <option value="3">Term 3</option>
              </select>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
              >
                <option value="all">All Categories</option>
                <option value="academic">Academic / Science & STEM</option>
                <option value="co_curricular">Sports & Gala Day</option>
                <option value="exams">Assessment / Exams</option>
                <option value="parents">Parents Consultation / PTC</option>
                <option value="term_dates">Term Dates & Opening</option>
                <option value="special_event">Special Galas & Dinners</option>
                <option value="holiday">Holiday / Recess</option>
              </select>
            </div>
          </div>

          {/* Events Grid */}
          {filteredEvents.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No events matched your filter</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try selecting different terms, ticket types, or search keywords.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedTerm('all');
                  setSelectedTicketType('all');
                  setSelectedCategory('all');
                }}
                className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredEvents.map(evt => {
                const isPaid = evt.ticketType === 'paid' && (evt.ticketPrice || 0) > 0;
                const capacity = evt.totalCapacity || 0;
                const sold = evt.ticketsSold || 0;
                const capacityPercent = capacity > 0 ? Math.min(100, Math.round((sold / capacity) * 100)) : 0;

                return (
                  <div 
                    key={evt.id} 
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Top Header Card Bar */}
                      <div className={`p-4 border-b flex items-start justify-between gap-3 ${
                        isPaid 
                          ? 'bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-white border-amber-200/60' 
                          : 'bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-white border-emerald-200/60'
                      }`}>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 bg-white/80 px-2 py-0.5 rounded border border-slate-200">
                              Term {evt.term}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                              {evt.category.replace('_', ' ')}
                            </span>
                          </div>
                          <h3 className="font-extrabold text-slate-900 text-sm mt-1 leading-snug group-hover:text-indigo-600 transition-colors">
                            {evt.title}
                          </h3>
                        </div>

                        {/* Ticket Badge */}
                        <div className="shrink-0 text-right">
                          {isPaid ? (
                            <span className="px-2.5 py-1 bg-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-xs inline-flex items-center gap-1">
                              <span>KES {(evt.ticketPrice || 0).toLocaleString()}</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-emerald-600 text-white font-black text-xs rounded-xl shadow-xs inline-flex items-center gap-1">
                              <span>FREE</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Event Details Body */}
                      <div className="p-4 space-y-3 text-xs">
                        <p className="text-slate-600 line-clamp-2 leading-relaxed">
                          {evt.description}
                        </p>

                        <div className="space-y-1.5 pt-1 text-[11px] text-slate-600">
                          <div className="flex items-center gap-1.5 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span>{evt.startDate} {evt.endDate !== evt.startDate && `to ${evt.endDate}`}</span>
                          </div>
                          {evt.startTime && (
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                              <span>{evt.startTime} - {evt.endTime || 'Wrap up'}</span>
                            </div>
                          )}
                          {evt.venue && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                              <span className="truncate">{evt.venue}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span>Audience: <strong>{evt.targetAudience}</strong></span>
                          </div>
                        </div>

                        {/* Capacity meter */}
                        {capacity > 0 && (
                          <div className="pt-2 border-t border-slate-100 space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                              <span>Booked: {sold} / {capacity} Passes</span>
                              <span className="font-bold">{capacityPercent}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  capacityPercent >= 90 ? 'bg-rose-500' : capacityPercent >= 60 ? 'bg-amber-500' : 'bg-indigo-600'
                                }`}
                                style={{ width: `${capacityPercent}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Actions Bar */}
                    <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                      {/* Authorized user actions */}
                      {canPostEvents ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditModal(evt)}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-200/70 rounded-lg transition-colors"
                            title="Edit Event"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(evt.id, evt.title)}
                            className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Event"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono">
                          {evt.status.toUpperCase()}
                        </span>
                      )}

                      {/* Primary Ticket Purchase / RSVP Button */}
                      <button
                        onClick={() => setTicketingEvent(evt)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                          isPaid 
                            ? 'bg-amber-500 hover:bg-amber-600 text-slate-950' 
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                      >
                        <Ticket className="w-3.5 h-3.5" />
                        <span>{isPaid ? 'Buy Ticket (JotForm)' : 'Get Free Ticket'}</span>
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* ========================================================
          VIEW 2: MY BOOKED TICKET PASSES
          ======================================================== */}
      {mainView === 'tickets' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Official Event Admission Passes
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                All purchased event tickets, M-Pesa receipts, and free registrations saved to your session.
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print All Passes</span>
            </button>
          </div>

          {tickets.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Ticket className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">No ticket passes found</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                You haven't booked any event tickets yet. Switch back to the Events Directory to reserve passes.
              </p>
              <button
                onClick={() => setMainView('events')}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
              >
                Browse Events
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map(tkt => (
                <div 
                  key={tkt.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-indigo-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-black bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded border border-indigo-200">
                        {tkt.ticketCode}
                      </span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        tkt.ticketType === 'paid' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                      }`}>
                        {tkt.ticketType === 'paid' ? 'Paid Ticket' : 'Free Pass'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Booked: {tkt.purchasedAt}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-slate-900 text-sm">
                      {tkt.eventTitle}
                    </h4>

                    <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap">
                      <span>Attendee: <strong>{tkt.purchaserName}</strong></span>
                      <span>Qty: <strong>{tkt.quantity} Pass{tkt.quantity > 1 ? 'es' : ''}</strong></span>
                      <span>Amount: <strong className="font-mono">{tkt.currency} {tkt.totalAmount.toLocaleString()}</strong></span>
                      {tkt.mpesaReference && (
                        <span>M-Pesa Ref: <strong className="font-mono text-emerald-700">{tkt.mpesaReference}</strong></span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        const targetEvent = events.find(e => e.id === tkt.eventId) || {
                          id: tkt.eventId,
                          title: tkt.eventTitle,
                          description: '',
                          category: 'academic' as const,
                          term: 1 as const,
                          academicYear: 2026,
                          startDate: tkt.eventDate,
                          endDate: tkt.eventDate,
                          targetAudience: 'All School' as const,
                          venue: tkt.eventVenue,
                          isImportant: false,
                          status: 'upcoming' as const,
                          ticketType: tkt.ticketType,
                          ticketPrice: tkt.unitPrice,
                          ticketPurchaseUrl: tkt.jotformUrl || 'https://form.jotform.com/262730415844053'
                        };
                        setTicketingEvent(targetEvent);
                      }}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      <span>View Pass & QR</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          POST / EDIT EVENT MODAL (Authorized Staff Only)
          ======================================================== */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded border border-indigo-400/30">
                    Authority: {rolePostingTitle}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-extrabold text-white mt-0.5">
                  {editingEvent ? 'Edit School Event & Ticketing' : 'Post New Official School Event'}
                </h3>
              </div>
              <button 
                onClick={() => setShowEventModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveEvent} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
              
              <div>
                <label className="block text-slate-700 font-bold mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  value={formState.title}
                  onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                  placeholder="e.g. Annual School Musical & Drama Gala"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Category & Term */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Category *</label>
                  <select
                    value={formState.category}
                    onChange={(e) => setFormState({ ...formState, category: e.target.value as SchoolCalendarEvent['category'] })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  >
                    <option value="academic">Academic & STEM Fair</option>
                    <option value="co_curricular">Sports & Gala Day</option>
                    <option value="exams">Continuous Assessment / Exams</option>
                    <option value="parents">Parents Consultation / AGM</option>
                    <option value="term_dates">Term Dates (Opening/Closing)</option>
                    <option value="special_event">Special Galas & Benefit Dinners</option>
                    <option value="holiday">Holiday / Recess Break</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Term *</label>
                  <select
                    value={formState.term}
                    onChange={(e) => setFormState({ ...formState, term: Number(e.target.value) as 1 | 2 | 3 })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold"
                  >
                    <option value={1}>Term 1</option>
                    <option value={2}>Term 2</option>
                    <option value={3}>Term 3</option>
                  </select>
                </div>
              </div>

              {/* Start Date & End Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={formState.startDate}
                    onChange={(e) => setFormState({ ...formState, startDate: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={formState.endDate}
                    onChange={(e) => setFormState({ ...formState, endDate: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
              </div>

              {/* Start Time & End Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Start Time</label>
                  <input
                    type="time"
                    value={formState.startTime}
                    onChange={(e) => setFormState({ ...formState, startTime: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">End Time</label>
                  <input
                    type="time"
                    value={formState.endTime}
                    onChange={(e) => setFormState({ ...formState, endTime: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Target Audience & Venue */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Target Audience</label>
                  <select
                    value={formState.targetAudience}
                    onChange={(e) => setFormState({ ...formState, targetAudience: e.target.value as SchoolCalendarEvent['targetAudience'] })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  >
                    <option value="All School">All School</option>
                    <option value="Primary (Grades 1-6)">Primary (Grades 1-6)</option>
                    <option value="Junior School (Grades 7-9)">Junior School (Grades 7-9)</option>
                    <option value="Parents">Parents & Guardians</option>
                    <option value="Teachers & Staff">Teachers & Staff</option>
                    <option value="Public & Community">Public & Community</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Venue / Location</label>
                  <input
                    type="text"
                    value={formState.venue}
                    onChange={(e) => setFormState({ ...formState, venue: e.target.value })}
                    placeholder="e.g. Main Auditorium / Sports Grounds"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
              </div>

              {/* ========================================================
                  TICKETING CONFIGURATION SECTION (Free Ticket vs Paid Event)
                  ======================================================== */}
              <div className="p-4 rounded-xl border-2 border-indigo-200 bg-indigo-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-indigo-950 flex items-center gap-1.5">
                    <Ticket className="w-4 h-4 text-indigo-600" />
                    <span>Ticketing Configuration *</span>
                  </span>
                  <span className="text-[10px] text-indigo-800 font-semibold">
                    Assign as Free Ticket or Paid Event
                  </span>
                </div>

                {/* Ticket Type Toggle */}
                <div className="grid grid-cols-2 gap-3">
                  <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                    formState.ticketType === 'free' 
                      ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm font-bold' 
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}>
                    <input
                      type="radio"
                      name="ticketType"
                      checked={formState.ticketType === 'free'}
                      onChange={() => setFormState({ ...formState, ticketType: 'free', ticketPrice: 0 })}
                      className="sr-only"
                    />
                    <Ticket className="w-4 h-4" />
                    <div>
                      <div className="text-xs font-black">🎟️ Free Ticket</div>
                      <div className={`text-[10px] ${formState.ticketType === 'free' ? 'text-emerald-100' : 'text-slate-500'}`}>
                        Complimentary RSVP
                      </div>
                    </div>
                  </label>

                  <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                    formState.ticketType === 'paid' 
                      ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm font-black' 
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}>
                    <input
                      type="radio"
                      name="ticketType"
                      checked={formState.ticketType === 'paid'}
                      onChange={() => setFormState({ ...formState, ticketType: 'paid', ticketPrice: formState.ticketPrice || 500 })}
                      className="sr-only"
                    />
                    <CreditCard className="w-4 h-4" />
                    <div>
                      <div className="text-xs font-black">💳 Paid Event</div>
                      <div className={`text-[10px] ${formState.ticketType === 'paid' ? 'text-slate-900 font-semibold' : 'text-slate-500'}`}>
                        JotForm purchase link
                      </div>
                    </div>
                  </label>
                </div>

                {/* Conditional Pricing & JotForm Link Inputs */}
                {formState.ticketType === 'paid' ? (
                  <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-800 font-bold mb-1">Ticket Price (KES) *</label>
                        <input
                          type="number"
                          required
                          min={50}
                          step={50}
                          value={formState.ticketPrice}
                          onChange={(e) => setFormState({ ...formState, ticketPrice: Number(e.target.value) })}
                          placeholder="e.g. 500"
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-800 font-bold mb-1">Ticket Capacity (Seats)</label>
                        <input
                          type="number"
                          min={10}
                          value={formState.totalCapacity}
                          onChange={(e) => setFormState({ ...formState, totalCapacity: Number(e.target.value) })}
                          placeholder="e.g. 400"
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-800 font-bold mb-1">
                        JotForm Ticket Purchase URL *
                      </label>
                      <input
                        type="url"
                        required
                        value={formState.ticketPurchaseUrl}
                        onChange={(e) => setFormState({ ...formState, ticketPurchaseUrl: e.target.value })}
                        placeholder="https://form.jotform.com/262730415844053"
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono bg-white text-indigo-700 font-semibold"
                      />
                      <p className="text-[10px] text-indigo-900 mt-1">
                        Default: <code>https://form.jotform.com/262730415844053</code> (EVENT TICKET PURCHASE Form)
                      </p>
                    </div>

                    <div>
                      <label className="block text-slate-800 font-bold mb-1">Ticket Inclusions / Perks</label>
                      <input
                        type="text"
                        value={formState.ticketPerks}
                        onChange={(e) => setFormState({ ...formState, ticketPerks: e.target.value })}
                        placeholder="e.g. Reserved Seating, Event Booklet, Refreshments Voucher"
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block text-slate-800 font-bold mb-1">Free Admission Capacity</label>
                      <input
                        type="number"
                        min={0}
                        value={formState.totalCapacity}
                        onChange={(e) => setFormState({ ...formState, totalCapacity: Number(e.target.value) })}
                        placeholder="e.g. 680"
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-800 font-bold mb-1">Free Pass Inclusions</label>
                      <input
                        type="text"
                        value={formState.ticketPerks}
                        onChange={(e) => setFormState({ ...formState, ticketPerks: e.target.value })}
                        placeholder="e.g. Free Campus Admission, Consultation Session Slot"
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Description & Guidelines</label>
                <textarea
                  rows={3}
                  value={formState.description}
                  onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                  placeholder="Outline schedule, dress code, participant instructions, or parking guidelines..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="importantCheck"
                  checked={formState.isImportant}
                  onChange={(e) => setFormState({ ...formState, isImportant: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="importantCheck" className="text-slate-700 font-semibold cursor-pointer">
                  Mark as High Priority / Crucial School Milestone
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
                >
                  {editingEvent ? 'Update Event & Tickets' : 'Publish Event'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          INTERACTIVE JOTFORM TICKET PURCHASE MODAL
          ======================================================== */}
      {ticketingEvent && (
        <EventTicketModal
          event={ticketingEvent}
          currentUser={currentUser}
          onClose={() => setTicketingEvent(null)}
          onSuccessBooking={(ticket) => {
            showNotification(`Ticket ${ticket.ticketCode} reserved successfully!`, 'success');
            setTickets(Storage.getEventTicketPurchases());
            setEvents(Storage.getCalendarEvents());
          }}
        />
      )}

    </div>
  );
};
