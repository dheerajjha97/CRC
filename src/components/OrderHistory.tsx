import React, { useState } from 'react';
import { OfficeOrder, CrcProfile } from '../types';
import { OfficialLetterView } from './OfficialLetterView';
import { downloadOrderAsPdf, printOrderDirectly } from '../utils/pdfGenerator';
import { 
  BookOpen, 
  Search, 
  Download, 
  Printer, 
  Trash2, 
  Edit3, 
  Eye, 
  Calendar, 
  Users, 
  Plus, 
  Sparkles,
  X,
  FileSpreadsheet,
  CheckCircle2,
  RefreshCw,
  Copy
} from 'lucide-react';

interface OrderHistoryProps {
  orders: OfficeOrder[];
  profile: CrcProfile;
  onEditOrder: (order: OfficeOrder) => void;
  onCloneOrder?: (order: OfficeOrder) => void;
  onDeleteOrder: (id: string) => Promise<void>;
  onUpdateOrder?: (id: string, updated: Partial<OfficeOrder>) => Promise<void>;
  onUpdateProfile?: (updatedProfile: CrcProfile) => Promise<void>;
  onNavigateToCreate?: () => void;
  onNavigateToAi?: () => void;
  onRefresh?: () => Promise<void>;
  isRefreshing?: boolean;
}

export const OrderHistory: React.FC<OrderHistoryProps> = ({
  orders,
  profile,
  onEditOrder,
  onCloneOrder,
  onDeleteOrder,
  onUpdateOrder,
  onUpdateProfile,
  onNavigateToCreate,
  onNavigateToAi,
  onRefresh,
  isRefreshing = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'draft' | 'final'>('all');
  const [selectedPreviewOrder, setSelectedPreviewOrder] = useState<OfficeOrder | null>(null);
  const [isDownloadingModalPdf, setIsDownloadingModalPdf] = useState(false);

  // Count drafts and finals
  const draftCount = orders.filter(o => o.status === 'draft').length;
  const finalCount = orders.filter(o => o.status !== 'draft').length;

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      (order.orderNumber && order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.subject && order.subject.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.content && order.content.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.selectedTeachers && order.selectedTeachers.some(t => t.name.toLowerCase().includes(searchTerm.toLowerCase())));

    const matchesCategory = selectedCategory === 'all' || order.orderType === selectedCategory;

    const matchesStatus = 
      selectedStatus === 'all' ||
      (selectedStatus === 'draft' && order.status === 'draft') ||
      (selectedStatus === 'final' && order.status !== 'draft');

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Convert a draft to final issued order
  const handleMakeOrderFinal = async (order: OfficeOrder) => {
    if (!onUpdateOrder || !order.id) return;
    await onUpdateOrder(order.id, {
      status: 'final',
      updatedAt: new Date().toISOString()
    });
  };

  const handleDownloadModalPdf = async () => {
    if (!selectedPreviewOrder) return;
    setIsDownloadingModalPdf(true);
    try {
      const cleanName = selectedPreviewOrder.subject ? selectedPreviewOrder.subject.substring(0, 30).replace(/[^a-zA-Z0-9\u0900-\u097F]/g, '_') : 'Aadesh';
      await downloadOrderAsPdf('history-modal-letter-document', `${selectedPreviewOrder.orderNumber || 'CRC_Order'}_${cleanName}.pdf`);
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setIsDownloadingModalPdf(false);
    }
  };

  const handleDownloadSinglePdf = async (order: OfficeOrder) => {
    setSelectedPreviewOrder(order);
    setTimeout(async () => {
      try {
        const cleanName = order.subject ? order.subject.substring(0, 30).replace(/[^a-zA-Z0-9\u0900-\u097F]/g, '_') : 'Aadesh';
        await downloadOrderAsPdf('history-modal-letter-document', `${order.orderNumber || 'CRC_Order'}_${cleanName}.pdf`);
      } catch (err) {
        console.error('Download error:', err);
      }
    }, 250);
  };

  const handlePrintSingle = (order: OfficeOrder) => {
    setSelectedPreviewOrder(order);
    setTimeout(() => {
      printOrderDirectly('history-modal-letter-document');
    }, 200);
  };

  const exportJawakPanjiCsv = () => {
    if (orders.length === 0) return;

    const headers = ['क्र.', 'जावक क्रमांक (Order No)', 'दिनांक (Date)', 'विषय (Subject)', 'संबद्ध शिक्षक संख्या', 'हस्ताक्षरकर्ता'];
    const rows = orders.map((o, idx) => [
      idx + 1,
      `"${o.orderNumber || ''}"`,
      `"${o.orderDate || ''}"`,
      `"${(o.subject || '').replace(/"/g, '""')}"`,
      o.selectedTeachers ? o.selectedTeachers.length : 0,
      `"${o.signatoryName || profile.defaultSignatory || ''}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `CRC_Jawak_Panji_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-600" />
            संकुल जावक पंजी (Office Dispatch Register)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            संकुल से निर्गत समस्त शासकीय आदेशों, बैठकों एवं प्रतिनियुक्ति पत्रों का विधिवत संधारित रिकॉर्ड
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              type="button"
              onClick={() => onRefresh()}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer disabled:opacity-50"
              title="डेटाबेस से पुनः लोड करें"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
              <span className="hidden sm:inline">रीफ़्रेश</span>
            </button>
          )}

          <button
            type="button"
            onClick={exportJawakPanjiCsv}
            disabled={orders.length === 0}
            className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer disabled:opacity-40"
            title="CSV/Excel प्रारूप में जावक पंजी डाउनलोड करें"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>जावक पंजी Excel/CSV</span>
          </button>

          {onNavigateToCreate && (
            <button
              type="button"
              onClick={onNavigateToCreate}
              className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>नया आदेश बनाएं</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        {/* Status Tabs: All vs Drafts vs Issued */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setSelectedStatus('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedStatus === 'all'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              सभी आदेश ({orders.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatus('draft')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedStatus === 'draft'
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'text-amber-800 hover:text-amber-950 bg-amber-50/50'
              }`}
            >
              <span>📝 ड्राफ्ट मसौदे</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedStatus === 'draft' ? 'bg-amber-600 text-white' : 'bg-amber-200 text-amber-900'}`}>
                {draftCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatus('final')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedStatus === 'final'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-emerald-800 hover:text-emerald-950 bg-emerald-50/50'
              }`}
            >
              <span>✅ निर्गत आदेश</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedStatus === 'final' ? 'bg-emerald-700 text-white' : 'bg-emerald-200 text-emerald-900'}`}>
                {finalCount}
              </span>
            </button>
          </div>

          <span className="text-[11px] text-slate-500 font-medium">
            कुल {filteredOrders.length} रिकॉर्ड प्रदर्शित
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="पत्र क्रमांक, विषय, शिक्षक के नाम या विवरण से खोजें..."
              className="w-full pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-56 px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-700 font-medium"
          >
            <option value="all">सभी आदेश प्रकार ({orders.length})</option>
            <option value="meeting">बैठक आदेश (Meeting)</option>
            <option value="exam_duty">परीक्षा वीक्षक (Exam Duty)</option>
            <option value="deputation">प्रतिनियुक्ति (Deputation)</option>
            <option value="training">प्रशिक्षण (Training)</option>
            <option value="evaluation">मूल्यांकन (Evaluation)</option>
            <option value="general">सामान्य आदेश (General)</option>
          </select>
        </div>
      </div>

      {/* Orders Table & Register List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16 px-4">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700">कोई आदेश पंजीबद्ध नहीं मिला</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              {orders.length === 0
                ? 'अभी तक कोई आदेश नहीं बनाया गया है। ऊपर दिए गए "नया आदेश बनाएं" बटन पर क्लिक करके पहला आदेश तैयार करें।'
                : 'आपके द्वारा खोजे गए शब्दों के अनुरूप कोई रिकॉर्ड नहीं मिला।'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead className="bg-slate-50 text-slate-900 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">क्र.</th>
                  <th className="py-3 px-4 w-32">स्थिति</th>
                  <th className="py-3 px-4 w-36">पत्र क्रमांक</th>
                  <th className="py-3 px-4 w-28">दिनांक</th>
                  <th className="py-3 px-4">विषय (Subject)</th>
                  <th className="py-3 px-4 w-28 text-center">संबद्ध शिक्षक</th>
                  <th className="py-3 px-4 w-48 text-right">कार्रवाई (Actions)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order, idx) => (
                  <tr key={order.id || idx} className={`hover:bg-slate-50/80 transition-colors ${order.status === 'draft' ? 'bg-amber-50/20' : ''}`}>
                    <td className="py-3.5 px-4 text-center font-medium text-slate-500">
                      {idx + 1}
                    </td>

                    <td className="py-3.5 px-4">
                      {order.status === 'draft' ? (
                        <span className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-100/90 border border-amber-300 px-2 py-0.5 rounded text-[10px]">
                          📝 ड्राफ्ट
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2 py-0.5 rounded text-[10px]">
                          ✅ निर्गत
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        {order.orderNumber || '—'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-600">
                      {order.orderDate
                        ? new Date(order.orderDate).toLocaleDateString('hi-IN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })
                        : '—'}
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 line-clamp-1">{order.subject}</p>
                      {order.reference && (
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          प्रसंग: {order.reference}
                        </p>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full text-[11px]">
                        <Users className="w-3 h-3 text-slate-500" />
                        {order.selectedTeachers ? order.selectedTeachers.length : 0}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {order.status === 'draft' && (
                          <button
                            type="button"
                            onClick={() => handleMakeOrderFinal(order)}
                            className="text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded transition-colors cursor-pointer shadow-2xs"
                            title="इस ड्राफ्ट को अंतिम आदेश बनाकर जारी करें"
                          >
                            जारी करें
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setSelectedPreviewOrder(order)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="पत्र देखें व संपादित करें (View / Edit)"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onEditOrder(order)}
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                          title="संशोधित करें (Edit Form)"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {onCloneOrder && (
                          <button
                            type="button"
                            onClick={() => onCloneOrder(order)}
                            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                            title="इस आदेश की प्रतिलिपि बनाकर नया ड्राफ्ट बनाएं (Duplicate / Copy as New Draft)"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDownloadSinglePdf(order)}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="PDF डाउनलोड"
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handlePrintSingle(order)}
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="प्रिंट"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {order.id && (
                          <button
                            type="button"
                            onClick={() => onDeleteOrder(order.id!)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="पंजी से हटाएं"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal / Overlay for Official Letter Inspection & Inline Editing */}
      {selectedPreviewOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto print:p-0 print:static print:bg-transparent">
          <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 print:shadow-none print:rounded-none print:max-h-none print:max-w-none">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-sm">
                    आदेश पत्र प्रिव्यू एवं इनलाइन संपादन
                  </h3>
                  <span className="text-[11px] text-slate-300 font-mono">
                    {selectedPreviewOrder.orderNumber || 'शासकीय आदेश'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onCloneOrder && (
                  <button
                    type="button"
                    onClick={() => {
                      const toClone = selectedPreviewOrder;
                      setSelectedPreviewOrder(null);
                      onCloneOrder(toClone);
                    }}
                    className="inline-flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-2xs"
                    title="इस आदेश की सामग्री से नया ड्राफ्ट बनाएं"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>कॉपी / नया ड्राफ्ट</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleDownloadModalPdf}
                  disabled={isDownloadingModalPdf}
                  className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-60"
                  title="A4 PDF डाउनलोड करें"
                >
                  {isDownloadingModalPdf ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>PDF (A4)</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => printOrderDirectly('history-modal-letter-document')}
                  className="inline-flex items-center gap-1 bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>प्रिंट</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPreviewOrder(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto bg-slate-100 flex-1 print:p-0 print:bg-white print:overflow-visible">
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
                onUpdateProfile={onUpdateProfile}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
