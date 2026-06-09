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
  Moon,
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
  Shuffle,
  Flower2,
  PenTool,
  XOctagon,
  ScanEye,
  Compass,
  Eraser,
  Search,
  Map,
  Feather, 
  Clover, 
  Cherry, 
  ShieldAlert, 
  ScrollText, 
  Wand2, 
  Trees,
  MoreHorizontal, 
  Sliders, 
  Aperture, 
  Fingerprint, 
  LifeBuoy,
  Bookmark, 
  Tent, 
  ShoppingBag, 
  Bell, 
  Book, 
  Star, 
  Box,
  AlignJustify, 
  Cog, 
  Focus,
  Gauge,
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
  'moon': Moon,
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
  'shuffle': Shuffle,
  'dashboard': Gauge
} as const;

export type IconName = keyof typeof DEFAULT_ICON_MAP;

export type SingleIconDef = React.ElementType | string;
export type ThemeIconDef = SingleIconDef | { light?: SingleIconDef; dark?: SingleIconDef };

// Example of a secondary built-in theme! 
// Notice how it only overrides a few icons. The provider will automatically 
// fall back to DEFAULT_ICON_MAP for any icon not explicitly listed here!
export const ELEGANT_THEME: Record<string, ThemeIconDef> = {
  'water': CloudRain,
  'feed': Flower2,
  'edit': PenTool,
  'delete': XOctagon,
  'view': ScanEye,
  'map-pin': Compass,
  'leaf': Feather,
  'sprout': Clover,
  'apple': Cherry,
  'alert': ShieldAlert,
  'alert-circle': ShieldAlert,
  'book-open-text': ScrollText,
  'sparkles': Wand2,
  'tree-palm': Trees,
  'menu': MoreHorizontal,
  'settings': Sliders,
  'camera': Aperture,
  'print': Fingerprint,
  'help-circle': LifeBuoy
};

export const MINIMALIST_THEME: Record<string, ThemeIconDef> = {
  'water': Droplet,
  'feed': Leaf,
  'edit': Pencil,
  'delete': Eraser,
  'view': Search,
  'map-pin': Map,
  'leaf': Bookmark,
  'sprout': Tent,
  'apple': ShoppingBag,
  'alert': Bell,
  'alert-circle': Bell,
  'book-open-text': Book,
  'sparkles': Star,
  'tree-palm': Box,
  'menu': AlignJustify,
  'settings': Cog,
  'camera': Focus,
  'print': Printer,
  'help-circle': Info
};

const createImageIcon = (src: string) => {
  return ({ size = 24, className = '' }: { size?: number | string, className?: string }) => (
    <img src={src} width={size} height={size} className={`object-contain ${className}`} alt={src} title={src} />
  );
};

export const BOHO_NATURE_THEME: Record<string, ThemeIconDef> = {
  'alert-circle': createImageIcon('/images/icons/boho-nature/alert-circle.png'),
  'alert': createImageIcon('/images/icons/boho-nature/alert.png'),
  'apple': createImageIcon('/images/icons/boho-nature/apple.png'),
  'book-open-text': createImageIcon('/images/icons/boho-nature/book.png'),
  'camera': createImageIcon('/images/icons/boho-nature/camera.png'),
  'delete': createImageIcon('/images/icons/boho-nature/delete.png'),
  'download': createImageIcon('/images/icons/boho-nature/download.png'),
  'edit': createImageIcon('/images/icons/boho-nature/edit.png'),
  'feed': createImageIcon('/images/icons/boho-nature/feed.png'),
  'land-plot': createImageIcon('/images/icons/boho-nature/garden-gate.png'),
  'help-circle': createImageIcon('/images/icons/boho-nature/help-circle.png'),
  'leaf': createImageIcon('/images/icons/boho-nature/leaf.png'),
  'map-pin': createImageIcon('/images/icons/boho-nature/map-pin.png'),
  'menu': createImageIcon('/images/icons/boho-nature/menu.png'),
  'pencil': createImageIcon('/images/icons/boho-nature/edit.png'),
  'print': createImageIcon('/images/icons/boho-nature/printer.png'),
  'settings': {
    light: createImageIcon('/images/icons/boho-nature/settings.png'),
    dark: '⚙️'
  },
  'shield': createImageIcon('/images/icons/boho-nature/shield.png'),
  'sprout': createImageIcon('/images/icons/boho-nature/sprout.png'),
  'view': createImageIcon('/images/icons/boho-nature/view.png'),
  'sparkles': {
    light: createImageIcon('/images/icons/boho-nature/wand.png'),
    dark: '🎉'
  },
  'water': createImageIcon('/images/icons/boho-nature/water.png'),
  'droplet': createImageIcon('/images/icons/boho-nature/watering-can.png'),
  'shelving-unit': createImageIcon('/images/icons/boho-nature/basket.png'),
  'rose': createImageIcon('/images/icons/boho-nature/garden.png'),
  'dashboard': createImageIcon('/images/icons/boho-nature/compass.png'),
  'palette': createImageIcon('/images/icons/boho-nature/mirror.png'),
  'sun': {
    light: createImageIcon('/images/icons/boho-nature/sun.png'),
    dark: '☀️',
  },
  'moon': {
    light: createImageIcon('/images/icons/boho-nature/moon.png'),
    dark: '🌙',
  },
  'cloud-rain': createImageIcon('/images/icons/boho-nature/rain-cloud.png'),
  'globe': createImageIcon('/images/icons/boho-nature/globe.png'),
  'handshake': createImageIcon('/images/icons/boho-nature/handshake.png'),
  'package': createImageIcon('/images/icons/boho-nature/package.png'),
  'cloud-sun': createImageIcon('/images/icons/boho-nature/partly-cloudy.png'),
  'heart': createImageIcon('/images/icons/boho-nature/heart.png'),
  'smile': createImageIcon('/images/icons/boho-nature/laughing.png'),
  'cat': createImageIcon('/images/icons/boho-nature/cats.png'),
  'key-round': {
    light: createImageIcon('/images/icons/boho-nature/key.png'),
    dark: '🔑'
  },
  'tree-palm': createImageIcon('/images/icons/boho-nature/tree.png'),
  'crown': createImageIcon('/images/icons/boho-nature/crown.png'),
};

export const SCIENCE_THEME: Record<string, ThemeIconDef> = {
  'alert-circle': createImageIcon('/images/icons/science/alert-circle.png'),
  'alert': createImageIcon('/images/icons/science/alert.png'),
  'apple': createImageIcon('/images/icons/science/apple.png'),
  'book-open-text': createImageIcon('/images/icons/science/book.png'),
  'camera': createImageIcon('/images/icons/science/camera1.png'),
  'delete': createImageIcon('/images/icons/science/trash.png'),
  'download': createImageIcon('/images/icons/science/download.png'),
  'edit': createImageIcon('/images/icons/science/edit.png'),
  'feed': createImageIcon('/images/icons/science/leaf1.png'),
  'land-plot': createImageIcon('/images/icons/science/garden4.png'),
  'help-circle': createImageIcon('/images/icons/science/help.png'),
  'leaf': createImageIcon('/images/icons/science/leaf1.png'),
  'map-pin': createImageIcon('/images/icons/science/map-pin.png'),
  'menu': createImageIcon('/images/icons/science/menu.png'),
  'print': createImageIcon('/images/icons/science/printer.png'),
  'settings': createImageIcon('/images/icons/science/settings.png'),
  'shield': createImageIcon('/images/icons/science/shield.png'),
  // 'sprout': createImageIcon('/images/icons/science/sprout.png'),
  'view': createImageIcon('/images/icons/science/view.png'),
  // 'sparkles': createImageIcon('/images/icons/science/wand.png'),
  'water': createImageIcon('/images/icons/science/watering-can.png'),
  'droplet': createImageIcon('/images/icons/science/droplet.png')
};

export const EMOJI_THEME: Record<string, ThemeIconDef> = {
  'water': '💧',
  'feed': '🌿',
  'edit': '✏️',
  'delete': '🗑️',
  'view': '👁️',
  'back': '🔙',
  'menu': '≡',
  'pin': '📌',
  'camera': '📷',
  'info': 'ℹ️',
  'scale': '⚖️',
  'ruler': '📏',
  'sprout': '🌱',
  'leaf': '🍃',
  'palette': '🎨',
  'alert': '⚠️',
  'alert-circle': '🚨',
  'sparkles': '✨',
  'map-pin': '📍',
  'sun': '☀️',
  'moon': '🌙',
  'cloud-sun': '⛅',
  'cloud': '☁️',
  'cloud-rain': '🌧️',
  'droplet': '💧',
  'utensils': '🍴',
  'hourglass': '⏳',
  'bug': '🐛',
  'skull': '💀',
  'wine': '🍷',
  'soup': '🍲',
  'lightbulb': '💡',
  'smile': '😊',
  'heart': '❤️',
  'coins': '🪙',
  'cat': '🐱',
  'dna': '🧬',
  'help-circle': '❓',
  'apple': '🍎',
  'print': '🖨️',
  'shelving-unit': '🗄️',
  'land-plot': '🏞️',
  'rose': '🌹',
  'book-open-text': '📖',
  'settings': '⚙️',
  'cloud-check': '✅',
  'shield': '🛡️',
  'crown': '👑',
  'handshake': '🤝',
  'key': '🔑',
  'key-round': '🗝️',
  'pencil': '📝',
  'package': '📦',
  'tree-palm': '🌴',
  'globe': '🌍',
  'download': '⬇️',
  'shuffle': '🔀',
  'dashboard': '📊'
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