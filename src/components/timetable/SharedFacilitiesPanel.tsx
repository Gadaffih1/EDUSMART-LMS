import React, { useState } from 'react';
import { Building2, Plus, Trash2 } from 'lucide-react';
import {
  FACILITY_TYPE_LABELS,
  ttApiFetch,
  type FacilityType,
  type FacilityUtilizationReport,
  type TimetableFacility,
} from './timetableTypes';

interface Props {
  schoolId?: string;
  weekdays: string[];
  facilities: TimetableFacility[];
  utilization: FacilityUtilizationReport[];
  canManage: boolean;
  onRefresh: () => Promise<void>;
}

const ALL_FACILITY_TYPES: FacilityType[] = [
  'computer_lab',
  'ict_robotics_lab',
  'science_lab',
  'library',
  'swimming_pool',
  'maktaba_room',
  'clubs_venue',
  'general_room',
];

export const SharedFacilitiesPanel: React.FC<Props> = ({
  schoolId,
  weekdays,
  facilities,
  utilization,
  canManage,
  onRefresh,
}) => {
  const [name, setName] = useState('');
  const [facilityType, setFacilityType] = useState<FacilityType>('computer_lab');
  const [capacityStreams, setCapacityStreams] = useState(1);
  const [seatCapacity, setSeatCapacity] = useState(40);
  const [equipmentInput, setEquipmentInput] = useState('');
  const [availableDays, setAvailableDays] = useState<string[]>([...weekdays]);
  const [availablePeriods, setAvailablePeriods] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const toggleDay = (day: string) => {
    setAvailableDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const togglePeriod = (p: number) => {
    setAvailablePeriods((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p].sort((a, b) => a - b)
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage || !name.trim()) return;
    setSaving(true);
    setFeedback(null);
    try {
      const equipment = equipmentInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await ttApiFetch(
        '/api/timetable/facilities',
        {
          method: 'POST',
          body: JSON.stringify({
            name: name.trim(),
            facilityType,
            capacityStreams,
            seatCapacity,
            equipment,
            availableDays,
            availablePeriods,
            notes,
          }),
        },
        schoolId
      );
      await onRefresh();
      setName('');
      setEquipmentInput('');
      setNotes('');
      setFeedback({ type: 'ok', text: `Shared facility "${name.trim()}" added.` });
    } catch (err: any) {
      setFeedback({ type: 'err', text: err.message || 'Failed to create facility.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, facName: string) => {
    if (!canManage) return;
    try {
      await ttApiFetch(`/api/timetable/facilities/${id}`, { method: 'DELETE' }, schoolId);
      await onRefresh();
      setFeedback({ type: 'ok', text: `Removed facility "${facName}".` });
    } catch (err: any) {
      setFeedback({ type: 'err', text: err.message || 'Failed to delete facility.' });
    }
  };

  const utilById = new Map(utilization.map((u) => [u.facilityId, u]));

  return (
    <div className="space-y-5">
      {feedback && (
        <div
          className={`px-4 py-2.5 rounded-md border text-sm flex items-center justify-between ${
            feedback.type === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-medium underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {canManage && (
        <form
          onSubmit={handleCreate}
          className="bg-white border border-slate-200 rounded-lg p-4 space-y-4"
        >
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-semibold text-slate-900">
              Add Shared Facility or Laboratory
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Library Lessons, Swimming, Computer Studies, and ICT/Robotics reserve these shared
              facilities. Capacity and availability are enforced concurrently across Categories 1,
              2, and 3.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Facility Name</label>
              <input
                type="text"
                required
                placeholder="e.g., Computer Lab 2, Aquatics Pool"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded text-slate-900"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Facility Type</label>
              <select
                value={facilityType}
                onChange={(e) => setFacilityType(e.target.value as FacilityType)}
                className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded text-slate-900"
              >
                {ALL_FACILITY_TYPES.map((ft) => (
                  <option key={ft} value={ft}>
                    {FACILITY_TYPE_LABELS[ft]}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Concurrent Streams</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={capacityStreams}
                  onChange={(e) =>
                    setCapacityStreams(Math.max(1, Math.min(20, Number(e.target.value) || 1)))
                  }
                  className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded font-mono tabular-nums text-slate-900"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Seat Capacity</label>
                <input
                  type="number"
                  min={5}
                  max={500}
                  value={seatCapacity}
                  onChange={(e) =>
                    setSeatCapacity(Math.max(5, Math.min(500, Number(e.target.value) || 40)))
                  }
                  className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded font-mono tabular-nums text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Equipment (comma-separated)
              </label>
              <input
                type="text"
                placeholder="36 PCs, Robotics Kits, Smartboard"
                value={equipmentInput}
                onChange={(e) => setEquipmentInput(e.target.value)}
                className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100 text-xs">
            <div>
              <div className="font-medium text-slate-700 mb-1">Available Days</div>
              <div className="flex flex-wrap gap-1.5">
                {weekdays.map((day) => {
                  const active = availableDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-2 py-1 rounded border text-xs font-medium ${
                        active
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="font-medium text-slate-700 mb-1">Available Periods</div>
              <div className="flex flex-wrap gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((p) => {
                  const active = availablePeriods.includes(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => togglePeriod(p)}
                      className={`w-8 h-7 rounded border font-mono text-xs font-medium ${
                        active
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      P{p}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col justify-between gap-2">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Notes</label>
                <input
                  type="text"
                  placeholder="Optional operational notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {saving ? 'Adding...' : 'Add Facility'}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Facilities Registry & Cross-Category Booking Summary */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Building2 className="w-4 h-4 text-slate-600" />
          <span>Shared Facilities & Cross-Category Capacity Enforcement</span>
          <span className="font-mono text-xs font-normal text-slate-500">
            ({facilities.length})
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-2.5 px-4">Facility & Equipment</th>
                <th className="py-2.5 px-4">Type</th>
                <th className="py-2.5 px-4 text-right">Max Concurrent</th>
                <th className="py-2.5 px-4 text-right">Weekly Capacity</th>
                <th className="py-2.5 px-4">Active Bookings (Cat 1 / 2 / 3)</th>
                {canManage && <th className="py-2.5 px-4 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {facilities.map((f) => {
                const u = utilById.get(f.id);
                const weeklyCap =
                  f.availableDays.length * f.availablePeriods.length * Math.max(1, f.capacityStreams);
                return (
                  <tr key={f.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-4">
                      <div className="font-medium text-slate-900">{f.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {f.seatCapacity} seats
                        {f.equipment.length > 0 ? ` · ${f.equipment.join(', ')}` : ''}
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-xs text-slate-700">
                      {FACILITY_TYPE_LABELS[f.facilityType]}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-xs font-semibold text-slate-900 tabular-nums">
                      {f.capacityStreams} stream{f.capacityStreams > 1 ? 's' : ''}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-xs text-slate-700 tabular-nums">
                      {weeklyCap} slots
                    </td>
                    <td className="py-2.5 px-4 text-xs font-mono tabular-nums text-slate-700">
                      {u ? (
                        <div>
                          <span className="font-semibold text-slate-900">{u.totalBookedSlots}</span>{' '}
                          booked · Cat 1: {u.bookingsByCategory.cat_1_3} · Cat 2:{' '}
                          {u.bookingsByCategory.cat_4_6} · Cat 3: {u.bookingsByCategory.cat_7_9}
                          {u.overflowSlots > 0 && (
                            <span className="text-red-600 font-semibold ml-2">
                              ({u.overflowSlots} overflow)
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">0 booked</span>
                      )}
                    </td>
                    {canManage && (
                      <td className="py-2.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(f.id, f.name)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
