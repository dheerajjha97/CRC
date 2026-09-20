import React, { useState } from 'react';
import { OfficeOrder, CrcProfile } from '../types';
import { OfficialLetterView } from './OfficialLetterView';
import { downloadElementAsPdf, printLetterElement } from '../utils/pdfGenerator';
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
  ChevronRight
} from 'lucide-react';

interface OrderHistoryProps {
  orders: OfficeOrder[];
  profile: CrcProfile;
  onEditOrder: (order: OfficeOrder) => void;
  onDeleteOrder: (id: string) => Promise<void>;
}

export const OrderHistory: React.FC<OrderHistoryProps> = ({
  orders,
  profile,
  onEditOrder,
  onDeleteOrder
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPreviewOrder, setSelectedPreviewOrder] = useState<OfficeOrder | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<OfficeOrder | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const filteredOrders = orders.filter(o =>
    o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.selectedTeachers && o.selectedTeachers.some(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()))) ||
    (o.selectedTeachers && o.selectedTeachers.some(t => t.schoolName.toLowerCase().includes(searchTerm.toLowerCase()))) ||
    (o.selectedTeachers && o.selectedTeachers.some(t => t.deputedSchool && t.deputedSchool.toLowerCase().includes(searchTerm.toLowerCase())))
  );

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
      setDeleteSuccessMessage(`आदेश पत्र "${orderNum}" को रिकॉर्ड से हटा दिया गया है।`);
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

  return (
    <div id="order-history-section" className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            जारी किए गए कार्यालयीन आदेशों का इतिहास (Firestore Dispatch Register)
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            संकुल द्वारा पूर्व में निकाले गए सभी आदेश, पत्र, उपस्थिति आदेश व परीक्षा दायित्व सूची
          </p>
        </div>

        <div className="text-xs bg-indigo-50 text-indigo-800 px-3.5 py-1.5 rounded-lg font-semibold border border-indigo-200">
          कुल संधारित आदेश : {orders.length}
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            id="input-search-orders"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="आदेश क्रमांक, पत्र का विषय या शामिल शिक्षक अथवा विद्यालय के नाम से खोजें..."
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 text-center py-12 px-4">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-700">कोई आदेश रिकॉर्ड नहीं मिला</p>
            <p className="text-xs text-slate-500 mt-1">
              {searchTerm ? 'खोज शब्द बदलकर देखें।' : 'नया आदेश तैयार करने के लिए "आदेश जारी करें" टैब पर जाएं।'}
            </p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <div
              key={order.id}
              className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 hover:border-indigo-300 transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-slate-900 text-white font-mono text-xs px-2.5 py-0.5 rounded font-medium">
                      {order.orderNumber}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      दिनांक: {order.orderDate}
                    </span>
                    <span className="bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 rounded font-semibold">
                      {order.selectedTeachers ? `${order.selectedTeachers.length} शिक्षक आदेशित` : '0 शिक्षक'}
                    </span>
                    {(order.includeDeputedSchool || order.selectedTeachers?.some(t => Boolean(t.deputedSchool))) && (
                      <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs px-2 py-0.5 rounded font-semibold">
                        परीक्षा / प्रतिनियुक्ति आदेश
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {order.subject}
                  </h3>

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
                    देखें
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
                    title="हटाएं"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Success Toast Banner */}
      {deleteSuccessMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm border border-slate-700 animate-in fade-in slide-in-from-bottom-3">
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
                  आदेश रिकॉर्ड हटाएं?
                </h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  क्या आप आदेश क्रमांक <strong className="text-slate-900">"{orderToDelete.orderNumber}"</strong> (विषय: {orderToDelete.subject}) को रिकॉर्ड से हटाना चाहते हैं?
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
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
