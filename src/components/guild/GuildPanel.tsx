import { motion } from 'framer-motion';
import { useGuildStore } from '../../stores/guildStore';
import { useGameStore } from '../../stores/gameStore';
import { Users, Trophy, AlertTriangle, TrendingUp, Zap } from 'lucide-react';
import { formatNumber } from '../../types/resource';
import { getGuildTier } from '../../types/guild';

export function GuildPanel() {
  const { guild, activityFeed, joinGuild, contribute, getKickWarning, getGuildProgressPercent } = useGuildStore();
  const resources = useGameStore(state => state.resources);

  const kickWarning = getKickWarning();
  const progressPct = getGuildProgressPercent();

  const handleContribute = () => {
    const amount = Math.floor(resources.ore.amount * 0.1);
    if (amount < 100) return;
    contribute(amount);
    useGameStore.getState().spendResources('ore', amount);
  };

  if (!guild) {
    return (
      <div className="bg-bg-card rounded-2xl p-6 text-center">
        <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-accent" />
        </div>
        <h3 className="text-xl font-bold text-text-primary mb-2">Join a Guild</h3>
        <p className="text-text-secondary text-sm mb-4">
          Work with others toward collective goals and earn exclusive rewards!
        </p>
        <button
          onClick={joinGuild}
          className="w-full py-3 bg-accent text-white rounded-xl font-bold hover:bg-accent/90 transition-colors"
        >
          Join Guild
        </button>
      </div>
    );
  }

  const timeLeft = Math.max(0, guild.guildGoal.deadline - Date.now());
  const daysLeft = Math.floor(timeLeft / (24 * 60 * 60 * 1000));
  const hoursLeft = Math.floor((timeLeft % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

  return (
    <div className="space-y-4">
      {/* Kick Warning Banner */}
      {kickWarning && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 flex items-center gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-300 text-sm font-medium">{kickWarning}</p>
        </motion.div>
      )}

      {/* Guild Header */}
      <div className="bg-bg-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-text-secondary text-xs mb-1">{getGuildTier(guild.totalProduction)}</div>
            <h3 className="text-xl font-bold text-text-primary">{guild.name}</h3>
          </div>
          <div className="text-right">
            <div className="text-accent font-bold text-lg">#{guild.playerRank}</div>
            <div className="text-text-secondary text-xs">Your Rank</div>
          </div>
        </div>

        {/* Guild Goal Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-text-secondary">Weekly Goal</span>
            <span className="text-text-primary font-medium">
              {daysLeft > 0 ? `${daysLeft}d ${hoursLeft}h` : `${hoursLeft}h`} left
            </span>
          </div>
          <div className="h-3 bg-bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-accent to-purple-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
          <div className="flex justify-between text-xs mt-1 text-text-secondary">
            <span>{formatNumber(guild.guildGoal.current)}</span>
            <span>{formatNumber(guild.guildGoal.target)}</span>
          </div>
          {progressPct >= 75 && (
            <p className="text-yellow-400 text-xs mt-1 font-medium">
              🔥 So close! {100 - progressPct}% to unlock guild rewards!
            </p>
          )}
        </div>

        {/* Contribute Button */}
        <button
          onClick={handleContribute}
          disabled={resources.ore.amount < 1000}
          className="w-full py-3 bg-gradient-to-r from-accent to-purple-500 text-white rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Zap className="w-4 h-4" />
          Contribute 10% ({formatNumber(Math.floor(resources.ore.amount * 0.1))} ore)
        </button>
      </div>

      {/* Leaderboard */}
      <div className="bg-bg-card rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-yellow-400" />
          <h4 className="font-bold text-text-primary">Contribution Rankings</h4>
        </div>

        <div className="space-y-2">
          {/* Top phantom members */}
          {guild.members.slice(0, guild.playerRank - 1).map((m, i) => (
            <div key={m.id} className="flex items-center gap-3 py-2 border-b border-bg-secondary/50">
              <span className="text-text-secondary text-sm w-6">#{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="text-text-primary text-sm font-medium truncate">{m.name}</div>
                <div className="text-text-secondary text-xs">{m.lastActive}</div>
              </div>
              <span className="text-text-secondary text-sm">{formatNumber(m.contribution)}</span>
            </div>
          ))}

          {/* Player row */}
          <motion.div
            className="flex items-center gap-3 py-2 border-b border-accent/30 bg-accent/5 rounded-lg px-2"
            animate={{ backgroundColor: ['rgba(var(--accent),0.05)', 'rgba(var(--accent),0.12)', 'rgba(var(--accent),0.05)'] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-accent font-bold text-sm w-6">#{guild.playerRank}</span>
            <div className="flex-1">
              <div className="text-accent text-sm font-bold">You</div>
              <div className="text-text-secondary text-xs">Active now</div>
            </div>
            <span className="text-accent text-sm font-bold">{formatNumber(guild.playerContribution)}</span>
          </motion.div>

          {/* Lower members */}
          {guild.members.slice(guild.playerRank - 1, guild.playerRank + 2).map((m, i) => (
            <div key={m.id} className="flex items-center gap-3 py-2 border-b border-bg-secondary/50">
              <span className="text-text-secondary text-sm w-6">#{guild.playerRank + i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="text-text-primary text-sm font-medium truncate">{m.name}</div>
                <div className="text-text-secondary text-xs">{m.lastActive}</div>
              </div>
              <span className="text-text-secondary text-sm">{formatNumber(m.contribution)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Feed */}
      <div className="bg-bg-card rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-green-400" />
          <h4 className="font-bold text-text-primary">Guild Activity</h4>
          <span className="text-xs text-green-400 ml-auto">● Live</span>
        </div>

        <div className="space-y-2">
          {activityFeed.slice(0, 6).map((activity, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-text-secondary">
              <span className="text-green-400">+</span>
              <span className="font-medium text-text-primary">{activity.memberName}</span>
              <span>{activity.action}</span>
              <span className="text-accent ml-auto">{formatNumber(activity.amount)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
