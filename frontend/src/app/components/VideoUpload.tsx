import { Upload, FileVideo, Activity, Download, HardDrive } from 'lucide-react';

export function VideoUpload({
  uploadState,
  setUploadState,
}: {
  uploadState: string;
  setUploadState: (s: string) => void;
}) {
  return (
    <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-xl p-8 mb-6">
      {uploadState === 'empty' && (
        <div 
          onClick={() => setUploadState('uploading')}
          className="border-2 border-dashed border-slate-600 rounded-xl p-12 text-center hover:border-cyan-500/50 transition-colors cursor-pointer bg-slate-900/30 group"
        >
          <div className="w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-cyan-500/20 transition-colors">
            <Upload className="w-8 h-8 text-cyan-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2 text-slate-200">Upload Video for Analysis</h3>
          <p className="text-slate-400 text-sm mb-6">Drop MP4, AVI, or MOV files for realtime PPE detection (Max 500MB)</p>
          <button className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2.5 rounded-lg transition-colors font-medium shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_20px_rgba(6,182,212,0.5)]">
            Select File
          </button>
        </div>
      )}

      {uploadState === 'uploading' && (
        <div className="border border-slate-600 rounded-xl p-8 text-center bg-slate-900/30">
          <div className="w-16 h-16 bg-cyan-500/10 rounded-xl flex items-center justify-center mx-auto mb-4 border border-cyan-500/30 animate-pulse">
            <FileVideo className="w-8 h-8 text-cyan-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2 text-slate-200">site_a_cam03_1900.mp4</h3>
          <p className="text-slate-400 text-sm mb-6">Uploading to inference server...</p>
          
          <div className="w-full max-w-md mx-auto">
            <div className="flex justify-between text-xs text-slate-400 mb-2 font-mono">
              <span>74%</span>
              <span>120MB / 162MB</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 w-[74%] rounded-full relative">
                <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite] bg-[length:200%_100%]" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)' }} />
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex justify-center gap-4">
            <button className="text-slate-400 hover:text-slate-200 px-4 py-2 text-sm font-medium transition-colors" onClick={() => setUploadState('empty')}>
              Cancel
            </button>
            <button className="bg-cyan-500/20 text-cyan-400 px-6 py-2 rounded-lg text-sm font-medium transition-colors border border-cyan-500/30" onClick={() => setUploadState('processing')}>
              Simulate Upload Complete
            </button>
          </div>
        </div>
      )}

      {uploadState === 'processing' && (
        <div className="border border-slate-600 rounded-xl p-8 text-center bg-slate-900/30">
          <div className="w-16 h-16 bg-amber-500/10 rounded-xl flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
            <Activity className="w-8 h-8 text-amber-400 animate-spin" />
          </div>
          <h3 className="text-lg font-semibold mb-2 text-slate-200">Processing Realtime Preview</h3>
          <div className="flex items-center justify-center gap-6 text-sm text-slate-400 mb-6 font-mono bg-slate-950 inline-flex mx-auto px-4 py-2 rounded-lg border border-slate-800">
            <span>Processed: 420/1800 frames</span>
            <span className="w-1 h-1 bg-slate-600 rounded-full" />
            <span className="text-cyan-400">14.2 FPS</span>
            <span className="w-1 h-1 bg-slate-600 rounded-full" />
            <span className="text-emerald-400">Latency: 88ms</span>
          </div>
          
          <div className="w-full max-w-md mx-auto">
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 w-[23%] rounded-full relative transition-all duration-500">
                <div className="absolute inset-0 bg-white/20 animate-[shimmer_1s_infinite] bg-[length:200%_100%]" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)' }} />
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex justify-center gap-4">
            <button className="text-slate-400 hover:text-slate-200 px-4 py-2 text-sm font-medium transition-colors" onClick={() => setUploadState('empty')}>
              Cancel
            </button>
            <button className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors shadow-[0_0_15px_rgba(245,158,11,0.3)]" onClick={() => setUploadState('completed')}>
              Skip to Completed
            </button>
          </div>
        </div>
      )}

      {uploadState === 'completed' && (
        <div className="border border-slate-600 rounded-xl p-8 text-center bg-emerald-500/5">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
            <HardDrive className="w-8 h-8 text-emerald-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2 text-slate-200">Analysis Completed</h3>
          <p className="text-slate-400 text-sm mb-6">18 violations detected across 1,800 frames.</p>
          
          <div className="flex justify-center gap-4">
            <button className="bg-slate-700/50 hover:bg-slate-700 text-slate-300 px-6 py-2.5 rounded-lg transition-colors font-medium flex items-center gap-2 border border-slate-600/50" onClick={() => setUploadState('empty')}>
              Process Another Video
            </button>
            <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-lg transition-colors font-medium flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)]">
              <Download className="w-5 h-5" /> Download Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
