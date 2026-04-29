/**
 * Player Scoring & Whale Identification System
 * 
 * Analyzes telemetry data to calculate addiction scores,
 * predict Lifetime Value (LTV), and identify "whales" for
 * targeted monetization.
 * 
 * This demonstrates how games surveillance to maximize revenue.
 */

import { TelemetryEvent, TelemetryEventType } from './events';

export interface PlayerScore {
  totalScore: number;
  categoryScores: {
    engagement: number;     // 0-100
    monetization: number;   // 0-100
    addiction: number;        // 0-100
    social: number;         // 0-100
    churnRisk: number;      // 0-100 (higher = more likely to quit)
  };
  predictedLTV: number;     // Lifetime Value prediction in dollars
  whaleProbability: number; // 0-100
  segment: PlayerSegment;
  manipulationRecommendations: string[];
}

export enum PlayerSegment {
  MINNOW = 'minnow',       // Low engagement, no spend (bottom 70%)
  DOLPHIN = 'dolphin',     // Moderate engagement, occasional spend (next 20%)
  TUNA = 'tuna',          // High engagement, moderate spend (next 8%)
  WHALE = 'whale',        // High engagement, high spend (top 1.9%)
  KRAKEN = 'kraken',      // Extreme engagement, extreme spend (top 0.1%)
}

export interface PsychometricProfile {
  // Engagement patterns
  sessionFrequency: number[];  // Hours between sessions
  sessionDuration: number[];   // Minutes per session
  timeOfDay: number[];        // When they play (0-23)
  dayOfWeek: number[];        // 0-6
  
  // Addiction indicators
  streakPreservationAttempts: number;
  lateNightSessions: number;  // After midnight
  notificationResponseTime: number;  // Seconds
  
  // Monetization psychology
  priceAnchoring: number;     // Time spent viewing expensive items (ms)
  discountResponsiveness: number;  // 0-1 conversion rate
  scarcityResponse: boolean;  // Buys limited time offers?
  
  // Social psychology
  socialComparisonFrequency: number;  // Leaderboard checks per session
  competitionDrive: number;  // Response to rank changes
  
  // Loss aversion
  churnRiskMoments: number;  // Times they almost quit
  recoveryOffersAccepted: number;
  sunkCostAcknowledgment: boolean;  // Views stats/investment screens
}

export class PlayerScorer {
  private events: TelemetryEvent[];
  private profile: PsychometricProfile;
  
  constructor(events: TelemetryEvent[]) {
    this.events = events;
    this.profile = this.buildPsychometricProfile();
  }
  
  /**
   * Calculate complete player score
   */
  calculateScore(): PlayerScore {
    const engagement = this.scoreEngagement();
    const monetization = this.scoreMonetization();
    const addiction = this.scoreAddiction();
    const social = this.scoreSocial();
    const churnRisk = this.scoreChurnRisk();
    
    const totalScore = (engagement + monetization + addiction + social) / 4;
    
    const predictedLTV = this.predictLTV(totalScore);
    const whaleProbability = this.calculateWhaleProbability(monetization);
    const segment = this.classifySegment(whaleProbability, engagement, monetization);
    
    return {
      totalScore,
      categoryScores: {
        engagement,
        monetization,
        addiction,
        social,
        churnRisk,
      },
      predictedLTV,
      whaleProbability,
      segment,
      manipulationRecommendations: this.generateRecommendations(segment, churnRisk),
    };
  }
  
  /**
   * Build psychometric profile from telemetry
   */
  private buildPsychometricProfile(): PsychometricProfile {
    const sessions = this.extractSessions();
    
    return {
      sessionFrequency: this.calculateSessionGaps(sessions),
      sessionDuration: sessions.map(s => s.duration),
      timeOfDay: sessions.map(s => s.startHour),
      dayOfWeek: sessions.map(s => s.dayOfWeek),
      
      streakPreservationAttempts: this.countEvent(TelemetryEventType.STREAK_AT_RISK),
      lateNightSessions: sessions.filter(s => s.startHour < 6 || s.startHour > 23).length,
      notificationResponseTime: this.calculateNotificationResponse(),
      
      priceAnchoring: this.calculatePriceAnchoring(),
      discountResponsiveness: this.calculateDiscountConversion(),
      scarcityResponse: this.hasScarcityPurchases(),
      
      socialComparisonFrequency: this.countEvent(TelemetryEventType.LEADERBOARD_VIEWED) / sessions.length,
      competitionDrive: this.calculateCompetitionDrive(),
      
      churnRiskMoments: this.countEvent(TelemetryEventType.APP_BACKGROUND),
      recoveryOffersAccepted: this.countEvent(TelemetryEventType.REWARD_CLAIMED),
      sunkCostAcknowledgment: this.countEvent(TelemetryEventType.SESSION_END) > 0,
    };
  }
  
  /**
   * Score engagement (0-100)
   */
  private scoreEngagement(): number {
    let score = 0;
    const profile = this.profile;
    
    // Session frequency (more frequent = higher score)
    if (profile.sessionFrequency.length > 0) {
      const avgGap = average(profile.sessionFrequency);
      if (avgGap < 1) score += 25;
      else if (avgGap < 4) score += 20;
      else if (avgGap < 12) score += 15;
      else if (avgGap < 24) score += 10;
    }
    
    // Session duration
    if (profile.sessionDuration.length > 0) {
      const avgDuration = average(profile.sessionDuration);
      if (avgDuration > 60) score += 25;
      else if (avgDuration > 30) score += 20;
      else if (avgDuration > 10) score += 15;
    }
    
    // Consistency (coefficient of variation)
    if (profile.sessionFrequency.length > 1) {
      const cv = coefficientOfVariation(profile.sessionFrequency);
      const consistency = Math.max(0, 1 - cv) * 25;
      score += consistency;
    }
    
    // Time diversity (playing at different times = more hooked)
    const uniqueHours = new Set(profile.timeOfDay).size;
    score += Math.min(uniqueHours * 2, 25);
    
    return Math.min(score, 100);
  }
  
  /**
   * Score monetization potential (0-100)
   */
  private scoreMonetization(): number {
    let score = 0;
    const profile = this.profile;
    
    // Price anchoring behavior
    if (profile.priceAnchoring > 5000) score += 20;
    else if (profile.priceAnchoring > 2000) score += 15;
    
    // Discount responsiveness
    score += profile.discountResponsiveness * 30;
    
    // Scarcity response
    if (profile.scarcityResponse) score += 25;
    
    // Recovery offers (indicates price sensitivity)
    score += Math.min(profile.recoveryOffersAccepted * 5, 25);
    
    return Math.min(score, 100);
  }
  
  /**
   * Score addiction indicators (0-100)
   */
  private scoreAddiction(): number {
    let score = 0;
    const profile = this.profile;
    
    // Streak preservation (major addiction signal)
    score += Math.min(profile.streakPreservationAttempts * 10, 30);
    
    // Late night play (loss of control)
    score += Math.min(profile.lateNightSessions * 5, 25);
    
    // Notification addiction
    if (profile.notificationResponseTime < 60) score += 20;
    else if (profile.notificationResponseTime < 300) score += 15;
    
    // Churn recovery (tried to quit but came back)
    score += Math.min(profile.churnRiskMoments * 5, 25);
    
    return Math.min(score, 100);
  }
  
  /**
   * Score social factors (0-100)
   */
  private scoreSocial(): number {
    let score = 0;
    const profile = this.profile;
    
    // Leaderboard checks
    if (profile.socialComparisonFrequency > 5) score += 30;
    else if (profile.socialComparisonFrequency > 2) score += 20;
    else if (profile.socialComparisonFrequency > 0) score += 10;
    
    // Competition drive
    score += Math.min(profile.competitionDrive * 35, 35);
    
    // Achievement hunting
    const achievements = this.countEvent(TelemetryEventType.ACHIEVEMENT_UNLOCKED);
    score += Math.min(achievements * 5, 35);
    
    return Math.min(score, 100);
  }
  
  /**
   * Calculate churn risk (0-100, higher = more likely to quit)
   */
  private scoreChurnRisk(): number {
    let risk = 0;
    
    // Long gap since last session
    const lastSession = Math.max(...this.events.map(e => e.timestamp), 0);
    const hoursSinceLastSession = (Date.now() - lastSession) / (1000 * 60 * 60);
    
    if (hoursSinceLastSession > 48) risk += 40;
    else if (hoursSinceLastSession > 24) risk += 25;
    else if (hoursSinceLastSession > 12) risk += 10;
    
    // Multiple failed purchases (frustration)
    const failedPurchases = this.countEvent(TelemetryEventType.UPGRADE_FAILED);
    risk += Math.min(failedPurchases * 5, 20);
    
    // Dismissing crates (reduced interest)
    const dismissedCrates = this.countEvent(TelemetryEventType.CRATE_DISMISSED);
    risk += Math.min(dismissedCrates * 3, 15);
    
    // Hesitation increasing (decision fatigue)
    const hesitations = this.countEvent(TelemetryEventType.HESITATION);
    risk += Math.min(hesitations * 2, 15);
    
    return Math.min(risk, 100);
  }
  
  /**
   * Predict Lifetime Value
   */
  private predictLTV(totalScore: number): number {
    // Simplified LTV formula based on engagement and addiction
    // In reality, this uses ML models trained on millions of users
    
    const baseLTV = 0;
    const engagementMultiplier = totalScore / 10;
    const addictionBonus = this.profile.lateNightSessions * 2;
    const monetizationScore = this.scoreMonetization();
    
    // Conversion to dollar estimate
    // High engagement + high monetization signals = $50-500 LTV
    const estimatedLTV = baseLTV + engagementMultiplier + addictionBonus + (monetizationScore * 2);
    
    return Math.floor(Math.max(estimatedLTV, 0));
  }
  
  /**
   * Calculate probability of becoming a whale
   */
  private calculateWhaleProbability(monetizationScore: number): number {
    const engagement = this.scoreEngagement();
    const addiction = this.scoreAddiction();
    
    // Whale formula: High engagement + high addiction + monetization intent
    const probability = (
      engagement * 0.3 +
      addiction * 0.3 +
      monetizationScore * 0.4
    );
    
    return Math.min(probability, 100);
  }
  
  /**
   * Classify player into segment
   */
  private classifySegment(
    whaleProbability: number,
    engagement: number,
    monetization: number
  ): PlayerSegment {
    if (whaleProbability > 90 && engagement > 80) return PlayerSegment.KRAKEN;
    if (whaleProbability > 70) return PlayerSegment.WHALE;
    if (engagement > 60 && monetization > 40) return PlayerSegment.TUNA;
    if (engagement > 40 || monetization > 20) return PlayerSegment.DOLPHIN;
    return PlayerSegment.MINNOW;
  }
  
  /**
   * Generate manipulation recommendations
   */
  private generateRecommendations(segment: PlayerSegment, churnRisk: number): string[] {
    const recommendations: string[] = [];
    
    if (churnRisk > 60) {
      recommendations.push('Deploy streak preservation notification');
      recommendations.push('Offer recovery bonus with 200% production boost');
    }
    
    if (segment === PlayerSegment.DOLPHIN && churnRisk < 40) {
      recommendations.push('Show premium shop preview (whale upgrade path)');
      recommendations.push('Create artificial scarcity for viewed item');
      recommendations.push('Deploy "starter" $0.99 offer to establish payment habit');
    }
    
    if (segment === PlayerSegment.TUNA) {
      recommendations.push('Deploy scarcity alert for limited-time item');
      recommendations.push('Show social proof: "3 friends purchased this"');
      recommendations.push('Offer bundle with "best value" tag');
    }
    
    if (segment === PlayerSegment.WHALE || segment === PlayerSegment.KRAKEN) {
      recommendations.push('Deploy exclusive VIP offer (high price, high value)');
      recommendations.push('Show leaderboard position threat (someone catching up)');
      recommendations.push('Offer prestige/ascension system unlock');
    }
    
    if (this.profile.lateNightSessions > 3) {
      recommendations.push('Late night player: Deploy streak panic at 11:30 PM');
    }
    
    return recommendations;
  }
  
  /**
   * Helper: Count events of specific type
   */
  private countEvent(eventType: TelemetryEventType): number {
    return this.events.filter(e => e.eventType === eventType).length;
  }
  
  /**
   * Helper: Extract sessions from events
   */
  private extractSessions(): SessionInfo[] {
    const sessions: SessionInfo[] = [];
    const sessionStarts = this.events.filter(e => e.eventType === TelemetryEventType.SESSION_START);
    
    for (const start of sessionStarts) {
      const end = this.events.find(e => 
        e.eventType === TelemetryEventType.SESSION_END && 
        e.sessionId === start.sessionId
      );
      
      const date = new Date(start.timestamp);
      
      sessions.push({
        startTime: start.timestamp,
        endTime: end?.timestamp || start.timestamp + 60000, // Default 1 min if no end
        duration: end ? (end.timestamp - start.timestamp) / 60000 : 1,
        startHour: date.getHours(),
        dayOfWeek: date.getDay(),
      });
    }
    
    return sessions;
  }
  
  /**
   * Helper: Calculate gaps between sessions
   */
  private calculateSessionGaps(sessions: SessionInfo[]): number[] {
    const gaps: number[] = [];
    for (let i = 1; i < sessions.length; i++) {
      const gap = (sessions[i].startTime - sessions[i - 1].endTime) / (1000 * 60 * 60);
      gaps.push(gap);
    }
    return gaps;
  }
  
  /**
   * Helper: Calculate notification response time
   */
  private calculateNotificationResponse(): number {
    // Simplified - would track actual notification events
    return 120; // Default 2 minutes
  }
  
  /**
   * Helper: Calculate price anchoring
   */
  private calculatePriceAnchoring(): number {
    // Time spent viewing premium shop
    const shopViews = this.events.filter(e => e.eventType === TelemetryEventType.PREMIUM_SHOP_VIEWED);
    return shopViews.length * 5000; // Assume 5 seconds per view
  }
  
  /**
   * Helper: Calculate discount conversion rate
   */
  private calculateDiscountConversion(): number {
    const offersShown = this.countEvent(TelemetryEventType.OFFER_SHOWN);
    const offersConverted = this.countEvent(TelemetryEventType.OFFER_CONVERSION);
    return offersShown > 0 ? offersConverted / offersShown : 0;
  }
  
  /**
   * Helper: Check for scarcity purchases
   */
  private hasScarcityPurchases(): boolean {
    return this.countEvent(TelemetryEventType.PURCHASE_COMPLETED) > 0 &&
           this.countEvent(TelemetryEventType.OFFER_SHOWN) > 0;
  }
  
  /**
   * Helper: Calculate competition drive
   */
  private calculateCompetitionDrive(): number {
    const rankChecks = this.countEvent(TelemetryEventType.RANK_CHECKED);
    return Math.min(rankChecks / 10, 1); // Normalize to 0-1
  }
}

// Helper interfaces
interface SessionInfo {
  startTime: number;
  endTime: number;
  duration: number;
  startHour: number;
  dayOfWeek: number;
}

// Helper functions
function average(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function coefficientOfVariation(arr: number[]): number {
  if (arr.length < 2) return 0;
  const avg = average(arr);
  if (avg === 0) return 0;
  const variance = arr.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / arr.length;
  const stdDev = Math.sqrt(variance);
  return stdDev / avg;
}

export { average, coefficientOfVariation };
