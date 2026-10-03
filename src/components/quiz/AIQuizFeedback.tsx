import React, { useState } from 'react';
import { 
  Sparkles, 
  Lightbulb, 
  CheckCircle, 
  HelpCircle, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  BookOpen, 
  MessageSquare,
  ThumbsUp
} from 'lucide-react';

interface AIQuizFeedbackProps {
  questionText: string;
  chosenAnswer: string;
  correctAnswer: string;
  subject: string;
  grade: number;
  topic?: string;
  teacherExplanation?: string;
  isCorrect: boolean;
}

interface FeedbackData {
  misconception: string;
  stepByStep: string;
  studyTip: string;
  encouragement?: string;
}

export const AIQuizFeedback: React.FC<AIQuizFeedbackProps> = ({
  questionText,
  chosenAnswer,
  correctAnswer,
  subject,
  grade,
  topic = 'CBC Curriculum Core',
  teacherExplanation = '',
  isCorrect
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAIExplanation = async () => {
    if (feedback) {
      setIsOpen(!isOpen);
      return;
    }

    setIsOpen(true);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/quiz-explanation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          questionText,
          chosenAnswer,
          correctAnswer,
          subject,
          grade,
          topic,
          teacherExplanation
        })
      });

      if (!res.ok) {
        throw new Error('Network response error');
      }

      const data = await res.json();
      setFeedback(data);
    } catch (err: any) {
      console.warn('Falling back to local pedagogical feedback:', err);
      // Fallback pedagogical analysis
      setFeedback({
        misconception: `In ${subject}, choosing "${chosenAnswer}" is a frequent mistake when distinguishing related concepts or operation steps.`,
        stepByStep: `The correct answer is "${correctAnswer}". Under Grade ${grade} CBC guidelines for ${topic || subject}, this directly satisfies the primary learning objective.`,
        studyTip: `Tip: Look for the core keyword in the question prompt and recall the standard rule for ${topic || subject}.`,
        encouragement: "Mistakes are how we learn! Reviewing this concept now will make your next quiz even stronger."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-2 text-xs">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={fetchAIExplanation}
        className={`px-3 py-1.5 rounded-lg font-bold transition-all inline-flex items-center gap-1.5 shadow-2xs ${
          isCorrect
            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
            : 'bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white shadow-xs'
        }`}
      >
        <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
        <span>
          {isCorrect 
            ? (isOpen ? 'Hide AI Deep Dive' : 'Ask AI Tutor: Deep Dive') 
            : (isOpen ? 'Hide AI Tutor Explanation' : '✨ Get AI Explanation (Gemini)')}
        </span>
        {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {/* Expanded AI Feedback Panel */}
      {isOpen && (
        <div className="mt-2.5 p-4 rounded-xl bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white shadow-lg border border-indigo-500/30 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-indigo-400/20">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
                <Sparkles className="w-3.5 h-3.5 text-slate-950" />
              </div>
              <div>
                <span className="font-extrabold text-xs text-white">EduSmart AI Tutor</span>
                <span className="text-[10px] text-emerald-400 font-mono block leading-none">
                  Powered by Gemini 3.8 Flash · Grade {grade} {subject}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setFeedback(null);
                fetchAIExplanation();
              }}
              title="Regenerate explanation"
              className="text-slate-400 hover:text-white p-1 rounded transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loading ? (
            <div className="py-6 flex flex-col items-center justify-center space-y-2 text-center">
              <Sparkles className="w-6 h-6 text-amber-400 animate-spin" />
              <p className="text-xs text-slate-300 font-medium">
                EduSmart AI Tutor is analyzing your answer against Kenyan CBC standards...
              </p>
            </div>
          ) : feedback ? (
            <div className="space-y-3 text-xs">
              {/* Misconception Card */}
              {!isCorrect && feedback.misconception && (
                <div className="p-2.5 rounded-lg bg-white/10 border border-amber-400/30 space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-300 font-bold text-[11px] uppercase tracking-wider">
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>Why you might have picked "{chosenAnswer}"</span>
                  </div>
                  <p className="text-slate-200 leading-relaxed text-[11px]">
                    {feedback.misconception}
                  </p>
                </div>
              )}

              {/* Step-by-Step Reasoning */}
              <div className="p-2.5 rounded-lg bg-white/10 border border-emerald-400/30 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-300 font-bold text-[11px] uppercase tracking-wider">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Step-by-Step CBC Solution: Why "{correctAnswer}" is Right</span>
                </div>
                <p className="text-slate-200 leading-relaxed text-[11px]">
                  {feedback.stepByStep}
                </p>
              </div>

              {/* Memory Tip & Rule of Thumb */}
              {feedback.studyTip && (
                <div className="p-2.5 rounded-lg bg-indigo-950/60 border border-indigo-400/30 space-y-1">
                  <div className="flex items-center gap-1.5 text-indigo-300 font-bold text-[11px] uppercase tracking-wider">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>CBC Mastery Tip</span>
                  </div>
                  <p className="text-indigo-100 text-[11px]">
                    {feedback.studyTip}
                  </p>
                </div>
              )}

              {/* Encouragement */}
              {feedback.encouragement && (
                <div className="flex items-center gap-2 pt-1 text-[11px] text-emerald-300 font-medium italic">
                  <ThumbsUp className="w-3.5 h-3.5 shrink-0" />
                  <span>{feedback.encouragement}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-rose-300">
              Could not retrieve tutor explanation. Please try again.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
