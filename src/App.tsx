import React, { useEffect, useState } from 'react';
import { 
  Teacher, 
  OfficeOrder, 
  CrcProfile, 
  ClusterSchool 
} from './types';
import { 
  getTeachersFromDb, 
  addTeacherToDb, 
  updateTeacherInDb, 
  deleteTeacherFromDb,
  getOrdersFromDb,
  saveOrderToDb,
  updateOrderInDb,
  deleteOrderFromDb,
  getCrcProfileFromDb,
  saveCrcProfileToDb,
  getSchoolsFromDb,
  addSchoolToDb,
  deleteSchoolFromDb,
  DEFAULT_CRC_PROFILE
} from './services/dbService';
import { TeacherManagement } from './components/TeacherManagement';
import { OrderGenerator } from './components/OrderGenerator';
import { OrderHistory } from './components/OrderHistory';
import { CrcProfileSettings } from './components/CrcProfileSettings';
import { AiOrderAssistant } from './components/AiOrderAssistant';
import { BiharEducationLogo } from './components/BiharEducationLogo';
import { generateNextOrderNumber, getHighestOrderSequence } from './utils/orderNumberUtils';
import { 
  FileText, 
  Users, 
  History, 
  Settings, 
  School, 
  PlusCircle, 
  CheckCircle2, 
  Database,
  Building,
  Sparkles,
  Bot,
  BookOpen,
  ClipboardList
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'create_order' | 'ai_assistant' | 'teachers' | 'history' | 'settings'>('create_order');
  
  // App Data States
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [orders, setOrders] = useState<OfficeOrder[]>([]);
  const [schools, setSchools] = useState<ClusterSchool[]>([]);
  const [profile, setProfile] = useState<CrcProfile>(DEFAULT_CRC_PROFILE);

  const [isLoading, setIsLoading] = useState(true);
  const [editingOrder, setEditingOrder] = useState<OfficeOrder | null>(null);

  // Load initial data from Firestore
  useEffect(() => {
    async function loadAllData() {
      setIsLoading(true);
      try {
        const [loadedTeachers, loadedOrders, loadedSchools, loadedProfile] = await Promise.all([
          getTeachersFromDb(),
          getOrdersFromDb(),
          getSchoolsFromDb(),
          getCrcProfileFromDb()
        ]);

        setTeachers(loadedTeachers);
        setOrders(loadedOrders);
        setSchools(loadedSchools);
        setProfile(loadedProfile);
      } catch (err) {
        console.error('Error loading Firestore data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadAllData();
  }, []);

  // Teacher Handlers
  const handleAddTeacher = async (newTeacher: Omit<Teacher, 'id'>) => {
    try {
      const id = await addTeacherToDb(newTeacher);
      setTeachers(prev => [{ id, ...newTeacher }, ...prev]);
    } catch (err) {
      console.error('Error adding teacher:', err);
      const fallbackId = `teacher-${Date.now()}`;
      setTeachers(prev => [{ id: fallbackId, ...newTeacher }, ...prev]);
    }
  };

  const handleUpdateTeacher = async (id: string, updated: Partial<Teacher>) => {
    try {
      await updateTeacherInDb(id, updated);
    } catch (err) {
      console.error('Error updating teacher:', err);
    }
    setTeachers(prev => prev.map(t => (t.id === id ? { ...t, ...updated } : t)));
  };

  const handleDeleteTeacher = async (id: string) => {
    try {
      await deleteTeacherFromDb(id);
    } catch (err) {
      console.error('Error deleting teacher from DB:', err);
    }
    setTeachers(prev => prev.filter(t => t.id !== id));
  };

  // Order Handlers
  const handleSaveOrder = async (orderData: Omit<OfficeOrder, 'id'>): Promise<string> => {
    if (editingOrder) {
      try {
        await updateOrderInDb(editingOrder.id, orderData);
      } catch (err) {
        console.error('Error updating order:', err);
      }
      setOrders(prev => prev.map(o => (o.id === editingOrder.id ? { ...o, ...orderData } : o)));
      const id = editingOrder.id;
      setEditingOrder(null);
      return id;
    } else {
      try {
        const id = await saveOrderToDb(orderData);
        const newOrder: OfficeOrder = { id, ...orderData };
        setOrders(prev => [newOrder, ...prev]);
        return id;
      } catch (err) {
        console.error('Error saving order:', err);
        const fallbackId = `order-${Date.now()}`;
        const newOrder: OfficeOrder = { id: fallbackId, ...orderData };
        setOrders(prev => [newOrder, ...prev]);
        return fallbackId;
      }
    }
  };

  const handleDeleteOrder = async (id: string) => {
    try {
      await deleteOrderFromDb(id);
    } catch (err) {
      console.error('Error deleting order from DB:', err);
    }
    setOrders(prev => prev.filter(o => o.id !== id));
  };

  const handleEditOrder = (order: OfficeOrder) => {
    setEditingOrder(order);
    setActiveTab('create_order');
  };

  const handleApplyDraftToOrder = (draft: Partial<OfficeOrder>) => {
    const nextOrderNum = generateNextOrderNumber(orders, profile.letterPrefix);
    const fullOrder: OfficeOrder = {
      id: `ai-draft-${Date.now()}`,
      orderNumber: draft.orderNumber || nextOrderNum,
      orderDate: draft.orderDate || new Date().toISOString().split('T')[0],
      subject: draft.subject || '',
      reference: draft.reference || 'कार्यालय विकासखंड शिक्षा अधिकारी / जिला शिक्षा अधिकारी संदर्भित पत्र क्रमांक... दिनांक...',
      content: draft.content || '',
      orderType: draft.orderType || 'general',
      includeDeputedSchool: draft.includeDeputedSchool ?? Boolean(draft.selectedTeachers?.some(t => Boolean(t.deputedSchool))),
      selectedTeachers: draft.selectedTeachers || [],
      meetingDate: draft.meetingDate || '',
      meetingTime: draft.meetingTime || 'प्रातः 11:00 बजे',
      meetingVenue: draft.meetingVenue || 'संकुल संसाधन केंद्र (CRC) सभागार',
      signatoryName: profile.defaultSignatory || profile.centerHead,
      signatoryDesignation: profile.defaultDesignation || profile.headDesignation,
      officeName: profile.clusterName,
      officeAddress: profile.officeAddress,
      copyTo: [],
      createdAt: new Date().toISOString()
    };

    setEditingOrder(fullOrder);
    setActiveTab('create_order');
  };

  // Direct 1-Click Save to Dispatch Register from AI Assistant
  const handleDirectSaveFromAi = async (draft: Partial<OfficeOrder>): Promise<string> => {
    const nextOrderNum = generateNextOrderNumber(orders, profile.letterPrefix);
    const defaultNum = draft.orderNumber || nextOrderNum;
    const fullOrder: Omit<OfficeOrder, 'id'> = {
      orderNumber: defaultNum,
      orderDate: draft.orderDate || new Date().toISOString().split('T')[0],
      subject: draft.subject || 'कार्यालयीन आदेश',
      reference: draft.reference || '',
      content: draft.content || '',
      orderType: draft.orderType || 'general',
      includeDeputedSchool: draft.includeDeputedSchool ?? Boolean(draft.selectedTeachers?.some(t => Boolean(t.deputedSchool))),
      selectedTeachers: draft.selectedTeachers || [],
      meetingDate: draft.meetingDate || '',
      meetingTime: draft.meetingTime || 'प्रातः 11:00 बजे',
      meetingVenue: draft.meetingVenue || 'संकुल संसाधन केंद्र सभागार',
      signatoryName: profile.defaultSignatory || profile.centerHead,
      signatoryDesignation: profile.defaultDesignation || profile.headDesignation,
      officeName: profile.clusterName,
      officeAddress: profile.officeAddress,
      copyTo: [],
      createdAt: new Date().toISOString()
    };

    const savedId = await handleSaveOrder(fullOrder);
    return savedId;
  };

  // Profile & School Handlers
  const handleSaveProfile = async (newProfile: CrcProfile) => {
    try {
      await saveCrcProfileToDb(newProfile);
    } catch (err) {
      console.error('Error saving profile:', err);
    }
    setProfile(newProfile);
  };

  const handleAddSchool = async (school: Omit<ClusterSchool, 'id'>) => {
    try {
      const id = await addSchoolToDb(school);
      setSchools(prev => [...prev, { id, ...school }]);
    } catch (err) {
      console.error('Error adding school:', err);
      const fallbackId = `school-${Date.now()}`;
      setSchools(prev => [...prev, { id: fallbackId, ...school }]);
    }
  };

  const handleDeleteSchool = async (id: string) => {
    try {
      await deleteSchoolFromDb(id);
    } catch (err) {
      console.error('Error deleting school from DB:', err);
    }
    setSchools(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-['Mukta','Noto_Sans_Devanagari',sans-serif]">
      {/* Top Application Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <BiharEducationLogo size={42} customUrl={profile.logoUrl} variant={profile.logoVariant || 'shiksha_vibhag'} className="shrink-0" />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                    शिक्षा विभाग, बिहार
                  </h1>
                  <span className="hidden sm:inline-block text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full border border-amber-300">
                    CRC पोर्टल
                  </span>
                </div>
                <p className="text-xs text-slate-500 hidden sm:block">
                  {profile.clusterName || 'संकुल संसाधन केंद्र'} • कार्यालयीन आदेश एवं पत्र जनरेटर
                </p>
              </div>
            </div>

            {/* Firestore Status Badge & Cluster Info & Quick Link to जावक पंजी */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                  activeTab === 'history'
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border-indigo-200'
                }`}
                title="कार्यालयीन जावक पंजी खोलें"
              >
                <ClipboardList className="w-4 h-4" />
                <span>जावक पंजी</span>
                <span className="bg-indigo-200/80 text-indigo-950 text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ml-0.5">
                  {orders.length}
                </span>
              </button>

              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-full font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <Database className="w-3.5 h-3.5" />
                <span>सुरक्षित (Cloud Firestore)</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 pb-24 sm:pb-28">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-semibold text-slate-600">
              Firestore डेटाबेस से संकुल रिकॉर्ड व जावक पंजी लोड की जा रही है...
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'create_order' && (
              <OrderGenerator
                teachers={teachers}
                schools={schools}
                profile={profile}
                orders={orders}
                onSaveOrder={handleSaveOrder}
                editingOrder={editingOrder}
                onCancelEdit={() => setEditingOrder(null)}
                onOpenAiChat={() => setActiveTab('ai_assistant')}
                onNavigateToHistory={() => setActiveTab('history')}
              />
            )}

            {activeTab === 'ai_assistant' && (
              <AiOrderAssistant
                teachers={teachers}
                profile={profile}
                schools={schools}
                orders={orders}
                onApplyDraftToOrder={handleApplyDraftToOrder}
                onDirectSaveToHistory={handleDirectSaveFromAi}
                onNavigateToHistory={() => setActiveTab('history')}
              />
            )}

            {activeTab === 'teachers' && (
              <TeacherManagement
                teachers={teachers}
                schools={schools}
                onAddTeacher={handleAddTeacher}
                onUpdateTeacher={handleUpdateTeacher}
                onDeleteTeacher={handleDeleteTeacher}
              />
            )}

            {activeTab === 'history' && (
              <OrderHistory
                orders={orders}
                profile={profile}
                onEditOrder={handleEditOrder}
                onDeleteOrder={handleDeleteOrder}
                onNavigateToCreate={() => setActiveTab('create_order')}
                onNavigateToAi={() => setActiveTab('ai_assistant')}
              />
            )}

            {activeTab === 'settings' && (
              <CrcProfileSettings
                profile={profile}
                schools={schools}
                onSaveProfile={handleSaveProfile}
                onAddSchool={handleAddSchool}
                onDeleteSchool={handleDeleteSchool}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-3 px-6 text-center text-xs text-slate-500 mb-16 sm:mb-16 print:hidden">
        संकुल संसाधन केंद्र (Cluster Resource Centre) कार्यालयीन प्रबंधन प्रणाली • डेटाबेस: Cloud Firestore • AI संचालित शुद्ध शासकीय आलेखन
      </footer>

      {/* Fixed Bottom Navigation Bar */}
      <nav
        id="bottom-navigation-bar"
        aria-label="मुख्य नेविगेशन"
        className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg px-2 sm:px-4 py-1.5 print:hidden"
      >
        <div className="max-w-2xl mx-auto flex items-center justify-around gap-1">
          {/* 1. Create Order Tab */}
          <button
            id="bottom-nav-create-order"
            onClick={() => setActiveTab('create_order')}
            className={`flex-1 py-1 px-1 sm:px-2 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer relative ${
              activeTab === 'create_order'
                ? 'text-indigo-600 font-bold'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <div className={`p-1.5 rounded-lg transition-colors relative ${
              activeTab === 'create_order' ? 'bg-indigo-50 text-indigo-600' : ''
            }`}>
              <FileText className="w-5 h-5" />
              {editingOrder && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-white"></span>
              )}
            </div>
            <span className="text-[11px] sm:text-xs mt-0.5 tracking-tight text-center truncate max-w-full">
              नया आदेश
            </span>
          </button>

          {/* 2. AI Order Assistant Tab */}
          <button
            id="bottom-nav-ai-assistant"
            onClick={() => setActiveTab('ai_assistant')}
            className={`flex-1 py-1 px-1 sm:px-2 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer relative ${
              activeTab === 'ai_assistant'
                ? 'text-indigo-600 font-bold'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <div className={`p-1.5 rounded-lg transition-colors relative ${
              activeTab === 'ai_assistant' ? 'bg-indigo-50 text-indigo-600' : ''
            }`}>
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
            </div>
            <span className="text-[11px] sm:text-xs mt-0.5 tracking-tight text-center truncate max-w-full font-semibold">
              ✨ AI सहायक
            </span>
          </button>

          {/* 3. History / जावक पंजी Tab (PROMINENT) */}
          <button
            id="bottom-nav-history"
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-1 px-1 sm:px-2 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer relative ${
              activeTab === 'history'
                ? 'text-indigo-600 font-bold'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <div className={`p-1.5 rounded-lg transition-colors relative ${
              activeTab === 'history' ? 'bg-indigo-50 text-indigo-600' : ''
            }`}>
              <ClipboardList className="w-5 h-5" />
              {orders.length > 0 && (
                <span className={`absolute -top-1 -right-2 text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                  activeTab === 'history' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {orders.length}
                </span>
              )}
            </div>
            <span className="text-[11px] sm:text-xs mt-0.5 tracking-tight text-center truncate max-w-full font-semibold">
              📖 जावक पंजी
            </span>
          </button>

          {/* 4. Teachers Tab */}
          <button
            id="bottom-nav-teachers"
            onClick={() => setActiveTab('teachers')}
            className={`flex-1 py-1 px-1 sm:px-2 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer relative ${
              activeTab === 'teachers'
                ? 'text-indigo-600 font-bold'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <div className={`p-1.5 rounded-lg transition-colors relative ${
              activeTab === 'teachers' ? 'bg-indigo-50 text-indigo-600' : ''
            }`}>
              <Users className="w-5 h-5" />
              {teachers.length > 0 && (
                <span className={`absolute -top-1 -right-2 text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                  activeTab === 'teachers' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {teachers.length}
                </span>
              )}
            </div>
            <span className="text-[11px] sm:text-xs mt-0.5 tracking-tight text-center truncate max-w-full">
              शिक्षक सूची
            </span>
          </button>

          {/* 5. Settings Tab */}
          <button
            id="bottom-nav-settings"
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-1 px-1 sm:px-2 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'text-indigo-600 font-bold'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <div className={`p-1.5 rounded-lg transition-colors ${
              activeTab === 'settings' ? 'bg-indigo-50 text-indigo-600' : ''
            }`}>
              <Settings className="w-5 h-5" />
            </div>
            <span className="text-[11px] sm:text-xs mt-0.5 tracking-tight text-center truncate max-w-full">
              संकुल प्रोफाइल
            </span>
          </button>
        </div>
      </nav>
    </div>
  );
}
