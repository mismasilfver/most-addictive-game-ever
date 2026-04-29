/**
 * Telemetry Logger Service
 * 
 * Collects, batches, and stores user behavior data for addiction analysis.
 * Demonstrates how mobile games track everything to maximize engagement.
 */

import { TelemetryEvent, TelemetryEventType, TelemetryMetadata, DeviceInfo } from './events';

const APP_VERSION = '1.0.0';
const BATCH_SIZE = 50;
const FLUSH_INTERVAL = 30000; // 30 seconds
const STORAGE_KEY = 'faux_telemetry_v1';
const MAX_STORED_EVENTS = 1000;

export class TelemetryLogger {
  private buffer: TelemetryEvent[] = [];
  private sessionId: string;
  private userId: string;
  private flushTimer: number | null = null;
  private isRecording: boolean = true;
  
  constructor() {
    this.sessionId = this.generateSessionId();
    this.userId = this.getOrCreateUserId();
    this.startFlushTimer();
    
    // Log session start
    this.logEvent(TelemetryEventType.SESSION_START, {
      screen: 'app_launch',
    });
    
    // Setup visibility change listener
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.logEvent(TelemetryEventType.APP_BACKGROUND);
        } else {
          this.logEvent(TelemetryEventType.APP_FOREGROUND);
        }
      });
    }
    
    // Log session end on unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.logEvent(TelemetryEventType.SESSION_END);
        this.flush();
      });
    }
  }
  
  /**
   * Log a telemetry event
   */
  logEvent(eventType: TelemetryEventType, metadata: Partial<TelemetryMetadata> = {}): void {
    if (!this.isRecording) return;
    
    const event: TelemetryEvent = {
      id: this.generateUUID(),
      timestamp: Date.now(),
      sessionId: this.sessionId,
      eventType,
      metadata: {
        userId: this.userId,
        deviceInfo: this.getDeviceInfo(),
        gameVersion: APP_VERSION,
        ...metadata,
      },
    };
    
    this.buffer.push(event);
    
    // Flush if buffer is full
    if (this.buffer.length >= BATCH_SIZE) {
      this.flush();
    }
  }
  
  /**
   * Log high-frequency events at a sampled rate to reduce overhead
   */
  logSampledEvent(
    eventType: TelemetryEventType,
    metadata: Partial<TelemetryMetadata> = {},
    sampleRate: number = 0.1
  ): void {
    if (Math.random() < sampleRate) {
      this.logEvent(eventType, metadata);
    }
  }
  
  /**
   * Log tap events with coordinates for heatmap analysis
   */
  logTap(x: number, y: number, screen: string): void {
    this.logEvent(TelemetryEventType.TAPS_PER_MINUTE, {
      screen,
      // In a real app, would include precise coordinates
    });
  }
  
  /**
   * Log rage taps (multiple taps in same area = frustration)
   */
  logRageTap(coordinates: { x: number; y: number }, tapCount: number): void {
    this.logEvent(TelemetryEventType.RAGE_TAP, {
      tapCount,
    });
  }
  
  /**
   * Log hesitation (pause before action = decision point)
   */
  logHesitation(screen: string, action: string, startTime: number): void {
    const duration = Date.now() - startTime;
    if (duration > 500) { // Only log if hesitated more than 500ms
      this.logEvent(TelemetryEventType.HESITATION, {
        screen,
        hesitationTime: duration,
      });
    }
  }
  
  /**
   * Log purchase funnel events
   */
  logPurchaseFunnel(
    stage: 'initiated' | 'abandoned' | 'completed',
    offerId: string,
    price: number,
    timeInFunnel?: number
  ): void {
    const eventType = {
      initiated: TelemetryEventType.PURCHASE_INITIATED,
      abandoned: TelemetryEventType.PURCHASE_ABANDONED,
      completed: TelemetryEventType.PURCHASE_COMPLETED,
    }[stage];
    
    this.logEvent(eventType, {
      offerId,
      offerPrice: price,
      timeToConversion: timeInFunnel,
    });
  }
  
  /**
   * Get all stored telemetry events (for demo dashboard)
   */
  getStoredEvents(): TelemetryEvent[] {
    if (typeof localStorage === 'undefined') return [];
    
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }
  
  /**
   * Clear all telemetry data
   */
  clearTelemetry(): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
    this.buffer = [];
  }
  
  /**
   * Enable/disable recording
   */
  setRecording(enabled: boolean): void {
    this.isRecording = enabled;
  }
  
  /**
   * Flush buffer to storage
   */
  flush(): void {
    if (this.buffer.length === 0) return;
    if (typeof localStorage === 'undefined') return;
    
    const batch = [...this.buffer];
    this.buffer = [];
    
    // Store locally for demo visualization
    const existing = this.getStoredEvents();
    const updated = [...existing, ...batch].slice(-MAX_STORED_EVENTS);
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      // Storage full, clear and retry
      this.clearTelemetry();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(batch));
    }
  }
  
  /**
   * Start automatic flush timer
   */
  private startFlushTimer(): void {
    if (typeof window === 'undefined') return;
    
    this.flushTimer = window.setInterval(() => {
      this.flush();
    }, FLUSH_INTERVAL);
  }
  
  /**
   * Get or create persistent user ID
   */
  private getOrCreateUserId(): string {
    if (typeof localStorage === 'undefined') return 'anonymous';
    
    const key = 'faux_user_id';
    let userId = localStorage.getItem(key);
    
    if (!userId) {
      userId = this.generateUUID();
      localStorage.setItem(key, userId);
    }
    
    return userId;
  }
  
  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Generate UUID
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  
  /**
   * Get device information
   */
  private getDeviceInfo(): DeviceInfo {
    return {
      platform: 'web',
      screenSize: typeof window !== 'undefined' 
        ? { width: window.innerWidth, height: window.innerHeight }
        : { width: 0, height: 0 },
      language: typeof navigator !== 'undefined' ? navigator.language : 'en',
      timezone: typeof Intl !== 'undefined' 
        ? Intl.DateTimeFormat().resolvedOptions().timeZone 
        : 'UTC',
    };
  }
}

// Singleton instance
export const telemetry = new TelemetryLogger();

// React Hook for components
export function useTelemetry() {
  return {
    logEvent: (eventType: TelemetryEventType, metadata?: Partial<TelemetryMetadata>) => {
      telemetry.logEvent(eventType, metadata);
    },
    logTap: (x: number, y: number, screen: string) => {
      telemetry.logTap(x, y, screen);
    },
    logHesitation: (screen: string, action: string, startTime: number) => {
      telemetry.logHesitation(screen, action, startTime);
    },
  };
}
