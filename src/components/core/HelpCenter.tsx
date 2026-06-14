import { useState, useEffect, FC, useMemo, lazy, Suspense } from 'react';
import { Container, Card, Subtitle, Input } from '../../styles/StyledElements';
import { PageHeader } from '../common/PageHeader';
import { GardenProfile, User } from '../../../types';
import { hasPermission } from '../../utils/permissions';
import { Icon } from '../common/Icon';
import 'swagger-ui-react/swagger-ui.css';

const SwaggerUI = lazy(() => import('swagger-ui-react'));

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

const loadDocuments = (rawFiles: Record<string, unknown>): HelpDocument[] => {
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
  // Extract fenced code blocks first to protect them from line-level formatting
  const codeBlocks: string[] = [];
  let html = md.replace(/```(\w+)?\n([\s\S]*?)```/gim, (_match, _lang, code) => {
    const safeCode = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    codeBlocks.push(`<pre class="bg-slate-800 text-slate-200 p-4 rounded-xl text-sm font-mono overflow-x-auto my-4 border border-slate-700 shadow-sm"><code>${safeCode.trim()}</code></pre>`);
    return `\n\n__CODE_BLOCK_${codeBlocks.length - 1}__\n\n`;
  });

  html = html
    .replace(/^# (.*$)/gim, '') // Remove the H1 since we use the accordion title for it
    .replace(/^#### (.*$)/gim, '<h5 class="text-sm font-bold mt-4 mb-2 text-primary-600 dark:text-primary-400">$1</h5>')
    .replace(/^### (.*$)/gim, '<h4 class="text-base font-bold mt-4 mb-2 text-primary-700 dark:text-primary-300">$1</h4>')
    .replace(/^## (.*$)/gim, '<h3 class="text-lg font-bold mt-5 mb-2 text-primary-800 dark:text-primary-300">$1</h3>')
    .replace(/\*!Screenshot: (.*?)\*/gim, '<div class="text-xs text-slate-500 dark:text-slate-400 italic border-l-2 border-slate-300 dark:border-slate-600 pl-2 my-2">📸 $1</div>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(?!\s)([^*]+?)\*/gim, '<em>$1</em>')
    .replace(/`([^`]+)`/gim, '<code class="bg-surface-200 dark:bg-surface-800 px-1.5 py-0.5 rounded text-sm text-primary-700 dark:text-primary-300 font-mono">$1</code>')
    .replace(/(?:^> .*(?:\n|$))+/gim, (match) => {
      const content = match.replace(/^> /gm, '').trim().replace(/\n/g, '<br />');
      return `<blockquote class="border-l-4 border-primary-400 pl-3 py-3 my-4 bg-primary-50 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200 italic rounded-r-lg">${content}</blockquote>`;
    })
    .replace(/!\[(.*?)\]\((.*?)\)/gim, (_match, alt, src) => {
      // Rewrite local relative paths meant for IDE preview into absolute web paths for production
      const cleanSrc = src.replace(/^(\.\.\/)+public\//, '/');
      return `<img src="${cleanSrc}" alt="${alt}" class="my-4 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm max-w-full h-auto" />`;
    });

  // Handle Tables
  html = html.replace(/(?:^\|.*\|(?:\n|$))+/gm, (match) => {
    const rows = match.trim().split('\n');
    if (rows.length < 2) return match;
    
    // Check if second row is a separator
    const isSeparator = /^\|?[\s\-\|:]+\|?$/.test(rows[1]);
    if (!isSeparator) return match;

    let tableHtml = '<div class="overflow-x-auto my-4 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm"><table class="w-full text-left text-sm">';
    
    const headers = rows[0].split('|').slice(1, -1).map(h => h.trim());
    tableHtml += '<thead class="bg-surface-100 dark:bg-surface-800 text-slate-700 dark:text-slate-200"><tr>';
    headers.forEach(h => {
      tableHtml += `<th class="px-3 py-2 font-bold">${h}</th>`;
    });
    tableHtml += '</tr></thead>';

    tableHtml += '<tbody class="divide-y divide-surface-200 dark:divide-surface-700">';
    for (let i = 2; i < rows.length; i++) {
      const cells = rows[i].split('|').slice(1, -1).map(c => c.trim());
      tableHtml += '<tr class="bg-white dark:bg-surface-900">';
      cells.forEach(c => {
        tableHtml += `<td class="px-3 py-2 text-slate-600 dark:text-slate-300 align-top">${c}</td>`;
      });
      tableHtml += '</tr>';
    }
    tableHtml += '</tbody></table></div>\n\n';

    return tableHtml;
  });

  // Handle Lists
  const listItems = html.split('\n');
  let inList = false;
  let currentListType = '';
  html = listItems.map(line => {
    const ulMatch = line.match(/^(\s*)\* (.*)/);
    const olMatch = line.match(/^(\s*)([0-9]+)\. (.*)/);
    
    if (ulMatch) {
      const indent = ulMatch[1].length;
      const liClass = indent > 0 ? "ml-10 list-[circle] mb-1 marker:text-primary-400" : "ml-5 list-disc mb-1 marker:text-primary-400";
      const li = `<li class="${liClass}">${ulMatch[2]}</li>`;
      if (!inList) { inList = true; currentListType = 'ul'; return `<ul class="mb-3 space-y-1">\n${li}`; }
      return li;
    } else if (olMatch) {
      const indent = olMatch[1].length;
      const startNum = olMatch[2];
      const content = olMatch[3];
      const liClass = indent > 0 ? "ml-10 list-decimal mb-1 marker:text-primary-400" : "ml-5 list-decimal mb-1 marker:text-primary-400";
      const li = `<li class="${liClass}">${content}</li>`;
      if (!inList) { inList = true; currentListType = 'ol'; return `<ol start="${startNum}" class="mb-3 space-y-1">\n${li}`; }
      return li;
    } else {
      if (inList) { 
        inList = false; 
        const closingTag = currentListType === 'ol' ? '</ol>' : '</ul>';
        return `${closingTag}\n${line}`; 
      }
      return line;
    }
  }).join('\n');
  if (inList) html += currentListType === 'ol' ? '</ol>' : '</ul>';

  // Wrap paragraphs
  html = html.split('\n\n').map(p => {
    if (!p.trim()) return '';
    if (p.startsWith('<') && !p.startsWith('<strong>') && !p.startsWith('<em>')) return p;
    if (p.trim().startsWith('__CODE_BLOCK_')) return p.trim();
    return `<p class="mb-3 leading-relaxed text-slate-600 dark:text-slate-300">${p}</p>`;
  }).join('\n');

  // Re-inject fenced code blocks
  codeBlocks.forEach((block, i) => {
    html = html.replace(`__CODE_BLOCK_${i}__`, block);
  });

  return html;
};

export interface HelpCenterProps {
  gardenProfile?: GardenProfile | null;
  currentUser?: User | null;
  onOpenMenu: () => void;
  onOpenWorkspaceMenu?: () => void;
}

interface BaseDocumentCenterProps extends HelpCenterProps {
  title: string;
  welcomeTitle: string;
  welcomeIcon: string;
  welcomeContent: React.ReactNode;
  rawFiles: Record<string, unknown>;
  orderedCategories: string[];
  storageKey: string;
}

const BaseDocumentCenter: FC<BaseDocumentCenterProps> = ({ 
  title, welcomeTitle, welcomeIcon, welcomeContent, rawFiles, orderedCategories, storageKey,
  gardenProfile, currentUser, onOpenMenu, onOpenWorkspaceMenu 
}) => {
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isWelcomeExpanded, setIsWelcomeExpanded] = useState(() => {
    const hasVisited = localStorage.getItem(storageKey);
    return !hasVisited;
  });

  useEffect(() => {
    if (!localStorage.getItem(storageKey)) {
      localStorage.setItem(storageKey, 'true');
    }
  }, [storageKey]);

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
    const allDocs = loadDocuments(rawFiles);
    const isSearching = searchTerm.trim().length > 0;
    const term = searchTerm.toLowerCase();

    const filtered = allDocs.filter(doc => {
      if (doc.id === 'feature-bulk-import' && !isAdminOrOwner) return false;
      if (isSearching) {
        return doc.title.toLowerCase().includes(term) || 
               doc.tags.some(t => t.toLowerCase().includes(term)) ||
               doc.content.toLowerCase().includes(term);
      }
      return true;
    });

    // Extract children to nest them later
    const childrenMap: Record<string, HelpDocument[]> = {};
    if (!isSearching) {
      filtered.filter(d => d.parent).forEach(doc => {
        if (doc.parent) {
          if (!childrenMap[doc.parent]) childrenMap[doc.parent] = [];
          childrenMap[doc.parent].push(doc);
        }
      });
    }

    // Group root-level guides into specific manual ordering
    // If searching, we flatten the hierarchy so matching children aren't hidden inside collapsed parents!
    const rootDocs = isSearching ? filtered : filtered.filter(d => !d.parent);
    const unsortedGrouped = rootDocs.reduce((acc, doc) => {
      if (!acc[doc.category]) acc[doc.category] = [];
      acc[doc.category].push(doc);
      return acc;
    }, {} as Record<string, HelpDocument[]>);

    // Force a specific order for the main categories
    const grouped: Record<string, HelpDocument[]> = {};
    orderedCategories.forEach(cat => { if (unsortedGrouped[cat]) grouped[cat] = unsortedGrouped[cat] });
    Object.keys(unsortedGrouped).forEach(cat => { if (!grouped[cat]) grouped[cat] = unsortedGrouped[cat] }); // Catch stragglers

    return { grouped, childrenMap };
  }, [isAdminOrOwner, searchTerm, rawFiles, orderedCategories]);

  const categoryIcons: Record<string, string> = {
    'Views': 'layout',
    'Features': 'star',
    'Dashboard Widgets': 'dashboard',
    'Settings': 'settings',
    'Tips': 'lightbulb',
    'Developer Guide': 'code',
    'Architecture': 'server',
    'Plugins': 'box'
  };

  return (
    <Container className="animate-in slide-in-from-bottom-4 duration-300">
      <PageHeader title={title} supertitle={gardenProfile?.name || 'FloraSync'} onOpenMenu={onOpenMenu} onOpenWorkspaceMenu={onOpenWorkspaceMenu} />

      <Card className="mb-6 !bg-primary-50 dark:!bg-primary-900/20 !border-primary-200 dark:!border-primary-800 !p-0 overflow-hidden">
        <button 
          onClick={() => setIsWelcomeExpanded(prev => !prev)} 
          className="w-full flex items-center justify-between text-left p-4 transition-colors hover:bg-primary-100/50 dark:hover:bg-primary-800/30 active:scale-[0.98]"
        >
          <span className="font-bold text-primary-900 dark:text-primary-300 flex items-center gap-2">
            <span className="text-primary-600 dark:text-primary-400"><Icon name={welcomeIcon} size={24} /></span> {welcomeTitle}
          </span>
          <span className={`text-primary-600/50 dark:text-primary-400/50 transition-transform duration-200 ${isWelcomeExpanded ? 'rotate-180' : ''}`}>▼</span>
        </button>
        {isWelcomeExpanded && (
          <div className="px-4 pb-4 animate-in slide-in-from-top-2 fade-in duration-200 space-y-3">
            {welcomeContent}
          </div>
        )}
      </Card>

      <div className="mb-8">
        <Input 
          placeholder="🔍 Search guides, features, or tags..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
        />
      </div>

      {/* Dynamically Map all Markdown Categories and Documents */}
      {Object.entries(groupedDocs.grouped).length === 0 ? (
        <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-8">No matching guides found.</p>
      ) : (
        Object.entries(groupedDocs.grouped).map(([category, categoryDocs]) => (
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
                {/* Intercept the API Reference doc to render Swagger UI */}
                {doc.id === 'dev-api-swagger' ? (
                  <div className="bg-white text-slate-900 rounded-xl overflow-x-auto p-2 [&_.swagger-ui_.info]:!my-[10px]">
                    <Suspense fallback={<div className="p-8 text-center text-slate-500 animate-pulse font-bold">Loading API Documentation...</div>}>
                      <SwaggerUI url="/swagger.json" />
                    </Suspense>
                  </div>
                ) : (
                  <div dangerouslySetInnerHTML={{ __html: renderMarkdownToHTML(doc.content) }} />
                )}
                
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
                        {child.id === 'dev-api-swagger' ? (
                          <div className="bg-white text-slate-900 rounded-xl overflow-x-auto p-2 [&_.swagger-ui_.info]:!my-[10px]">
                            <Suspense fallback={<div className="p-8 text-center text-slate-500 animate-pulse font-bold">Loading API Documentation...</div>}>
                              <SwaggerUI url="/swagger.json" />
                            </Suspense>
                          </div>
                        ) : (
                          <div dangerouslySetInnerHTML={{ __html: renderMarkdownToHTML(child.content) }} />
                        )}
                      </HelpSection>
                    ))}
                  </div>
                )}
              </HelpSection>
            ))}
          </div>
        </div>
        ))
      )}

    </Container>
  );
};

const userGuideFiles = import.meta.glob('../../../guides/user-guide/**/*.md', { eager: true, query: '?raw', import: 'default' });

export const HelpCenter: FC<HelpCenterProps> = (props) => (
  <BaseDocumentCenter
    {...props}
    title="Help & FAQs"
    welcomeTitle="Welcome to FloraSync"
    welcomeIcon="sprout"
    welcomeContent={
      <>
        <p className="text-sm font-medium text-primary-800 dark:text-primary-300">
          Welcome to FloraSync, your local, privacy-first garden command center! FloraSync is designed to eliminate the friction of data entry when managing your home greenhouse or raised beds by bridging the physical and digital worlds.
        </p>
        <p className="text-sm font-medium text-primary-800 dark:text-primary-300">
          Tap any topic below to explore the guide and learn how to get the absolute most out of your digital greenhouse.
        </p>
      </>
    }
    rawFiles={userGuideFiles}
    orderedCategories={['Views', 'Features', 'Dashboard Widgets', 'Settings', 'Tips']}
    storageKey="florasync_help_welcome_seen"
  />
);

const devGuideFiles = import.meta.glob('../../../guides/developer-guide/**/*.md', { eager: true, query: '?raw', import: 'default' });

export const DeveloperGuide: FC<HelpCenterProps> = (props) => (
  <BaseDocumentCenter
    {...props}
    title="Developer Guide"
    welcomeTitle="Developer Guide"
    welcomeIcon="code"
    welcomeContent={
      <>
        <p className="text-sm font-medium text-primary-800 dark:text-primary-300">
          Welcome to the FloraSync Developer Guide! Here you'll find technical documentation, architecture overviews, and guides on building plugins and extending the system.
        </p>
        <p className="text-sm font-medium text-primary-800 dark:text-primary-300">
          Tap any topic below to explore the internal workings of FloraSync.
        </p>
      </>
    }
    rawFiles={devGuideFiles}
    orderedCategories={['Developer Guide', 'Architecture', 'Plugins']}
    storageKey="florasync_dev_welcome_seen"
  />
);