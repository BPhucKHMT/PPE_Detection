import { NavLink } from 'react-router';
import {
  LayoutDashboard, Upload, BarChart3,
} from 'lucide-react';

const nav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard'    },
  { to: '/upload',    icon: Upload,          label: 'Video Upload' },
  { to: '/reports',   icon: BarChart3,       label: 'Reports'      },
];

export function Sidebar() {
  return (
    <aside className="w-64 border-r border-slate-800/50 bg-slate-900/30 min-h-[calc(100vh-65px)] p-4 sticky top-[65px] self-start shrink-0">
      <nav className="space-y-1">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium text-sm border ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-500/30 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.08)]'
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200 border-transparent'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-cyan-400' : ''}`} />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom status */}
      <div className="mt-8 p-3 bg-slate-900/60 rounded-xl border border-slate-800/60">
        <div className="text-xs text-slate-500 mb-2 font-semibold uppercase tracking-wider">System Status</div>
        <div className="space-y-1.5">
          {[
            { label: 'AI Engine',   color: 'bg-emerald-500', status: 'Online'     },
            { label: 'GPU',         color: 'bg-emerald-500', status: 'RTX 4060'   },
            { label: 'Stream',      color: 'bg-cyan-500',    status: '4 Cameras'  },
            { label: 'Recording',   color: 'bg-amber-500',   status: 'Active'     },
          ].map(s => (
            <div key={s.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${s.color}`} />
                <span className="text-xs text-slate-400">{s.label}</span>
              </div>
              <span className="text-xs text-slate-300 font-mono">{s.status}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
