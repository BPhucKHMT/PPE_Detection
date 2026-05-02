import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  LineChart, Line, XAxis, YAxis, BarChart, Bar, CartesianGrid, Legend,
} from 'recharts';
import { complianceData, alertsTimeData, violationTypesData, performanceData } from '../data';

export function AnalyticsWidgets() {
  return (
    <div className="grid grid-cols-4 gap-6 mb-6">
      {/* Compliance Donut */}
      <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-1 text-slate-200">Compliance Ratio</h3>
        <p className="text-xs text-slate-500 mb-2">Current session</p>
        <ResponsiveContainer width="100%" height={130}>
          <PieChart>
            <Pie
              data={complianceData}
              cx="50%" cy="50%"
              innerRadius={38} outerRadius={56}
              paddingAngle={4}
              dataKey="value"
              nameKey="name"
              startAngle={90} endAngle={-270}
            >
              {complianceData.map((entry, i) => (
                <Cell key={`cell-${i}`} fill={entry.color} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-col gap-1.5 mt-1">
          {complianceData.map((entry) => (
            <div key={entry.name} className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-xs text-slate-400">{entry.name}</span>
              </div>
              <span className="text-xs font-mono text-slate-300">{entry.value}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Alerts Over Time */}
      <div className="col-span-2 bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-1 text-slate-200">Alerts Timeline</h3>
        <p className="text-xs text-slate-500 mb-2">Last 60 minutes</p>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={alertsTimeData} margin={{ top: 5, right: 10, left: -24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }} />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
            <Line type="monotone" dataKey="critical" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444', r: 3 }} name="Critical" />
            <Line type="monotone" dataKey="warning"  stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 3 }} name="Warning"  />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Violation Types */}
      <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-1 text-slate-200">Violation Types</h3>
        <p className="text-xs text-slate-500 mb-2">Today's breakdown</p>
        <ResponsiveContainer width="100%" height={165}>
          <BarChart data={violationTypesData} layout="vertical" margin={{ top: 0, right: 4, left: 8, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} width={46} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }} cursor={{ fill: '#334155', opacity: 0.4 }} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {violationTypesData.map((_, i) => (
                <Cell key={`bar-${i}`} fill={i === 0 ? '#ef4444' : i === 1 ? '#f59e0b' : i === 3 ? '#8b5cf6' : '#3b82f6'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Model Performance */}
      <div className="col-span-4 bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-slate-200">Model Performance</h3>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span>Avg FPS: <span className="text-cyan-400 font-mono">11.0</span></span>
            <span>Avg Latency: <span className="text-emerald-400 font-mono">91ms</span></span>
            <span>Avg Conf: <span className="text-purple-400 font-mono">91.8%</span></span>
          </div>
        </div>
        <p className="text-xs text-slate-500 mb-3">Last 5 minutes · YOLO11 PT · RTX 4060 GPU</p>
        <ResponsiveContainer width="100%" height={110}>
          <LineChart data={performanceData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis yAxisId="fps"  stroke="#475569" fontSize={10} tickLine={false} axisLine={false} domain={[0, 20]} />
            <YAxis yAxisId="lat"  stroke="#475569" fontSize={10} tickLine={false} axisLine={false} orientation="right" domain={[70, 110]} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }} />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
            <Line yAxisId="fps"  type="monotone" dataKey="fps"        stroke="#06b6d4" strokeWidth={2} dot={false} name="FPS"            />
            <Line yAxisId="lat"  type="monotone" dataKey="latency"    stroke="#10b981" strokeWidth={2} dot={false} name="Latency (ms)"   />
            <Line yAxisId="fps"  type="monotone" dataKey="confidence" stroke="#a855f7" strokeWidth={2} dot={false} name="Confidence (%)" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
