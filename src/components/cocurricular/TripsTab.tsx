import React, { useState } from 'react';
import { 
  Compass, 
  MapPin, 
  Calendar, 
  Clock, 
  Bus, 
  Phone, 
  Plus, 
  Users, 
  CheckCircle2, 
  AlertCircle,
  ShieldCheck,
  X
} from 'lucide-react';
import { CoCurricularTrip, CoCurricularActivity, SchoolBus } from '../../types';

interface TripsTabProps {
  trips: CoCurricularTrip[];
  activities: CoCurricularActivity[];
  buses: SchoolBus[];
  onAddTrip: (trip: CoCurricularTrip) => void;
  onUpdateTrip: (id: string, updates: Partial<CoCurricularTrip>) => void;
  readOnly?: boolean;
}

export const TripsTab: React.FC<TripsTabProps> = ({
  trips,
  activities,
  buses,
  onAddTrip,
  onUpdateTrip,
  readOnly = false
}) => {
  const [showAddModal, setShowAddModal] = useState(false);

  // New Trip Form
  const [activityId, setActivityId] = useState(activities[0]?.id || '');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('2026-10-28');
  const [departureTime, setDepartureTime] = useState('07:30 AM');
  const [returnTime, setReturnTime] = useState('05:30 PM');
  const [purpose, setPurpose] = useState('');
  const [busAllocated, setBusAllocated] = useState(buses[0]?.registrationNumber || 'KDE 301E');
  const [driverName, setDriverName] = useState(buses[0]?.driverName || 'Mr. Josephat Kipkoech');
  const [accompanyingStaff, setAccompanyingStaff] = useState('Coach Benjamin Omwenga, Madame Grace Achieng');
  const [emergencyContact, setEmergencyContact] = useState('+254 722 789 012');
  const [estimatedCost, setEstimatedCost] = useState<number>(1000);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const act = activities.find(a => a.id === activityId);
    if (!destination || !act) return;

    const newTrip: CoCurricularTrip = {
      id: `trip-${Date.now()}`,
      activityId: act.id,
      activityName: act.name,
      destination,
      date,
      departureTime,
      returnTime,
      purpose,
      busAllocated,
      driverName,
      accompanyingStaff: accompanyingStaff.split(',').map(s => s.trim()),
      participantLearnerIds: [],
      parentConsentRequired: true,
      status: 'Scheduled',
      emergencyContact,
      estimatedCostPerLearner: Number(estimatedCost),
      report: 'Logistics confirmed with Transport Operations Bay.'
    };

    onAddTrip(newTrip);
    setShowAddModal(false);
    setDestination('');
    setPurpose('');
  };

  const handleStatusChange = (id: string, status: 'Scheduled' | 'Departed' | 'Completed' | 'Cancelled') => {
    onUpdateTrip(id, { status });
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-teal-800 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <Bus className="w-3.5 h-3.5" />
            <span>EduSmart Fleet & Travel Link</span>
          </div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            Activity Trips & External Tournaments
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Coordinate inter-school match logistics, bus reservations, accompanying faculty, digital parent consent, and emergency protocol.
          </p>
        </div>

        {!readOnly && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Plan New Excursion</span>
          </button>
        )}
      </div>

      {/* Trips Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {trips.map((trip) => (
          <div
            key={trip.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between hover:border-teal-400 transition-all"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-teal-50 text-teal-800">
                    {trip.activityName}
                  </span>
                  <h4 className="font-extrabold text-base text-slate-900 mt-1 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>{trip.destination}</span>
                  </h4>
                </div>

                <select
                  value={trip.status}
                  onChange={(e) => handleStatusChange(trip.id, e.target.value as any)}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
                    trip.status === 'Completed' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                    trip.status === 'Departed' ? 'bg-blue-50 text-blue-800 border-blue-300' :
                    trip.status === 'Scheduled' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                    'bg-slate-100 text-slate-600 border-slate-300'
                  }`}
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="Departed">Departed</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <p className="text-xs text-slate-600 mt-2.5 leading-relaxed font-medium">
                {trip.purpose}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Trip Date:</span>
                  <div className="font-mono font-bold text-slate-800">{trip.date}</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Departure / Return:</span>
                  <div className="font-mono font-bold text-teal-700">{trip.departureTime} - {trip.returnTime}</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Allocated Bus:</span>
                  <div className="font-bold text-slate-800">{trip.busAllocated} (Driver: {trip.driverName})</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Emergency Contact:</span>
                  <div className="font-mono text-slate-700 text-[11px]">{trip.emergencyContact}</div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 text-[11px]">
                Faculty: <strong>{trip.accompanyingStaff.join(', ')}</strong>
              </span>
              <span className="font-bold text-emerald-700 text-[11px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Parent Consent: Mandatory
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Trip Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-teal-800 to-slate-900 text-white flex items-center justify-between">
              <h3 className="font-black text-sm flex items-center gap-2">
                <Compass className="w-4 h-4 text-teal-300" />
                <span>Schedule Co-Curricular Team Trip</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-300 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-3 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Destination</label>
                <input
                  type="text"
                  required
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. Kenya National Theatre / Kasarani Sports Annex"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Participating Team / Club</label>
                <select
                  value={activityId}
                  onChange={(e) => setActivityId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  {activities.map((a) => (
                    <option key={a.id} value={a.id}>{a.icon} {a.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Departure</label>
                  <input
                    type="text"
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Return</label>
                  <input
                    type="text"
                    value={returnTime}
                    onChange={(e) => setReturnTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">School Bus Allocation</label>
                  <select
                    value={busAllocated}
                    onChange={(e) => {
                      setBusAllocated(e.target.value);
                      const b = buses.find(x => x.registrationNumber === e.target.value);
                      if (b) setDriverName(b.driverName);
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    {buses.map((b) => (
                      <option key={b.id} value={b.registrationNumber}>{b.registrationNumber} ({b.busNumber})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Driver</label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Accompanying Staff / Coaches</label>
                <input
                  type="text"
                  required
                  value={accompanyingStaff}
                  onChange={(e) => setAccompanyingStaff(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Purpose & Tournament Notes</label>
                <textarea
                  rows={2}
                  required
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g. Model UN semi-finals and delegate presentations..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-black text-xs rounded-lg shadow-xs"
                >
                  Submit Trip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
