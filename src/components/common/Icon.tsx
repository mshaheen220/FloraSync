import { FC, createContext, useContext } from 'react';
import { 
  Droplets, 
  Leaf, 
  Edit2, 
  Trash2, 
  Eye, 
  ArrowLeft, 
  Menu,
  Pin,
  Camera,
  Info,
  Scale,
  Ruler,
  Sprout,
  Palette,
  AlertTriangle,
  Sparkles,
  MapPin,
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  Droplet,
  Utensils,
  Hourglass,
  Bug,
  Skull,
  Wine,
  Soup,
  Lightbulb,
  Smile,
  Heart,
  Coins,
  Cat,
  Dna,
  HelpCircle,
  Apple,
  Printer,
  ShelvingUnit,
  LandPlot,
  Rose,
  BookOpenText,
  Settings,
  CloudCheck,
  Shield,
  Crown,
  Handshake,
  Key,
  KeyRound,
  Pencil,
  Package,
  TreePalm,
  Globe,
  Download,
  Shuffle
} from 'lucide-react';

// This maps your friendly string names to the actual Lucide components
// This acts as the base "fallback" theme if no custom theme or plugin overrides it.
const DEFAULT_ICON_MAP = {
  'water': Droplets,
  'feed': Leaf,
  'edit': Edit2,
  'delete': Trash2,
  'view': Eye,
  'back': ArrowLeft,
  'menu': Menu,
  'pin': Pin,
  'camera': Camera,
  'info': Info,
  'scale': Scale,
  'ruler': Ruler,
  'sprout': Sprout,
  'leaf': Leaf,
  'palette': Palette,
  'alert': AlertTriangle,
  'sparkles': Sparkles,
  'map-pin': MapPin,
  'sun': Sun,
  'cloud-sun': CloudSun,
  'cloud': Cloud,
  'cloud-rain': CloudRain,
  'droplet': Droplet,
  'utensils': Utensils,
  'hourglass': Hourglass,
  'bug': Bug,
  'skull': Skull,
  'wine': Wine,
  'soup': Soup,
  'lightbulb': Lightbulb,
  'alert-circle': AlertTriangle,
  'smile': Smile,
  'heart': Heart,
  'coins': Coins,
  'cat': Cat,
  'dna': Dna,
  'help-circle': HelpCircle,
  'apple': Apple,
  'print': Printer,
  'shelving-unit': ShelvingUnit,
  'land-plot': LandPlot,
  'rose': Rose,
  'book-open-text': BookOpenText,
  'settings': Settings,
  'cloud-check': CloudCheck,
  'shield': Shield,
  'crown': Crown,
  'handshake': Handshake,
  'key': Key,
  'key-round': KeyRound,
  'pencil': Pencil,
  'package': Package,
  'tree-palm': TreePalm,
  'globe': Globe,
  'download': Download,
  'shuffle': Shuffle
} as const;

export type IconName = keyof typeof DEFAULT_ICON_MAP;

// 1. Create a Context to hold any active theme or plugin icon overrides
export const IconContext = createContext<{ customIcons: Record<string, React.ElementType> }>({ customIcons: {} });

// 2. Create a Provider that you can wrap around your app (or just specific components) to inject new icons
export const IconProvider: FC<{ theme?: Record<string, React.ElementType>, children: React.ReactNode }> = ({ theme = {}, children }) => {
  return <IconContext.Provider value={{ customIcons: theme }}>{children}</IconContext.Provider>;
};

interface IconProps {
  // The `(string & {})` trick preserves TypeScript autocomplete for your default 
  // Lucide icons, while still allowing plugins to pass totally arbitrary string names!
  name: IconName | (string & {}); 
  className?: string;
  size?: 'sm' | 'md' | 'lg' | number;
}

export const Icon: FC<IconProps> = ({ name, className = '', size = 'md' }) => {
  const { customIcons } = useContext(IconContext);
  
  // Check the plugin/theme registry first. If it's empty, fall back to the default map!
  const ResolvedIcon = customIcons[name as string] || DEFAULT_ICON_MAP[name as IconName];
  
  if (!ResolvedIcon) {
    console.warn(`Icon '${name}' not found in default mapping or active theme.`);
    return null;
  }

  // Map semantic sizes to pixel values
  const sizeMap = {
    sm: 16,
    md: 20,
    lg: 24,
  };
  
  const resolvedSize = typeof size === 'number' ? size : sizeMap[size];

  return <ResolvedIcon size={resolvedSize} className={className} />;
};