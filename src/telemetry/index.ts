/**
 * Telemetry Module
 * 
 * Demonstrates surveillance capitalism in mobile gaming.
 * All data stays local - this is for educational purposes only.
 */

export { TelemetryLogger, telemetry, useTelemetry } from './TelemetryLogger';
export { 
  TelemetryEventType, 
  TelemetryEvents,
  type TelemetryEvent, 
  type TelemetryMetadata,
  type DeviceInfo,
} from './events';
export { PlayerScorer, PlayerSegment, type PlayerScore, type PsychometricProfile } from './PlayerScorer';
