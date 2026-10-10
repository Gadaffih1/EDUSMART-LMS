import React, { useState, useMemo } from 'react';
import { 
  LabApparatusItem, 
  JSS_LAB_REQUIREMENTS 
} from './labInventoryData';
import { 
  Boxes, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  Flame, 
  ShieldAlert, 
  Tag, 
  MapPin, 
  FileSpreadsheet, 
  Download,
  Info
} from 'lucide-react';

interface LaboratoryInventoryViewProps {
  onSelectApparatus?: (item: LabApparatusItem) => void;
  highlightCategory?: string;
}

export const LaboratoryInventoryView: React.FC<LaboratoryInventoryViewProps> = ({
  onSelectApparatus,
  highlightCategory
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<'ALL' | 'A' | 'B' | 'C'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>(highlightCategory || 'ALL');
  const [selectedHazard, setSelectedHazard] = useState<string>('ALL');

  const categories = [
    'ALL',
    'Chemical Reagent',
    'Indicator & Acid/Base',
    'Physics & Electrical',
    'Measurement & Optics',
    'Glassware & Apparatus',
    'Separation & Biology',
    'Safety & Furniture'
  ];

  const filteredItems = useMemo(() => {
    return JSS_LAB_REQUIREMENTS.filter(item => {
      // Search matches
      const matchesSearch = 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(item.itemNumber) === searchQuery.trim();

      // Section matches
      const matchesSection = selectedSection === 'ALL' || item.section === selectedSection;

      // Category matches
      const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;

      // Hazard matches
      const matchesHazard = selectedHazard === 'ALL' || item.hazardClass === selectedHazard;

      return matchesSearch && matchesSection && matchesCategory && matchesHazard;
    });
  }, [searchQuery, selectedSection, selectedCategory, selectedHazard]);

  const stats = useMemo(() => {
    return {
      total: JSS_LAB_REQUIREMENTS.length,
      sectionA: JSS_LAB_REQUIREMENTS.filter(i => i.section === 'A').length,
      sectionB: JSS_LAB_REQUIREMENTS.filter(i => i.section === 'B').length,
      sectionC: JSS_LAB_REQUIREMENTS.filter(i => i.section === 'C').length,
      chemicals: JSS_LAB_REQUIREMENTS.filter(i => i.category === 'Chemical Reagent' || i.category === 'Indicator & Acid/Base').length,
      physics: JSS_LAB_REQUIREMENTS.filter(i => i.category === 'Physics & Electrical' || i.category === 'Measurement & Optics').length
    };
  }, []);

  const getHazardBadge = (hazard?: LabApparatusItem['hazardClass']) => {
    switch (hazard) {
      case 'Corrosive':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-200"><AlertTriangle className="w-2.5 h-2.5" /> Corrosive</span>;
      case 'Flammable':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200"><Flame className="w-2.5 h-2.5" /> Flammable</span>;
      case 'Oxidizing':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200"><Flame className="w-2.5 h-2.5" /> Oxidizing</span>;
      case 'Toxic':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-800 border border-red-200"><ShieldAlert className="w-2.5 h-2.5" /> Toxic</span>;
      case 'Irritant':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-100 text-orange-800 border border-orange-200"><AlertTriangle className="w-2.5 h-2.5" /> Irritant</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200"><CheckCircle2 className="w-2.5 h-2.5" /> General Safe</span>;
    }
  };

  const exportCSV = () => {
    const headers = ['Item No', 'Name', 'Description', 'Quantity', 'Section', 'Category', 'Location', 'Hazard'];
    const rows = filteredItems.map(i => [
      i.itemNumber,
      `"${i.name.replace(/"/g, '""')}"`,
      `"${i.description.replace(/"/g, '""')}"`,
      `"${i.quantity} ${i.unit}"`,
      i.section,
      i.category,
      `"${i.location}"`,
      i.hazardClass || 'Safe'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `EduSmart_JSS_Science_Lab_Inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                CBC Junior Secondary School (JSS)
              </span>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                75 Standard Verified Items
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
              <Boxes className="w-6 h-6 text-emerald-600" />
              <span>Science Laboratory Requirements & Apparatus Inventory</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Complete inventory of equipment, chemical reagents, glassware, and measurement tools required for CBC Grade 7–9 practical investigations (Sections A, B, and C).
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={exportCSV}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              title="Export complete JSS laboratory requirements to CSV spreadsheet"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Statistical Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-5 pt-5 border-t border-slate-100">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Total Inventory</span>
            <div className="text-xl font-black text-slate-900 mt-0.5">{stats.total} Items</div>
            <span className="text-[10px] text-emerald-700 font-semibold">100% Verified</span>
          </div>

          <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200/80">
            <span className="text-[11px] font-bold text-emerald-800 uppercase">Section A (JSS)</span>
            <div className="text-xl font-black text-emerald-950 mt-0.5">{stats.sectionA} Items</div>
            <span className="text-[10px] text-emerald-700 font-semibold">Core Science Apparatus</span>
          </div>

          <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200/80">
            <span className="text-[11px] font-bold text-blue-800 uppercase">Section B</span>
            <div className="text-xl font-black text-blue-950 mt-0.5">{stats.sectionB} Items</div>
            <span className="text-[10px] text-blue-700 font-semibold">Cells, Ink, Reagents</span>
          </div>

          <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200/80">
            <span className="text-[11px] font-bold text-amber-800 uppercase">Section C</span>
            <div className="text-xl font-black text-amber-950 mt-0.5">{stats.sectionC} Items</div>
            <span className="text-[10px] text-amber-700 font-semibold">Safety & Workshop Stools</span>
          </div>

          <div className="bg-purple-50/70 p-3 rounded-xl border border-purple-200/80">
            <span className="text-[11px] font-bold text-purple-800 uppercase">Chemicals & pH</span>
            <div className="text-xl font-black text-purple-950 mt-0.5">{stats.chemicals} Units</div>
            <span className="text-[10px] text-purple-700 font-semibold">Acids, Bases & Indicators</span>
          </div>

          <div className="bg-cyan-50/70 p-3 rounded-xl border border-cyan-200/80">
            <span className="text-[11px] font-bold text-cyan-800 uppercase">Physics & Optics</span>
            <div className="text-xl font-black text-cyan-950 mt-0.5">{stats.physics} Units</div>
            <span className="text-[10px] text-cyan-700 font-semibold">Balances, Calipers, Circuits</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by item number (#1-75), apparatus name, chemical formula, or location..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-emerald-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Section Filter Switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 self-start md:self-center shrink-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase px-2">Section:</span>
            {(['ALL', 'A', 'B', 'C'] as const).map(sec => (
              <button
                key={sec}
                onClick={() => setSelectedSection(sec)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedSection === sec
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {sec === 'ALL' ? 'All (75)' : `Section ${sec}`}
              </button>
            ))}
          </div>
        </div>

        {/* Category Pills Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Category:
          </span>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Showing <strong className="text-slate-900 font-bold">{filteredItems.length}</strong> of 75 laboratory items</span>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-[11px] font-medium text-emerald-800">All Items Active in Virtual Laboratory</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No.</th>
                <th className="py-3 px-4">Item & Specification</th>
                <th className="py-3 px-4">Description / Grade</th>
                <th className="py-3 px-4 w-28 text-center">Quantity</th>
                <th className="py-3 px-4 w-20 text-center">Sec</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Storage Location</th>
                <th className="py-3 px-4">Hazard / Safety</th>
                <th className="py-3 px-4">Used In Experiments</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map(item => (
                <tr 
                  key={item.id}
                  onClick={() => onSelectApparatus?.(item)}
                  className="hover:bg-emerald-50/40 transition-colors group cursor-pointer"
                >
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-400 group-hover:text-emerald-700">
                    #{item.itemNumber}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 group-hover:text-emerald-900">
                      {item.name}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600 text-[11px] max-w-xs">
                    {item.description}
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                    <span className="bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                      {item.quantity} {item.unit !== item.quantity ? item.unit : ''}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                      item.section === 'A' ? 'bg-emerald-100 text-emerald-800' :
                      item.section === 'B' ? 'bg-blue-100 text-blue-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      Sec {item.section}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[11px] text-slate-600 font-medium">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-[11px] flex items-center gap-1 mt-2">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{item.location}</span>
                  </td>
                  <td className="py-3 px-4">
                    {getHazardBadge(item.hazardClass)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {item.usedInExperiments.map((exp, idx) => (
                        <span 
                          key={idx}
                          className="text-[9px] font-semibold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200/60"
                        >
                          {exp}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                    No laboratory apparatus matched your search or filters. Try clearing your search parameters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Safety Notice Footer Card */}
      <div className="bg-emerald-50/80 rounded-2xl border border-emerald-200 p-4 sm:p-5 flex items-start gap-3 text-xs">
        <Info className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="space-y-1 text-emerald-950">
          <div className="font-bold">Standard Kenya JSS Ministry & CBC Practical Compliance:</div>
          <p className="text-emerald-800 leading-relaxed text-[11px]">
            All 75 items above are registered in the EduSmart Science Workbench simulation engine. Grade 5–9 learners can interactively combine indicators, chemicals, cells, lenses, balances, and condensers directly within the browser without risk of chemical spills or equipment damage.
          </p>
        </div>
      </div>
    </div>
  );
};
