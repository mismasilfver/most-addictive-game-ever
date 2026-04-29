import { describe, it, expect, beforeEach } from 'vitest';
import { PlayerScorer, PlayerSegment } from './PlayerScorer';
import { TelemetryEvent, TelemetryEventType } from './events';

describe('PlayerScorer', () => {
  let mockEvents: TelemetryEvent[];
  
  beforeEach(() => {
    // Create mock telemetry events
    const sessionId = 'test-session-1';
    const userId = 'test-user';
    const baseTime = Date.now();
    
    mockEvents = [
      {
        id: '1',
        timestamp: baseTime,
        sessionId,
        eventType: TelemetryEventType.SESSION_START,
        metadata: { userId, deviceInfo: { platform: 'web', screenSize: { width: 1000, height: 800 }, language: 'en', timezone: 'UTC' }, gameVersion: '1.0.0' },
      },
      {
        id: '2',
        timestamp: baseTime + 60000, // 1 minute later
        sessionId,
        eventType: TelemetryEventType.SESSION_END,
        metadata: { userId, deviceInfo: { platform: 'web', screenSize: { width: 1000, height: 800 }, language: 'en', timezone: 'UTC' }, gameVersion: '1.0.0' },
      },
    ];
  });

  describe('calculateScore', () => {
    it('returns a complete player score', () => {
      const scorer = new PlayerScorer(mockEvents);
      const score = scorer.calculateScore();
      
      expect(score.totalScore).toBeDefined();
      expect(score.totalScore).toBeGreaterThanOrEqual(0);
      expect(score.totalScore).toBeLessThanOrEqual(100);
      
      expect(score.categoryScores).toBeDefined();
      expect(score.categoryScores.engagement).toBeDefined();
      expect(score.categoryScores.monetization).toBeDefined();
      expect(score.categoryScores.addiction).toBeDefined();
      expect(score.categoryScores.social).toBeDefined();
      expect(score.categoryScores.churnRisk).toBeDefined();
    });

    it('calculates engagement score based on session patterns', () => {
      // Add multiple sessions for engagement calculation
      const sessionId2 = 'test-session-2';
      const baseTime = Date.now();
      
      const multipleSessions: TelemetryEvent[] = [
        ...mockEvents,
        {
          id: '3',
          timestamp: baseTime + 3600000, // 1 hour later
          sessionId: sessionId2,
          eventType: TelemetryEventType.SESSION_START,
          metadata: { userId: 'test-user', deviceInfo: { platform: 'web', screenSize: { width: 1000, height: 800 }, language: 'en', timezone: 'UTC' }, gameVersion: '1.0.0' },
        },
        {
          id: '4',
          timestamp: baseTime + 4200000, // 10 minutes duration
          sessionId: sessionId2,
          eventType: TelemetryEventType.SESSION_END,
          metadata: { userId: 'test-user', deviceInfo: { platform: 'web', screenSize: { width: 1000, height: 800 }, language: 'en', timezone: 'UTC' }, gameVersion: '1.0.0' },
        },
      ];
      
      const scorer = new PlayerScorer(multipleSessions);
      const score = scorer.calculateScore();
      
      expect(score.categoryScores.engagement).toBeGreaterThan(0);
    });

    it('classifies player into a segment', () => {
      const scorer = new PlayerScorer(mockEvents);
      const score = scorer.calculateScore();
      
      expect(score.segment).toBeDefined();
      expect(Object.values(PlayerSegment)).toContain(score.segment);
    });

    it('predicts LTV', () => {
      const scorer = new PlayerScorer(mockEvents);
      const score = scorer.calculateScore();
      
      expect(score.predictedLTV).toBeDefined();
      expect(score.predictedLTV).toBeGreaterThanOrEqual(0);
    });

    it('calculates whale probability', () => {
      const scorer = new PlayerScorer(mockEvents);
      const score = scorer.calculateScore();
      
      expect(score.whaleProbability).toBeDefined();
      expect(score.whaleProbability).toBeGreaterThanOrEqual(0);
      expect(score.whaleProbability).toBeLessThanOrEqual(100);
    });

    it('generates manipulation recommendations', () => {
      const scorer = new PlayerScorer(mockEvents);
      const score = scorer.calculateScore();
      
      expect(score.manipulationRecommendations).toBeDefined();
      expect(Array.isArray(score.manipulationRecommendations)).toBe(true);
    });
  });

  describe('player segmentation', () => {
    it('classifies as MINNOW for low engagement', () => {
      // Minimal events = low engagement
      const scorer = new PlayerScorer(mockEvents);
      const score = scorer.calculateScore();
      
      expect(score.segment).toBe(PlayerSegment.MINNOW);
    });

    it('classifies based on calculated scores', () => {
      // Add monetization signals
      const monetizationEvents: TelemetryEvent[] = [
        ...mockEvents,
        {
          id: '5',
          timestamp: Date.now(),
          sessionId: 'test-session-1',
          eventType: TelemetryEventType.PURCHASE_COMPLETED,
          metadata: { userId: 'test-user', deviceInfo: { platform: 'web', screenSize: { width: 1000, height: 800 }, language: 'en', timezone: 'UTC' }, gameVersion: '1.0.0', offerId: 'offer_1', offerPrice: 9.99 },
        },
        {
          id: '6',
          timestamp: Date.now(),
          sessionId: 'test-session-1',
          eventType: TelemetryEventType.LEADERBOARD_VIEWED,
          metadata: { userId: 'test-user', deviceInfo: { platform: 'web', screenSize: { width: 1000, height: 800 }, language: 'en', timezone: 'UTC' }, gameVersion: '1.0.0' },
        },
        {
          id: '7',
          timestamp: Date.now(),
          sessionId: 'test-session-1',
          eventType: TelemetryEventType.ACHIEVEMENT_UNLOCKED,
          metadata: { userId: 'test-user', deviceInfo: { platform: 'web', screenSize: { width: 1000, height: 800 }, language: 'en', timezone: 'UTC' }, gameVersion: '1.0.0', achievementId: 'first_building' },
        },
      ];
      
      const scorer = new PlayerScorer(monetizationEvents);
      const score = scorer.calculateScore();
      
      // Should classify into one of the valid segments
      expect(Object.values(PlayerSegment)).toContain(score.segment);
      
      // Should have higher whale probability with purchase signals
      expect(score.whaleProbability).toBeGreaterThan(0);
    });
  });

  describe('churn risk detection', () => {
    it('detects high churn risk after long absence', () => {
      // Events from 3 days ago
      const oldEvents: TelemetryEvent[] = [
        {
          id: '1',
          timestamp: Date.now() - (3 * 24 * 60 * 60 * 1000), // 3 days ago
          sessionId: 'old-session',
          eventType: TelemetryEventType.SESSION_START,
          metadata: { userId: 'test-user', deviceInfo: { platform: 'web', screenSize: { width: 1000, height: 800 }, language: 'en', timezone: 'UTC' }, gameVersion: '1.0.0' },
        },
        {
          id: '2',
          timestamp: Date.now() - (3 * 24 * 60 * 60 * 1000) + 60000,
          sessionId: 'old-session',
          eventType: TelemetryEventType.SESSION_END,
          metadata: { userId: 'test-user', deviceInfo: { platform: 'web', screenSize: { width: 1000, height: 800 }, language: 'en', timezone: 'UTC' }, gameVersion: '1.0.0' },
        },
      ];
      
      const scorer = new PlayerScorer(oldEvents);
      const score = scorer.calculateScore();
      
      // Should have high churn risk after 3 days
      expect(score.categoryScores.churnRisk).toBeGreaterThan(30);
    });

    it('generates recommendations based on profile', () => {
      // Add some activity signals
      const activityEvents: TelemetryEvent[] = [
        ...mockEvents,
        {
          id: '8',
          timestamp: Date.now(),
          sessionId: 'test-session-1',
          eventType: TelemetryEventType.APP_BACKGROUND,
          metadata: { userId: 'test-user', deviceInfo: { platform: 'web', screenSize: { width: 1000, height: 800 }, language: 'en', timezone: 'UTC' }, gameVersion: '1.0.0' },
        },
      ];
      
      const scorer = new PlayerScorer(activityEvents);
      const score = scorer.calculateScore();
      
      // Should generate manipulation recommendations
      expect(score.manipulationRecommendations).toBeDefined();
      expect(Array.isArray(score.manipulationRecommendations)).toBe(true);
    });
  });

  describe('whale targeting', () => {
    it('identifies whale candidates with purchase intent signals', () => {
      // Add price anchoring behavior
      const whaleSignals: TelemetryEvent[] = [
        ...mockEvents,
        {
          id: '11',
          timestamp: Date.now(),
          sessionId: 'test-session-1',
          eventType: TelemetryEventType.PREMIUM_SHOP_VIEWED,
          metadata: { userId: 'test-user', deviceInfo: { platform: 'web', screenSize: { width: 1000, height: 800 }, language: 'en', timezone: 'UTC' }, gameVersion: '1.0.0' },
        },
        {
          id: '12',
          timestamp: Date.now(),
          sessionId: 'test-session-1',
          eventType: TelemetryEventType.OFFER_SHOWN,
          metadata: { userId: 'test-user', deviceInfo: { platform: 'web', screenSize: { width: 1000, height: 800 }, language: 'en', timezone: 'UTC' }, gameVersion: '1.0.0', offerId: 'premium_1' },
        },
        {
          id: '13',
          timestamp: Date.now(),
          sessionId: 'test-session-1',
          eventType: TelemetryEventType.OFFER_CONVERSION,
          metadata: { userId: 'test-user', deviceInfo: { platform: 'web', screenSize: { width: 1000, height: 800 }, language: 'en', timezone: 'UTC' }, gameVersion: '1.0.0', offerId: 'premium_1', timeToConversion: 5000 },
        },
      ];
      
      const scorer = new PlayerScorer(whaleSignals);
      const score = scorer.calculateScore();
      
      // Should have higher whale probability with purchase signals
      expect(score.whaleProbability).toBeGreaterThan(0);
      
      // Should recommend whale upgrade strategies
      const hasWhaleRecommendation = score.manipulationRecommendations.some(
        r => r.toLowerCase().includes('whale') || 
             r.toLowerCase().includes('vip') || 
             r.toLowerCase().includes('scarcity') ||
             r.toLowerCase().includes('premium')
      );
      expect(hasWhaleRecommendation).toBeTruthy();
    });
  });

  describe('addiction detection', () => {
    it('detects late night play patterns', () => {
      // Create late night sessions (3 AM)
      const lateNightDate = new Date();
      lateNightDate.setHours(3, 0, 0, 0);
      
      const lateNightEvents: TelemetryEvent[] = [
        {
          id: '14',
          timestamp: lateNightDate.getTime(),
          sessionId: 'late-session',
          eventType: TelemetryEventType.SESSION_START,
          metadata: { userId: 'test-user', deviceInfo: { platform: 'web', screenSize: { width: 1000, height: 800 }, language: 'en', timezone: 'UTC' }, gameVersion: '1.0.0' },
        },
        {
          id: '15',
          timestamp: lateNightDate.getTime() + 300000, // 5 min session
          sessionId: 'late-session',
          eventType: TelemetryEventType.SESSION_END,
          metadata: { userId: 'test-user', deviceInfo: { platform: 'web', screenSize: { width: 1000, height: 800 }, language: 'en', timezone: 'UTC' }, gameVersion: '1.0.0' },
        },
      ];
      
      const scorer = new PlayerScorer(lateNightEvents);
      const score = scorer.calculateScore();
      
      // Late night play should increase addiction score
      expect(score.categoryScores.addiction).toBeGreaterThan(0);
    });
  });
});
