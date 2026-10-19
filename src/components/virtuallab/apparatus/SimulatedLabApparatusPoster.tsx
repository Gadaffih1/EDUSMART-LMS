import React, { useState, useMemo } from 'react';
import { 
  Boxes, 
  Search, 
  Filter, 
  Maximize2, 
  Minimize2, 
  Sparkles, 
  Eye, 
  Flame, 
  Zap, 
  Atom, 
  Layers, 
  BookOpen, 
  CheckCircle2, 
  Info, 
  ChevronRight,
  ShieldCheck,
  Tag
} from 'lucide-react';
import { LabApparatusItem, JSS_LAB_REQUIREMENTS } from '../labInventoryData';
import { SimulatedApparatusGraphics } from './SimulatedApparatusGraphics';
import { ApparatusDemonstrationModal } from './ApparatusDemonstrationModal';

interface SimulatedLabApparatusPosterProps {
  onSelectApparatus?: (item: LabApparatusItem) => void;
  className?: string;
}

export const SimulatedLabApparatusPoster: React.FC<SimulatedLabApparatusPosterProps> = ({
  onSelectApparatus,
  className = ''
}) => {
  const [selectedStation, setSelectedStation] = useState<'ALL' | 'CHEM' | 'PHYS' | 'BIO' | 'SAFETY'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredItem, setHoveredItem] = useState<LabApparatusItem | null>(null);
  const [selectedItemForDemo, setSelectedItemForDemo] = useState<number | null>(null);
  const [showItemBadges, setShowItemBadges] = useState(true);
  const [isPosterFullscreen, setIsPosterFullscreen] = useState(false);

  // Group items by laboratory bench station
  const stationGroups = useMemo(() => {
    return {
      CHEM: JSS_LAB_REQUIREMENTS.filter(i => 
        i.category === 'Chemical Reagent' || i.category === 'Indicator & Acid/Base'
      ),
      PHYS: JSS_LAB_REQUIREMENTS.filter(i => 
        i.category === 'Physics & Electrical' || i.category === 'Measurement & Optics'
      ),
      BIO: JSS_LAB_REQUIREMENTS.filter(i => 
        i.category === 'Glassware & Apparatus' || i.category === 'Separation & Biology'
      ),
      SAFETY: JSS_LAB_REQUIREMENTS.filter(i => 
        i.category === 'Safety & Furniture'
      )
    };
  }, []);

  const filteredItems = useMemo(() => {
    return JSS_LAB_REQUIREMENTS.filter(item => {
      const matchSearch = searchQuery === '' || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(item.itemNumber) === searchQuery.trim();
      const matchStation = selectedStation === 'ALL' ||
        (selectedStation === 'CHEM' && (item.category === 'Chemical Reagent' || item.category === 'Indicator & Acid/Base')) ||
        (selectedStation === 'PHYS' && (item.category === 'Physics & Electrical' || item.category === 'Measurement & Optics')) ||
        (selectedStation === 'BIO' && (item.category === 'Glassware & Apparatus' || item.category === 'Separation & Biology')) ||
        (selectedStation === 'SAFETY' && item.category === 'Safety & Furniture');
      return matchSearch && matchStation;
    });
  }, [searchQuery, selectedStation]);

  const handleOpenApparatusDemo = (itemNumber: number) => {
    setSelectedItemForDemo(itemNumber);
    const found = JSS_LAB_REQUIREMENTS.find(i => i.itemNumber === itemNumber);
    if (found && onSelectApparatus) onSelectApparatus(found);
  };

  return (
    <div className={`space-y-4 ${className} ${isPosterFullscreen ? 'fixed inset-0 z-50 bg-slate-950 p-6 overflow-y-auto' : ''}`}>
      {/* Top Banner & Visual Controls */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-md border border-emerald-800/40 relative overflow-hidden">
        {/* Background Decorative Pattern */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-300" />
                Simulated Laboratory Bench Master Display
              </span>
              <span className="text-[10px] font-bold bg-white/10 text-slate-300 px-2 py-0.5 rounded-full">
                75 Standard CBC Verified Items
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
              <Boxes className="w-6 h-6 text-emerald-400" />
              <span>Simulated Science Laboratory Apparatus & Requirements Inventory</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              High-resolution simulated scientific display of all 75 laboratory apparatus. Teachers can click any apparatus to demonstrate its anatomy, physical/chemical principles, safe handling, and live interactive operation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
            <button
              onClick={() => setShowItemBadges(!showItemBadges)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                showItemBadges
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                  : 'bg-white/10 text-slate-300 border-white/20 hover:bg-white/20'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>{showItemBadges ? 'Hide Tags (#1-75)' : 'Show Tags (#1-75)'}</span>
            </button>

            <button
              onClick={() => setIsPosterFullscreen(!isPosterFullscreen)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {isPosterFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span>{isPosterFullscreen ? 'Exit Projector' : 'Projector Mode'}</span>
            </button>
          </div>
        </div>

        {/* Filter & Station Switcher Bar */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          {/* Station Switcher */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar p-1 bg-black/30 rounded-xl border border-white/10">
            {[
              { id: 'ALL', label: 'All 4 Workbenches (75 Items)', icon: Boxes },
              { id: 'CHEM', label: 'Reagents & pH (30)', icon: Flame },
              { id: 'PHYS', label: 'Physics & Mechanics (15)', icon: Zap },
              { id: 'BIO', label: 'Glassware & Optics (25)', icon: Atom },
              { id: 'SAFETY', label: 'Safety & Furniture (5)', icon: ShieldCheck }
            ].map(st => {
              const Icon = st.icon;
              const isSelected = selectedStation === st.id;
              return (
                <button
                  key={st.id}
                  onClick={() => setSelectedStation(st.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500 text-slate-950 font-black shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{st.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter apparatus #1-75 or name..."
              className="w-full pl-8 pr-3 py-1.5 bg-black/30 border border-white/15 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-emerald-400 focus:bg-black/50 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SIMULATED LABORATORY WORKBENCHES PANORAMA */}
      {/* ============================================================== */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 p-5 sm:p-7 shadow-xl relative overflow-hidden space-y-8">
        {/* Lab Counter Lighting Shimmer */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-40"></div>

        {/* WORKBENCH 1: CHEMISTRY & REAGENTS STATION */}
        {(selectedStation === 'ALL' || selectedStation === 'CHEM') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <span>Workbench Station 1: Chemical Reagents, Indicators & Acid-Base Table</span>
                </h3>
              </div>
              <span className="text-[11px] font-mono text-purple-300 font-bold">
                Items #1–23, #43, #45, #47, #55–59, #68, #71, #75
              </span>
            </div>

            {/* Workbench Surface */}
            <div className="bg-gradient-to-b from-slate-800 to-slate-900/90 rounded-2xl border border-slate-700/80 p-4 sm:p-5 shadow-inner">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {stationGroups.CHEM.map(item => {
                  const isHighlighted = searchQuery === '' || 
                    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    String(item.itemNumber) === searchQuery.trim();

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleOpenApparatusDemo(item.itemNumber)}
                      onMouseEnter={() => setHoveredItem(item)}
                      onMouseLeave={() => setHoveredItem(null)}
                      className={`group relative p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isHighlighted
                          ? 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 hover:border-purple-400 shadow-md hover:-translate-y-0.5'
                          : 'opacity-30 bg-slate-900 border-slate-800'
                      }`}
                    >
                      {/* Item Tag Number */}
                      {showItemBadges && (
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[9px] font-mono font-black px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            #{item.itemNumber}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400">
                            Sec {item.section}
                          </span>
                        </div>
                      )}

                      {/* Simulated Graphical Mini-Vessel */}
                      <div className="h-20 w-full flex items-center justify-center py-1">
                        <SimulatedApparatusGraphics
                          diagramType={item.itemNumber === 2 ? 'indicator_paper' : 'reagent_bottle'}
                          interactiveState={{
                            liquidColor: item.itemNumber === 1 ? '#9333ea' : 
                                         item.itemNumber === 3 ? '#f97316' : 
                                         item.itemNumber === 4 ? '#ec4899' : 
                                         item.itemNumber === 15 || item.itemNumber === 16 ? '#dc2626' : 
                                         item.itemNumber === 13 || item.itemNumber === 18 ? '#2563eb' : '#10b981',
                            labelText: item.name.slice(0, 18)
                          }}
                          showLabels={false}
                          className="w-16 h-16 drop-shadow group-hover:scale-110 transition-transform"
                        />
                      </div>

                      {/* Name & Quantity */}
                      <div className="mt-2 text-center">
                        <div className="text-[11px] font-bold text-white group-hover:text-purple-300 truncate" title={item.name}>
                          {item.name}
                        </div>
                        <div className="text-[9px] text-slate-400 mt-0.5 truncate font-mono">
                          {item.quantity} {item.unit !== item.quantity ? item.unit : ''}
                        </div>
                      </div>

                      {/* Hover Quick Action Cue */}
                      <div className="mt-2 pt-1 border-t border-slate-700/60 flex items-center justify-center gap-1 text-[9px] text-purple-300 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Eye className="w-2.5 h-2.5" />
                        <span>Demonstrate</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* WORKBENCH 2: PHYSICS, MEASUREMENT & MECHANICS */}
        {(selectedStation === 'ALL' || selectedStation === 'PHYS') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <span>Workbench Station 2: Measurement, Mechanics, Balances & Displacement Table</span>
                </h3>
              </div>
              <span className="text-[11px] font-mono text-blue-300 font-bold">
                Items #24–28, #30, #48 (Eureka Cans, Vernier Calipers, Spring Balances)
              </span>
            </div>

            <div className="bg-gradient-to-b from-slate-800 to-slate-900/90 rounded-2xl border border-slate-700/80 p-4 sm:p-5 shadow-inner">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {stationGroups.PHYS.map(item => {
                  const isHighlighted = searchQuery === '' || 
                    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    String(item.itemNumber) === searchQuery.trim();

                  let diagram = 'generic_apparatus';
                  if (item.itemNumber === 24) diagram = 'balance_scale';
                  else if (item.itemNumber === 25) diagram = 'eureka_can';
                  else if (item.itemNumber === 26) diagram = 'vernier_calipers';
                  else if (item.itemNumber === 27) diagram = 'spring_balance';

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleOpenApparatusDemo(item.itemNumber)}
                      onMouseEnter={() => setHoveredItem(item)}
                      onMouseLeave={() => setHoveredItem(null)}
                      className={`group relative p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isHighlighted
                          ? 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 hover:border-blue-400 shadow-md hover:-translate-y-0.5'
                          : 'opacity-30 bg-slate-900 border-slate-800'
                      }`}
                    >
                      {showItemBadges && (
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[9px] font-mono font-black px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            #{item.itemNumber}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400">
                            Sec {item.section}
                          </span>
                        </div>
                      )}

                      <div className="h-20 w-full flex items-center justify-center py-1">
                        <SimulatedApparatusGraphics
                          diagramType={diagram}
                          interactiveState={{}}
                          showLabels={false}
                          className="w-18 h-18 drop-shadow group-hover:scale-110 transition-transform"
                        />
                      </div>

                      <div className="mt-2 text-center">
                        <div className="text-[11px] font-bold text-white group-hover:text-blue-300 truncate" title={item.name}>
                          {item.name}
                        </div>
                        <div className="text-[9px] text-slate-400 mt-0.5 truncate font-mono">
                          {item.quantity} {item.unit !== item.quantity ? item.unit : ''}
                        </div>
                      </div>

                      <div className="mt-2 pt-1 border-t border-slate-700/60 flex items-center justify-center gap-1 text-[9px] text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Eye className="w-2.5 h-2.5" />
                        <span>Demonstrate</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* WORKBENCH 3: GLASSWARE, SEPARATION, BIOLOGY & MICROSCOPY */}
        {(selectedStation === 'ALL' || selectedStation === 'BIO') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <span>Workbench Station 3: Borosilicate Glassware, Separation Funnels & Microscopy</span>
                </h3>
              </div>
              <span className="text-[11px] font-mono text-cyan-300 font-bold">
                Items #5, #31, #33, #35–38, #42, #46, #60–63, #65–66
              </span>
            </div>

            <div className="bg-gradient-to-b from-slate-800 to-slate-900/90 rounded-2xl border border-slate-700/80 p-4 sm:p-5 shadow-inner">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {stationGroups.BIO.map(item => {
                  const isHighlighted = searchQuery === '' || 
                    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    String(item.itemNumber) === searchQuery.trim();

                  let diagram = 'generic_apparatus';
                  if (item.itemNumber === 36) diagram = 'separating_funnel';
                  else if (item.itemNumber === 37) diagram = 'condenser';
                  else if (item.itemNumber === 31 || item.itemNumber === 33) diagram = 'microscope';
                  else if (item.itemNumber === 46) diagram = 'reagent_bottle';

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleOpenApparatusDemo(item.itemNumber)}
                      onMouseEnter={() => setHoveredItem(item)}
                      onMouseLeave={() => setHoveredItem(null)}
                      className={`group relative p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isHighlighted
                          ? 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 hover:border-cyan-400 shadow-md hover:-translate-y-0.5'
                          : 'opacity-30 bg-slate-900 border-slate-800'
                      }`}
                    >
                      {showItemBadges && (
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[9px] font-mono font-black px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            #{item.itemNumber}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400">
                            Sec {item.section}
                          </span>
                        </div>
                      )}

                      <div className="h-20 w-full flex items-center justify-center py-1">
                        <SimulatedApparatusGraphics
                          diagramType={diagram}
                          interactiveState={{}}
                          showLabels={false}
                          className="w-18 h-18 drop-shadow group-hover:scale-110 transition-transform"
                        />
                      </div>

                      <div className="mt-2 text-center">
                        <div className="text-[11px] font-bold text-white group-hover:text-cyan-300 truncate" title={item.name}>
                          {item.name}
                        </div>
                        <div className="text-[9px] text-slate-400 mt-0.5 truncate font-mono">
                          {item.quantity} {item.unit !== item.quantity ? item.unit : ''}
                        </div>
                      </div>

                      <div className="mt-2 pt-1 border-t border-slate-700/60 flex items-center justify-center gap-1 text-[9px] text-cyan-300 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Eye className="w-2.5 h-2.5" />
                        <span>Demonstrate</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* WORKBENCH 4: ELECTRICAL CIRCUITS, MAGNETISM, HEATING & SAFETY */}
        {(selectedStation === 'ALL' || selectedStation === 'SAFETY' || selectedStation === 'PHYS') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <span>Workbench Station 4: Electrical Circuits, Heating, Magnets & Safety PPE</span>
                </h3>
              </div>
              <span className="text-[11px] font-mono text-amber-300 font-bold">
                Items #29, #34, #44, #50–52, #64, #67, #69, #70, #72–74
              </span>
            </div>

            <div className="bg-gradient-to-b from-slate-800 to-slate-900/90 rounded-2xl border border-slate-700/80 p-4 sm:p-5 shadow-inner">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {[...stationGroups.SAFETY, ...JSS_LAB_REQUIREMENTS.filter(i => [29, 34, 44, 50, 51, 52, 64, 67, 69, 70].includes(i.itemNumber))].map(item => {
                  const isHighlighted = searchQuery === '' || 
                    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    String(item.itemNumber) === searchQuery.trim();

                  let diagram = 'generic_apparatus';
                  if (item.itemNumber === 29 || item.itemNumber === 50 || item.itemNumber === 51 || item.itemNumber === 52) diagram = 'circuit_switch';
                  else if (item.itemNumber === 44) diagram = 'magnet';
                  else if (item.itemNumber === 69) diagram = 'bunsen_burner';
                  else if (item.itemNumber === 72 || item.itemNumber === 73) diagram = 'safety_gear';

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleOpenApparatusDemo(item.itemNumber)}
                      onMouseEnter={() => setHoveredItem(item)}
                      onMouseLeave={() => setHoveredItem(null)}
                      className={`group relative p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isHighlighted
                          ? 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 hover:border-amber-400 shadow-md hover:-translate-y-0.5'
                          : 'opacity-30 bg-slate-900 border-slate-800'
                      }`}
                    >
                      {showItemBadges && (
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[9px] font-mono font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            #{item.itemNumber}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400">
                            Sec {item.section}
                          </span>
                        </div>
                      )}

                      <div className="h-20 w-full flex items-center justify-center py-1">
                        <SimulatedApparatusGraphics
                          diagramType={diagram}
                          interactiveState={{ isClosed: true, isOpen: false }}
                          showLabels={false}
                          className="w-18 h-18 drop-shadow group-hover:scale-110 transition-transform"
                        />
                      </div>

                      <div className="mt-2 text-center">
                        <div className="text-[11px] font-bold text-white group-hover:text-amber-300 truncate" title={item.name}>
                          {item.name}
                        </div>
                        <div className="text-[9px] text-slate-400 mt-0.5 truncate font-mono">
                          {item.quantity} {item.unit !== item.quantity ? item.unit : ''}
                        </div>
                      </div>

                      <div className="mt-2 pt-1 border-t border-slate-700/60 flex items-center justify-center gap-1 text-[9px] text-amber-300 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Eye className="w-2.5 h-2.5" />
                        <span>Demonstrate</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Hover Inspector Indicator */}
      {hoveredItem && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xl flex items-center justify-between gap-4 transition-all">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 font-mono font-black text-sm flex items-center justify-center shrink-0">
              #{hoveredItem.itemNumber}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                  {hoveredItem.category}
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  Storage: {hoveredItem.location}
                </span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm mt-0.5">{hoveredItem.name}</h4>
              <p className="text-xs text-slate-500 line-clamp-1">{hoveredItem.description}</p>
            </div>
          </div>

          <button
            onClick={() => handleOpenApparatusDemo(hoveredItem.itemNumber)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <span>Launch Demonstration</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Apparatus Demonstration Modal */}
      {selectedItemForDemo !== null && (
        <ApparatusDemonstrationModal
          initialItemNumber={selectedItemForDemo}
          isOpen={true}
          onClose={() => setSelectedItemForDemo(null)}
        />
      )}
    </div>
  );
};
