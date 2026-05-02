import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera, Play, Pause, Download, Upload,
  Activity, Wifi, WifiOff, AlertTriangle, Eye, EyeOff,
  LayoutGrid, Maximize2, Film, ZapOff,
} from 'lucide-react';
import { mockAlerts, cameras } from '../data';
import { toast } from 'sonner';

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface Detection {
  id: string;
  name: string;
  baseX: number;
  baseY: number;
  risk: 'Critical' | 'Warning' | 'Safe';
  helmet: 'OK' | 'Missing';
  vest: 'OK' | 'Missing';
  gloves: 'OK' | 'Missing' | 'N/A';
  conf: number;
  /** show only after this video-second */
  appearAt?: number;
  /** hide after this video-second */
  disappearAt?: number;
}

/* ─── Simulated detections (keyed to video timeline) ─────────────────────── */
const DETECTIONS: Detection[] = [
  { id: '01', name: 'Nguyen Van A', baseX: 55,  baseY: 100, risk: 'Critical', helmet: 'Missing', vest: 'OK',      gloves: 'N/A',     conf: 91, appearAt: 0  },
  { id: '04', name: 'Tran Thi B',  baseX: 270, baseY: 70,  risk: 'Safe',     helmet: 'OK',      vest: 'OK',      gloves: 'OK',      conf: 97, appearAt: 2  },
  { id: '07', name: 'Le Minh C',   baseX: 450, baseY: 130, risk: 'Warning',  helmet: 'OK',      vest: 'Missing', gloves: 'N/A',     conf: 88, appearAt: 4  },
  { id: '09', name: 'Pham Duc D',  baseX: 150, baseY: 190, risk: 'Safe',     helmet: 'OK',      vest: 'OK',      gloves: 'OK',      conf: 95, appearAt: 8,  disappearAt: 28 },
  { id: '12', name: 'Hoang Thi E', baseX: 360, baseY: 55,  risk: 'Critical', helmet: 'Missing', vest: 'Missing', gloves: 'Missing', conf: 89, appearAt: 12 },
];

const RISK_COLORS = {
  Critical: { border: 'border-red-500',    bg: 'bg-red-500/15',    label: 'bg-red-500',    text: 'text-red-400',    glow: 'shadow-[0_0_18px_rgba(239,68,68,0.45)]'    },
  Warning:  { border: 'border-amber-500',  bg: 'bg-amber-500/15',  label: 'bg-amber-500',  text: 'text-amber-400',  glow: 'shadow-[0_0_18px_rgba(245,158,11,0.45)]'  },
  Safe:     { border: 'border-emerald-500',bg: 'bg-emerald-500/15',label: 'bg-emerald-500',text: 'text-emerald-400',glow: 'shadow-[0_0_18px_rgba(16,185,129,0.35)]'  },
};

export function MonitorPage() {
  const [activeCam, setActiveCam]           = useState('cam03');
  const [selectedId, setSelectedId]         = useState<string | null>(null);
  const [showBoxes, setShowBoxes]           = useState(true);
  const [showLabels, setShowLabels]         = useState(true);
  const [showConf, setShowConf]             = useState(true);
  const [gridMode, setGridMode]             = useState(false);

  // ── Video state ──────────────────────────────────────────────────────────
  const [videoSrc, setVideoSrc]             = useState<string | null>(null);
  const [videoName, setVideoName]           = useState<string>('');
  const [isPlaying, setIsPlaying]           = useState(false);
  const [currentTime, setCurrentTime]       = useState(0);
  const [duration, setDuration]             = useState(0);
  const [fps, setFps]                       = useState(0);
  const [latency, setLatency]               = useState(0);
  const videoRef                            = useRef<HTMLVideoElement>(null);
  const fileInputRef                        = useRef<HTMLInputElement>(null);

  // Simulated inference metrics
  const fpsTimerRef = useRef<number | null>(null);
  const frameRef    = useRef(0);
  const lastTsRef   = useRef(0);

  const currentCam = cameras.find(c => c.id === activeCam) ?? cameras[0];
  const incidents  = mockAlerts.filter(a => a.camera === currentCam.label).slice(0, 5);

  /* ─── Video file selection ─────────────────────────────────────────────── */
  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('video/')) {
      toast.error('Unsupported format', { description: 'Please select an MP4, AVI, or MOV file.' });
      return;
    }
    if (videoSrc) URL.revokeObjectURL(videoSrc);
    const url = URL.createObjectURL(file);
    setVideoSrc(url);
    setVideoName(file.name);
    setCurrentTime(0);
    setIsPlaying(false);
    toast.success('Video loaded', { description: `${file.name} · Ready for PPE detection stream` });
  }, [videoSrc]);

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
    e.target.value = '';
  }

  function handleDropOnVideo(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  }

  /* ─── Playback sync ────────────────────────────────────────────────────── */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onTimeUpdate = () => setCurrentTime(v.currentTime);
    const onLoaded     = () => { setDuration(v.duration); v.play().then(() => setIsPlaying(true)); };
    const onPlay       = () => setIsPlaying(true);
    const onPause      = () => setIsPlaying(false);
    const onEnded      = () => { setIsPlaying(false); setCurrentTime(0); };

    v.addEventListener('timeupdate', onTimeUpdate);
    v.addEventListener('loadedmetadata', onLoaded);
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    v.addEventListener('ended', onEnded);
    return () => {
      v.removeEventListener('timeupdate', onTimeUpdate);
      v.removeEventListener('loadedmetadata', onLoaded);
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
      v.removeEventListener('ended', onEnded);
    };
  }, [videoSrc]);

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (isPlaying) v.pause(); else v.play();
  }

  function handleScrub(e: React.ChangeEvent<HTMLInputElement>) {
    const v = videoRef.current;
    if (!v) return;
    const t = parseFloat(e.target.value);
    v.currentTime = t;
    setCurrentTime(t);
  }

  function onSnapshot() {
    toast.success('Snapshot saved', { description: `${currentCam.label} @ ${fmtTime(currentTime)}` });
  }

  /* ─── Simulated FPS / latency counter ─────────────────────────────────── */
  useEffect(() => {
    if (!isPlaying) { setFps(0); return; }
    frameRef.current = 0;
    lastTsRef.current = performance.now();

    let raf: number;
    let count = 0;
    let last  = performance.now();

    const tick = (ts: number) => {
      count++;
      if (ts - last >= 1000) {
        setFps(count);
        setLatency(Math.floor(60 + Math.random() * 40));
        count = 0;
        last  = ts;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying]);

  /* ─── Compute animated detections ─────────────────────────────────────── */
  const activeDetections = DETECTIONS.filter(d => {
    const started  = d.appearAt    === undefined || currentTime >= d.appearAt;
    const notEnded = d.disappearAt === undefined || currentTime <  d.disappearAt;
    return started && notEnded;
  }).map((d, i) => {
    // Subtle jitter to simulate tracking
    const jx = Math.sin(currentTime * 0.6 + i * 1.3) * 6;
    const jy = Math.cos(currentTime * 0.4 + i * 0.9) * 4;
    return { ...d, x: d.baseX + jx, y: d.baseY + jy };
  });

  /* ─── Helpers ──────────────────────────────────────────────────────────── */
  function fmtTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  }

  /* ─── Render ───────────────────────────────────────────────────────────── */
  return (
    <div className="p-6">

      {/* Page Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Realtime Monitor</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {videoSrc
              ? `Streaming: ${videoName} · YOLO11 PPE Detection`
              : `Upload a video to begin AI-powered PPE detection stream`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setGridMode(g => !g)}
            className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors border ${
              gridMode
                ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                : 'bg-slate-800/50 text-slate-400 border-slate-700/50 hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="w-4 h-4" /> Grid View
          </button>
          {videoSrc && (
            <button
              onClick={togglePlay}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                isPlaying
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isPlaying ? 'Pause' : 'Resume'}
            </button>
          )}
        </div>
      </div>

      {/* ─── Grid View ─────────────────────────────────────────────────────── */}
      {gridMode ? (
        <div className="grid grid-cols-3 gap-4">
          {cameras.map(cam => (
            <div
              key={cam.id}
              onClick={() => { setActiveCam(cam.id); setGridMode(false); }}
              className={`bg-slate-800/30 border rounded-xl overflow-hidden cursor-pointer transition-all ${
                activeCam === cam.id ? 'border-cyan-500/50' : 'border-slate-700/50 hover:border-slate-600'
              }`}
            >
              <div className="relative aspect-video bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900">
                {cam.status === 'offline' ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <WifiOff className="w-8 h-8 text-slate-600" />
                    <span className="text-xs text-slate-500">Offline</span>
                  </div>
                ) : (
                  <div className="absolute inset-0 opacity-20" style={{
                    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,.04) 40px, rgba(255,255,255,.04) 41px)',
                  }} />
                )}
                <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/70 px-2 py-1 rounded text-xs">
                  <div className={`w-1.5 h-1.5 rounded-full ${cam.status === 'online' ? 'bg-red-500 animate-pulse' : cam.status === 'warning' ? 'bg-amber-500' : 'bg-slate-600'}`} />
                  <span className="text-slate-300 font-medium">{cam.label}</span>
                </div>
                <div className="absolute bottom-2 right-2 text-[10px] text-slate-400 font-mono bg-black/60 px-1.5 py-0.5 rounded">
                  {cam.fps > 0 ? `${cam.fps} FPS` : 'OFFLINE'}
                </div>
              </div>
              <div className="px-3 py-2 flex items-center justify-between">
                <span className="text-xs text-slate-400">{cam.location}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  cam.status === 'online'  ? 'bg-emerald-500/20 text-emerald-400' :
                  cam.status === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-slate-700 text-slate-500'
                }`}>{cam.status.toUpperCase()}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ─── Focused View ─────────────────────────────────────────────── */
        <div className="grid grid-cols-5 gap-5">

          {/* Camera / Source Selector */}
          <div className="col-span-1 space-y-2">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1 mb-3">Sources</div>

            {/* Upload Source */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                videoSrc
                  ? 'bg-cyan-500/15 border-cyan-500/40 text-slate-100'
                  : 'bg-slate-800/30 border-slate-700/50 text-slate-400 hover:text-slate-200 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold">Video Upload</span>
                <div className={`w-2 h-2 rounded-full ${videoSrc ? (isPlaying ? 'bg-cyan-400 animate-pulse' : 'bg-cyan-600') : 'bg-slate-600'}`} />
              </div>
              <div className="text-[10px] text-slate-500 mb-1 truncate max-w-[120px]">
                {videoSrc ? videoName : 'Click to load video'}
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono">
                <span className={isPlaying ? 'text-cyan-400' : 'text-slate-600'}>
                  {isPlaying ? `${fps} FPS` : videoSrc ? 'PAUSED' : 'NO VIDEO'}
                </span>
                {isPlaying && latency > 0 && <span className="text-slate-500">{latency}ms</span>}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleFileInputChange}
            />

            <div className="border-t border-slate-800 my-3 pt-3">
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-1 mb-2">Cameras (No Feed)</div>
              {cameras.map(cam => (
                <button
                  key={cam.id}
                  onClick={() => setActiveCam(cam.id)}
                  className={`w-full text-left p-2.5 rounded-lg border transition-all mb-1 ${
                    activeCam === cam.id
                      ? 'bg-slate-700/50 border-slate-600/50 text-slate-200'
                      : 'bg-slate-800/20 border-slate-700/30 text-slate-500 hover:text-slate-300 hover:border-slate-600/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium">{cam.label}</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                  </div>
                  <div className="text-[9px] text-slate-600 mt-0.5">{cam.location}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Main Video Feed */}
          <div className="col-span-3 flex flex-col gap-4">
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden">

              {/* Feed Header */}
              <div className="border-b border-slate-700/50 p-3 flex items-center justify-between bg-slate-900/40">
                <div className="flex items-center gap-3">
                  {videoSrc ? <Film className="w-4 h-4 text-cyan-400" /> : <Camera className="w-4 h-4 text-slate-500" />}
                  <span className="font-semibold text-sm">
                    {videoSrc ? videoName : 'No Video Source'}
                  </span>
                  {videoSrc && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-cyan-500/20 border border-cyan-500/30 rounded-full">
                      <div className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-cyan-400 animate-pulse' : 'bg-cyan-700'}`} />
                      <span className="text-[10px] text-cyan-400 font-semibold">
                        {isPlaying ? 'STREAMING' : 'PAUSED'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  {videoSrc ? (
                    <>
                      <span className="font-mono">{fmtTime(currentTime)}</span>
                      <span>/</span>
                      <span className="font-mono">{fmtTime(duration)}</span>
                      <span>·</span>
                      <span className={`font-mono ${isPlaying ? 'text-cyan-400' : 'text-slate-500'}`}>{isPlaying ? `${fps} FPS` : '0 FPS'}</span>
                    </>
                  ) : (
                    <span className="text-slate-600">Upload a video to stream</span>
                  )}
                </div>
              </div>

              {/* ── Video Area ───────────────────────────────────────────── */}
              <div
                className="relative bg-slate-950 aspect-video overflow-hidden"
                onDragOver={e => e.preventDefault()}
                onDrop={handleDropOnVideo}
              >

                {/* Actual video element */}
                {videoSrc && (
                  <video
                    ref={videoRef}
                    src={videoSrc}
                    className="absolute inset-0 w-full h-full object-contain"
                    playsInline
                    muted
                  />
                )}

                {/* No-video placeholder */}
                {!videoSrc && (
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center gap-4 cursor-pointer group"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-800/60 via-slate-900 to-slate-950" />
                    <div className="absolute inset-0 opacity-10" style={{
                      backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(255,255,255,.06) 50px, rgba(255,255,255,.06) 51px), repeating-linear-gradient(90deg, transparent, transparent 50px, rgba(255,255,255,.02) 50px, rgba(255,255,255,.02) 51px)',
                    }} />
                    <div className="relative z-10 text-center">
                      <div className="w-20 h-20 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto mb-4 group-hover:bg-cyan-500/20 group-hover:border-cyan-500/40 transition-all">
                        <Upload className="w-9 h-9 text-cyan-400/70 group-hover:text-cyan-400 transition-colors" />
                      </div>
                      <p className="text-slate-300 font-semibold mb-1">Upload Video to Stream</p>
                      <p className="text-slate-500 text-sm mb-4">Drop MP4 / AVI / MOV here, or click to browse</p>
                      <div className="flex items-center justify-center gap-3 text-xs text-slate-600">
                        <span>YOLO11 PPE Detection</span>
                        <span>·</span>
                        <span>RTX 4060 GPU</span>
                        <span>·</span>
                        <span>~14 FPS inference</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── PPE Detection Overlay Boxes ─────────────────────── */}
                {videoSrc && showBoxes && isPlaying && activeDetections.map(d => {
                  const isSelected = selectedId === d.id;
                  const c = RISK_COLORS[d.risk];
                  return (
                    <div
                      key={d.id}
                      onClick={() => setSelectedId(prev => prev === d.id ? null : d.id)}
                      className={`absolute border-2 rounded-lg cursor-pointer transition-[left,top] duration-75 ${c.border} ${c.bg} ${isSelected ? c.glow + ' z-20' : 'z-10 hover:brightness-125'}`}
                      style={{
                        left:   `${d.x}px`,
                        top:    `${d.y}px`,
                        width:  '112px',
                        height: '148px',
                        willChange: 'left, top',
                      }}
                    >
                      {showLabels && (
                        <>
                          {/* ID badge */}
                          <div className={`absolute -top-6 left-0 ${c.label} text-white px-2 py-0.5 rounded text-[11px] font-mono font-bold flex items-center gap-1.5 whitespace-nowrap shadow-lg`}>
                            <span>ID #{d.id}</span>
                            {showConf && <span className="opacity-80 text-[9px]">{d.conf}%</span>}
                          </div>

                          {/* PPE status popup */}
                          <div className="absolute top-1 -right-1 translate-x-full bg-slate-900/95 backdrop-blur-sm rounded-lg p-1.5 text-[10px] space-y-0.5 border border-slate-700/50 shadow-xl pointer-events-none min-w-max">
                            <div className={d.helmet === 'OK' ? 'text-emerald-400' : 'text-red-400'}>
                              {d.helmet === 'OK' ? '✓' : '✗'} Helmet
                            </div>
                            <div className={d.vest === 'OK' ? 'text-emerald-400' : 'text-red-400'}>
                              {d.vest === 'OK' ? '✓' : '✗'} Vest
                            </div>
                            {d.gloves !== 'N/A' && (
                              <div className={d.gloves === 'OK' ? 'text-emerald-400' : 'text-amber-400'}>
                                {d.gloves === 'OK' ? '✓' : '⚠'} Gloves
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      {/* Corner scan animation */}
                      {isPlaying && (
                        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
                          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-white/40 rounded-tl" />
                          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-white/40 rounded-tr" />
                          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-white/40 rounded-bl" />
                          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-white/40 rounded-br" />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Paused overlay (only when video loaded) */}
                {videoSrc && !isPlaying && (
                  <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center z-30 pointer-events-none">
                    <div className="bg-black/50 rounded-2xl px-8 py-4 flex flex-col items-center gap-2 border border-slate-700/40 backdrop-blur-sm">
                      <Pause className="w-10 h-10 text-slate-400" />
                      <p className="text-slate-400 text-sm font-medium">Detection Paused</p>
                    </div>
                  </div>
                )}

                {/* Performance HUD (only when video loaded) */}
                {videoSrc && (
                  <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md rounded-lg p-2.5 text-[11px] font-mono border border-slate-700/40 space-y-1 z-20">
                    {[
                      { k: 'FPS',     v: isPlaying ? `${fps}`       : '0',         c: isPlaying ? 'text-cyan-400' : 'text-slate-600' },
                      { k: 'Latency', v: isPlaying ? `${latency}ms` : '—',         c: isPlaying ? 'text-emerald-400' : 'text-slate-600' },
                      { k: 'Model',   v: 'YOLO11 PT',                               c: 'text-white'       },
                      { k: 'Runtime', v: 'RTX 4060',                                c: 'text-white'       },
                      { k: 'Workers', v: `${activeDetections.length} detected`,     c: 'text-cyan-300'    },
                    ].map(r => (
                      <div key={r.k} className="flex justify-between gap-5">
                        <span className="text-slate-500">{r.k}</span>
                        <span className={r.c}>{r.v}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Detection count badge */}
                {videoSrc && isPlaying && (
                  <div className="absolute top-3 right-3 bg-black/75 backdrop-blur-md rounded-lg px-3 py-1.5 text-[11px] font-mono border border-slate-700/40 z-20 flex items-center gap-2">
                    <Activity className="w-3 h-3 text-cyan-400" />
                    <span className="text-slate-300">{activeDetections.length} tracked</span>
                    {activeDetections.some(d => d.risk === 'Critical') && (
                      <span className="ml-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    )}
                  </div>
                )}

                {/* Timeline scrubber overlay */}
                {videoSrc && duration > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 z-30 px-0">
                    {/* Violation markers */}
                    <div className="relative h-5 mx-0">
                      {DETECTIONS.filter(d => d.risk === 'Critical' && d.appearAt !== undefined).map(d => (
                        <div
                          key={d.id}
                          className="absolute top-1 w-0.5 h-3 bg-red-500/70 rounded"
                          style={{ left: `${((d.appearAt ?? 0) / duration) * 100}%` }}
                          title={`Critical: Worker #${d.id}`}
                        />
                      ))}
                    </div>
                    {/* Scrubber */}
                    <div className="bg-slate-950/80 backdrop-blur-sm border-t border-slate-700/30 px-3 py-1.5 flex items-center gap-3">
                      <span className="text-[10px] font-mono text-slate-500 shrink-0">{fmtTime(currentTime)}</span>
                      <input
                        type="range"
                        min={0}
                        max={duration || 100}
                        step={0.1}
                        value={currentTime}
                        onChange={handleScrub}
                        className="flex-1 h-1 appearance-none bg-slate-700 rounded-full cursor-pointer accent-cyan-500"
                        style={{
                          background: `linear-gradient(to right, rgb(6,182,212) 0%, rgb(6,182,212) ${(currentTime / (duration || 1)) * 100}%, rgb(51,65,85) ${(currentTime / (duration || 1)) * 100}%, rgb(51,65,85) 100%)`
                        }}
                      />
                      <span className="text-[10px] font-mono text-slate-500 shrink-0">{fmtTime(duration)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="border-t border-slate-700/50 p-3 bg-slate-900/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {videoSrc ? (
                    <>
                      <button
                        onClick={togglePlay}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium ${
                          isPlaying
                            ? 'bg-cyan-500 hover:bg-cyan-600 text-white'
                            : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                        }`}
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        {isPlaying ? 'Pause' : 'Resume'}
                      </button>
                      <button onClick={onSnapshot} className="px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center gap-2 text-sm border border-slate-600/50 transition-colors">
                        <Camera className="w-4 h-4" /> Snapshot
                      </button>
                      <button className="px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center gap-2 text-sm border border-slate-600/50 transition-colors">
                        <Download className="w-4 h-4" /> Export
                      </button>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center gap-2 text-sm border border-slate-600/50 transition-colors"
                      >
                        <Upload className="w-4 h-4" /> Change Video
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-5 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg flex items-center gap-2 text-sm font-medium transition-colors shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                    >
                      <Upload className="w-4 h-4" /> Upload Video to Stream
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1 border border-slate-700/50">
                  {[
                    { key: 'boxes',  label: 'Boxes',  state: showBoxes,  toggle: () => setShowBoxes(v  => !v)  },
                    { key: 'labels', label: 'Labels', state: showLabels, toggle: () => setShowLabels(v => !v) },
                    { key: 'conf',   label: 'Conf',   state: showConf,   toggle: () => setShowConf(v   => !v)  },
                  ].map(o => (
                    <button
                      key={o.key}
                      onClick={o.toggle}
                      className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
                        o.state ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {o.state ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Incident / Worker Side Panel */}
          <div className="col-span-1 flex flex-col gap-4">

            {/* Selected Worker Card */}
            {selectedId && (() => {
              const d = activeDetections.find(w => w.id === selectedId);
              if (!d) return null;
              const c = RISK_COLORS[d.risk];
              return (
                <div className={`bg-slate-800/40 border rounded-xl p-4 ${c.border}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Detected Worker</span>
                    <button onClick={() => setSelectedId(null)} className="text-slate-500 hover:text-slate-300 text-xs">✕</button>
                  </div>
                  <div className={`font-mono text-lg font-bold ${c.text} mb-0.5`}>ID #{d.id}</div>
                  <div className="text-sm text-slate-300 mb-3">{d.name}</div>
                  <div className="space-y-1.5">
                    {[
                      { label: 'Helmet', val: d.helmet },
                      { label: 'Vest',   val: d.vest   },
                      { label: 'Gloves', val: d.gloves },
                    ].map(item => (
                      <div key={item.label} className="flex justify-between text-xs">
                        <span className="text-slate-500">{item.label}</span>
                        <span className={item.val === 'OK' ? 'text-emerald-400' : item.val === 'N/A' ? 'text-slate-600' : 'text-red-400'}>
                          {item.val}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between text-xs pt-1 border-t border-slate-700/50">
                      <span className="text-slate-500">Confidence</span>
                      <span className="text-cyan-400 font-mono">{d.conf}%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Risk Level</span>
                      <span className={c.text + ' font-semibold'}>{d.risk}</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Live Detections List */}
            {videoSrc && isPlaying && (
              <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden">
                <div className="p-3 border-b border-slate-700/50 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <span className="text-sm font-semibold text-slate-200">Active Detections</span>
                  <span className="ml-auto bg-cyan-500/20 text-cyan-400 text-[10px] font-mono px-2 py-0.5 rounded-full">{activeDetections.length}</span>
                </div>
                <div className="p-2 space-y-1.5 max-h-60 overflow-y-auto">
                  {activeDetections.map(d => {
                    const c = RISK_COLORS[d.risk];
                    return (
                      <button
                        key={d.id}
                        onClick={() => setSelectedId(prev => prev === d.id ? null : d.id)}
                        className={`w-full text-left p-2.5 rounded-lg border transition-all text-xs ${
                          selectedId === d.id
                            ? `${c.border} ${c.bg}`
                            : 'bg-slate-800/40 border-slate-700/40 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className={`font-mono font-bold ${c.text}`}>#{d.id}</span>
                          <span className={`text-[10px] font-semibold ${c.text}`}>{d.risk}</span>
                        </div>
                        <div className="text-slate-400 truncate">{d.name}</div>
                        <div className="flex gap-2 mt-1 text-[10px]">
                          <span className={d.helmet === 'OK' ? 'text-emerald-500' : 'text-red-500'}>H:{d.helmet}</span>
                          <span className={d.vest   === 'OK' ? 'text-emerald-500' : 'text-red-500'}>V:{d.vest}</span>
                          {d.gloves !== 'N/A' && <span className={d.gloves === 'OK' ? 'text-emerald-500' : 'text-amber-500'}>G:{d.gloves}</span>}
                          <span className="text-slate-600 ml-auto">{d.conf}%</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Incidents (when no video or paused) */}
            {(!videoSrc || !isPlaying) && (
              <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden flex-1">
                <div className="p-3 border-b border-slate-700/50 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-semibold text-slate-200">Incidents</span>
                  <span className="ml-auto text-[10px] text-slate-500">{currentCam.label}</span>
                </div>
                <div className="p-3 space-y-2 overflow-y-auto max-h-80">
                  {!videoSrc ? (
                    <div className="text-center py-8 text-slate-500 text-xs">
                      <ZapOff className="w-7 h-7 mx-auto mb-2 opacity-25" />
                      <p className="font-medium mb-1">No video source</p>
                      <p className="text-slate-600">Upload a video to detect PPE violations in real-time</p>
                    </div>
                  ) : incidents.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-xs">
                      <Wifi className="w-6 h-6 mx-auto mb-2 opacity-30" />
                      No incidents on this camera
                    </div>
                  ) : incidents.map(alert => (
                    <div
                      key={alert.id}
                      className={`p-2.5 rounded-lg border text-xs ${
                        alert.severity === 'Critical'
                          ? 'bg-red-500/10 border-red-500/30'
                          : 'bg-amber-500/10 border-amber-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-semibold ${alert.severity === 'Critical' ? 'text-red-400' : 'text-amber-400'}`}>
                          {alert.severity}
                        </span>
                        <span className="text-slate-500 font-mono">{alert.time}</span>
                      </div>
                      <div className="text-slate-300 font-medium">{alert.item}</div>
                      <div className="text-slate-500 mt-0.5">ID #{alert.trackingId} · {alert.confidence}% conf</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
