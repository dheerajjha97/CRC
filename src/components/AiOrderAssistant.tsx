import React, { useState } from 'react';
import { CrcProfile, OfficeOrder, Teacher } from '../types';
import { generateSmartOfficialDraft, GeneratedDraftResult } from '../utils/aiDraftEngine';
import { 
  Sparkles, 
  Send, 
  FileCheck, 
  ArrowRight, 
  Bot, 
  Lightbulb, 
  Clock, 
  CheckCircle2 
} from 'lucide-react';

interface AiOrderAssistantProps {
  profile: CrcProfile;
  teachers: Teacher[];
  onDraftGenerated: (draft: Partial<OfficeOrder>) => void;
}

export const AiOrderAssistant: React.FC<AiOrderAssistantProps> = ({
  profile,
  teachers,
  onDraftGenerated
}) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState<GeneratedDraftResult | null>(null);

  const samplePrompts = [
    'संकुल के सभी प्राथमिक शिक्षकों की मासिक समीक्षा बैठक हेतु आदेश बनाओ।',
    'कक्षा 5वीं और 8वीं की वार्षिक परीक्षा संचालन हेतु वीक्षक (Invigilator) प्रतिनियुक्ति आदेश।',
    'प्राथमिक शाला में शिक्षक कमी होने पर 2 शिक्षकों की अस्थायी प्रतिनियुक्ति आदेश।',
    'FLN (निपुण भारत) एवं चहक 3-दिवसीय गैर-आवासीय शिक्षक प्रशिक्षण आदेश।'
  ];

  const handleGenerate = (customPrompt?: string) => {
    const inputPrompt = customPrompt || prompt;
    if (!inputPrompt.trim()) return;

    setIsGenerating(true);
    setTimeout(() => {
      const result = generateSmartOfficialDraft(inputPrompt, profile.clusterName);
      setGeneratedDraft(result);
      setIsGenerating(false);
    }, 600);
  };

  const handleUseDraft = () => {
    if (!generatedDraft) return;

    onDraftGenerated({
      subject: generatedDraft.subject,
      reference: generatedDraft.reference,
      content: generatedDraft.content,
      orderType: generatedDraft.orderType,
      meetingDate: generatedDraft.meetingDate,
      meetingTime: generatedDraft.meetingTime,
      meetingVenue: generatedDraft.meetingVenue,
      copyTo: generatedDraft.copyTo,
      signatoryName: profile.defaultSignatory || profile.centerHead,
      signatoryDesignation: profile.defaultDesignation || profile.headDesignation
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* AI Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-950 text-white p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/10 backdrop-blur-xs rounded-xl">
            <Bot className="w-7 h-7 text-amber-300" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              शासकीय आदेश AI प्रारूपक (AI Order Drafter)
            </span>
            <h2 className="text-xl font-bold text-white">
              प्राकृतिक भाषा में आदेश लिखें, AI तुरंत शासकीय प्रारूप बनाएगा
            </h2>
            <p className="text-xs text-indigo-200 mt-1">
              केवल संक्षेप में अपनी आवश्यकता लिखें (जैसे: बैठक, परीक्षा ड्यूटी, प्रतिनियुक्ति) और पूरा शासकीय आदेश तैयार पाएं।
            </p>
          </div>
        </div>
      </div>

      {/* Input Box */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1.5">
            आप क्या आदेश जारी करना चाहते हैं? (विवरण लिखें)
          </label>
          <div className="relative">
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="उदा. आगामी 25 तारीख को सुबह 11 बजे संकुल के सभी शिक्षकों की मासिक समीक्षा बैठक आयोजित करनी है..."
              className="w-full p-3 pr-12 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            />
            <button
              type="button"
              onClick={() => handleGenerate()}
              disabled={isGenerating || !prompt.trim()}
              className="absolute right-2.5 bottom-3.5 bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-xl transition-all disabled:opacity-40 cursor-pointer shadow-xs"
              title="प्रारूप तैयार करें"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sample Prompt Chips */}
        <div>
          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 mb-2">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            त्वरित सुझाव (क्लिक करके प्रारूप बनाएं):
          </span>
          <div className="flex flex-wrap gap-2">
            {samplePrompts.map((sp, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setPrompt(sp);
                  handleGenerate(sp);
                }}
                className="text-[11px] bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-left font-medium"
              >
                {sp}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Generated Result Preview */}
      {generatedDraft && (
        <div className="bg-white p-6 rounded-2xl border-2 border-indigo-200 shadow-sm space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-sm">
                AI द्वारा तैयार किया गया शासकीय प्रारूप
              </h3>
            </div>

            <button
              type="button"
              onClick={handleUseDraft}
              className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <span>इस प्रारूप से आदेश बनाएं</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-800">
            <div>
              <span className="font-bold text-slate-900">विषय: </span>
              <span className="font-semibold underline decoration-slate-400">{generatedDraft.subject}</span>
            </div>

            {generatedDraft.reference && (
              <div>
                <span className="font-bold text-slate-900">प्रसंग: </span>
                <span className="text-slate-600">{generatedDraft.reference}</span>
              </div>
            )}

            <div className="pt-1">
              <span className="font-bold text-slate-900 block mb-1">आदेश विवरण:</span>
              <p className="whitespace-pre-line leading-relaxed text-justify bg-white p-3 rounded-lg border border-slate-200">
                {generatedDraft.content}
              </p>
            </div>

            {generatedDraft.meetingDate && (
              <div className="flex flex-wrap gap-4 bg-white p-2.5 rounded-lg border border-slate-200 text-[11.5px]">
                <span><strong>तिथि:</strong> {generatedDraft.meetingDate}</span>
                <span><strong>समय:</strong> {generatedDraft.meetingTime}</span>
                <span><strong>स्थान:</strong> {generatedDraft.meetingVenue}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
