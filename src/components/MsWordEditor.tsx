import React, { useState, useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Indent as IndentIcon,
  Outdent as OutdentIcon,
  Highlighter,
  Palette,
  Table as TableIcon,
  Undo,
  Redo,
  Copy,
  Scissors,
  Maximize2,
  Minimize2,
  Sparkles,
  BookOpen,
  FileText,
  Calendar,
  Code,
  Eye,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  HelpCircle,
  CheckCircle2,
  RotateCcw,
  Heading1,
  Heading2,
  Quote,
  CheckSquare
} from 'lucide-react';

interface MsWordEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  minHeight?: string;
  label?: string;
  showGovtHelpers?: boolean;
}

const HINDI_PHRASES = [
  {
    title: 'प्रासंगिक पत्र का संदर्भ (Reference Opening)',
    text: 'उपर्युक्त विषयक प्रासंगिक पत्र के आलोक में सूचित करना है कि '
  },
  {
    title: 'सख्त निर्देश (Strict Compliance)',
    text: 'अतः सर्वसंबंधित को निर्देशित किया जाता है कि उक्त आदेश का अक्षरशः एवं समयबद्ध अनुपालन सुनिश्चित करें।'
  },
  {
    title: 'सर्वोच्च प्राथमिकता (Top Priority)',
    text: 'इसे सर्वोच्च प्राथमिकता दी जाए। किसी भी स्तर पर शिथिलता या लापरवाही क्षम्य नहीं होगी।'
  },
  {
    title: 'कार्रवाई की चेतावनी (Disciplinary Action Warning)',
    text: 'समीक्षा के क्रम में कार्य में शिथिलता अथवा अनुपस्थिति पाए जाने पर संबंधित के विरुद्ध नियमानुसार अनुशासनात्मक कार्रवाई की जाएगी।'
  },
  {
    title: 'तत्काल प्रभाव (Immediate Effect)',
    text: 'यह कार्यालयीन आदेश तत्काल प्रभाव से लागू माना जाएगा।'
  },
  {
    title: 'सक्षम अनुमोदन (Authority Approval)',
    text: 'सक्षम प्राधिकार के अनुमोदनोपरांत यह आदेश निर्गत किया जाता है।'
  },
  {
    title: 'प्रतिवेदन प्रेषण (Report Submission)',
    text: 'संबंधित विद्यालय प्रधान/शिक्षक कार्य पूर्ण कर दैनिक प्रतिवेदन अधोहस्ताक्षरी कार्यालय में समर्पित करेंगे।'
  }
];

const FONT_FAMILIES = [
  { label: 'मुक्ता (Mukta - आधुनिक मानक)', value: "'Mukta', sans-serif" },
  { label: 'देवनागरी (Noto Sans)', value: "'Noto Sans Devanagari', sans-serif" },
  { label: 'पारंपरिक (Noto Serif)', value: "'Noto Serif Devanagari', serif" },
  { label: 'शासकीय फॉन्ट (Georgia/Serif)', value: "Georgia, 'Times New Roman', serif" },
  { label: 'सिस्टम डिफॉल्ट (Standard Sans)', value: "system-ui, -apple-system, sans-serif" }
];

const FONT_SIZES = [
  { label: '11pt (छोटा)', value: '14px' },
  { label: '12pt (सामान्य पत्र)', value: '16px' },
  { label: '14pt (मध्यम)', value: '18px' },
  { label: '16pt (उप-शीर्षक)', value: '21px' },
  { label: '18pt (मुख्य शीर्षक)', value: '24px' },
  { label: '20pt (बड़ा शीर्षक)', value: '27px' }
];

const TEXT_COLORS = [
  { label: 'गहरा काला (Black)', value: '#0f172a' },
  { label: 'गहरा नीला (Navy Blue)', value: '#1e3a8a' },
  { label: 'शासकीय मैरून (Maroon)', value: '#881337' },
  { label: 'गहरा हरा (Forest Green)', value: '#14532d' },
  { label: 'गहरा स्लेटी (Slate Grey)', value: '#334155' },
  { label: 'गहरा लाल (Alert Red)', value: '#b91c1c' }
];

const HIGHLIGHT_COLORS = [
  { label: 'कोई नहीं (None)', value: 'transparent' },
  { label: 'पीला (Yellow)', value: '#fef08a' },
  { label: 'हल्का हरा (Light Green)', value: '#bbf7d0' },
  { label: 'हल्का नीला (Light Cyan)', value: '#bae6fd' },
  { label: 'हल्का गुलाबी (Light Pink)', value: '#fbcfe8' }
];

export const MsWordEditor: React.FC<MsWordEditorProps> = ({
  value,
  onChange,
  placeholder = 'यहाँ शासकीय विवरण MS Word की तरह टाइप करें...',
  minHeight = '280px',
  label = 'MS Word शैली मुख्य विवरण संपादक (Rich Text Editor)',
  showGovtHelpers = true
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'insert' | 'hindi' | 'view'>('home');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSourceMode, setIsSourceMode] = useState(false);
  const [sourceCode, setSourceCode] = useState(value);
  const [currentFont, setCurrentFont] = useState("'Mukta', sans-serif");
  const [currentFontSize, setCurrentFontSize] = useState('16px');
  const [lineHeight, setLineHeight] = useState('1.75');
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);

  // Sync incoming value to editor innerHTML safely when not typing
  useEffect(() => {
    if (editorRef.current && !isSourceMode) {
      const isHtml = /<[a-z][\s\S]*>/i.test(value);
      const formatted = isHtml ? value : value.replace(/\n/g, '<br/>');
      if (editorRef.current.innerHTML !== formatted) {
        editorRef.current.innerHTML = formatted || '';
      }
    }
    setSourceCode(value);
    calculateCounts(value);
  }, [value, isSourceMode]);

  const calculateCounts = (text: string) => {
    const cleanText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!cleanText) {
      setWordCount(0);
      setCharCount(0);
      return;
    }
    const words = cleanText.split(/\s+/).filter(Boolean);
    setWordCount(words.length);
    setCharCount(cleanText.length);
  };

  const executeCommand = (command: string, value: string | undefined = undefined) => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(command, false, value);
    handleEditorInput();
  };

  const handleEditorInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      onChange(html);
      setSourceCode(html);
      calculateCounts(html);
    }
  };

  const handleApplyHeading = (tag: 'h1' | 'h2' | 'p' | 'callout' | 'quote') => {
    if (tag === 'callout') {
      const calloutHtml = `
        <div style="background-color: #f8fafc; border-left: 4px solid #4f46e5; padding: 10px 14px; margin: 12px 0; border-radius: 4px; font-weight: 500; color: #1e293b;">
          <strong>📌 महत्वपूर्ण निर्देश / ध्यातव्य:</strong> <span>यहाँ निर्देश दर्ज करें...</span>
        </div><p><br/></p>
      `;
      executeCommand('insertHTML', calloutHtml);
    } else if (tag === 'quote') {
      const quoteHtml = `
        <div style="background-color: #f1f5f9; border-left: 4px solid #64748b; padding: 8px 12px; margin: 10px 0; font-style: italic; color: #334155;">
          <span>"उक्त संदर्भित पत्र में दिए गए निर्देशों के अनुसार..."</span>
        </div><p><br/></p>
      `;
      executeCommand('insertHTML', quoteHtml);
    } else if (tag === 'h1') {
      executeCommand('formatBlock', '<h2>'); // h2 in rich text for neat header
    } else if (tag === 'h2') {
      executeCommand('formatBlock', '<h3>');
    } else {
      executeCommand('formatBlock', '<p>');
    }
  };

  const handleInsertPhrase = (phraseText: string) => {
    executeCommand('insertHTML', `<span>${phraseText}</span> `);
  };

  const handleInsertTable = (rows: number = 3, cols: number = 3) => {
    let tableHtml = '<table style="width: 100%; border-collapse: collapse; border: 1.5px solid #334155; margin: 12px 0; font-size: 13px;"><thead><tr style="background-color: #f1f5f9; font-weight: bold;">';
    for (let c = 1; c <= cols; c++) {
      tableHtml += `<th style="border: 1px solid #334155; padding: 6px 8px; text-align: left;">शीर्षक ${c}</th>`;
    }
    tableHtml += '</tr></thead><tbody>';
    for (let r = 1; r <= rows; r++) {
      tableHtml += '<tr>';
      for (let c = 1; c <= cols; c++) {
        tableHtml += `<td style="border: 1px solid #334155; padding: 6px 8px;">विवरण ${r}.${c}</td>`;
      }
      tableHtml += '</tr>';
    }
    tableHtml += '</tbody></table><p><br/></p>';
    executeCommand('insertHTML', tableHtml);
  };

  const handleInsertDateStamp = () => {
    const today = new Date().toLocaleDateString('hi-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    executeCommand('insertHTML', `<strong>दिनांक: ${today}</strong> `);
  };

  const handleInsertSignatoryBox = () => {
    const sigHtml = `
      <div style="margin-top: 24px; text-align: right; display: flex; justify-content: flex-end;">
        <div style="display: inline-block; text-align: right; min-width: 180px;">
          <p style="margin: 0; font-weight: bold; font-size: 13px;">(हस्ताक्षर एवं मुहर)</p>
          <p style="margin: 0; font-size: 12px; color: #1e293b;">संकुल समन्वयक / प्राचार्य</p>
          <p style="margin: 0; font-size: 11px; color: #475569;">संकुल संसाधन केंद्र</p>
        </div>
      </div><p><br/></p>
    `;
    executeCommand('insertHTML', sigHtml);
  };

  const handleInsertBulletListTemplate = () => {
    const bulletHtml = `
      <ul style="list-style-type: disc; padding-left: 28px; margin: 10px 0;">
        <li>बिंदु संख्या 1 यहाँ दर्ज करें</li>
        <li>बिंदु संख्या 2 यहाँ दर्ज करें</li>
        <li>बिंदु संख्या 3 यहाँ दर्ज करें</li>
      </ul><p><br/></p>
    `;
    executeCommand('insertHTML', bulletHtml);
  };

  const handleInsertNumberedListTemplate = () => {
    const numHtml = `
      <ol style="list-style-type: decimal; padding-left: 28px; margin: 10px 0;">
        <li>प्रथम निर्देश यहाँ दर्ज करें</li>
        <li>द्वितीय निर्देश यहाँ दर्ज करें</li>
        <li>तृतीय निर्देश यहाँ दर्ज करें</li>
      </ol><p><br/></p>
    `;
    executeCommand('insertHTML', numHtml);
  };

  const handleInsertDevanagariListTemplate = () => {
    const devHtml = `
      <ul style="list-style-type: none; padding-left: 8px; margin: 10px 0;">
        <li style="margin-bottom: 6px;"><strong>(क)</strong> प्रथम शासकीय बिंदु यहाँ दर्ज करें</li>
        <li style="margin-bottom: 6px;"><strong>(ख)</strong> द्वितीय शासकीय बिंदु यहाँ दर्ज करें</li>
        <li style="margin-bottom: 6px;"><strong>(ग)</strong> तृतीय शासकीय बिंदु यहाँ दर्ज करें</li>
      </ul><p><br/></p>
    `;
    executeCommand('insertHTML', devHtml);
  };

  const handleInsertDivider = () => {
    executeCommand('insertHTML', '<hr style="border: 0; border-top: 1.5px solid #94a3b8; margin: 16px 0;" /><p><br/></p>');
  };

  const handleToggleSourceMode = () => {
    if (isSourceMode) {
      onChange(sourceCode);
      if (editorRef.current) {
        editorRef.current.innerHTML = sourceCode;
      }
    } else {
      if (editorRef.current) {
        setSourceCode(editorRef.current.innerHTML);
      }
    }
    setIsSourceMode(!isSourceMode);
  };

  return (
    <div
      className={`bg-white border border-slate-300 rounded-2xl shadow-xs transition-all flex flex-col ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen bg-slate-900/40 p-4 backdrop-blur-xs flex items-center justify-center' : 'w-full'
      }`}
    >
      <div
        className={`bg-white border border-slate-300 rounded-2xl overflow-hidden flex flex-col shadow-md w-full ${
          isFullscreen ? 'max-w-5xl h-[92vh]' : ''
        }`}
      >
        {/* Top Word Ribbon Title Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white px-4 py-2 flex items-center justify-between border-b border-indigo-950">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg shadow-inner text-white font-bold text-xs flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              <span>MS Word</span>
            </div>
            <div>
              <span className="text-xs font-bold tracking-wide text-blue-100">{label}</span>
              <span className="text-[10px] text-blue-300 ml-2 hidden sm:inline">
                (वर्ड स्टाइल शासकीय लेटर एडिटर)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={handleToggleSourceMode}
              className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 text-[11px] transition-all cursor-pointer ${
                isSourceMode ? 'bg-amber-500 text-slate-950' : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200'
              }`}
              title="HTML कोड और वर्ड दृश्य के बीच बदलें"
            >
              {isSourceMode ? <Eye className="w-3 h-3" /> : <Code className="w-3 h-3" />}
              <span>{isSourceMode ? 'वर्ड व्यू (Word View)' : 'स्रोत कोड (Code)'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-lg cursor-pointer transition-all"
              title={isFullscreen ? 'पूर्ण स्क्रीन से बाहर निकलें' : 'पूर्ण स्क्रीन मोड (Fullscreen Word Mode)'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Word Ribbon Tabs Bar */}
        <div className="bg-slate-100 border-b border-slate-200 px-3 pt-1 flex items-center gap-1 text-xs select-none">
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            className={`px-3 py-1.5 font-bold rounded-t-lg transition-all cursor-pointer text-xs ${
              activeTab === 'home'
                ? 'bg-white text-indigo-700 border-t-2 border-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            🏠 होम (Home)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('insert')}
            className={`px-3 py-1.5 font-bold rounded-t-lg transition-all cursor-pointer text-xs ${
              activeTab === 'insert'
                ? 'bg-white text-indigo-700 border-t-2 border-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            ➕ इन्सर्ट (Insert)
          </button>

          {showGovtHelpers && (
            <button
              type="button"
              onClick={() => setActiveTab('hindi')}
              className={`px-3 py-1.5 font-bold rounded-t-lg transition-all cursor-pointer text-xs flex items-center gap-1 ${
                activeTab === 'hindi'
                  ? 'bg-white text-indigo-700 border-t-2 border-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>राजभाषा सहायक (Hindi Tools)</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('view')}
            className={`px-3 py-1.5 font-bold rounded-t-lg transition-all cursor-pointer text-xs ${
              activeTab === 'view'
                ? 'bg-white text-indigo-700 border-t-2 border-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            📐 पेज व्यू (View)
          </button>
        </div>

        {/* Word Ribbon Toolbar Controls (Tab-Specific) */}
        {!isSourceMode && (
          <div className="bg-slate-50 border-b border-slate-200 p-2 text-xs flex flex-wrap items-center gap-2 select-none shadow-inner">
            {/* TAB 1: HOME */}
            {activeTab === 'home' && (
              <>
                {/* Undo / Redo */}
                <div className="flex items-center gap-0.5 border-r border-slate-300 pr-2">
                  <button
                    type="button"
                    onClick={() => executeCommand('undo')}
                    className="p-1.5 text-slate-700 hover:bg-white hover:text-indigo-700 rounded-md cursor-pointer border border-transparent hover:border-slate-200 transition-colors"
                    title="पूर्ववत करें (Ctrl+Z)"
                  >
                    <Undo className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => executeCommand('redo')}
                    className="p-1.5 text-slate-700 hover:bg-white hover:text-indigo-700 rounded-md cursor-pointer border border-transparent hover:border-slate-200 transition-colors"
                    title="पुनः करें (Ctrl+Y)"
                  >
                    <Redo className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Font Selector & Size */}
                <div className="flex items-center gap-1.5 border-r border-slate-300 pr-2">
                  <select
                    value={currentFont}
                    onChange={(e) => {
                      setCurrentFont(e.target.value);
                      executeCommand('fontName', e.target.value);
                    }}
                    className="px-2 py-1 border border-slate-300 bg-white rounded-md text-xs font-semibold text-slate-800 cursor-pointer max-w-[140px]"
                    title="फ़ॉन्ट शैली चुनें"
                  >
                    {FONT_FAMILIES.map((f, idx) => (
                      <option key={idx} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={currentFontSize}
                    onChange={(e) => {
                      setCurrentFontSize(e.target.value);
                      if (editorRef.current) {
                        editorRef.current.style.fontSize = e.target.value;
                      }
                      executeCommand('fontSize', '3'); // standard base
                    }}
                    className="px-2 py-1 border border-slate-300 bg-white rounded-md text-xs font-semibold text-slate-800 cursor-pointer w-[80px]"
                    title="फ़ॉन्ट आकार"
                  >
                    {FONT_SIZES.map((s, idx) => (
                      <option key={idx} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Text Formatting Buttons (B, I, U, S) */}
                <div className="flex items-center gap-0.5 border-r border-slate-300 pr-2">
                  <button
                    type="button"
                    onClick={() => executeCommand('bold')}
                    className="p-1.5 font-bold text-slate-800 hover:bg-white hover:text-indigo-700 rounded-md cursor-pointer border border-transparent hover:border-slate-200"
                    title="बोल्ड / गाढ़ा (Ctrl+B)"
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => executeCommand('italic')}
                    className="p-1.5 italic text-slate-800 hover:bg-white hover:text-indigo-700 rounded-md cursor-pointer border border-transparent hover:border-slate-200"
                    title="इटैलिक / तिरछा (Ctrl+I)"
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => executeCommand('underline')}
                    className="p-1.5 underline text-slate-800 hover:bg-white hover:text-indigo-700 rounded-md cursor-pointer border border-transparent hover:border-slate-200"
                    title="अंडरलाइन / रेखांकित (Ctrl+U)"
                  >
                    <Underline className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => executeCommand('strikeThrough')}
                    className="p-1.5 line-through text-slate-800 hover:bg-white hover:text-indigo-700 rounded-md cursor-pointer border border-transparent hover:border-slate-200"
                    title="स्ट्राइकथ्रू (Strikethrough)"
                  >
                    <Strikethrough className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => executeCommand('subscript')}
                    className="p-1.5 text-slate-800 hover:bg-white hover:text-indigo-700 rounded-md cursor-pointer border border-transparent hover:border-slate-200"
                    title="सबस्क्रिप्ट (Subscript X₂)"
                  >
                    <SubscriptIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => executeCommand('superscript')}
                    className="p-1.5 text-slate-800 hover:bg-white hover:text-indigo-700 rounded-md cursor-pointer border border-transparent hover:border-slate-200"
                    title="सुपरस्क्रिप्ट (Superscript X²)"
                  >
                    <SuperscriptIcon className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Color and Highlight Pickers */}
                <div className="flex items-center gap-1 border-r border-slate-300 pr-2 relative">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setShowColorPicker(!showColorPicker);
                        setShowHighlightPicker(false);
                      }}
                      className="p-1.5 text-slate-800 hover:bg-white hover:text-indigo-700 rounded-md cursor-pointer border border-transparent hover:border-slate-200 flex items-center gap-1"
                      title="टेक्स्ट रंग (Font Color)"
                    >
                      <Palette className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="text-[10px] font-bold">रंग</span>
                    </button>

                    {showColorPicker && (
                      <div className="absolute top-full left-0 mt-1 bg-white border border-slate-300 rounded-xl shadow-lg p-2 z-30 w-44 space-y-1">
                        <div className="text-[10px] font-bold text-slate-500 mb-1">टेक्स्ट रंग चुनें:</div>
                        {TEXT_COLORS.map((c, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              executeCommand('foreColor', c.value);
                              setShowColorPicker(false);
                            }}
                            className="w-full flex items-center gap-2 px-2 py-1 rounded text-left text-xs hover:bg-slate-100 cursor-pointer"
                          >
                            <span className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" style={{ backgroundColor: c.value }} />
                            <span className="truncate">{c.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setShowHighlightPicker(!showHighlightPicker);
                        setShowColorPicker(false);
                      }}
                      className="p-1.5 text-slate-800 hover:bg-white hover:text-amber-700 rounded-md cursor-pointer border border-transparent hover:border-slate-200 flex items-center gap-1"
                      title="टेक्स्ट हाइलाइट (Highlight Color)"
                    >
                      <Highlighter className="w-3.5 h-3.5 text-amber-600" />
                      <span className="text-[10px] font-bold">हाइलाइट</span>
                    </button>

                    {showHighlightPicker && (
                      <div className="absolute top-full left-0 mt-1 bg-white border border-slate-300 rounded-xl shadow-lg p-2 z-30 w-44 space-y-1">
                        <div className="text-[10px] font-bold text-slate-500 mb-1">हाइलाइट रंग चुनें:</div>
                        {HIGHLIGHT_COLORS.map((c, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              executeCommand('hiliteColor', c.value);
                              setShowHighlightPicker(false);
                            }}
                            className="w-full flex items-center gap-2 px-2 py-1 rounded text-left text-xs hover:bg-slate-100 cursor-pointer"
                          >
                            <span className="w-3.5 h-3.5 rounded border border-slate-300 shrink-0" style={{ backgroundColor: c.value === 'transparent' ? '#ffffff' : c.value }} />
                            <span className="truncate">{c.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Alignments (Left, Center, Right, Justify) */}
                <div className="flex items-center gap-0.5 border-r border-slate-300 pr-2">
                  <button
                    type="button"
                    onClick={() => executeCommand('justifyLeft')}
                    className="p-1.5 text-slate-800 hover:bg-white hover:text-indigo-700 rounded-md cursor-pointer border border-transparent hover:border-slate-200"
                    title="बायां संरेखण (Align Left - Ctrl+L)"
                  >
                    <AlignLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => executeCommand('justifyCenter')}
                    className="p-1.5 text-slate-800 hover:bg-white hover:text-indigo-700 rounded-md cursor-pointer border border-transparent hover:border-slate-200"
                    title="मध्य संरेखण (Align Center - Ctrl+E)"
                  >
                    <AlignCenter className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => executeCommand('justifyRight')}
                    className="p-1.5 text-slate-800 hover:bg-white hover:text-indigo-700 rounded-md cursor-pointer border border-transparent hover:border-slate-200"
                    title="दायां संरेखण (Align Right - Ctrl+R)"
                  >
                    <AlignRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => executeCommand('justifyFull')}
                    className="p-1.5 bg-indigo-50 text-indigo-700 font-bold rounded-md cursor-pointer border border-indigo-200"
                    title="दोनों तरफ बराबर (Justify - शासकीय आदेशों हेतु अनिवार्य)"
                  >
                    <AlignJustify className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Lists & Indent */}
                <div className="flex items-center gap-0.5 border-r border-slate-300 pr-2">
                  <button
                    type="button"
                    onClick={() => executeCommand('insertUnorderedList')}
                    className="p-1.5 text-slate-800 hover:bg-white hover:text-indigo-700 rounded-md cursor-pointer border border-transparent hover:border-slate-200"
                    title="बुलेट सूची (Bullet List •)"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => executeCommand('insertOrderedList')}
                    className="p-1.5 text-slate-800 hover:bg-white hover:text-indigo-700 rounded-md cursor-pointer border border-transparent hover:border-slate-200"
                    title="संख्या सूची (Numbered List 1, 2, 3)"
                  >
                    <ListOrdered className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => executeCommand('outdent')}
                    className="p-1.5 text-slate-800 hover:bg-white hover:text-indigo-700 rounded-md cursor-pointer border border-transparent hover:border-slate-200"
                    title="इंडेंट घटाएं (Decrease Indent)"
                  >
                    <OutdentIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => executeCommand('indent')}
                    className="p-1.5 text-slate-800 hover:bg-white hover:text-indigo-700 rounded-md cursor-pointer border border-transparent hover:border-slate-200"
                    title="इंडेंट बढ़ाएं (Increase Indent)"
                  >
                    <IndentIcon className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Quick Styles / Headings */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleApplyHeading('p')}
                    className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded text-[11px] font-semibold cursor-pointer"
                  >
                    सामान्य
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyHeading('h1')}
                    className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-900 rounded text-[11px] font-bold cursor-pointer"
                  >
                    शीर्षक
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyHeading('callout')}
                    className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded text-[11px] font-bold cursor-pointer"
                    title="ध्यातव्य/निर्देश बॉक्स डालें"
                  >
                    📌 निर्देश बॉक्स
                  </button>
                </div>
              </>
            )}

            {/* TAB 2: INSERT */}
            {activeTab === 'insert' && (
              <div className="flex items-center flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleInsertBulletListTemplate}
                  className="px-2.5 py-1.5 bg-white hover:bg-indigo-50 border border-slate-300 hover:border-indigo-300 text-slate-800 hover:text-indigo-700 rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all shadow-2xs"
                  title="बुलेट बिंदु सूची डालें (• बिंदु 1, बिंदु 2)"
                >
                  <List className="w-3.5 h-3.5 text-indigo-600" />
                  <span>• बुलेट बिंदु सूची</span>
                </button>

                <button
                  type="button"
                  onClick={handleInsertNumberedListTemplate}
                  className="px-2.5 py-1.5 bg-white hover:bg-indigo-50 border border-slate-300 hover:border-indigo-300 text-slate-800 hover:text-indigo-700 rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all shadow-2xs"
                  title="क्रमांकित सूची डालें (1., 2., 3.)"
                >
                  <ListOrdered className="w-3.5 h-3.5 text-indigo-600" />
                  <span>1. क्रमांकित बिंदु</span>
                </button>

                <button
                  type="button"
                  onClick={handleInsertDevanagariListTemplate}
                  className="px-2.5 py-1.5 bg-white hover:bg-indigo-50 border border-slate-300 hover:border-indigo-300 text-slate-800 hover:text-indigo-700 rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all shadow-2xs"
                  title="शासकीय बिंदु डालें ((क), (ख), (ग))"
                >
                  <span className="font-bold text-indigo-600 text-xs">(क)</span>
                  <span>शासकीय बिंदु (क, ख)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleInsertTable(3, 4)}
                  className="px-2.5 py-1.5 bg-white hover:bg-indigo-50 border border-slate-300 hover:border-indigo-300 text-slate-800 hover:text-indigo-700 rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all shadow-2xs"
                >
                  <TableIcon className="w-3.5 h-3.5 text-indigo-600" />
                  <span>सारणी / टेबल डालें (3x4)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleInsertTable(4, 5)}
                  className="px-2.5 py-1.5 bg-white hover:bg-indigo-50 border border-slate-300 hover:border-indigo-300 text-slate-800 hover:text-indigo-700 rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all shadow-2xs"
                >
                  <TableIcon className="w-3.5 h-3.5 text-indigo-600" />
                  <span>बड़ी टेबल (4x5)</span>
                </button>

                <button
                  type="button"
                  onClick={handleInsertDateStamp}
                  className="px-2.5 py-1.5 bg-white hover:bg-indigo-50 border border-slate-300 hover:border-indigo-300 text-slate-800 hover:text-indigo-700 rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all shadow-2xs"
                >
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>आज की दिनांक मुहर</span>
                </button>

                <button
                  type="button"
                  onClick={handleInsertDivider}
                  className="px-2.5 py-1.5 bg-white hover:bg-indigo-50 border border-slate-300 hover:border-indigo-300 text-slate-800 hover:text-indigo-700 rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all shadow-2xs"
                >
                  <span>— विभाजक रेखा (Divider)</span>
                </button>

                <button
                  type="button"
                  onClick={handleInsertSignatoryBox}
                  className="px-2.5 py-1.5 bg-white hover:bg-indigo-50 border border-slate-300 hover:border-indigo-300 text-slate-800 hover:text-indigo-700 rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all shadow-2xs"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>हस्ताक्षर ब्लॉक (Signatory Box)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyHeading('quote')}
                  className="px-2.5 py-1.5 bg-white hover:bg-indigo-50 border border-slate-300 hover:border-indigo-300 text-slate-800 hover:text-indigo-700 rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all shadow-2xs"
                >
                  <Quote className="w-3.5 h-3.5 text-purple-600" />
                  <span>संदर्भ उद्धरण बॉक्स</span>
                </button>
              </div>
            )}

            {/* TAB 3: HINDI TOOLS */}
            {activeTab === 'hindi' && (
              <div className="w-full space-y-1.5">
                <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>1-क्लिक शासकीय वाक्यांश (Official Hindi Clichés) — कर्सर वाले स्थान पर तुरंत डालें:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {HINDI_PHRASES.map((phrase, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleInsertPhrase(phrase.text)}
                      className="text-left px-2.5 py-1 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-400 text-slate-800 hover:text-indigo-900 rounded-lg text-[11px] font-medium transition-all cursor-pointer shadow-2xs"
                      title={phrase.text}
                    >
                      <span className="font-bold text-indigo-700">{phrase.title}: </span>
                      <span className="text-slate-600 truncate max-w-[200px] inline-block align-bottom">{phrase.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: VIEW / PAGE SETUP */}
            {activeTab === 'view' && (
              <div className="flex items-center flex-wrap gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-700">पंक्ति रिक्ति (Line Spacing):</span>
                  {['1.25', '1.5', '1.75', '2.0'].map((lh) => (
                    <button
                      key={lh}
                      type="button"
                      onClick={() => {
                        setLineHeight(lh);
                        if (editorRef.current) {
                          editorRef.current.style.lineHeight = lh;
                        }
                      }}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer ${
                        lineHeight === lh ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-300 text-slate-700'
                      }`}
                    >
                      {lh}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 border-l border-slate-300 pl-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (editorRef.current) {
                        editorRef.current.innerHTML = '';
                        handleEditorInput();
                      }
                    }}
                    className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded text-xs font-bold cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>सभी साफ़ करें (Clear All)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Word Document Canvas / Editing Surface */}
        <div className="relative flex-1 bg-slate-200/60 p-4 sm:p-6 overflow-y-auto flex justify-center">
          {isSourceMode ? (
            <textarea
              value={sourceCode}
              onChange={(e) => {
                setSourceCode(e.target.value);
                onChange(e.target.value);
                calculateCounts(e.target.value);
              }}
              rows={12}
              className="w-full max-w-4xl p-4 font-mono text-xs text-slate-900 bg-white border border-slate-300 rounded-xl shadow-md focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              placeholder="HTML स्रोत कोड यहाँ संपादित करें..."
            />
          ) : (
            <div
              className="w-full max-w-4xl bg-white border border-slate-300 rounded-xl shadow-lg p-6 sm:p-8 transition-all min-h-[260px] focus-within:ring-2 focus-within:ring-indigo-500/20"
              style={{
                fontFamily: currentFont,
                fontSize: currentFontSize,
                lineHeight: lineHeight,
                minHeight: minHeight
              }}
            >
              <div
                ref={editorRef}
                contentEditable
                onInput={handleEditorInput}
                onBlur={handleEditorInput}
                className="outline-hidden text-slate-900 leading-relaxed text-justify w-full prose max-w-none [&>p]:mb-3 [&>p]:text-justify [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5"
                style={{
                  minHeight: minHeight,
                  textAlign: 'justify',
                  textJustify: 'inter-word'
                }}
                data-placeholder={placeholder}
              />
            </div>
          )}
        </div>

        {/* Word Status Bar at Bottom (MS Word Like Status Bar) */}
        <div className="bg-slate-800 text-slate-300 px-4 py-1.5 text-[11px] flex flex-wrap items-center justify-between border-t border-slate-700">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
              पेज 1 का 1
            </span>
            <span className="text-slate-400">|</span>
            <span>शब्द (Words): <strong className="text-white">{wordCount}</strong></span>
            <span className="text-slate-400">|</span>
            <span>वर्ण (Chars): <strong className="text-white">{charCount}</strong></span>
            <span className="text-slate-400">|</span>
            <span className="hidden sm:inline">भाषा: <strong className="text-indigo-200">हिंदी (भारत)</strong></span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded font-mono">
              Justify Active • 100%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
