import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { telemetry, PlayerScorer, PlayerSegment } from '../../telemetry';
import { Activity, Eye, Target, Brain, TrendingUp, AlertTriangle } from 'lucide-react';

interface TelemetryViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TelemetryViewer({ isOpen, onClose }: TelemetryViewerProps) {
  const [events, setEvents] = useState(telemetry.getStoredEvents());
  const [playerScore, setPlayerScore] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'events' | 'profile' | 'exposure'>('events');

  useEffect(() => {
    const interval = setInterval(() => {
      const newEvents = telemetry.getStoredEvents();
      setEvents(newEvents);
      
      // Calculate player score
      const scorer = new PlayerScorer(newEvents);
      setPlayerScore(scorer.calculateScore());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!isOpen) return null;

  const getSegmentEmoji = (segment: PlayerSegment) => {
    const emojis: Record<PlayerSegment, string> = {
      [PlayerSegment.MINNOW]: '🐟',
      [PlayerSegment.DOLPHIN]: '🐬',
      [PlayerSegment.TUNA]: '🐟',
      [PlayerSegment.WHALE]: '🐋',
      [PlayerSegment.KRAKEN]: '🦑',
    };
    return emojis[segment] || '❓';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gray-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-red-500/30"
      >
        {/* Header */}
        <div className="bg-red-900/20 border-b border-red-500/30 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye className="w-6 h-6 text-red-400" />
              <div>
                <h2 className="text-xl font-bold text-white">🔴 LIVE SURVEILLANCE DASHBOARD</h2>
                <p className="text-xs text-red-400">This is what game companies see about you</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            {(['events', 'profile', 'exposure'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {tab === 'events' && <Activity className="w-4 h-4 inline mr-2" />}
                {tab === 'profile' && <Target className="w-4 h-4 inline mr-2" />}
                {tab === 'exposure' && <AlertTriangle className="w-4 h-4 inline mr-2" />}
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[70vh]">
          {activeTab === 'events' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm text-gray-400 mb-3">
                <span>📡 {events.length} events collected</span>
                <button
                  onClick={() => telemetry.clearTelemetry()}
                  className="text-red-400 hover:text-red-300 text-xs"
                >
                  Clear Data
                </button>
              </div>
              <div className="space-y-1 font-mono text-xs">
                {events.slice(-50).reverse().map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-3 p-2 bg-gray-800/50 rounded border-l-2 border-red-500/50"
                  >
                    <span className="text-gray-500">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="text-red-400 font-semibold">{event.eventType}</span>
                    <span className="text-gray-400 truncate">
                      {Object.entries(event.metadata)
                        .filter(([k]) => !['userId', 'deviceInfo', 'gameVersion'].includes(k))
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(', ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'profile' && playerScore && (
            <div className="space-y-6">
              {/* Segment Badge */}
              <div className="bg-gray-800 p-4 rounded-xl text-center">
                <div className="text-6xl mb-2">{getSegmentEmoji(playerScore.segment)}</div>
                <div className="text-2xl font-bold text-white uppercase">{playerScore.segment}</div>
                <div className="text-sm text-gray-400 mt-1">
                  {playerScore.segment === PlayerSegment.MINNOW && 'Low value target'}
                  {playerScore.segment === PlayerSegment.DOLPHIN && 'Occasional spender - upsell candidate'}
                  {playerScore.segment === PlayerSegment.TUNA && 'High potential - whale grooming'}
                  {playerScore.segment === PlayerSegment.WHALE && 'High value target - VIP treatment'}
                  {playerScore.segment === PlayerSegment.KRAKEN && 'EXTREME VALUE - Priority #1'}
                </div>
              </div>

              {/* Scores */}
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(playerScore.categoryScores).map(([category, score]) => (
                  <div key={category} className="bg-gray-800 p-3 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-400 capitalize">{category}</span>
                      <span className="text-lg font-bold text-white">{score as number}/100</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          (score as number) > 70 ? 'bg-red-500' :
                          (score as number) > 40 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${score as number}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-800 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-gray-400">Predicted LTV</span>
                  </div>
                  <div className="text-2xl font-bold text-white">${playerScore.predictedLTV}</div>
                </div>
                <div className="bg-gray-800 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Brain className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-gray-400">Whale Probability</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{playerScore.whaleProbability}%</div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-5 h-5 text-red-400" />
                  <span className="font-bold text-red-400">SYSTEM RECOMMENDATIONS</span>
                </div>
                <ul className="space-y-2">
                  {playerScore.manipulationRecommendations.map((rec: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                      <span className="text-red-500">▸</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'exposure' && (
            <div className="space-y-4">
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                <h3 className="font-bold text-yellow-400 mb-3">🚨 What This Data Reveals About You</h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex gap-3">
                    <span className="text-yellow-500">📊</span>
                    <div>
                      <strong className="text-white">Tap patterns</strong>
                      <p className="text-gray-400">Every tap is logged with timing. Fast, repetitive tapping = frustration or compulsion. Slow, deliberate taps = decision points (prime for offers).</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-yellow-500">💰</span>
                    <div>
                      <strong className="text-white">Failed purchases</strong>
                      <p className="text-gray-400">When you try to buy but can't afford it, that's logged. You're flagged as having "purchase intent" and will see "starter offers" at $0.99.</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-yellow-500">🌙</span>
                    <div>
                      <strong className="text-white">Late night play</strong>
                      <p className="text-gray-400">Playing at 2 AM indicates loss of control. You'll get panic notifications about streaks breaking.</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-yellow-500">⏱️</span>
                    <div>
                      <strong className="text-white">Hesitation time</strong>
                      <p className="text-gray-400">Pausing before purchases = internal conflict. The system will hit you with discounts within 24 hours.</p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="font-bold text-white mb-2">🛡️ How to Protect Yourself</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• Use airplane mode to block real-time tracking</li>
                  <li>• Clear app data regularly to reset profiling</li>
                  <li>• Turn off personalized ads in system settings</li>
                  <li>• Set hard time limits before you start playing</li>
                  <li>• Never make purchases after 10 PM (impulse control is lowest)</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
