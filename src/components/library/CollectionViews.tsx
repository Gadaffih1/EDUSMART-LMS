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
  Globe,
  Building2,
  Gift,
  Check,
  Clock,
  AlertTriangle,
  ArrowLeftRight,
  X,
  Eye,
  Barcode,
  Printer,
  Info
} from 'lucide-react';
import { 
  LibraryBook, 
  LibraryBorrowRecord,
  LibraryAcquisition, 
  LibraryShelfLocation, 
  DigitalLibraryItem,
  User,
  GradeLevel,
  SubjectName
} from '../../types';
import { ELinksDirectory } from '../resources/ELinksDirectory';
import { LibraryPortalSection } from './types';

interface CollectionViewsProps {
  currentUser?: User;
  section: LibraryPortalSection;
  books: LibraryBook[];
  borrowRecords?: LibraryBorrowRecord[];
  allUsers?: User[];
  acquisitions: LibraryAcquisition[];
  shelves: LibraryShelfLocation[];
  digitalItems: DigitalLibraryItem[];
  onAddBook: (book: LibraryBook) => void;
  onAddAcquisition: (acq: LibraryAcquisition) => void;
  onAddDigitalItem: (item: DigitalLibraryItem) => void;
  onIssueBook?: (record: LibraryBorrowRecord) => void;
  onReturnBook?: (recordId: string, remarks?: string) => void;
}

export const CollectionViews: React.FC<CollectionViewsProps> = ({
  currentUser,
  section,
  books,
  borrowRecords = [],
  allUsers = [],
  acquisitions,
  shelves,
  digitalItems,
  onAddBook,
  onAddAcquisition,
  onAddDigitalItem,
  onIssueBook,
  onReturnBook
}) => {
  const [digitalSubTab, setDigitalSubTab] = useState<'elinks' | 'ebooks'>('elinks');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [showAddAcqModal, setShowAddAcqModal] = useState(false);

  // Inventory Specific States
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventorySourceFilter, setInventorySourceFilter] = useState<'all' | 'Stocked' | 'Donated'>('all');
  const [inventoryCatFilter, setInventoryCatFilter] = useState<string>('all');
  const [selectedBookForLedger, setSelectedBookForLedger] = useState<LibraryBook | null>(null);
  const [showAddInventoryModal, setShowAddInventoryModal] = useState(false);
  
  // Inventory Add Form States
  const [invTitle, setInvTitle] = useState('');
  const [invPublisher, setInvPublisher] = useState('Kenya Literature Bureau (KLB)');
  const [invAuthor, setInvAuthor] = useState('');
  const [invIsbn, setInvIsbn] = useState('978-9966-');
  const [invCategory, setInvCategory] = useState<LibraryBook['category']>('CBC Textbook');
  const [invGrade, setInvGrade] = useState<number>(4);
  const [invSubject, setInvSubject] = useState<string>('Mathematics');
  const [invAcqType, setInvAcqType] = useState<'Stocked' | 'Donated'>('Stocked');
  const [invDonorName, setInvDonorName] = useState('Ministry of Education Capitation Grant');
  const [invTotalCopies, setInvTotalCopies] = useState<number>(35);
  const [invLocationShelf, setInvLocationShelf] = useState('Shelf M-04A');
  const [invAccessionPrefix, setInvAccessionPrefix] = useState('ACC-KLB-M4');

  // Inventory Issue Modal State
  const [issuingBookFromInventory, setIssuingBookFromInventory] = useState<LibraryBook | null>(null);
  const [invIssueBorrowerId, setInvIssueBorrowerId] = useState('');
  const [invIssueBorrowerRole, setInvIssueBorrowerRole] = useState<'student' | 'teacher'>('student');
  const [invIssueCopyId, setInvIssueCopyId] = useState('');
  const [invIssueDueDate, setInvIssueDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [invIssueRemarks, setInvIssueRemarks] = useState('Library Inventory Checkout');
  const [ledgerNewCopyId, setLedgerNewCopyId] = useState('');

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

  // Inventory & Stock Audit - Comprehensive Holdings Register
  if (section === 'inventory') {
    const totalStock = books.reduce((acc, b) => acc + b.totalCopies, 0);
    const totalAvail = books.reduce((acc, b) => acc + b.copiesAvailable, 0);
    const inCirculation = books.reduce((acc, b) => acc + (b.totalCopies - b.copiesAvailable), 0);

    const stockedBooks = books.filter(b => b.acquisitionType !== 'Donated');
    const donatedBooks = books.filter(b => b.acquisitionType === 'Donated');
    const stockedCopies = stockedBooks.reduce((acc, b) => acc + b.totalCopies, 0);
    const donatedCopies = donatedBooks.reduce((acc, b) => acc + b.totalCopies, 0);

    const filteredInventoryBooks = books.filter(b => {
      const q = inventorySearch.toLowerCase().trim();
      const matchesSearch = !q || 
        b.title.toLowerCase().includes(q) ||
        b.publisher.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.isbn.toLowerCase().includes(q) ||
        (b.accessionPrefix && b.accessionPrefix.toLowerCase().includes(q)) ||
        (b.uniqueCopyIds && b.uniqueCopyIds.some(cid => cid.toLowerCase().includes(q)));
      
      const matchesSource = inventorySourceFilter === 'all' || 
        (inventorySourceFilter === 'Stocked' && b.acquisitionType !== 'Donated') ||
        (inventorySourceFilter === 'Donated' && b.acquisitionType === 'Donated');

      const matchesCat = inventoryCatFilter === 'all' || b.category === inventoryCatFilter;

      return matchesSearch && matchesSource && matchesCat;
    });

    const handleCreateInventoryBook = (e: React.FormEvent) => {
      e.preventDefault();
      if (!invTitle.trim() || !invPublisher.trim()) {
        alert('Please specify both Title and Publisher.');
        return;
      }

      const count = Math.max(1, Number(invTotalCopies) || 1);
      const prefix = invAccessionPrefix.trim() || `ACC-${invPublisher.slice(0, 3).toUpperCase()}-${invTitle.slice(0, 3).toUpperCase()}`;
      
      // Generate individual unique IDs for each physical copy
      const copyIds = Array.from({ length: count }, (_, i) => 
        `${prefix}-${String(i + 1).padStart(3, '0')}`
      );

      const newBook: LibraryBook = {
        id: `bk-${Date.now()}`,
        title: invTitle.trim(),
        publisher: invPublisher.trim(),
        author: invAuthor.trim() || 'Author / Ministry Advisory',
        isbn: invIsbn.trim() || `978-9966-${Math.floor(100 + Math.random() * 900)}-${Math.floor(10 + Math.random() * 90)}`,
        category: invCategory,
        grade: invGrade as GradeLevel,
        subject: invSubject as SubjectName,
        totalCopies: count,
        copiesAvailable: count,
        locationShelf: invLocationShelf.trim() || 'Main Stacks',
        acquisitionType: invAcqType,
        donorName: invAcqType === 'Donated' ? invDonorName.trim() : undefined,
        accessionPrefix: prefix,
        uniqueCopyIds: copyIds
      };

      onAddBook(newBook);
      setShowAddInventoryModal(false);

      // Reset
      setInvTitle('');
      setInvAuthor('');
      setInvTotalCopies(30);
    };

    const handleIssueFromInventorySubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!issuingBookFromInventory) return;

      const borrower = allUsers.find(u => u.id === invIssueBorrowerId);
      if (!borrower) {
        alert('Please select a borrower.');
        return;
      }

      if (!invIssueCopyId.trim()) {
        alert('Please specify the Unique ID for this physical copy.');
        return;
      }

      // Check duplicate active loans for this copy ID
      const alreadyBorrowed = borrowRecords.some(r => 
        r.status !== 'returned' && 
        r.bookCopyId && 
        r.bookCopyId.trim().toUpperCase() === invIssueCopyId.trim().toUpperCase()
      );

      if (alreadyBorrowed) {
        alert(`Copy Unique ID "${invIssueCopyId}" is already checked out to another borrower! Please select an available copy.`);
        return;
      }

      const record: LibraryBorrowRecord = {
        id: `bor-${Date.now()}`,
        bookId: issuingBookFromInventory.id,
        bookTitle: issuingBookFromInventory.title,
        bookCopyId: invIssueCopyId.trim(),
        publisher: issuingBookFromInventory.publisher,
        acquisitionType: issuingBookFromInventory.acquisitionType || 'Stocked',
        borrowerId: borrower.id,
        borrowerName: borrower.name,
        borrowerRole: invIssueBorrowerRole,
        grade: borrower.grade,
        stream: borrower.stream,
        borrowedDate: new Date().toISOString().split('T')[0],
        dueDate: invIssueDueDate,
        status: 'active',
        remarks: invIssueRemarks.trim()
      };

      if (onIssueBook) {
        onIssueBook(record);
      }
      setIssuingBookFromInventory(null);
      setInvIssueCopyId('');
    };

    const handleAddExtraCopyIdToSelectedBook = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedBookForLedger || !ledgerNewCopyId.trim()) return;

      const trimmedId = ledgerNewCopyId.trim().toUpperCase();
      const existingIds = selectedBookForLedger.uniqueCopyIds || [];
      if (existingIds.includes(trimmedId)) {
        alert('This Unique ID already exists for this book.');
        return;
      }

      const updatedIds = [...existingIds, trimmedId];
      const updatedBook: LibraryBook = {
        ...selectedBookForLedger,
        totalCopies: selectedBookForLedger.totalCopies + 1,
        copiesAvailable: selectedBookForLedger.copiesAvailable + 1,
        uniqueCopyIds: updatedIds
      };

      onAddBook(updatedBook);
      setSelectedBookForLedger(updatedBook);
      setLedgerNewCopyId('');
    };

    return (
      <div className="space-y-6">
        {/* Header & Quick Actions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-purple-600 text-white uppercase tracking-wider">
                Official Stock Audit
              </span>
              <span className="text-xs text-slate-500 font-mono">CBC Asset Reconciliation</span>
            </div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2 mt-1">
              <Boxes className="w-5 h-5 text-purple-600" />
              <span>Library Physical Inventory & Master Holdings Register</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Catalogue of all books in the library with titles, publishers, acquisition sources (<strong className="text-slate-700">Stocked</strong> vs <strong className="text-slate-700">Donated</strong>), physical quantities, and librarian-assigned unique copy IDs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Print official inventory manifest"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">Print Register</span>
            </button>
            <button
              onClick={() => setShowAddInventoryModal(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Book to Inventory</span>
            </button>
          </div>
        </div>

        {/* Inventory Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Titles</span>
            <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{books.length}</div>
            <span className="text-[11px] text-purple-700 font-semibold mt-0.5 block">Catalogued Titles</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Physical Copies</span>
            <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{totalStock}</div>
            <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">100% Unique Tagged</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-blue-200 bg-blue-50/20 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-blue-700 font-bold uppercase tracking-wider">Stocked Books</span>
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-blue-900 mt-1 font-mono">{stockedCopies}</div>
            <span className="text-[11px] text-blue-700 font-medium mt-0.5 block">{stockedBooks.length} titles (Capitation/BOM)</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-purple-200 bg-purple-50/20 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-purple-700 font-bold uppercase tracking-wider">Donated Books</span>
              <Gift className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <div className="text-2xl font-black text-purple-900 mt-1 font-mono">{donatedCopies}</div>
            <span className="text-[11px] text-purple-700 font-medium mt-0.5 block">{donatedBooks.length} titles (Tusome/Rotary/Alumni)</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-2xs">
            <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider block">Checked Out Loans</span>
            <div className="text-2xl font-black text-amber-800 mt-1 font-mono">{inCirculation}</div>
            <span className="text-[11px] text-amber-700 font-medium mt-0.5 block">Unique IDs in Field</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
            <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">Available on Shelves</span>
            <div className="text-2xl font-black text-emerald-800 mt-1 font-mono">{totalAvail}</div>
            <span className="text-[11px] text-emerald-700 font-medium mt-0.5 block">Ready for Lending</span>
          </div>
        </div>

        {/* Inventory Search & Filters Ribbon */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative min-w-[240px] flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={inventorySearch}
                onChange={(e) => setInventorySearch(e.target.value)}
                placeholder="Search by Title, Publisher, Author, or Unique Accession ID..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-purple-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Source:</span>
              <select
                value={inventorySourceFilter}
                onChange={(e) => setInventorySourceFilter(e.target.value as any)}
                className="text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-700 font-medium cursor-pointer"
              >
                <option value="all">All Sources (Stocked & Donated)</option>
                <option value="Stocked">Stocked Only (Govt / Capitation)</option>
                <option value="Donated">Donated Only (NGO / Grants)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Category:</span>
              <select
                value={inventoryCatFilter}
                onChange={(e) => setInventoryCatFilter(e.target.value)}
                className="text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-700 font-medium cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="CBC Textbook">CBC Textbook</option>
                <option value="CBC Teacher Guide">CBC Teacher Guide</option>
                <option value="Supplementary Reader">Supplementary Reader</option>
                <option value="Encyclopedia">Encyclopedia</option>
                <option value="Fiction Storybook">Fiction Storybook</option>
              </select>
            </div>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-900 font-bold">{filteredInventoryBooks.length}</strong> of {books.length} titles
          </div>
        </div>

        {/* Master Inventory Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h4 className="font-black text-sm text-slate-900">List of All Books in Library</h4>
              <p className="text-[11px] text-slate-500">
                Each physical volume carries a Unique ID given by the librarian to track individual borrowers.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Stocked
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" /> Donated
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/70 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-3 px-4">Book Title & Curriculum Subject</th>
                  <th className="py-3 px-4">Publisher</th>
                  <th className="py-3 px-4">Stocked / Donated</th>
                  <th className="py-3 px-4 text-center">Total Quantity</th>
                  <th className="py-3 px-4 text-center">Available / Loaned</th>
                  <th className="py-3 px-4">Shelf & Accession Prefix</th>
                  <th className="py-3 px-4 text-right">Physical Copies & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInventoryBooks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-500">
                      No books matched your search and filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredInventoryBooks.map((b) => {
                    const isDonated = b.acquisitionType === 'Donated';
                    const activeIssuedForBook = borrowRecords.filter(r => r.bookId === b.id && r.status !== 'returned');

                    return (
                      <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Title & Subject */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 text-sm">{b.title}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                            <span>Author: {b.author}</span>
                            <span>·</span>
                            <span className="font-mono text-[10px]">ISBN: {b.isbn}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                              {b.category}
                            </span>
                            {b.grade && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                Grade {b.grade}
                              </span>
                            )}
                            {b.subject && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700">
                                {b.subject}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Publisher */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 font-bold text-slate-800">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{b.publisher}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">Official Authorized Publisher</div>
                        </td>

                        {/* Stocked / Donated */}
                        <td className="py-3.5 px-4">
                          {isDonated ? (
                            <div>
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-800 border border-purple-200 shadow-2xs">
                                <Gift className="w-3 h-3 text-purple-600" />
                                <span>Donated</span>
                              </span>
                              <div className="text-[10px] text-purple-700 font-medium mt-1">
                                {b.donorName || 'External Partner Donation'}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200 shadow-2xs">
                                <Building2 className="w-3 h-3 text-blue-600" />
                                <span>Stocked</span>
                              </span>
                              <div className="text-[10px] text-blue-700 font-medium mt-1">
                                {b.donorName || 'School Capitation / BOM Budget'}
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Total Quantity */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="font-mono text-base font-black text-slate-900">
                            {b.totalCopies}
                          </div>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Volumes</span>
                        </td>

                        {/* Available vs Loaned */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex items-center gap-2">
                            <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-xs" title="Available on shelf">
                              {b.copiesAvailable} Avail
                            </span>
                            <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-xs" title="Currently borrowed">
                              {b.totalCopies - b.copiesAvailable} Loaned
                            </span>
                          </div>
                          {/* Mini Progress Bar */}
                          <div className="w-24 h-1.5 bg-slate-200 rounded-full mx-auto mt-1.5 overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${Math.round((b.copiesAvailable / Math.max(1, b.totalCopies)) * 100)}%` }}
                            />
                          </div>
                        </td>

                        {/* Shelf Location & Prefix */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800 flex items-center gap-1">
                            <Compass className="w-3 h-3 text-emerald-600" />
                            <span>{b.locationShelf}</span>
                          </div>
                          <div className="font-mono text-[10px] text-purple-700 font-bold mt-1 bg-purple-50/80 px-2 py-0.5 rounded w-fit border border-purple-200">
                            Tag: {b.accessionPrefix || 'ACC-' + b.id.slice(-4)}
                          </div>
                        </td>

                        {/* Physical Copies Ledger & Actions */}
                        <td className="py-3.5 px-4 text-right space-y-1.5">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedBookForLedger(b)}
                              className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 font-bold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                              title="Inspect each physical copy Unique ID and borrower assignment"
                            >
                              <Barcode className="w-3.5 h-3.5 text-purple-600" />
                              <span>Unique IDs ({b.totalCopies})</span>
                            </button>

                            <button
                              onClick={() => {
                                setIssuingBookFromInventory(b);
                                setInvIssueCopyId(
                                  b.uniqueCopyIds?.find(cid => !borrowRecords.some(r => r.status !== 'returned' && r.bookCopyId === cid)) ||
                                  `${b.accessionPrefix || 'ACC'}-${String(b.totalCopies - b.copiesAvailable + 1).padStart(3, '0')}`
                                );
                              }}
                              disabled={b.copiesAvailable <= 0}
                              className={`px-3 py-1 font-bold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-2xs ${
                                b.copiesAvailable > 0
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                              }`}
                              title={b.copiesAvailable > 0 ? "Issue one physical copy" : "No copies available"}
                            >
                              <ArrowLeftRight className="w-3 h-3" />
                              <span>Issue Copy</span>
                            </button>
                          </div>

                          {activeIssuedForBook.length > 0 && (
                            <div className="text-[10px] text-slate-500 font-medium">
                              {activeIssuedForBook.length} active borrower{activeIssuedForBook.length > 1 ? 's' : ''} on distinct Unique IDs
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL 1: PHYSICAL COPY LEDGER & UNIQUE IDS INSPECTOR */}
        {selectedBookForLedger && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs">
            <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in">
              {/* Header */}
              <div className="p-5 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-500 text-white uppercase tracking-wider">
                      Copy Accession Ledger
                    </span>
                    <span className="text-xs text-purple-200 font-semibold">
                      {selectedBookForLedger.acquisitionType || 'Stocked'} Holdings
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-white mt-1">
                    {selectedBookForLedger.title}
                  </h3>
                  <div className="text-xs text-purple-200 flex flex-wrap items-center gap-3 mt-1">
                    <span>Publisher: <strong>{selectedBookForLedger.publisher}</strong></span>
                    <span>·</span>
                    <span>Location: <strong>{selectedBookForLedger.locationShelf}</strong></span>
                    <span>·</span>
                    <span>Holdings: <strong>{selectedBookForLedger.totalCopies} Copies</strong></span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedBookForLedger(null)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Sub-banner explanation */}
              <div className="bg-purple-50 border-b border-purple-100 p-3.5 px-6 flex items-center gap-2 text-xs text-purple-900">
                <Info className="w-4 h-4 text-purple-700 shrink-0" />
                <span>
                  <strong>Unique Copy Identification:</strong> Every physical book copy has a Unique ID given by the librarian. When borrowers check out the same title and publisher, each borrower holds a different Unique ID.
                </span>
              </div>

              {/* Copy Ledger Table */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                    All Physical Copies ({selectedBookForLedger.uniqueCopyIds?.length || selectedBookForLedger.totalCopies} Registered)
                  </h4>

                  {/* Add Extra Copy Form */}
                  <form onSubmit={handleAddExtraCopyIdToSelectedBook} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={`e.g. ${selectedBookForLedger.accessionPrefix || 'ACC'}-${String(selectedBookForLedger.totalCopies + 1).padStart(3, '0')}`}
                      value={ledgerNewCopyId}
                      onChange={(e) => setLedgerNewCopyId(e.target.value)}
                      className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg w-44 font-mono"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg cursor-pointer"
                    >
                      + Add Copy ID
                    </button>
                  </form>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        <th className="py-2.5 px-4 font-mono">Book Unique ID (Accession Tag)</th>
                        <th className="py-2.5 px-4">Current Status</th>
                        <th className="py-2.5 px-4">Assigned Borrower</th>
                        <th className="py-2.5 px-4">Due Date</th>
                        <th className="py-2.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(() => {
                        const copyIds = selectedBookForLedger.uniqueCopyIds && selectedBookForLedger.uniqueCopyIds.length > 0
                          ? selectedBookForLedger.uniqueCopyIds
                          : Array.from({ length: selectedBookForLedger.totalCopies }, (_, i) => 
                              `${selectedBookForLedger.accessionPrefix || 'ACC-' + selectedBookForLedger.id.slice(-4)}-${String(i + 1).padStart(3, '0')}`
                            );

                        return copyIds.map((cid, idx) => {
                          const activeLoan = borrowRecords.find(r => 
                            r.status !== 'returned' && 
                            r.bookCopyId && 
                            r.bookCopyId.trim().toUpperCase() === cid.trim().toUpperCase()
                          );

                          return (
                            <tr key={cid || idx} className="hover:bg-slate-50/60">
                              <td className="py-2.5 px-4 font-mono font-black text-purple-900">
                                <span className="bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200">
                                  {cid}
                                </span>
                              </td>

                              <td className="py-2.5 px-4">
                                {activeLoan ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                                    <Clock className="w-3 h-3" /> Checked Out
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                    <Check className="w-3 h-3" /> Available on Shelf
                                  </span>
                                )}
                              </td>

                              <td className="py-2.5 px-4">
                                {activeLoan ? (
                                  <div>
                                    <span className="font-bold text-slate-900">{activeLoan.borrowerName}</span>
                                    <span className="text-[10px] text-slate-500 capitalize block">
                                      {activeLoan.borrowerRole} {activeLoan.grade ? `· Gr ${activeLoan.grade} ${activeLoan.stream}` : ''}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 font-mono text-[11px]">—</span>
                                )}
                              </td>

                              <td className="py-2.5 px-4 font-mono">
                                {activeLoan ? (
                                  <span className={activeLoan.status === 'overdue' ? 'text-rose-600 font-bold' : 'text-slate-700'}>
                                    {activeLoan.dueDate}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 text-[11px]">—</span>
                                )}
                              </td>

                              <td className="py-2.5 px-4 text-right">
                                {activeLoan ? (
                                  <button
                                    onClick={() => {
                                      if (onReturnBook) {
                                        onReturnBook(activeLoan.id, `Returned copy ${cid}`);
                                      }
                                    }}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                                  >
                                    Mark Returned
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setIssuingBookFromInventory(selectedBookForLedger);
                                      setInvIssueCopyId(cid);
                                    }}
                                    className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                                  >
                                    Issue This Copy
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
                <span>Holdings for "{selectedBookForLedger.title}"</span>
                <button
                  onClick={() => setSelectedBookForLedger(null)}
                  className="px-4 py-1.5 bg-slate-800 text-white font-bold rounded-xl cursor-pointer"
                >
                  Close Ledger
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2: ADD BOOK / BATCH TO INVENTORY */}
        {showAddInventoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden animate-in fade-in">
              <div className="p-5 bg-gradient-to-r from-purple-800 to-indigo-900 text-white flex items-center justify-between">
                <div>
                  <h4 className="font-black text-base flex items-center gap-2">
                    <Boxes className="w-5 h-5 text-purple-300" />
                    <span>Add Book Title / Stock to Library Inventory</span>
                  </h4>
                  <p className="text-xs text-purple-200 mt-0.5">
                    Register title, publisher, acquisition source (Stocked/Donated), quantity & copy IDs.
                  </p>
                </div>
                <button onClick={() => setShowAddInventoryModal(false)} className="text-white/70 hover:text-white cursor-pointer">✕</button>
              </div>

              <form onSubmit={handleCreateInventoryBook} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Book Title *</label>
                  <input
                    type="text"
                    required
                    value={invTitle}
                    onChange={(e) => setInvTitle(e.target.value)}
                    placeholder="e.g. KLB Top Scholar Kiswahili Grade 5"
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:outline-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Publisher *</label>
                    <input
                      type="text"
                      required
                      value={invPublisher}
                      onChange={(e) => setInvPublisher(e.target.value)}
                      placeholder="e.g. Kenya Literature Bureau (KLB)"
                      className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:outline-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Author</label>
                    <input
                      type="text"
                      value={invAuthor}
                      onChange={(e) => setInvAuthor(e.target.value)}
                      placeholder="e.g. Prof. Wallah Bin Wallah"
                      className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:outline-purple-500"
                    />
                  </div>
                </div>

                {/* Stocked vs Donated Selection */}
                <div className="bg-purple-50/60 border border-purple-200 p-3.5 rounded-2xl space-y-2.5">
                  <span className="font-bold text-slate-800 block text-xs">Acquisition Source (Stocked / Donated) *</span>
                  <div className="grid grid-cols-2 gap-3">
                    <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                      invAcqType === 'Stocked' 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs' 
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}>
                      <input
                        type="radio"
                        name="invAcqType"
                        value="Stocked"
                        checked={invAcqType === 'Stocked'}
                        onChange={() => setInvAcqType('Stocked')}
                        className="sr-only"
                      />
                      <Building2 className="w-4 h-4" />
                      <div>
                        <div className="font-black text-xs">Stocked</div>
                        <div className="text-[10px] opacity-80">School Capitation / BOM Purchase</div>
                      </div>
                    </label>

                    <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                      invAcqType === 'Donated' 
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs' 
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}>
                      <input
                        type="radio"
                        name="invAcqType"
                        value="Donated"
                        checked={invAcqType === 'Donated'}
                        onChange={() => setInvAcqType('Donated')}
                        className="sr-only"
                      />
                      <Gift className="w-4 h-4" />
                      <div>
                        <div className="font-black text-xs">Donated</div>
                        <div className="text-[10px] opacity-80">NGO / Tusome / Alumni / MoE Grant</div>
                      </div>
                    </label>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {invAcqType === 'Donated' ? 'Donor / Organization Name' : 'Funding Budget / Account'}
                    </label>
                    <input
                      type="text"
                      value={invDonorName}
                      onChange={(e) => setInvDonorName(e.target.value)}
                      placeholder={invAcqType === 'Donated' ? 'e.g. USAID / Tusome Project' : 'e.g. Free Primary Education Capitation'}
                      className="w-full border border-slate-300 rounded-xl p-2 bg-white text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Total Quantity (Copies) *</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={invTotalCopies}
                      onChange={(e) => setInvTotalCopies(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Accession Prefix for Unique IDs *</label>
                    <input
                      type="text"
                      required
                      value={invAccessionPrefix}
                      onChange={(e) => setInvAccessionPrefix(e.target.value)}
                      placeholder="e.g. ACC-KLB-KIS5"
                      className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-600">
                  Preview Unique IDs: <strong className="font-mono text-purple-700">{invAccessionPrefix}-001</strong> through <strong className="font-mono text-purple-700">{invAccessionPrefix}-{String(invTotalCopies).padStart(3, '0')}</strong>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Category</label>
                    <select
                      value={invCategory}
                      onChange={(e) => setInvCategory(e.target.value as any)}
                      className="w-full border border-slate-300 rounded-xl p-2 bg-white text-xs"
                    >
                      <option value="CBC Textbook">CBC Textbook</option>
                      <option value="CBC Teacher Guide">CBC Teacher Guide</option>
                      <option value="Supplementary Reader">Supplementary Reader</option>
                      <option value="Encyclopedia">Encyclopedia</option>
                      <option value="Fiction Storybook">Fiction Storybook</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Grade Level</label>
                    <input
                      type="number"
                      min={1}
                      max={9}
                      value={invGrade}
                      onChange={(e) => setInvGrade(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded-xl p-2 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Shelf Location</label>
                    <input
                      type="text"
                      value={invLocationShelf}
                      onChange={(e) => setInvLocationShelf(e.target.value)}
                      placeholder="e.g. Shelf K-05A"
                      className="w-full border border-slate-300 rounded-xl p-2 text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setShowAddInventoryModal(false)}
                    className="px-4 py-2 text-slate-600 font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl shadow-xs cursor-pointer"
                  >
                    Add Title & Generate Copy IDs
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 3: ISSUE COPY FROM INVENTORY */}
        {issuingBookFromInventory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in">
              <div className="p-5 bg-gradient-to-r from-emerald-700 to-teal-800 text-white flex items-center justify-between">
                <div>
                  <h4 className="font-black text-sm flex items-center gap-2">
                    <ArrowLeftRight className="w-4 h-4 text-emerald-300" />
                    <span>Issue Physical Book Copy</span>
                  </h4>
                  <p className="text-xs text-emerald-100 mt-0.5">
                    Assign a unique copy ID to the borrower.
                  </p>
                </div>
                <button onClick={() => setIssuingBookFromInventory(null)} className="text-white/70 hover:text-white cursor-pointer">✕</button>
              </div>

              <form onSubmit={handleIssueFromInventorySubmit} className="p-5 space-y-3.5 text-xs">
                {/* Book Summary Card */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="font-black text-slate-900 text-xs">{issuingBookFromInventory.title}</div>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    Publisher: <strong>{issuingBookFromInventory.publisher}</strong> · {issuingBookFromInventory.acquisitionType || 'Stocked'}
                  </div>
                </div>

                {/* Unique ID Field */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Book Unique ID given by Librarian *
                  </label>
                  <input
                    type="text"
                    required
                    value={invIssueCopyId}
                    onChange={(e) => setInvIssueCopyId(e.target.value)}
                    placeholder="e.g. ACC-KLB-M4-003"
                    className="w-full border border-purple-300 bg-purple-50/50 rounded-xl p-2.5 font-mono font-bold text-xs focus:outline-purple-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Even if multiple borrowers have this same title & publisher, each receives their own Unique ID.
                  </p>
                </div>

                {/* Borrower Selection */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Borrower Role</label>
                    <select
                      value={invIssueBorrowerRole}
                      onChange={(e) => setInvIssueBorrowerRole(e.target.value as any)}
                      className="w-full border border-slate-300 rounded-xl p-2 bg-white text-xs"
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Due Date</label>
                    <input
                      type="date"
                      required
                      value={invIssueDueDate}
                      onChange={(e) => setInvIssueDueDate(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl p-2 font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Select Borrower Member *</label>
                  <select
                    value={invIssueBorrowerId}
                    onChange={(e) => setInvIssueBorrowerId(e.target.value)}
                    required
                    className="w-full border border-slate-300 rounded-xl p-2 bg-white text-xs"
                  >
                    <option value="">-- Choose Borrower --</option>
                    {allUsers
                      .filter(u => invIssueBorrowerRole === 'student' ? u.role === 'student' : ['teacher', 'class_teacher', 'hod', 'dean_of_studies'].includes(u.role))
                      .map(u => (
                        <option key={u.id} value={u.id}>
                          {u.name} {u.grade ? `(Grade ${u.grade} ${u.stream || ''})` : ''}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Issue Remarks</label>
                  <input
                    type="text"
                    value={invIssueRemarks}
                    onChange={(e) => setInvIssueRemarks(e.target.value)}
                    placeholder="e.g. Term reading loan"
                    className="w-full border border-slate-300 rounded-xl p-2 text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => setIssuingBookFromInventory(null)}
                    className="px-3 py-1.5 text-slate-600 font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-xs cursor-pointer"
                  >
                    Confirm Issue with Unique ID
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
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
