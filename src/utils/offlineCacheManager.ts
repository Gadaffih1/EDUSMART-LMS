/**
 * EduSmart CBC Offline Cache & State Management Mechanism
 * 
 * Manages local storage caching for Competency-Based Curriculum (CBC) learning materials,
 * lesson notes, audio transcripts, diagrams, and task rubrics.
 * Supports intermittent internet connectivity for students and teachers across Kenya.
 */

export interface CachedCBCModule {
  id: string;
  title: string;
  subject: string;
  grade: number;
  strandTopic: string;
  type: 'lesson_note' | 'video_guide' | 'audio_lesson' | 'diagram_model' | 'cba_rubric';
  summary: string;
  content: string;
  keyTakeaways: string[];
  sizeBytes: number;
  cachedAt?: string;
  lastAccessedAt?: string;
  isFrequentlyAccessed: boolean;
  isCached: boolean;
}

export interface SubjectStorageSummary {
  subject: string;
  iconName: string;
  totalModules: number;
  cachedModules: number;
  totalSizeBytes: number;
  formattedSize: string;
  percentage: number;
  modules: CachedCBCModule[];
}

export type OfflineSyncHealth = 'synced' | 'syncing' | 'partial' | 'offline' | 'needs_update';

export interface OfflineCacheStatus {
  totalAvailable: number;
  cachedCount: number;
  percentage: number;
  totalSizeBytes: number;
  formattedTotalSize: string;
  syncHealth: OfflineSyncHealth;
  isOnline: boolean;
  lastSyncTimestamp: string;
  bySubject: SubjectStorageSummary[];
}

const STORAGE_KEY = 'edusmart_cbc_offline_cache_v2';
const LAST_SYNC_KEY = 'edusmart_cbc_last_sync_timestamp';

// Default CBC Curriculum Learning Materials Catalog
const DEFAULT_CBC_CATALOG: Omit<CachedCBCModule, 'isCached'>[] = [
  // 1. MATHEMATICS
  {
    id: 'cbc-mat-01',
    title: 'Understanding Fractions: Part of a Whole & Visual Portions',
    subject: 'Mathematics',
    grade: 4,
    strandTopic: 'Numbers · Fractions & Decimals',
    type: 'lesson_note',
    summary: 'Master proper fractions, numerators, denominators, and addition with real visual models.',
    content: 'Fractions represent equal parts of a whole quantity. Proper fractions have numerators less than denominators. Visual fraction bars and number lines illustrate equivalent fractions.',
    keyTakeaways: ['Numerator = parts selected', 'Denominator = total equal parts', 'Adding like fractions: keep denominator'],
    sizeBytes: 142000,
    isFrequentlyAccessed: true,
  },
  {
    id: 'cbc-mat-02',
    title: 'Decimals and Place Value in Kenya Shillings',
    subject: 'Mathematics',
    grade: 5,
    strandTopic: 'Numbers · Place Value & Currency',
    type: 'lesson_note',
    summary: 'Relating tenths and hundredths to currency operations and measurement conversions.',
    content: 'Tenths and hundredths represent decimal fractions. 100 cents = 1 Kenya Shilling. Place value charts demonstrate decimal point alignment for addition and subtraction.',
    keyTakeaways: ['Tenths position is 0.1', 'Hundredths position is 0.01', 'Align decimal points during addition'],
    sizeBytes: 118000,
    isFrequentlyAccessed: true,
  },
  {
    id: 'cbc-mat-03',
    title: 'Perimeter and Area of Rectangles & Triangles',
    subject: 'Mathematics',
    grade: 6,
    strandTopic: 'Measurement · Geometry',
    type: 'diagram_model',
    summary: 'Visual formula breakdown and step-by-step calculation steps for geometric perimeters.',
    content: 'Perimeter is total boundary distance: P = 2(L + W). Area is surface extent: A = L x W. Right-angled triangle area = 1/2(base x height).',
    keyTakeaways: ['Perimeter units are linear (m, cm)', 'Area units are squared (m², cm²)', 'Compound shapes can be partitioned'],
    sizeBytes: 195000,
    isFrequentlyAccessed: true,
  },
  {
    id: 'cbc-mat-04',
    title: 'Algebraic Expressions & Simple Linear Equations',
    subject: 'Mathematics',
    grade: 7,
    strandTopic: 'Algebra · Linear Equations',
    type: 'lesson_note',
    summary: 'Forming algebraic expressions from word problems and solving balance-scale equations.',
    content: 'Variables represent unknown quantities. Solving linear equations requires inverse operations on both sides to maintain equality balance.',
    keyTakeaways: ['Maintain equality on both equation sides', 'Combine like terms before isolating variable', 'Inverse of multiplication is division'],
    sizeBytes: 164000,
    isFrequentlyAccessed: false,
  },

  // 2. INTEGRATED SCIENCE
  {
    id: 'cbc-sci-01',
    title: 'Plant Classification & Indigenous Flora of East Africa',
    subject: 'Integrated Science',
    grade: 4,
    strandTopic: 'Living Things · Botany',
    type: 'lesson_note',
    summary: 'Detailed taxonomy of flowering and non-flowering plants with leaf specimen diagrams.',
    content: 'Plants are broadly categorized into flowering (angiosperms) and non-flowering (gymnosperms, ferns, mosses). Leaves demonstrate parallel or net venation corresponding to monocots and dicots.',
    keyTakeaways: ['Flowering vs non-flowering plants', 'Taproot vs fibrous root systems', 'Leaf venation patterns'],
    sizeBytes: 248000,
    isFrequentlyAccessed: true,
  },
  {
    id: 'cbc-sci-02',
    title: 'Human Digestive System & Nutritional Absorption',
    subject: 'Integrated Science',
    grade: 5,
    strandTopic: 'Human Body · Nutrition',
    type: 'diagram_model',
    summary: 'Interactive anatomical model notes: mouth, esophagus, stomach, intestines, and liver.',
    content: 'Mechanical and chemical digestion processes break food into absorbable nutrients. Enzymes in saliva, gastric juice, and pancreatic secretion facilitate biochemical assimilation.',
    keyTakeaways: ['Enzymatic breakdown starts in mouth', 'Nutrient absorption in small intestine via villi', 'Water reabsorption in colon'],
    sizeBytes: 310000,
    isFrequentlyAccessed: true,
  },
  {
    id: 'cbc-sci-03',
    title: 'Properties of Matter & Separation of Mixtures',
    subject: 'Integrated Science',
    grade: 6,
    strandTopic: 'Matter · Physical Chemistry',
    type: 'lesson_note',
    summary: 'Filtration, evaporation, decantation, and magnetic separation laboratory protocols.',
    content: 'Mixtures retain individual chemical properties. Methods for separation depend on physical attributes: particle size, solubility, boiling point, and magnetic permeability.',
    keyTakeaways: ['Filtration separates insoluble solids from liquids', 'Evaporation recovers dissolved solutes', 'Simple distillation separates liquids with different boiling points'],
    sizeBytes: 182000,
    isFrequentlyAccessed: true,
  },
  {
    id: 'cbc-sci-04',
    title: 'Simple Machines: Levers, Pulleys & Inclined Planes',
    subject: 'Integrated Science',
    grade: 7,
    strandTopic: 'Force & Energy · Mechanics',
    type: 'video_guide',
    summary: 'Mechanical advantage calculations and real-world tools used in agriculture and trade.',
    content: 'Simple machines multiply effort force or redirect applied forces. Mechanical advantage is Load divided by Effort. Three lever classes depend on relative positions of fulcrum, effort, and load.',
    keyTakeaways: ['MA = Load / Effort', 'First class lever has fulcrum in center', 'Inclined planes reduce required lifting force'],
    sizeBytes: 220000,
    isFrequentlyAccessed: false,
  },

  // 3. ENGLISH LANGUAGE ACTIVITIES
  {
    id: 'cbc-eng-01',
    title: 'Parts of Speech: Concrete & Abstract Nouns with Context',
    subject: 'English',
    grade: 4,
    strandTopic: 'Grammar · Nouns & Morphology',
    type: 'lesson_note',
    summary: 'Distinguishing tangible entities from emotional qualities, concepts, and ideas.',
    content: 'Nouns name persons, places, things, or concepts. Concrete nouns are perceived by the 5 senses. Abstract nouns denote emotions, states, or philosophies like integrity, diligence, and bravery.',
    keyTakeaways: ['Concrete nouns can be seen/touched', 'Abstract nouns describe qualities and emotions', 'Proper nouns must capitalize first letter'],
    sizeBytes: 112000,
    isFrequentlyAccessed: true,
  },
  {
    id: 'cbc-eng-02',
    title: 'Oral Narrative Techniques & Kenyan Folk Tales',
    subject: 'English',
    grade: 5,
    strandTopic: 'Oral Literature · Storytelling',
    type: 'audio_lesson',
    summary: 'Audio transcript: Intonation, dramatic pausing, formulaic opening and closing formulas.',
    content: 'Kenyan traditional folk tales employ formulaic opening phrases (e.g. "Once upon a time", "A long long time ago") and moral codas. Performance incorporates vocal pitch modulation and gesture.',
    keyTakeaways: ['Call and response engages audience', 'Tonal inflection conveys mood', 'Fables teach community ethical standards'],
    sizeBytes: 285000,
    isFrequentlyAccessed: true,
  },
  {
    id: 'cbc-eng-03',
    title: 'Composing Formal & Semi-Formal Letters and Emails',
    subject: 'English',
    grade: 6,
    strandTopic: 'Writing · Functional Correspondence',
    type: 'lesson_note',
    summary: 'Layout rules: Sender address, recipient address, salutation, reference line, and sign-off.',
    content: 'Formal correspondence demands concise register and standardized conventions. Two addresses are required for formal letters. Clear subject lines enable rapid indexing and official action.',
    keyTakeaways: ['Use "Yours faithfully" when recipient name is unknown', 'Use "Yours sincerely" when recipient is named', 'Subject line must be underlined or bolded'],
    sizeBytes: 135000,
    isFrequentlyAccessed: false,
  },

  // 4. KISWAHILI LUGHA NA INSHA
  {
    id: 'cbc-swa-01',
    title: 'Ngeli za Nomino: Ngeli ya A-WA na KI-VI',
    subject: 'Kiswahili',
    grade: 4,
    strandTopic: 'Sarufi · Ngeli za Nomino',
    type: 'lesson_note',
    summary: 'Upatanisho wa kisarufi katika vitenzi, vivumishi, na viwakilishi kwa ngeli kuu.',
    content: 'Nomino katika lugha ya Kiswahili zimegawanywa katika ngeli kulingana na viambishi vya umoja na wingi. Ngeli ya A-WA inajumuisha viumbe vyenye uhai (mfano: mtoto mtiifu anasoma / watoto watiifu wanasoma).',
    keyTakeaways: ['Ngeli ya A-WA inahusisha viumbe hai', 'Ngeli ya KI-VI: kitabu kizuri / vitabu vizuri', 'Kuzingatia upatanisho sahihi wa sentensi'],
    sizeBytes: 125000,
    isFrequentlyAccessed: true,
  },
  {
    id: 'cbc-swa-02',
    title: 'Uandishi wa Insha ya Masimulizi na Mazungumzo',
    subject: 'Kiswahili',
    grade: 5,
    strandTopic: 'Uandishi · Insha za Kubuni',
    type: 'lesson_note',
    summary: 'Muundo kamili wa insha: mwanzo wenye mnato, kiini chenye mikondo ya mawazo, na hitimisho.',
    content: 'Insha ya masimulizi inahitaji matumizi sahihi ya lugha ya picha, nahau, misemo, na methali zilizoteuliwa vizuri bila kulazimisha mtiririko.',
    keyTakeaways: ['Matumizi ya lugha ya kiwango cha juu', 'Kugawa mawazo katika aya zilizopangwa', 'Kuepuka makosa ya hijai na tahajia'],
    sizeBytes: 140000,
    isFrequentlyAccessed: true,
  },
  {
    id: 'cbc-swa-03',
    title: 'Ushairi wa Kiswahili: Mashairi ya Arudhi na ya Masivina',
    subject: 'Kiswahili',
    grade: 6,
    strandTopic: 'Fasihi Simulizi · Ushairi',
    type: 'audio_lesson',
    summary: 'Uchambuzi wa vina, mizani, beti, kibwagizo, na uhuru wa mshairi (inkisari, mazida).',
    content: 'Mashairi ya kimapokeo yanafuata kanuni za arudhi (urari wa vina na mizani). Beti hugawanywa katika mistari: mwanzo, mloto, mleo, na kibwagizo.',
    keyTakeaways: ['Kibwagizo ni mstari unaorudiwa', 'Vina vya kati na vina vya mwisho', 'Mizani ni idadi ya silabi katika ubeti'],
    sizeBytes: 210000,
    isFrequentlyAccessed: false,
  },

  // 5. SOCIAL STUDIES
  {
    id: 'cbc-soc-01',
    title: 'Physical Features of Kenya: Great Rift Valley & Highlands',
    subject: 'Social Studies',
    grade: 4,
    strandTopic: 'Environment · Physical Geography',
    type: 'diagram_model',
    summary: 'Topographical relief maps, drainage basins of Lake Victoria and Indian Ocean rivers.',
    content: 'Kenya features varied topography spanning coastal plains, low plateaus, volcanic highlands, and the Great Rift Valley system. Physical features influence climate, vegetation, and economic activities.',
    keyTakeaways: ['Rift Valley formed by faulting and sinking', 'Mount Kenya is an extinct volcano', 'Tana and Athi rivers drain into Indian Ocean'],
    sizeBytes: 280000,
    isFrequentlyAccessed: true,
  },
  {
    id: 'cbc-soc-02',
    title: 'Traditional Governance Systems & Cultural Heritage in Kenya',
    subject: 'Social Studies',
    grade: 5,
    strandTopic: 'Citizenship · Cultural Heritage',
    type: 'lesson_note',
    summary: 'Councils of elders (e.g. Njuri Ncheke), dispute resolution mechanisms, and community age-sets.',
    content: 'Traditional Kenyan communities utilized deliberative councils of elders to maintain order, resolve land boundaries, and negotiate peace. Age-set transitions imparted moral instruction.',
    keyTakeaways: ['Councils emphasized community reconciliation', 'Oral heritage transmitted cultural norms', 'National unity celebrates cultural diversity'],
    sizeBytes: 155000,
    isFrequentlyAccessed: true,
  },
  {
    id: 'cbc-soc-03',
    title: 'Democracy, Constitutional Rights & Civic Responsibilities',
    subject: 'Social Studies',
    grade: 6,
    strandTopic: 'Governance · Constitution of Kenya 2010',
    type: 'cba_rubric',
    summary: 'Bill of Rights, national values, electoral integrity, and citizen obligations.',
    content: 'Article 10 of the Constitution enshrines national values including human dignity, equity, social justice, and good governance. Citizens bear responsibility to protect public resources and obey the law.',
    keyTakeaways: ['Sovereignty belongs to the people of Kenya', 'Three arms: Executive, Legislature, Judiciary', 'Devolved governance supports equitable development'],
    sizeBytes: 190000,
    isFrequentlyAccessed: false,
  },

  // 6. AGRICULTURE & NUTRITION
  {
    id: 'cbc-agr-01',
    title: 'Soil Conservation & Water Harvesting on the School Farm',
    subject: 'Agriculture & Nutrition',
    grade: 4,
    strandTopic: 'Crop Production · Soil Stewardship',
    type: 'diagram_model',
    summary: 'Terracing, mulching, contour farming, and rainwater roof catchment tanks.',
    content: 'Soil erosion depletes topsoil nutrients. Biological conservation includes cover crops and agroforestry; physical methods comprise fanya-juu terraces, stone lines, and grass strips.',
    keyTakeaways: ['Mulching retains moisture and suppresses weeds', 'Terracing reduces runoff velocity on slopes', 'Composting enriches organic soil matter'],
    sizeBytes: 220000,
    isFrequentlyAccessed: true,
  },
  {
    id: 'cbc-agr-02',
    title: 'Indigenous Vegetables: Managu, Terere & Saga Cultivation',
    subject: 'Agriculture & Nutrition',
    grade: 5,
    strandTopic: 'Nutrition · Indigenous Crops',
    type: 'lesson_note',
    summary: 'Nutritional density, nursery bed establishment, organic pest management, and harvesting.',
    content: 'African indigenous vegetables are rich in vitamin A, iron, calcium, and antioxidants. They exhibit pest resistance and drought tolerance suited for climate-smart farming.',
    keyTakeaways: ['High iron and micronutrient density', 'Short gestation period from seed to harvest', 'Natural neem sprays protect against pests'],
    sizeBytes: 165000,
    isFrequentlyAccessed: true,
  },

  // 7. CREATIVE ARTS & SPORTS
  {
    id: 'cbc-art-01',
    title: 'Basketry, Weaving & Indigenous Materials Manipulation',
    subject: 'Creative Arts & Sports',
    grade: 4,
    strandTopic: 'Visual Arts · Crafts & Weaving',
    type: 'lesson_note',
    summary: 'Preparation of sisal fibers, reed dyeing with local plants, and twining patterns.',
    content: 'Indigenous craft techniques utilize renewable plant fibers. Weaving combines warp (longitudinal) and weft (transverse) strands to fabricate functional domestic vessels.',
    keyTakeaways: ['Twining and coiling basketry methods', 'Natural dyes from bark, turmeric, and leaves', 'Craftwork builds spatial hand-eye coordination'],
    sizeBytes: 175000,
    isFrequentlyAccessed: true,
  },
  {
    id: 'cbc-art-02',
    title: 'Athletics: Relay Baton Exchanges & Track Sprint Form',
    subject: 'Creative Arts & Sports',
    grade: 5,
    strandTopic: 'Physical Education · Track Events',
    type: 'video_guide',
    summary: 'Visual exchange vs blind exchange techniques, acceleration zone pacing, and track safety.',
    content: 'Relay racing requires flawless baton transfer within the official takeover zone. Non-visual exchanges are mandatory for sprint relays (4x100m) to preserve forward momentum.',
    keyTakeaways: ['Baton transfer inside the 20-meter zone', 'Downward sweep vs upward sweep passing', 'Body lean and knee drive in sprint mechanics'],
    sizeBytes: 215000,
    isFrequentlyAccessed: false,
  },

  // 8. CHRISTIAN RELIGIOUS EDUCATION (CRE)
  {
    id: 'cbc-cre-01',
    title: 'Stewardship of Creation: Environmental Care as Divine Duty',
    subject: 'Christian Religious Education',
    grade: 4,
    strandTopic: 'Creation · Christian Values',
    type: 'lesson_note',
    summary: 'Biblical principles of stewardship, communal care, and combating environmental decay.',
    content: 'Genesis presents humanity as stewards charged with cultivating and safeguarding the earth. Contemporary Christians express faith through tree planting, clean water conservation, and anti-littering initiatives.',
    keyTakeaways: ['Stewards care for creation with reverence', 'Community service mirrors biblical love', 'Integrity in safeguarding common goods'],
    sizeBytes: 130000,
    isFrequentlyAccessed: true,
  },

  // 9. PRE-TECHNICAL & PRE-CAREER STUDIES
  {
    id: 'cbc-tech-01',
    title: 'Workshop Safety & Hand Tool Classification (Junior School)',
    subject: 'Pre-Technical Studies',
    grade: 7,
    strandTopic: 'Technical Skills · Safety & Tools',
    type: 'diagram_model',
    summary: 'Personal Protective Equipment (PPE), cutting, measuring, and holding tools.',
    content: 'Safe workshop practice prevents physical injury. Hand tools are classified into marking, measuring (try-square, tape), cutting (hacksaw, chisel), and driving tools (mallet, screwdriver).',
    keyTakeaways: ['Always wear eye protection and safety boots', 'Inspect tool handles before applying force', 'Clean and lubricate tools after work sessions'],
    sizeBytes: 235000,
    isFrequentlyAccessed: true,
  }
];

export const OfflineCacheManager = {
  /**
   * Initializes or gets the current local cache
   */
  getAllModules(): CachedCBCModule[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        // Initial Seed: Pre-cache frequently accessed modules automatically
        const seeded: CachedCBCModule[] = DEFAULT_CBC_CATALOG.map((item) => ({
          ...item,
          isCached: item.isFrequentlyAccessed,
          cachedAt: item.isFrequentlyAccessed ? new Date().toISOString() : undefined,
          lastAccessedAt: item.isFrequentlyAccessed ? new Date().toISOString() : undefined
        }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
        localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
        return seeded;
      }
      return JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to read CBC cache from localStorage:', e);
      return DEFAULT_CBC_CATALOG.map((item) => ({
        ...item,
        isCached: item.isFrequentlyAccessed
      }));
    }
  },

  /**
   * Saves modules to storage and dispatches update event
   */
  saveModules(modules: CachedCBCModule[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(modules));
      localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
      this.dispatchUpdateEvent();
    } catch (e) {
      console.error('Failed to save CBC cache to localStorage:', e);
    }
  },

  /**
   * Formats raw bytes to human readable KB/MB
   */
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 KB';
    if (bytes < 1024 * 1024) {
      return `${Math.round(bytes / 1024)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  },

  /**
   * Returns complete real-time sync and storage breakdown status
   */
  getStatus(): OfflineCacheStatus {
    const modules = this.getAllModules();
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    const totalAvailable = modules.length;
    const cachedModules = modules.filter((m) => m.isCached);
    const cachedCount = cachedModules.length;
    const percentage = totalAvailable > 0 ? Math.round((cachedCount / totalAvailable) * 100) : 0;
    const totalSizeBytes = cachedModules.reduce((acc, m) => acc + (m.sizeBytes || 0), 0);
    const lastSyncTimestamp = localStorage.getItem(LAST_SYNC_KEY) || new Date().toISOString();

    // Determine sync health
    let syncHealth: OfflineSyncHealth = 'partial';
    if (!isOnline) {
      syncHealth = 'offline';
    } else if (percentage === 100) {
      syncHealth = 'synced';
    } else if (percentage > 0) {
      syncHealth = 'partial';
    } else {
      syncHealth = 'needs_update';
    }

    // Group by Subject
    const subjectMap: Record<string, CachedCBCModule[]> = {};
    modules.forEach((m) => {
      if (!subjectMap[m.subject]) {
        subjectMap[m.subject] = [];
      }
      subjectMap[m.subject].push(m);
    });

    const bySubject: SubjectStorageSummary[] = Object.keys(subjectMap).map((subject) => {
      const subjModules = subjectMap[subject];
      const subjCached = subjModules.filter((m) => m.isCached);
      const subjSizeBytes = subjCached.reduce((acc, m) => acc + (m.sizeBytes || 0), 0);
      const subjPercent = subjModules.length > 0 ? Math.round((subjCached.length / subjModules.length) * 100) : 0;

      return {
        subject,
        iconName: this.getSubjectIconName(subject),
        totalModules: subjModules.length,
        cachedModules: subjCached.length,
        totalSizeBytes: subjSizeBytes,
        formattedSize: this.formatBytes(subjSizeBytes),
        percentage: subjPercent,
        modules: subjModules
      };
    });

    return {
      totalAvailable,
      cachedCount,
      percentage,
      totalSizeBytes,
      formattedTotalSize: this.formatBytes(totalSizeBytes),
      syncHealth,
      isOnline,
      lastSyncTimestamp,
      bySubject
    };
  },

  /**
   * Maps subject name to icon identifier
   */
  getSubjectIconName(subject: string): string {
    switch (subject) {
      case 'Mathematics': return 'Calculator';
      case 'Integrated Science': return 'FlaskConical';
      case 'English': return 'BookOpen';
      case 'Kiswahili': return 'Languages';
      case 'Social Studies': return 'Globe2';
      case 'Agriculture & Nutrition': return 'Wheat';
      case 'Creative Arts & Sports': return 'Palette';
      case 'Christian Religious Education': return 'HeartHandshake';
      case 'Pre-Technical Studies': return 'Wrench';
      default: return 'BookMarked';
    }
  },

  /**
   * Caches all available CBC learning materials (100% full offline coverage)
   */
  cacheAllMaterials(): Promise<void> {
    return new Promise((resolve) => {
      // Dispatch syncing state
      window.dispatchEvent(new CustomEvent('offline-cache-sync-state', { detail: { state: 'syncing' } }));
      
      setTimeout(() => {
        const modules = this.getAllModules().map((m) => ({
          ...m,
          isCached: true,
          cachedAt: new Date().toISOString()
        }));
        this.saveModules(modules);
        window.dispatchEvent(new CustomEvent('offline-cache-sync-state', { detail: { state: 'synced' } }));
        resolve();
      }, 600);
    });
  },

  /**
   * Caches a specific single module
   */
  cacheModule(id: string): void {
    const modules = this.getAllModules().map((m) => {
      if (m.id === id) {
        return {
          ...m,
          isCached: true,
          cachedAt: new Date().toISOString(),
          lastAccessedAt: new Date().toISOString()
        };
      }
      return m;
    });
    this.saveModules(modules);
  },

  /**
   * Manually clears a specific CBC learning module from cache
   */
  clearModule(id: string): void {
    const modules = this.getAllModules().map((m) => {
      if (m.id === id) {
        return {
          ...m,
          isCached: false,
          cachedAt: undefined
        };
      }
      return m;
    });
    this.saveModules(modules);
  },

  /**
   * Manually clears the entire local cache for a specific subject
   */
  clearCacheBySubject(subject: string): void {
    const modules = this.getAllModules().map((m) => {
      if (m.subject === subject) {
        return {
          ...m,
          isCached: false,
          cachedAt: undefined
        };
      }
      return m;
    });
    this.saveModules(modules);
  },

  /**
   * Caches all modules for a specific subject
   */
  cacheSubject(subject: string): void {
    const modules = this.getAllModules().map((m) => {
      if (m.subject === subject) {
        return {
          ...m,
          isCached: true,
          cachedAt: new Date().toISOString()
        };
      }
      return m;
    });
    this.saveModules(modules);
  },

  /**
   * Manually clears all cached CBC materials across all subjects
   */
  clearAllCache(): void {
    const modules = this.getAllModules().map((m) => ({
      ...m,
      isCached: false,
      cachedAt: undefined
    }));
    this.saveModules(modules);
  },

  /**
   * Dispatches window event for instant reactive component updates
   */
  dispatchUpdateEvent(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('offline-cache-updated', { detail: this.getStatus() }));
    }
  },

  /**
   * Registers Service Worker in supported browsers
   */
  registerServiceWorker(): void {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('EduSmart CBC Service Worker registered successfully:', registration.scope);
          })
          .catch((error) => {
            console.warn('EduSmart Service Worker registration note:', error);
          });
      });
    }
  }
};
