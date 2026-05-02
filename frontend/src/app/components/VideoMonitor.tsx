import { Play, Pause, Camera, Upload, Download, Eye, Activity, ZoomIn } from 'lucide-react';
import { mockWorkers } from '../data';

export function VideoMonitor({
  isPlaying,
  setIsPlaying,
  selectedWorkerId,
  setSelectedWorkerId,
  overlays,
  setOverlays,
}: {
  isPlaying: boolean;
  setIsPlaying: (p: boolean) => void;
  selectedWorkerId: string | null;
  setSelectedWorkerId: (id: string | null) => void;
  overlays: { boxes: boolean; labels: boolean; confidence: boolean; path: boolean };
  setOverlays: (o: any) => void;
}) {
  return (
    <div className="col-span-2 bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl flex flex-col overflow-hidden">
      <div className="border-b border-slate-700/50 p-4 flex items-center justify-between bg-slate-900/30">
        <div className="flex items-center gap-3">
          <Camera className="w-5 h-5 text-cyan-400" />
          <h2 className="font-semibold text-lg">Realtime Video Monitor</h2>
          <div className="flex items-center gap-2 px-2 py-1 bg-red-500/20 border border-red-500/30 rounded-full">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-xs text-red-400 font-semibold">LIVE</span>
          </div>
        </div>
        <div className="text-sm text-slate-400 flex items-center gap-2">
          <span>Camera 03 - Loading Bay</span>
          <span className="w-1 h-1 bg-slate-600 rounded-full" />
          <span>1280x720</span>
        </div>
      </div>

      <div className="relative bg-slate-900 flex-1 min-h-[400px]">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900">
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(255,255,255,.03) 50px, rgba(255,255,255,.03) 51px)',
          }} />
        </div>

        {overlays.boxes && mockWorkers.map((worker) => {
          const isSelected = selectedWorkerId === worker.id;
          const isCritical = worker.risk === 'Critical';
          const isWarning = worker.risk === 'Warning';
          
          const boxColor = isSelected ? (isCritical ? 'border-red-400 bg-red-500/20' : isWarning ? 'border-amber-400 bg-amber-500/20' : 'border-emerald-400 bg-emerald-500/20')
                         : (isCritical ? 'border-red-500/70 bg-red-500/10' : isWarning ? 'border-amber-500/70 bg-amber-500/10' : 'border-emerald-500/70 bg-emerald-500/10');
          const labelColor = isCritical ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500';

          return (
            <div
              key={worker.id}
              onClick={() => setSelectedWorkerId(worker.id)}
              className={`absolute border-2 ${boxColor} rounded-lg cursor-pointer transition-all ${isSelected ? 'shadow-[0_0_15px_rgba(239,68,68,0.5)] z-10' : 'hover:border-white/50 z-0'}`}
              style={{
                left: `${worker.x}px`,
                top: `${worker.y}px`,
                width: '120px',
                height: '160px',
              }}
            >
              {overlays.labels && (
                <div className={`absolute -top-7 left-0 ${labelColor} text-white px-2 py-0.5 rounded text-xs font-mono font-bold flex items-center gap-2 whitespace-nowrap`}>
                  <span>ID #{worker.id}</span>
                  {overlays.confidence && <span className="opacity-80 text-[10px]">{worker.confidence}%</span>}
                </div>
              )}

              {overlays.labels && (
                <div className="absolute top-2 -right-2 translate-x-full bg-slate-900/95 backdrop-blur-sm rounded-lg p-1.5 text-xs space-y-0.5 border border-slate-700/50 min-w-max shadow-lg pointer-events-none">
                  <div className={`${worker.helmet === 'OK' ? 'text-emerald-400' : 'text-red-400'} flex items-center gap-1`}>
                    {worker.helmet === 'OK' ? '✓' : '✗'} Helmet {worker.helmet}
                  </div>
                  <div className={`${worker.vest === 'OK' ? 'text-emerald-400' : 'text-red-400'} flex items-center gap-1`}>
                    {worker.vest === 'OK' ? '✓' : '✗'} Vest {worker.vest}
                  </div>
                  {worker.gloves !== 'N/A' && (
                    <div className={`${worker.gloves === 'OK' ? 'text-emerald-400' : 'text-amber-400'} flex items-center gap-1`}>
                      {worker.gloves === 'OK' ? '✓' : '⚠'} Gloves {worker.gloves}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Mini Performance Overlay */}
        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md rounded-lg p-2 text-xs font-mono border border-slate-700/50 shadow-lg text-slate-300 space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className="opacity-70">FPS</span>
            <span className={isPlaying ? 'text-cyan-400 font-bold' : 'text-slate-500'}>{isPlaying ? '11.6' : '0.0'}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="opacity-70">Latency</span>
            <span className="text-emerald-400 font-bold">85ms</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="opacity-70">Backend</span>
            <span className="text-white">YOLO11 PT</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="opacity-70">Runtime</span>
            <span className="text-white">RTX 4060 GPU</span>
          </div>
        </div>

        {/* Timeline at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800">
          <div className="absolute top-0 bottom-0 left-0 w-3/4 bg-cyan-500/50" />
          <div className="absolute top-0 bottom-0 left-[25%] w-1 bg-red-500" />
          <div className="absolute top-0 bottom-0 left-[45%] w-1 bg-amber-500" />
          <div className="absolute top-0 bottom-0 left-[70%] w-1 bg-red-500" />
        </div>
      </div>

      <div className="border-t border-slate-700/50 p-4 bg-slate-900/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isPlaying ? 'Pause' : 'Resume'}
            </button>
            <button className="bg-slate-700/50 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm border border-slate-600/50">
              <Camera className="w-4 h-4" /> Snapshot
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-slate-800/80 rounded-lg p-1 border border-slate-700/50">
              {(['boxes', 'labels', 'confidence', 'path'] as const).map(key => (
                <button
                  key={key}
                  onClick={() => setOverlays(o => ({ ...o, [key]: !o[key] }))}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    overlays[key] ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}