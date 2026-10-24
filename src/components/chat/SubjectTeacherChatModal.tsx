import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  User, 
  GradeLevel, 
  StreamName, 
  SubjectName, 
  SubjectTeacherChatMessage,
  getSubjectsForGrade 
} from '../../types';
import { Storage } from '../../utils/storage';
import { 
  MessageSquare, 
  Send, 
  X, 
  CheckCircle2, 
  User as UserIcon, 
  Clock, 
  BookOpen, 
  Sparkles, 
  ChevronRight,
  ShieldCheck,
  HelpCircle,
  AlertCircle
} from 'lucide-react';

interface SubjectTeacherChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  initialSubject?: SubjectName;
}

export const SubjectTeacherChatModal: React.FC<SubjectTeacherChatModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  initialSubject
}) => {
  const studentGrade = currentUser.grade || 4;
  const studentStream = currentUser.stream || 'Dove';

  const availableSubjects = useMemo(() => {
    return getSubjectsForGrade(studentGrade);
  }, [studentGrade]);

  const [selectedSubject, setSelectedSubject] = useState<SubjectName>(() => {
    return initialSubject || availableSubjects[0] || 'Mathematics';
  });

  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<SubjectTeacherChatMessage[]>(() => {
    return Storage.getSubjectTeacherChats({ studentId: currentUser.id });
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync messages on updates
  useEffect(() => {
    const handleUpdated = () => {
      setMessages(Storage.getSubjectTeacherChats({ studentId: currentUser.id }));
    };
    window.addEventListener('subject-teacher-chats-updated', handleUpdated);
    return () => window.removeEventListener('subject-teacher-chats-updated', handleUpdated);
  }, [currentUser.id]);

  // Find the assigned teacher for the selected subject and grade
  const subjectTeacher = useMemo(() => {
    const allUsers = Storage.getUsers();
    // 1. Look for a teacher explicitly assigned to this subject and grade/stream
    const match = allUsers.find(u => {
      if (u.role !== 'teacher' && u.role !== 'class_teacher' && u.role !== 'hod') return false;
      const teachesSubject = u.assignedSubjects && u.assignedSubjects.includes(selectedSubject);
      const teachesGrade = u.grade === studentGrade || (u.assignedStreams && u.assignedStreams.some(as => as.grade === studentGrade));
      return teachesSubject && teachesGrade;
    });

    if (match) return match;

    // 2. Look for teacher assigned to this subject anywhere in the school
    const generalSubjectMatch = allUsers.find(u => {
      return (u.role === 'teacher' || u.role === 'class_teacher' || u.role === 'hod') &&
        u.assignedSubjects && u.assignedSubjects.includes(selectedSubject);
    });

    if (generalSubjectMatch) return generalSubjectMatch;

    // 3. Fallback to default class teacher for this grade
    const classTeacherMatch = allUsers.find(u => {
      return (u.role === 'class_teacher' || u.role === 'teacher') && u.grade === studentGrade;
    });

    if (classTeacherMatch) return classTeacherMatch;

    return {
      id: `teach-${selectedSubject.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      name: `Teacher in Charge (${selectedSubject})`,
      role: 'teacher' as const,
      email: `teacher.${selectedSubject.toLowerCase().replace(/[^a-z0-9]/g, '')}@school.edusmart.ac.ke`
    };
  }, [selectedSubject, studentGrade]);

  // Filter messages for current subject conversation
  const currentConversation = useMemo(() => {
    return messages
      .filter(m => m.subject === selectedSubject)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [messages, selectedSubject]);

  // Mark messages as read by student when viewing this subject
  useEffect(() => {
    if (isOpen) {
      Storage.markSubjectTeacherChatRead(
        { studentId: currentUser.id, subject: selectedSubject },
        'student'
      );
    }
  }, [isOpen, selectedSubject, currentUser.id]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, currentConversation.length]);

  if (!isOpen) return null;

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || messageText).trim();
    if (!text) return;

    const newMsg: SubjectTeacherChatMessage = {
      id: `stchat-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      studentId: currentUser.id,
      studentName: currentUser.name,
      studentGrade: studentGrade,
      studentStream: studentStream,
      teacherId: subjectTeacher.id,
      teacherName: subjectTeacher.name,
      subject: selectedSubject,
      message: text,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: 'student',
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString(),
      isReadByTeacher: false,
      isReadByStudent: true
    };

    Storage.sendSubjectTeacherChatMessage(newMsg);
    setMessageText('');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };

  const quickPrompts = [
    `Can you clarify today's homework question?`,
    `Could you explain the key concept from the lesson notes?`,
    `When is our next ${selectedSubject} topical test?`,
    `May I get extra practical revision questions?`
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full h-[620px] shadow-2xl border border-slate-200 flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Left Sidebar: Subject Selector */}
        <div className="w-full md:w-72 bg-slate-50 border-r border-slate-200 flex flex-col justify-between shrink-0">
          <div className="p-4 border-b border-slate-200/80 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Subject Teacher Chat</h3>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Grade {studentGrade} · {studentStream} Stream
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="md:hidden p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Subject List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 py-1.5">
              Select Your Subject ({availableSubjects.length})
            </div>
            {availableSubjects.map((subj) => {
              const isSelected = selectedSubject === subj;
              const unreadForSubj = messages.filter(
                m => m.subject === subj && m.senderRole === 'teacher' && !m.isReadByStudent
              ).length;

              return (
                <button
                  key={subj}
                  type="button"
                  onClick={() => setSelectedSubject(subj)}
                  className={`w-full text-left px-3 py-2.5 rounded-2xl transition-all cursor-pointer flex items-center justify-between group ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-bold'
                      : 'hover:bg-slate-200/60 text-slate-700 text-xs font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <BookOpen className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">{subj}</span>
                  </div>

                  {unreadForSubj > 0 && (
                    <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                      {unreadForSubj}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom Student Info Badge */}
          <div className="p-3 border-t border-slate-200/80 bg-white/70 text-[11px] text-slate-500 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Monitored institutional learning channel</span>
          </div>
        </div>

        {/* Right Main Chat Window */}
        <div className="flex-1 flex flex-col bg-white">
          
          {/* Chat Header */}
          <div className="px-5 py-3.5 border-b border-slate-200 bg-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold flex items-center justify-center shadow-xs shrink-0">
                {subjectTeacher.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 text-sm">{subjectTeacher.name}</h4>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full">
                    Subject Teacher
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  {selectedSubject} · Ready to assist with CBC classroom inquiries
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-3 bg-slate-50/60">
            {currentConversation.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm">
                  Start an academic conversation with {subjectTeacher.name}
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Ask questions about {selectedSubject} lessons, homework clarifications, or topical assessment guidelines.
                </p>
                <div className="pt-2 flex flex-wrap justify-center gap-1.5 max-w-md mx-auto">
                  {quickPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(prompt)}
                      className="text-[11px] font-semibold bg-white hover:bg-blue-50 hover:text-blue-700 text-slate-700 border border-slate-200 hover:border-blue-300 px-3 py-1.5 rounded-full shadow-xs transition-colors cursor-pointer text-left"
                    >
                      "{prompt}"
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              currentConversation.map((msg) => {
                const isMine = msg.senderRole === 'student';

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-400">
                      <span className="font-bold text-slate-700">{msg.senderName}</span>
                      <span>·</span>
                      <span>{msg.timestamp}</span>
                    </div>

                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs shadow-xs leading-relaxed ${
                        isMine
                          ? 'bg-blue-600 text-white rounded-br-xs'
                          : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                      }`}
                    >
                      {msg.message}
                    </div>

                    <div className="mt-0.5 text-[9px] text-slate-400">
                      {isMine ? (
                        msg.isReadByTeacher ? (
                          <span className="text-emerald-600 flex items-center gap-0.5 font-bold">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Read by Teacher
                          </span>
                        ) : (
                          <span>Delivered</span>
                        )
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Bar if messages exist */}
          {currentConversation.length > 0 && (
            <div className="px-4 py-1.5 bg-slate-100/60 border-t border-slate-200/60 flex items-center gap-1.5 overflow-x-auto text-[11px]">
              <span className="text-slate-400 font-bold shrink-0">Quick Ask:</span>
              {quickPrompts.slice(0, 2).map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSendMessage(p)}
                  className="px-2.5 py-1 bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-700 rounded-full border border-slate-200 shrink-0 cursor-pointer"
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Input & Send Form */}
          <form 
            onSubmit={handleFormSubmit}
            className="p-3 sm:p-4 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder={`Write a message to your ${selectedSubject} teacher...`}
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
            />

            <button
              type="submit"
              disabled={!messageText.trim()}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-2xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};
