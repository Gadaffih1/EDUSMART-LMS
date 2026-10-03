import React, { useState } from 'react';
import { User, ExternalTool } from '../../types';
import { Storage } from '../../utils/storage';
import { 
  ExternalLink, 
  Sparkles, 
  Video, 
  School, 
  FileText, 
  BookOpen, 
  Award, 
  Copy, 
  Check, 
  Share2,
  Layers
} from 'lucide-react';

interface ExternalToolsHubProps {
  currentUser: User;
}

export const ExternalToolsHub: React.FC<ExternalToolsHubProps> = ({ currentUser }) => {
  const tools = Storage.getExternalTools();
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredTools = tools.filter(t => 
    filterCategory === 'all' || t.category === filterCategory
  );

  const getToolIcon = (iconName: string) => {
    switch (iconName) {
      case 'Video':
        return <Video className="w-5 h-5 text-blue-600" />;
      case 'School':
        return <School className="w-5 h-5 text-emerald-600" />;
      case 'FileText':
        return <FileText className="w-5 h-5 text-purple-600" />;
      case 'BookOpen':
        return <BookOpen className="w-5 h-5 text-indigo-600" />;
      case 'Award':
        return <Award className="w-5 h-5 text-amber-600" />;
      case 'Sparkles':
      default:
        return <Sparkles className="w-5 h-5 text-rose-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4" />
            <span>Third-Party Learning & Assessment Integrations</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Integrated Learning Ecosystem
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Seamlessly launch KICD-approved digital libraries, live virtual class links (Google Meet & Zoom), classroom assignments (Google Classroom & Forms), and interactive gamified challenges (Kahoot & Quizizz).
          </p>
        </div>

        <div className="px-3.5 py-2 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs font-mono font-bold shrink-0">
          7 Active Integrations
        </div>
      </div>

      {/* Categories Filter */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { key: 'all', label: 'All Tools' },
          { key: 'virtual_class', label: 'Live Video (Meet & Zoom)' },
          { key: 'assessment', label: 'Gamified Revision (Kahoot & Quizizz)' },
          { key: 'classroom', label: 'Google Classroom & Sync' },
          { key: 'library', label: 'Online Library & E-Readers' }
        ].map(cat => (
          <button
            key={cat.key}
            onClick={() => setFilterCategory(cat.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filterCategory === cat.key
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTools.map((tool) => (
          <div
            key={tool.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                  {getToolIcon(tool.icon)}
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                  {tool.badge}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">{tool.name}</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {tool.description}
                </p>
              </div>

              {/* Access Code or Link Snippet */}
              {tool.code && (
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-800 font-semibold">{tool.code}</span>
                  <button
                    onClick={() => handleCopyCode(tool.id, tool.code!)}
                    className="p-1 text-slate-400 hover:text-emerald-700 transition-colors"
                    title="Copy code"
                  >
                    {copiedId === tool.id ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Launch Action */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-medium">Single Sign-On (SSO)</span>
              <a
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1.5 shadow-2xs"
              >
                <span>Launch {tool.name.split(' ')[0]}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
