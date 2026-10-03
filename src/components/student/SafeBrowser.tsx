import React, { useState, useEffect } from 'react';
import { User, GradeLevel } from '../../types';
import { Storage } from '../../utils/storage';
import { EduSmartGadsaLogo } from '../common/EduSmartGadsaLogo';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Search, 
  ArrowLeft, 
  ArrowRight, 
  RotateCw, 
  Home, 
  Bookmark, 
  Lock, 
  Sparkles, 
  BookOpen, 
  CheckCircle2, 
  AlertTriangle, 
  Volume2, 
  VolumeX, 
  FilePlus2, 
  ExternalLink,
  Globe,
  Compass,
  Lightbulb,
  GraduationCap,
  History,
  X,
  Share2
} from 'lucide-react';

interface SafeBrowserProps {
  currentUser: User;
  onClose?: () => void;
  onSaveToPortfolio?: (title: string, content: string, subject: string) => void;
}

interface CuratedBookmark {
  id: string;
  title: string;
  url: string;
  category: string;
  gradeTier: string;
  icon: string;
  description: string;
  sampleContent: string;
  keyFacts: string[];
}

const CURATED_BOOKMARKS: CuratedBookmark[] = [
  {
    id: 'bm-kicd',
    title: 'KICD Curriculum Cloud',
    url: 'edusafe://kicd-curriculum.ac.ke/core-strands',
    category: 'CBC Official Syllabus',
    gradeTier: 'Grades 1-9',
    icon: '🇰🇪',
    description: 'Kenya Institute of Curriculum Development official learning strands, curriculum designs, and competencies.',
    sampleContent: `The Competency-Based Curriculum (CBC) in Kenya emphasizes practical skills, values, and critical thinking across Grades 1 through 9.

Core competencies include Communication and Collaboration, Critical Thinking and Problem Solving, Imagination and Creativity, Citizenship, Digital Literacy, Learning to Learn, and Self-Efficacy.

Learners engage in continuous formative assessments, strand-based project work, and community service learning to demonstrate genuine mastery.`,
    keyFacts: [
      'Focuses on 7 Core CBC Competencies.',
      'Emphasizes formative classroom assessments and practical portfolios.',
      'Official curriculum standards maintained by the Ministry of Education.'
    ]
  },
  {
    id: 'bm-natgeo',
    title: 'NatGeo Kids: Kenyan Wildlife & Conservation',
    url: 'edusafe://natgeokids.org/kenya-ecosystems',
    category: 'Science & Environment',
    gradeTier: 'Grades 1-6',
    icon: '🦁',
    description: 'Explore the Great Rift Valley, Tsavo elephants, Masai Mara wildebeest migration, and marine life at the Kenyan coast.',
    sampleContent: `Kenya is world-renowned for its incredible biodiversity, home to the 'Big Five'—Lion, Elephant, Rhino, Leopard, and Cape Buffalo.

Conservation organizations in Kenya work closely with local communities and the Kenya Wildlife Service (KWS) to protect endangered species, prevent habitat fragmentation, and combat poaching.

National Parks such as Amboseli offer stunning views of Mount Kilimanjaro while serving as vital breeding sanctuaries for African elephants.`,
    keyFacts: [
      'Over 25,000 animal species inhabit Kenyan ecosystems.',
      'Community conservancies empower local pastoralists to protect wildlife.',
      'Key CBC strand: Environmental Activities & Living Things.'
    ]
  },
  {
    id: 'bm-nasa',
    title: 'NASA Space Place for Young Astronomers',
    url: 'edusafe://spaceplace.nasa.gov/solar-system',
    category: 'Astronomy & Physics',
    gradeTier: 'Grades 4-9',
    icon: '🚀',
    description: 'Discover planets, the Moon, solar eclipses, robotic Mars rovers, and distant galaxies in our solar neighborhood.',
    sampleContent: `Our solar system consists of our star, the Sun, and everything bound to it by gravity—the planets Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune; dwarf planets such as Pluto; dozens of moons; and millions of asteroids, comets, and meteoroids.

Earth is the third planet from the Sun and the only astronomical object known to harbor life, protected by an atmosphere rich in nitrogen and oxygen.

Modern space telescopes such as the James Webb Space Telescope allow scientists to look billions of years into cosmic history.`,
    keyFacts: [
      'The Sun contains 99.8% of the total mass of the solar system.',
      'Jupiter has a giant storm called the Great Red Spot that has raged for centuries.',
      'Key CBC strand: Science & Technology (The Solar System).'
    ]
  },
  {
    id: 'bm-african-stories',
    title: 'African Storybook & Literacy Explorer',
    url: 'edusafe://africanstorybook.org/tales-and-folklore',
    category: 'Language & Literature',
    gradeTier: 'Grades 1-5',
    icon: '📖',
    description: 'Illustrated traditional folktales, multilingual storybooks, and reading comprehension exercises in English and Kiswahili.',
    sampleContent: `Traditional African folktales have been passed down through generations around the evening fire. Stories featuring the cunning Hare (Sungura Mjanja), the patient Tortoise, and the wise Elephant teach timeless moral values such as honesty, humility, perseverance, and respect for elders.

Reading stories every day expands vocabulary, enhances imaginative writing, and strengthens both English and Kiswahili linguistic competencies under the CBC curriculum.`,
    keyFacts: [
      'Promotes bilingual literacy in English and Kiswahili.',
      'Encourages moral reflection and cultural appreciation.',
      'Supports independent silent reading and comprehension drills.'
    ]
  },
  {
    id: 'bm-science-lab',
    title: 'Interactive CBC Science & Experiment Lab',
    url: 'edusafe://sciencelab.edusmart.ac.ke/experiments',
    category: 'Integrated Science',
    gradeTier: 'Grades 6-9',
    icon: '🔬',
    description: 'Safe home and classroom experiments: filtration, simple circuits, plant germination, and soil conservation.',
    sampleContent: `Scientific inquiry begins with asking a clear question, forming a testable hypothesis, gathering materials, and recording accurate observations.

In soil science, learners test the water retention capacities of clay, loam, and sand soils to determine optimal conditions for staple crops like maize and beans.

Simple electrical circuits using dry cells, copper wires, and miniature bulbs demonstrate how energy is transferred and controlled.`,
    keyFacts: [
      'Step-by-step scientific method application.',
      'Emphasizes safety with everyday household and laboratory materials.',
      'Direct alignment with Junior School Integrated Science.'
    ]
  },
  {
    id: 'bm-digital-kenya',
    title: 'Digital Citizens: Computing & Online Safety',
    url: 'edusafe://digitalcitizens.edusmart.ac.ke/cyber-safety',
    category: 'Computer Science & ICT',
    gradeTier: 'Grades 4-9',
    icon: '💻',
    description: 'Learn cyber etiquette, password security, protecting personal privacy, and identifying credible information.',
    sampleContent: `Being a responsible digital citizen means using the internet safely, respectfully, and thoughtfully.

Never share your personal information, home address, phone numbers, or passwords with strangers online. Always verify facts from multiple educational sources before believing or sharing information.

If you ever encounter uncomfortable content, cyberbullying, or suspicious messages, immediately notify your teacher, parent, or school guardian.`,
    keyFacts: [
      'Strong passwords should use letters, numbers, and symbols.',
      'Digital footprints are permanent records of our online activities.',
      'Aligned with the National Child Online Protection guidelines.'
    ]
  }
];

export const SafeBrowser: React.FC<SafeBrowserProps> = ({ 
  currentUser, 
  onClose,
  onSaveToPortfolio 
}) => {
  const defaultGrade = currentUser.grade || 4;
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>(defaultGrade);
  const [inputQuery, setInputQuery] = useState('');
  const [currentUrl, setCurrentUrl] = useState('edusafe://kicd-curriculum.ac.ke/core-strands');
  const [pageTitle, setPageTitle] = useState('KICD Curriculum Cloud — CBC Educational Portal');
  const [isEvaluating, setIsEvaluating] = useState(false);
  
  // Active reading page content
  const [activeArticle, setActiveArticle] = useState<{
    title: string;
    url: string;
    category: string;
    readingTime: string;
    content: string;
    keyFacts: string[];
    socraticPrompt?: string;
    cbcStrand?: string;
    safetyScore: number;
    safetyStatus: 'safe' | 'caution' | 'blocked';
    safetyReason: string;
    suggestedQueries: string[];
  }>({
    title: CURATED_BOOKMARKS[0].title,
    url: CURATED_BOOKMARKS[0].url,
    category: CURATED_BOOKMARKS[0].category,
    readingTime: '3 min read',
    content: CURATED_BOOKMARKS[0].sampleContent,
    keyFacts: CURATED_BOOKMARKS[0].keyFacts,
    socraticPrompt: "How do the 7 CBC core competencies help you become a productive leader in your community?",
    cbcStrand: "CBC Foundation Strands & Competency Framework",
    safetyScore: 100,
    safetyStatus: 'safe',
    safetyReason: "Verified official school curriculum repository. Strictly safe for Grades 1 to 9.",
    suggestedQueries: [
      "Kenyan Wildlife & Conservation",
      "Solar System and Planets",
      "CBC Science Experiments",
      "Digital Citizenship and Safety"
    ]
  });

  const [history, setHistory] = useState<string[]>([CURATED_BOOKMARKS[0].url]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [portfolioNotice, setPortfolioNotice] = useState<string | null>(null);

  // Stop speech when component unmounts
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Text to speech toggler
  const toggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const textToRead = `${activeArticle.title}. ${activeArticle.content}`;
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  // Perform safe search or URL fetch
  const handlePerformSearch = async (queryToSearch: string) => {
    const q = queryToSearch.trim();
    if (!q) return;

    setIsEvaluating(true);
    setInputQuery(q);

    // Stop speaking if active
    if ('speechSynthesis' in window && isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    try {
      const response = await fetch('/api/safe-browser-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          grade: selectedGrade,
          url: currentUrl
        })
      });

      const data = await response.json();

      // Log in storage for institutional oversight & parent transparency
      Storage.logSearchQuery({
        id: `search-${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        grade: selectedGrade,
        searchQuery: q,
        timestamp: new Date().toISOString(),
        status: data.safetyStatus === 'blocked' ? 'flagged' : data.safetyStatus === 'caution' ? 'guided_redirection' : 'safe',
        filterReason: data.safetyReason,
        educationalTopicFound: data.category
      });

      if (data.safetyStatus === 'blocked') {
        const blockedUrl = `edusafe://restricted-safety-shield?query=${encodeURIComponent(q)}`;
        setCurrentUrl(blockedUrl);
        setPageTitle('Access Filtered — School Guardian Shield');
        setActiveArticle({
          title: 'Guardian Shield: Access Restricted',
          url: blockedUrl,
          category: 'Child Online Safety Filtration',
          readingTime: '1 min notice',
          content: `${data.safetyReason}\n\nUnder the EduSmart Digital Learning and Kenya Child Online Protection guidelines, searches containing prohibited themes are blocked to ensure all students remain focused on positive, age-appropriate educational learning.\n\nYour school leadership (Deputy Head and Senior Teacher) and guardian have been recorded in the safety audit register. Please use this portal to research curriculum subjects, science, literature, history, and community innovation.`,
          keyFacts: [
            'Prohibited content is automatically intercepted by AI content filters.',
            'Educational redirection promotes constructive digital citizenship.',
            'School supervision logs are regularly reviewed by the Deputy Head.'
          ],
          socraticPrompt: data.educationalGuidance?.socraticPrompt || "How can you reframe this search toward positive curriculum research?",
          cbcStrand: "CBC Digital Citizenship & Ethics",
          safetyScore: data.safetyScore || 15,
          safetyStatus: 'blocked',
          safetyReason: data.safetyReason,
          suggestedQueries: data.educationalGuidance?.suggestedSafeQueries || [
            "Kenyan Wildlife & Conservation",
            "Grade " + selectedGrade + " Science Projects",
            "Renewable Energy in Africa",
            "Story of Wangari Maathai"
          ]
        });
      } else {
        // Safe or Caution
        const firstResult = data.filteredResults?.[0];
        const newUrl = firstResult?.url || `edusafe://knowledge.edusmart.ac.ke/search?q=${encodeURIComponent(q)}`;
        const newTitle = firstResult?.title || `${q.charAt(0).toUpperCase() + q.slice(1)} — Educational Guide`;

        setCurrentUrl(newUrl);
        setPageTitle(newTitle);
        setActiveArticle({
          title: newTitle,
          url: newUrl,
          category: data.category || 'Curriculum Inquiry',
          readingTime: firstResult?.readingTime || '3 min read',
          content: firstResult?.safeReadingContent || `Researching "${q}" under Grade ${selectedGrade} CBC competencies allows learners to build key analytical skills.\n\nLearners are encouraged to read thoughtfully, take organized summary notes, and correlate their findings with classroom strand topics. Sharing insights with classmates during interactive group work reinforces retention and practical understanding.`,
          keyFacts: firstResult?.keyFacts || [
            'Verified educational topic aligned with Grade ' + selectedGrade + ' CBC competencies.',
            'Encourages inquiry-based learning and critical thinking.',
            'Approved by the EduSmart AI Safety Filtration Engine.'
          ],
          socraticPrompt: data.educationalGuidance?.socraticPrompt || `What is the most interesting discovery you made while investigating ${q}?`,
          cbcStrand: data.educationalGuidance?.cbcStrandLink || `Grade ${selectedGrade} CBC Strand Integration`,
          safetyScore: data.safetyScore || 95,
          safetyStatus: data.safetyStatus || 'safe',
          safetyReason: data.safetyReason || 'Safe educational content verified.',
          suggestedQueries: data.educationalGuidance?.suggestedSafeQueries || [
            `${q} in Kenya`,
            `How does ${q} work`,
            `Grade ${selectedGrade} practical project on ${q}`
          ]
        });

        // Add to history
        setHistory(prev => [...prev.slice(0, historyIndex + 1), newUrl]);
        setHistoryIndex(prev => prev + 1);
      }
    } catch (err) {
      console.error('Error during safe search:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Click on a curated bookmark
  const handleOpenBookmark = (bm: CuratedBookmark) => {
    if (isSpeaking && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    setCurrentUrl(bm.url);
    setPageTitle(bm.title);
    setInputQuery('');
    setActiveArticle({
      title: bm.title,
      url: bm.url,
      category: bm.category,
      readingTime: '3 min read',
      content: bm.sampleContent,
      keyFacts: bm.keyFacts,
      socraticPrompt: `How does the knowledge found in "${bm.title}" relate to your ongoing CBC term projects?`,
      cbcStrand: `${bm.category} (Grade ${selectedGrade})`,
      safetyScore: 100,
      safetyStatus: 'safe',
      safetyReason: `Approved official resource for ${bm.gradeTier}.`,
      suggestedQueries: [
        "Key takeaways from " + bm.title,
        "Practical classroom activities for " + bm.title,
        "Connecting " + bm.title + " to community challenges"
      ]
    });

    setHistory(prev => [...prev.slice(0, historyIndex + 1), bm.url]);
    setHistoryIndex(prev => prev + 1);
  };

  // Save current note to portfolio
  const handleSaveToPortfolio = () => {
    const portfolioTitle = `Research Note: ${activeArticle.title}`;
    const portfolioContent = `Source: ${activeArticle.url} (Grade ${selectedGrade} Safe Browser)\nCategory: ${activeArticle.category}\n\nSummary:\n${activeArticle.content}\n\nKey Takeaways:\n${activeArticle.keyFacts.map(f => `• ${f}`).join('\n')}`;

    if (onSaveToPortfolio) {
      onSaveToPortfolio(portfolioTitle, portfolioContent, activeArticle.category);
    } else {
      Storage.addPortfolioItem({
        id: `port-sb-${Date.now()}`,
        studentId: currentUser.id,
        studentName: currentUser.name,
        grade: selectedGrade,
        subject: 'Integrated Science',
        title: portfolioTitle,
        description: `Clipping from Safe Browser research on "${activeArticle.title}"`,
        learningStrand: activeArticle.category || 'Digital Literacy & Inquiry',
        category: 'Digital Evidence',
        evidenceUrl: activeArticle.url,
        reflection: portfolioContent,
        awardedPoints: 25,
        createdAt: new Date().toISOString()
      });
    }

    setPortfolioNotice("Saved to your E-Portfolio (+25 XP)!");
    setTimeout(() => setPortfolioNotice(null), 3500);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[680px]">
      {/* ========================================================
          BROWSER TOP CHROME & TOOLBAR
          ======================================================== */}
      <div className="bg-slate-900 text-white p-3 border-b border-slate-800 flex flex-col gap-2.5">
        
        {/* Top Status Bar: App Name, Grade Selector, Close Button */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-white p-1 rounded-xl shadow-xs hidden sm:block">
              <EduSmartGadsaLogo variant="horizontal" size="xs" />
            </div>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex sm:hidden items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white tracking-wide">
                  AI Safe Browser
                </span>
                <span className="px-1.5 py-0.2 bg-emerald-900/60 text-emerald-300 text-[10px] font-bold rounded border border-emerald-700">
                  AI Guardrails Active
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Age-appropriate, CBC-aligned content filter for Grades 1 to 9
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Grade Tier Selector */}
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-700 text-xs">
              <span className="text-slate-400 text-[11px] font-medium hidden sm:inline">Filter Grade:</span>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(Number(e.target.value) as GradeLevel)}
                className="bg-transparent text-emerald-300 font-bold text-xs focus:outline-none cursor-pointer"
                title="Select Grade Level for Content Calibration"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((g) => (
                  <option key={g} value={g} className="bg-slate-900 text-white">
                    Grade {g} ({g <= 3 ? 'Lower Primary' : g <= 6 ? 'Upper Primary' : 'Junior School'})
                  </option>
                ))}
              </select>
            </div>

            {onClose && (
              <button
                onClick={onClose}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Close Browser"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Address Bar & Navigation Buttons */}
        <div className="flex items-center gap-2">
          {/* Nav Controls */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => {
                if (historyIndex > 0) {
                  setHistoryIndex(prev => prev - 1);
                  setCurrentUrl(history[historyIndex - 1]);
                }
              }}
              disabled={historyIndex === 0}
              className="p-1.5 text-slate-300 hover:text-white disabled:text-slate-600 disabled:cursor-not-allowed rounded hover:bg-slate-800"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (historyIndex < history.length - 1) {
                  setHistoryIndex(prev => prev + 1);
                  setCurrentUrl(history[historyIndex + 1]);
                }
              }}
              disabled={historyIndex >= history.length - 1}
              className="p-1.5 text-slate-300 hover:text-white disabled:text-slate-600 disabled:cursor-not-allowed rounded hover:bg-slate-800"
              title="Forward"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => handlePerformSearch(inputQuery || activeArticle.title)}
              className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-slate-800"
              title="Refresh / Re-evaluate"
            >
              <RotateCw className={`w-4 h-4 ${isEvaluating ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
            <button
              onClick={() => handleOpenBookmark(CURATED_BOOKMARKS[0])}
              className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-slate-800"
              title="Home (KICD Cloud)"
            >
              <Home className="w-4 h-4" />
            </button>
          </div>

          {/* Omnibox / Search & URL Input */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handlePerformSearch(inputQuery);
            }} 
            className="flex-1 flex items-center bg-slate-950 rounded-xl px-3 py-1.5 border border-slate-700/80 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all"
          >
            <div className="flex items-center gap-1.5 text-emerald-400 mr-2 shrink-0">
              <Lock className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 hidden md:inline">
                EduSafe SSL
              </span>
            </div>
            
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Search curriculum topic, animal, science experiment, or enter query..."
              className="flex-1 bg-transparent text-white text-xs placeholder:text-slate-500 focus:outline-none"
            />

            {isEvaluating ? (
              <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold px-2 animate-pulse">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Filtering...</span>
              </div>
            ) : (
              <button
                type="submit"
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 ml-1"
              >
                <Search className="w-3 h-3" />
                <span>Explore</span>
              </button>
            )}
          </form>

          {/* Audio TTS & Portfolio Buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={toggleSpeech}
              className={`p-1.5 rounded-lg border transition-colors flex items-center gap-1 text-xs font-semibold ${
                isSpeaking 
                  ? 'bg-amber-600 border-amber-500 text-white animate-pulse' 
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
              title={isSpeaking ? "Stop Reading Aloud" : "Read Page Aloud (TTS)"}
            >
              {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              <span className="text-[11px] hidden sm:inline">{isSpeaking ? 'Stop' : 'Listen'}</span>
            </button>

            <button
              onClick={handleSaveToPortfolio}
              className="p-1.5 rounded-lg bg-emerald-700/80 hover:bg-emerald-600 text-white border border-emerald-600 transition-colors flex items-center gap-1 text-xs font-semibold"
              title="Clip & Save this research to your Student E-Portfolio"
            >
              <FilePlus2 className="w-4 h-4" />
              <span className="text-[11px] hidden md:inline">Save Note</span>
            </button>
          </div>
        </div>

        {/* Quick Bookmarks Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 text-xs scrollbar-none">
          <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1 shrink-0 pl-0.5">
            <Bookmark className="w-3 h-3 text-amber-400" />
            Curated Hubs:
          </span>
          {CURATED_BOOKMARKS.map((bm) => (
            <button
              key={bm.id}
              onClick={() => handleOpenBookmark(bm)}
              className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors border ${
                currentUrl === bm.url
                  ? 'bg-emerald-800/80 text-emerald-100 border-emerald-600'
                  : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <span>{bm.icon}</span>
              <span>{bm.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Portfolio Notification Toast */}
      {portfolioNotice && (
        <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between shadow-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>{portfolioNotice}</span>
          </div>
          <span className="text-[10px] text-emerald-100 font-mono">Synced to Student Portfolio</span>
        </div>
      )}

      {/* ========================================================
          BROWSER BODY: CONTENT FILTRATION & WEBPAGE SANDBOX
          ======================================================== */}
      <div className="flex-1 p-4 md:p-6 bg-slate-50 flex flex-col lg:flex-row gap-6">
        
        {/* Main Educational Reader Screen */}
        <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-xs p-6 md:p-8 flex flex-col justify-between overflow-y-auto">
          <div>
            {/* AI Safety Verification Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-6 border-b border-slate-100">
              <div className="flex items-center gap-2">
                {activeArticle.safetyStatus === 'blocked' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 text-xs font-bold rounded-full border border-rose-200">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                    School Guardian Shield: Filtered
                  </span>
                ) : activeArticle.safetyStatus === 'caution' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-200">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Supervised Topic (Guidance Active)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    AI Verified Educational Content (Score: {activeArticle.safetyScore}/100)
                  </span>
                )}

                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs font-semibold text-slate-600">{activeArticle.category}</span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="font-mono text-[11px]">Grade {selectedGrade} Aligned</span>
                <span>·</span>
                <span>{activeArticle.readingTime}</span>
              </div>
            </div>

            {/* Article Heading */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-4">
              {activeArticle.title}
            </h1>

            {/* If blocked, show specialized Guardian Shield UI */}
            {activeArticle.safetyStatus === 'blocked' ? (
              <div className="bg-rose-50 border-2 border-rose-200 rounded-xl p-5 mb-6 text-rose-950">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-rose-100 rounded-lg text-rose-700 shrink-0">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-extrabold text-sm text-rose-900">
                      Child Online Protection Policy Triggered
                    </h3>
                    <p className="text-xs text-rose-800 leading-relaxed">
                      {activeArticle.safetyReason}
                    </p>
                    <div className="text-[11px] text-rose-700 font-medium">
                      Incident logged in the school administrative safety register for Grade {selectedGrade}. Digital citizenship is a core CBC competency for every learner.
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Clean Educational Article Body */}
            <div className="prose prose-slate max-w-none text-slate-700 text-sm leading-relaxed space-y-4">
              {activeArticle.content.split('\n\n').map((paragraph, idx) => (
                <p key={idx} className="leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Key Fact Takeaways */}
            {activeArticle.keyFacts && activeArticle.keyFacts.length > 0 && (
              <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2.5 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Key CBC Learning Takeaways:
                </h3>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {activeArticle.keyFacts.map((fact, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <span>{fact}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Reader Footer Controls */}
          <div className="mt-8 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-mono text-[11px] text-slate-600 truncate max-w-[280px]">
                {activeArticle.url}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveToPortfolio}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg transition-colors border border-emerald-200 flex items-center gap-1.5"
              >
                <FilePlus2 className="w-3.5 h-3.5" />
                <span>Save to E-Portfolio</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar: AI Socratic Tutor & Suggested Inquiries */}
        <div className="w-full lg:w-80 space-y-4">
          
          {/* AI Socratic Inquiry Card */}
          <div className="bg-gradient-to-br from-emerald-900 to-slate-900 text-white rounded-xl p-5 shadow-xs border border-emerald-800/40">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 mb-2">
              <Lightbulb className="w-4 h-4" />
              <span>Socratic Inquiry Guide</span>
            </div>
            
            <p className="text-xs text-slate-200 leading-relaxed mb-3">
              "{activeArticle.socraticPrompt || 'What connections can you draw between this topic and your daily life in Kenya?'}"
            </p>

            <div className="pt-2 border-t border-emerald-800/60 flex items-center justify-between text-[11px] text-emerald-300">
              <span className="font-medium">CBC Strand Link:</span>
              <span className="font-bold text-white text-right truncate max-w-[150px]">
                {activeArticle.cbcStrand || `Grade ${selectedGrade}`}
              </span>
            </div>
          </div>

          {/* Suggested Safe Searches Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-emerald-600" />
              Suggested Curriculum Searches:
            </h3>

            <div className="space-y-1.5">
              {activeArticle.suggestedQueries.map((sug, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePerformSearch(sug)}
                  className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-emerald-50 hover:text-emerald-900 text-xs text-slate-700 transition-colors border border-slate-100 flex items-center justify-between group"
                >
                  <span className="truncate">{sug}</span>
                  <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                </button>
              ))}
            </div>
          </div>

          {/* Grade Appropriateness Information */}
          <div className="bg-blue-50/70 rounded-xl border border-blue-200/80 p-4 text-xs text-blue-950">
            <div className="flex items-center gap-1.5 font-bold text-blue-900 mb-1.5">
              <GraduationCap className="w-4 h-4 text-blue-700" />
              <span>Grades 1-9 Calibration</span>
            </div>
            <p className="text-[11px] text-blue-800 leading-relaxed mb-2">
              The AI Safe Browser dynamically adapts reading levels, vocabulary complexity, and strand context based on your selected grade.
            </p>
            <div className="grid grid-cols-3 gap-1 text-[10px] text-center font-bold">
              <span className={`p-1 rounded ${selectedGrade <= 3 ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'}`}>
                Grades 1-3
              </span>
              <span className={`p-1 rounded ${selectedGrade >= 4 && selectedGrade <= 6 ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'}`}>
                Grades 4-6
              </span>
              <span className={`p-1 rounded ${selectedGrade >= 7 ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'}`}>
                Grades 7-9
              </span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
