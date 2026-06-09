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
  Focus
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

// Example of a secondary built-in theme! 
// Notice how it only overrides a few icons. The provider will automatically 
// fall back to DEFAULT_ICON_MAP for any icon not explicitly listed here!
export const ELEGANT_THEME: Record<string, React.ElementType> = {
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

export const MINIMALIST_THEME: Record<string, React.ElementType> = {
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
    <img src={src} width={size} height={size} className={`object-contain ${className}`} alt="" />
  );
};

export const BOHO_NATURE_THEME: Record<string, React.ElementType> = {
  'alert-circle': createImageIcon('/images/icons/boho-nature/alert-circle.png'),
  'alert': createImageIcon('/images/icons/boho-nature/alert.png'),
  'apple': createImageIcon('/images/icons/boho-nature/apple.png'),
  'book-open-text': createImageIcon('/images/icons/boho-nature/book.png'),
  'camera': createImageIcon('/images/icons/boho-nature/camera.png'),
  'delete': createImageIcon('/images/icons/boho-nature/delete.png'),
  'download': createImageIcon('/images/icons/boho-nature/download.png'),
  'edit': createImageIcon('/images/icons/boho-nature/edit.png'),
  'feed': createImageIcon('/images/icons/boho-nature/feed.png'),
  'land-plot': createImageIcon('/images/icons/boho-nature/garden.png'),
  'help-circle': createImageIcon('/images/icons/boho-nature/help-circle.png'),
  'leaf': createImageIcon('/images/icons/boho-nature/leaf.png'),
  'map-pin': createImageIcon('/images/icons/boho-nature/map-pin.png'),
  'menu': createImageIcon('/images/icons/boho-nature/menu.png'),
  'print': createImageIcon('/images/icons/boho-nature/printer.png'),
  'settings': createImageIcon('/images/icons/boho-nature/settings.png'),
  'shield': createImageIcon('/images/icons/boho-nature/shield.png'),
  'sprout': createImageIcon('/images/icons/boho-nature/sprout.png'),
  'view': createImageIcon('/images/icons/boho-nature/view.png'),
  'sparkles': createImageIcon('/images/icons/boho-nature/wand.png'),
  'water': createImageIcon('/images/icons/boho-nature/water.png'),
  'droplet': createImageIcon('/images/icons/boho-nature/watering-can.png')
};

export const SCIENCE_THEME: Record<string, React.ElementType> = {
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
  // 'view': createImageIcon('/images/icons/science/view.png'),
  // 'sparkles': createImageIcon('/images/icons/science/wand.png'),
  'water': createImageIcon('/images/icons/science/watering-can.png'),
  'droplet': createImageIcon('/images/icons/science/droplet.png')
};

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