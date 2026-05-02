import { WS_BASE_URL } from '../config';

export interface StreamTrackPayload {
  track_id: number;
  bbox_xyxy: number[];
  hits?: number;
  age?: number;
  missed?: number;
  ppe_status?: {
    helmet_present: boolean;
    helmet_worn: boolean;
    safety_vest: boolean;
    gloves: boolean;
    shoes: boolean;
  };
  violation?: {
    is_violating: boolean;
    missing_items: string[];
    duration_ms: number;
    state: string;
  };
}

export interface StreamAlertPayload {
  alert_id: string;
  track_id: number;
  severity: 'high' | 'critical' | string;
  code: string;
  message: string;
  started_at_ms: number;
  current_duration_ms: number;
}

export interface StreamFrameMessage {
  type: 'frame';
  frame: string;
  processed_frames: number;
  frame_index: number;
  timestamp_ms: number;
  source_fps: number;
  output_fps: number;
  boxes_before_filter: number;
  boxes_after_filter: number;
  detections: Array<{
    class_id: number;
    class_name: string;
    confidence: number;
    bbox_xyxy: number[];
  }>;
  tracks?: StreamTrackPayload[];
  alerts?: StreamAlertPayload[];
}

export interface StreamDoneMessage {
  type: 'done';
  reason?: string;
}

export interface StreamErrorMessage {
  type: 'error';
  message?: string;
}

export type StreamMessage = StreamFrameMessage | StreamDoneMessage | StreamErrorMessage;

interface StreamCallbacks {
  onMessage: (message: StreamMessage) => void;
  onError: (message: string) => void;
  onClose: () => void;
}

export class DetectionStreamClient {
  private socket: WebSocket | null = null;
  private retries = 0;
  private closedManually = false;

  constructor(
    private readonly apiBaseUrl: string,
    private readonly jobId: string,
    private readonly callbacks: StreamCallbacks,
    private readonly maxRetries: number = 3,
  ) {}

  connect() {
    this.closedManually = false;
    const wsUrl = `${WS_BASE_URL}/detect/stream/${this.jobId}`;
    console.debug('[streamSocket] connecting', { wsUrl, retries: this.retries });

    const ws = new WebSocket(wsUrl);
    this.socket = ws;

    ws.onopen = () => {
      console.debug('[streamSocket] connected', { wsUrl, jobId: this.jobId });
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as StreamMessage;
        if (data.type === 'frame') {
          console.debug('[streamSocket] frame', {
            frame_index: data.frame_index,
            processed_frames: data.processed_frames,
            detections: data.detections?.length ?? 0,
            tracks: data.tracks?.length ?? 0,
            alerts: data.alerts?.length ?? 0,
          });
        } else {
          console.debug('[streamSocket] control message', data);
        }
        this.callbacks.onMessage(data);
      } catch (error) {
        console.error('[streamSocket] invalid stream message', error, event.data);
        this.callbacks.onError('Invalid stream message');
      }
    };

    ws.onerror = (event) => {
      console.error('[streamSocket] websocket error', event);
      this.callbacks.onError('WebSocket connection error');
    };

    ws.onclose = (event) => {
      console.warn('[streamSocket] closed', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
        closedManually: this.closedManually,
        retries: this.retries,
      });

      this.socket = null;
      if (!this.closedManually && this.retries < this.maxRetries) {
        this.retries += 1;
        const delayMs = 400 * this.retries;
        window.setTimeout(() => this.connect(), delayMs);
        return;
      }
      this.callbacks.onClose();
    };
  }

  close() {
    this.closedManually = true;
    this.retries = 0;
    if (this.socket) {
      console.debug('[streamSocket] closing manually', { jobId: this.jobId });
      this.socket.close();
      this.socket = null;
    }
  }
}
