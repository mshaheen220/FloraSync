import { FC, useState, useEffect } from 'react';
import { Card, Button, Subtitle } from '../../styles/StyledElements';
import { Icon } from './Icon';
import { NutrientProfileInfoModal } from './NutrientProfileInfoModal';
import { FEED_AMOUNTS, FEED_PROFILE_LABELS } from '../../utils/constants';

interface FeedActionModalProps {
  isOpen: boolean;
  defaultProfile?: 'LOW_FEED' | 'VEG_GROW' | 'BLOOM_BOOST' | 'ACID_LOVERS' | 'GENERAL_FEED';
  showRecommendationHint?: boolean;
  onClose: () => void;
  onConfirm: (feedType: 'LOW_FEED' | 'VEG_GROW' | 'BLOOM_BOOST' | 'ACID_LOVERS' | 'GENERAL_FEED', feedAmount?: 'Light' | 'Normal' | 'Heavy') => void;
}

export const FeedActionModal: FC<FeedActionModalProps> = ({ isOpen, defaultProfile = 'GENERAL_FEED', showRecommendationHint, onClose, onConfirm }) => {
  const [selectedFeed, setSelectedFeed] = useState<'LOW_FEED' | 'VEG_GROW' | 'BLOOM_BOOST' | 'ACID_LOVERS' | 'GENERAL_FEED'>(defaultProfile);
  const [feedAmount, setFeedAmount] = useState<'Light' | 'Normal' | 'Heavy'>('Normal');
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedFeed(defaultProfile || 'GENERAL_FEED');
      setFeedAmount('Normal');
    }
  }, [isOpen, defaultProfile]);

  if (!isOpen) return null;

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 dark:bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-md shadow-2xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-8">
        <div className="flex justify-between items-center mb-4">
          <Subtitle className="!m-0 flex items-center gap-2">
            <Icon name="feed" size={20} className="text-amber-500" />
            Log Routine Feed
          </Subtitle>
          <div className="flex items-center gap-1">
            <button onClick={() => setIsInfoOpen(true)} className="p-2 text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              <Icon name="help-circle" size={20} />
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
              <Icon name="x" size={20} />
            </button>
          </div>
        </div>
        
        {showRecommendationHint && (
          <div className={`flex items-center gap-2 mb-5 px-3 py-2.5 text-[11px] rounded-xl border leading-tight transition-colors ${selectedFeed === defaultProfile ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50'}`}>
            <Icon name={selectedFeed === defaultProfile ? "sparkles" : "info"} size={16} className="flex-shrink-0" />
            {selectedFeed === defaultProfile ? (
              <span>The <strong>{FEED_PROFILE_LABELS[defaultProfile] || defaultProfile}</strong> profile was auto-selected based on the majority of plants currently residing in this space.</span>
            ) : (
              <span>
                OK! Just note that we still recommend using the <strong>{FEED_PROFILE_LABELS[defaultProfile] || defaultProfile}</strong> profile for the majority of plants here.
              </span>
            )}
          </div>
        )}

        <div className="flex flex-col gap-4 mb-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Nutrient Profile</label>
            <select 
              value={selectedFeed} 
              onChange={e => setSelectedFeed(e.target.value as any)}
              className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 h-[52px] focus:outline-none focus:border-primary-500 dark:focus:border-primary-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all font-semibold"
            >
              <option value="GENERAL_FEED">General Feed (Balanced)</option>
              <option value="BLOOM_BOOST">Heavy Feeders (Fruit & Yield)</option>
              <option value="VEG_GROW">Leafy & Lush (High N Greens)</option>
              <option value="LOW_FEED">Mediterranean & Lean (Low Feed)</option>
              <option value="ACID_LOVERS">Acid Lovers (Low-pH Specialty)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Feeding Amount</label>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shadow-inner">
              {FEED_AMOUNTS.map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setFeedAmount(amt as any)}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${feedAmount === amt ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  {amt}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-2">
          <Button $variant="secondary" onClick={onClose} className="flex-1 py-3 text-sm">Cancel</Button>
          <Button onClick={() => onConfirm(selectedFeed, feedAmount)} className="flex-1 py-3 text-sm">Log Feeding</Button>
        </div>
      </Card>
    </div>
    
    <NutrientProfileInfoModal 
      isOpen={isInfoOpen} 
      onClose={() => setIsInfoOpen(false)} 
      currentProfile={selectedFeed}
    />
    </>
  );
};