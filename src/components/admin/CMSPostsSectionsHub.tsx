import React, { useState, useEffect } from 'react';
import { 
  User, 
  Announcement, 
  PostCategory, 
  PortalSection, 
  GradeLevel, 
  StreamName,
  getStreamsForGrade 
} from '../../types';
import { Storage } from '../../utils/storage';
import { 
  Layers, 
  Edit3, 
  Tags, 
  Plus, 
  Trash2, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Clock, 
  Calendar, 
  Bell, 
  BookOpen, 
  Laptop, 
  Trophy, 
  HeartPulse, 
  Award, 
  Shield, 
  Code2, 
  Eye, 
  EyeOff, 
  ArrowUp, 
  ArrowDown, 
  Save, 
  Check, 
  Sparkles,
  Sliders
} from 'lucide-react';

interface CMSPostsSectionsHubProps {
  currentUser: User;
  onBack?: () => void;
}

export const CMSPostsSectionsHub: React.FC<CMSPostsSectionsHubProps> = ({ 
  currentUser,
  onBack 
}) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => Storage.getAnnouncements());
  const [categories, setCategories] = useState<PostCategory[]>(() => Storage.getPostCategories());
  const [sections, setSections] = useState<PortalSection[]>(() => Storage.getPortalSections());
  const [allUsers, setAllUsers] = useState<User[]>(() => Storage.getUsers());

  const [activeTab, setActiveTab] = useState<'posts' | 'categories' | 'sections'>('posts');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Edit / Create Post Modal State
  const [editingPost, setEditingPost] = useState<Announcement | null>(null);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postType, setPostType] = useState<Announcement['type']>('general');
  const [postCategories, setPostCategories] = useState<string[]>([]);
  const [postTargetGrade, setPostTargetGrade] = useState<GradeLevel | ''>('');
  const [postScheduledTime, setPostScheduledTime] = useState('');
  const [postMeetLink, setPostMeetLink] = useState('');
  const [postChangeNote, setPostChangeNote] = useState('');

  // Quick Category Picker on Post Modal State
  const [categoryPickerPostId, setCategoryPickerPostId] = useState<string | null>(null);
  const [selectedCatsForPost, setSelectedCatsForPost] = useState<string[]>([]);

  // Create / Edit Category Modal State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<PostCategory | null>(null);
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catColor, setCatColor] = useState<PostCategory['color']>('indigo');
  const [catDesc, setCatDesc] = useState('');
  const [catIcon, setCatIcon] = useState('Tags');

  // Create / Edit Section Modal State
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [editingSection, setEditingSection] = useState<PortalSection | null>(null);
  const [sectionTitle, setSectionTitle] = useState('');
  const [sectionDesc, setSectionDesc] = useState('');
  const [sectionCategoryKey, setSectionCategoryKey] = useState('academic-directives');
  const [sectionAudience, setSectionAudience] = useState<PortalSection['targetAudience']>('all');
  const [sectionBadge, setSectionBadge] = useState('Active');

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const handleAnnouncements = () => setAnnouncements(Storage.getAnnouncements());
    const handleCats = () => setCategories(Storage.getPostCategories());
    const handleSecs = () => setSections(Storage.getPortalSections());
    window.addEventListener('announcements-updated', handleAnnouncements);
    window.addEventListener('post-categories-updated', handleCats);
    window.addEventListener('portal-sections-updated', handleSecs);
    return () => {
      window.removeEventListener('announcements-updated', handleAnnouncements);
      window.removeEventListener('post-categories-updated', handleCats);
      window.removeEventListener('portal-sections-updated', handleSecs);
    };
  }, []);

  const userPerms = Storage.getUserEffectivePermissions(currentUser);
  const isCMSMaster = userPerms.canManageAllPostsCategoriesSections || currentUser.role === 'admin';
  const canAddCategories = userPerms.canAddCategoriesToPosts || isCMSMaster;
  const canEditSpecificPosts = userPerms.canEditPostsBySpecificUsers || isCMSMaster;

  // Determine if currentUser can edit a specific announcement
  const canEditThisPost = (post: Announcement): boolean => {
    if (isCMSMaster) return true;
    if (post.author === currentUser.name || post.authorId === currentUser.id) return true;
    if (!canEditSpecificPosts) return false;

    // Check delegated scope
    const scope = currentUser.delegatedPostEditorScope;
    if (!scope) return true;
    if (scope.allowAll) return true;
    if (post.authorId && scope.editableAuthorIds.includes(post.authorId)) return true;
    
    // Check by author name match if authorId missing
    const matchingUser = allUsers.find(u => u.name === post.author);
    if (matchingUser && scope.editableAuthorIds.includes(matchingUser.id)) return true;

    return false;
  };

  // Open Edit Post
  const handleOpenEditPost = (post: Announcement) => {
    setEditingPost(post);
    setIsCreatingPost(false);
    setPostTitle(post.title);
    setPostContent(post.content);
    setPostType(post.type);
    setPostCategories(post.categories || []);
    setPostTargetGrade(post.targetGrade || '');
    setPostScheduledTime(post.scheduledTime || '');
    setPostMeetLink(post.meetLink || '');
    setPostChangeNote('');
  };

  // Open Create Post
  const handleOpenCreatePost = () => {
    setEditingPost(null);
    setIsCreatingPost(true);
    setPostTitle('');
    setPostContent('');
    setPostType('general');
    setPostCategories(['academic-directives']);
    setPostTargetGrade('');
    setPostScheduledTime('');
    setPostMeetLink('');
    setPostChangeNote('');
  };

  // Save Post (Create or Edit)
  const handleSavePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim() || !postContent.trim()) {
      showToast('Please provide both title and content.', 'error');
      return;
    }

    if (isCreatingPost) {
      const newPost: Announcement = {
        id: `ann-${Date.now()}`,
        title: postTitle.trim(),
        content: postContent.trim(),
        type: postType,
        targetGrade: postTargetGrade ? (Number(postTargetGrade) as GradeLevel) : undefined,
        author: currentUser.name,
        authorId: currentUser.id,
        authorRole: currentUser.role,
        createdAt: new Date().toISOString(),
        categories: postCategories,
        scheduledTime: postScheduledTime.trim() || undefined,
        meetLink: postMeetLink.trim() || undefined
      };

      Storage.addAnnouncement(newPost);
      showToast('New post published successfully!', 'success');
    } else if (editingPost) {
      const editHistory = editingPost.editHistory || [];
      const updatedHistory = [
        ...editHistory,
        {
          editedBy: currentUser.name,
          editedAt: new Date().toISOString(),
          note: postChangeNote.trim() || 'Content updated by authorized editor'
        }
      ];

      Storage.updateAnnouncement(editingPost.id, {
        title: postTitle.trim(),
        content: postContent.trim(),
        type: postType,
        targetGrade: postTargetGrade ? (Number(postTargetGrade) as GradeLevel) : undefined,
        categories: postCategories,
        scheduledTime: postScheduledTime.trim() || undefined,
        meetLink: postMeetLink.trim() || undefined,
        lastEditedBy: currentUser.name,
        lastEditedAt: new Date().toISOString(),
        editHistory: updatedHistory
      });

      showToast(`Post "${postTitle}" updated successfully!`, 'success');
    }

    setEditingPost(null);
    setIsCreatingPost(false);
  };

  // Delete Post
  const handleDeletePost = (id: string, title: string) => {
    if (!isCMSMaster) {
      showToast('Deleting posts requires Role 5 (Full CMS Master) rights.', 'error');
      return;
    }
    if (confirm(`Are you sure you want to permanently delete post "${title}"?`)) {
      Storage.deleteAnnouncement(id);
      showToast(`Post "${title}" removed from portal.`, 'info');
    }
  };

  // Quick Attach Categories to Post
  const handleSavePostCategories = () => {
    if (!categoryPickerPostId) return;
    Storage.updateAnnouncement(categoryPickerPostId, {
      categories: selectedCatsForPost,
      lastEditedBy: currentUser.name,
      lastEditedAt: new Date().toISOString()
    });
    showToast('Categories updated for post.', 'success');
    setCategoryPickerPostId(null);
  };

  // Save Category
  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    if (editingCategory) {
      Storage.updatePostCategory(editingCategory.id, {
        name: catName.trim(),
        slug: catSlug.trim() || catName.trim().toLowerCase().replace(/\s+/g, '-'),
        color: catColor,
        description: catDesc.trim(),
        icon: catIcon
      });
      showToast(`Category "${catName}" updated!`, 'success');
    } else {
      const newCat: PostCategory = {
        id: `cat-${Date.now()}`,
        name: catName.trim(),
        slug: catSlug.trim() || catName.trim().toLowerCase().replace(/\s+/g, '-'),
        color: catColor,
        description: catDesc.trim(),
        icon: catIcon,
        isSystemDefault: false
      };
      Storage.addPostCategory(newCat);
      showToast(`New category "${catName}" created!`, 'success');
    }

    setShowCategoryModal(false);
    setEditingCategory(null);
    setCatName('');
    setCatSlug('');
    setCatDesc('');
  };

  // Delete Category
  const handleDeleteCategory = (id: string, name: string) => {
    if (!isCMSMaster) {
      showToast('Deleting categories requires CMS Master rights.', 'error');
      return;
    }
    if (confirm(`Are you sure you want to delete category "${name}"?`)) {
      Storage.deletePostCategory(id);
      showToast(`Category "${name}" deleted.`, 'info');
    }
  };

  // Toggle Section Visibility
  const handleToggleSectionVisibility = (sec: PortalSection) => {
    Storage.updatePortalSection(sec.id, { isVisible: !sec.isVisible });
    showToast(`Section "${sec.title}" is now ${!sec.isVisible ? 'VISIBLE' : 'HIDDEN'}`, 'info');
  };

  // Reorder Sections
  const handleMoveSection = (idx: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= sections.length) return;

    const list = [...sections];
    const temp = list[idx];
    list[idx] = list[newIdx];
    list[newIdx] = temp;

    // re-assign orders
    list.forEach((s, i) => s.order = i + 1);
    Storage.savePortalSections(list);
    showToast('Section order re-aligned.', 'success');
  };

  // Filter posts
  const filteredAnnouncements = announcements.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          a.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          a.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'all' || 
      (a.categories && (a.categories.includes(categoryFilter) || a.categories.some(c => c.toLowerCase() === categoryFilter.toLowerCase())));
    return matchesSearch && matchesCat;
  });

  const getCategoryColorClasses = (color: PostCategory['color']) => {
    switch (color) {
      case 'emerald': return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'indigo': return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      case 'amber': return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'rose': return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'purple': return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'blue': return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'teal': return 'bg-teal-50 text-teal-800 border-teal-200';
      case 'orange': return 'bg-orange-50 text-orange-800 border-orange-200';
      case 'cyan': return 'bg-cyan-50 text-cyan-800 border-cyan-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-20 right-6 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 border text-xs font-bold animate-in slide-in-from-top-2 ${
          toast.type === 'success' ? 'bg-emerald-950 text-emerald-200 border-emerald-700' :
          toast.type === 'error' ? 'bg-rose-950 text-rose-200 border-rose-700' :
          'bg-slate-900 text-white border-slate-700'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-amber-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-400/30 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-rose-400" />
                <span>Roles 2, 3 & 5: Content, Categories & Sections CMS</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                {isCMSMaster ? '👑 Full CMS Master' : '✏️ Delegated Curator'}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>CMS Posts, Categories & Sections Hub</span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Curate announcements, edit posts written by specific designated authors, classify content under rich categories, and configure layout sections across EduSmart portal.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleOpenCreatePost}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ New Broadcast Post</span>
            </button>

            {onBack && (
              <button
                onClick={onBack}
                className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/20 cursor-pointer"
              >
                Back to Admin
              </button>
            )}
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="bg-white rounded-2xl p-1.5 border border-slate-200 shadow-xs flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => setActiveTab('posts')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'posts'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Posts & Announcements ({announcements.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'categories'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Tags className="w-3.5 h-3.5" />
          <span>Post Categories ({categories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('sections')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'sections'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Portal Sections Manager ({sections.length})</span>
        </button>
      </div>

      {/* ========================================================
          TAB 1: POSTS & ANNOUNCEMENTS MANAGER (ROLES 2 & 5)
          ======================================================== */}
      {activeTab === 'posts' && (
        <div className="space-y-4">
          
          {/* Search & Category Filter */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search posts by title, body content, author name..."
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white font-medium text-slate-700"
              >
                <option value="all">All Category Taxonomies</option>
                {categories.map(c => (
                  <option key={c.id} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Posts List */}
          <div className="space-y-3">
            {filteredAnnouncements.map((post) => {
              const editable = canEditThisPost(post);
              const postCatObjects = categories.filter(c => 
                post.categories && (post.categories.includes(c.slug) || post.categories.includes(c.id) || post.categories.includes(c.name))
              );

              return (
                <div 
                  key={post.id} 
                  className={`bg-white rounded-2xl p-5 border transition-all space-y-3 ${
                    editable ? 'border-slate-200 hover:border-slate-400 shadow-xs' : 'border-slate-200 opacity-90'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      
                      {/* Categories Badges Strip */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                          post.type === 'urgent' ? 'bg-rose-100 text-rose-800 border-rose-300' :
                          post.type === 'virtual_class' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                          post.type === 'lesson_reminder' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                          'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {post.type.replace('_', ' ')}
                        </span>

                        {postCatObjects.map(cat => (
                          <span 
                            key={cat.id} 
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getCategoryColorClasses(cat.color)}`}
                          >
                            🏷️ {cat.name}
                          </span>
                        ))}

                        {/* Quick Add Category Action (Role 3) */}
                        {canAddCategories && (
                          <button
                            onClick={() => {
                              setCategoryPickerPostId(post.id);
                              setSelectedCatsForPost(post.categories || []);
                            }}
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 hover:bg-purple-100 text-purple-700 border border-slate-200 transition-colors cursor-pointer"
                            title="Add or remove categories under this post"
                          >
                            + Category
                          </button>
                        )}
                      </div>

                      <h4 className="font-extrabold text-base text-slate-900 tracking-tight">
                        {post.title}
                      </h4>

                      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                        {post.content}
                      </p>
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center gap-2 shrink-0">
                      {editable && (
                        <button
                          onClick={() => handleOpenEditPost(post)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                          title="Authorized to edit this user's post"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit Post</span>
                        </button>
                      )}

                      {isCMSMaster && (
                        <button
                          onClick={() => handleDeletePost(post.id, post.title)}
                          className="p-1.5 bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 rounded-xl transition-colors cursor-pointer"
                          title="Delete post (Role 5 Master)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Metadata and Revision Footer */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-400 font-mono gap-2">
                    <div className="flex items-center gap-2">
                      <span>Author: <strong>{post.author}</strong> ({post.authorRole})</span>
                      <span>·</span>
                      <span>Published: {new Date(post.createdAt).toLocaleDateString()}</span>
                      {post.targetGrade && (
                        <>
                          <span>·</span>
                          <span className="text-indigo-600 font-bold">Grade {post.targetGrade}</span>
                        </>
                      )}
                    </div>

                    {post.lastEditedBy && (
                      <div className="text-amber-700 font-semibold flex items-center gap-1">
                        <span>✏️ Revised by {post.lastEditedBy} ({new Date(post.lastEditedAt!).toLocaleDateString()})</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ========================================================
          TAB 2: POST CATEGORIES TAXONOMY (ROLE 3 PRIVILEGE)
          ======================================================== */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <Tags className="w-4 h-4 text-purple-600" />
                <span>Post Categories & Content Taxonomies</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Role 3 allows assigning categories under different posts, creating topic streams, and color-coded labels.
              </p>
            </div>

            {canAddCategories && (
              <button
                onClick={() => {
                  setEditingCategory(null);
                  setCatName('');
                  setCatSlug('');
                  setCatDesc('');
                  setCatColor('purple');
                  setShowCategoryModal(true);
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black transition-all shadow-xs flex items-center gap-2 cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>+ Create Category</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => {
              const assignedCount = announcements.filter(a => 
                a.categories && (a.categories.includes(cat.slug) || a.categories.includes(cat.id) || a.categories.includes(cat.name))
              ).length;

              return (
                <div key={cat.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${getCategoryColorClasses(cat.color)}`}>
                        {cat.slug}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-slate-400">
                        {assignedCount} Posts Tagged
                      </span>
                    </div>

                    <h4 className="font-extrabold text-base text-slate-900">
                      {cat.name}
                    </h4>

                    {cat.description && (
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {cat.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setActiveTab('posts');
                        setCategoryFilter(cat.slug);
                      }}
                      className="text-xs font-bold text-indigo-700 hover:underline cursor-pointer"
                    >
                      Filter Posts ({assignedCount})
                    </button>

                    <div className="flex items-center gap-1.5">
                      {canAddCategories && (
                        <button
                          onClick={() => {
                            setEditingCategory(cat);
                            setCatName(cat.name);
                            setCatSlug(cat.slug);
                            setCatColor(cat.color);
                            setCatDesc(cat.description || '');
                            setShowCategoryModal(true);
                          }}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer"
                          title="Edit category"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {isCMSMaster && !cat.isSystemDefault && (
                        <button
                          onClick={() => handleDeleteCategory(cat.id, cat.name)}
                          className="p-1.5 hover:bg-rose-100 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Delete category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ========================================================
          TAB 3: PORTAL SECTIONS MANAGER (ROLE 5 PRIVILEGE)
          ======================================================== */}
      {activeTab === 'sections' && (
        <div className="space-y-4">
          
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-rose-600" />
                <span>Portal Sections & Structural Layout Architecture</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Role 5 Master control: manage layout sections, target audiences, display order, and active visibility.
              </p>
            </div>

            {isCMSMaster && (
              <button
                onClick={() => {
                  setEditingSection(null);
                  setSectionTitle('');
                  setSectionDesc('');
                  setSectionCategoryKey('academic-directives');
                  setSectionAudience('all');
                  setSectionBadge('Active');
                  setShowSectionModal(true);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black transition-all shadow-xs flex items-center gap-2 cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Portal Section</span>
              </button>
            )}
          </div>

          <div className="space-y-3">
            {sections.map((sec, idx) => (
              <div 
                key={sec.id}
                className={`bg-white rounded-2xl p-5 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  sec.isVisible ? 'border-slate-200 shadow-xs' : 'border-dashed border-slate-300 opacity-60 bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center font-bold text-slate-700 shrink-0">
                    #{sec.order}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-sm text-slate-900">{sec.title}</h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        Audience: {sec.targetAudience.toUpperCase()}
                      </span>
                      {sec.badge && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {sec.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{sec.description}</p>
                    <div className="text-[10px] text-slate-400 font-mono mt-1">
                      Linked Category: <span className="text-indigo-600 font-bold">{sec.categoryKey}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {/* Move Up/Down Order */}
                  {isCMSMaster && (
                    <div className="flex items-center gap-1 border border-slate-200 rounded-xl p-1 bg-slate-50">
                      <button
                        onClick={() => handleMoveSection(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 hover:bg-white rounded disabled:opacity-30 cursor-pointer"
                        title="Move Section Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5 text-slate-700" />
                      </button>
                      <button
                        onClick={() => handleMoveSection(idx, 'down')}
                        disabled={idx === sections.length - 1}
                        className="p-1 hover:bg-white rounded disabled:opacity-30 cursor-pointer"
                        title="Move Section Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5 text-slate-700" />
                      </button>
                    </div>
                  )}

                  {/* Toggle Visibility */}
                  {isCMSMaster && (
                    <button
                      onClick={() => handleToggleSectionVisibility(sec)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        sec.isVisible ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {sec.isVisible ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
                      <span>{sec.isVisible ? 'Visible' : 'Hidden'}</span>
                    </button>
                  )}

                  {isCMSMaster && (
                    <button
                      onClick={() => {
                        if (confirm(`Remove section "${sec.title}"?`)) {
                          Storage.deletePortalSection(sec.id);
                          showToast(`Section "${sec.title}" removed.`, 'info');
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title="Delete section"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* ========================================================
          MODAL: EDIT / CREATE POST (ROLES 2 & 5)
          ======================================================== */}
      {(editingPost || isCreatingPost) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-xs">
                  <Edit3 className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {isCreatingPost ? 'Publish New Institutional Post' : 'Edit Post (Authorized Delegated Editor)'}
                  </h3>
                  <div className="text-xs text-slate-500 font-mono">
                    {isCreatingPost ? 'Creates broadcast announcement' : `Editing post by: ${editingPost?.author}`}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setEditingPost(null);
                  setIsCreatingPost(false);
                }}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePost} className="p-6 overflow-y-auto flex-1 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Post Title *</label>
                <input
                  type="text"
                  required
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  placeholder="e.g. End of Term 2 Academic Directive & KNEC SBA Submissions"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Content Body *</label>
                <textarea
                  rows={5}
                  required
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Full text of the announcement or directive..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Post Type</label>
                  <select
                    value={postType}
                    onChange={(e) => setPostType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-bold bg-white"
                  >
                    <option value="general">📢 General Announcement</option>
                    <option value="urgent">⚠️ Urgent Institutional Directive</option>
                    <option value="lesson_reminder">📚 CBC Lesson / Homework Reminder</option>
                    <option value="virtual_class">🎥 Virtual Classroom Session</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Grade Audience</label>
                  <select
                    value={postTargetGrade}
                    onChange={(e) => setPostTargetGrade(e.target.value ? Number(e.target.value) as GradeLevel : '')}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="">Whole School (All Grades 1-9)</option>
                    {[1,2,3,4,5,6,7,8,9].map(g => (
                      <option key={g} value={g}>Grade {g} Only</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Categories Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Assign Categories & Topic Streams</label>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((c) => {
                    const isSelected = postCategories.includes(c.slug);
                    return (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => {
                          if (isSelected) {
                            setPostCategories(postCategories.filter(slug => slug !== c.slug));
                          } else {
                            setPostCategories([...postCategories, c.slug]);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          isSelected ? 'bg-slate-900 text-white border-slate-900 shadow-xs' : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        🏷️ {c.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {!isCreatingPost && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Revision (Audit Trail)</label>
                  <input
                    type="text"
                    value={postChangeNote}
                    onChange={(e) => setPostChangeNote(e.target.value)}
                    placeholder="e.g. Corrected submission date per Dean's directive..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingPost(null);
                    setIsCreatingPost(false);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs"
                >
                  {isCreatingPost ? 'Publish Post' : 'Save Revisions'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: QUICK ATTACH CATEGORIES (ROLE 3)
          ======================================================== */}
      {categoryPickerPostId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Tags className="w-5 h-5 text-purple-600" />
                <h3 className="font-black text-sm text-slate-900">Add Categories Under Post</h3>
              </div>
              <button onClick={() => setCategoryPickerPostId(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Select all categories that apply to this announcement. Categories allow students and parents to filter by topic:
            </p>

            <div className="space-y-2 max-h-56 overflow-y-auto">
              {categories.map((cat) => {
                const isChecked = selectedCatsForPost.includes(cat.slug);
                return (
                  <label key={cat.id} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                    <span className="font-bold text-slate-800">{cat.name}</span>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCatsForPost([...selectedCatsForPost, cat.slug]);
                        } else {
                          setSelectedCatsForPost(selectedCatsForPost.filter(s => s !== cat.slug));
                        }
                      }}
                      className="w-4 h-4 text-purple-600 rounded"
                    />
                  </label>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setCategoryPickerPostId(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePostCategories}
                className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs"
              >
                Apply Categories
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: CREATE / EDIT CATEGORY
          ======================================================== */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Tags className="w-5 h-5 text-purple-600" />
                <h3 className="font-black text-sm text-slate-900">
                  {editingCategory ? 'Edit Category' : 'Create New Post Category'}
                </h3>
              </div>
              <button onClick={() => setShowCategoryModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="e.g. Computer Science & Coding"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category Slug (Key)</label>
                <input
                  type="text"
                  value={catSlug}
                  onChange={(e) => setCatSlug(e.target.value)}
                  placeholder="e.g. computer-science-coding"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Color Palette</label>
                <select
                  value={catColor}
                  onChange={(e) => setCatColor(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-bold bg-white"
                >
                  <option value="emerald">🟢 Emerald Green</option>
                  <option value="indigo">🟣 Indigo Blue</option>
                  <option value="amber">🟡 Amber Yellow</option>
                  <option value="rose">🔴 Rose Red</option>
                  <option value="purple">🔮 Royal Purple</option>
                  <option value="blue">🔵 Sapphire Blue</option>
                  <option value="teal">🌊 Teal</option>
                  <option value="orange">🟠 Orange</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  placeholder="Brief summary of topics covered under this category..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: CREATE / EDIT SECTION (ROLE 5)
          ======================================================== */}
      {showSectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-rose-600" />
                <h3 className="font-black text-sm text-slate-900">Add Portal Layout Section</h3>
              </div>
              <button onClick={() => setShowSectionModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!sectionTitle.trim()) return;
                const newSec: PortalSection = {
                  id: `sec-${Date.now()}`,
                  title: sectionTitle.trim(),
                  description: sectionDesc.trim(),
                  categoryKey: sectionCategoryKey,
                  isVisible: true,
                  order: sections.length + 1,
                  targetAudience: sectionAudience,
                  badge: sectionBadge.trim() || undefined
                };
                Storage.addPortalSection(newSec);
                showToast(`Portal section "${sectionTitle}" added!`, 'success');
                setShowSectionModal(false);
              }} 
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Section Title *</label>
                <input
                  type="text"
                  required
                  value={sectionTitle}
                  onChange={(e) => setSectionTitle(e.target.value)}
                  placeholder="e.g. Co-Curricular & Sports Academy Feed"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Section Description</label>
                <input
                  type="text"
                  value={sectionDesc}
                  onChange={(e) => setSectionDesc(e.target.value)}
                  placeholder="Subtitle explaining section content..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Primary Linked Category</label>
                <select
                  value={sectionCategoryKey}
                  onChange={(e) => setSectionCategoryKey(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-bold bg-white"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.slug}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Audience</label>
                <select
                  value={sectionAudience}
                  onChange={(e) => setSectionAudience(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-bold bg-white"
                >
                  <option value="all">Whole School Community</option>
                  <option value="students">Learners / Students Only</option>
                  <option value="teachers">Teaching Faculty Only</option>
                  <option value="parents">Parents / Guardians Only</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowSectionModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs"
                >
                  Create Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
