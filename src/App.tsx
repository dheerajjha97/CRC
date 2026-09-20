import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  BookOpen, 
  Users, 
  Settings, 
  Sparkles, 
  Plus, 
  Building2, 
  HelpCircle,
  RefreshCw,
  Layers,
  Database
} from 'lucide-react';
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
import { OrderGenerator } from './components/OrderGenerator';
import { OrderHistory } from './components/OrderHistory';
import { TeacherManagement } from './components/TeacherManagement';
import { CrcProfileSettings } from './components/CrcProfileSettings';
import { AiOrderAssistant } from './components/AiOrderAssistant';
import { BiharEducationLogo } from './components/BiharEducationLogo';

export function App() {
  const [activeTab, setActiveTab] = useState<'create_order' | 'history' | 'teachers' | 'settings' | 'ai_assistant'>('create_order');
  
  // App Data State
  const [profile, setProfile] = useState<CrcProfile>(DEFAULT_CRC_PROFILE);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [schools, setSchools] = useState<ClusterSchool[]>([]);
  const [orders, setOrders] = useState<OfficeOrder[]>([]);
  
  // Active Editing Order
  const [editingOrder, setEditingOrder] = useState<OfficeOrder | null>(null);

  // Loading and Notification States
  const [isLoading, setIsLoading] = useState(true);
  const [dbConnected, setDbConnected] = useState(true);

  // Initial Load from Firestore
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [p, t, s, o] = await Promise.all([
        getCrcProfileFromDb(),
        getTeachersFromDb(),
        getSchoolsFromDb(),
        getOrdersFromDb()
      ]);
      setProfile(p);
      setTeachers(t);
      setSchools(s);
      setOrders(o);
      setDbConnected(true);
    } catch (err) {
      console.error('Error loading initial data from Firestore:', err);
      setDbConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Order Handlers
  const handleSaveOrder = async (orderData: Omit<OfficeOrder, 'id'>, existingId?: string) => {
    if (existingId) {
      await updateOrderInDb(existingId, orderData);
      setOrders(prev => prev.map(o => (o.id === existingId ? { ...orderData, id: existingId } : o)));
    } else {
      const newId = await saveOrderToDb(orderData);
      const newOrder = { ...orderData, id: newId };
      setOrders(prev => [newOrder, ...prev]);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    await deleteOrderFromDb(id);
    setOrders(prev => prev.filter(o => o.id !== id));
  };

  const handleDirectUpdateOrder = async (id: string, updated: Partial<OfficeOrder>) => {
    try {
      await updateOrderInDb(id, updated);
    } catch (err) {
      console.error('Error directly updating order:', err);
    }
    setOrders(prev => prev.map(o => (o.id === id ? { ...o, ...updated } : o)));
  };

  const handleEditOrder = (order: OfficeOrder) => {
    setEditingOrder(order);
    setActiveTab('create_order');
  };

  // Teacher Handlers
  const handleAddTeacher = async (tData: Omit<Teacher, 'id'>) => {
    const newId = await addTeacherToDb(tData);
    setTeachers(prev => [...prev, { ...tData, id: newId }]);
  };

  const handleUpdateTeacher = async (id: string, tData: Partial<Teacher>) => {
    await updateTeacherInDb(id, tData);
    setTeachers(prev => prev.map(t => (t.id === id ? { ...t, ...tData } : t)));
  };

  const handleDeleteTeacher = async (id: string) => {
    await deleteTeacherFromDb(id);
    setTeachers(prev => prev.filter(t => t.id !== id));
  };

  // School Handlers
  const handleAddSchool = async (sData: Omit<ClusterSchool, 'id'>) => {
    const newId = await addSchoolToDb(sData);
    setSchools(prev => [...prev, { ...sData, id: newId }]);
  };

  const handleDeleteSchool = async (id: string) => {
    await deleteSchoolFromDb(id);
    setSchools(prev => prev.filter(s => s.id !== id));
  };

  // Profile Settings
  const handleSaveProfile = async (updatedProfile: CrcProfile) => {
    await saveCrcProfileToDb(updatedProfile);
    setProfile(updatedProfile);
  };

  // AI Draft to Order
  const handleAiDraftGenerated = (draft: Partial<OfficeOrder>) => {
    setEditingOrder(draft as OfficeOrder);
    setActiveTab('create_order');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-['Mukta','Noto_Sans_Devanagari',sans-serif]">
      {/* Top Main Navigation Bar */}
      <header className="bg-slate-900 text-white sticky top-0 z-40 shadow-md print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Portal Identity */}
            <div className="flex items-center gap-3">
              <BiharEducationLogo size={42} customUrl={profile.logoUrl} />
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                  शिक्षा विभाग • बिहार सरकार
                </span>
                <h1 className="text-sm sm:text-base font-bold text-white tracking-tight leading-none">
                  {profile.clusterName || 'संकुल संसाधन केंद्र (CRC)'}
                </h1>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditingOrder(null);
                  setActiveTab('create_order');
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'create_order'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span className="hidden md:inline">आदेश जनरेटर</span>
                <span className="md:hidden">नया आदेश</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'history'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">जावक पंजी</span>
                {orders.length > 0 && (
                  <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-1.5 py-0.2 rounded-full">
                    {orders.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('teachers')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'teachers'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">शिक्षक / शालाएं</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ai_assistant')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'ai_assistant'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-purple-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span className="hidden md:inline">AI प्रारूपक</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
                title="CRC लेटरहेड एवं सेटिंग्स"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden lg:inline">सेटिंग्स</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content View Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-sm font-semibold">क्लाउड डेटाबेस (Firestore) से रिकॉर्ड लोड हो रहे हैं...</p>
          </div>
        ) : (
          <>
            {activeTab === 'create_order' && (
              <OrderGenerator
                profile={profile}
                teachers={teachers}
                schools={schools}
                savedOrders={orders}
                initialOrder={editingOrder}
                onSaveOrder={handleSaveOrder}
                onNavigateToHistory={() => setActiveTab('history')}
              />
            )}

            {activeTab === 'history' && (
              <OrderHistory
                orders={orders}
                profile={profile}
                onEditOrder={handleEditOrder}
                onDeleteOrder={handleDeleteOrder}
                onUpdateOrder={handleDirectUpdateOrder}
                onRefresh={loadAllData}
                isRefreshing={isLoading}
                onNavigateToCreate={() => {
                  setEditingOrder(null);
                  setActiveTab('create_order');
                }}
                onNavigateToAi={() => setActiveTab('ai_assistant')}
              />
            )}

            {activeTab === 'teachers' && (
              <TeacherManagement
                teachers={teachers}
                schools={schools}
                onAddTeacher={handleAddTeacher}
                onUpdateTeacher={handleUpdateTeacher}
                onDeleteTeacher={handleDeleteTeacher}
                onAddSchool={handleAddSchool}
                onDeleteSchool={handleDeleteSchool}
              />
            )}

            {activeTab === 'ai_assistant' && (
              <AiOrderAssistant
                profile={profile}
                teachers={teachers}
                onDraftGenerated={handleAiDraftGenerated}
              />
            )}

            {activeTab === 'settings' && (
              <CrcProfileSettings
                profile={profile}
                onSaveProfile={handleSaveProfile}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 संकुल संसाधन केंद्र (CRC) पोर्टल • शिक्षा विभाग, बिहार</p>
          <p className="flex items-center gap-1.5 font-medium text-slate-600">
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            क्लाउड डेटाबेस (Firestore) लाइव सिंक सक्रिय
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
