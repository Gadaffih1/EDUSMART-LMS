import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Boxes, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Search, 
  Filter, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  ClipboardList, 
  Printer, 
  X, 
  Check, 
  FileCheck2, 
  Warehouse,
  Tag,
  ShieldAlert,
  Layers,
  Sparkles
} from 'lucide-react';
import { OperationsStorage } from '../../utils/operationsStorage';
import { 
  StoreInventoryItem, 
  GoodsReceivedNoteGRN, 
  StoreIssueVoucher,
  InventoryCategory,
  StoreLocation
} from '../../types/financeOperations';
import { User } from '../../types';
import { useTenant } from '../../context/TenantContext';

interface StoresPortalViewProps {
  currentUser: User;
}

export const StoresPortalView: React.FC<StoresPortalViewProps> = ({
  currentUser
}) => {
  const { currentTenant } = useTenant();
  const [subTab, setSubTab] = useState<'inventory' | 'grns' | 'sivs' | 'alerts'>('inventory');

  const [inventory, setInventory] = useState<StoreInventoryItem[]>([]);
  const [grns, setGrns] = useState<GoodsReceivedNoteGRN[]>([]);
  const [sivs, setSivs] = useState<StoreIssueVoucher[]>([]);

  // Search & category filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');

  // Modals
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [showGrnModal, setShowGrnModal] = useState(false);
  const [showSivModal, setShowSivModal] = useState(false);
  const [selectedGrnForPrint, setSelectedGrnForPrint] = useState<GoodsReceivedNoteGRN | null>(null);

  // New Item Form
  const [newItemName, setNewItemName] = useState('');
  const [newItemCode, setNewItemCode] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<InventoryCategory>('Classroom Stationery');
  const [newItemLocation, setNewItemLocation] = useState<StoreLocation>('Main Central Store');
  const [newItemUnit, setNewItemUnit] = useState('Pcs');
  const [newItemQty, setNewItemQty] = useState(50);
  const [newItemReorder, setNewItemReorder] = useState(15);
  const [newItemCost, setNewItemCost] = useState(500);

  // SIV Form
  const [issueRecipientName, setIssueRecipientName] = useState('');
  const [issueRecipientRole, setIssueRecipientRole] = useState('Class Teacher');
  const [issueDepartment, setIssueDepartment] = useState('Junior School Faculty');
  const [issuePurpose, setIssuePurpose] = useState('');
  const [issueItemId, setIssueItemId] = useState('');
  const [issueQuantity, setIssueQuantity] = useState(5);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = () => {
    setInventory(OperationsStorage.getStoreInventory(currentTenant.id));
    setGrns(OperationsStorage.getGRNs(currentTenant.id));
    setSivs(OperationsStorage.getSIVs(currentTenant.id));
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('stores-updated', handleUpdate);
    return () => window.removeEventListener('stores-updated', handleUpdate);
  }, [currentTenant.id]);

  const totalStockValue = inventory.reduce((acc, curr) => acc + curr.totalValue, 0);
  const lowStockItems = inventory.filter(i => i.currentStock <= i.reorderLevel);

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.itemCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesLoc = selectedLocation === 'all' || item.storeLocation === selectedLocation;
    return matchesSearch && matchesCat && matchesLoc;
  });

  const handleCreateNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const added = OperationsStorage.addStoreItem({
      tenantId: currentTenant.id,
      itemCode: newItemCode || `ITM-${Date.now().toString().slice(-4)}`,
      name: newItemName,
      category: newItemCategory,
      storeLocation: newItemLocation,
      unit: newItemUnit,
      currentStock: Number(newItemQty),
      reorderLevel: Number(newItemReorder),
      unitCost: Number(newItemCost),
      totalValue: Number(newItemQty) * Number(newItemCost),
      lastRestockedDate: new Date().toISOString().split('T')[0],
      supplierName: 'Approved Central Supplier'
    });

    setShowAddStockModal(false);
    setNewItemName('');
    loadData();
    setToastMessage(`Item "${added.name}" added to ${added.storeLocation} catalog!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleIssueStockVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    const item = inventory.find(i => i.id === issueItemId) || inventory[0];
    if (!item) return;

    if (issueQuantity > item.currentStock) {
      alert(`Cannot issue ${issueQuantity} ${item.unit}. Only ${item.currentStock} available in stock!`);
      return;
    }

    const siv = OperationsStorage.createSIV({
      tenantId: currentTenant.id,
      issueDate: new Date().toISOString().split('T')[0],
      issuedToName: issueRecipientName || 'Teacher / Class Representative',
      issuedToRole: issueRecipientRole,
      department: issueDepartment,
      purpose: issuePurpose || 'Classroom pedagogical materials distribution',
      issuedBy: currentUser.name || 'Storekeeper Joseph Otieno',
      items: [
        {
          itemId: item.id,
          itemName: item.name,
          quantity: Number(issueQuantity),
          unit: item.unit,
          unitCost: item.unitCost,
          totalCost: Number(issueQuantity) * item.unitCost
        }
      ],
      totalValue: Number(issueQuantity) * item.unitCost,
      status: 'Dispatched & Signed'
    });

    setShowSivModal(false);
    loadData();
    setToastMessage(`Store Issue Voucher ${siv.sivNumber} created! Stock decremented.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-amber-500/50 flex items-center gap-3 animate-in fade-in slide-in-from-bottom duration-300">
          <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* HEADER BAR */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Package className="w-5 h-5 text-amber-400" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black font-serif tracking-tight text-white">
              Central Stores & Inventory Management
            </h2>
            <span className="text-[10px] font-mono uppercase font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
              Perpetual Stock Active
            </span>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl">
            Real-time multi-location warehouse tracking, Goods Received Notes (GRN) linked to LPOs, departmental Store Issue Vouchers (SIV), and low-stock replenishment alerts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIssueItemId(inventory[0]?.id || '');
              setShowSivModal(true);
            }}
            className="px-4 py-2.5 rounded-xl text-xs font-black bg-white hover:bg-slate-100 text-slate-900 transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4 text-rose-600" />
            <span>Issue Stock (SIV)</span>
          </button>
          <button
            onClick={() => setShowAddStockModal(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Catalog Item</span>
          </button>
        </div>
      </div>

      {/* STORES KPI METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Stock Value</span>
            <Package className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            KES {totalStockValue.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500">
            Across {inventory.length} distinct item SKUs
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Goods Received (GRN)</span>
            <ArrowDownLeft className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-700 font-mono">
            {grns.length}
          </div>
          <div className="text-[11px] text-slate-500">
            100% inspected and verified against LPOs
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Dispatches (SIV)</span>
            <ArrowUpRight className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-700 font-mono">
            {sivs.length}
          </div>
          <div className="text-[11px] text-slate-500">
            Signed by class teachers and departments
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Low Stock Warnings</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-700 font-mono">
            {lowStockItems.length}
          </div>
          <div className="text-[11px] text-rose-600 font-semibold">
            {lowStockItems.length > 0 ? 'Replenishment requisitions required' : 'All items healthy'}
          </div>
        </div>
      </div>

      {/* SUB-TABS */}
      <div className="bg-slate-100 p-1.5 rounded-2xl border border-slate-200 flex items-center gap-1 overflow-x-auto">
        <button
          onClick={() => setSubTab('inventory')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            subTab === 'inventory'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Boxes className="w-4 h-4 text-emerald-600" />
          <span>Inventory Master Catalog ({inventory.length})</span>
        </button>

        <button
          onClick={() => setSubTab('grns')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            subTab === 'grns'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <ArrowDownLeft className="w-4 h-4 text-blue-600" />
          <span>Goods Received Notes - GRN ({grns.length})</span>
        </button>

        <button
          onClick={() => setSubTab('sivs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            subTab === 'sivs'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <ArrowUpRight className="w-4 h-4 text-purple-600" />
          <span>Store Issue Vouchers - SIV ({sivs.length})</span>
        </button>

        <button
          onClick={() => setSubTab('alerts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            subTab === 'alerts'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          <span>Low Stock Reorder Alerts ({lowStockItems.length})</span>
        </button>
      </div>

      {/* TAB 1: INVENTORY CATALOG */}
      {subTab === 'inventory' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-serif">
                Stores Physical Inventory & Valuation
              </h3>
              <p className="text-xs text-slate-500">
                Track unit balances across Central Store, Science Labs, Kitchen Pantry, and Sports Pavilion.
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search item or SKU..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl w-44 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold"
              >
                <option value="all">All Categories</option>
                <option value="Classroom Stationery">Stationery</option>
                <option value="Science Lab Reagents & Apparatus">Science Lab</option>
                <option value="Sports & Athletics Equipment">Sports Gear</option>
                <option value="Uniforms & Apparel">Uniforms</option>
                <option value="Kitchen Dry Provisions">Kitchen Food</option>
              </select>

              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold"
              >
                <option value="all">All Locations</option>
                <option value="Main Central Store">Main Central Store</option>
                <option value="Science Laboratory Store">Science Lab Store</option>
                <option value="Sports Equipment Shed">Sports Shed</option>
                <option value="Kitchen Pantry Store">Kitchen Pantry</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-mono font-bold text-[10px] border-y border-slate-200">
                <tr>
                  <th className="py-3 px-3">Item Code</th>
                  <th className="py-3 px-3">Description</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Store Location</th>
                  <th className="py-3 px-3">Stock Balance</th>
                  <th className="py-3 px-3">Unit Cost</th>
                  <th className="py-3 px-3">Total Value</th>
                  <th className="py-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInventory.map((item) => {
                  const isLow = item.currentStock <= item.reorderLevel;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-800">
                        {item.itemCode}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-950 font-serif">{item.name}</div>
                        <div className="text-[10px] text-slate-400">Supplier: {item.supplierName}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-600 text-[11px]">
                        {item.category}
                      </td>
                      <td className="py-3 px-3 text-slate-600 text-[11px]">
                        {item.storeLocation}
                      </td>
                      <td className="py-3 px-3 font-mono font-black text-sm">
                        <span className={isLow ? 'text-rose-600' : 'text-slate-900'}>
                          {item.currentStock} {item.unit}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-normal">Reorder at: {item.reorderLevel}</span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-700">
                        KES {item.unitCost.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-800">
                        KES {item.totalValue.toLocaleString()}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isLow 
                            ? 'bg-rose-100 text-rose-800 border border-rose-300' 
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}>
                          {isLow ? 'Low Stock' : 'Optimal'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: GOODS RECEIVED NOTES (GRN) */}
      {subTab === 'grns' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-serif">
                Goods Received Notes (GRN) Log
              </h3>
              <p className="text-xs text-slate-500">
                Verified delivery inspection records linked to approved Local Purchase Orders (LPO).
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-xl">
              Verified GRNs: {grns.length}
            </span>
          </div>

          <div className="space-y-4">
            {grns.map((grn) => (
              <div key={grn.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-blue-600 text-white">
                        {grn.grnNumber}
                      </span>
                      <h4 className="font-bold text-sm text-slate-950 font-serif">
                        From: {grn.vendorName}
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Inspection Passed
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Against LPO: <strong>{grn.lpoNumber}</strong> · Delivery Note: {grn.deliveryNoteNumber} · Received: {grn.receivedDate}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Received by: {grn.receivedBy} · Inspected by: {grn.inspectedBy}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Accepted Value</span>
                    <span className="font-mono text-lg font-black text-emerald-700">
                      KES {grn.totalAcceptedValue.toLocaleString()}
                    </span>
                    <div className="mt-1">
                      <button
                        onClick={() => setSelectedGrnForPrint(grn)}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Printer className="w-3 h-3 text-slate-600" />
                        <span>View Document</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-3 border border-slate-200 text-xs">
                  <div className="font-bold text-slate-700 mb-1">Delivered & Added to Physical Stock:</div>
                  <div className="space-y-1">
                    {grn.itemsReceived.map((it, idx) => (
                      <div key={idx} className="flex items-center justify-between text-slate-600 font-mono text-[11px]">
                        <span>• {it.itemName}</span>
                        <span>Ordered: {it.orderedQty} | Accepted: <strong className="text-emerald-700">{it.acceptedQty}</strong> | Rejected: {it.rejectedQty}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500 italic mt-2">
                    Remarks: "{grn.remarks}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: STORE ISSUE VOUCHERS (SIV) */}
      {subTab === 'sivs' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-serif">
                Store Issue Vouchers (SIV) & Departmental Dispatches
              </h3>
              <p className="text-xs text-slate-500">
                Audited stock issues to teachers, class streams, and campus operations.
              </p>
            </div>
            <button
              onClick={() => {
                setIssueItemId(inventory[0]?.id || '');
                setShowSivModal(true);
              }}
              className="px-3.5 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer border border-rose-200 flex items-center gap-1.5"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Issue Stock Voucher</span>
            </button>
          </div>

          <div className="space-y-4">
            {sivs.map((siv) => (
              <div key={siv.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-purple-600 text-white">
                        {siv.sivNumber}
                      </span>
                      <h4 className="font-bold text-sm text-slate-950 font-serif">
                        Issued To: {siv.issuedToName} ({siv.issuedToRole})
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                        {siv.department}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Issue Date: {siv.issueDate} · Authorized By: {siv.issuedBy}
                    </p>
                    <p className="text-xs text-slate-500 italic">
                      Purpose: "{siv.purpose}"
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Issued Asset Value</span>
                    <span className="font-mono text-lg font-black text-slate-900">
                      KES {siv.totalValue.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-3 border border-slate-200 text-xs">
                  {siv.items.map((it, idx) => (
                    <div key={idx} className="flex items-center justify-between font-mono text-[11px]">
                      <span>{it.itemName}</span>
                      <span><strong>{it.quantity} {it.unit}</strong> @ KES {it.unitCost} = KES {it.totalCost.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: LOW STOCK ALERTS */}
      {subTab === 'alerts' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="pb-4 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900 font-serif">
              Automated Reorder Threshold Alerts
            </h3>
            <p className="text-xs text-slate-500">
              Items currently at or below minimum safety stock levels requiring immediate purchase requisitions.
            </p>
          </div>

          <div className="space-y-3">
            {lowStockItems.map((item) => (
              <div key={item.id} className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <h4 className="font-bold text-sm text-rose-950 font-serif">{item.name}</h4>
                    <span className="text-xs font-mono font-bold text-rose-800 bg-white px-2 py-0.5 rounded border border-rose-300">
                      {item.itemCode}
                    </span>
                  </div>
                  <p className="text-xs text-rose-800">
                    Current Balance: <strong className="font-mono">{item.currentStock} {item.unit}</strong> · Minimum Safety Level: <strong className="font-mono">{item.reorderLevel} {item.unit}</strong>
                  </p>
                  <p className="text-[11px] text-rose-700">
                    Location: {item.storeLocation} · Preferred Supplier: {item.supplierName}
                  </p>
                </div>

                <button
                  onClick={() => alert(`Replenishment requisition template pre-filled for ${item.name}. Forwarding to Procurement...`)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer shrink-0"
                >
                  Create Requisition
                </button>
              </div>
            ))}

            {lowStockItems.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-xs">
                All inventory items are currently above their minimum safety reorder thresholds.
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW CATALOG ITEM */}
      {showAddStockModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm sm:text-base font-serif">Add New Store Catalog Item</h3>
              </div>
              <button onClick={() => setShowAddStockModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewItem} className="p-6 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Item Name *</label>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="e.g. Science Beaker 250ml"
                  required
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">SKU / Item Code</label>
                  <input
                    type="text"
                    value={newItemCode}
                    onChange={(e) => setNewItemCode(e.target.value)}
                    placeholder="e.g. LAB-BEA-01"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Unit of Measure</label>
                  <input
                    type="text"
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    placeholder="Pcs / Reams / Bottles"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Classroom Stationery">Classroom Stationery</option>
                    <option value="Science Lab Reagents & Apparatus">Science Lab</option>
                    <option value="Sports & Athletics Equipment">Sports Gear</option>
                    <option value="Uniforms & Apparel">Uniforms & Apparel</option>
                    <option value="Kitchen Dry Provisions">Kitchen Provisions</option>
                    <option value="Curriculum Textbooks">Curriculum Textbooks</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Store Location</label>
                  <select
                    value={newItemLocation}
                    onChange={(e) => setNewItemLocation(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Main Central Store">Main Central Store</option>
                    <option value="Science Laboratory Store">Science Lab Store</option>
                    <option value="Sports Equipment Shed">Sports Shed</option>
                    <option value="Kitchen Pantry Store">Kitchen Pantry</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Current Qty</label>
                  <input
                    type="number"
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(Number(e.target.value))}
                    min={0}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Reorder Level</label>
                  <input
                    type="number"
                    value={newItemReorder}
                    onChange={(e) => setNewItemReorder(Number(e.target.value))}
                    min={1}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Unit Cost (KES)</label>
                  <input
                    type="number"
                    value={newItemCost}
                    onChange={(e) => setNewItemCost(Number(e.target.value))}
                    min={0}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddStockModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save to Inventory</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: STORE ISSUE VOUCHER (SIV) */}
      {showSivModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-rose-400" />
                <h3 className="font-bold text-sm sm:text-base font-serif">Issue Store Materials (SIV)</h3>
              </div>
              <button onClick={() => setShowSivModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIssueStockVoucher} className="p-6 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Item to Issue *</label>
                <select
                  value={issueItemId}
                  onChange={(e) => setIssueItemId(e.target.value)}
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  {inventory.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.name} (Stock: {i.currentStock} {i.unit} - {i.storeLocation})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Quantity to Issue *</label>
                  <input
                    type="number"
                    value={issueQuantity}
                    onChange={(e) => setIssueQuantity(Number(e.target.value))}
                    min={1}
                    required
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Department</label>
                  <input
                    type="text"
                    value={issueDepartment}
                    onChange={(e) => setIssueDepartment(e.target.value)}
                    placeholder="e.g. Science Faculty"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Recipient Name *</label>
                  <input
                    type="text"
                    value={issueRecipientName}
                    onChange={(e) => setIssueRecipientName(e.target.value)}
                    placeholder="Teacher / Staff Name"
                    required
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Recipient Role</label>
                  <input
                    type="text"
                    value={issueRecipientRole}
                    onChange={(e) => setIssueRecipientRole(e.target.value)}
                    placeholder="e.g. Class Teacher"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Pedagogical / Operational Purpose</label>
                <input
                  type="text"
                  value={issuePurpose}
                  onChange={(e) => setIssuePurpose(e.target.value)}
                  placeholder="e.g. Term 1 Formative Assessment Portfolios distribution"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSivModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-500 text-white shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Dispatch & Deduct Stock</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW GRN DOCUMENT */}
      {selectedGrnForPrint && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-300 overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-blue-600" />
                <h4 className="font-bold text-sm text-slate-900 font-serif">Goods Received Note (GRN) Document</h4>
              </div>
              <button onClick={() => setSelectedGrnForPrint(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="printable-report border border-slate-300 p-5 rounded-2xl bg-white space-y-3 text-xs font-mono">
              <div className="text-center pb-2 border-b border-dashed border-slate-300 space-y-0.5">
                <div className="font-black text-sm font-serif uppercase tracking-tight text-slate-950">{currentTenant.name}</div>
                <div className="text-[10px] text-slate-500">Central Stores & Receiving Bay</div>
                <div className="font-extrabold text-xs pt-1 text-blue-800">GOODS RECEIVED NOTE (GRN)</div>
              </div>

              <div className="grid grid-cols-2 gap-1 text-[11px] py-1">
                <div><span className="text-slate-400">GRN No:</span> <strong className="text-slate-900">{selectedGrnForPrint.grnNumber}</strong></div>
                <div><span className="text-slate-400">Date:</span> <strong className="text-slate-900">{selectedGrnForPrint.receivedDate}</strong></div>
                <div><span className="text-slate-400">Supplier:</span> <strong className="text-slate-900">{selectedGrnForPrint.vendorName}</strong></div>
                <div><span className="text-slate-400">LPO Ref:</span> <strong className="text-slate-900">{selectedGrnForPrint.lpoNumber}</strong></div>
              </div>

              <table className="w-full text-left border-collapse border border-slate-300 my-2">
                <thead>
                  <tr className="bg-slate-100 text-[10px]">
                    <th className="p-1 border border-slate-300">Item</th>
                    <th className="p-1 border border-slate-300">Ordered</th>
                    <th className="p-1 border border-slate-300">Accepted</th>
                    <th className="p-1 border border-slate-300 text-right">Value (KES)</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedGrnForPrint.itemsReceived.map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-1 border border-slate-300">{it.itemName}</td>
                      <td className="p-1 border border-slate-300">{it.orderedQty}</td>
                      <td className="p-1 border border-slate-300 font-bold text-emerald-800">{it.acceptedQty}</td>
                      <td className="p-1 border border-slate-300 text-right font-bold">{(it.acceptedQty * it.unitCost).toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-black">
                    <td colSpan={3} className="p-1 border border-slate-300 text-right">TOTAL ACCEPTED VALUE:</td>
                    <td className="p-1 border border-slate-300 text-right text-emerald-800">KES {selectedGrnForPrint.totalAcceptedValue.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>

              <div className="text-[10px] text-slate-500 pt-1">
                Inspected by: <strong>{selectedGrnForPrint.inspectedBy}</strong> · Received by: {selectedGrnForPrint.receivedBy}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print GRN</span>
              </button>
              <button
                onClick={() => setSelectedGrnForPrint(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
