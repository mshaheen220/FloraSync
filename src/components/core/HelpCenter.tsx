import { useState, useEffect, FC } from 'react';
import { Container, Card, Subtitle } from '../../styles/StyledElements';
import { PageHeader } from '../common/PageHeader';
import { GardenProfile, User } from '../../App';

const HelpSection: FC<{ title: string; icon: React.ReactNode; isExpanded: boolean; onToggle: () => void; children: React.ReactNode }> = ({ title, icon, isExpanded, onToggle, children }) => (
  <div className="border-b border-slate-200 dark:border-slate-800 pb-2 mb-4 last:border-0">
    <button onClick={onToggle} className="w-full flex items-center justify-between text-left group py-3 mb-2 active:scale-[0.98] transition-transform">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <Subtitle className="!m-0 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{title}</Subtitle>
      </div>
      <span className={`text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
    </button>
    {isExpanded && (
      <div className="mb-4 animate-in slide-in-from-top-2 fade-in duration-200 text-sm text-slate-600 dark:text-slate-300 space-y-3 leading-relaxed px-2">
        {children}
      </div>
    )}
  </div>
);

interface HelpCenterProps {
  gardenProfile?: GardenProfile | null;
  currentUser?: User | null;
  onOpenMenu: () => void;
  onOpenWorkspaceMenu?: () => void;
}

export const HelpCenter: FC<HelpCenterProps> = ({ gardenProfile, currentUser, onOpenMenu, onOpenWorkspaceMenu }) => {
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [showPrintExamples, setShowPrintExamples] = useState(false);
  const [isWelcomeExpanded, setIsWelcomeExpanded] = useState(() => {
    const hasVisited = localStorage.getItem('florasync_help_welcome_seen');
    return !hasVisited;
  });

  useEffect(() => {
    if (!localStorage.getItem('florasync_help_welcome_seen')) {
      localStorage.setItem('florasync_help_welcome_seen', 'true');
    }
  }, []);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const isAdminOrOwner = currentUser?.role === 'god-admin' || currentUser?.workspaceRole === 'owner';

  return (
    <Container className="animate-in slide-in-from-bottom-4 duration-300">
      <PageHeader title="Help & FAQs" supertitle={gardenProfile?.name || 'FloraSync'} onOpenMenu={onOpenMenu} onOpenWorkspaceMenu={onOpenWorkspaceMenu} />

      <Card className="mb-6 !bg-emerald-50 dark:!bg-emerald-900/20 !border-emerald-200 dark:!border-emerald-800 !p-0 overflow-hidden">
        <button 
          onClick={() => setIsWelcomeExpanded(prev => !prev)} 
          className="w-full flex items-center justify-between text-left p-4 transition-colors hover:bg-emerald-100/50 dark:hover:bg-emerald-800/30 active:scale-[0.98]"
        >
          <span className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
            <span className="text-xl">👋</span> Welcome to FloraSync
          </span>
          <span className={`text-emerald-600/50 dark:text-emerald-400/50 transition-transform duration-200 ${isWelcomeExpanded ? 'rotate-180' : ''}`}>▼</span>
        </button>
        {isWelcomeExpanded && (
          <div className="px-4 pb-4 animate-in slide-in-from-top-2 fade-in duration-200 space-y-3">
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
              Welcome to FloraSync, your local, privacy-first garden command center! FloraSync is designed to eliminate the friction of data entry when managing your home greenhouse or raised beds by bridging the physical and digital worlds.
            </p>
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
              Tap any topic below to explore the guide and learn how to get the absolute most out of your digital greenhouse.
            </p>
          </div>
        )}
      </Card>

      <HelpSection title="Understanding the Dashboard" icon={<img src="/images/icons/dashboard.png" alt="Dashboard" className="w-6 h-6 object-contain" />} isExpanded={expandedSections.includes('dashboard')} onToggle={() => toggleSection('dashboard')}>
        <p>The Dashboard is your dynamic command center. Instead of a standard static list, it acts as a sorting engine that floats the most urgent tasks and relevant insights to the top of your screen!</p>
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li><strong className="text-slate-800 dark:text-slate-100">Garden Vitality & Quick Actions:</strong> Monitor your overall hydration and nutrition percentages. You can instantly water or feed your entire garden, or customize the dashboard by <strong>Pinning (📌)</strong> specific Zones to create your own Quick Action buttons.</li>
          <li><strong className="text-slate-800 dark:text-slate-100">Needs Watering & Hungry Plants:</strong> Plants only drop into these queues when they are actually overdue. This is calculated dynamically using their specific dictionary intervals and the evaporation modifier of the zone they live in.</li>
          <li><strong className="text-slate-800 dark:text-slate-100">Health Watchlist:</strong> Instantly flags any plant whose most recent journal entry reported a pest or disease issue, keeping it front-and-center until you log a healthy update.</li>
          <li><strong className="text-slate-800 dark:text-slate-100">Approaching Harvest:</strong> A smart carousel that magically appears when any plant is within 14 days of being ready to pick.</li>
          <li><strong className="text-slate-800 dark:text-slate-100">The Nursery:</strong> Highlights vulnerable seedlings and fresh transplants that were planted within the last two weeks.</li>
          <li><strong className="text-slate-800 dark:text-slate-100">Urgent Location Care:</strong> If multiple plants in the exact same location (e.g., "Left Bed") are thirsty, a shortcut button appears to water that entire area at once.</li>
          <li><strong className="text-slate-800 dark:text-slate-100">Random Spotlight:</strong> A dynamically rotating card featuring insights about the plants currently in your inventory. Tap the <strong>Shuffle (🔀)</strong> button to cycle through them! The engine gives a 65% priority to custom Fun Facts and Jokes (look for icons like 💡, 😂, 🤔, ☠️, ❗, 🤷, ❤️, 🪲), while the remaining 35% of the time it will serve up practical generated garden tips (🌟) like companion planting rules, pruning reminders, or culinary ideas.</li>
          <li><strong className="text-slate-800 dark:text-slate-100">Garden Pulse:</strong> A running feed of recent activity across your garden.</li>
        </ul>
      </HelpSection>

      <HelpSection title="The Plant Journal & Harvests" icon="📓" isExpanded={expandedSections.includes('journal')} onToggle={() => toggleSection('journal')}>
        <p>Clicking on any plant in your inventory opens its detail view, where you'll find its <strong>Plant Journal</strong> at the bottom. This is where your garden's history comes alive.</p>
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li><strong>Rich Media:</strong> Add photos to track growth, and click "Set as Cover Photo" to override the dictionary image with a picture of your actual living plant!</li>
          <li><strong>Harvest Tracking:</strong> Select "Harvest" as the Activity Type and log the exact weight or quantity you picked (e.g., "12 oz" or "3 Tomatoes").</li>
          <li><strong>Smart Bulk Logging:</strong> When you use a bulk Quick Action (like watering an entire Zone), FloraSync automatically generates a detailed journal entry for every single plant in that area, marking exactly who did it and where the action originated!</li>
        </ul>
      </HelpSection>

      <HelpSection title="The Global Plant Dictionary" icon="📖" isExpanded={expandedSections.includes('dictionary')} onToggle={() => toggleSection('dictionary')}>
        <p>The Plant Dictionary acts as the master reference for your entire FloraSync system. It contains the baseline rules for every plant, such as watering intervals, sunlight requirements, and harvest times.</p>
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li><strong className="text-slate-800 dark:text-slate-100">Shared by Everyone:</strong> The dictionary is global and shared across all gardens and workspaces on your server. When you create a physical plant instance in your garden, it inherits its rules from this shared master dictionary.</li>
          <li><strong className="text-slate-800 dark:text-slate-100">Restricted Editing:</strong> To keep this master reference clean and accurate, only users with the <strong>Owner</strong> or <strong>God-Admin</strong> role can add new plants or edit existing entries. Helpers and Viewers can view the dictionary and plant from it, but cannot alter the global rules.</li>
        </ul>
      </HelpSection>

      <HelpSection title="Privacy & Your Data" icon="🔒" isExpanded={expandedSections.includes('privacy')} onToggle={() => toggleSection('privacy')}>
        <p>FloraSync is a local, privacy-first command center. It <strong>does not use the internet</strong> to 'research' plants or pull from public databases.</p>
        <p>The Plant Dictionary is built entirely from your own private data. When you add a plant and define its rules (like watering intervals and sunlight), you are teaching your local server exactly how you want your garden managed. Your data never leaves this network.</p>
      </HelpSection>

      <HelpSection title="Unmonitored / Rain-Fed Plants" icon="🌧️" isExpanded={expandedSections.includes('unmonitored')} onToggle={() => toggleSection('unmonitored')}>
        <p>Got a mature shrub in the yard that relies entirely on the rain, but you still want it in your inventory?</p>
        <p>When viewing a plant, tap the <strong>Edit (✏️)</strong> icon and check the <strong>'Unmonitored / Rain-fed'</strong> box. </p>
        <p>The plant will drop out of all your daily care queues (like Needs Watering) and will no longer negatively affect your Garden Vitality percentages. However, you can still use its journal to track blooms, photos, and harvests!</p>
      </HelpSection>

      <HelpSection title="Switching Gardens" icon="🌍" isExpanded={expandedSections.includes('switching')} onToggle={() => toggleSection('switching')}>
        <p>If you help manage multiple gardens (like a community greenhouse and your home patio), you can easily jump between them.</p>
        <p>Tap your current garden's name (or logo) at the top left of the <strong>Dashboard</strong> or <strong>Settings</strong> screen to open the Workspace Switcher, then tap the garden you want to switch to.</p>
      </HelpSection>

      <HelpSection title="Understanding User Roles" icon="👥" isExpanded={expandedSections.includes('roles')} onToggle={() => toggleSection('roles')}>
        <p>FloraSync utilizes different roles to keep your garden safe if you invite friends or family to help:</p>
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li><strong className="text-slate-800 dark:text-slate-100">Owner:</strong> Has full control over the garden, including the ability to permanently delete it or manage its members.</li>
          <li><strong className="text-slate-800 dark:text-slate-100">Helper:</strong> Perfect for a garden-sitter. They can log watering, feeding, and add journal entries, but cannot delete plants or change structural rules.</li>
          <li><strong className="text-slate-800 dark:text-slate-100">Viewer:</strong> Read-only access. They can look at your beautiful plants and journals, but cannot make any changes.</li>
        </ul>
        <p className="mt-2 text-xs italic opacity-80">*Note: A "God-Admin" is a special system-level role that has ultimate administrative power over the entire server.*</p>
      </HelpSection>

      <HelpSection title="Scanning Tags" icon="📷" isExpanded={expandedSections.includes('scanning')} onToggle={() => toggleSection('scanning')}>
        <p>Use the floating camera button in the bottom corner of the app to scan the physical QR tags in your garden.</p>
        <p>You can generate QR codes for <strong>all items</strong> in your garden: individual plants, specific locations, and entire zones. Scanning a tag instantly brings up the details for that specific item. From there, you can log individual care or take bulk actions—like watering an entire zone with a single tap!</p>
        <p>If you scan an unassigned blank tag, the app will instantly launch a "Just-In-Time" registration form so you can tell the system what you just planted or created.</p>
        <p><strong>Action Tags vs. Navigation Tags:</strong> A standard Navigation tag simply loads up the details of a plant or zone (requiring you to click once more to log care). However, you can print special Action tags for Water (💧) or Feed (🍽️). Scanning an Action tag instantly logs the care for that specific plant or an entire zone—no buttons required, saving you a tap!</p>
      </HelpSection>

      {isAdminOrOwner && (
        <HelpSection title="Print Center & QR Tags" icon="🖨️" isExpanded={expandedSections.includes('print')} onToggle={() => toggleSection('print')}>
          <p>As a garden Owner, you can generate perfectly formatted, printable sheets of QR codes directly from the app.</p>
          <p>Open the main menu and tap <strong>Print Center</strong>. From there, you can choose your desired label layout and preview the sheets before sending them to your printer.</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li><strong>Different Styles & Layouts:</strong> We offer several print sizes to fit your needs. The popular <strong>6cm x 3cm Labels</strong> are perfectly sized to fit the standard white plastic garden stakes found at any dollar store or on Amazon!</li>
            <li><strong>Database Export:</strong> Select which categories (Plants, Locations, Zones) you want to print. FloraSync will generate tags with specific names and colorful icons for everything currently in your system.</li>
            <li><strong>Blank Tags:</strong> Prints a sequence of unassigned stickers. Stick them in new pots, scan them, and FloraSync will instantly launch a "Just-In-Time" registration form! (You can also apply Actions to blank tags for instant care logging).</li>
          </ul>
          <div className="mt-4 p-3 bg-emerald-100/50 dark:bg-emerald-900/30 rounded-xl border border-emerald-200 dark:border-emerald-800/50">
            <p className="font-bold text-emerald-800 dark:text-emerald-300 mb-1">DIY Weatherproofing Tip 🌧️</p>
            <p className="text-sm text-emerald-700 dark:text-emerald-400 leading-relaxed">To make your labels survive the elements, print them onto <strong>full-sheet vinyl sticker paper</strong>, then laminate the entire printed sheet. The laminating plastic will adhere to both sides. When you cut out your individual tags, simply peel the back lamination layer off to expose the vinyl's sticky back and apply it to your stakes!<br/><br/><span className="text-xs opacity-80 italic">*Note: Standard inkjet ink will eventually fade in the sun over time, but you can always quickly print a fresh batch when they do!</span></p>
          </div>
          <button
            onClick={() => setShowPrintExamples(true)}
            className="mt-4 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:hover:bg-emerald-800/60 text-emerald-800 dark:text-emerald-300 px-4 py-2 rounded-xl text-sm font-bold active:scale-95 transition-all flex items-center gap-2"
          >
            📷 View Label Examples
          </button>
        </HelpSection>
      )}

      {isAdminOrOwner && (
        <HelpSection title="Bulk Data Import" icon="📥" isExpanded={expandedSections.includes('import')} onToggle={() => toggleSection('import')}>
          <p>If you have a lot of existing garden data or want to share a customized plant dictionary with a friend, use the bulk Data Import tool.</p>
          <p>Navigate to General Settings and scroll to <strong>Data Import</strong>. Select your data type, paste a formatted JSON array, and click Import. FloraSync will automatically skip items with duplicate IDs to protect your existing garden.</p>
        </HelpSection>
      )}

      {showPrintExamples && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowPrintExamples(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col gap-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Label Examples</h3>
              <button onClick={() => setShowPrintExamples(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-2xl font-bold p-2 -mr-2 leading-none">✕</button>
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">6cm x 3cm Labels</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-2 items-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <img src="/images/examples/qr/6x3%20Plant.png" alt="Plant" className="w-full max-w-[240px] rounded border border-slate-200 dark:border-slate-700 shadow-sm object-contain" />
                  <span className="text-xs font-bold text-slate-500">Standard Plant Tag</span>
                </div>
                <div className="flex flex-col gap-2 items-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <img src="/images/examples/qr/6x3%20Zone.png" alt="Zone" className="w-full max-w-[240px] rounded border border-slate-200 dark:border-slate-700 shadow-sm object-contain" />
                  <span className="text-xs font-bold text-slate-500">Standard Zone Tag</span>
                </div>
                <div className="flex flex-col gap-2 items-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <img src="/images/examples/qr/6x3%20location.png" alt="Location" className="w-full max-w-[240px] rounded border border-slate-200 dark:border-slate-700 shadow-sm object-contain" />
                  <span className="text-xs font-bold text-slate-500">Standard Location Tag</span>
                </div>
                <div className="flex flex-col gap-2 items-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="flex gap-2 w-full max-w-[240px]">
                    <img src="/images/examples/qr/6x3%20water%20zone.png" alt="Water Action" className="w-1/2 rounded border border-slate-200 dark:border-slate-700 shadow-sm object-contain" />
                    <img src="/images/examples/qr/6x3%20feed%20zone.png" alt="Feed Action" className="w-1/2 rounded border border-slate-200 dark:border-slate-700 shadow-sm object-contain" />
                  </div>
                  <span className="text-xs font-bold text-slate-500">Water / Feed Action Tags</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">1-inch Square Labels</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="flex flex-col gap-2 items-center justify-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <img src="/images/examples/qr/1x1%20plant.png" alt="Plant" className="w-16 h-16 rounded border border-slate-200 dark:border-slate-700 shadow-sm object-contain" />
                  <span className="text-[10px] font-bold text-slate-500 text-center uppercase tracking-wider">Plant</span>
                </div>
                <div className="flex flex-col gap-2 items-center justify-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <img src="/images/examples/qr/1x1%20location.png" alt="Location" className="w-16 h-16 rounded border border-slate-200 dark:border-slate-700 shadow-sm object-contain" />
                  <span className="text-[10px] font-bold text-slate-500 text-center uppercase tracking-wider">Location</span>
                </div>
                <div className="flex flex-col gap-2 items-center justify-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <img src="/images/examples/qr/1x1%20zone.png" alt="Zone" className="w-16 h-16 rounded border border-slate-200 dark:border-slate-700 shadow-sm object-contain" />
                  <span className="text-[10px] font-bold text-slate-500 text-center uppercase tracking-wider">Zone</span>
                </div>
                <div className="flex flex-col gap-2 items-center justify-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <img src="/images/examples/qr/1x1%20feed%20location.png" alt="Action" className="w-16 h-16 rounded border border-slate-200 dark:border-slate-700 shadow-sm object-contain" />
                  <span className="text-[10px] font-bold text-slate-500 text-center uppercase tracking-wider">Action</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </Container>
  );
};