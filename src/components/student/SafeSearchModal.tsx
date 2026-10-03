import React, { useState } from 'react';
import { User, LessonNote, Quiz, LibraryBook } from '../../types';
import { Storage } from '../../utils/storage';
import { EduSmartGadsaLogo } from '../common/EduSmartGadsaLogo';
import { 
  Search, 
  ShieldCheck, 
  AlertTriangle, 
  Compass, 
  BookOpen, 
  CheckSquare, 
  ArrowRight, 
  Sparkles,
  X,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';

interface SafeSearchModalProps {
  currentUser: User;
  isOpen: boolean;
  onClose: () => void;
  onSelectNote?: (note: LessonNote) => void;
  onSelectQuiz?: (quiz: Quiz) => void;
}

export const SafeSearchModal: React.FC<SafeSearchModalProps> = ({
  currentUser,
  isOpen,
  onClose,
  onSelectNote,
  onSelectQuiz
}) => {
  const [query, setQuery] = useState('');
  const [searchResult, setSearchResult] = useState<{
    status: 'safe' | 'flagged' | 'guided_redirection' | 'idle';
    message: string;
    matchedNotes: LessonNote[];
    matchedQuizzes: Quiz[];
    matchedBooks: LibraryBook[];
    redirectionSuggestion?: string;
  }>({
    status: 'idle',
    message: '',
    matchedNotes: [],
    matchedQuizzes: [],
    matchedBooks: []
  });

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const res = Storage.executeSafeSearch(query, currentUser);
    setSearchResult(res);
  };

  const handleQuickTopic = (topicQuery: string) => {
    setQuery(topicQuery);
    const res = Storage.executeSafeSearch(topicQuery, currentUser);
    setSearchResult(res);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-2xs hidden sm:block">
              <EduSmartGadsaLogo variant="horizontal" size="xs" />
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex sm:hidden items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Learner Safe Search & Curriculum Explorer
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-100 text-emerald-800">
                  Content Filtered
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Grade-constrained academic search with discipline monitoring and guided learning pathways.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-white">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search CBC strands, e.g. 'fractions', 'water cycle', 'soil drainage'..."
                className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              Safe Search
            </button>
          </form>

          {/* Preset Suggested Safe Queries */}
          <div className="flex flex-wrap items-center gap-1.5 mt-3 text-xs">
            <span className="text-slate-400 text-[11px] font-medium flex items-center gap-1">
              <Compass className="w-3 h-3 text-emerald-600" />
              <span>Recommended Strands:</span>
            </span>
            {['Fractions & Decimals', 'Living Things', 'Indigenous Weaving', 'Soil Moisture', 'Food Nutrients'].map(t => (
              <button
                key={t}
                onClick={() => handleQuickTopic(t)}
                className="px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-600 text-[11px] transition-colors"
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {searchResult.status === 'idle' ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 mx-auto flex items-center justify-center">
                <Compass className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">Ready to Explore</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Search above to find approved Grade {currentUser.grade} lesson notes, interactive topical quizzes, and supplementary library books.
              </p>
            </div>
          ) : searchResult.status === 'flagged' ? (
            <div className="p-5 rounded-xl bg-rose-50 border border-rose-200 space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <span>Search Policy Flagged</span>
              </div>
              <p className="text-xs text-rose-700 leading-relaxed">
                {searchResult.message}
              </p>
              <div className="p-3 bg-white/80 rounded-lg border border-rose-200 text-[11px] text-slate-700">
                <strong>Discipline & Online Safety Note:</strong> EduSmart digital environment is dedicated strictly to curriculum learning. Inappropriate search terms are logged for Deputy Head and Senior Teacher pastoral guidance.
              </div>
            </div>
          ) : searchResult.status === 'guided_redirection' ? (
            <div className="p-5 rounded-xl bg-amber-50 border border-amber-200 space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span>Educational Guidance & Redirection</span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                {searchResult.message}
              </p>
              {searchResult.redirectionSuggestion && (
                <div className="p-3 bg-white rounded-lg border border-amber-200 text-xs font-semibold text-emerald-800 flex items-center justify-between">
                  <span>{searchResult.redirectionSuggestion}</span>
                  <button
                    onClick={() => handleQuickTopic('Mathematics')}
                    className="px-3 py-1 bg-emerald-700 text-white rounded-lg text-xs"
                  >
                    Go to Math
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{searchResult.message}</span>
              </div>

              {/* Matched Notes */}
              {searchResult.matchedNotes.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                    <span>Curriculum Notes ({searchResult.matchedNotes.length})</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {searchResult.matchedNotes.map((note) => (
                      <div
                        key={note.id}
                        className="p-3 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-slate-50 transition-all text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{note.title}</span>
                          <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                            {note.subject}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px] line-clamp-2">
                          {note.content}
                        </p>
                        {onSelectNote && (
                          <button
                            onClick={() => {
                              onSelectNote(note);
                              onClose();
                            }}
                            className="text-emerald-700 font-bold text-[11px] inline-flex items-center gap-1 hover:underline pt-1"
                          >
                            <span>Read Strand Note</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Matched Quizzes */}
              {searchResult.matchedQuizzes.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Topical Quizzes ({searchResult.matchedQuizzes.length})</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {searchResult.matchedQuizzes.map((quiz) => (
                      <div
                        key={quiz.id}
                        className="p-3 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-slate-50 transition-all text-xs flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-slate-900">{quiz.title}</div>
                          <div className="text-[11px] text-slate-500">{quiz.subject} · {quiz.questions.length} Questions</div>
                        </div>
                        {onSelectQuiz && (
                          <button
                            onClick={() => {
                              onSelectQuiz(quiz);
                              onClose();
                            }}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shrink-0"
                          >
                            Take Quiz
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Matched Library Books */}
              {searchResult.matchedBooks.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-purple-600" />
                    <span>Library Catalog Matches ({searchResult.matchedBooks.length})</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {searchResult.matchedBooks.map((bk) => (
                      <div key={bk.id} className="p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                        <div className="font-bold text-slate-900">{bk.title}</div>
                        <div className="text-[11px] text-slate-500">By {bk.author} · Shelf: {bk.locationShelf}</div>
                        <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                          {bk.category}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>EduSmart Safe Digital Citizen Shield Enabled</span>
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded text-slate-700 font-semibold"
          >
            Close Search
          </button>
        </div>
      </div>
    </div>
  );
};
