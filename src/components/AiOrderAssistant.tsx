import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Teacher, OfficeOrder, CrcProfile, ClusterSchool, SelectedTeacherInOrder } from '../types';
import { generateSmartLocalDraft } from '../utils/aiDraftEngine';
import { generateNextOrderNumber, getHighestOrderSequence } from '../utils/orderNumberUtils';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  CheckCircle2, 
  ArrowRight, 
  Copy, 
  RefreshCw, 
  GraduationCap, 
  Calendar, 
  FileText, 
  School, 
  Check, 
  AlertCircle,
  Clock,
  MapPin,
  ChevronRight,
  HelpCircle,
  Lightbulb,
  ClipboardList,
  Save,
  BookOpen,
  Hash
} from 'lucide-react';

interface AiOrderAssistantProps {
  teachers: Teacher[];
  profile: CrcProfile;
  schools: ClusterSchool[];
  orders?: OfficeOrder[];
  onApplyDraftToOrder: (draft: Partial<OfficeOrder>) => void;
  onDirectSaveToHistory?: (draft: Partial<OfficeOrder>) => Promise<string>;
  onNavigateToHistory?: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  orderDraft?: {
    subject: string;
    reference?: string;
    orderType: 'meeting' | 'duty' | 'training' | 'general' | 'notice';
    content: string;
    includeDeputedSchool?: boolean;
    selectedTeachers: SelectedTeacherInOrder[];
    meetingDate?: string;
    meetingTime?: string;
    meetingVenue?: string;
  };
}

const QUICK_PROMPTS = [
  {
    title: '📝 बोर्ड परीक्षा वीक्षक ड्यूटी आदेश',
    desc: 'शिक्षकों की परीक्षा केंद्र पर वीक्षक/पर्यवेक्षक प्रतिनियुक्ति',
    prompt: 'कक्षा 5वीं एवं 8वीं वार्षिक बोर्ड परीक्षा हेतु संकुल के 4 शिक्षकों की वीक्षक ड्यूटी शासकीय उच्चतर माध्यमिक विद्यालय संकुल केंद्र में लगाने बाबत शुद्ध सरकारी आदेश तैयार करें।',
  },
  {
    title: '🏛️ संकुल मासिक समीक्षा बैठक सूचना',
    desc: 'समस्त प्रधान पाठकों की प्रगति समीक्षा बैठक',
    prompt: 'आगामी 28 तारीख को प्रातः 11:00 बजे संकुल सभागार में संकुल के समस्त प्राथमिक व पूर्व माध्यमिक शालाओं के प्रधान पाठकों की मासिक समीक्षा बैठक आयोजित करने हेतु अधिकृत आदेश जारी करें।',
  },
  {
    title: '📚 FLN निपुण भारत शिक्षक प्रशिक्षण',
    desc: '3 दिवसीय कार्यशाला में अनिवार्य उपस्थिति',
    prompt: 'निपुण भारत मिशन के अंतर्गत बुनियादी साक्षरता एवं संख्याज्ञान (FLN) 3 दिवसीय शिक्षक प्रशिक्षण कार्यशाला में संकुल के प्राथमिक शिक्षकों की अनिवार्य उपस्थिति बाबत आदेश तैयार करें।',
  },
  {
    title: '⚠️ शाला में अनधिकृत अनुपस्थिति पर नोटिस',
    desc: '3 दिवस के भीतर स्पष्टीकरण प्रस्तुत करने हेतु',
    prompt: 'आकस्मिक निरीक्षण के दौरान शाला में बिना पूर्व सूचना अनुपस्थित पाए गए शिक्षक के लिए 3 दिवस के भीतर समाधानकारक स्पष्टीकरण प्रस्तुत करने हेतु कारण बताओ नोटिस प्रारूप तैयार करें।',
  },
  {
    title: '🏆 संकुल स्तरीय खेलकूद समिति गठन',
    desc: 'वार्षिक खेलकूद एवं सांस्कृतिक महोत्सव आयोजन',
    prompt: 'संकुल स्तरीय वार्षिक खेलकूद एवं सांस्कृतिक प्रतियोगिता के सफल आयोजन हेतु शिक्षकों की विभिन्न उप-समितियों (मैदान व्यवस्था, अनुशासन, पुरस्कार वितरण) के दायित्व निर्धारण का आदेश तैयार करें।',
  }
];

export const AiOrderAssistant: React.FC<AiOrderAssistantProps> = ({
  teachers,
  profile,
  schools,
  orders = [],
  onApplyDraftToOrder,
  onDirectSaveToHistory,
  onNavigateToHistory,
}) => {
  const highestSavedSeq = useMemo(() => getHighestOrderSequence(orders), [orders]);
  const defaultNextOrderNum = useMemo(
    () => generateNextOrderNumber(orders, profile.letterPrefix),
    [orders, profile.letterPrefix]
  );
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'assistant',
      text: `नमस्ते! 🙏 मैं आपका **AI संकुल शासकीय आदेश सहायक** हूँ।\n\nआप अपनी आवश्यकता सामान्य बोलचाल की भाषा में बताएं—मैं उसे **शुद्ध, प्रामाणिक एवं मानक शासकीय कार्यालयीन हिंदी** (Official Government Language) में विषय, संदर्भ, निर्देश व शिक्षक तालिका सहित तैयार कर दूँगा।\n\nनीचे दिए गए त्वरित सुझावों में से चुनें या अपना आदेश सीधे टाइप करें:`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedDraftId, setCopiedDraftId] = useState<string | null>(null);
  const [appliedDraftId, setAppliedDraftId] = useState<string | null>(null);
  const [directSavedMap, setDirectSavedMap] = useState<Record<string, { savedId: string; orderNumber: string }>>({});
  const [isDirectSavingId, setIsDirectSavingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (promptToSend?: string) => {
    const messageText = (promptToSend || inputPrompt).trim();
    if (!messageText || isLoading) return;

    const userMessageId = Date.now().toString();
    const userMsg: ChatMessage = {
      id: userMessageId,
      sender: 'user',
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      let draftResult: any = null;

      try {
        const response = await fetch('/api/gemini/draft-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: messageText,
            conversationHistory: messages.map((m) => ({
              role: m.sender === 'user' ? 'user' : 'model',
              content: m.text,
            })),
            teachers,
            profile,
            schools,
          }),
        });

        if (response.ok) {
          draftResult = await response.json();
        }
      } catch (networkErr) {
        console.warn('Backend API unavailable, using built-in Smart Drafting Engine:', networkErr);
      }

      // If backend was unavailable or returned empty/error, use smart local engine
      if (!draftResult || !draftResult.orderDraft) {
        draftResult = generateSmartLocalDraft(messageText, teachers, profile, schools);
      }
      
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: draftResult.assistantReply || 'कार्यालयीन आदेश का शासकीय प्रारूप तैयार कर दिया गया है:',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        orderDraft: draftResult.orderDraft,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Error drafting order:', err);
      // Fallback guarantees resolution
      const fallbackResult = generateSmartLocalDraft(messageText, teachers, profile, schools);
      const fallbackMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: fallbackResult.assistantReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        orderDraft: fallbackResult.orderDraft,
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyDraft = (msgId: string, draft: ChatMessage['orderDraft']) => {
    if (!draft) return;
    const textToCopy = `विषय: ${draft.subject}\nसंदर्भ: ${draft.reference || 'कार्यालयीन'}\n\nआदेश विवरण:\n${draft.content}\n\nआदेशित शिक्षक:\n${draft.selectedTeachers?.map((t, idx) => `${idx + 1}. ${t.name} (${t.designation}, ${t.schoolName})${t.deputedSchool ? ` -> प्रतिनियुक्त: ${t.deputedSchool}` : ''} [दायित्व: ${t.assignedDutyRole || '-'}]`).join('\n')}`;
    
    navigator.clipboard.writeText(textToCopy);
    setCopiedDraftId(msgId);
    setTimeout(() => setCopiedDraftId(null), 2500);
  };

  const handleApplyToForm = (msgId: string, draft: ChatMessage['orderDraft']) => {
    if (!draft) return;
    setAppliedDraftId(msgId);

    // Map AI selected teachers with existing IDs in state if matched
    const matchedTeachers: SelectedTeacherInOrder[] = (draft.selectedTeachers || []).map((st) => {
      const existing = teachers.find(
        (t) => t.name.trim().toLowerCase() === st.name.trim().toLowerCase() ||
               (t.name.includes(st.name) || st.name.includes(t.name))
      );

      return {
        id: existing?.id || st.id || `teacher-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: existing?.name || st.name,
        designation: existing?.designation || st.designation,
        schoolName: existing?.schoolName || st.schoolName,
        deputedSchool: st.deputedSchool,
        assignedDutyRole: st.assignedDutyRole || 'उपस्थिति / दायित्व निर्वहन',
      };
    });

    onApplyDraftToOrder({
      subject: draft.subject,
      reference: draft.reference,
      orderType: draft.orderType,
      content: draft.content,
      includeDeputedSchool: draft.includeDeputedSchool,
      selectedTeachers: matchedTeachers,
      meetingDate: draft.meetingDate,
      meetingTime: draft.meetingTime,
      meetingVenue: draft.meetingVenue,
    });
  };

  const handleDirectSave = async (msgId: string, draft?: ChatMessage['orderDraft']) => {
    if (!draft || !onDirectSaveToHistory) return;
    setIsDirectSavingId(msgId);
    try {
      // Map matched teachers
      const matchedTeachers: SelectedTeacherInOrder[] = (draft.selectedTeachers || []).map((st) => {
        const existing = teachers.find(
          (t) => t.name.trim().toLowerCase() === st.name.trim().toLowerCase() ||
                 (t.name.includes(st.name) || st.name.includes(t.name))
        );

        return {
          id: existing?.id || st.id || `teacher-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          name: existing?.name || st.name,
          designation: existing?.designation || st.designation,
          schoolName: existing?.schoolName || st.schoolName,
          deputedSchool: st.deputedSchool,
          assignedDutyRole: st.assignedDutyRole || 'उपस्थिति / दायित्व निर्वहन',
        };
      });

      const savedId = await onDirectSaveToHistory({
        subject: draft.subject,
        reference: draft.reference,
        orderType: draft.orderType,
        content: draft.content,
        includeDeputedSchool: draft.includeDeputedSchool,
        selectedTeachers: matchedTeachers,
        meetingDate: draft.meetingDate,
        meetingTime: draft.meetingTime,
        meetingVenue: draft.meetingVenue,
      });

      setDirectSavedMap(prev => ({
        ...prev,
        [msgId]: { savedId, orderNumber: 'जावक पंजी में सुरक्षित' }
      }));
    } catch (err) {
      console.error(err);
      alert('जावक पंजी में सेव करने में त्रुटि हुई।');
    } finally {
      setIsDirectSavingId(null);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] min-h-[580px] max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 bg-gradient-to-r from-indigo-700 via-indigo-800 to-indigo-900 text-white flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
            <Sparkles className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold tracking-tight">AI शासकीय आदेश सहायक</h2>
              <span className="bg-amber-400/20 text-amber-200 border border-amber-300/30 text-[10px] px-2 py-0.5 rounded-full font-bold">
                शुद्ध हिंदी प्रारूप
              </span>
            </div>
            <p className="text-xs text-indigo-200">
              अपनी जरूरत बताइए, AI आपके लिए मानक सरकारी शब्दावली में आदेश तैयार कर देगा
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setMessages([
              {
                id: 'welcome-reset',
                sender: 'assistant',
                text: 'चैट रीसेट हो गई है। आप जिस भी विषय पर सरकारी आदेश या पत्र चाहते हैं, यहाँ लिखें:',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              }
            ]);
          }}
          className="text-xs text-indigo-200 hover:text-white hover:bg-white/10 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
          title="नई बातचीत शुरू करें"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>नई चैट</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.sender === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[90%] sm:max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed shadow-xs ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-xs'
                  : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
              }`}
            >
              {/* Text Body */}
              <div className="whitespace-pre-line">
                {msg.text}
              </div>

              {/* Order Draft Card (If present in Assistant Response) */}
              {msg.orderDraft && (
                <div className="mt-3.5 pt-3.5 border-t border-slate-200 bg-slate-50/80 rounded-xl p-3.5 border text-xs text-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-950 flex items-center gap-1.5 text-xs">
                      <FileText className="w-3.5 h-3.5 text-indigo-600" />
                      तैयार शासकीय प्रारूप
                    </span>
                    <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded">
                      {msg.orderDraft.orderType === 'duty' && 'विशेष दायित्व / परीक्षा'}
                      {msg.orderDraft.orderType === 'meeting' && 'बैठक सूचना'}
                      {msg.orderDraft.orderType === 'training' && 'प्रशिक्षण उपस्थिति'}
                      {msg.orderDraft.orderType === 'notice' && 'कारण बताओ नोटिस'}
                      {msg.orderDraft.orderType === 'general' && 'सामान्य आदेश'}
                    </span>
                  </div>

                  {/* Subject */}
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-700 block text-[11px]">विषय :</span>
                    <p className="font-semibold text-slate-900 mt-0.5">{msg.orderDraft.subject}</p>
                  </div>

                  {/* Reference */}
                  {msg.orderDraft.reference && (
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="font-bold text-slate-700 block text-[11px]">संदर्भ :</span>
                      <p className="text-slate-800 mt-0.5 italic">{msg.orderDraft.reference}</p>
                    </div>
                  )}

                  {/* Content snippet */}
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-700 block text-[11px] mb-1">आदेश विवरण :</span>
                    <p className="text-slate-800 whitespace-pre-line leading-relaxed text-xs">
                      {msg.orderDraft.content}
                    </p>
                  </div>

                  {/* Teachers Table preview */}
                  {msg.orderDraft.selectedTeachers && msg.orderDraft.selectedTeachers.length > 0 && (
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="font-bold text-slate-700 block text-[11px] mb-1.5">
                        आदेशित शिक्षक ({msg.orderDraft.selectedTeachers.length}) :
                      </span>
                      <div className="space-y-1">
                        {msg.orderDraft.selectedTeachers.map((t, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between text-[11px] bg-slate-50 p-1.5 rounded border border-slate-200/70"
                          >
                            <div>
                              <span className="font-bold text-slate-900">{i + 1}. {t.name}</span>
                              <span className="text-slate-500 ml-1">({t.designation}, {t.schoolName})</span>
                            </div>
                            <div className="text-right">
                              {t.deputedSchool && (
                                <span className="text-indigo-700 font-bold block">
                                  → {t.deputedSchool}
                                </span>
                              )}
                              <span className="text-slate-600 font-medium text-[10px]">
                                {t.assignedDutyRole || 'दायित्व'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Saved Status Banner if saved directly */}
                  {directSavedMap[msg.id] && (
                    <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between gap-2 text-emerald-900 text-xs">
                      <div className="flex items-center gap-1.5 font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>आदेश पत्र जावक पंजी (Dispatch Register) में सुरक्षित हो गया है!</span>
                      </div>
                      {onNavigateToHistory && (
                        <button
                          type="button"
                          onClick={onNavigateToHistory}
                          className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-[11px] font-bold flex items-center gap-1 cursor-pointer shrink-0 transition-colors shadow-xs"
                        >
                          <BookOpen className="w-3 h-3" />
                          <span>जावक पंजी देखें</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleCopyDraft(msg.id, msg.orderDraft)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      {copiedDraftId === msg.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">कॉपी हो गया!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>टेक्स्ट कॉपी करें</span>
                        </>
                      )}
                    </button>

                    {onDirectSaveToHistory && (
                      <button
                        type="button"
                        disabled={isDirectSavingId === msg.id || Boolean(directSavedMap[msg.id])}
                        onClick={() => handleDirectSave(msg.id, msg.orderDraft)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors ${
                          directSavedMap[msg.id]
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        {isDirectSavingId === msg.id ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>सेव हो रहा है...</span>
                          </>
                        ) : directSavedMap[msg.id] ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-700" />
                            <span>जावक पंजी में दर्ज ✓</span>
                          </>
                        ) : (
                          <>
                            <ClipboardList className="w-3.5 h-3.5" />
                            <span>जावक पंजी में सेव करें</span>
                          </>
                        )}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleApplyToForm(msg.id, msg.orderDraft)}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                    >
                      {appliedDraftId === msg.id ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                          <span>फॉर्म में लोड हो गया!</span>
                        </>
                      ) : (
                        <>
                          <span>फॉर्म में खोलें व प्रिंट करें</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Timestamp */}
              <div
                className={`text-[10px] mt-1 text-right ${
                  msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'
                }`}
              >
                {msg.timestamp}
              </div>
            </div>

            {msg.sender === 'user' && (
              <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {/* Loading Bubble */}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-xs p-3.5 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-900">
                <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <span>शुद्ध शासकीय प्रारूप में आदेश तैयार किया जा रहा है...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-4 py-2.5 bg-slate-100 border-t border-slate-200 overflow-x-auto">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold mb-1.5">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
          <span>त्वरित शासकीय आदेश सुझाव (Quick Prompts):</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {QUICK_PROMPTS.map((qp, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(qp.prompt)}
              className="px-3 py-1.5 bg-white hover:bg-indigo-50 hover:border-indigo-300 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium whitespace-nowrap transition-all shadow-2xs hover:shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <span>{qp.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
      >
        <textarea
          id="ai-order-input"
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder="उदा. 'आगामी 26 मार्च को 5 शिक्षकों की परीक्षा ड्यूटी शा.उ.मा.वि. संकुल में लगाने बाबत आदेश बनाओ...'"
          rows={2}
          className="flex-1 px-3.5 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />

        <button
          id="ai-send-btn"
          type="submit"
          disabled={!inputPrompt.trim() || isLoading}
          className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">आदेश बनाएं</span>
        </button>
      </form>
    </div>
  );
};
