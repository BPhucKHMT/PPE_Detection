import { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, AlertCircle, CheckCircle2, Clock, FileVideo, Gauge, Play, ShieldAlert, Square, Timer, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL } from '../config';
import {
  DetectionStreamClient,
  type StreamAlertPayload,
  type StreamMessage,
  type StreamTrackPayload,
} from '../services/streamSocket';
import { uploadVideo } from '../services/uploadApi';

type StreamStatus = 'idle' | 'uploading' | 'streaming' | 'completed' | 'failed';

function formatMs(value: number) {
  return `${value.toFixed(1)} ms`;
}

function formatSec(value: number) {
  return `${value.toFixed(1)} s`;
}

export function UploadPage() {
  const [status, setStatus] = useState<StreamStatus>('idle');
  const [fileName, setFileName] = useState('');
  const [processedFrames, setProcessedFrames] = useState(0);
  const [frameSrc, setFrameSrc] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [streamElapsedSec, setStreamElapsedSec] = useState(0);
  const [effectiveFps, setEffectiveFps] = useState(0);
  const [avgInterFrameMs, setAvgInterFrameMs] = useState(0);
  const [lastFrameDeltaMs, setLastFrameDeltaMs] = useState(0);
  const [tracks, setTracks] = useState<StreamTrackPayload[]>([]);
  const [alerts, setAlerts] = useState<StreamAlertPayload[]>([]);

  const streamClientRef = useRef<DetectionStreamClient | null>(null);
  const streamStartAtRef = useRef<number | null>(null);
  const lastFrameAtRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      streamClientRef.current?.close();
      streamClientRef.current = null;
    };
  }, []);

  const statusBadge = useMemo(() => {
    if (status === 'streaming') return { text: 'Streaming', color: 'text-cyan-300 bg-cyan-500/20' };
    if (status === 'uploading') return { text: 'Uploading', color: 'text-amber-300 bg-amber-500/20' };
    if (status === 'completed') return { text: 'Completed', color: 'text-emerald-300 bg-emerald-500/20' };
    if (status === 'failed') return { text: 'Failed', color: 'text-red-300 bg-red-500/20' };
    return { text: 'Idle', color: 'text-slate-300 bg-slate-700/40' };
  }, [status]);

  function resetMetrics() {
    setProcessedFrames(0);
    setStreamElapsedSec(0);
    setEffectiveFps(0);
    setAvgInterFrameMs(0);
    setLastFrameDeltaMs(0);
    setTracks([]);
    setAlerts([]);
    streamStartAtRef.current = null;
    lastFrameAtRef.current = null;
  }

  function stopDetection() {
    console.debug('[UploadPage] stopDetection called', { currentStatus: status, jobId });
    streamClientRef.current?.close();
    streamClientRef.current = null;
    setStatus('idle');
    setJobId(null);
  }

  function handleStreamMessage(message: StreamMessage) {
    console.debug('[UploadPage] stream message', { type: message.type });

    if (message.type === 'frame') {
      const now = performance.now();
      if (streamStartAtRef.current === null) {
        streamStartAtRef.current = now;
      }

      const previousFrameAt = lastFrameAtRef.current;
      if (previousFrameAt !== null) {
        const deltaMs = now - previousFrameAt;
        setLastFrameDeltaMs(deltaMs);
      }
      lastFrameAtRef.current = now;

      const nextProcessedFrames = message.processed_frames ?? 0;
      const measuredElapsedMs = Math.max(now - streamStartAtRef.current, 0);
      const measuredElapsedSec = measuredElapsedMs / 1000;
      const measuredFps = measuredElapsedSec > 0 ? nextProcessedFrames / measuredElapsedSec : 0;
      const avgMs = nextProcessedFrames > 0 ? measuredElapsedMs / nextProcessedFrames : 0;

      setFrameSrc(`data:image/jpeg;base64,${message.frame}`);
      setProcessedFrames(nextProcessedFrames);
      setStreamElapsedSec(measuredElapsedSec);
      setEffectiveFps(measuredFps);
      setAvgInterFrameMs(avgMs);
      setTracks(message.tracks ?? []);
      if (message.alerts && message.alerts.length > 0) {
        setAlerts((prev) => [...message.alerts!, ...prev].slice(0, 20));
      }

      console.debug('[UploadPage] frame rendered', {
        frame_index: message.frame_index,
        processed_frames: nextProcessedFrames,
        frame_length: message.frame?.length ?? 0,
        tracks: message.tracks?.length ?? 0,
        alerts: message.alerts?.length ?? 0,
        measuredElapsedSec,
      });
      return;
    }

    if (message.type === 'done') {
      console.warn('[UploadPage] stream done', message);
      setStatus('completed');
      toast.success('Streaming hoàn tất');
      streamClientRef.current?.close();
      streamClientRef.current = null;
      return;
    }

    setStatus('failed');
    setErrorMessage(message.message ?? 'Streaming error');
    console.error('[UploadPage] stream error message', message);
  }

  async function startDetection() {
    if (!selectedFile) {
      toast.error('Vui lòng chọn video trước');
      return;
    }

    console.debug('[UploadPage] startDetection', {
      apiBase: API_BASE_URL,
      fileName: selectedFile.name,
      fileSize: selectedFile.size,
      fileType: selectedFile.type,
    });

    setStatus('uploading');
    setErrorMessage(null);
    setFrameSrc(null);
    resetMetrics();

    streamClientRef.current?.close();
    streamClientRef.current = null;

    try {
      const payload = await uploadVideo(selectedFile);
      console.debug('[UploadPage] upload success', payload);
      setJobId(payload.job_id);
      setStatus('streaming');

      const client = new DetectionStreamClient(
        API_BASE_URL,
        payload.job_id,
        {
          onMessage: handleStreamMessage,
          onError: (message) => {
            console.error('[UploadPage] stream callback onError', message);
            setStatus('failed');
            setErrorMessage(message);
          },
          onClose: () => {
            console.warn('[UploadPage] stream callback onClose');
            streamClientRef.current = null;
          },
        },
        3,
      );

      streamClientRef.current = client;
      client.connect();
    } catch (error) {
      console.error('[UploadPage] startDetection failed', error);
      setStatus('failed');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Realtime Video Detection</h1>
          <p className="text-sm text-slate-400">Upload video và stream kết quả detection realtime bằng WebSocket.</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge.color}`}>{statusBadge.text}</span>
      </div>

      <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-5 space-y-4">
        <label className="block text-sm text-slate-300">Video file</label>
        <input
          id="upload-video-input"
          type="file"
          accept="video/*"
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            setSelectedFile(file);
            setFileName(file?.name ?? '');
          }}
          className="block w-full text-sm text-slate-200 file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-500/20 file:px-4 file:py-2 file:text-cyan-200 hover:file:bg-cyan-500/30"
        />

        {fileName && (
          <div className="text-sm text-slate-300 flex items-center gap-2">
            <FileVideo className="w-4 h-4 text-cyan-300" />
            {fileName}
          </div>
        )}

        <div className="flex gap-3">
          <button
            id="start-detection-btn"
            onClick={startDetection}
            disabled={status === 'uploading' || status === 'streaming'}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 disabled:opacity-60 text-white"
          >
            <Play className="w-4 h-4" /> Start
          </button>
          <button
            id="stop-detection-btn"
            onClick={stopDetection}
            disabled={status !== 'streaming'}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-60 text-slate-100"
          >
            <Square className="w-4 h-4" /> Stop
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-700/60 rounded-2xl p-3 min-h-[340px] flex items-center justify-center">
          {frameSrc ? (
            <img id="stream-frame-preview" src={frameSrc} alt="Detection stream frame" className="rounded-xl max-h-[500px] w-full object-contain" />
          ) : (
            <div className="text-slate-500 text-sm flex items-center gap-2">
              <Upload className="w-4 h-4" /> Chưa có frame stream
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
            <div className="text-xs text-slate-500 mb-1">Processed Frames</div>
            <div className="text-2xl font-bold text-cyan-300">{processedFrames}</div>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
            <div className="text-xs text-slate-500 mb-2">Streaming Metrics</div>
            <div className="text-sm text-slate-300 space-y-2">
              <div className="flex items-center gap-2"><Gauge className="w-4 h-4 text-cyan-300" /> Stream FPS (measured): {effectiveFps.toFixed(2)}</div>
              <div className="flex items-center gap-2"><Timer className="w-4 h-4 text-amber-300" /> Avg frame latency: {formatMs(avgInterFrameMs)}</div>
              <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-blue-300" /> Last frame delta: {formatMs(lastFrameDeltaMs)}</div>
              <div className="flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-300" /> Stream elapsed: {formatSec(streamElapsedSec)}</div>
            </div>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
            <div className="text-xs text-slate-500 mb-2">Status Details</div>
            <div className="text-sm text-slate-300 space-y-2">
              <div className="flex items-center gap-2"><Activity className="w-4 h-4 text-cyan-300" /> Job: {jobId ?? '-'}</div>
              <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-amber-300" /> Tracks: {tracks.length}</div>
              <div className="flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-red-300" /> Alerts: {alerts.length}</div>
              {status === 'completed' && <div className="flex items-center gap-2 text-emerald-300"><CheckCircle2 className="w-4 h-4" /> Completed</div>}
              {errorMessage && <div className="flex items-center gap-2 text-red-300"><AlertCircle className="w-4 h-4" /> {errorMessage}</div>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-slate-900/40 border border-slate-700/50 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-slate-200 mb-3">Live Tracks</h3>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {tracks.length === 0 ? (
              <div className="text-xs text-slate-500">Chưa có track.</div>
            ) : (
              tracks.map((track) => (
                <div key={`${track.track_id}`} className="rounded-lg border border-slate-700/60 bg-slate-800/40 p-2 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span className="font-mono text-cyan-300">ID #{track.track_id}</span>
                    <span>{track.violation?.state ?? 'NORMAL'}</span>
                  </div>
                  <div className="text-slate-400 mt-1">missing: {(track.violation?.missing_items ?? []).join(', ') || 'none'}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-700/50 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-slate-200 mb-3">Live Alerts</h3>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="text-xs text-slate-500">Chưa có alert.</div>
            ) : (
              alerts.map((alert) => (
                <div key={alert.alert_id} className="rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-xs text-slate-200">
                  <div className="flex justify-between">
                    <span className="font-semibold">{alert.code}</span>
                    <span className="uppercase text-red-300">{alert.severity}</span>
                  </div>
                  <div className="text-slate-300 mt-1">Track #{alert.track_id} · {alert.current_duration_ms} ms</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
