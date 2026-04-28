import { useEffect } from 'react';
import { PhoneFrame } from './components/PhoneFrame';
import { GameContainer } from './components/GameContainer';
import { useGameStore } from './stores/gameStore';
import { useRewardStore } from './stores/rewardStore';
import { usePlayerStore } from './stores/playerStore';
import { useGameTick } from './hooks/useGameTick';

function App() {
  const initialize = useGameStore(state => state.initialize);
  const checkDailyLogin = useRewardStore(state => state.checkDailyLogin);
  const updateLeaderboard = usePlayerStore(state => state.updateLeaderboard);
  const totalProduction = useGameStore(state => state.totalProduction);
  const resources = useGameStore(state => state.resources);

  useGameTick();

  useEffect(() => {
    initialize();
    checkDailyLogin();
    updateLeaderboard(totalProduction, resources.ore.totalEarned);
  }, [initialize, checkDailyLogin, updateLeaderboard, totalProduction, resources.ore.totalEarned]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary flex items-center justify-center p-4">
      <PhoneFrame>
        <GameContainer />
      </PhoneFrame>
    </div>
  );
}

export default App;
