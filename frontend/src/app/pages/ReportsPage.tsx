import { useState } from 'react';
import { Download, Calendar, FileText, TrendingUp, AlertTriangle, Clock, Users, BarChart3 } from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend, LineChart, Line
} from 'recharts';
import {
  weeklyComplianceData, weeklyViolationsData, responseTimeData,
  violationTypesData
} from '../data';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

const DATE_RANGES = ['Today', 'Last 7 Days', 'Last 30 Days', 'Custom'];

const summaryKPIs = [
  { label: 'Total Violations',    value: '102',    delta: '-8%',  up: false, icon: AlertTriangle, color: 'from-red-500/20 to-red-600/10',     border: 'border-red-500/20',     text: 'text-red-400'     },
  { label: 'Avg Compliance Rate', value: '82.7%',  delta: '+3.2%',up: true,  icon: TrendingUp,    color: 'from-emerald-500/20 to-emerald-600/10',border:'border-emerald-500/20',text: 'text-emerald-400' },
  { label: 'Avg Response Time',   value: '4.3 min',delta: '-12%', up: true,  icon: Clock,         color: 'from-cyan-500/20 to-cyan-600/10',    border: 'border-cyan-500/20',    text: 'text-cyan-400'    },
  { label: 'Workers Monitored',   value: '38',     delta: '+4',   up: true,  icon: Users,         color: 'from-purple-500/20 to-purple-600/10', border: 'border-purple-500/20',  text: 'text-purple-400'  },
];

export function ReportsPage() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState('Last 7 Days');

  function handleExport(type: 'csv' | 'pdf') {
    toast.success(`Exporting ${type.toUpperCase()}…`, {
      description: `${dateRange} safety report is being generated.`,
      duration: 3000,
    });
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Reports & Analytics</h1>
          <p className="text-sm text-slate-400 mt-0.5">Historical safety data, trends, and exports</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/rules')}
            className="px-4 py-2 bg-slate-700/50 text-slate-300 border border-slate-600/50 rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors flex items-center gap-2"
          >
            Configure Rules
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="px-4 py-2 bg-slate-700/50 text-slate-300 border border-slate-600/50 rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
          >
            <FileText className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="flex items-center gap-3 mb-6">
        <Calendar className="w-4 h-4 text-slate-500" />
        <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-1 border border-slate-700/40">
          {DATE_RANGES.map(opt => (
            <button
              key={opt}
              onClick={() => setDateRange(opt)}
              className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
                dateRange === opt ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-500">
          Showing data for: <span className="text-slate-300 font-medium">{dateRange}</span>
        </span>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {summaryKPIs.map(k => (
          <div key={k.label} className={`bg-gradient-to-br ${k.color} border ${k.border} rounded-xl p-4`}>
            <div className="flex items-center justify-between mb-2">
              <k.icon className="w-5 h-5 text-slate-500" />
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${k.up ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                {k.delta}
              </span>
            </div>
            <div className={`text-2xl font-bold ${k.text} mb-1`}>{k.value}</div>
            <div className="text-xs text-slate-400">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Compliance Trend */}
        <div className="col-span-2 bg-slate-800/30 border border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-200">Compliance Trend</h3>
              <p className="text-xs text-slate-500 mt-0.5">Compliant vs. Warning vs. Critical %</p>
            </div>
            <BarChart3 className="w-4 h-4 text-slate-500" />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={weeklyComplianceData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="day" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Area type="monotone" dataKey="compliant" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.3} name="Compliant" />
              <Area type="monotone" dataKey="warning"   stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} name="Warning"   />
              <Area type="monotone" dataKey="critical"  stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} name="Critical"  />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Violation Types */}
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-5">
          <div className="mb-4">
            <h3 className="font-semibold text-slate-200">Violations by Type</h3>
            <p className="text-xs text-slate-500 mt-0.5">Total this period</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={violationTypesData} layout="vertical" margin={{ top: 0, right: 4, left: 8, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} width={50} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }} cursor={{ fill: '#334155', opacity: 0.4 }} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {violationTypesData.map((_, i) => {
                  const colors = ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#06b6d4', '#10b981'];
                  return <Cell key={`cell-${i}`} fill={colors[i % colors.length]} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-2 gap-6">
        {/* Daily Violations */}
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-200">Daily Violations</h3>
              <p className="text-xs text-slate-500 mt-0.5">Total violations per day</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={weeklyViolationsData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="day" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }} />
              <Bar dataKey="violations" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Violations" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Response Time */}
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-200">Avg Response Time</h3>
              <p className="text-xs text-slate-500 mt-0.5">Alert-to-acknowledgment (minutes)</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={responseTimeData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="time" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }} />
              <Line type="monotone" dataKey="avg" stroke="#06b6d4" strokeWidth={2} dot={{ fill: '#06b6d4', r: 3 }} name="Response (min)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}