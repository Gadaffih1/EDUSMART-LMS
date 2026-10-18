import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  Image as ImageIcon, 
  Palette, 
  Check, 
  Sparkles, 
  Printer, 
  Eye, 
  RotateCcw, 
  Building2, 
  ShieldCheck, 
  FileText,
  Save,
  HelpCircle,
  Video,
  Film,
  Play,
  Volume2,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { Tenant } from '../../types/tenant';
import { TenantPrintHeader, TenantPrintFooter } from '../common/TenantPrintHeader';
import { EduSmartGadsaLogo } from '../common/EduSmartGadsaLogo';
import { HERO_VIDEO_PRESETS, HERO_IMAGE_PRESETS } from '../../data/heroMediaPresets';
import { HeroBannerMedia } from '../common/HeroBannerMedia';


interface TenantBrandingCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const PRESET_THEME_COLORS = [
  { name: 'Royal Blue (Riara)', hex: '#1e3a8a', accent: '#fbbf24', theme: 'blue' },
  { name: 'Forest Emerald (Greenwood)', hex: '#064e3b', accent: '#10b981', theme: 'emerald' },
  { name: 'Imperial Indigo (Hillcrest)', hex: '#312e81', accent: '#818cf8', theme: 'indigo' },
  { name: 'Warm Amber (Sunrise)', hex: '#ea580c', accent: '#f59e0b', theme: 'amber' },
  { name: 'Teal Coast (Westlands)', hex: '#0f766e', accent: '#2dd4bf', theme: 'teal' },
  { name: 'Deep Burgundy (St. Austin’s)', hex: '#831843', accent: '#fbbf24', theme: 'rose' },
  { name: 'Midnight Slate', hex: '#0f172a', accent: '#38bdf8', theme: 'slate' }
];

export const TenantBrandingCustomizerModal: React.FC<TenantBrandingCustomizerModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { currentTenant, updateTenantBranding } = useTenant();

  const [activeTab, setActiveTab] = useState<'editor' | 'preview_hero' | 'preview_print'>('editor');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Form states initialized with current tenant
  const [formData, setFormData] = useState<Partial<Tenant>>({
    name: currentTenant.name,
    shortName: currentTenant.shortName,
    code: currentTenant.code,
    motto: currentTenant.motto,
    taglineNotes: currentTenant.taglineNotes || 'Dedicated to Academic Excellence, Holistic CBC Discovery & Moral Integrity',
    heroTitle: currentTenant.heroTitle || `WELCOME TO ${currentTenant.name.toUpperCase()} PORTAL`,
    heroSubtitle: currentTenant.heroSubtitle || `"${currentTenant.motto}" — A secure digital platform connecting learners, teachers, parents and school leadership.`,
    curriculumBadgeText: currentTenant.curriculumBadgeText || 'COMPETENCY-BASED CURRICULUM (CBC) · GRADES 1 TO 9',
    portalCardBadge: currentTenant.portalCardBadge || 'By Gadsa Systems',
    logoUrl: currentTenant.logoUrl,
    customLogoBase64: currentTenant.customLogoBase64,
    registrationNumber: currentTenant.registrationNumber,
    address: currentTenant.address,
    city: currentTenant.city,
    county: currentTenant.county,
    phone: currentTenant.phone,
    email: currentTenant.email,
    principalName: currentTenant.principalName,
    principalTitle: currentTenant.principalTitle,
    printHeaderTheme: currentTenant.printHeaderTheme || 'formal',
    printFooterNotes: currentTenant.printFooterNotes || `Official ${currentTenant.name} document. Protected under the Kenya Data Protection Act & Ministry of Education Guidelines. ${currentTenant.motto}.`,
    printWatermarkText: currentTenant.printWatermarkText || `${currentTenant.shortName.toUpperCase()} · OFFICIAL RECORD`,
    primaryColorHex: currentTenant.primaryColorHex || '#1e3a8a',
    accentColorHex: currentTenant.accentColorHex || '#fbbf24',
    heroMediaType: currentTenant.heroMediaType || 'image',
    heroImageUrl: currentTenant.heroImageUrl || '/src/assets/images/edusmart_campus_banner_1790859700873.jpg',
    heroVideoUrl: currentTenant.heroVideoUrl || '',
    heroVideoPoster: currentTenant.heroVideoPoster || '',
    heroVideoBadge: currentTenant.heroVideoBadge || '30s Campus Tour'
  });

  const [videoUploadError, setVideoUploadError] = useState<string | null>(null);
  const [isVideoUploading, setIsVideoUploading] = useState<boolean>(false);

  const handleHeroVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVideoUploadError(null);
    setIsVideoUploading(true);

    const objectUrl = URL.createObjectURL(file);
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.src = objectUrl;

    tempVideo.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      const videoDuration = tempVideo.duration;

      if (videoDuration > 30) {
        setVideoUploadError(
          `Video is ${Math.round(videoDuration)} seconds long. Maximum allowed length for hero banner video is 30 seconds.`
        );
        setIsVideoUploading(false);
        return;
      }

      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        const base64 = loadEvt.target?.result as string;
        setFormData(prev => ({
          ...prev,
          heroMediaType: 'video',
          heroVideoUrl: base64,
          heroVideoBadge: '30s Campus Tour'
        }));
        setIsVideoUploading(false);
      };
      reader.onerror = () => {
        setVideoUploadError('Failed to read video file.');
        setIsVideoUploading(false);
      };
      reader.readAsDataURL(file);
    };

    tempVideo.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setVideoUploadError('Invalid video format. Please select an MP4 or WebM video file.');
      setIsVideoUploading(false);
    };
  };

  const handleHeroImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Please upload an image smaller than 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const base64 = loadEvt.target?.result as string;
      setFormData(prev => ({
        ...prev,
        heroMediaType: 'image',
        heroImageUrl: base64
      }));
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  // Handle Logo File Upload (PNG, JPG, SVG)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Please upload an image smaller than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64 = uploadEvent.target?.result as string;
      setFormData(prev => ({
        ...prev,
        customLogoBase64: base64
      }));
    };
    reader.readAsDataURL(file);
  };

  // Reset to Gadsa / EduSmart Default Emblem
  const handleUseGadsaLogo = () => {
    setFormData(prev => ({
      ...prev,
      customLogoBase64: undefined,
      portalCardBadge: 'By Gadsa Systems'
    }));
  };

  // Save changes
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateTenantBranding(formData);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      if (onSuccess) onSuccess();
      onClose();
    }, 1200);
  };

  // Reset to initial tenant defaults
  const handleResetDefaults = () => {
    if (confirm(`Reset branding for ${currentTenant.name} to default values?`)) {
      setFormData({
        name: currentTenant.name,
        shortName: currentTenant.shortName,
        code: currentTenant.code,
        motto: currentTenant.motto,
        taglineNotes: 'Academic Discipline · Holistic CBC Development · Moral Integrity',
        heroTitle: `WELCOME TO ${currentTenant.name.toUpperCase()} PORTAL`,
        heroSubtitle: `"${currentTenant.motto}" — A secure digital platform connecting learners, teachers, parents and school leadership.`,
        curriculumBadgeText: 'COMPETENCY-BASED CURRICULUM (CBC) · GRADES 1 TO 9',
        portalCardBadge: 'Official Campus Portal',
        logoUrl: currentTenant.logoUrl,
        customLogoBase64: undefined,
        printHeaderTheme: 'formal',
        primaryColorHex: currentTenant.primaryColorHex || '#1e3a8a',
        accentColorHex: currentTenant.accentColorHex || '#fbbf24'
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[94vh] flex flex-col border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200 my-auto text-slate-900">
        
        {/* HEADER */}
        <div className="bg-slate-900 text-white px-6 py-4.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-md">
              <Palette className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded font-mono">
                  Tenant School Branding
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {currentTenant.name} ({currentTenant.code})
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                School Customizer: Portal Hero & Printable Documents
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Nav Tabs */}
            <div className="bg-slate-800 p-1 rounded-xl flex items-center gap-1 text-xs font-bold border border-slate-700">
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'editor'
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                1. Edit Details
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview_hero')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'preview_hero'
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>2. Hero Preview</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview_print')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'preview_print'
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>3. Print Preview</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer ml-1"
              title="Close Customizer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* BODY CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">
          
          {/* TAB 1: FORM EDITOR */}
          {activeTab === 'editor' && (
            <form onSubmit={handleSave} className="space-y-6 text-left max-w-4xl mx-auto">
              
              {/* SECTION A: SCHOOL LOGO & CREST EMBLEM */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                    <ImageIcon className="w-4 h-4 text-emerald-600" />
                    <span>Official School Logo & Emblem (Hero & Documents)</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Supports PNG, JPG, SVG</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
                  
                  {/* Current Logo Badge Preview */}
                  <div className="flex flex-col items-center justify-center p-4 bg-slate-900 rounded-2xl border border-slate-800 text-center space-y-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                      Hero Badge Preview
                    </span>
                    <div className="bg-white rounded-2xl p-3 shadow-xl border border-amber-400/80 max-w-[130px] w-full flex flex-col items-center">
                      {formData.customLogoBase64 ? (
                        <img 
                          src={formData.customLogoBase64} 
                          alt="Custom School Logo" 
                          className="w-16 h-16 object-contain"
                        />
                      ) : formData.logoUrl ? (
                        <img 
                          src={formData.logoUrl} 
                          alt="School Logo" 
                          className="w-16 h-16 object-contain"
                        />
                      ) : (
                        <EduSmartGadsaLogo variant="full" size="sm" />
                      )}
                      <div className="text-[9px] font-mono font-bold text-slate-700 mt-1 uppercase truncate max-w-full">
                        {formData.portalCardBadge || 'School Portal'}
                      </div>
                    </div>
                    <span className="text-[11px] text-emerald-400 font-bold">
                      {formData.customLogoBase64 ? '✓ Custom Upload Active' : '✓ Preset School Logo'}
                    </span>
                  </div>

                  {/* Upload and URL Controls */}
                  <div className="md:col-span-2 space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Upload School Crest / Emblem Image
                      </label>
                      <div className="flex items-center gap-2">
                        <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-2xs">
                          <Upload className="w-4 h-4 text-emerald-600" />
                          <span>Choose Logo Image File (PNG, JPG, SVG)</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleLogoUpload} 
                            className="hidden" 
                          />
                        </label>
                        {formData.customLogoBase64 && (
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, customLogoBase64: undefined }))}
                            className="px-3 py-2 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded-xl text-xs font-bold cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        High resolution square emblem (minimum 250×250px) recommended for razor-sharp printed letterheads.
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={handleUseGadsaLogo}
                        className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Use Standard Edu-Smart / Gadsa Systems Logo</span>
                      </button>

                      <div className="flex items-center gap-1.5 text-xs">
                        <label className="font-bold text-slate-600">Card Badge:</label>
                        <input
                          type="text"
                          value={formData.portalCardBadge || ''}
                          onChange={(e) => setFormData({ ...formData, portalCardBadge: e.target.value })}
                          placeholder="e.g. Official Campus Portal"
                          className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg w-44"
                        />
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* SECTION B: HERO SECTION TITLES & TAGLINES (FROM USER SCREENSHOT) */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Portal Hero Section Details (Matching Screenshot)</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">Customizes Landing Page Hero</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  
                  {/* Top Subheading Badge */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="block font-bold text-slate-700">
                      Curriculum & Accreditation Subheading (Green Monospace Text)
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.curriculumBadgeText || ''}
                      onChange={(e) => setFormData({ ...formData, curriculumBadgeText: e.target.value })}
                      placeholder="e.g. COMPETENCY-BASED CURRICULUM (CBC) · GRADES 1 TO 9"
                      className="w-full px-3 py-2.5 text-xs font-mono font-bold text-emerald-700 bg-emerald-50/60 border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    />
                    <p className="text-[11px] text-slate-400">
                      Displays in uppercase emerald above the main welcome title.
                    </p>
                  </div>

                  {/* Main Hero Title */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="block font-bold text-slate-700">
                      Main Portal Welcome Headline (Large Bold Text)
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.heroTitle || ''}
                      onChange={(e) => setFormData({ ...formData, heroTitle: e.target.value })}
                      placeholder="e.g. WELCOME TO THE SCHOOL PORTAL"
                      className="w-full px-3 py-2.5 text-sm font-black text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 uppercase"
                    />
                  </div>

                  {/* Hero Subtitle Quote */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="block font-bold text-slate-700">
                      Hero Subtitle / Tagline Quote (Italicized Text)
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.heroSubtitle || ''}
                      onChange={(e) => setFormData({ ...formData, heroSubtitle: e.target.value })}
                      placeholder='e.g. "A secure digital platform connecting learners, teachers, parents and school leadership."'
                      className="w-full px-3 py-2 text-xs font-medium italic text-slate-800 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  {/* School Motto */}
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700">
                      Official School Motto
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.motto || ''}
                      onChange={(e) => setFormData({ ...formData, motto: e.target.value })}
                      placeholder="e.g. Learn · Grow · Succeed"
                      className="w-full px-3 py-2 text-xs font-semibold text-slate-900 border border-slate-300 rounded-xl"
                    />
                  </div>

                  {/* School Tagline Notes */}
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700">
                      Institutional Tagline Notes
                    </label>
                    <input
                      type="text"
                      value={formData.taglineNotes || ''}
                      onChange={(e) => setFormData({ ...formData, taglineNotes: e.target.value })}
                      placeholder="e.g. Academic Discipline · Holistic CBC Discovery"
                      className="w-full px-3 py-2 text-xs font-semibold text-slate-900 border border-slate-300 rounded-xl"
                    />
                  </div>

                </div>
              </div>

              {/* SECTION B2: HERO BANNER MEDIA (IMAGE OR SHORT VIDEO - 30 SEC) */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                    <Film className="w-4 h-4 text-amber-500" />
                    <span>Hero Banner Visual (Image or 30-Sec Short Video)</span>
                  </div>
                  <span className="text-[11px] font-mono text-cyan-700 bg-cyan-50 px-2.5 py-0.5 rounded-full border border-cyan-200 font-bold">
                    Max 30s Loop
                  </span>
                </div>

                {/* Media Type Switcher */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, heroMediaType: 'image' })}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      (formData.heroMediaType || 'image') === 'image'
                        ? 'bg-white text-slate-900 shadow-sm font-black'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <ImageIcon className="w-4 h-4 text-blue-600" />
                    <span>Campus Image Photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, heroMediaType: 'video' })}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      formData.heroMediaType === 'video'
                        ? 'bg-white text-slate-900 shadow-sm font-black'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Video className="w-4 h-4 text-cyan-600" />
                    <span>Short Video Showcase (30s)</span>
                  </button>
                </div>

                {/* If Video: 30s Video settings */}
                {formData.heroMediaType === 'video' ? (
                  <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-700">Direct Video URL</label>
                        <span className="text-[10px] text-slate-500">MP4 or WebM (Max 30s)</span>
                      </div>
                      <input
                        type="text"
                        value={formData.heroVideoUrl || ''}
                        onChange={(e) => setFormData({ ...formData, heroVideoUrl: e.target.value })}
                        placeholder="https://.../school-showcase.mp4"
                        className="w-full px-3 py-2 text-xs font-mono text-slate-900 border border-slate-300 rounded-xl bg-white"
                      />
                    </div>

                    {/* Upload Video */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Upload Video File (Auto-checks max 30 seconds)
                      </label>
                      <div className="flex items-center gap-2">
                        <label className="px-3 py-1.5 bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{isVideoUploading ? 'Validating (30s limit)...' : 'Choose Video File'}</span>
                          <input
                            type="file"
                            accept="video/mp4,video/webm"
                            onChange={handleHeroVideoUpload}
                            className="hidden"
                            disabled={isVideoUploading}
                          />
                        </label>
                        <span className="text-[11px] text-slate-500">HTML5 metadata validation</span>
                      </div>
                      {videoUploadError && (
                        <div className="mt-1.5 p-2 bg-red-50 border border-red-300 rounded-lg text-red-700 text-xs flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                          <span>{videoUploadError}</span>
                        </div>
                      )}
                    </div>

                    {/* Presets */}
                    <div>
                      <span className="text-[11px] font-bold text-slate-700 block mb-1">
                        Or Pick Curated 30-Second Showcase Video:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {HERO_VIDEO_PRESETS.map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => setFormData({
                              ...formData,
                              heroMediaType: 'video',
                              heroVideoUrl: preset.url,
                              heroVideoPoster: preset.poster,
                              heroVideoBadge: `${preset.durationLabel} Campus Tour`
                            })}
                            className={`p-2 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                              formData.heroVideoUrl === preset.url
                                ? 'bg-cyan-50 border-cyan-600 text-cyan-900 ring-1 ring-cyan-500'
                                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'
                            }`}
                          >
                            <div className="flex items-center justify-between font-bold">
                              <span>{preset.label}</span>
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                                {preset.durationLabel}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* If Image: photo settings */
                  <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700">Campus Banner Photo URL</label>
                      <label className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-bold flex items-center gap-1 cursor-pointer">
                        <Upload className="w-3 h-3 text-amber-400" />
                        <span>Upload Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleHeroImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <input
                      type="text"
                      value={formData.heroImageUrl || ''}
                      onChange={(e) => setFormData({ ...formData, heroImageUrl: e.target.value })}
                      placeholder="Paste image URL or choose preset"
                      className="w-full px-3 py-2 text-xs font-mono text-slate-900 border border-slate-300 rounded-xl bg-white"
                    />

                    <div>
                      <span className="text-[11px] font-bold text-slate-600 block mb-1">Campus Image Presets:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {HERO_IMAGE_PRESETS.map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, heroImageUrl: preset.url, heroMediaType: 'image' })}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                              formData.heroImageUrl === preset.url && formData.heroMediaType !== 'video'
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>


              {/* SECTION C: THEME & COLOR BRANDING */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                    <Palette className="w-4 h-4 text-indigo-600" />
                    <span>Theme Colors (Portal & Printed Letterhead)</span>
                  </div>
                  <span className="text-[11px] text-slate-500">Pick a color scheme or enter Hex</span>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                    {PRESET_THEME_COLORS.map(c => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setFormData({
                          ...formData,
                          primaryColorHex: c.hex,
                          accentColorHex: c.accent,
                          themeColor: c.theme
                        })}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                          formData.primaryColorHex === c.hex 
                            ? 'ring-2 ring-blue-600 border-blue-600 bg-blue-50/50' 
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full shadow-inner border border-white flex items-center justify-center" style={{ backgroundColor: c.hex }}>
                          {formData.primaryColorHex === c.hex && <Check className="w-4 h-4 text-white" />}
                        </div>
                        <span className="text-[10px] font-bold text-slate-700 leading-tight">
                          {c.name.split(' ')[0]}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Primary Brand Color (Hex):
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={formData.primaryColorHex || '#1e3a8a'}
                          onChange={(e) => setFormData({ ...formData, primaryColorHex: e.target.value })}
                          className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                        />
                        <input
                          type="text"
                          value={formData.primaryColorHex || '#1e3a8a'}
                          onChange={(e) => setFormData({ ...formData, primaryColorHex: e.target.value })}
                          className="flex-1 px-3 py-1.5 text-xs font-mono font-bold uppercase border border-slate-300 rounded-lg"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Accent / Highlight Color (Hex):
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={formData.accentColorHex || '#fbbf24'}
                          onChange={(e) => setFormData({ ...formData, accentColorHex: e.target.value })}
                          className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                        />
                        <input
                          type="text"
                          value={formData.accentColorHex || '#fbbf24'}
                          onChange={(e) => setFormData({ ...formData, accentColorHex: e.target.value })}
                          className="flex-1 px-3 py-1.5 text-xs font-mono font-bold uppercase border border-slate-300 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION D: PRINTABLE DOCUMENTS CUSTOMIZATION */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                    <Printer className="w-4 h-4 text-blue-600" />
                    <span>Printable Documents (Report Cards, Transcripts & Timetables)</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">Applies to all printed PDFs</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  
                  {/* Ministry of Education / NEMIS Code */}
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700">
                      Ministry of Education / NEMIS Code
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.registrationNumber || ''}
                      onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                      placeholder="e.g. MOE/PRI-JSS/NBI/1974/0112"
                      className="w-full px-3 py-2 text-xs font-mono font-bold text-slate-900 border border-slate-300 rounded-xl"
                    />
                  </div>

                  {/* Watermark text */}
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700">
                      Print Background Watermark Note
                    </label>
                    <input
                      type="text"
                      value={formData.printWatermarkText || ''}
                      onChange={(e) => setFormData({ ...formData, printWatermarkText: e.target.value })}
                      placeholder="e.g. RIARA SCHOOL · OFFICIAL ACADEMIC DOCUMENT"
                      className="w-full px-3 py-2 text-xs font-mono text-slate-800 border border-slate-300 rounded-xl"
                    />
                  </div>

                  {/* Physical Address */}
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700">
                      Physical Address
                    </label>
                    <input
                      type="text"
                      value={formData.address || ''}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="e.g. Riara Road, Kilimani"
                      className="w-full px-3 py-2 text-xs text-slate-800 border border-slate-300 rounded-xl"
                    />
                  </div>

                  {/* City & County */}
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700">
                      City & County
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={formData.city || ''}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="Nairobi"
                        className="px-3 py-2 text-xs text-slate-800 border border-slate-300 rounded-xl"
                      />
                      <input
                        type="text"
                        value={formData.county || ''}
                        onChange={(e) => setFormData({ ...formData, county: e.target.value })}
                        placeholder="Nairobi County"
                        className="px-3 py-2 text-xs text-slate-800 border border-slate-300 rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Phone & Email */}
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700">
                      Official Telephone Contact
                    </label>
                    <input
                      type="text"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+254 703 038 100"
                      className="w-full px-3 py-2 text-xs font-mono text-slate-800 border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700">
                      Official Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="admin@riaraschools.ac.ke"
                      className="w-full px-3 py-2 text-xs font-mono text-slate-800 border border-slate-300 rounded-xl"
                    />
                  </div>

                  {/* Principal Sign-Off */}
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700">
                      Principal / Head of Institution Name
                    </label>
                    <input
                      type="text"
                      value={formData.principalName || ''}
                      onChange={(e) => setFormData({ ...formData, principalName: e.target.value })}
                      placeholder="e.g. Mr. Patrick Kamau"
                      className="w-full px-3 py-2 text-xs font-bold text-slate-900 border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700">
                      Principal Designation Title
                    </label>
                    <input
                      type="text"
                      value={formData.principalTitle || ''}
                      onChange={(e) => setFormData({ ...formData, principalTitle: e.target.value })}
                      placeholder="e.g. School Administrator & Principal"
                      className="w-full px-3 py-2 text-xs text-slate-800 border border-slate-300 rounded-xl"
                    />
                  </div>

                  {/* Printable Footer Notes */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="block font-bold text-slate-700">
                      Printable Document Footer Tagline Notes & Certification
                    </label>
                    <textarea
                      rows={2}
                      value={formData.printFooterNotes || ''}
                      onChange={(e) => setFormData({ ...formData, printFooterNotes: e.target.value })}
                      placeholder="Official document notes printed at the bottom of report cards and transcripts"
                      className="w-full px-3 py-2 text-xs text-slate-800 border border-slate-300 rounded-xl"
                    />
                  </div>

                </div>
              </div>

              {/* SAVE / RESET ACTIONS */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset to School Defaults</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    {saveSuccess ? (
                      <>
                        <Check className="w-4 h-4 text-white" />
                        <span>Saved Successfully!</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 text-white" />
                        <span>Apply & Save Branding</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </form>
          )}

          {/* TAB 2: LIVE PREVIEW - HERO SECTION (EXACT SCREENSHOT MATCH) */}
          {activeTab === 'preview_hero' && (
            <div className="space-y-4 max-w-4xl mx-auto">
              <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 text-left flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900">
                  <span className="font-bold">Live Hero Section Preview:</span> This is how the attached section renders for <strong>{formData.name}</strong> with your customized logo, curriculum badge, headline, and tagline notes.
                </div>
              </div>

              {/* MOCKED EXACT HERO SECTION AS PER USER SCREENSHOT */}
              <div className="bg-slate-900 rounded-3xl p-8 sm:p-14 text-white text-center flex flex-col items-center justify-center border-4 border-slate-800 shadow-2xl relative overflow-hidden">
                
                {/* Background Scrim */}
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 opacity-90 pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center max-w-3xl w-full mx-auto">
                  
                  {/* 1. CUSTOMIZABLE LOGO EMBLEM BADGE */}
                  <div className="bg-white rounded-2xl p-3 sm:p-3.5 shadow-2xl border border-amber-400/80 mb-3 max-w-[140px] w-full mx-auto flex flex-col items-center hover:scale-105 transition-transform">
                    {formData.customLogoBase64 ? (
                      <img 
                        src={formData.customLogoBase64} 
                        alt="Logo" 
                        className="w-16 h-16 object-contain"
                      />
                    ) : formData.logoUrl ? (
                      <img 
                        src={formData.logoUrl} 
                        alt="Logo" 
                        className="w-16 h-16 object-contain"
                      />
                    ) : (
                      <EduSmartGadsaLogo variant="full" size="sm" />
                    )}
                    <div className="text-[9px] font-mono font-bold text-slate-700 mt-1 uppercase tracking-tight truncate max-w-full">
                      {formData.portalCardBadge || 'By Gadsa Systems'}
                    </div>
                  </div>

                  {/* 2. CUSTOMIZABLE GREEN MONOSPACE SUBHEADING */}
                  <div className="text-center mt-1">
                    <p className="text-emerald-400 font-extrabold text-xs sm:text-sm tracking-widest uppercase font-mono">
                      {formData.curriculumBadgeText || 'COMPETENCY-BASED CURRICULUM (CBC) · GRADES 1 TO 9'}
                    </p>
                  </div>

                  {/* 3. CUSTOMIZABLE WELCOME HEADLINE */}
                  <div className="max-w-3xl mt-3 mb-3 text-center">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-slate-100 tracking-tight uppercase leading-tight font-sans">
                      {formData.heroTitle || 'WELCOME TO THE SCHOOL PORTAL'}
                    </h1>
                  </div>

                  {/* 4. CUSTOMIZABLE ITALICIZED SUBTITLE QUOTE */}
                  <div className="max-w-2xl mx-auto text-center">
                    <p className="text-slate-300 text-xs sm:text-sm md:text-base font-medium italic leading-relaxed">
                      {formData.heroSubtitle || '"A secure digital platform connecting learners, teachers, parents and school leadership."'}
                    </p>
                  </div>

                  {/* School Motto Tag */}
                  <div className="mt-4 flex items-center gap-2 text-xs font-mono text-amber-300 bg-amber-950/60 border border-amber-500/40 px-3 py-1 rounded-full">
                    <span>★ {formData.motto} ★</span>
                    {formData.taglineNotes && (
                      <span className="text-slate-300 hidden sm:inline">· {formData.taglineNotes}</span>
                    )}
                  </div>

                  {/* 5. HERO BANNER VISUAL (IMAGE OR 30s SHORT VIDEO) */}
                  <div className="w-full max-w-2xl mt-6">
                    <HeroBannerMedia
                      mediaType={formData.heroMediaType || 'image'}
                      imageUrl={formData.heroImageUrl || '/src/assets/images/edusmart_campus_banner_1790859700873.jpg'}
                      videoUrl={formData.heroVideoUrl}
                      posterUrl={formData.heroVideoPoster || formData.heroImageUrl}
                      videoBadgeLabel={formData.heroVideoBadge || '30s Campus Tour'}
                      videoAutoplay={true}
                      videoMuted={true}
                      videoLoop={true}
                      videoShowControls={true}
                      maxDurationSeconds={30}
                      showFloatingCard={false}
                      className="!h-64 !border-2 !border-slate-700"
                    />
                  </div>
                </div>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('editor')}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  ← Return to Edit Details
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: LIVE PREVIEW - PRINTABLE DOCUMENTS */}
          {activeTab === 'preview_print' && (
            <div className="space-y-4 max-w-4xl mx-auto">
              <div className="bg-blue-50 border border-blue-300 rounded-2xl p-4 text-left flex items-start gap-3">
                <Printer className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-900">
                  <span className="font-bold">Official Printable Document Specimen:</span> All printable report cards, fee statements, staff appraisals, timetables, and assessment transcripts generated for <strong>{formData.name}</strong> will automatically carry this official letterhead, customized logo, and tagline notes.
                </div>
              </div>

              {/* SPECIMEN PRINTABLE DOCUMENT CONTAINER */}
              <div className="bg-white rounded-2xl shadow-md border border-slate-300 p-6 sm:p-10 text-left text-slate-900">
                
                {/* 1. OFFICIAL LETTERHEAD WITH TENANT BRANDING */}
                <TenantPrintHeader
                  tenantOverride={{
                    ...currentTenant,
                    ...formData
                  } as Tenant}
                  title="Official CBC Formative Assessment & Academic Report"
                  subtitle="Grade 4 Mara · Term 1 Continuous Assessment Transcript"
                  documentRef={`SPECIMEN/${formData.code}/2026/0416`}
                  showWatermark={true}
                />

                {/* Specimen Learner Metadata */}
                <div className="my-6 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Learner Name</span>
                    <span className="font-extrabold text-slate-900">Peter Kamau</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Admission No</span>
                    <span className="font-mono font-bold text-slate-900">ADM/2023/0416</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Grade & Stream</span>
                    <span className="font-bold text-slate-900">Grade 4 (Mara Stream)</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Class Teacher</span>
                    <span className="font-bold text-slate-900">Mrs. Florence Akinyi</span>
                  </div>
                </div>

                {/* Sample Learning Areas Matrix */}
                <div className="space-y-2 mb-6">
                  <div className="text-xs font-black uppercase tracking-wider text-slate-800">
                    Formative Strand Assessment Summary:
                  </div>
                  <table className="w-full text-xs border border-slate-200 rounded-xl overflow-hidden">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-left">
                      <tr>
                        <th className="p-2.5">Learning Area / Subject</th>
                        <th className="p-2.5 text-center">Formative %</th>
                        <th className="p-2.5 text-center">CBC Performance Level</th>
                        <th className="p-2.5">Teacher Remark</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="p-2.5 font-bold">Mathematics Activities</td>
                        <td className="p-2.5 text-center font-mono font-bold">88%</td>
                        <td className="p-2.5 text-center">
                          <span className="px-2 py-0.5 rounded font-black text-[10px] bg-emerald-100 text-emerald-800">EE (Exceeding)</span>
                        </td>
                        <td className="p-2.5 text-slate-600">Exceptional mastery of fractions & geometry</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold">English Language & Literacy</td>
                        <td className="p-2.5 text-center font-mono font-bold">84%</td>
                        <td className="p-2.5 text-center">
                          <span className="px-2 py-0.5 rounded font-black text-[10px] bg-emerald-100 text-emerald-800">EE (Exceeding)</span>
                        </td>
                        <td className="p-2.5 text-slate-600">Fluent reading expression and essay composition</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold">Science & Technology Activities</td>
                        <td className="p-2.5 text-center font-mono font-bold">79%</td>
                        <td className="p-2.5 text-center">
                          <span className="px-2 py-0.5 rounded font-black text-[10px] bg-blue-100 text-blue-800">ME (Meeting)</span>
                        </td>
                        <td className="p-2.5 text-slate-600">Active participation in lab practicals</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 2. OFFICIAL FOOTER WITH PRINCIPAL ENDORSEMENT & INSTITUTIONAL SEAL */}
                <TenantPrintFooter
                  tenantOverride={{
                    ...currentTenant,
                    ...formData
                  } as Tenant}
                  showSignature={true}
                  customNote={formData.printFooterNotes}
                />

              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('editor')}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  ← Return to Edit Details
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>Test Print This Specimen</span>
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
