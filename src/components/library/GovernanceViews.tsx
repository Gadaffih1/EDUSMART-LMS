import React, { useState } from 'react';
import { 
  FileText, 
  Bell, 
  ShieldCheck, 
  Settings, 
  History, 
  Printer, 
  Search, 
  CheckCircle2, 
  Save, 
  Lock, 
  Send,
  Sparkles
} from 'lucide-react';
import { 
  LibraryPolicy, 
  LibraryAuditLog, 
  LibraryBook, 
  LibraryBorrowRecord 
} from '../../types';
import { LibraryPortalSection } from './types';
import { EduSmartGadsaLogo } from '../common/EduSmartGadsaLogo';

interface GovernanceViewsProps {
  section: LibraryPortalSection;
  policies: LibraryPolicy[];
  auditLogs: LibraryAuditLog[];
  books: LibraryBook[];
  borrowRecords: LibraryBorrowRecord[];
  onUpdatePolicy: (id: string, updates: Partial<LibraryPolicy>) => void;
  onAddAuditLog: (log: LibraryAuditLog) => void;
}

export const GovernanceViews: React.FC<GovernanceViewsProps> = ({
  section,
  policies,
  auditLogs,
  books,
  borrowRecords,
  onUpdatePolicy,
  onAddAuditLog
}) => {
  // Reports & Analytics
  if (section === 'reports_analytics') {
    const totalBorrowed = borrowRecords.length;
    const activeLoans = borrowRecords.filter(r => r.status === 'active').length;
    const overdueCount = borrowRecords.filter(r => r.status === 'overdue').length;

    return (
      <div className="space-y-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              <span>Library Analytics, Circulation Reports & MOE Audits</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Curriculum book ratios, borrowing trends by grade, and official institutional inventory reports.
            </p>
          </div>

          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Official Digest (PDF)</span>
          </button>
        </div>

        {/* Paper Report Card */}
        <div className="bg-white rounded-2xl border-2 border-slate-300 p-8 shadow-sm max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between border-b-2 border-purple-900 pb-4">
            <EduSmartGadsaLogo variant="full" size="md" />
            <div className="text-right">
              <div className="text-xs font-black text-purple-950 uppercase tracking-wider">
                EduSmart Academy · Library Services
              </div>
              <div className="text-[11px] font-semibold text-slate-600">
                Term 3 Institutional Circulation & Asset Digest
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                Generated: 2026-10-04 · Official Archival Record
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 text-center text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Total Titles</span>
              <div className="text-xl font-black text-slate-900 mt-1">{books.length}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Total Volumes</span>
              <div className="text-xl font-black text-purple-700 mt-1">
                {books.reduce((acc, b) => acc + b.totalCopies, 0)}
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Circulation Loans</span>
              <div className="text-xl font-black text-blue-700 mt-1">{totalBorrowed}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Overdue Rate</span>
              <div className="text-xl font-black text-rose-600 mt-1">
                {totalBorrowed > 0 ? Math.round((overdueCount / totalBorrowed) * 100) : 0}%
              </div>
            </div>
          </div>

          {/* Breakdown by Category */}
          <div>
            <h4 className="font-bold text-xs uppercase text-slate-700 border-b pb-1 mb-2">
              Curriculum Title Holdings Summary
            </h4>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>CBC Primary Textbooks (Grades 1-6)</span>
                <span className="font-mono font-bold">420 Volumes</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Junior Secondary Course Guides (Grades 7-9)</span>
                <span className="font-mono font-bold">310 Volumes</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>African Literature & Supplementary Readers</span>
                <span className="font-mono font-bold">285 Volumes</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Reference & General Encyclopedias</span>
                <span className="font-mono font-bold">115 Volumes</span>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-6 border-t-2 border-slate-300 grid grid-cols-2 gap-8 text-center text-xs">
            <div>
              <div className="font-bold text-slate-900">Mrs. Jane Wambua, MLS</div>
              <div className="text-[10px] text-slate-500">School Librarian & Information Specialist</div>
            </div>
            <div>
              <div className="font-bold text-slate-900">Dr. Arthur Mwangi, PhD</div>
              <div className="text-[10px] text-slate-500">Head Teacher & Institutional Custodian</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Notifications
  if (section === 'notifications') {
    return (
      <div className="space-y-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Bell className="w-5 h-5 text-purple-600" />
            <span>Automated Library Dispatch & Parent Notifications</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Automated alerts triggered for due-date warnings, reserved hold pick-ups, and fine balances.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <h4 className="font-bold text-sm text-slate-900">Configured System Triggers</h4>
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">Pre-Due Reminder (48 hrs prior)</div>
                  <div className="text-slate-500">SMS to learner / parent informing due date.</div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">Active</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">Overdue Recall Notice (Day +1, Day +7)</div>
                  <div className="text-slate-500">Automated portal alert and parent SMS dispatch.</div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">Active</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">Reservation Arrival Alert</div>
                  <div className="text-slate-500">Notifies borrower when reserved hold is ready.</div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">Active</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <h4 className="font-bold text-sm text-slate-900">Broadcast General Announcement</h4>
            <div className="space-y-2 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Audience</label>
                <select className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white">
                  <option>All Students & Faculty</option>
                  <option>Grade 4 to 6 Learners Only</option>
                  <option>Junior Secondary (Grades 7-9)</option>
                  <option>Faculty Only</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Message Notice</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Library will remain open until 5:30 PM for midterm exam revision..."
                  className="w-full text-xs border border-slate-300 rounded-lg p-2"
                />
              </div>

              <button
                onClick={() => alert('Broadcast announcement dispatched to selected portal users.')}
                className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Broadcast Alert</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Policies
  if (section === 'policies') {
    return (
      <div className="space-y-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>Library Circulation Policies & Borrowing Rules</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Governing rules set by the School Academic Board regarding loan periods, renewals, and fines.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {policies.map((pol) => (
            <div key={pol.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 uppercase">
                    {pol.category}
                  </span>
                  <span className="font-black text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {pol.value}
                  </span>
                </div>

                <h4 className="font-extrabold text-sm text-slate-900 mt-2">{pol.policyName}</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{pol.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>Institutional Standard</span>
                <span className="text-emerald-700 font-bold">Enforced in System</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Settings
  if (section === 'settings') {
    return (
      <div className="space-y-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-700" />
            <span>Library Portal System Configuration</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Barcode reader symbology, OPAC public visibility, and automated reminder schedules.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4 max-w-xl text-xs">
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b">
              <div>
                <div className="font-bold text-slate-900">Enable Barcode / QR Scanner Mode</div>
                <div className="text-slate-500">Auto-focus input for USB laser barcode scanners.</div>
              </div>
              <input type="checkbox" defaultChecked className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4" />
            </div>

            <div className="flex items-center justify-between py-2 border-b">
              <div>
                <div className="font-bold text-slate-900">Student Self-Service Hold Placement</div>
                <div className="text-slate-500">Allow students to reserve checked-out titles directly.</div>
              </div>
              <input type="checkbox" defaultChecked className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4" />
            </div>

            <div className="flex items-center justify-between py-2 border-b">
              <div>
                <div className="font-bold text-slate-900">Automatic Overdue Fine Accrual</div>
                <div className="text-slate-500">Daily KES 10 fee calculation at 00:00 midnight.</div>
              </div>
              <input type="checkbox" defaultChecked className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4" />
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => alert('Library settings successfully saved.')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Audit Trail
  if (section === 'audit_trail') {
    return (
      <div className="space-y-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-slate-700" />
            <span>Library Circulation & Cataloguing Audit Trail</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Immutable transaction history of all checkouts, returns, fine waivers, and new book accessions.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <th className="py-3 px-4">Action Taken</th>
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-4 font-mono text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{log.action}</td>
                  <td className="py-3.5 px-4 text-purple-800 font-semibold">{log.performedBy}</td>
                  <td className="py-3.5 px-4 text-slate-600">{log.details}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-400 text-right">{log.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return null;
};
