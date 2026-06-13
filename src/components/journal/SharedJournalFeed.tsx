import { FC, useState } from 'react';
import { JournalEntry, User } from '../../../types';
import { Card, Button } from '../../styles/StyledElements';
import { Icon } from '../common/Icon';

const FALLBACK_IMAGE = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect width='100%25' height='100%25' fill='%2310b981' fill-opacity='0.2'/%3E%3Ctext x='50%25' y='50%25' font-size='100' text-anchor='middle' dominant-baseline='middle'%3E🌿%3C/text%3E%3C/svg%3E";

interface SharedJournalFeedProps {
  entries: any[]; // Extended via any to easily handle the GlobalJournal synthetic arrays
  onEdit?: (entry: JournalEntry) => void;
  onDelete?: (id: string) => void;
  onNavigatePlant?: (id: string) => void;
  onSetThumbnail?: (url: string) => void;
  currentImageUrl?: string;
  currentUser?: User | null;
  contextType?: 'global' | 'plant' | 'location' | 'zone';
  emptyMessage?: string;
}

export const SharedJournalFeed: FC<SharedJournalFeedProps> = ({ 
  entries, onEdit, onDelete, onNavigatePlant, onSetThumbnail, 
  currentImageUrl, currentUser, contextType,
  emptyMessage = "No journal entries to display."
}) => {
  const showSourceContext = !!contextType;
  const [displayLimit, setDisplayLimit] = useState(showSourceContext ? 50 : 25);
  const [expandedImageUrl, setExpandedImageUrl] = useState<string | null>(null);

  if (entries.length === 0) {
    if (showSourceContext) {
      return (
        <Card className="text-center p-8 bg-surface-50 dark:bg-surface-800/50 shadow-none border border-surface-200 dark:border-surface-700">
          <p className="text-sm text-slate-500 font-semibold mb-2">No journal history yet.</p>
          <p className="text-xs text-slate-400">Add a macro-level Garden Note above, or log care on individual plants to build your timeline.</p>
        </Card>
      );
    }
    return <p className="text-sm text-slate-500 italic mt-2 mb-8">{emptyMessage}</p>;
  }

  return (
    <div className={`relative border-l-2 border-primary-200 dark:border-primary-800 ml-4 pl-6 space-y-${showSourceContext ? '8 pb-10' : '6 mb-8 mt-2'}`}>
      {entries.slice(0, displayLimit).map((entry) => {
        const isGardenNote = showSourceContext && entry.sourceType === 'garden';
        const isSpaceNote = showSourceContext && (isGardenNote || entry.sourceType === 'zone' || entry.sourceType === 'location');
        const isLocalEntry = contextType === 'global' ? (entry.sourceType === 'garden') : (!entry.sourceType || entry.sourceType === contextType);

        return (
          <div key={`${entry.sourceType || 'local'}-${entry.id}`} className="relative">
            <div className={`absolute -left-[31px] rounded-full w-4 h-4 ring-4 ring-slate-50 dark:ring-slate-900 ${showSourceContext && isSpaceNote ? 'bg-indigo-500' : 'bg-primary-500'}`}></div>
            
            <div className={`mb-${showSourceContext ? '2' : '1'} flex items-${showSourceContext ? 'start' : 'center'} justify-between gap-2`}>
              {showSourceContext ? (
                <div>
                  <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider block mb-1">
                    {new Date(entry.timestamp).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </span>
                  <span 
                    className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider border ${entry.sourceType !== 'plant' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-400 cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors'}`}
                    onClick={() => entry.sourceType === 'plant' && contextType !== 'plant' && entry.sourceId && onNavigatePlant && onNavigatePlant(entry.sourceId)}
                  >
                    <Icon name={isSpaceNote ? (entry.sourceType === 'location' ? "map-pin" : "land-plot") : "leaf"} size={10} />
                    {entry.sourceName}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider">
                    {new Date(entry.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </span>
                  {entry.authorName && (
                    <div className="flex items-center gap-1.5 ml-2 border-l border-primary-200 dark:border-primary-800 pl-2">
                      {entry.authorName === currentUser?.name && currentUser?.imageUrl ? (
                        <img src={currentUser.imageUrl} alt={entry.authorName} className="w-4 h-4 rounded-full object-cover" />
                      ) : entry.authorImageUrl ? (
                        <img src={entry.authorImageUrl} alt={entry.authorName} className="w-4 h-4 rounded-full object-cover" />
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-[8px] font-bold text-primary-700 dark:text-primary-400">
                          {entry.authorName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">{entry.authorName}</span>
                    </div>
                  )}
                </div>
              )}

              {showSourceContext ? (
                (isLocalEntry && !entry.isSynthetic) ? (
                  <div className="flex gap-2 bg-surface-50 dark:bg-surface-800 p-1 rounded-lg border border-surface-200 dark:border-surface-700 shadow-sm">
                    {onEdit && <button onClick={() => { onEdit(entry); window.scrollTo(0,0); }} className="text-slate-400 hover:text-primary-600 p-1 active:scale-90 transition-transform"><Icon name="edit" size={14} /></button>}
                    {onDelete && <button onClick={() => onDelete(entry.id)} className="text-slate-400 hover:text-red-600 p-1 active:scale-90 transition-transform"><Icon name="delete" size={14} /></button>}
                  </div>
                ) : entry.sourceType === 'plant' && contextType !== 'plant' ? (
                  <button onClick={() => entry.sourceId && onNavigatePlant && onNavigatePlant(entry.sourceId)} className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 bg-primary-50 dark:bg-primary-900/30 px-2 py-1 rounded-lg">
                    View Plant <Icon name="view" size={12} />
                  </button>
                ) : (
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Icon name="layers" size={12} /> {entry.isSynthetic ? 'Batch Action' : 'Inherited Event'}
                  </span>
                )
              ) : (
                <div className="flex gap-2">
                  {onEdit && <button onClick={() => onEdit(entry)} className="text-slate-400 hover:text-primary-600 active:scale-90 transition-transform"><Icon name="edit" size={16} /></button>}
                  {onDelete && <button onClick={() => onDelete(entry.id)} className="text-slate-400 hover:text-red-600 active:scale-90 transition-transform"><Icon name="delete" size={16} /></button>}
                </div>
              )}
            </div>

            {showSourceContext ? (
              <Card className="!p-4 shadow-sm border-surface-200 dark:border-surface-700">
                <EntryContent entry={entry} showSourceContext={true} isLocalEntry={isLocalEntry} onSetExpandedImage={setExpandedImageUrl} onSetThumbnail={onSetThumbnail} currentImageUrl={currentImageUrl} currentUser={currentUser} />
              </Card>
            ) : (
              <div className="mt-1">
                <EntryContent entry={entry} showSourceContext={false} isLocalEntry={true} onSetExpandedImage={setExpandedImageUrl} onSetThumbnail={onSetThumbnail} currentImageUrl={currentImageUrl} currentUser={currentUser} />
              </div>
            )}
          </div>
        );
      })}

      {entries.length > displayLimit && (
        <div className={`flex justify-center mt-8 mb-${showSourceContext ? '4 pt-4' : '2'}`}>
          <Button $variant="secondary" onClick={() => setDisplayLimit(p => p + (showSourceContext ? 50 : 25))} className={`w-full sm:w-auto shadow-sm ${showSourceContext ? '' : 'text-xs'}`}>
            Load Older Entries
          </Button>
        </div>
      )}

      {expandedImageUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 p-4" onClick={() => setExpandedImageUrl(null)}>
          <div className="relative flex flex-col items-end max-w-full max-h-full">
            <button className="text-white text-3xl font-bold p-2 mb-2 active:scale-90 transition-transform hover:text-slate-300" onClick={() => setExpandedImageUrl(null)}>✕</button>
            <img src={expandedImageUrl} alt="Enlarged journal photo" className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()} />
          </div>
        </div>
      )}
    </div>
  );
};

// Local isolated layout component
const EntryContent: FC<{entry: any, showSourceContext: boolean, isLocalEntry: boolean, onSetExpandedImage: (url: string) => void, onSetThumbnail?: (url: string) => void, currentImageUrl?: string, currentUser?: User | null}> = ({ entry, showSourceContext, isLocalEntry, onSetExpandedImage, onSetThumbnail, currentImageUrl, currentUser }) => {
  return (
    <>
      {entry.title && <h4 className={`text-slate-800 dark:text-slate-100 font-bold mb-${showSourceContext ? '2' : '1'} text-${showSourceContext ? 'base' : 'lg'}`}>{entry.title}</h4>}
      {((entry.activityType && !['Observation', 'Garden Note', 'Zone Note', 'Location Note'].includes(entry.activityType)) || entry.harvestAmount || entry.height || entry.fullness || entry.colorAppearance || entry.healthIssues || entry.growthStage || entry.batchScope) && (
        <div className={`flex flex-wrap gap-2 mb-3 ${!showSourceContext ? 'mt-1' : ''}`}>
          {entry.activityType && !['Observation', 'Garden Note', 'Zone Note', 'Location Note'].includes(entry.activityType) && (
            <span className="bg-primary-100 dark:bg-primary-900/50 text-primary-800 dark:text-primary-300 text-xs px-2 py-1 rounded-md border border-primary-200 dark:border-primary-800 font-bold inline-flex items-center gap-1.5">
              {entry.activityType === 'Harvest' ? <><Icon name="apple" size={14} /> Harvest</> : entry.activityType === 'Pruning' ? <><Icon name="edit" size={14} /> Pruning</> : entry.activityType === 'Watered' ? <><Icon name="water" size={14} /> Watered</> : entry.activityType === 'Fed' ? <><Icon name="feed" size={14} /> Fed</> : entry.activityType === 'Treatment' ? <><Icon name="alert-circle" size={14} /> Treatment</> : entry.activityType === 'Weather' ? <><Icon name="cloud-sun" size={14} /> Weather</> : entry.activityType === 'Heavy Rain' ? <><Icon name="cloud-rain" size={14} /> Heavy Rain</> : entry.activityType === 'Pest Sighting' ? <><Icon name="bug" size={14} /> Pest Sighting</> : entry.activityType === 'Maintenance' ? <><Icon name="settings" size={14} /> Maintenance</> : entry.activityType === 'Planning' ? <><Icon name="lightbulb" size={14} /> Planning</> : entry.activityType === 'Alert' ? <><Icon name="alert-circle" size={14} /> Alert</> : entry.activityType}
            </span>
          )}
          {entry.harvestAmount && <span className={`bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 px-2 py-1 rounded-md border border-amber-200 dark:border-amber-800 font-bold inline-flex items-center gap-1.5 ${showSourceContext ? 'text-[10px]' : 'text-xs'}`}><Icon name="scale" size={showSourceContext ? 12 : 14} /> {entry.harvestAmount}</span>}
          {entry.height && <span className={`bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 inline-flex items-center gap-1.5 ${showSourceContext ? 'text-[10px]' : 'text-xs'}`}><Icon name="ruler" size={showSourceContext ? 12 : 14} /> {entry.height}"</span>}
          {entry.growthStage && <span className={`bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 inline-flex items-center gap-1.5 ${showSourceContext ? 'text-[10px]' : 'text-xs'}`}><Icon name="sprout" size={showSourceContext ? 12 : 14} /> {entry.growthStage}</span>}
          {entry.fullness && <span className={`bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 inline-flex items-center gap-1.5 ${showSourceContext ? 'text-[10px]' : 'text-xs'}`}><Icon name="leaf" size={showSourceContext ? 12 : 14} /> {entry.fullness}</span>}
          {entry.colorAppearance && <span className={`bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 inline-flex items-center gap-1.5 ${showSourceContext ? 'text-[10px]' : 'text-xs'}`}><Icon name="palette" size={showSourceContext ? 12 : 14} /> {entry.colorAppearance}</span>}
          {entry.healthIssues && entry.healthIssues !== 'None' && <span className={`bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-1 rounded-md border border-red-200 dark:border-red-800 inline-flex items-center gap-1.5 ${showSourceContext ? 'text-[10px]' : 'text-xs'}`}><Icon name="alert" size={showSourceContext ? 12 : 14} /> {entry.healthIssues}</span>}
          {entry.healthIssues === 'None' && <span className={`bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-2 py-1 rounded-md border border-primary-200 dark:border-primary-800 inline-flex items-center gap-1.5 ${showSourceContext ? 'text-[10px]' : 'text-xs'}`}><Icon name="sparkles" size={showSourceContext ? 12 : 14} /> Healthy</span>}
          {entry.batchScope && <span className={`bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-2 py-1 rounded-md border border-indigo-200 dark:border-indigo-800 font-semibold inline-flex items-center gap-1.5 ${showSourceContext ? 'text-[10px]' : 'text-xs'}`}><Icon name="map-pin" size={showSourceContext ? 12 : 14} /> via {entry.batchScope}</span>}
        </div>
      )}
      {entry.note && <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-3 whitespace-pre-wrap">{entry.note}</p>}
      {entry.imageUrl && (
        <div className={!showSourceContext ? "mt-2" : ""}>
          <img src={entry.imageUrl} alt={entry.title || 'Journal photo'} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }} className={`w-full max-h-64 object-cover rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:opacity-90 transition-opacity ${!showSourceContext ? 'mb-2' : ''}`} onClick={() => onSetExpandedImage(entry.imageUrl!)} />
          {isLocalEntry && onSetThumbnail && (
            <button onClick={() => onSetThumbnail(entry.imageUrl!)} className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline">
              {currentImageUrl === entry.imageUrl ? '★ Current Cover Photo' : 'Set as Cover Photo'}
            </button>
          )}
        </div>
      )}
      {showSourceContext && entry.authorName && (
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          {entry.authorName === currentUser?.name && currentUser?.imageUrl ? (
            <img src={currentUser.imageUrl} alt={entry.authorName} className="w-4 h-4 rounded-full object-cover" />
          ) : entry.authorImageUrl ? (
            <img src={entry.authorImageUrl} alt={entry.authorName} className="w-4 h-4 rounded-full object-cover" />
          ) : (
            <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[8px] font-bold text-slate-600 dark:text-slate-400">{entry.authorName.charAt(0).toUpperCase()}</div>
          )}
          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">Logged by {entry.authorName}</span>
        </div>
      )}
    </>
  );
};