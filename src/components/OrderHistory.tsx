import React, { useState, useMemo } from 'react';
import { OfficeOrder, CrcProfile } from '../types';
import { OfficialLetterView } from './OfficialLetterView';
import { downloadElementAsPdf, printLetterElement } from '../utils/pdfGenerator';
import { sortOrdersBySequence, extractSequenceNumber } from '../utils/orderNumberUtils';
import { 
  FileText, 
  Download, 
  Printer, 
  Trash2, 
  Edit3, 
  Calendar, 
  Users, 
  Search, 
  Eye, 
  X,
  Clock,
  ChevronRight,
  ClipboardList,
  BookOpen,
  LayoutGrid,
  Table as TableIcon,
  PlusCircle,
  Sparkles,
  School,
  CheckCircle2,
  Filter,
  ArrowUpDown,
  ArrowUp10,
  ArrowDown10,
  Hash
} from 'lucide-react';

interface OrderHistoryProps {
  orders: OfficeOrder[];
  profile: CrcProfile;
  onEditOrder: (order: OfficeOrder) => void;
  onDeleteOrder: (id: string) => Promise<void>;
  onUpdateOrder?: (id: string, updated: Partial<OfficeOrder>) => Promise<void>;
  onNavigateToCreate?: () => void;
  onNavigateToAi?: () => void;
}

export const OrderHistory: React.FC<OrderHistoryProps> = ({
  orders,
  profile,
  onEditOrder,
  onDeleteOrder,
  onUpdateOrder,
  onNavigateToCreate,
  onNavigateToAi
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [typeFilter, setTypeFilter] = useState<'all' | 'meeting' | 'duty' | 'training' | 'general' | 'notice'>('all');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc'); // Default: बढ़ते क्रम में (1 -> 2 -> 3)
  const [selectedPreviewOrder, setSelectedPreviewOrder] = useState<OfficeOrder | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<OfficeOrder | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Filter and sort orders strictly by sequence number in ascending order (बढ़ते क्रम में)
  const filteredOrders = useMemo(() => {
    const matches = orders.filter(o => {
      const matchesSearch = 
        o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.reference && o.reference.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (o.selectedTeachers && o.selectedTeachers.some(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()))) ||
        (o.selectedTeachers && o.selectedTeachers.some(t => t.schoolName.toLowerCase().includes(searchTerm.toLowerCase()))) ||
        (o.selectedTeachers && o.selectedTeachers.some(t => t.deputedSchool && t.deputedSchool.toLowerCase().includes(searchTerm.toLowerCase())));

      const matchesType = typeFilter === 'all' || o.orderType === typeFilter;

      return matchesSearch && matchesType;
    });

    return sortOrdersBySequence(matches, sortDirection);
  }, [orders, searchTerm, typeFilter, sortDirection]);

  const handleConfirmDeleteOrder = async () => {
    if (!orderToDelete) return;
    setIsDeleting(true);
    try {
      const orderNum = orderToDelete.orderNumber;
      await onDeleteOrder(orderToDelete.id);
      if (selectedPreviewOrder?.id === orderToDelete.id) {
        setSelectedPreviewOrder(null);
      }
      setOrderToDelete(null);
      setDeleteSuccessMessage(`जावक पंजी से पत्र क्रमांक "${orderNum}" को हटा दिया गया है।`);
      setTimeout(() => setDeleteSuccessMessage(null), 3500);
    } catch (err) {
      console.error('Error deleting order:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadPdf = async (order: OfficeOrder) => {
    setIsExporting(true);
    try {
      const safeNum = order.orderNumber.replace(/[^a-zA-Z0-9_\u0900-\u097F]/g, '_');
      await downloadElementAsPdf('history-modal-letter-document', `Aadesh_${safeNum}`);
    } catch (err) {
      console.error(err);
      alert('PDF निर्यात में त्रुटि हुई।');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrintRegister = () => {
    window.print();
  };

  const getOrderTypeBadge = (type?: string) => {
    switch (type) {
      case 'meeting':
        return <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-bold">बैठक आदेश</span>;
      case 'duty':
        return <span className="bg-amber-100 text-amber-900 text-[10px] px-2 py-0.5 rounded-full font-bold">प्रतिनियुक्ति / दायित्व</span>;
      case 'training':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold">प्रशिक्षण आदेश</span>;
      case 'notice':
        return <span className="bg-purple-100 text-purple-800 text-[10px] px-2 py-0.5 rounded-full font-bold">सूचना / निर्देश</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded-full font-medium">कार्यालयीन आदेश</span>;
    }
  };

  return (
    <div id="order-history-section" className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
              <ClipboardList className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                कार्यालयीन जावक पंजी (Official Dispatch Register)
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                {profile.clusterName || 'संकुल संसाधन केंद्र'} द्वारा जारी व संधारित सभी सरकारी आदेशों व पत्रों का आधिकारिक रजिस्टर
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="text-xs bg-indigo-50 text-indigo-900 px-3 py-1.5 rounded-lg font-bold border border-indigo-200 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <span>कुल जावक पत्र : {orders.length}</span>
          </div>

          <button
            onClick={handlePrintRegister}
            className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="जावक पंजी का प्रिंट प्रारूप निकालें"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>पंजी प्रिंट करें</span>
          </button>
        </div>
      </div>

      {/* Printable Register Header for Print Mode Only */}
      <div className="hidden print:block text-center border-b-2 border-black pb-4 mb-4">
        <h1 className="text-xl font-bold uppercase">शिक्षा विभाग, {profile.stateName || 'बिहार'}</h1>
        <h2 className="text-base font-bold">{profile.clusterName} ({profile.officeAddress})</h2>
        <h3 className="text-lg font-extrabold underline mt-2">कार्यालयीन जावक पंजी (DISPATCH REGISTER)</h3>
        <p className="text-xs mt-1">दिनांक: {new Date().toLocaleDateString('hi-IN')} तक संधारित पत्र विवरण</p>
      </div>

      {/* Filter and View Mode Toolbar */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 space-y-3 print:hidden">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              id="input-search-orders"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="जावक क्रमांक, आदेश का विषय, संदर्भ अथवा शिक्षक/विद्यालय के नाम से खोजें..."
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort Direction Toggle & View Mode Toggle */}
          <div className="flex flex-wrap items-center gap-2 shrink-0 self-end sm:self-auto">
            {/* Sort Toggle Button */}
            <button
              type="button"
              onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                sortDirection === 'asc'
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-800 shadow-xs'
                  : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
              }`}
              title={sortDirection === 'asc' ? 'आदेश क्रमांक बढ़ते क्रम में (1 ➔ 2 ➔ 3)' : 'नवीनतम आदेश पहले'}
            >
              {sortDirection === 'asc' ? (
                <>
                  <ArrowUp10 className="w-4 h-4 text-indigo-600" />
                  <span>क्रमांक: बढ़ते क्रम में (1 ➔ 2 ➔ 3)</span>
                </>
              ) : (
                <>
                  <ArrowDown10 className="w-4 h-4 text-slate-600" />
                  <span>क्रमांक: घटते क्रम में (नवीनतम)</span>
                </>
              )}
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="रजिस्टर तालिका दृश्य"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>पंजी तालिका</span>
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="कार्ड विस्तृत दृश्य"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>कार्ड दृश्य</span>
              </button>
            </div>
          </div>
        </div>

        {/* Order Type Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 text-xs">
          <span className="text-slate-500 font-medium flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" />
            प्रकार:
          </span>
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              typeFilter === 'all'
                ? 'bg-indigo-600 text-white font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            सभी ({orders.length})
          </button>
          <button
            onClick={() => setTypeFilter('duty')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              typeFilter === 'duty'
                ? 'bg-amber-600 text-white font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            प्रतिनियुक्ति/परीक्षा
          </button>
          <button
            onClick={() => setTypeFilter('meeting')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              typeFilter === 'meeting'
                ? 'bg-blue-600 text-white font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            बैठक आदेश
          </button>
          <button
            onClick={() => setTypeFilter('training')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              typeFilter === 'training'
                ? 'bg-emerald-600 text-white font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            प्रशिक्षण
          </button>
          <button
            onClick={() => setTypeFilter('notice')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              typeFilter === 'notice'
                ? 'bg-purple-600 text-white font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            सूचना / निर्देश
          </button>
        </div>
      </div>

      {/* Main Register Content */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 text-center py-14 px-6 space-y-4">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
            <ClipboardList className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              {searchTerm ? 'कोई मेल खाता आदेश नहीं मिला' : 'जावक पंजी में अभी कोई पत्र दर्ज नहीं है'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
              {searchTerm 
                ? 'कृपया खोज शब्द बदलकर देखें या फ़िल्टर रीसेट करें।'
                : 'जब आप "नया आदेश" अथवा "AI सहायक" से कोई पत्र तैयार करके सेव करते हैं, तो वह स्वतः इस जावक पंजी में क्रमांक सहित दर्ज हो जाता है।'}
            </p>
          </div>

          {!searchTerm && (
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {onNavigateToCreate && (
                <button
                  type="button"
                  onClick={onNavigateToCreate}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>नया आदेश पत्र बनाएं</span>
                </button>
              )}
              {onNavigateToAi && (
                <button
                  type="button"
                  onClick={onNavigateToAi}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>AI सहायक से लिखवाएं</span>
                </button>
              )}
            </div>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* 1. Official Government Tabular Dispatch Register View */
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3 w-12 text-center border-r border-slate-200">क्र.</th>
                  <th className="py-3 px-3.5 w-44 border-r border-slate-200">
                    <button
                      type="button"
                      onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                      className="flex items-center gap-1.5 font-bold hover:text-indigo-700 transition-colors cursor-pointer text-left w-full"
                      title="क्रमांक अनुसार क्रम बदलें (बढ़ते / घटते)"
                    >
                      <span>जावक क्रमांक</span>
                      {sortDirection === 'asc' ? (
                        <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1 py-0.2 rounded font-bold">
                          बढ़ते ↑
                        </span>
                      ) : (
                        <span className="text-[10px] bg-slate-200 text-slate-800 px-1 py-0.2 rounded font-bold">
                          घटते ↓
                        </span>
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-3 w-28 border-r border-slate-200">जावक दिनांक</th>
                  <th className="py-3 px-4 min-w-[220px] border-r border-slate-200">पत्र का विषय व संदर्भ</th>
                  <th className="py-3 px-3.5 min-w-[180px] border-r border-slate-200">आदेशित शिक्षक / विद्यालय</th>
                  <th className="py-3 px-3 w-28 text-center border-r border-slate-200">प्रकार</th>
                  <th className="py-3 px-3 w-32 text-center print:hidden">कार्रवाई</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-sans">
                {filteredOrders.map((order, idx) => {
                  const seqNum = extractSequenceNumber(order.orderNumber);
                  return (
                  <tr 
                    key={order.id} 
                    className="hover:bg-indigo-50/40 transition-colors group"
                  >
                    {/* Index */}
                    <td className="py-3 px-3 text-center font-bold text-slate-600 border-r border-slate-200 align-top">
                      {idx + 1}
                    </td>

                    {/* Dispatch Order Number */}
                    <td className="py-3 px-3.5 font-mono font-bold text-slate-900 border-r border-slate-200 align-top whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="bg-slate-100 text-slate-900 px-2 py-0.5 rounded border border-slate-300 font-bold block">
                          {order.orderNumber}
                        </span>
                        {seqNum !== null && (
                          <span className="bg-indigo-50 text-indigo-700 text-[10px] px-1.5 py-0.5 rounded border border-indigo-200 font-semibold" title={`क्रम संख्या #${seqNum}`}>
                            #{seqNum}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-3 text-slate-700 border-r border-slate-200 align-top whitespace-nowrap">
                      <span className="font-medium">{order.orderDate}</span>
                    </td>

                    {/* Subject & Reference */}
                    <td className="py-3 px-4 border-r border-slate-200 align-top">
                      <div className="font-bold text-slate-900 leading-snug">
                        {order.subject}
                      </div>
                      {order.reference && (
                        <div className="text-[11px] text-slate-500 mt-1 line-clamp-1 italic">
                          संदर्भ: {order.reference}
                        </div>
                      )}
                    </td>

                    {/* Ordered Teachers / Deputation */}
                    <td className="py-3 px-3.5 border-r border-slate-200 align-top">
                      {order.selectedTeachers && order.selectedTeachers.length > 0 ? (
                        <div className="space-y-1">
                          <div className="font-semibold text-slate-800">
                            {order.selectedTeachers.length} शिक्षक आदेशित:
                          </div>
                          <div className="text-[11px] text-slate-600 line-clamp-2">
                            {order.selectedTeachers.map((t) => t.name).join(', ')}
                          </div>
                          {order.selectedTeachers.some(t => Boolean(t.deputedSchool)) && (
                            <span className="inline-block bg-amber-50 text-amber-900 border border-amber-200 text-[10px] px-1.5 py-0.2 rounded font-semibold">
                              प्रतिनियुक्ति शामिल
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">सामान्य निर्देश / कोई सूची नहीं</span>
                      )}
                    </td>

                    {/* Order Type */}
                    <td className="py-3 px-3 text-center border-r border-slate-200 align-top whitespace-nowrap">
                      {getOrderTypeBadge(order.orderType)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-center align-top whitespace-nowrap print:hidden">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedPreviewOrder(order)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                          title="पत्र देखें व प्रिंट करें"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEditOrder(order)}
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="संपादित करें"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setOrderToDelete(order)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="जावक पंजी से हटाएं"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* 2. Detailed Cards View */
        <div className="space-y-4">
          {filteredOrders.map(order => {
            const seqNum = extractSequenceNumber(order.orderNumber);
            return (
            <div
              key={order.id}
              className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 hover:border-indigo-300 transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-slate-900 text-white font-mono text-xs px-2.5 py-0.5 rounded font-bold">
                      {order.orderNumber}
                    </span>
                    {seqNum !== null && (
                      <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-0.5 rounded-full font-bold border border-indigo-200">
                        क्रमांक #{seqNum}
                      </span>
                    )}
                    <span className="text-xs text-slate-600 flex items-center gap-1 font-medium bg-slate-100 px-2 py-0.5 rounded">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      दिनांक: {order.orderDate}
                    </span>
                    {getOrderTypeBadge(order.orderType)}
                    <span className="bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 rounded font-semibold border border-indigo-200">
                      {order.selectedTeachers ? `${order.selectedTeachers.length} शिक्षक आदेशित` : '0 शिक्षक'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {order.subject}
                  </h3>

                  {order.reference && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 italic">
                      <strong>संदर्भ:</strong> {order.reference}
                    </p>
                  )}

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {order.content}
                  </p>

                  {/* Included Teachers badges */}
                  {order.selectedTeachers && order.selectedTeachers.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] font-bold text-slate-600">शामिल शिक्षक:</span>
                      {order.selectedTeachers.slice(0, 4).map(st => (
                        <span
                          key={st.id}
                          className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 inline-flex items-center gap-1"
                        >
                          <span className="font-semibold">{st.name}</span>
                          <span className="text-slate-500">({st.schoolName}</span>
                          {st.deputedSchool && (
                            <span className="text-indigo-700 font-semibold">→ {st.deputedSchool}</span>
                          )}
                          <span className="text-slate-500">)</span>
                        </span>
                      ))}
                      {order.selectedTeachers.length > 4 && (
                        <span className="text-[11px] text-indigo-600 font-semibold">
                          +{order.selectedTeachers.length - 4} अन्य...
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => setSelectedPreviewOrder(order)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    देखें व प्रिंट करें
                  </button>

                  <button
                    onClick={() => onEditOrder(order)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    संपादित करें
                  </button>

                  <button
                    onClick={() => setOrderToDelete(order)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg text-xs transition-colors cursor-pointer"
                    title="जावक पंजी से हटाएं"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* Delete Success Toast Banner */}
      {deleteSuccessMessage && (
        <div className="fixed bottom-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm border border-slate-700 animate-in fade-in slide-in-from-bottom-3">
          <FileText className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{deleteSuccessMessage}</span>
        </div>
      )}

      {/* Confirmation Modal for Deleting Order */}
      {orderToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  जावक पंजी से आदेश हटाएं?
                </h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  क्या आप जावक क्रमांक <strong className="text-slate-900">"{orderToDelete.orderNumber}"</strong> (विषय: {orderToDelete.subject}) को पंजी से हटाना चाहते हैं?
                </p>
              </div>

              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setOrderToDelete(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50 font-medium cursor-pointer transition-colors"
                >
                  रद्द करें
                </button>
                <button
                  id="btn-confirm-delete-order"
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDeleteOrder}
                  className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg text-sm font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  {isDeleting ? 'हटाया जा रहा है...' : 'हाँ, आदेश हटाएं'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for full official letter view & download */}
      {selectedPreviewOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 md:p-6 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  कार्यालयीन आदेश पत्र: {selectedPreviewOrder.orderNumber}
                </h3>
                <p className="text-xs text-slate-500">दिनांक: {selectedPreviewOrder.orderDate}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadPdf(selectedPreviewOrder)}
                  disabled={isExporting}
                  className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  {isExporting ? 'डाउनलोड हो रहा...' : 'PDF डाउनलोड'}
                </button>

                <button
                  onClick={() => printLetterElement('history-modal-letter-document')}
                  className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  प्रिंट
                </button>

                <button
                  onClick={() => setSelectedPreviewOrder(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Letter Document Content */}
            <div className="p-4 md:p-6 overflow-y-auto bg-slate-200 flex justify-center">
              <OfficialLetterView
                order={selectedPreviewOrder}
                profile={profile}
                id="history-modal-letter-document"
                allowInlineEdit={true}
                onUpdateOrder={async (updated) => {
                  setSelectedPreviewOrder(updated);
                  if (onUpdateOrder && updated.id) {
                    await onUpdateOrder(updated.id, updated);
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
