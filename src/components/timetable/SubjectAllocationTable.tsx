import React, { useState } from 'react';
import {
  CheckCircle2,
  Edit3,
  Minus,
  Plus,
  Power,
  RotateCcw,
  Save,
  Undo2,
} from 'lucide-react';
import { ROOM_TYPE_LABELS } from './timetableTypes';

export interface LessonsPerWeekStepperProps {
  value: number;
  min?: number;
  max?: number;
  disabled?: boolean;
  isDirty?: boolean;
  subjectLabel: string;
  onChange: (nextValue: number) => void;
}

export const LessonsPerWeekStepper: React.FC<LessonsPerWeekStepperProps> = ({
  value,
  min = 0,
  max = 20,
  disabled = false,
  isDirty = false,
  subjectLabel,
  onChange,
}) => {
  const [rawInput, setRawInput] = useState<string | null>(null);

  const commit = (rawVal: number) => {
    const clamped = Math.max(min, Math.min(max, Math.floor(Number.isFinite(rawVal) ? rawVal : min)));
    setRawInput(null);
    onChange(clamped);
  };

  return (
    <div
      className={`inline-flex items-center border rounded-lg bg-white overflow-hidden transition-colors ${
        isDirty
          ? 'border-amber-400 ring-1 ring-amber-200'
          : 'border-slate-300 focus-within:border-slate-600'
      }`}
    >
      <button
        type="button"
        disabled={disabled || value <= min}
        onClick={() => commit(value - 1)}
        aria-label={`Decrease weekly lessons for ${subjectLabel}`}
        title={`Decrease lessons for ${subjectLabel}`}
        className="px-2.5 py-1.5 text-slate-600 hover:bg-slate-100 active:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={1}
        disabled={disabled}
        value={rawInput !== null ? rawInput : value}
        onFocus={(e) => {
          setRawInput(String(value));
          e.currentTarget.select();
        }}
        onChange={(e) => {
          const text = e.target.value;
          setRawInput(text);
          if (text.trim() !== '') {
            const parsed = Number(text);
            if (Number.isFinite(parsed)) {
              const clamped = Math.max(min, Math.min(max, Math.floor(parsed)));
              onChange(clamped);
            }
          }
        }}
        onBlur={() => {
          if (rawInput !== null) {
            if (rawInput.trim() === '') {
              setRawInput(null);
            } else {
              commit(Number(rawInput));
            }
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            commit(value + 1);
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            commit(value - 1);
          } else if (e.key === 'Escape') {
            e.preventDefault();
            setRawInput(null);
            e.currentTarget.blur();
          }
        }}
        aria-label={`Lessons per week for ${subjectLabel}`}
        className="w-12 py-1.5 text-center text-sm font-bold font-mono tabular-nums text-slate-900 border-x border-slate-200 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        type="button"
        disabled={disabled || value >= max}
        onClick={() => commit(value + 1)}
        aria-label={`Increase weekly lessons for ${subjectLabel}`}
        title={`Increase lessons for ${subjectLabel}`}
        className="px-2.5 py-1.5 text-slate-600 hover:bg-slate-100 active:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export interface SubjectAllocationTableRow {
  draftKey: string;
  subjectName: string;
  requiredWeeklyPeriods: number;
  singleLessons: number;
  doubleLessons: number;
  tripleLessons: number;
  requiredRoomType: string;
  maxPerDay: number;
  minSpacingDays: number;
  isActive: boolean;
  isCategoryOverride: boolean;
  categoryDefaultPeriods?: number;
  dirty: boolean;
  baselineWeeklyPeriods: number;
}

interface SubjectAllocationTableProps {
  tabId: string;
  categoryLabel: string;
  activeScope: 'category' | number;
  activeScopeTitle: string;
  rows: SubjectAllocationTableRow[];
  totalRowsInScope: number;
  editingRowKey: string | null;
  busyKey: string | null;
  activeTotalLessons: number;
  displayedTotalLessons: number;
  currentAvailableSlots: number;
  remainingSlots: number;
  utilizationPct: number;
  activeDepartmentFilter?: string;
  dirtyCountInScope: number;
  onAdjustLessons: (draftKey: string, nextWeekly: number) => void;
  onUpdateRowField: (
    draftKey: string,
    patch: Partial<{
      requiredRoomType: string;
      doubleLessons: number;
      singleLessons: number;
      maxPerDay: number;
    }>
  ) => void;
  onRevertRow: (draftKey: string) => void;
  onSaveRow: (row: SubjectAllocationTableRow) => void;
  onToggleEditRow: (draftKey: string) => void;
  onToggleDisableRow: (row: SubjectAllocationTableRow) => void;
  onResetRowDefault: (row: SubjectAllocationTableRow) => void;
  onDiscardScope: () => void;
  onSaveScope: () => void;
}

export const SubjectAllocationTable: React.FC<SubjectAllocationTableProps> = ({
  tabId,
  categoryLabel,
  activeScope,
  activeScopeTitle,
  rows,
  totalRowsInScope,
  editingRowKey,
  busyKey,
  activeTotalLessons,
  displayedTotalLessons,
  currentAvailableSlots,
  remainingSlots,
  utilizationPct,
  activeDepartmentFilter = '',
  dirtyCountInScope,
  onAdjustLessons,
  onUpdateRowField,
  onRevertRow,
  onSaveRow,
  onToggleEditRow,
  onToggleDisableRow,
  onResetRowDefault,
  onDiscardScope,
  onSaveScope,
}) => {
  return (
    <div
      role="tabpanel"
      id={`allocation-tabpanel-${tabId}`}
      aria-labelledby={`allocation-tab-${tabId}`}
      className="overflow-x-auto"
    >
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            <th className="py-3 px-5">Subject / Activity Name</th>
            <th className="py-3 px-4 w-64">Lessons Per Week</th>
            <th className="py-3 px-5 text-right w-72">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={3} className="py-10 px-5 text-center text-xs text-slate-500">
                {totalRowsInScope === 0
                  ? `No subjects or activities configured for ${categoryLabel} yet. Click “Add Subject / Activity” above to add curriculum lessons.`
                  : 'No subjects match the current search or filter.'}
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const isEditing = editingRowKey === row.draftKey;
              const facilityLabel = ROOM_TYPE_LABELS[row.requiredRoomType] || 'Standard Classroom';
              const delta = row.requiredWeeklyPeriods - row.baselineWeeklyPeriods;

              return (
                <tr
                  key={row.draftKey}
                  className={`transition-colors ${
                    !row.isActive
                      ? 'bg-slate-50/70 text-slate-400'
                      : row.dirty
                      ? 'bg-amber-50/40'
                      : 'hover:bg-slate-50/60'
                  }`}
                >
                  {/* COLUMN 1: Subject / Activity Name */}
                  <td className="py-3 px-5 align-middle">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-semibold text-sm ${
                            row.isActive ? 'text-slate-900' : 'line-through text-slate-400'
                          }`}
                        >
                          {row.subjectName}
                        </span>
                        {row.dirty && (
                          <span className="text-[11px] font-semibold text-amber-700">· Unsaved</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-2">
                        <span>{facilityLabel}</span>
                        {row.doubleLessons > 0 && (
                          <span className="font-mono tabular-nums">· {row.doubleLessons} double</span>
                        )}
                        {typeof activeScope === 'number' ? (
                          row.isCategoryOverride ? (
                            <span className="text-amber-700 font-medium">
                              · Overridden for Grade {activeScope}
                              {row.categoryDefaultPeriods !== undefined
                                ? ` (Category default: ${row.categoryDefaultPeriods})`
                                : ''}
                            </span>
                          ) : (
                            <span className="text-slate-500">· Inherited from {categoryLabel}</span>
                          )
                        ) : (
                          <span className="text-slate-500">· Default for {categoryLabel}</span>
                        )}
                        {!row.isActive && <span className="text-rose-600 font-medium">· Disabled</span>}
                      </div>

                      {isEditing && (
                        <div className="mt-2.5 pt-2.5 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-2 max-w-lg">
                          <div>
                            <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-0.5">
                              Facility Type
                            </label>
                            <select
                              value={row.requiredRoomType}
                              onChange={(e) =>
                                onUpdateRowField(row.draftKey, { requiredRoomType: e.target.value })
                              }
                              className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800"
                            >
                              {Object.entries(ROOM_TYPE_LABELS).map(([k, lbl]) => (
                                <option key={k} value={k}>
                                  {lbl}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-0.5">
                              Double Lessons
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={Math.floor(row.requiredWeeklyPeriods / 2)}
                              value={row.doubleLessons}
                              onChange={(e) => {
                                const dbl = Math.max(
                                  0,
                                  Math.min(
                                    Math.floor(row.requiredWeeklyPeriods / 2),
                                    Number(e.target.value || 0)
                                  )
                                );
                                const sng = Math.max(
                                  0,
                                  row.requiredWeeklyPeriods - dbl * 2 - row.tripleLessons * 3
                                );
                                onUpdateRowField(row.draftKey, {
                                  doubleLessons: dbl,
                                  singleLessons: sng,
                                  maxPerDay: dbl > 0 ? Math.max(2, row.maxPerDay) : row.maxPerDay,
                                });
                              }}
                              className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono tabular-nums text-slate-800"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-0.5">
                              Max Per Day
                            </label>
                            <input
                              type="number"
                              min={1}
                              max={4}
                              value={row.maxPerDay}
                              onChange={(e) =>
                                onUpdateRowField(row.draftKey, {
                                  maxPerDay: Math.max(1, Math.min(4, Number(e.target.value || 1))),
                                })
                              }
                              className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono tabular-nums text-slate-800"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* COLUMN 2: Lessons Per Week */}
                  <td className="py-3 px-4 align-middle">
                    <div className="flex items-center gap-2.5">
                      <LessonsPerWeekStepper
                        value={row.requiredWeeklyPeriods}
                        min={0}
                        max={20}
                        disabled={!row.isActive}
                        isDirty={row.dirty}
                        subjectLabel={row.subjectName}
                        onChange={(nextVal) => onAdjustLessons(row.draftKey, nextVal)}
                      />

                      {row.dirty && (
                        <div className="flex items-center gap-1.5">
                          {delta !== 0 && (
                            <span
                              className={`text-[11px] font-mono tabular-nums font-semibold ${
                                delta > 0 ? 'text-emerald-700' : 'text-amber-700'
                              }`}
                              title={`Saved value in database: ${row.baselineWeeklyPeriods}`}
                            >
                              {delta > 0 ? `+${delta}` : delta} (was {row.baselineWeeklyPeriods})
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => onRevertRow(row.draftKey)}
                            title={`Revert ${row.subjectName} back to saved database value`}
                            aria-label={`Revert unsaved changes for ${row.subjectName}`}
                            className="p-1 text-slate-400 hover:text-slate-800 rounded cursor-pointer"
                          >
                            <Undo2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* COLUMN 3: Actions */}
                  <td className="py-3 px-5 align-middle text-right">
                    <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                      <button
                        type="button"
                        disabled={busyKey !== null || !row.dirty}
                        onClick={() => onSaveRow(row)}
                        className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Save className="w-3 h-3" />
                        <span>Save</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onToggleEditRow(row.draftKey)}
                        className={`px-2.5 py-1.5 border rounded-lg text-xs font-semibold inline-flex items-center gap-1 cursor-pointer ${
                          isEditing
                            ? 'bg-slate-100 border-slate-400 text-slate-900'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>{isEditing ? 'Done' : 'Edit'}</span>
                      </button>

                      <button
                        type="button"
                        disabled={busyKey !== null}
                        onClick={() => onToggleDisableRow(row)}
                        className={`px-2.5 py-1.5 border rounded-lg text-xs font-semibold inline-flex items-center gap-1 cursor-pointer ${
                          row.isActive
                            ? 'bg-white border-slate-200 text-slate-700 hover:border-rose-300 hover:text-rose-700'
                            : 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                        }`}
                      >
                        {row.isActive ? <Power className="w-3 h-3" /> : <RotateCcw className="w-3 h-3" />}
                        <span>{row.isActive ? 'Disable' : 'Restore'}</span>
                      </button>

                      {typeof activeScope === 'number' &&
                        row.isCategoryOverride &&
                        row.categoryDefaultPeriods !== undefined && (
                          <button
                            type="button"
                            disabled={busyKey !== null}
                            onClick={() => onResetRowDefault(row)}
                            title={`Restore ${row.subjectName} on Grade ${activeScope} to ${categoryLabel} default (${row.categoryDefaultPeriods} lessons)`}
                            className="px-2.5 py-1.5 bg-white border border-amber-300 text-amber-800 hover:bg-amber-50 rounded-lg text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Undo2 className="w-3 h-3" />
                            <span>Reset Default</span>
                          </button>
                        )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>

        {/* Live Automatic Weekly Total & Remaining Available Periods Footer */}
        <tfoot>
          <tr className="border-t-2 border-slate-200 bg-slate-50 text-xs">
            <td className="py-3.5 px-5 align-middle">
              <div className="font-bold text-slate-900">
                Weekly Allocation Summary — {activeScopeTitle}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {utilizationPct}% of {currentAvailableSlots} available weekly periods allocated
                {activeDepartmentFilter && displayedTotalLessons !== activeTotalLessons
                  ? ` (${displayedTotalLessons} in ${activeDepartmentFilter})`
                  : ''}
              </div>
            </td>
            <td className="py-3.5 px-4 align-middle">
              <div className="flex flex-col">
                <div className="text-sm font-bold font-mono tabular-nums text-slate-900">
                  {activeTotalLessons} / {currentAvailableSlots} lessons
                </div>
                <div
                  className={`text-xs font-mono tabular-nums font-semibold mt-0.5 ${
                    remainingSlots < 0
                      ? 'text-rose-700'
                      : remainingSlots === 0
                      ? 'text-emerald-700'
                      : 'text-slate-600'
                  }`}
                >
                  {remainingSlots > 0
                    ? `${remainingSlots} remaining period${remainingSlots === 1 ? '' : 's'}`
                    : remainingSlots === 0
                    ? '0 remaining (exact fit)'
                    : `${Math.abs(remainingSlots)} period${Math.abs(remainingSlots) === 1 ? '' : 's'} over limit`}
                </div>
              </div>
            </td>
            <td className="py-3.5 px-5 align-middle text-right">
              {dirtyCountInScope > 0 ? (
                <div className="inline-flex items-center justify-end gap-2">
                  <button
                    type="button"
                    disabled={busyKey !== null}
                    onClick={onDiscardScope}
                    className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Revert ({dirtyCountInScope})
                  </button>
                  <button
                    type="button"
                    disabled={busyKey !== null}
                    onClick={onSaveScope}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-45 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Tab Changes</span>
                  </button>
                </div>
              ) : (
                <span className="text-xs font-medium text-emerald-700 inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>All changes saved to database</span>
                </span>
              )}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};
