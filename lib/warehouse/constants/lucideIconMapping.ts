/**
 * Lucide React Icon Mapping for Warehouse Components
 * Maps component types to appropriate Lucide icons for professional appearance
 */

import {
  // Storage & Inventory Icons
  Package,
  Archive,
  Warehouse,
  Inbox,
  Boxes,
  PackageOpen,
  PackagePlus,
  PackageMinus,
  PackageCheck,
  PackageX,
  PackageSearch,
  Snowflake,
  Star,
  
  // Gate & Entry Icons
  DoorOpen,
  DoorClosed,
  ArrowRightFromLine,
  ArrowLeftFromLine,
  LogIn,
  LogOut,
  
  // Office & Facility Icons
  Building,
  Building2,
  Home,
  Store,
  Factory,
  Briefcase,
  Users,
  User,
  UserCheck,
  UserPlus,
  UserMinus,
  
  // Safety & Security Icons
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  AlertTriangle,
  TriangleAlert,
  FireExtinguisher,
  
  // Pathway & Navigation Icons
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Navigation,
  Route,
  MapPin,
  Compass,
  
  // Boundary & Area Icons
  Square,
  SquareDashed,
  RectangleHorizontal,
  RectangleVertical,
  Circle,
  CircleDashed,
  Hexagon,
  
  
  // Meeting & Collaboration Icons
  Handshake,
  UsersRound,
  MessageSquare,
  MessageCircle,
  Phone,
  Video,
  VideoOff,
  Mic,
  MicOff,
  
  // Food & Refreshment Icons
  Coffee,
  Utensils,
  Pizza,
  Apple,
  Beef,
  Fish,
  Milk,
  Wine,
  
  // Stage & Presentation Icons
  Presentation,
  Monitor,
  MonitorSpeaker,
  Tv,
  Tv2,
  Projector,
  Megaphone,
  Volume2,
  
  // Seating & Rest Icons
  Armchair,
  Sofa,
  Bed,
  BedDouble,
  
  // General Purpose Icons
  MoreHorizontal,
  MoreVertical,
  Plus,
  Minus,
  X,
  Check,
  Settings,
  Settings2,
  Wrench,
  Hammer,
  Drill,
  
  // Default fallback icon
  Box
} from 'lucide-react';

export interface IconMapping {
  [key: string]: React.ComponentType<any>;
}

/**
 * Component Type to Lucide Icon Mapping
 * Provides professional, contextually appropriate icons for each warehouse component
 */
export const LUCIDE_ICON_MAPPING: IconMapping = {
  // Primary Components
  'SKU_HOLDER': Package,
  'VERTICAL_SKU_HOLDER': Archive,
  'DISPATCH_GATES': LogOut,
  'INBOUND_GATES': LogIn,
  'OFFICE_SPACE_AREA': Building,
  
  // Boundaries
  'SOLID_BOUNDARY': Square,
  'DOTTED_BOUNDARY': SquareDashed,
  'SQUARE_BOUNDARY': Square,
  
  // Storage Components
  'STORAGE_UNIT': Package,
  'OPEN_STORAGE_SPACE': PackageOpen,
  'DISPATCH_STAGING_AREA': PackagePlus,
  'GRADING_AREA': PackageCheck,
  'PROCESSING_AREA': PackageMinus,
  'PRODUCTION_AREA': Factory,
  'PACKAGING_AREA': PackageSearch,
  'COLD_STORAGE': Snowflake,
  
  // Common Areas
  'FIRE_EXIT_MARKING': TriangleAlert,
  'SECURITY_AREA': ShieldCheck,
  'RESTROOMS_AREA': UsersRound,
  'PATHWAYS_ARROWS': ArrowRight,
  
  // Office Spaces
  'CONFERENCE_ROOM': Handshake,
  'MEETING_ROOMS': Users,
  'PANTRY_AREA': Coffee,
  'OPEN_STAGE': Presentation,
  'SEATING_AREA': Armchair,
  'BOOTHS': UserCheck,
  'GENERAL_AREA': Building2,
  
  // Additional warehouse-specific components
  'WAREHOUSE_BLOCK': Warehouse,
  'STORAGE_ZONE': Archive,
  'CONTAINER_UNIT': Package,
  'ZONE_DIVIDER': RectangleVertical,
  'AREA_BOUNDARY': RectangleHorizontal,
  
  // Fallback for any unmapped components
  'DEFAULT': Box
};

/**
 * Get the appropriate Lucide icon for a component type
 * @param componentType - The type of warehouse component
 * @returns Lucide React icon component
 */
export const getLucideIcon = (componentType: string): React.ComponentType<any> => {
  return LUCIDE_ICON_MAPPING[componentType] || LUCIDE_ICON_MAPPING['DEFAULT'];
};

/**
 * Category to Lucide Icon Mapping
 * Provides appropriate icons for component categories
 */
export const CATEGORY_ICON_MAPPING: IconMapping = {
  'Primary Components': Star,
  'Boundaries': Square,
  'Storage Components': Archive,
  'Common Areas': UsersRound,
  'Office Spaces': Building2,
  'DEFAULT': Box
};

/**
 * Get the appropriate Lucide icon for a category
 * @param category - The category name
 * @returns Lucide React icon component
 */
export const getCategoryIcon = (category: string): React.ComponentType<any> => {
  return CATEGORY_ICON_MAPPING[category] || CATEGORY_ICON_MAPPING['DEFAULT'];
};

/**
 * Get icon size based on component category and priority
 * @param priority - Component priority level
 * @param category - Component category
 * @returns Icon size in pixels
 */
export const getIconSize = (priority?: string, category?: string): number => {
  // Base size mapping
  const baseSizes = {
    high: 20,
    medium: 18,
    low: 16
  };
  
  // Category-specific adjustments
  const categoryAdjustments = {
    'Primary Components': 2,
    'Boundaries': 0,
    'Storage Components': 1,
    'Common Areas': 0,
    'Office Spaces': 1
  };
  
  const baseSize = baseSizes[priority as keyof typeof baseSizes] || baseSizes.medium;
  const adjustment = categoryAdjustments[category as keyof typeof categoryAdjustments] || 0;
  
  return baseSize + adjustment;
};

/**
 * Get icon color based on component theme and priority
 * @param priority - Component priority level
 * @returns CSS color value
 */
export const getIconColor = (priority?: string): string => {
  const colorMap = {
    high: '#ffffff',    // White for high priority
    medium: '#f3f4f6', // Light gray for medium priority
    low: '#e5e7eb'     // Lighter gray for low priority
  };
  
  return colorMap[priority as keyof typeof colorMap] || colorMap.medium;
};

/**
 * Icon render props for consistent styling
 */
export const ICON_RENDER_PROPS = {
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none'
};

export default {
  LUCIDE_ICON_MAPPING,
  CATEGORY_ICON_MAPPING,
  getLucideIcon,
  getCategoryIcon,
  getIconSize,
  getIconColor,
  ICON_RENDER_PROPS
};
