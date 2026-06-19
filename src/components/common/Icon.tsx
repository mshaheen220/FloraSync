import { FC, createContext, useContext } from 'react';
import { 
  AlertTriangle,
  AlignJustify,
  Aperture,
  Apple,
  ArrowDown,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  Award,
  Bell,
  Book,
  BookOpenText,
  Bookmark,
  Box,
  Bug,
  Camera,
  Cat,
  Cherry,
  ChevronRight,
  Check,
  Cloud,
  CloudCheck,
  CloudRain,
  CloudSun,
  Clover,
  Cog,
  Coins,
  Compass,
  Crown,
  Dna,
  Download,
  Droplet,
  Droplets,
  Edit2,
  Eraser,
  Eye,
  Feather,
  Fingerprint,
  Flower2,
  Focus,
  Gauge,
  Globe,
  Handshake,
  Heart,
  HelpCircle,
  Hourglass,
  Info,
  Key,
  KeyRound,
  LandPlot,
  Leaf,
  LifeBuoy,
  Lightbulb,
  Lock,
  Map,
  MapPin,
  Meh,
  Menu,
  Moon,
  MoreHorizontal,
  Package,
  Palette,
  PenTool,
  Pencil,
  PieChart,
  Pin,
  Power,
  Printer,
  RefreshCw,
  Rose,
  Ruler,
  Scale,
  ScanEye,
  ScrollText,
  Search,
  Settings,
  ShelvingUnit,
  Shield,
  ShieldAlert,
  ShoppingBag,
  Shuffle,
  Skull,
  Sliders,
  Smile,
  Soup,
  Sparkles,
  Sprout,
  Star,
  Sun,
  Tent,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  TreePalm,
  Trees,
  Utensils,
  Wand2,
  Wheat,
  Wine,
  X,
  XOctagon,
} from 'lucide-react';

// This maps your friendly string names to the actual Lucide components
// This acts as the base "fallback" theme if no custom theme or plugin overrides it.
const DEFAULT_ICON_MAP = {
  'alert': AlertTriangle,
  'alert-circle': AlertTriangle,
  'apple': Apple,
  'award': Award,
  'back': ArrowLeft,
  'book-open-text': BookOpenText,
  'bug': Bug,
  'camera': Camera,
  'cat': Cat,
  'check': Check,
  'chevron-right': ChevronRight,
  'cloud': Cloud,
  'cloud-check': CloudCheck,
  'cloud-rain': CloudRain,
  'cloud-sun': CloudSun,
  'coins': Coins,
  'crown': Crown,
  'dashboard': Gauge,
  'delete': Trash2,
  'dna': Dna,
  'down': ArrowDown,
  'download': Download,
  'droplet': Droplet,
  'edit': Edit2,
  'feed': Leaf,
  'globe': Globe,
  'handshake': Handshake,
  'heart': Heart,
  'harvest': Wheat,
  'help-circle': HelpCircle,
  'hourglass': Hourglass,
  'info': Info,
  'key': Key,
  'key-round': KeyRound,
  'land-plot': LandPlot,
  'leaf': Leaf,
  'left': ArrowLeft,
  'lightbulb': Lightbulb,
  'lock': Lock,
  'map-pin': MapPin,
  'meh': Meh,
  'menu': Menu,
  'moon': Moon,
  'package': Package,
  'palette': Palette,
  'pencil': Pencil,
  'pie-chart': PieChart,
  'pin': Pin,
  'power': Power,
  'print': Printer,
  'refresh': RefreshCw,
  'right': ArrowRight,
  'rose': Rose,
  'ruler': Ruler,
  'scale': Scale,
  'settings': Settings,
  'shelving-unit': ShelvingUnit,
  'shield': Shield,
  'shopping-bag': ShoppingBag,
  'shuffle': Shuffle,
  'skull': Skull,
  'smile': Smile,
  'soup': Soup,
  'sparkles': Sparkles,
  'sprout': Sprout,
  'sun': Sun,
  'thumbs-down': ThumbsDown,
  'thumbs-up': ThumbsUp,
  'tree-palm': TreePalm,
  'up': ArrowUp,
  'utensils': Utensils,
  'view': Eye,
  'water': Droplets,
  'wine': Wine,
  'x': X,
} as const;

export type IconName = keyof typeof DEFAULT_ICON_MAP;

export type SingleIconDef = React.ElementType | string;
export type ThemeIconDef = SingleIconDef | { light?: SingleIconDef; dark?: SingleIconDef };

// Example of a secondary built-in theme! 
// Notice how it only overrides a few icons. The provider will automatically 
// fall back to DEFAULT_ICON_MAP for any icon not explicitly listed here!
export const ELEGANT_THEME: Record<string, ThemeIconDef> = {
  'alert': ShieldAlert,
  'alert-circle': ShieldAlert,
  'apple': Cherry,
  'book-open-text': ScrollText,
  'camera': Aperture,
  'delete': XOctagon,
  'edit': PenTool,
  'feed': Flower2,
  'harvest': Package,
  'help-circle': LifeBuoy,
  'leaf': Feather,
  'map-pin': Compass,
  'menu': MoreHorizontal,
  'print': Fingerprint,
  'settings': Sliders,
  'sparkles': Wand2,
  'sprout': Clover,
  'tree-palm': Trees,
  'view': ScanEye,
  'water': CloudRain,
};

export const MINIMALIST_THEME: Record<string, ThemeIconDef> = {
  'alert': Bell,
  'alert-circle': Bell,
  'apple': ShoppingBag,
  'book-open-text': Book,
  'camera': Focus,
  'delete': Eraser,
  'edit': Pencil,
  'feed': Leaf,
  'harvest': ShoppingBag,
  'help-circle': Info,
  'leaf': Bookmark,
  'map-pin': Map,
  'menu': AlignJustify,
  'print': Printer,
  'settings': Cog,
  'sparkles': Star,
  'sprout': Tent,
  'tree-palm': Box,
  'view': Search,
  'water': Droplet,
};

const createImageIcon = (src: string) => {
  return ({ size = 24, className = '' }: { size?: number | string, className?: string }) => (
    <img src={src} width={size} height={size} className={`object-contain ${className}`} alt={src} title={src} />
  );
};

export const BOHO_NATURE_THEME: Record<string, ThemeIconDef> = {
  'alert': createImageIcon('/images/icons/boho-nature/alert.png'),
  'alert-circle': createImageIcon('/images/icons/boho-nature/alert-circle.png'),
  'apple': createImageIcon('/images/icons/boho-nature/apple.png'),
  'book-open-text': createImageIcon('/images/icons/boho-nature/book.png'),
  'camera': createImageIcon('/images/icons/boho-nature/camera.png'),
  'cat': createImageIcon('/images/icons/boho-nature/cats.png'),
  'cloud-rain': createImageIcon('/images/icons/boho-nature/rain-cloud.png'),
  'cloud-sun': createImageIcon('/images/icons/boho-nature/partly-cloudy.png'),
  'crown': createImageIcon('/images/icons/boho-nature/crown.png'),
  'dashboard': createImageIcon('/images/icons/boho-nature/compass.png'),
  'delete': createImageIcon('/images/icons/boho-nature/delete.png'),
  'download': createImageIcon('/images/icons/boho-nature/download.png'),
  'droplet': createImageIcon('/images/icons/boho-nature/watering-can.png'),
  'edit': createImageIcon('/images/icons/boho-nature/edit.png'),
  'feed': createImageIcon('/images/icons/boho-nature/feed.png'),
  'globe': createImageIcon('/images/icons/boho-nature/globe.png'),
  'handshake': createImageIcon('/images/icons/boho-nature/handshake.png'),
  'harvest': createImageIcon('/images/icons/boho-nature/basket.png'),
  'heart': createImageIcon('/images/icons/boho-nature/heart.png'),
  'help-circle': createImageIcon('/images/icons/boho-nature/help-circle.png'),
  'key-round': {
    light: createImageIcon('/images/icons/boho-nature/key.png'),
    dark: '🔑'
  },
  'land-plot': createImageIcon('/images/icons/boho-nature/garden-gate.png'),
  'leaf': createImageIcon('/images/icons/boho-nature/leaf.png'),
  'map-pin': createImageIcon('/images/icons/boho-nature/map-pin.png'),
  'menu': createImageIcon('/images/icons/boho-nature/menu.png'),
  'moon': {
    light: createImageIcon('/images/icons/boho-nature/moon.png'),
    dark: '🌙',
  },
  'package': createImageIcon('/images/icons/boho-nature/package.png'),
  'palette': createImageIcon('/images/icons/boho-nature/mirror.png'),
  'pencil': createImageIcon('/images/icons/boho-nature/edit.png'),
  'print': createImageIcon('/images/icons/boho-nature/printer.png'),
  'rose': createImageIcon('/images/icons/boho-nature/garden.png'),
  'settings': {
    light: createImageIcon('/images/icons/boho-nature/settings.png'),
    dark: '⚙️'
  },
  'shelving-unit': createImageIcon('/images/icons/boho-nature/basket.png'),
  'shield': createImageIcon('/images/icons/boho-nature/shield.png'),
  'smile': createImageIcon('/images/icons/boho-nature/laughing.png'),
  'sparkles': {
    light: createImageIcon('/images/icons/boho-nature/wand.png'),
    dark: '🎉'
  },
  'sprout': createImageIcon('/images/icons/boho-nature/sprout.png'),
  'sun': {
    light: createImageIcon('/images/icons/boho-nature/sun.png'),
    dark: '☀️',
  },
  'tree-palm': createImageIcon('/images/icons/boho-nature/tree.png'),
  'view': createImageIcon('/images/icons/boho-nature/view.png'),
  'water': createImageIcon('/images/icons/boho-nature/water.png'),
};

export const SCIENCE_THEME: Record<string, ThemeIconDef> = {
  'alert': createImageIcon('/images/icons/science/alert.png'),
  'alert-circle': createImageIcon('/images/icons/science/alert-circle.png'),
  'apple': createImageIcon('/images/icons/science/apple.png'),
  'book-open-text': createImageIcon('/images/icons/science/book.png'),
  'camera': createImageIcon('/images/icons/science/camera1.png'),
  'delete': createImageIcon('/images/icons/science/trash.png'),
  'download': createImageIcon('/images/icons/science/download.png'),
  'droplet': createImageIcon('/images/icons/science/droplet.png'),
  'edit': createImageIcon('/images/icons/science/edit.png'),
  'feed': createImageIcon('/images/icons/science/leaf1.png'),
  'harvest': createImageIcon('/images/icons/science/harvest.png'),
  'help-circle': createImageIcon('/images/icons/science/help.png'),
  'land-plot': createImageIcon('/images/icons/science/garden4.png'),
  'leaf': createImageIcon('/images/icons/science/leaf1.png'),
  'map-pin': createImageIcon('/images/icons/science/map-pin.png'),
  'menu': createImageIcon('/images/icons/science/menu.png'),
  'print': createImageIcon('/images/icons/science/printer.png'),
  'settings': createImageIcon('/images/icons/science/settings.png'),
  'shield': createImageIcon('/images/icons/science/shield.png'),
  // 'sparkles': createImageIcon('/images/icons/science/wand.png'),
  // 'sprout': createImageIcon('/images/icons/science/sprout.png'),
  'view': createImageIcon('/images/icons/science/view.png'),
  'water': createImageIcon('/images/icons/science/watering-can.png')
};
export const EMOJI_THEME: Record<string, ThemeIconDef> = {
  'alert': '⚠️',
  'alert-circle': '🚨',
  'apple': '🍎',
  'award': '🏆',
  'back': '🔙',
  'book-open-text': '📖',
  'bug': '🐛',
  'camera': '📷',
  'cat': '🐱',
  'cloud': '☁️',
  'cloud-check': '✅',
  'cloud-rain': '🌧️',
  'cloud-sun': '⛅',
  'coins': '🪙',
  'crown': '👑',
  'dashboard': '📊',
  'delete': '🗑️',
  'dna': '🧬',
  'download': '⬇️',
  'droplet': '💧',
  'edit': '✏️',
  'feed': '🌿',
  'globe': '🌍',
  'handshake': '🤝',
  'harvest': '🧺',
  'heart': '❤️',
  'help-circle': '❓',
  'hourglass': '⏳',
  'info': 'ℹ️',
  'key': '🔑',
  'key-round': '🗝️',
  'land-plot': '🏞️',
  'leaf': '🍃',
  'lightbulb': '💡',
  'map-pin': '📍',
  'meh': '😐',
  'menu': '≡',
  'moon': '🌙',
  'package': '📦',
  'palette': '🎨',
  'pencil': '📝',
  'pin': '📌',
  'print': '🖨️',
  'refresh': '🔄',
  'rose': '🌹',
  'ruler': '📏',
  'scale': '⚖️',
  'settings': '⚙️',
  'shelving-unit': '🗄️',
  'shield': '🛡️',
  'shuffle': '🔀',
  'skull': '💀',
  'smile': '😊',
  'soup': '🍲',
  'sparkles': '✨',
  'sprout': '🌱',
  'sun': '☀️',
  'thumbs-down': '👎',
  'thumbs-up': '👍',
  'tree-palm': '🌴',
  'utensils': '🍴',
  'view': '👁️',
  'water': '💧',
  'wine': '🍷',
};

// 1. Create a Context to hold any active theme or plugin icon overrides
export const IconContext = createContext<{ customIcons: Record<string, ThemeIconDef> }>({ customIcons: {} });

// 2. Create a Provider that you can wrap around your app (or just specific components) to inject new icons
export const IconProvider: FC<{ theme?: Record<string, ThemeIconDef>, children: React.ReactNode }> = ({ theme = {}, children }) => {
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
  
  // Map semantic sizes to pixel values
  const sizeMap = {
    sm: 16,
    md: 20,
    lg: 24,
  };
  
  const resolvedSize = typeof size === 'number' ? size : sizeMap[size];

  const themeIcon = customIcons[name as string];
  let lightIcon: SingleIconDef | undefined;
  let darkIcon: SingleIconDef | undefined;

  if (themeIcon) {
    // Check if the theme specifically provided a light/dark object configuration
    if (typeof themeIcon === 'object' && themeIcon !== null && ('light' in themeIcon || 'dark' in themeIcon)) {
      lightIcon = (themeIcon as any).light || DEFAULT_ICON_MAP[name as IconName];
      darkIcon = (themeIcon as any).dark || lightIcon;
    } else {
      lightIcon = themeIcon as SingleIconDef;
      darkIcon = themeIcon as SingleIconDef;
    }
  } else {
    lightIcon = DEFAULT_ICON_MAP[name as IconName];
    darkIcon = DEFAULT_ICON_MAP[name as IconName];
  }
  
  if (!lightIcon) {
    // If not found in maps, check if the string contains a standard OS emoji
    const isEmoji = /\p{Extended_Pictographic}/u.test(name as string);
    
    if (isEmoji) {
      lightIcon = name as string;
      darkIcon = name as string;
    } else {
      console.warn(`Icon '${name}' not found in default mapping or active theme.`);
      return null;
    }
  }

  const renderIconDef = (Def: SingleIconDef, mode: 'light' | 'dark' | 'both') => {
    let modeClass = '';
    // Assign exact Tailwind classes that instantly swap displays without breaking layout alignment
    if (mode === 'light') modeClass = 'dark:hidden';
    else if (mode === 'dark') modeClass = typeof Def === 'string' ? 'hidden dark:inline-flex' : 'hidden dark:inline-block';

    const combinedClass = `${className} icon-${name as string} ${modeClass}`.trim();
    
    if (typeof Def === 'string') {
      return (
        <span 
          className={`inline-flex items-center justify-center ${combinedClass}`}
          style={{ fontSize: `${resolvedSize}px`, width: `${resolvedSize}px`, height: `${resolvedSize}px`, lineHeight: 1 }}
          role="img"
          aria-label={name as string}
        >
          {Def}
        </span>
      );
    }
    return <Def size={resolvedSize} className={combinedClass} />;
  };

  if (lightIcon === darkIcon) {
    return renderIconDef(lightIcon, 'both');
  }

  return (
    <>
      {renderIconDef(lightIcon, 'light')}
      {renderIconDef(darkIcon!, 'dark')}
    </>
  );
};