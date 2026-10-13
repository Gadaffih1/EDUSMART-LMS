import React, { useState, useEffect, useRef } from 'react';
import { 
  Atom, 
  FlaskConical, 
  X, 
  RotateCw, 
  Info, 
  ShieldAlert, 
  FileText, 
  Sparkles, 
  Printer, 
  CheckCircle2, 
  Layers,
  Search,
  ExternalLink
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { PrintReportModal } from '../common/PrintReportModal';

export interface ScientificMolecule {
  id: string;
  name: string;
  formula: string;
  commonName: string;
  molecularWeight: number;
  pubchemCID: number;
  smiles: string;
  iupacName: string;
  cbcTopic: string;
  gradeLevel: number;
  description: string;
  biologicalRole: string;
  safetyNotes: string;
  atoms: Array<{ symbol: string; x: number; y: number; z: number; color: string; radius: number }>;
  bonds: Array<[number, number]>;
}

export const SCIENCE_CBC_MOLECULES: ScientificMolecule[] = [
  {
    id: 'mol-water',
    name: 'Water',
    commonName: 'Water (Dihydrogen Monoxide)',
    formula: 'H₂O',
    molecularWeight: 18.015,
    pubchemCID: 962,
    smiles: 'O',
    iupacName: 'oxidane',
    cbcTopic: 'States of Matter & Physical Properties',
    gradeLevel: 5,
    description: 'The universal biological solvent essential for all known living organisms on Earth. Forms polar hydrogen bonds.',
    biologicalRole: 'Solvent in cellular cytoplasm, plant sap transport, transpiration, and temperature regulation in animals.',
    safetyNotes: 'Non-toxic, safe for standard classroom laboratory investigations.',
    atoms: [
      { symbol: 'O', x: 0, y: 0, z: 0, color: '#ef4444', radius: 18 },
      { symbol: 'H', x: -35, y: 25, z: 5, color: '#f8fafc', radius: 10 },
      { symbol: 'H', x: 35, y: 25, z: -5, color: '#f8fafc', radius: 10 }
    ],
    bonds: [[0, 1], [0, 2]]
  },
  {
    id: 'mol-co2',
    name: 'Carbon Dioxide',
    commonName: 'Carbon Dioxide Gas',
    formula: 'CO₂',
    molecularWeight: 44.009,
    pubchemCID: 280,
    smiles: 'O=C=O',
    iupacName: 'carbon dioxide',
    cbcTopic: 'Gaseous Exchange & Plant Photosynthesis',
    gradeLevel: 6,
    description: 'Linear molecule consisting of a carbon atom covalently double-bonded to two oxygen atoms.',
    biologicalRole: 'Key reactant in plant photosynthesis; cellular waste product of aerobic respiration in human beings and animals.',
    safetyNotes: 'Asphyxiant at high concentrations. Use well-ventilated laboratory benches.',
    atoms: [
      { symbol: 'C', x: 0, y: 0, z: 0, color: '#334155', radius: 14 },
      { symbol: 'O', x: -45, y: 0, z: 0, color: '#ef4444', radius: 16 },
      { symbol: 'O', x: 45, y: 0, z: 0, color: '#ef4444', radius: 16 }
    ],
    bonds: [[0, 1], [0, 2]]
  },
  {
    id: 'mol-glucose',
    name: 'D-Glucose',
    commonName: 'Blood Sugar / Plant Sugar',
    formula: 'C₆H₁₂O₆',
    molecularWeight: 180.156,
    pubchemCID: 5793,
    smiles: 'C(C1C(C(C(C(O1)O)O)O)O)O',
    iupacName: '(2R,3S,4R,5R)-2,3,4,5,6-pentahydroxyhexanal',
    cbcTopic: 'Plant Nutrition, Starch Synthesis & Energy',
    gradeLevel: 7,
    description: 'A hexose monosaccharide and primary fuel source for cellular respiration in living cells.',
    biologicalRole: 'Produced during photosynthesis in chloroplasts; stored in seeds, tubers, and maize grains as starch.',
    safetyNotes: 'Food-grade compound; safe for Benedict’s test and iodine practical tests.',
    atoms: [
      { symbol: 'C', x: -40, y: -20, z: 0, color: '#334155', radius: 14 },
      { symbol: 'C', x: -10, y: -35, z: 10, color: '#334155', radius: 14 },
      { symbol: 'C', x: 25, y: -20, z: 5, color: '#334155', radius: 14 },
      { symbol: 'C', x: 30, y: 15, z: -10, color: '#334155', radius: 14 },
      { symbol: 'C', x: 0, y: 35, z: -15, color: '#334155', radius: 14 },
      { symbol: 'O', x: -35, y: 15, z: -5, color: '#ef4444', radius: 16 },
      { symbol: 'O', x: 55, y: 20, z: -15, color: '#ef4444', radius: 14 },
      { symbol: 'O', x: 45, y: -35, z: 10, color: '#ef4444', radius: 14 },
      { symbol: 'O', x: -15, y: -55, z: 20, color: '#ef4444', radius: 14 }
    ],
    bonds: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [3, 6], [2, 7], [1, 8]]
  },
  {
    id: 'mol-nacl',
    name: 'Sodium Chloride',
    commonName: 'Common Table Salt',
    formula: 'NaCl',
    molecularWeight: 58.44,
    pubchemCID: 5234,
    smiles: '[Na+].[Cl-]',
    iupacName: 'sodium chloride',
    cbcTopic: 'Separation of Mixtures, Evaporation & Crystals',
    gradeLevel: 6,
    description: 'Ionic lattice formed by electrostatic attraction between sodium cations (Na+) and chloride anions (Cl-).',
    biologicalRole: 'Maintains osmotic balance in blood and bodily fluids; critical electrolyte in nerve transmission.',
    safetyNotes: 'Non-flammable. Avoid eye contact with concentrated brine solution.',
    atoms: [
      { symbol: 'Na', x: -30, y: 0, z: 0, color: '#8b5cf6', radius: 18 },
      { symbol: 'Cl', x: 30, y: 0, z: 0, color: '#10b981', radius: 22 }
    ],
    bonds: [[0, 1]]
  },
  {
    id: 'mol-o2',
    name: 'Oxygen Gas',
    commonName: 'Diatomic Oxygen',
    formula: 'O₂',
    molecularWeight: 31.998,
    pubchemCID: 977,
    smiles: 'O=O',
    iupacName: 'molecular oxygen',
    cbcTopic: 'Air & Combustion, Breathing & Aerobic Respiration',
    gradeLevel: 5,
    description: 'Diatomic gas making up ~21% of Earth’s atmosphere. Strong oxidizing agent supporting combustion.',
    biologicalRole: 'Terminal electron acceptor in cellular mitochondria; essential for animal and human life.',
    safetyNotes: 'Strong supporter of combustion. Keep away from open Bunsen flames and grease.',
    atoms: [
      { symbol: 'O', x: -25, y: 0, z: 0, color: '#ef4444', radius: 16 },
      { symbol: 'O', x: 25, y: 0, z: 0, color: '#ef4444', radius: 16 }
    ],
    bonds: [[0, 1]]
  }
];

interface ScienceViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMoleculeId?: string;
}

export const ScienceViewerModal: React.FC<ScienceViewerModalProps> = ({
  isOpen,
  onClose,
  initialMoleculeId = 'mol-water'
}) => {
  const { currentTenant } = useTenant();
  const [selectedMolecule, setSelectedMolecule] = useState<ScientificMolecule>(() => {
    return SCIENCE_CBC_MOLECULES.find(m => m.id === initialMoleculeId) || SCIENCE_CBC_MOLECULES[0];
  });

  const [rotationAngle, setRotationAngle] = useState({ x: 0, y: 0 });
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [showPrintModal, setShowPrintModal] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Auto-rotation animation loop
  useEffect(() => {
    if (!isAutoRotating || !isOpen) return;
    const interval = setInterval(() => {
      setRotationAngle(prev => ({
        x: prev.x + 0.015,
        y: prev.y + 0.02
      }));
    }, 30);
    return () => clearInterval(interval);
  }, [isAutoRotating, isOpen]);

  // Render 3D Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isOpen) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;

    const radX = rotationAngle.x;
    const radY = rotationAngle.y;

    // Project 3D coordinates to 2D
    const projectedAtoms = selectedMolecule.atoms.map(atom => {
      // Rotate around Y axis
      const x1 = atom.x * Math.cos(radY) - atom.z * Math.sin(radY);
      const z1 = atom.x * Math.sin(radY) + atom.z * Math.cos(radY);

      // Rotate around X axis
      const y2 = atom.y * Math.cos(radX) - z1 * Math.sin(radX);
      const z2 = atom.y * Math.sin(radX) + z1 * Math.cos(radX);

      // Simple perspective scale
      const fov = 200;
      const scale = fov / (fov + z2 + 80);

      return {
        ...atom,
        screenX: centerX + x1 * scale * 1.8,
        screenY: centerY + y2 * scale * 1.8,
        screenRadius: Math.max(atom.radius * scale * 1.4, 4),
        depth: z2
      };
    });

    // Draw Bonds First
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#94a3b8';
    selectedMolecule.bonds.forEach(([idxA, idxB]) => {
      const a = projectedAtoms[idxA];
      const b = projectedAtoms[idxB];
      if (a && b) {
        ctx.beginPath();
        ctx.moveTo(a.screenX, a.screenY);
        ctx.lineTo(b.screenX, b.screenY);
        ctx.stroke();
      }
    });

    // Sort atoms by depth (painters algorithm)
    const sortedAtoms = [...projectedAtoms].sort((a, b) => a.depth - b.depth);

    // Draw Atoms with 3D gradient shading
    sortedAtoms.forEach(atom => {
      const grad = ctx.createRadialGradient(
        atom.screenX - atom.screenRadius * 0.3,
        atom.screenY - atom.screenRadius * 0.3,
        atom.screenRadius * 0.1,
        atom.screenX,
        atom.screenY,
        atom.screenRadius
      );
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.4, atom.color);
      grad.addColorStop(1, '#0f172a');

      ctx.beginPath();
      ctx.arc(atom.screenX, atom.screenY, atom.screenRadius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Atom Symbol Label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(atom.symbol, atom.screenX, atom.screenY);
    });
  }, [rotationAngle, selectedMolecule, isOpen]);

  if (!isOpen) return null;

  const filteredMolecules = SCIENCE_CBC_MOLECULES.filter(m =>
    m.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    m.formula.toLowerCase().includes(searchFilter.toLowerCase()) ||
    m.cbcTopic.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full h-[90vh] flex flex-col overflow-hidden border border-slate-200">
          
          {/* TOP HEADER */}
          <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
                <Atom className="w-5 h-5 text-cyan-300 animate-spin" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black tracking-tight text-white flex items-center gap-2">
                  <span>CBC Science Explorer & Molecular Viewer</span>
                  <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                    Science Skills
                  </span>
                </h3>
                <p className="text-[11px] text-slate-300">
                  {currentTenant.name} · Interactive Chemical Structure & Practical Inquiry Subsystem
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPrintModal(true)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Generate Official Printable Science Report"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Print Report</span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                aria-label="Close Science Explorer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* MAIN MODAL BODY: SIDEBAR + 3D VIEWER */}
          <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
            
            {/* LEFT MOLECULE SELECTOR & METRICS */}
            <div className="w-full md:w-80 border-r border-slate-200 bg-slate-50 flex flex-col shrink-0">
              <div className="p-3 border-b border-slate-200 bg-white">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Search molecules or topics..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-100 rounded-xl text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              {/* Molecule List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                {filteredMolecules.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMolecule(m)}
                    className={`w-full text-left p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between border ${
                      selectedMolecule.id === m.id
                        ? 'bg-cyan-50 border-cyan-400 text-cyan-950 font-bold shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-black text-slate-900">{m.formula}</span>
                        <span className="text-xs truncate max-w-[130px]">{m.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block mt-0.5 truncate max-w-[190px]">
                        Grade {m.gradeLevel} · {m.cbcTopic}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      CID {m.pubchemCID}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* RIGHT: 3D ROTATING VIEWPORT & SCIENTIFIC SPECIFICATION */}
            <div className="flex-1 flex flex-col overflow-y-auto bg-white p-4 sm:p-6 space-y-4">
              
              {/* 3D CANVAS STAGE */}
              <div className="relative bg-gradient-to-b from-slate-950 to-slate-900 rounded-2xl border border-slate-800 p-4 flex flex-col items-center justify-center shadow-inner overflow-hidden min-h-[260px]">
                <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-[10px] font-mono font-bold">
                    3D Molecular Ball & Stick
                  </span>
                  <span className="text-slate-400 text-[11px] font-mono">
                    Formula: {selectedMolecule.formula}
                  </span>
                </div>

                <div className="absolute top-3 right-3 flex items-center gap-1 z-10">
                  <button
                    onClick={() => setIsAutoRotating(!isAutoRotating)}
                    className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      isAutoRotating ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-300'
                    }`}
                    title="Toggle 3D Rotation"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span className="text-[10px] hidden sm:inline">{isAutoRotating ? 'Rotating' : 'Paused'}</span>
                  </button>
                </div>

                {/* Canvas element */}
                <canvas 
                  ref={canvasRef} 
                  width={380} 
                  height={240} 
                  className="max-w-full h-auto cursor-grab active:cursor-grabbing"
                />

                <div className="absolute bottom-2 inset-x-0 text-center text-[10px] text-slate-400 font-mono">
                  PubChem CID #{selectedMolecule.pubchemCID} · SMILES: {selectedMolecule.smiles}
                </div>
              </div>

              {/* SCIENTIFIC PROPERTIES SPECIFICATION GRID */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Molecular Mass</span>
                  <span className="text-sm font-black font-mono text-slate-900">{selectedMolecule.molecularWeight} g/mol</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Curriculum Strand</span>
                  <span className="text-sm font-black text-slate-900 truncate block">Grade {selectedMolecule.gradeLevel} CBC</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">IUPAC Name</span>
                  <span className="text-xs font-bold text-slate-900 truncate block" title={selectedMolecule.iupacName}>
                    {selectedMolecule.iupacName}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Safety Class</span>
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Lab Approved</span>
                  </span>
                </div>
              </div>

              {/* BIOLOGICAL FUNCTION & PRACTICAL INVESTIGATION NOTE */}
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-950">
                  <div className="font-bold flex items-center gap-1.5 mb-1 text-blue-900">
                    <Info className="w-4 h-4 text-blue-700" />
                    <span>Biological Role & Kenyan Ecosystem Relevance:</span>
                  </div>
                  <p className="leading-relaxed text-[11.5px]">{selectedMolecule.biologicalRole}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-950">
                  <div className="font-bold flex items-center gap-1.5 mb-1 text-amber-900">
                    <ShieldAlert className="w-4 h-4 text-amber-700" />
                    <span>Laboratory Safety Precautions:</span>
                  </div>
                  <p className="leading-relaxed text-[11.5px]">{selectedMolecule.safetyNotes}</p>
                </div>
              </div>

            </div>
          </div>

          {/* MODAL FOOTER */}
          <div className="p-3 sm:px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
            <span className="text-[11px] text-slate-500 font-mono">
              Google DeepMind Science Skills Specification · Integrated Science Subsystem
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPrintModal(true)}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Export Official Lab Report</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* PRINT REPORT MODAL FOR SCIENCE EXPERIMENT */}
      {showPrintModal && (
        <PrintReportModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          title="Virtual Science Laboratory Practical Investigation Report"
          subtitle={`Investigation of ${selectedMolecule.name} (${selectedMolecule.formula}) · Grade ${selectedMolecule.gradeLevel} CBC`}
          metadata={{
            reportTitle: 'Practical Science Laboratory Log',
            reportDate: new Date().toLocaleDateString('en-GB'),
            grade: selectedMolecule.gradeLevel,
            academicYear: currentTenant.academicYear,
            term: currentTenant.term,
            classTeacher: 'Mr. Dennis Koech, B.Ed Science'
          }}
          columns={[
            { header: 'Parameter', accessor: 'param', width: '25%' },
            { header: 'Observation & Scientific Value', accessor: 'value', width: '45%' },
            { header: 'Curriculum Competency', accessor: 'rubric', width: '30%' }
          ]}
          data={[
            { param: 'Chemical Substance', value: `${selectedMolecule.name} (${selectedMolecule.formula})`, rubric: 'Scientific Nomenclature' },
            { param: 'Molecular Mass', value: `${selectedMolecule.molecularWeight} g/mol`, rubric: 'Quantitative Measurement' },
            { param: 'PubChem Reference CID', value: `#${selectedMolecule.pubchemCID} (SMILES: ${selectedMolecule.smiles})`, rubric: 'Digital Science Data' },
            { param: 'Biological Function', value: selectedMolecule.biologicalRole, rubric: 'Critical Inquiry & Ecology' },
            { param: 'Safety Precautions', value: selectedMolecule.safetyNotes, rubric: 'Lab Safety & Responsibility' }
          ]}
          teacherRemarks={`The student has successfully completed the digital practical inquiry on ${selectedMolecule.name} (${selectedMolecule.formula}). Observations accurately recorded according to KICD Grade ${selectedMolecule.gradeLevel} Science guidelines.`}
          principalRemarks="Approved and certified for the learner's digital science e-portfolio."
        />
      )}
    </>
  );
};
