import React, { useState } from 'react';
import { 
  BookOpen, 
  Library, 
  ShoppingBag, 
  Boxes, 
  Compass, 
  Laptop, 
  Search, 
  Filter, 
  Plus, 
  Download, 
  CheckCircle2, 
  Layers, 
  FileText,
  Bookmark,
  Sparkles,
  ExternalLink,
  Tag,
  Globe
} from 'lucide-react';
import { 
  LibraryBook, 
  LibraryAcquisition, 
  LibraryShelfLocation, 
  DigitalLibraryItem,
  User
} from '../../types';
import { ELinksDirectory } from '../resources/ELinksDirectory';
import { LibraryPortalSection } from './types';

interface CollectionViewsProps {
  currentUser?: User;
  section: LibraryPortalSection;
  books: LibraryBook[];
  acquisitions: LibraryAcquisition[];
  shelves: LibraryShelfLocation[];
  digitalItems: DigitalLibraryItem[];
  onAddBook: (book: LibraryBook) => void;
  onAddAcquisition: (acq: LibraryAcquisition) => void;
  onAddDigitalItem: (item: DigitalLibraryItem) => void;
}

export const CollectionViews: React.FC<CollectionViewsProps> = ({
  currentUser,
  section,
  books,
  acquisitions,
  shelves,
  digitalItems,
  onAddBook,
  onAddAcquisition,
  onAddDigitalItem
}) => {
  const [digitalSubTab, setDigitalSubTab] = useState<'elinks' | 'ebooks'>('elinks');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [showAddAcqModal, setShowAddAcqModal] = useState(false);

  // New Book state
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newIsbn, setNewIsbn] = useState('978-9966-');
  const [newPublisher, setNewPublisher] = useState('Kenya Literature Bureau');
  const [newCat, setNewCat] = useState<'CBC Textbook' | 'CBC Teacher Guide' | 'Supplementary Reader' | 'Encyclopedia' | 'Fiction Storybook'>('CBC Textbook');
  const [newGrade, setNewGrade] = useState<number>(4);
  const [newCopies, setNewCopies] = useState<number>(30);
  const [newShelf, setNewShelf] = useState('SEC-A-01');

  // New Acquisition state
  const [acqTitle, setAcqTitle] = useState('');
  const [acqAuthor, setAcqAuthor] = useState('');
  const [acqSupplier, setAcqSupplier] = useState('Text Book Centre Ltd');
  const [acqQty, setAcqQty] = useState<number>(20);
  const [acqUnitCost, setAcqUnitCost] = useState<number>(750);

  // Catalogue & Books
  if (section === 'catalogue' || section === 'books_resources') {
    const filteredBooks = books.filter(b => {
      const matchesSearch = b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            b.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            b.isbn.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            b.locationShelf.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = selectedCategory === 'all' || b.category === selectedCategory;
      const matchesGrade = selectedGrade === 'all' || (b.grade && b.grade.toString() === selectedGrade);
      return matchesSearch && matchesCat && matchesGrade;
    });

    return (
      <div className="space-y-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-600" />
              <span>{section === 'catalogue' ? 'Master Online Public Access Catalogue (OPAC)' : 'Books & Curriculum Resources'}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              CBC approved course books, teacher curriculum guides, and supplementary fiction & reference literature.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search title, author or ISBN..."
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl w-52 sm:w-64"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs border border-slate-300 rounded-xl px-2.5 py-1.5 bg-white text-slate-700"
            >
              <option value="all">All Categories</option>
              <option value="CBC Textbook">CBC Textbook</option>
              <option value="CBC Teacher Guide">CBC Teacher Guide</option>
              <option value="Supplementary Reader">Supplementary Reader</option>
              <option value="Encyclopedia">Encyclopedia</option>
              <option value="Fiction Storybook">Fiction Storybook</option>
            </select>

            <button
              onClick={() => setShowAddBookModal(true)}
              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Title</span>
            </button>
          </div>
        </div>

        {/* Grid of Books */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBooks.map((b) => (
            <div key={b.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between hover:border-purple-300 transition-all">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                    {b.category}
                  </span>
                  <span className="font-mono text-[10px] font-bold text-slate-500">{b.isbn}</span>
                </div>

                <h4 className="font-bold text-sm text-slate-900 mt-2 line-clamp-2 leading-snug">
                  {b.title}
                </h4>
                <div className="text-xs text-slate-500 mt-1">Author: <strong>{b.author}</strong></div>
                <div className="text-[11px] text-slate-400">Publisher: {b.publisher}</div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-mono text-slate-600 font-bold bg-slate-100 px-2 py-0.5 rounded">
                  📍 {b.locationShelf}
                </span>
                <span className={`font-bold ${b.copiesAvailable > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {b.copiesAvailable} / {b.totalCopies} Available
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Add Book Modal */}
        {showAddBookModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 p-5 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h4 className="font-bold text-sm text-slate-900">Catalogue New Title</h4>
                <button onClick={() => setShowAddBookModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Book Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Mentor Social Studies Learner's Book Grade 5"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Author</label>
                  <input
                    type="text"
                    required
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ISBN</label>
                  <input
                    type="text"
                    required
                    value={newIsbn}
                    onChange={(e) => setNewIsbn(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value as any)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
                  >
                    <option value="CBC Textbook">CBC Textbook</option>
                    <option value="CBC Teacher Guide">CBC Teacher Guide</option>
                    <option value="Supplementary Reader">Supplementary Reader</option>
                    <option value="Encyclopedia">Encyclopedia</option>
                    <option value="Fiction Storybook">Fiction Storybook</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Total Copies</label>
                  <input
                    type="number"
                    value={newCopies}
                    onChange={(e) => setNewCopies(Number(e.target.value))}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Shelf Assignment</label>
                <input
                  type="text"
                  value={newShelf}
                  onChange={(e) => setNewShelf(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowAddBookModal(false)} className="px-3 py-1.5 text-xs text-slate-600 font-bold">
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!newTitle || !newAuthor) return;
                    onAddBook({
                      id: `bk-${Date.now()}`,
                      title: newTitle,
                      author: newAuthor,
                      isbn: newIsbn,
                      publisher: newPublisher,
                      category: newCat,
                      grade: newGrade as any,
                      copiesAvailable: newCopies,
                      totalCopies: newCopies,
                      locationShelf: newShelf
                    });
                    setShowAddBookModal(false);
                    setNewTitle('');
                  }}
                  className="px-4 py-1.5 bg-purple-600 text-white font-black text-xs rounded-lg"
                >
                  Save Title
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Acquisitions
  if (section === 'acquisitions') {
    const totalExpenditure = acquisitions.reduce((acc, a) => acc + a.totalCost, 0);

    return (
      <div className="space-y-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-indigo-600" />
              <span>Library Acquisitions & Procurement</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Purchase orders, publisher requisitions, invoices, and new intake processing.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold text-slate-700">
              Total Order Value: <strong>KES {totalExpenditure.toLocaleString()}</strong>
            </span>
            <button
              onClick={() => setShowAddAcqModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Acquisition Order</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <th className="py-3 px-4">Title / Material</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4 text-center">Qty</th>
                <th className="py-3 px-4 font-mono text-right">Total Cost</th>
                <th className="py-3 px-4">Requested By</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {acquisitions.map((acq) => (
                <tr key={acq.id} className="hover:bg-slate-50/60 font-sans">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{acq.title}</td>
                  <td className="py-3.5 px-4 text-slate-700">{acq.supplier}</td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900">{acq.quantity}</td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-indigo-700">KES {acq.totalCost.toLocaleString()}</td>
                  <td className="py-3.5 px-4 text-slate-500">{acq.requestedBy}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                      {acq.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal Acquisition */}
        {showAddAcqModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 p-5 space-y-3">
              <div className="flex items-center justify-between border-b pb-3">
                <h4 className="font-bold text-sm text-slate-900">Create Acquisition Order</h4>
                <button onClick={() => setShowAddAcqModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={acqTitle}
                  onChange={(e) => setAcqTitle(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier</label>
                  <input
                    type="text"
                    value={acqSupplier}
                    onChange={(e) => setAcqSupplier(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    value={acqQty}
                    onChange={(e) => setAcqQty(Number(e.target.value))}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Cost (KES)</label>
                <input
                  type="number"
                  value={acqUnitCost}
                  onChange={(e) => setAcqUnitCost(Number(e.target.value))}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowAddAcqModal(false)} className="px-3 py-1.5 text-xs text-slate-600 font-bold">
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!acqTitle) return;
                    onAddAcquisition({
                      id: `acq-${Date.now()}`,
                      title: acqTitle,
                      author: 'Editorial Board',
                      isbn: '978-000-000-0',
                      publisher: 'Kenya Literature Bureau',
                      quantity: acqQty,
                      unitCost: acqUnitCost,
                      totalCost: acqQty * acqUnitCost,
                      supplier: acqSupplier,
                      requestDate: new Date().toISOString().split('T')[0],
                      status: 'ordered',
                      requestedBy: 'School Librarian'
                    });
                    setShowAddAcqModal(false);
                    setAcqTitle('');
                  }}
                  className="px-4 py-1.5 bg-indigo-600 text-white font-black text-xs rounded-lg"
                >
                  Submit Order
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Inventory & Stock Audit
  if (section === 'inventory') {
    const totalStock = books.reduce((acc, b) => acc + b.totalCopies, 0);
    const inCirculation = books.reduce((acc, b) => acc + (b.totalCopies - b.copiesAvailable), 0);

    return (
      <div className="space-y-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Boxes className="w-5 h-5 text-purple-600" />
            <span>Library Physical Inventory & Asset Reconciliation</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Reconciliation of library assets, weeding records, damaged volumes, and missing copies report.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Total Holdings in Stock</span>
            <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{totalStock}</div>
            <span className="text-xs text-emerald-600 font-semibold mt-1 block">100% Asset Tagged</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Currently Checked Out</span>
            <div className="text-2xl font-black text-blue-700 mt-1 font-mono">{inCirculation}</div>
            <span className="text-xs text-slate-500 mt-1 block">Active Student & Faculty Loans</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Damaged / Weeding Due</span>
            <div className="text-2xl font-black text-amber-600 mt-1 font-mono">12</div>
            <span className="text-xs text-amber-700 font-semibold mt-1 block">Rebinding Requisitioned</span>
          </div>
        </div>
      </div>
    );
  }

  // Shelves & Locations
  if (section === 'shelves_locations') {
    return (
      <div className="space-y-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Compass className="w-5 h-5 text-emerald-600" />
            <span>Shelves, Stacks & Location Management</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Floor zoning, Dewey Decimal Classification ranges, and physical shelf capacity monitoring.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shelves.map((sh) => (
            <div key={sh.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {sh.code}
                  </span>
                  <h4 className="font-bold text-base text-slate-900 mt-1">{sh.sectionName}</h4>
                  <div className="text-xs text-slate-500">{sh.floor} · {sh.aisle}</div>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800">
                  {sh.deweyRange}
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span>Subject Area: <strong>{sh.categorySpecialization}</strong></span>
                <span className="font-mono font-bold text-purple-700">{sh.currentCount} / {sh.capacity} Books</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Digital Library
  if (section === 'digital_library') {
    return (
      <div className="space-y-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Laptop className="w-5 h-5 text-blue-600" />
              <span>Digital Library & E-Resource Repository</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Curated educational E-Links, e-books, multimedia audiobooks, KICD digital compendiums, and STEM manuals.
            </p>
          </div>

          {/* Sub-tab Switcher */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 self-start sm:self-center">
            <button
              onClick={() => setDigitalSubTab('elinks')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                digitalSubTab === 'elinks'
                  ? 'bg-blue-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>E-Links Directory</span>
            </button>
            <button
              onClick={() => setDigitalSubTab('ebooks')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                digitalSubTab === 'ebooks'
                  ? 'bg-blue-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>E-Books & Compendiums ({digitalItems.length})</span>
            </button>
          </div>
        </div>

        {digitalSubTab === 'elinks' ? (
          <ELinksDirectory
            currentUser={currentUser || ({ name: 'School Librarian', role: 'librarian' } as User)}
            canManage={true}
            title="Librarian Digital E-Links Directory"
            subtitle="Librarian administrative rights: Add, edit, or remove national curriculum portals, interactive labs, and research databases for learners and subject teachers."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {digitalItems.map((dig) => (
              <div key={dig.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs flex flex-col justify-between">
                <div className={`p-6 bg-gradient-to-br ${dig.coverColor} text-white`}>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-white/20 text-white">
                    {dig.fileType} · {dig.fileSize}
                  </span>
                  <h4 className="font-black text-base mt-3 leading-snug line-clamp-2">
                    {dig.title}
                  </h4>
                  <div className="text-xs text-white/80 mt-1">By {dig.author}</div>
                </div>

                <div className="p-4 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-mono text-[11px]">{dig.downloadCount} Reads</span>
                  <button
                    onClick={() => alert(`Opening digital viewer for "${dig.title}"`)}
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Access E-Book</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
};
