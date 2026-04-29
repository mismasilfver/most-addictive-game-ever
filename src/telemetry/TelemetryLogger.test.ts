import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TelemetryLogger, telemetry } from './TelemetryLogger';
import { TelemetryEventType } from './events';

describe('TelemetryLogger', () => {
  let logger: TelemetryLogger;
  
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    logger = new TelemetryLogger();
    logger.flush(); // Flush the initial session_start event
  });
  
  afterEach(() => {
    logger.setRecording(false); // Stop recording to prevent interference
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('creates a session ID on init', () => {
      const events = logger.getStoredEvents();
      const sessionStart = events.find(e => e.eventType === TelemetryEventType.SESSION_START);
      expect(sessionStart).toBeDefined();
      expect(sessionStart?.sessionId).toBeDefined();
    });

    it('creates or retrieves persistent user ID', () => {
      const events = logger.getStoredEvents();
      const sessionStart = events.find(e => e.eventType === TelemetryEventType.SESSION_START);
      expect(sessionStart?.metadata.userId).toBeDefined();
      expect(sessionStart?.metadata.userId).not.toBe('anonymous');
    });

    it('includes device info in events', () => {
      const events = logger.getStoredEvents();
      const sessionStart = events.find(e => e.eventType === TelemetryEventType.SESSION_START);
      expect(sessionStart?.metadata.deviceInfo).toBeDefined();
      expect(sessionStart?.metadata.deviceInfo.platform).toBe('web');
    });

    it('includes game version in events', () => {
      const events = logger.getStoredEvents();
      const sessionStart = events.find(e => e.eventType === TelemetryEventType.SESSION_START);
      expect(sessionStart?.metadata.gameVersion).toBe('1.0.0');
    });
  });

  describe('logEvent', () => {
    it('adds event to buffer', () => {
      logger.logEvent(TelemetryEventType.SCREEN_VIEW, { screen: 'test' });
      logger.flush(); // Ensure it's stored
      
      const events = logger.getStoredEvents();
      const screenView = events.find(e => e.eventType === TelemetryEventType.SCREEN_VIEW);
      expect(screenView).toBeDefined();
      expect(screenView?.metadata.screen).toBe('test');
    });

    it('generates unique event IDs', () => {
      logger.logEvent(TelemetryEventType.SCREEN_VIEW, { screen: 'test1' });
      logger.logEvent(TelemetryEventType.SCREEN_VIEW, { screen: 'test2' });
      logger.flush();
      
      const events = logger.getStoredEvents();
      const screenViews = events.filter(e => e.eventType === TelemetryEventType.SCREEN_VIEW);
      expect(screenViews.length).toBe(2);
      expect(screenViews[0].id).not.toBe(screenViews[1].id);
    });

    it('includes timestamp in events', () => {
      const beforeTime = Date.now();
      logger.logEvent(TelemetryEventType.SCREEN_VIEW);
      logger.flush();
      const afterTime = Date.now();
      
      const events = logger.getStoredEvents();
      const screenView = events.find(e => e.eventType === TelemetryEventType.SCREEN_VIEW);
      expect(screenView?.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(screenView?.timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('merges metadata correctly', () => {
      logger.logEvent(TelemetryEventType.BUILDING_PURCHASED, {
        buildingId: 'smelter',
        cost: 100,
      });
      logger.flush();
      
      const events = logger.getStoredEvents();
      const purchase = events.find(e => e.eventType === TelemetryEventType.BUILDING_PURCHASED);
      expect(purchase?.metadata.buildingId).toBe('smelter');
      expect(purchase?.metadata.cost).toBe(100);
      expect(purchase?.metadata.userId).toBeDefined(); // Still includes default metadata
    });
  });

  describe('logSampledEvent', () => {
    it('logs event when sample rate is 1', () => {
      logger.logSampledEvent(TelemetryEventType.TAPS_PER_MINUTE, {}, 1);
      logger.flush();
      
      const events = logger.getStoredEvents();
      const tapEvent = events.find(e => e.eventType === TelemetryEventType.TAPS_PER_MINUTE);
      expect(tapEvent).toBeDefined();
    });

    it('does not log event when sample rate is 0', () => {
      logger.logSampledEvent(TelemetryEventType.TAPS_PER_MINUTE, {}, 0);
      logger.flush();
      
      const events = logger.getStoredEvents();
      // Should only have the initial session_start event
      const tapEvent = events.find(e => e.eventType === TelemetryEventType.TAPS_PER_MINUTE);
      expect(tapEvent).toBeUndefined();
    });
  });

  describe('logTap', () => {
    it('logs tap event with screen', () => {
      logger.logTap(100, 200, 'building_grid');
      logger.flush();
      
      const events = logger.getStoredEvents();
      const tapEvent = events.find(e => e.eventType === TelemetryEventType.TAPS_PER_MINUTE);
      expect(tapEvent).toBeDefined();
      expect(tapEvent?.metadata.screen).toBe('building_grid');
    });
  });

  describe('logRageTap', () => {
    it('logs rage tap with tap count', () => {
      logger.logRageTap({ x: 100, y: 200 }, 5);
      logger.flush();
      
      const events = logger.getStoredEvents();
      const rageEvent = events.find(e => e.eventType === TelemetryEventType.RAGE_TAP);
      expect(rageEvent).toBeDefined();
      expect(rageEvent?.metadata.tapCount).toBe(5);
    });
  });

  describe('logHesitation', () => {
    it('logs hesitation only if duration > 500ms', () => {
      const startTime = Date.now();
      
      // Mock Date.now to simulate 600ms hesitation
      vi.spyOn(Date, 'now').mockReturnValueOnce(startTime + 600);
      
      logger.logHesitation('shop', 'purchase', startTime);
      logger.flush();
      
      const events = logger.getStoredEvents();
      const hesitation = events.find(e => e.eventType === TelemetryEventType.HESITATION);
      expect(hesitation).toBeDefined();
      expect(hesitation?.metadata.hesitationTime).toBe(600);
    });

    it('does not log hesitation if duration <= 500ms', () => {
      const startTime = Date.now();
      
      // Mock Date.now to simulate 300ms hesitation
      vi.spyOn(Date, 'now').mockReturnValueOnce(startTime + 300);
      
      logger.logHesitation('shop', 'purchase', startTime);
      logger.flush();
      
      const events = logger.getStoredEvents();
      const hesitation = events.find(e => e.eventType === TelemetryEventType.HESITATION);
      expect(hesitation).toBeUndefined();
    });
  });

  describe('logPurchaseFunnel', () => {
    it('logs purchase initiated', () => {
      logger.logPurchaseFunnel('initiated', 'offer_1', 9.99);
      logger.flush();
      
      const events = logger.getStoredEvents();
      const initiated = events.find(e => e.eventType === TelemetryEventType.PURCHASE_INITIATED);
      expect(initiated).toBeDefined();
      expect(initiated?.metadata.offerId).toBe('offer_1');
      expect(initiated?.metadata.offerPrice).toBe(9.99);
    });

    it('logs purchase abandoned', () => {
      logger.logPurchaseFunnel('abandoned', 'offer_1', 9.99, 5000);
      logger.flush();
      
      const events = logger.getStoredEvents();
      const abandoned = events.find(e => e.eventType === TelemetryEventType.PURCHASE_ABANDONED);
      expect(abandoned).toBeDefined();
      expect(abandoned?.metadata.timeToConversion).toBe(5000);
    });

    it('logs purchase completed', () => {
      logger.logPurchaseFunnel('completed', 'offer_1', 9.99, 3000);
      logger.flush();
      
      const events = logger.getStoredEvents();
      const completed = events.find(e => e.eventType === TelemetryEventType.PURCHASE_COMPLETED);
      expect(completed).toBeDefined();
      expect(completed?.metadata.offerId).toBe('offer_1');
    });
  });

  describe('storage management', () => {
    it('stores events in localStorage', () => {
      logger.logEvent(TelemetryEventType.SCREEN_VIEW, { screen: 'test' });
      logger.flush(); // Force flush
      
      const stored = localStorage.getItem('faux_telemetry_v1');
      expect(stored).toBeDefined();
      
      const parsed = JSON.parse(stored || '[]');
      expect(parsed.length).toBeGreaterThan(0);
    });

    it('limits stored events to 1000', () => {
      // Clear any existing events first
      logger.clearTelemetry();
      
      // Log more than 1000 events
      for (let i = 0; i < 1100; i++) {
        logger.logEvent(TelemetryEventType.SCREEN_VIEW, { screen: `test_${i}` });
      }
      logger.flush();
      
      const stored = logger.getStoredEvents();
      expect(stored.length).toBeLessThanOrEqual(1000);
    });

    it('clears telemetry when clearTelemetry called', () => {
      logger.logEvent(TelemetryEventType.SCREEN_VIEW);
      logger.flush();
      
      logger.clearTelemetry();
      
      const stored = logger.getStoredEvents();
      expect(stored).toHaveLength(0);
    });
  });

  describe('setRecording', () => {
    it('stops recording when disabled', () => {
      logger.setRecording(false);
      logger.logEvent(TelemetryEventType.SCREEN_VIEW);
      logger.flush();
      
      const events = logger.getStoredEvents();
      // Should only have the initial session_start from beforeEach
      const screenViews = events.filter(e => e.eventType === TelemetryEventType.SCREEN_VIEW);
      expect(screenViews.length).toBe(0);
    });

    it('resumes recording when enabled', () => {
      logger.setRecording(false);
      logger.logEvent(TelemetryEventType.SCREEN_VIEW);
      
      logger.setRecording(true);
      logger.logEvent(TelemetryEventType.SCREEN_VIEW);
      logger.flush();
      
      const events = logger.getStoredEvents();
      const screenViews = events.filter(e => e.eventType === TelemetryEventType.SCREEN_VIEW);
      expect(screenViews.length).toBe(1);
    });
  });

  describe('singleton export', () => {
    it('exports singleton telemetry instance', () => {
      expect(telemetry).toBeDefined();
      expect(telemetry).toBeInstanceOf(TelemetryLogger);
    });
  });
});
