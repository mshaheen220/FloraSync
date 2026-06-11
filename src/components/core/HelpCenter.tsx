import { useState, useEffect, FC, useMemo } from 'react';
import { Container, Card, Subtitle } from '../../styles/StyledElements';
import { PageHeader } from '../common/PageHeader';
import { GardenProfile, User } from '../../../types';
import { hasPermission } from '../../utils/permissions';
import { Icon } from '../common/Icon';

const HelpSection: FC<{ title: string; icon: React.ReactNode; isExpanded: boolean; onToggle: () => void; level?: number; children: React.ReactNode }> = ({ title, icon, isExpanded, onToggle, level = 0, children }) => (
  <div className={level === 0 ? 'border-b border-surface-200 dark:border-surface-800 pb-2 mb-4 last:border-0' : 'bg-surface-100/50 dark:bg-surface-800/30 rounded-xl p-3 mb-3 border border-surface-200 dark:border-surface-700'}>
    <button onClick={onToggle} className={`w-full flex items-center justify-between text-left group transition-transform ${level === 0 ? 'py-3 mb-2 active:scale-[0.98]' : 'py-1 mb-1 active:scale-[0.99]'}`}>
      <div className="flex items-center gap-3">
        <span className={level === 0 ? "text-2xl" : "text-lg text-primary-500/70"}>{icon}</span>
        {level === 0 ? (
          <Subtitle className="!m-0 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{title}</Subtitle>
        ) : (
          <span className="font-bold text-slate-700 dark:text-slate-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{title}</span>
        )}
      </div>
      <span className={`text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
    </button>
    {isExpanded && (
      <div className={`animate-in slide-in-from-top-2 fade-in duration-200 text-sm text-slate-600 dark:text-slate-300 space-y-3 leading-relaxed ${level === 0 ? 'mb-4 px-2' : 'mt-3 px-1'}`}>
        {children}
      </div>
    )}
  </div>
);

// --- Markdown & Frontmatter Engine ---
interface HelpDocument {
  id: string;
  title: string;
  category: string;
  tags: string[];
  content: string;
  filepath: string;
  parent?: string;
  order?: number;
}

const loadHelpDocuments = (): HelpDocument[] => {
  // Dynamically load all markdown files in the user-guide directory using Vite
  const rawFiles = import.meta.glob('../../../guides/user-guide/**/*.md', { eager: true, query: '?raw', import: 'default' });
  
  const docs: HelpDocument[] = [];

  for (const [path, content] of Object.entries(rawFiles)) {
    const fileContent = content as string;
    // Extract Frontmatter and Body
    const match = fileContent.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    
    if (match) {
      const frontmatter = match[1];
      const body = match[2];

      const titleMatch = frontmatter.match(/title:\n?\s*"([^"]+)"/);
      const categoryMatch = frontmatter.match(/category:\n?\s*"([^"]+)"/);
      const idMatch = frontmatter.match(/id:\n?\s*"([^"]+)"/);
      const tagsMatch = frontmatter.match(/tags:\n?\s*\[(.*?)\]/);
      const parentMatch = frontmatter.match(/parent:\n?\s*"([^"]+)"/);
      const orderMatch = frontmatter.match(/order:\n?\s*([0-9]+)/);

      docs.push({
        id: idMatch ? idMatch[1] : path,
        title: titleMatch ? titleMatch[1] : 'Untitled',
        category: categoryMatch ? categoryMatch[1] : 'Uncategorized',
        tags: tagsMatch ? tagsMatch[1].split(',').map(t => t.replace(/"/g, '').trim()) : [],
        content: body.trim(),
        filepath: path,
        parent: parentMatch ? parentMatch[1] : undefined,
        order: orderMatch ? parseInt(orderMatch[1], 10) : 999
      });
    }
  }

  // Sort explicitly by order first, then fallback to natural filepath numbering
  return docs.sort((a, b) => (a.order || 999) - (b.order || 999) || a.filepath.localeCompare(b.filepath));
};

// Lightweight regex-based Markdown to HTML Converter for safe internal rendering
const renderMarkdownToHTML = (md: string) => {
  let html = md
    .replace(/^# (.*$)/gim, '') // Remove the H1 since we use the accordion title for it
    .replace(/^## (.*$)/gim, '<h3 class="text-lg font-bold mt-5 mb-2 text-primary-800 dark:text-primary-300">$1</h3>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/`([^`]+)`/gim, '<code class="bg-surface-200 dark:bg-surface-800 px-1.5 py-0.5 rounded text-sm text-primary-700 dark:text-primary-300 font-mono">$1</code>')
    .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-primary-400 pl-3 py-2 my-3 bg-primary-50 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200 italic rounded-r-lg">$1</blockquote>')
    .replace(/!\[(.*?)\]\((.*?)\)/gim, '<img src="$2" alt="$1" class="my-4 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm max-w-full h-auto" />')
    .replace(/\*!Screenshot: (.*?)\*/gim, '<div class="text-xs text-slate-500 dark:text-slate-400 italic border-l-2 border-slate-300 dark:border-slate-600 pl-2 my-2">📸 $1</div>');

  // Handle Lists
  const listItems = html.split('\n');
  let inList = false;
  html = listItems.map(line => {
    if (line.match(/^\* (.*)/)) {
      const li = line.replace(/^\* (.*)/, '<li class="ml-5 list-disc mb-1 marker:text-primary-400">$1</li>');
      if (!inList) { inList = true; return `<ul class="mb-3 space-y-1">\n${li}`; }
      return li;
    } else if (line.match(/^[0-9]+\. (.*)/)) {
      const li = line.replace(/^[0-9]+\. (.*)/, '<li class="ml-5 list-decimal mb-1 marker:text-primary-400">$1</li>');
      if (!inList) { inList = true; return `<ol class="mb-3 space-y-1">\n${li}`; }
      return li;
    } else {
      if (inList) { inList = false; return `</ul>\n${line}`; }
      return line;
    }
  }).join('\n');
  if (inList) html += '</ul>';

  // Wrap paragraphs
  return html.split('\n\n').map(p => {
    if (!p.trim()) return '';
    if (p.startsWith('<') && !p.startsWith('<strong>') && !p.startsWith('<em>')) return p;
    return `<p class="mb-3 leading-relaxed text-slate-600 dark:text-slate-300">${p}</p>`;
  }).join('\n');
};

interface HelpCenterProps {
  gardenProfile?: GardenProfile | null;
  currentUser?: User | null;
  onOpenMenu: () => void;
  onOpenWorkspaceMenu?: () => void;
}

export const HelpCenter: FC<HelpCenterProps> = ({ gardenProfile, currentUser, onOpenMenu, onOpenWorkspaceMenu }) => {
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
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

  const isAdminOrOwner = hasPermission(currentUser, 'manage_dictionary');

  // Dynamically load, filter, and structure the tree
  const groupedDocs = useMemo(() => {
    const allDocs = loadHelpDocuments();
    const filtered = allDocs.filter(doc => {
      if (doc.id === 'feature-bulk-import' && !isAdminOrOwner) return false;
      return true;
    });

    // Extract children to nest them later
    const childrenMap: Record<string, HelpDocument[]> = {};
    filtered.filter(d => d.parent).forEach(doc => {
      if (doc.parent) {
        if (!childrenMap[doc.parent]) childrenMap[doc.parent] = [];
        childrenMap[doc.parent].push(doc);
      }
    });

    // Group root-level guides into specific manual ordering
    const rootDocs = filtered.filter(d => !d.parent);
    const unsortedGrouped = rootDocs.reduce((acc, doc) => {
      if (!acc[doc.category]) acc[doc.category] = [];
      acc[doc.category].push(doc);
      return acc;
    }, {} as Record<string, HelpDocument[]>);

    // Force a specific order for the main categories
    const orderedCategories = ['Views', 'Features', 'Settings', 'Tips'];
    const grouped: Record<string, HelpDocument[]> = {};
    orderedCategories.forEach(cat => { if (unsortedGrouped[cat]) grouped[cat] = unsortedGrouped[cat] });
    Object.keys(unsortedGrouped).forEach(cat => { if (!grouped[cat]) grouped[cat] = unsortedGrouped[cat] }); // Catch stragglers

    return { grouped, childrenMap };
  }, [isAdminOrOwner]);

  const categoryIcons: Record<string, string> = {
    'Views': 'layout',
    'Features': 'star',
    'Dashboard Widgets': 'dashboard',
    'Settings': 'settings',
    'Tips': 'lightbulb'
  };

  return (
    <Container className="animate-in slide-in-from-bottom-4 duration-300">
      <PageHeader title="Help & FAQs" supertitle={gardenProfile?.name || 'FloraSync'} onOpenMenu={onOpenMenu} onOpenWorkspaceMenu={onOpenWorkspaceMenu} />

      <Card className="mb-6 !bg-primary-50 dark:!bg-primary-900/20 !border-primary-200 dark:!border-primary-800 !p-0 overflow-hidden">
        <button 
          onClick={() => setIsWelcomeExpanded(prev => !prev)} 
          className="w-full flex items-center justify-between text-left p-4 transition-colors hover:bg-primary-100/50 dark:hover:bg-primary-800/30 active:scale-[0.98]"
        >
          <span className="font-bold text-primary-900 dark:text-primary-300 flex items-center gap-2">
            <span className="text-primary-600 dark:text-primary-400"><Icon name="sprout" size={24} /></span> Welcome to FloraSync
          </span>
          <span className={`text-primary-600/50 dark:text-primary-400/50 transition-transform duration-200 ${isWelcomeExpanded ? 'rotate-180' : ''}`}>▼</span>
        </button>
        {isWelcomeExpanded && (
          <div className="px-4 pb-4 animate-in slide-in-from-top-2 fade-in duration-200 space-y-3">
            <p className="text-sm font-medium text-primary-800 dark:text-primary-300">
              Welcome to FloraSync, your local, privacy-first garden command center! FloraSync is designed to eliminate the friction of data entry when managing your home greenhouse or raised beds by bridging the physical and digital worlds.
            </p>
            <p className="text-sm font-medium text-primary-800 dark:text-primary-300">
              Tap any topic below to explore the guide and learn how to get the absolute most out of your digital greenhouse.
            </p>
          </div>
        )}
      </Card>

      {/* Dynamically Map all Markdown Categories and Documents */}
      {Object.entries(groupedDocs.grouped).map(([category, categoryDocs]) => (
        <div key={category} className="mb-8">
          <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2 px-2">
            <Icon name={categoryIcons[category] || 'book-open'} size={18} /> {category}
          </h3>
          
          <div className="space-y-1">
            {categoryDocs.map(doc => (
              <HelpSection 
                key={doc.id} 
                title={doc.title} 
                icon={<Icon name="file-text" size={24} />} 
                isExpanded={expandedSections.includes(doc.id)} 
                onToggle={() => toggleSection(doc.id)}
              >
                {/* Our custom lightweight HTML renderer */}
                <div dangerouslySetInnerHTML={{ __html: renderMarkdownToHTML(doc.content) }} />
                
                {/* Nest Sub-Pages Inside */}
                {groupedDocs.childrenMap[doc.id] && groupedDocs.childrenMap[doc.id].length > 0 && (
                  <div className="mt-6 border-t border-surface-200 dark:border-surface-700 pt-5">
                    <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-2">Related Topics</h4>
                    {groupedDocs.childrenMap[doc.id].map(child => (
                      <HelpSection
                        key={child.id}
                        title={child.title}
                        icon={<Icon name="layers" size={18} />}
                        isExpanded={expandedSections.includes(child.id)}
                        onToggle={() => toggleSection(child.id)}
                        level={1}
                      >
                        <div dangerouslySetInnerHTML={{ __html: renderMarkdownToHTML(child.content) }} />
                      </HelpSection>
                    ))}
                  </div>
                )}
              </HelpSection>
            ))}
          </div>
        </div>
      ))}

    </Container>
  );
};