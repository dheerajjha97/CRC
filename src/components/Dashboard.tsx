import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart as PieChartIcon, 
  Calendar, 
  Users, 
  FileText, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight, 
  Layers, 
  Building2, 
  Plus, 
  Eye,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { OfficeOrder, CrcProfile, Teacher } from '../types';

interface DashboardProps {
  orders: OfficeOrder[];
  profile: CrcProfile;
  teachers: Teacher[];
  onNavigateToCreate: () => void;
  onNavigateToHistory: () => void;
  onSelectOrder?: (order: OfficeOrder) => void;
}

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  meeting: { label: 'बैठक आदेश', color: '#4f46e5', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  exam_duty: { label: 'परीक्षा वीक्षक', color: '#0284c7', bg: 'bg-sky-50 text-sky-700 border-sky-200' },
  deputation: { label: 'प्रतिनियुक्ति', color: '#d97706', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  training: { label: 'प्रशिक्षण', color: '#16a34a', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  evaluation: { label: 'मूल्यांकन', color: '#9333ea', bg: 'bg-purple-50 text-purple-700 border-purple-200' },
  general: { label: 'सामान्य आदेश', color: '#64748b', bg: 'bg-slate-100 text-slate-700 border-slate-200' }
};

const PIE_COLORS = ['#4f46e5', '#0284c7', '#d97706', '#16a34a', '#9333ea', '#64748b'];

export const Dashboard: React.FC<DashboardProps> = ({
  orders,
  profile,
  teachers,
  onNavigateToCreate,
  onNavigateToHistory,
  onSelectOrder
}) => {
  const [timeRange, setTimeRange] = useState<'6m' | '3m' | '12m' | 'all'>('6m');
  const [chartType, setChartType] = useState<'area' | 'bar' | 'line'>('area');

  // Month range calculations
  const monthsCount = useMemo(() => {
    switch (timeRange) {
      case '3m': return 3;
      case '6m': return 6;
      case '12m': return 12;
      case 'all': return 24;
      default: return 6;
    }
  }, [timeRange]);

  // Generate target month slots (e.g., last 6 months starting from current month backwards)
  const monthSlots = useMemo(() => {
    const slots: { key: string; label: string; year: number; month: number }[] = [];
    const now = new Date();

    for (let i = monthsCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('hi-IN', { month: 'short', year: '2-digit' });
      slots.push({ key, label, year: d.getFullYear(), month: d.getMonth() });
    }
    return slots;
  }, [monthsCount]);

  // Filter orders by selected timeframe
  const filteredOrders = useMemo(() => {
    if (timeRange === 'all') return orders;
    const now = new Date();
    const cutoffDate = new Date(now.getFullYear(), now.getMonth() - monthsCount + 1, 1);
    
    return orders.filter(order => {
      const orderDate = order.orderDate ? new Date(order.orderDate) : new Date(order.createdAt || Date.now());
      return orderDate >= cutoffDate;
    });
  }, [orders, timeRange, monthsCount]);

  // Aggregate monthly trends data for recharts
  const monthlyTrendData = useMemo(() => {
    const dataMap: Record<string, {
      monthKey: string;
      name: string;
      total: number;
      meeting: number;
      exam_duty: number;
      deputation: number;
      training: number;
      evaluation: number;
      general: number;
      finalOrders: number;
      draftOrders: number;
    }> = {};

    // Initialize all month slots with zero
    monthSlots.forEach(slot => {
      dataMap[slot.key] = {
        monthKey: slot.key,
        name: slot.label,
        total: 0,
        meeting: 0,
        exam_duty: 0,
        deputation: 0,
        training: 0,
        evaluation: 0,
        general: 0,
        finalOrders: 0,
        draftOrders: 0
      };
    });

    // Populate data from orders
    orders.forEach(order => {
      const rawDate = order.orderDate || (order.createdAt ? order.createdAt.split('T')[0] : '');
      if (!rawDate) return;
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return;

      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (dataMap[key]) {
        dataMap[key].total += 1;
        const cat = order.orderType || 'general';
        if (cat in dataMap[key]) {
          (dataMap[key] as any)[cat] += 1;
        } else {
          dataMap[key].general += 1;
        }

        if (order.status === 'draft') {
          dataMap[key].draftOrders += 1;
        } else {
          dataMap[key].finalOrders += 1;
        }
      }
    });

    return monthSlots.map(slot => dataMap[slot.key]);
  }, [orders, monthSlots]);

  // Aggregate category distribution data for Pie Chart
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {
      meeting: 0,
      exam_duty: 0,
      deputation: 0,
      training: 0,
      evaluation: 0,
      general: 0
    };

    filteredOrders.forEach(order => {
      const cat = order.orderType || 'general';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([key, value]) => ({
        key,
        name: CATEGORY_CONFIG[key]?.label || key,
        value,
        color: CATEGORY_CONFIG[key]?.color || '#64748b'
      }))
      .filter(item => item.value > 0);
  }, [filteredOrders]);

  // Top Statistics Calculations
  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const timeframeOrders = filteredOrders.length;
    const finalOrders = filteredOrders.filter(o => o.status !== 'draft').length;
    const draftOrders = filteredOrders.filter(o => o.status === 'draft').length;
    
    // Total teachers engaged in orders
    const teachersEngagedCount = filteredOrders.reduce((acc, curr) => {
      return acc + (curr.selectedTeachers ? curr.selectedTeachers.length : 0);
    }, 0);

    // Most frequent category in period
    let maxCat = '—';
    let maxCount = 0;
    const catCounts: Record<string, number> = {};
    filteredOrders.forEach(o => {
      const c = o.orderType || 'general';
      catCounts[c] = (catCounts[c] || 0) + 1;
      if (catCounts[c] > maxCount) {
        maxCount = catCounts[c];
        maxCat = CATEGORY_CONFIG[c]?.label || c;
      }
    });

    return {
      totalOrders,
      timeframeOrders,
      finalOrders,
      draftOrders,
      teachersEngagedCount,
      mostActiveCategory: maxCount > 0 ? `${maxCat} (${maxCount})` : '—'
    };
  }, [orders, filteredOrders]);

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 backdrop-blur text-white text-xs p-3 rounded-xl shadow-xl border border-slate-700 min-w-44 z-50">
          <p className="font-bold border-b border-slate-700 pb-1.5 mb-2 text-amber-300">
            {label}
          </p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => {
              if (entry.value === 0 && entry.name !== 'कुल आदेश') return null;
              return (
                <div key={`item-${index}`} className="flex items-center justify-between gap-3 text-[11px]">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <span 
                      className="w-2.5 h-2.5 rounded-full inline-block shrink-0" 
                      style={{ backgroundColor: entry.color }} 
                    />
                    {entry.name}:
                  </span>
                  <span className="font-bold font-mono text-white">
                    {entry.value} पत्र
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              संकुल आदेश सांख्यिकी एवं विश्लेषण (CRC Order Analytics)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {profile.clusterName ? `${profile.clusterName} • ` : ''}
              विगत 6 माह में निर्गत विभिन्न प्रकार के शासकीय आदेशों, बैठकों एवं प्रतिनियुक्ति की आवधिक प्रवृत्ति (Trends)
            </p>
          </div>
        </div>

        {/* Time Range Filter Switcher */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl self-start md:self-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setTimeRange('3m')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              timeRange === '3m' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            3 माह
          </button>
          <button
            type="button"
            onClick={() => setTimeRange('6m')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              timeRange === '6m' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📊 6 माह (मानक)
          </button>
          <button
            type="button"
            onClick={() => setTimeRange('12m')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              timeRange === '12m' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            1 वर्ष
          </button>
          <button
            type="button"
            onClick={() => setTimeRange('all')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              timeRange === 'all' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            समस्त
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Orders in Timeframe */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {timeRange === '6m' ? 'विगत 6 माह में आदेश' : 'चयनित अवधि में आदेश'}
            </span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {stats.timeframeOrders}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              (कुल जावक: {stats.totalOrders})
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{stats.finalOrders} निर्गत आदेश दर्ज</span>
          </div>
        </div>

        {/* Card 2: Draft Orders */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              लंबित / ड्राफ्ट मसौदे
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600 font-mono">
              {stats.draftOrders}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              मसौदे
            </span>
          </div>
          <div className="mt-3 text-[11px] text-slate-500">
            {stats.draftOrders > 0 ? 'समीक्षा एवं जारी करने हेतु प्रतीक्षारत' : 'कोई लंबित ड्राफ्ट नहीं'}
          </div>
        </div>

        {/* Card 3: Teachers Engaged */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              संबद्ध शिक्षक दायित्व
            </span>
            <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-sky-600 font-mono">
              {stats.teachersEngagedCount}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              शिक्षक-प्रविष्टि
            </span>
          </div>
          <div className="mt-3 text-[11px] text-slate-500">
            कुल नामांकित शिक्षक: {teachers.length}
          </div>
        </div>

        {/* Card 4: Most Active Category */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              सर्वाधिक सक्रिय श्रेणी
            </span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-base font-bold text-purple-700 truncate block">
              {stats.mostActiveCategory}
            </span>
          </div>
          <div className="mt-3 text-[11px] text-slate-500">
            कार्यालयीन प्राथमिक गतिविधि
          </div>
        </div>
      </div>

      {/* Main Chart Section: Monthly Frequency & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 Cols: Monthly Timeline Frequency Chart */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                माह-वार आदेश निर्गमन प्रवृत्ति ({timeRange === '6m' ? 'विगत 6 माह' : timeRange})
              </h3>
              <p className="text-xs text-slate-500">
                विभिन्न श्रेणियों (बैठक, परीक्षा, प्रतिनियुक्ति, प्रशिक्षण) के अनुसार पत्र संख्या
              </p>
            </div>

            {/* Chart type toggle */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setChartType('area')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  chartType === 'area' ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'text-slate-600'
                }`}
              >
                क्षेत्र (Area)
              </button>
              <button
                type="button"
                onClick={() => setChartType('bar')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  chartType === 'bar' ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'text-slate-600'
                }`}
              >
                स्तंभ (Bar)
              </button>
              <button
                type="button"
                onClick={() => setChartType('line')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  chartType === 'line' ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'text-slate-600'
                }`}
              >
                रेखा (Line)
              </button>
            </div>
          </div>

          {/* Recharts Container */}
          <div className="h-72 w-full pt-2">
            {monthlyTrendData.every(d => d.total === 0) ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 border border-dashed border-slate-200 rounded-xl">
                <FileText className="w-8 h-8 text-slate-300" />
                <p className="text-xs font-semibold">इस समयावधि में कोई आदेश रिकॉर्ड नहीं पाया गया</p>
                <button
                  type="button"
                  onClick={onNavigateToCreate}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 underline"
                >
                  + नया आदेश बनाएं
                </button>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'area' ? (
                  <AreaChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorMeeting" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Area 
                      type="monotone" 
                      dataKey="total" 
                      name="कुल आदेश" 
                      stroke="#4f46e5" 
                      strokeWidth={2.5}
                      fillOpacity={1} 
                      fill="url(#colorTotal)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="meeting" 
                      name="बैठक" 
                      stroke="#0284c7" 
                      strokeWidth={1.5}
                      fillOpacity={1} 
                      fill="url(#colorMeeting)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="exam_duty" 
                      name="परीक्षा वीक्षक" 
                      stroke="#d97706" 
                      strokeWidth={1.5}
                      fillOpacity={0} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="deputation" 
                      name="प्रतिनियुक्ति" 
                      stroke="#16a34a" 
                      strokeWidth={1.5}
                      fillOpacity={0} 
                    />
                  </AreaChart>
                ) : chartType === 'bar' ? (
                  <BarChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="meeting" name="बैठक" stackId="a" fill="#4f46e5" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="exam_duty" name="परीक्षा" stackId="a" fill="#0284c7" />
                    <Bar dataKey="deputation" name="प्रतिनियुक्ति" stackId="a" fill="#d97706" />
                    <Bar dataKey="training" name="प्रशिक्षण" stackId="a" fill="#16a34a" />
                    <Bar dataKey="general" name="सामान्य" stackId="a" fill="#64748b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : (
                  <LineChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Line type="monotone" dataKey="total" name="कुल आदेश" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="meeting" name="बैठक" stroke="#0284c7" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="exam_duty" name="परीक्षा" stroke="#d97706" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="deputation" name="प्रतिनियुक्ति" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            )}
          </div>

          {/* Quick Summary Chips for all Categories */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-slate-700">श्रेणी विश्लेषण:</span>
            {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => {
              const count = filteredOrders.filter(o => o.orderType === key).length;
              return (
                <span
                  key={key}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold ${cfg.bg}`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                  <span>{cfg.label}:</span>
                  <strong className="font-mono">{count}</strong>
                </span>
              );
            })}
          </div>
        </div>

        {/* Right 4 Cols: Category Donut Chart & Distribution */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-purple-600" />
              आदेश प्रकार अनुपात (Category Share)
            </h3>
            <p className="text-xs text-slate-500">
              कुल पत्रों में विभिन्न श्रेणियों का प्रतिशत
            </p>
          </div>

          {/* Donut Chart */}
          <div className="h-56 w-full relative flex items-center justify-center">
            {categoryData.length === 0 ? (
              <div className="text-center text-slate-400 space-y-1">
                <PieChartIcon className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs">कोई डेटा उपलब्ध नहीं</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val: any, name: any) => [`${val} पत्र`, name]}
                    contentStyle={{ borderRadius: '12px', fontSize: '11px', background: '#0f172a', color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}

            {/* Center Summary Count */}
            {categoryData.length > 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-black text-slate-900 font-mono">
                  {stats.timeframeOrders}
                </span>
                <span className="text-[10px] font-bold text-slate-400">कुल पत्र</span>
              </div>
            )}
          </div>

          {/* Category Percentage Breakdown List */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            {categoryData.length > 0 ? (
              categoryData.map(item => {
                const percent = stats.timeframeOrders > 0 
                  ? Math.round((item.value / stats.timeframeOrders) * 100) 
                  : 0;
                return (
                  <div key={item.key} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="font-semibold text-slate-700">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-slate-500 font-medium">{item.value} पत्र</span>
                      <span className="font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                        {percent}%
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 text-center py-2">डेटा अनुपलब्ध</p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Orders & Quick Launch Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Orders Timeline */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              हाल ही में निर्गत / ड्राफ्ट आदेश (Recent Orders)
            </h3>
            <button
              type="button"
              onClick={onNavigateToHistory}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              <span>पूरी जावक पंजी देखें</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              अभी तक कोई आदेश नहीं बनाया गया है।
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {orders.slice(0, 5).map((order, idx) => {
                const catCfg = CATEGORY_CONFIG[order.orderType || 'general'] || CATEGORY_CONFIG.general;
                return (
                  <div 
                    key={order.id || idx} 
                    className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono text-xs font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 shrink-0">
                        {order.orderNumber || `Order #${idx + 1}`}
                      </span>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {order.subject || 'बिना विषय का आदेश'}
                          </p>
                          {order.status === 'draft' ? (
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded shrink-0">
                              ड्राफ्ट
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded shrink-0">
                              निर्गत
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                          <span>{order.orderDate || 'दिनांक अनुपलब्ध'}</span>
                          <span>•</span>
                          <span className="text-slate-600 font-medium">{catCfg.label}</span>
                          {order.selectedTeachers && order.selectedTeachers.length > 0 && (
                            <>
                              <span>•</span>
                              <span>{order.selectedTeachers.length} शिक्षक संबद्ध</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (onSelectOrder) onSelectOrder(order);
                        else onNavigateToHistory();
                      }}
                      className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer shrink-0"
                      title="पत्र देखें"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions & System Overview */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-amber-300">
              <Sparkles className="w-5 h-5" />
              <h3 className="text-sm font-bold">त्वरित कार्य (Quick Actions)</h3>
            </div>
            <p className="text-xs text-slate-300">
              नया शासकीय आदेश बनाएं, बैठक सूचना जारी करें अथवा AI प्रारूपक से ड्राफ्ट तैयार करें।
            </p>
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={onNavigateToCreate}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-all cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>+ नया आदेश बनाएं</span>
              </button>

              <button
                type="button"
                onClick={onNavigateToHistory}
                className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold py-2.5 px-3 rounded-xl transition-all cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-amber-300" />
                <span>जावक पंजी देखें</span>
              </button>
            </div>
          </div>

          {/* CRC Cluster Profile Quick Summary */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-indigo-600" />
              संकुल विवरण (Cluster Info)
            </h4>
            <div className="text-xs space-y-1.5 text-slate-600">
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-500">संकुल:</span>
                <span className="font-bold text-slate-800">{profile.clusterName || '—'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-500">प्रखंड / जिला:</span>
                <span className="font-semibold text-slate-800">{profile.blockName || '—'}, {profile.districtName || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">हस्ताक्षरकर्ता:</span>
                <span className="font-semibold text-slate-800">{profile.defaultSignatory || profile.centerHead || '—'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
