import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Bot, 
  Send, 
  X, 
  Sparkles, 
  RefreshCw, 
  Copy, 
  Check, 
  GraduationCap, 
  BookOpen, 
  FlaskConical, 
  School, 
  Zap, 
  Cpu, 
  MessageSquare,
  HelpCircle,
  Lightbulb,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { User } from '../../types';
import { useTenant } from '../../context/TenantContext';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  modelUsed?: string;
}

export type ChatbotRole = 'student' | 'teacher' | 'science_lab' | 'admin' | 'parent';
export type ChatComplexity = 'fast' | 'general' | 'complex';

interface GeminiChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: User | null;
  defaultRole?: ChatbotRole;
  initialTopicPrompt?: string;
}

export const GeminiChatbotModal: React.FC<GeminiChatbotModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  defaultRole,
  initialTopicPrompt
}) => {
  const { currentTenant } = useTenant();
  
  // Determine starting role
  const resolvedRole = defaultRole || (
    currentUser?.role === 'student' ? 'student' :
    currentUser?.role && ['teacher', 'class_teacher', 'hod', 'dean_of_studies'].includes(currentUser.role) ? 'teacher' :
    currentUser?.role === 'parent' ? 'parent' :
    currentUser?.role === 'admin' ? 'admin' : 'student'
  );

  const [activeRole, setActiveRole] = useState<ChatbotRole>(resolvedRole);
  const [complexity, setComplexity] = useState<ChatComplexity>('general');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, onClose]);

  // Initialize or reset starter message when role or tenant changes
  useEffect(() => {
    if (messages.length === 0) {
      const getWelcomeMessage = (): string => {
        switch (activeRole) {
          case 'science_lab':
            return `Jambo! I am your Virtual Science Laboratory Mentor at ${currentTenant.name}. I can guide you through practical experiment setups, chemical formulas, physics circuits, biology specimen analyses, and laboratory safety protocols. What investigation are we conducting today?`;
          case 'teacher':
            return `Greetings Educator! I am your CBC Curriculum & Assessment Architect at ${currentTenant.name}. I can assist you with lesson preparation, key inquiry questions, learning outcomes, and CBA rubrics (Exceeding, Meeting, Approaching, Below Expectation). What learning area or strand would you like to prepare?`;
          case 'parent':
            return `Hello! I am your CBC Parent Companion at ${currentTenant.name}. I am here to answer your questions about your child's progress, competency assessments, and helpful learning activities at home. How may I assist you?`;
          case 'admin':
            return `Welcome! I am the Institutional Operations Assistant for ${currentTenant.name}. I can assist with curriculum scheduling, staff task coordination, and school policy compliance.`;
          case 'student':
          default:
            return `Hello ${currentUser?.name ? currentUser.name.split(' ')[0] : 'learner'}! I'm your EduSmart CBC Learning Buddy at ${currentTenant.name}. Whether you need help with mathematics, science, language, or social studies, I'm here to explore with you. What would you like to learn today?`;
        }
      };

      setMessages([
        {
          id: 'welcome-1',
          role: 'assistant',
          text: getWelcomeMessage(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modelUsed: complexity === 'complex' ? 'gemini-3.1-pro-preview' : complexity === 'fast' ? 'gemini-3.1-flash-lite' : 'gemini-3.5-flash'
        }
      ]);
    }
  }, [activeRole, currentTenant.name]);

  // Handle auto-population of initial prompt if provided
  useEffect(() => {
    if (initialTopicPrompt && isOpen) {
      setInputText(initialTopicPrompt);
    }
  }, [initialTopicPrompt, isOpen]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInputText('');
    setIsLoading(true);

    try {
      // Map history to format expected by backend API
      const apiPayload = {
        messages: newHistory.map(m => ({
          role: m.role,
          text: m.text
        })),
        role: activeRole,
        complexity,
        grade: currentUser?.grade || 4,
        subject: 'Integrated CBC Studies',
        tenantName: currentTenant.name
      };

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiPayload)
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      const botMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: data.reply || "I'm here to assist with your educational inquiry.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: data.modelUsed
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const fallbackMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: `In Grade ${currentUser?.grade || 4} CBC learning, questions are the first step to discovery! Reviewing the key concepts and connecting them to your practical observations will help you find the solution. Would you like to break this down together?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: 'pedagogical-recovery-mode'
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    setMessages([]);
  };

  const quickPrompts: { [key in ChatbotRole]: string[] } = {
    student: [
      'Explain photosynthesis in simple Grade 5 terms',
      'How does a series circuit differ from parallel?',
      'Help me practice fractions with everyday examples',
      'Give me a mnemonic to remember the planets'
    ],
    teacher: [
      'Generate a 4-level CBA rubric for Grade 7 Science',
      'Create a 40-minute CBC lesson plan for Clean Energy',
      'Suggest 3 hands-on formative assessment tasks',
      'Write specific learning outcomes for Agricultural Soils'
    ],
    science_lab: [
      'What are safety rules for Bunsen burner experiments?',
      'Explain Ohm’s law formula: V = I × R with units',
      'What happens when dilute acid reacts with sodium bicarbonate?',
      'Guide me through testing plant starch with iodine solution'
    ],
    parent: [
      'What does "Meeting Expectation (ME)" mean in CBC?',
      'How can I support my child in Grade 4 Mathematics?',
      'What activities at home build digital citizenship?'
    ],
    admin: [
      'Check compliance steps for CBC practical laboratories',
      'Suggest optimal bell schedules for Junior Secondary',
      'Draft an executive termly progress report summary'
    ]
  };

  if (!isOpen) return null;

  const modalContent = (
    <div 
      className={`fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center transition-all duration-200 ${
        isExpanded ? 'p-0 overflow-hidden' : 'p-2 sm:p-4 overflow-hidden'
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="EduSmart Gemini AI"
    >
      <div 
        className={`bg-white shadow-2xl flex flex-col border border-slate-700/50 overflow-hidden transition-all duration-200 ${
          isExpanded ? 'w-screen h-screen rounded-none border-0' : 'w-full max-w-2xl h-[88vh] max-h-[92vh] sm:h-[780px] rounded-2xl'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="p-3 sm:px-5 sm:py-3.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800 gap-2">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-amber-300 shadow-xs shrink-0">
              <Bot className="w-5 h-5 text-amber-300" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black tracking-tight text-white flex items-center gap-1.5 truncate">
                  <span>EduSmart Gemini AI</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 hidden xs:inline">
                    Multi-Turn
                  </span>
                </h3>
              </div>
              <p className="text-[11px] text-slate-300 truncate">
                {currentTenant.name} · Role-Guided Pedagogical Assistant
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-2.5 py-1 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 border border-slate-700 shrink-0"
              title={isExpanded ? "Restore Normal View" : "Expand to Full Page"}
              aria-label={isExpanded ? "Restore Normal View" : "Expand to Full Page"}
            >
              {isExpanded ? <Minimize2 className="w-3.5 h-3.5 text-amber-400" /> : <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />}
              <span className="hidden sm:inline">{isExpanded ? 'Exit Full Page' : 'Full Page'}</span>
            </button>
            <button
              onClick={handleClearHistory}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer border border-slate-700 shrink-0"
              title="Reset Conversation"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="px-3 sm:px-3.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-xs cursor-pointer active:scale-95 shrink-0 ml-0.5"
              title="Close Gemini AI (Esc)"
              aria-label="Close Gemini Chat"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close</span>
            </button>
          </div>
        </div>

        {/* ROLE & COMPLEXITY CONTROLS STRIP */}
        <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0">
          {/* Role Selector Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto text-xs py-0.5">
            <button
              onClick={() => setActiveRole('student')}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer ${
                activeRole === 'student'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Learner Tutor</span>
            </button>

            <button
              onClick={() => setActiveRole('teacher')}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer ${
                activeRole === 'teacher'
                  ? 'bg-indigo-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Teacher Rubric</span>
            </button>

            <button
              onClick={() => setActiveRole('science_lab')}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer ${
                activeRole === 'science_lab'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>Science Lab Mentor</span>
            </button>

            <button
              onClick={() => setActiveRole('parent')}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer ${
                activeRole === 'parent'
                  ? 'bg-amber-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Parent Guide</span>
            </button>
          </div>

          {/* Model Engine / Task Complexity Selector */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 p-0.5 rounded-lg text-[10px] font-mono">
            <button
              onClick={() => setComplexity('fast')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                complexity === 'fast'
                  ? 'bg-slate-900 text-white font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Fast Tasks: gemini-3.1-flash-lite (Ultra rapid responses)"
            >
              ⚡ Fast Lite
            </button>
            <button
              onClick={() => setComplexity('general')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                complexity === 'general'
                  ? 'bg-slate-900 text-white font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="General Tasks: gemini-3.5-flash (Balanced reasoning & speed)"
            >
              ⭐ 3.5 Flash
            </button>
            <button
              onClick={() => setComplexity('complex')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                complexity === 'complex'
                  ? 'bg-indigo-900 text-white font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Complex Tasks: gemini-3.1-pro-preview (Deep STEM & assessment reasoning)"
            >
              🧠 3.1 Pro
            </button>
          </div>
        </div>

        {/* SCROLLABLE MESSAGE THREAD */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div 
                key={msg.id}
                className={`flex gap-3 text-xs ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                    {activeRole === 'science_lab' ? (
                      <FlaskConical className="w-4 h-4 text-cyan-300" />
                    ) : (
                      <Bot className="w-4 h-4 text-amber-300" />
                    )}
                  </div>
                )}

                <div 
                  className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-3.5 shadow-2xs relative group ${
                    isUser 
                      ? 'bg-slate-900 text-white rounded-tr-none'
                      : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-none'
                  }`}
                >
                  {/* Message Metadata Header */}
                  <div className={`flex items-center justify-between gap-2 mb-1 text-[10px] ${isUser ? 'text-slate-300' : 'text-slate-400'}`}>
                    <span className="font-bold">
                      {isUser ? (currentUser?.name || 'You') : 'EduSmart Assistant'}
                    </span>
                    <span className="font-mono">{msg.timestamp}</span>
                  </div>

                  {/* Message Body with clean paragraphs */}
                  <div className="whitespace-pre-wrap leading-relaxed text-[12.5px] font-normal">
                    {msg.text}
                  </div>

                  {/* Assistant Footer with Model Badge & Copy Action */}
                  {!isUser && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>
                        {msg.modelUsed || (complexity === 'complex' ? 'gemini-3.1-pro-preview' : complexity === 'fast' ? 'gemini-3.1-flash-lite' : 'gemini-3.5-flash')}
                      </span>
                      <button
                        onClick={() => handleCopy(msg.id, msg.text)}
                        className="p-1 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors cursor-pointer flex items-center gap-1"
                        title="Copy text"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600 font-bold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 text-emerald-400 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                    {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
                  </div>
                )}
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex gap-3 text-xs justify-start">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-3.5 shadow-2xs flex items-center gap-2 text-slate-500">
                <span className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"></span>
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]"></span>
                </span>
                <span className="text-[11px] font-medium text-slate-600 font-mono">
                  Thinking ({complexity === 'complex' ? 'Gemini 3.1 Pro' : complexity === 'fast' ? 'Gemini 3.1 Flash Lite' : 'Gemini 3.5 Flash'})...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* QUICK PROMPT SUGGESTIONS */}
        <div className="px-3 py-2 bg-slate-100/70 border-t border-slate-200 overflow-x-auto shrink-0 flex items-center gap-1.5 text-[11px]">
          <span className="text-slate-400 font-bold shrink-0 flex items-center gap-1">
            <Lightbulb className="w-3 h-3 text-amber-500" />
            <span>Try:</span>
          </span>
          {quickPrompts[activeRole].map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(p)}
              disabled={isLoading}
              className="px-2.5 py-1 bg-white hover:bg-indigo-50 hover:text-indigo-900 border border-slate-200 rounded-lg text-slate-600 whitespace-nowrap shrink-0 transition-colors cursor-pointer disabled:opacity-50"
            >
              {p}
            </button>
          ))}
        </div>

        {/* INPUT FORM */}
        <div className="p-3 bg-white border-t border-slate-200 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                activeRole === 'science_lab'
                  ? 'Ask about physics circuits, chemistry safety, biological cells...'
                  : activeRole === 'teacher'
                  ? 'Ask for lesson plans, rubrics, schemes of work...'
                  : 'Ask your CBC learning question...'
              }
              disabled={isLoading}
              className="flex-1 bg-slate-50 border border-slate-300 focus:border-indigo-500 focus:bg-white focus:outline-none rounded-xl px-3.5 py-2.5 text-xs text-slate-900 transition-all"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="px-4 py-2.5 bg-slate-900 hover:bg-indigo-900 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
