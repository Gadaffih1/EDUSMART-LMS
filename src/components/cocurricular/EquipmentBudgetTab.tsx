import React, { useState } from 'react';
import { 
  Package, 
  DollarSign, 
  Plus, 
  Search, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp,
  FileText
} from 'lucide-react';
import { CoCurricularEquipment, CoCurricularBudgetItem, CoCurricularActivity } from '../../types';

interface EquipmentBudgetTabProps {
  equipment: CoCurricularEquipment[];
  budgets: CoCurricularBudgetItem[];
  activities: CoCurricularActivity[];
  onAddEquipment: (item: CoCurricularEquipment) => void;
  onAddBudget: (item: CoCurricularBudgetItem) => void;
}

export const EquipmentBudgetTab: React.FC<EquipmentBudgetTabProps> = ({
  equipment,
  budgets,
  activities,
  onAddEquipment,
  onAddBudget
}) => {
  const [activeSection, setActiveSection] = useState<'equipment' | 'budget'>('equipment');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Equipment state
  const [itemName, setItemName] = useState('');
  const [eqCategory, setEqCategory] = useState('Sports');
  const [quantity, setQuantity] = useState<number>(10);
  const [condition, setCondition] = useState<'New / Excellent' | 'Good' | 'Fair / Maintenance Due'>('New / Excellent');
  const [assignedActivity, setAssignedActivity] = useState(activities[0]?.name || 'Simba Football Academy');
  const [storageLocation, setStorageLocation] = useState('Sports Pavilion Store');

  // Budget calculations
  const totalAllocated = budgets.reduce((acc, b) => acc + b.allocatedAmount, 0);
  const totalSpent = budgets.reduce((acc, b) => acc + b.spentAmount, 0);
  const remainingBalance = totalAllocated - totalSpent;

  const handleAddEquipmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName) return;

    const newItem: CoCurricularEquipment = {
      id: `eq-${Date.now()}`,
      itemName,
      category: eqCategory,
      quantity: Number(quantity),
      condition,
      assignedActivity,
      storageLocation,
      lastAuditDate: new Date().toISOString().split('T')[0]
    };

    onAddEquipment(newItem);
    setShowAddModal(false);
    setItemName('');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Toggle */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            Equipment Inventory & Activity Finances
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Audit sports kit, musical instruments, robotics kits, and monitor termly budget allocations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-slate-200 p-1 bg-slate-50 text-xs">
            <button
              onClick={() => setActiveSection('equipment')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeSection === 'equipment' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-500'
              }`}
            >
              Gear & Equipment ({equipment.length})
            </button>
            <button
              onClick={() => setActiveSection('budget')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeSection === 'budget' ? 'bg-white shadow-2xs text-emerald-800' : 'text-slate-500'
              }`}
            >
              Budgets & Finance
            </button>
          </div>

          {activeSection === 'equipment' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Equipment</span>
            </button>
          )}
        </div>
      </div>

      {/* SECTION 1: EQUIPMENT INVENTORY */}
      {activeSection === 'equipment' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <span className="font-black text-sm text-slate-900 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-emerald-600" />
              <span>Registered Kit & Apparatus</span>
            </span>
            <span className="text-[11px] text-slate-500">Term 3 Physical Audit</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <th className="py-3 px-4">Item & Specification</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">In Stock</th>
                  <th className="py-3 px-4">Condition</th>
                  <th className="py-3 px-4">Assigned Team / Club</th>
                  <th className="py-3 px-4">Storage Vault</th>
                  <th className="py-3 px-4 text-right">Last Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {equipment.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {item.itemName}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {item.category}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">
                      {item.quantity}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.condition.includes('Excellent') ? 'bg-emerald-100 text-emerald-800' :
                        item.condition === 'Good' ? 'bg-blue-100 text-blue-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {item.condition}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {item.assignedActivity}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {item.storageLocation}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500">
                      {item.lastAuditDate}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 2: BUDGET & EXPENDITURE */}
      {activeSection === 'budget' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Allocated Budget</span>
              <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
                KES {totalAllocated.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Term 3 Institutional Vote</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Total Expended</span>
              <div className="text-2xl font-black text-rose-700 mt-1 font-mono">
                KES {totalSpent.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Tournaments, Gear, Fuel</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Remaining Balance</span>
              <div className="text-2xl font-black text-emerald-700 mt-1 font-mono">
                KES {remainingBalance.toLocaleString()}
              </div>
              <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">Healthy Solvency</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Department Vote Heads & Activity Expenditure</span>
              </h4>
              <span className="text-[11px] font-mono text-slate-500">Academic Year 2026</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <th className="py-3 px-4">Activity Name</th>
                    <th className="py-3 px-4">Vote Head Category</th>
                    <th className="py-3 px-4 text-right">Allocated (KES)</th>
                    <th className="py-3 px-4 text-right">Spent (KES)</th>
                    <th className="py-3 px-4 text-right">Balance</th>
                    <th className="py-3 px-4">Approving Authority</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {budgets.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-sans font-bold text-slate-900">{b.activityName}</td>
                      <td className="py-3 px-4 font-sans text-slate-700">{b.category}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">{b.allocatedAmount.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-rose-700 font-bold">{b.spentAmount.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-emerald-700 font-bold">{(b.allocatedAmount - b.spentAmount).toLocaleString()}</td>
                      <td className="py-3 px-4 font-sans text-slate-600 text-[11px]">{b.approvedBy}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Equipment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-emerald-800 to-slate-900 text-white flex items-center justify-between">
              <h3 className="font-black text-sm flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-300" />
                <span>Add Equipment Item</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-300 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddEquipmentSubmit} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Item Name & Specs</label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g. Volleyball Nets & Heavy Duty Posts"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Condition</label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="New / Excellent">New / Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Fair / Maintenance Due">Fair / Maintenance Due</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Activity</label>
                <select
                  value={assignedActivity}
                  onChange={(e) => setAssignedActivity(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  {activities.map((a) => (
                    <option key={a.id} value={a.name}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Storage Location</label>
                <input
                  type="text"
                  required
                  value={storageLocation}
                  onChange={(e) => setStorageLocation(e.target.value)}
                  placeholder="e.g. Sports Store B / STEM Locker"
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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-lg shadow-xs"
                >
                  Add Equipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
