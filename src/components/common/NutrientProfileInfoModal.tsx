import { FC, useEffect } from 'react';
import { Card, Button, Subtitle } from '../../styles/StyledElements';
import { Icon } from './Icon';

interface NutrientProfileInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile?: 'LOW_FEED' | 'VEG_GROW' | 'BLOOM_BOOST' | 'ACID_LOVERS' | 'GENERAL_FEED';
}

export const NutrientProfileInfoModal: FC<NutrientProfileInfoModalProps> = ({ isOpen, onClose, currentProfile }) => {
  useEffect(() => {
    if (isOpen && currentProfile) {
      const element = document.getElementById(`profile-${currentProfile}`);
      if (element) {
        element.scrollIntoView({ block: 'center' });
      }
    }
  }, [isOpen, currentProfile]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 dark:bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-4 !p-0" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 shrink-0 rounded-t-2xl">
          <Subtitle className="!m-0 flex items-center gap-2">
            <Icon name="help-circle" size={20} className="text-primary-500" />
            Nutrient Profiles Explained
          </Subtitle>
          <button type="button" onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <Icon name="x" size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-4 space-y-4">
          {/* General Feed */}
          <div id="profile-GENERAL_FEED" className={`p-4 rounded-xl border-2 transition-all ${currentProfile === 'GENERAL_FEED' ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/10' : 'border-transparent'}`}>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base mb-1 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              General Feed (Balanced)
              {currentProfile === 'GENERAL_FEED' && <span className="ml-2 text-[10px] bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-400 px-2 py-0.5 rounded uppercase tracking-wider font-bold">Current Selection</span>}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 font-medium">Target Plants: Any plant when you are unsure.</p>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic border-l-2 border-slate-200 dark:border-slate-700 pl-3 mb-2">
              "A safe, standard, balanced fertilizer (like a 10-10-10). It provides baseline nutrients to keep plants alive without specializing in extreme leaf growth or heavy fruit production."
            </p>
          </div>

          {/* Profile 1 */}
          <div id="profile-BLOOM_BOOST" className={`p-4 rounded-xl border-2 transition-all ${currentProfile === 'BLOOM_BOOST' ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/10' : 'border-transparent'}`}>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base mb-1 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              Heavy Feeders (Fruit & Yield)
              {currentProfile === 'BLOOM_BOOST' && <span className="ml-2 text-[10px] bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-400 px-2 py-0.5 rounded uppercase tracking-wider font-bold">Current Selection</span>}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 font-medium">Target Plants: Cherry Tomato, Roma Tomato, Cucumber, Summer Squash.</p>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic border-l-2 border-slate-200 dark:border-slate-700 pl-3 mb-2">
              "For fruiting vegetables that require high energy to maximize crop yields. Focus on organic granular fertilizers with lower Nitrogen (N) and higher Phosphorus (P) and Potassium (K) to promote blooms and fruit rather than excess leaves. Includes vital calcium to prevent blossom end rot."
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300"><strong>Application:</strong> Apply granular veggie food every 3–4 weeks; scratch into topsoil and water in.</p>
          </div>

          {/* Profile 2 */}
          <div id="profile-VEG_GROW" className={`p-4 rounded-xl border-2 transition-all ${currentProfile === 'VEG_GROW' ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/10' : 'border-transparent'}`}>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base mb-1 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              Leafy & Lush (High Nitrogen Greens)
              {currentProfile === 'VEG_GROW' && <span className="ml-2 text-[10px] bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-400 px-2 py-0.5 rounded uppercase tracking-wider font-bold">Current Selection</span>}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 font-medium">Target Plants: Curly Parsley, Flat-Leaf Parsley, Dill, Cilantro, Chives, Green Onions.</p>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic border-l-2 border-slate-200 dark:border-slate-700 pl-3 mb-2">
              "For leafy herbs and greens where continuous, tender foliage production is the main goal. These plants thrive on fast-acting, nitrogen-rich liquid options that fuel rapid leaf growth without building up salts in the soil."
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300"><strong>Application:</strong> Apply as a liquid soil drench (like a fish/kelp emulsion) every 4 weeks.</p>
          </div>

          {/* Profile 3 */}
          <div id="profile-LOW_FEED" className={`p-4 rounded-xl border-2 transition-all ${currentProfile === 'LOW_FEED' ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/10' : 'border-transparent'}`}>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base mb-1 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-orange-400"></span>
              Mediterranean & Lean (Low-to-No Feed)
              {currentProfile === 'LOW_FEED' && <span className="ml-2 text-[10px] bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-400 px-2 py-0.5 rounded uppercase tracking-wider font-bold">Current Selection</span>}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 font-medium">Target Plants: Sage, Greek Oregano, Rosemary, Thyme, Tarragon.</p>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic border-l-2 border-slate-200 dark:border-slate-700 pl-3 mb-2">
              "For woody, drought-tolerant herbs that thrive in lean, nutrient-poor soil. Over-fertilizing these plants causes rapid, leggy growth that dilutes their aromatic essential oils and ruins their flavor. Keep them on a 'starvation diet'."
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300"><strong>Application:</strong> Do not use granular fertilizer. Give a half-strength dose of liquid kelp exactly once a summer, or skip feeding entirely if the plant looks healthy.</p>
          </div>

          {/* Profile 4 */}
          <div id="profile-ACID_LOVERS" className={`p-4 rounded-xl border-2 transition-all ${currentProfile === 'ACID_LOVERS' ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/10' : 'border-transparent'}`}>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base mb-1 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-purple-500"></span>
              Acid Lovers (Low-pH Specialty)
              {currentProfile === 'ACID_LOVERS' && <span className="ml-2 text-[10px] bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-400 px-2 py-0.5 rounded uppercase tracking-wider font-bold">Current Selection</span>}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 font-medium">Target Plants: Blueberry Bush (and future additions like Blackberries, Raspberries, or Hydrangeas).</p>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic border-l-2 border-slate-200 dark:border-slate-700 pl-3 mb-2">
              "For specific fruiting shrubs and perennials that strictly require highly acidic soil (pH 4.5–5.5) to absorb nutrients. Standard fertilizers will cause iron deficiency and yellowing leaves. Requires dedicated acidifying elements."
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300"><strong>Application:</strong> Apply a specialized organic acidifying fertilizer strictly to the plant's root zone twice a year—once in early spring and once in late spring.</p>
          </div>
        </div>
        
        <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 shrink-0 rounded-b-2xl">
          <Button onClick={onClose} $variant="secondary" className="w-full py-3">Close Explanation</Button>
        </div>
      </Card>
    </div>
  );
};