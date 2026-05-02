import { Shield, Settings, Bell } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useAppContext } from '../context/AppContext';
import { sites } from '../data';

export function Header() {
  const navigate = useNavigate();
  const { activeSite, setActiveSite, isAIActive } = useAppContext();

  function handleSiteChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const site = e.target.value;
    setActiveSite(site);
    toast.success(`Context switched to ${site.split(' - ')[0]}`, {
      description: 'Dashboard data is refreshing…',
      duration: 3000,
    });
  }

  return (
    <header className="border-b border-slate-800/50 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-40">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left: Logo + Site + AI Status */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-3 shrink-0"
          >
            <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-2 rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent whitespace-nowrap">
              PPE Vision Control
            </span>
          </button>

          <select
            value={activeSite}
            onChange={handleSiteChange}
            className="bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2 text-sm font-medium text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 appearance-none cursor-pointer hover:bg-slate-800 transition-colors"
          >
            {sites.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm ${
            isAIActive
              ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
              : 'bg-slate-800/50 border-slate-700/50'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isAIActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
            <span className={`text-sm font-medium ${isAIActive ? 'text-emerald-400' : 'text-slate-400'}`}>
              {isAIActive ? 'AI Monitoring Active' : 'AI Monitoring Paused'}
            </span>
          </div>
        </div>

        {/* Right: Stats + Actions */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 text-sm bg-slate-800/50 px-4 py-1.5 rounded-lg border border-slate-700/50">
            <span className="text-slate-400 font-medium">YOLO11 · GPU Online</span>
            <div className="w-px h-4 bg-slate-700" />
            <span className="text-cyan-400 font-mono font-bold">11.6 FPS</span>
          </div>

          <button className="relative p-2 hover:bg-slate-800/80 rounded-lg transition-colors group">
            <Bell className="w-5 h-5 text-slate-400 group-hover:text-slate-200" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
          </button>

          <button
            onClick={() => navigate('/settings')}
            className="p-2 hover:bg-slate-800/80 rounded-lg transition-colors group"
          >
            <Settings className="w-5 h-5 text-slate-400 group-hover:text-slate-200" />
          </button>

          <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full border-2 border-slate-700/50 cursor-pointer hover:border-slate-500 transition-colors flex items-center justify-center text-white text-xs font-bold select-none">
            SM
          </div>
        </div>
      </div>
    </header>
  );
}
