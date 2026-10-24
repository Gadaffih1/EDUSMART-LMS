import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  User, 
  GradeLevel, 
  StreamName, 
  SubjectName, 
  SubjectTeacherChatMessage 
} from '../../types';
import { Storage } from '../../utils/storage';
import { 
  MessageSquare, 
  Send, 
  Search, 
  CheckCircle2, 
  Clock, 
  User as UserIcon, 
  Sparkles, 
  Check, 
  Filter, 
  BookOpen,
  Layers,
  ArrowRight
} from 'lucide-react';

interface TeacherSubjectChatInboxProps {
  currentUser: User;
}

export const TeacherSubjectChatInbox: React.FC<TeacherSubjectChatInboxProps> = ({ currentUser }) => {
  const [messages, setMessages] = useState<SubjectTeacherChatMessage[]>(() => {
    return Storage.getSubjectTeacherChats();
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unread'>('all');
  const [replyText, setReplyText] = useState('');
  const [activeThreadKey, setActiveThreadKey] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync on live messages
  useEffect(() => {
    const handleUpdated = () => {
      setMessages(Storage.getSubjectTeacherChats());
    };
    window.addEventListener('subject-teacher-chats-updated', handleUpdated);
    return () => window.removeEventListener('subject-teacher-chats-updated', handleUpdated);
  }, []);

  // Group messages into student + subject threads
  const threads = useMemo(() => {
    const map = new Map<string, {
      threadKey: string;
      studentId: string;
      studentName: string;
      studentGrade: GradeLevel;
      studentStream: StreamName;
      subject: SubjectName;
      teacherId: string;
      teacherName: string;
      lastMessage: SubjectTeacherChatMessage;
      unreadCount: number;
      messages: SubjectTeacherChatMessage[];
    }>();

    messages.forEach((msg) => {
      const key = `${msg.studentId}__${msg.subject}`;
      if (!map.has(key)) {
        map.set(key, {
          threadKey: key,
          studentId: msg.studentId,
          studentName: msg.studentName,
          studentGrade: msg.studentGrade,
          studentStream: msg.studentStream,
          subject: msg.subject,
          teacherId: msg.teacherId,
          teacherName: msg.teacherName,
          lastMessage: msg,
          unreadCount: 0,
          messages: []
        });
      }

      const entry = map.get(key)!;
      entry.messages.push(msg);

      if (new Date(msg.createdAt).getTime() > new Date(entry.lastMessage.createdAt).getTime()) {
        entry.lastMessage = msg;
      }

      if (msg.senderRole === 'student' && !msg.isReadByTeacher) {
        entry.unreadCount++;
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime();
    });
  }, [messages]);

  // Set default active thread
  useEffect(() => {
    if (!activeThreadKey && threads.length > 0) {
      setActiveThreadKey(threads[0].threadKey);
    }
  }, [threads, activeThreadKey]);

  // Active thread object
  const activeThread = useMemo(() => {
    return threads.find(t => t.threadKey === activeThreadKey) || threads[0] || null;
  }, [threads, activeThreadKey]);

  // Mark active thread read by teacher
  useEffect(() => {
    if (activeThread && activeThread.unreadCount > 0) {
      Storage.markSubjectTeacherChatRead(
        { studentId: activeThread.studentId, subject: activeThread.subject },
        'teacher'
      );
    }
  }, [activeThread]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread?.messages.length]);

  // Filter threads
  const filteredThreads = useMemo(() => {
    return threads.filter(t => {
      if (filterSubject !== 'all' && t.subject !== filterSubject) return false;
      if (filterStatus === 'unread' && t.unreadCount === 0) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const studentMatch = t.studentName.toLowerCase().includes(q);
        const subjMatch = t.subject.toLowerCase().includes(q);
        const streamMatch = t.studentStream.toLowerCase().includes(q);
        const msgMatch = t.lastMessage.message.toLowerCase().includes(q);
        return studentMatch || subjMatch || streamMatch || msgMatch;
      }

      return true;
    });
  }, [threads, filterSubject, filterStatus, searchQuery]);

  // Send reply from teacher
  const handleSendReply = (customText?: string) => {
    if (!activeThread) return;
    const text = (customText || replyText).trim();
    if (!text) return;

    const replyMsg: SubjectTeacherChatMessage = {
      id: `stchat-reply-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      studentId: activeThread.studentId,
      studentName: activeThread.studentName,
      studentGrade: activeThread.studentGrade,
      studentStream: activeThread.studentStream,
      teacherId: currentUser.id,
      teacherName: currentUser.name,
      subject: activeThread.subject,
      message: text,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: 'teacher',
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString(),
      isReadByTeacher: true,
      isReadByStudent: false
    };

    Storage.sendSubjectTeacherChatMessage(replyMsg);
    setReplyText('');
  };

  const availableSubjectsInThreads = useMemo(() => {
    return Array.from(new Set(threads.map(t => t.subject)));
  }, [threads]);

  const quickTeacherReplies = [
    `Great question! Refer to slide 4 of the lesson notes for the worked formula.`,
    `Well done! Your reasoning and solution steps are spot on.`,
    `Let's review this together during our practical lab session tomorrow morning.`,
    `Please revise question 2 with the common denominator method discussed in class.`
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-black uppercase tracking-wider">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Learner Subject Inquiries Hub</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black font-serif tracking-tight text-white">
            Student Consultations & Inquiries
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Receive and respond to direct student questions organized by subject and stream. Maintain complete academic conversation history and keep learners engaged.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-center">
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {threads.reduce((acc, t) => acc + t.unreadCount, 0)}
            </div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mt-0.5">
              Unread Inquiries
            </div>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-center">
            <div className="text-2xl font-black text-white font-mono">
              {threads.length}
            </div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mt-0.5">
              Active Threads
            </div>
          </div>
        </div>
      </div>

      {/* Main Inbox Workspace */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col md:flex-row h-[660px]">
        
        {/* Left Side: Threads List */}
        <div className="w-full md:w-80 border-r border-slate-200 flex flex-col bg-slate-50/60 shrink-0">
          
          {/* Search & Filter Toolbar */}
          <div className="p-4 border-b border-slate-200 bg-white space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search learner or subject..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none flex-1 truncate"
              >
                <option value="all">All Subjects</option>
                {availableSubjectsInThreads.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setFilterStatus(filterStatus === 'all' ? 'unread' : 'all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                  filterStatus === 'unread'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {filterStatus === 'unread' ? 'Unread Only' : 'All'}
              </button>
            </div>
          </div>

          {/* Threads Scrollable List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
            {filteredThreads.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs px-4">
                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <span>No student conversations found.</span>
              </div>
            ) : (
              filteredThreads.map((thread) => {
                const isSelected = activeThread?.threadKey === thread.threadKey;

                return (
                  <button
                    key={thread.threadKey}
                    type="button"
                    onClick={() => setActiveThreadKey(thread.threadKey)}
                    className={`w-full text-left p-3.5 rounded-2xl transition-all cursor-pointer flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                        {thread.studentName}
                      </span>
                      <span className={`text-[10px] font-mono ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                        {thread.lastMessage.timestamp}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        isSelected 
                          ? 'bg-white/20 text-white' 
                          : 'bg-blue-50 text-blue-700'
                      }`}>
                        {thread.subject}
                      </span>
                      <span className={`text-[10px] ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                        Grade {thread.studentGrade} {thread.studentStream}
                      </span>
                    </div>

                    <p className={`text-[11px] line-clamp-1 mt-0.5 ${
                      isSelected ? 'text-blue-50' : 'text-slate-500'
                    }`}>
                      {thread.lastMessage.senderRole === 'teacher' ? 'You: ' : ''}
                      {thread.lastMessage.message}
                    </p>

                    {thread.unreadCount > 0 && !isSelected && (
                      <div className="flex justify-end pt-0.5">
                        <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-black uppercase tracking-wider">
                          {thread.unreadCount} New
                        </span>
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Active Conversation Feed & Reply Box */}
        {activeThread ? (
          <div className="flex-1 flex flex-col bg-white">
            
            {/* Conversation Header */}
            <div className="p-4 sm:px-6 border-b border-slate-200 bg-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold flex items-center justify-center shadow-xs shrink-0">
                  {activeThread.studentName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm">{activeThread.studentName}</h3>
                    <span className="text-[10px] bg-blue-100 text-blue-800 font-extrabold px-2 py-0.5 rounded-full">
                      Grade {activeThread.studentGrade} · {activeThread.studentStream} Stream
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Subject Consultation: <strong>{activeThread.subject}</strong>
                  </div>
                </div>
              </div>

              <div className="text-right text-[11px] text-slate-400 font-mono hidden sm:block">
                CBC Student Direct Message
              </div>
            </div>

            {/* Message Feed */}
            <div className="flex-1 p-5 overflow-y-auto space-y-3 bg-slate-50/50">
              {activeThread.messages
                .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                .map((msg) => {
                  const isTeacher = msg.senderRole === 'teacher';

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isTeacher ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-400">
                        <span className="font-bold text-slate-700">{msg.senderName}</span>
                        <span>·</span>
                        <span>{msg.timestamp}</span>
                      </div>

                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs shadow-xs leading-relaxed ${
                          isTeacher
                            ? 'bg-slate-900 text-white rounded-br-xs'
                            : 'bg-white text-slate-900 border border-slate-200 rounded-bl-xs'
                        }`}
                      >
                        {msg.message}
                      </div>

                      <div className="mt-0.5 text-[9px] text-slate-400">
                        {isTeacher && (
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                            <span>Sent to learner</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Feedback Starter Pills */}
            <div className="px-5 py-2 bg-slate-100/70 border-t border-slate-200 flex items-center gap-2 overflow-x-auto text-[11px]">
              <span className="text-slate-400 font-bold shrink-0">Quick Reply:</span>
              {quickTeacherReplies.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSendReply(r)}
                  className="px-3 py-1 bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-800 rounded-full border border-slate-200 shrink-0 cursor-pointer transition-colors"
                >
                  {r.length > 45 ? `${r.slice(0, 45)}...` : r}
                </button>
              ))}
            </div>

            {/* Reply Input Form */}
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSendReply(); }}
              className="p-4 bg-white border-t border-slate-200 flex items-center gap-2"
            >
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Type your reply to ${activeThread.studentName} (${activeThread.subject})...`}
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
              />

              <button
                type="submit"
                disabled={!replyText.trim()}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-2xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Reply</span>
              </button>
            </form>

          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-12 text-slate-400 text-xs">
            Select a student inquiry from the list to view and reply.
          </div>
        )}

      </div>
    </div>
  );
};
