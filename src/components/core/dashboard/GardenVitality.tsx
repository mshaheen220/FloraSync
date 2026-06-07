import { FC } from 'react';
import { Subtitle, Card } from '../../../styles/StyledElements';

interface GardenVitalityProps {
  averageHydration: number;
  averageNutrition: number;
  trackedCount: number;
  activeCount: number;
  mostPopulatedZone: { name: string; id: string | null };
  onNavigateInventory: () => void;
  onNavigateZone: (zoneId: string) => void;
}

export const GardenVitality: FC<GardenVitalityProps> = ({ averageHydration, averageNutrition, trackedCount, activeCount, mostPopulatedZone, onNavigateInventory, onNavigateZone }) => {
  return (
    <section className="mb-8 animate-in fade-in duration-500 delay-100">
      <Subtitle>Garden Vitality</Subtitle>
      <div className="grid grid-cols-2 gap-3">
        <Card className="!p-3 !mb-0 flex items-center justify-between text-center">
          <div className="flex flex-col items-center flex-1">
            <span className="text-2xl mb-1">💧</span>
            <span className={`text-xl font-black ${averageHydration <= 30 ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400'}`}>{averageHydration}%</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Water</span>
          </div>
          <div className="w-px h-12 bg-slate-200 dark:bg-slate-700/50"></div>
          <div className="flex flex-col items-center flex-1">
            <span className="text-2xl mb-1">🍽️</span>
            <span className={`text-xl font-black ${averageNutrition <= 30 ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400'}`}>{averageNutrition}%</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Feed</span>
          </div>
        </Card>
        <Card 
          className="!p-4 !mb-0 flex flex-col items-center justify-center text-center cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
          onClick={onNavigateInventory}
        >
          <span className="text-3xl mb-2">🌱</span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{trackedCount}</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Active Plants</span>
          <span className="text-[9px] font-semibold text-slate-400/70 dark:text-slate-500 mt-1">{activeCount} in inventory</span>
        </Card>
        <Card 
          className={`!p-4 !mb-0 col-span-2 flex flex-row items-center justify-between transition-colors ${mostPopulatedZone.id ? 'cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-700' : ''}`}
          onClick={() => mostPopulatedZone.id && onNavigateZone(mostPopulatedZone.id)}
        >
          <div className="flex items-center gap-4">
        <span className="text-3xl">🗺️</span>
            <div className="text-left">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Top Zone</span>
              <span className="text-lg font-bold text-emerald-800 dark:text-emerald-200">{mostPopulatedZone.name}</span>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};