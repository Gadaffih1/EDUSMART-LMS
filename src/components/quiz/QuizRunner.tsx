import React, { useState } from 'react';
import { Quiz, QuizAttempt, User } from '../../types';
import { Storage } from '../../utils/storage';
import { AIQuizFeedback } from './AIQuizFeedback';
import { EduSmartGadsaLogo } from '../common/EduSmartGadsaLogo';
import { useNotificationLayout } from '../../context/NotificationLayoutContext';
import { 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  ArrowRight, 
  ArrowLeft, 
  RotateCcw, 
  Award,
  Clock,
  Sparkles,
  Check
} from 'lucide-react';

interface QuizRunnerProps {
  quiz: Quiz;
  currentUser: User;
  onClose: () => void;
  onQuizCompleted?: (attempt: QuizAttempt) => void;
}

export const QuizRunner: React.FC<QuizRunnerProps> = ({
  quiz,
  currentUser,
  onClose,
  onQuizCompleted
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [latestAttempt, setLatestAttempt] = useState<QuizAttempt | null>(null);

  const question = quiz.questions[currentQuestionIndex];
  const totalQuestions = quiz.questions.length;
  const answeredCount = Object.keys(selectedAnswers).length;

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (isSubmitted) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleSubmitQuiz = () => {
    // Calculate score
    let score = 0;
    quiz.questions.forEach(q => {
      if (selectedAnswers[q.id] === q.correctOptionIndex) {
        score += 1;
      }
    });

    const percentage = Math.round((score / totalQuestions) * 100);
    const passed = percentage >= quiz.passPercentage;

    const attempt: QuizAttempt = {
      id: `att-${Date.now()}`,
      quizId: quiz.id,
      quizTitle: quiz.title,
      subject: quiz.subject,
      grade: currentUser.grade || quiz.grade,
      studentId: currentUser.id,
      studentName: currentUser.name,
      stream: currentUser.stream || 'Dove',
      score,
      totalQuestions,
      percentage,
      passed,
      userAnswers: selectedAnswers,
      completedAt: new Date().toLocaleString('en-KE', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };

    // Save to persistent storage
    Storage.saveQuizAttempt(attempt);
    setLatestAttempt(attempt);
    setIsSubmitted(true);

    if (onQuizCompleted) {
      onQuizCompleted(attempt);
    }
  };

  const handleRetake = () => {
    setSelectedAnswers({});
    setIsSubmitted(false);
    setLatestAttempt(null);
    setCurrentQuestionIndex(0);
  };

  const letters = ['A', 'B', 'C', 'D'];
  const { isNotificationOpen } = useNotificationLayout();

  return (
    <div className={`fixed inset-y-0 left-0 ${isNotificationOpen ? 'right-0 md:right-80 lg:right-96' : 'right-0'} z-30 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs select-none transition-all duration-300`}>
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="p-4 sm:px-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-2xs hidden sm:block">
              <EduSmartGadsaLogo variant="horizontal" size="xs" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <span>Grade {quiz.grade}</span>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-emerald-700">{quiz.subject}</span>
                <span aria-hidden="true">·</span>
                <span>Pass Mark: {quiz.passPercentage}%</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 line-clamp-1">
                {quiz.title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {!isSubmitted ? (
            /* === Active Quiz In Progress === */
            <div className="space-y-6">
              {/* Progress Bar & Counter */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
                  <span>Question {currentQuestionIndex + 1} of {totalQuestions}</span>
                  <span>{answeredCount} of {totalQuestions} Answered</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full transition-all duration-300"
                    style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
                  />
                </div>
              </div>

              {/* Question Card */}
              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2">
                  Question {currentQuestionIndex + 1}
                </div>
                <h4 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                  {question.questionText}
                </h4>
              </div>

              {/* Multiple Choice Options A, B, C, D */}
              <div className="space-y-2.5">
                {question.options.map((optionText, optIndex) => {
                  const isSelected = selectedAnswers[question.id] === optIndex;
                  return (
                    <button
                      key={optIndex}
                      onClick={() => handleSelectOption(question.id, optIndex)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center gap-3 ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {letters[optIndex]}
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-slate-800 flex-1">
                        {optionText}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Navigation Pagination */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:pointer-events-none rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                {currentQuestionIndex < totalQuestions - 1 ? (
                  <button
                    onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
                  >
                    <span>Next Question</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmitQuiz}
                    disabled={answeredCount === 0}
                    className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:pointer-events-none rounded-lg transition-colors shadow-xs"
                  >
                    <span>Submit & Mark Quiz</span>
                    <Check className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* === Automatic Marking Results View === */
            latestAttempt && (
              <div className="space-y-6">
                {/* Result Hero Banner */}
                <div
                  className={`p-6 rounded-2xl border text-center ${
                    latestAttempt.passed
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-rose-50 border-rose-200'
                  }`}
                >
                  <div
                    className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center font-bold text-xl mb-3 shadow-xs ${
                      latestAttempt.passed
                        ? 'bg-emerald-600 text-white'
                        : 'bg-rose-600 text-white'
                    }`}
                  >
                    {latestAttempt.passed ? <Award className="w-7 h-7" /> : <XCircle className="w-7 h-7" />}
                  </div>

                  <div className="text-xs font-bold uppercase tracking-wider mb-1 text-slate-600">
                    Automatic Marking Completed
                  </div>

                  <h3 className="text-2xl font-extrabold text-slate-900 mb-1">
                    {latestAttempt.passed ? 'Congratulations! You Passed' : 'Quiz Needs Revision'}
                  </h3>

                  <p className="text-xs text-slate-600 max-w-md mx-auto mb-4">
                    {latestAttempt.passed
                      ? `Exceptional mastery in ${quiz.title}. Your score has been entered into the Grade ${quiz.grade} continuous assessment record.`
                      : `You scored below the ${quiz.passPercentage}% pass mark. Review the explanations below and feel free to retake.`}
                  </p>

                  {/* Summary Metric Stats */}
                  <div className="grid grid-cols-3 gap-2 max-w-sm mx-auto pt-3 border-t border-slate-200/60 font-mono text-xs">
                    <div className="bg-white/80 p-2.5 rounded-lg border border-slate-200/60">
                      <div className="text-[10px] text-slate-500 font-sans uppercase">Score</div>
                      <div className="text-base font-bold text-slate-900">{latestAttempt.score} / {latestAttempt.totalQuestions}</div>
                    </div>
                    <div className="bg-white/80 p-2.5 rounded-lg border border-slate-200/60">
                      <div className="text-[10px] text-slate-500 font-sans uppercase">Percentage</div>
                      <div className="text-base font-bold text-emerald-700">{latestAttempt.percentage}%</div>
                    </div>
                    <div className="bg-white/80 p-2.5 rounded-lg border border-slate-200/60">
                      <div className="text-[10px] text-slate-500 font-sans uppercase">Status</div>
                      <div className={`text-base font-bold ${latestAttempt.passed ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {latestAttempt.passed ? 'PASS' : 'FAIL'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Question-by-Question Breakdown */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                    Detailed Question Review & Explanations
                  </h4>

                  <div className="space-y-4">
                    {quiz.questions.map((q, idx) => {
                      const chosenIndex = latestAttempt.userAnswers[q.id];
                      const isCorrect = chosenIndex === q.correctOptionIndex;

                      return (
                        <div
                          key={q.id}
                          className="p-4 rounded-xl border border-slate-200 bg-white space-y-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2">
                              {isCorrect ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              ) : (
                                <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                              )}
                              <span className="font-bold text-xs sm:text-sm text-slate-900">
                                {idx + 1}. {q.questionText}
                              </span>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono shrink-0 ${
                                isCorrect
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {isCorrect ? 'Correct (+1)' : 'Incorrect (0)'}
                            </span>
                          </div>

                          {/* Options Review */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {q.options.map((opt, oIdx) => {
                              const wasChosen = chosenIndex === oIdx;
                              const isTheCorrectOne = q.correctOptionIndex === oIdx;

                              let style = 'bg-slate-50 border-slate-200 text-slate-700';
                              if (isTheCorrectOne) {
                                style = 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold';
                              } else if (wasChosen && !isCorrect) {
                                style = 'bg-rose-50 border-rose-300 text-rose-900';
                              }

                              return (
                                <div
                                  key={oIdx}
                                  className={`p-2 rounded-lg border flex items-center justify-between ${style}`}
                                >
                                  <span>
                                    <strong>{letters[oIdx]}.</strong> {opt}
                                  </span>
                                  {isTheCorrectOne && (
                                    <span className="text-[10px] text-emerald-700 font-bold uppercase">Correct Answer</span>
                                  )}
                                  {wasChosen && !isTheCorrectOne && (
                                    <span className="text-[10px] text-rose-700 font-bold uppercase">Your Choice</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Teacher Explanation */}
                          <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-700 border border-slate-200">
                            <span className="font-bold text-slate-900">Explanation: </span>
                            {q.explanation}
                          </div>

                          {/* AI-Powered Feedback Module */}
                          <AIQuizFeedback
                            questionText={q.questionText}
                            chosenAnswer={chosenIndex !== undefined && q.options[chosenIndex] ? q.options[chosenIndex] : 'No option selected'}
                            correctAnswer={q.options[q.correctOptionIndex]}
                            subject={quiz.subject}
                            grade={quiz.grade}
                            topic={quiz.title}
                            teacherExplanation={q.explanation}
                            isCorrect={isCorrect}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Post Quiz Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
                  <button
                    onClick={handleRetake}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retake Quiz</span>
                  </button>

                  <button
                    onClick={onClose}
                    className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
                  >
                    Return to Student Workspace
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
