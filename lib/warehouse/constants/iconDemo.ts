// @ts-nocheck
/**
 * Demo of Lucide Icon Integration in Component Panel
 * Shows how the icon mapping system works with warehouse components
 */

import { getLucideIcon, getCategoryIcon, getIconSize, getIconColor } from './lucideIconMapping';

// Example component types and their corresponding Lucide icons
const EXAMPLE_COMPONENTS = [
  { type: 'SKU_HOLDER', name: 'Horizontal Storage Rack', priority: 'high' },
  { type: 'VERTICAL_SKU_HOLDER', name: 'Vertical Storage Rack', priority: 'high' },
  { type: 'DISPATCH_GATES', name: 'Dispatch Gates', priority: 'high' },
  { type: 'INBOUND_GATES', name: 'Inbound Gates', priority: 'high' },
  { type: 'STORAGE_UNIT', name: 'Storage Unit', priority: 'high' },
  { type: 'COLD_STORAGE', name: 'Cold Storage', priority: 'high' },
  { type: 'FIRE_EXIT_MARKING', name: 'Fire Exit Marking', priority: 'high' },
  { type: 'SECURITY_AREA', name: 'Security Area', priority: 'high' },
  { type: 'CONFERENCE_ROOM', name: 'Conference Room', priority: 'medium' },
  { type: 'PANTRY_AREA', name: 'Pantry Area', priority: 'medium' }
];

// Example categories and their corresponding Lucide icons
const EXAMPLE_CATEGORIES = [
  'Primary Components',
  'Boundaries', 
  'Storage Components',
  'Common Areas',
  'Office Spaces'
];

/**
 * Generate icon mapping demo data
 */
export const generateIconDemo = () => {
  console.log('🎨 Lucide Icon Integration Demo');
  console.log('=====================================\n');
  
  // Demo component icons
  console.log('📦 Component Icons:');
  EXAMPLE_COMPONENTS.forEach(component => {
    const Icon = getLucideIcon(component.type);
    const size = getIconSize(component.priority);
    const color = getIconColor(component.priority);
    
    console.log(`  ${component.name}:`);
    console.log(`    - Icon: ${Icon.name || 'Lucide Icon'}`);
    console.log(`    - Size: ${size}px`);
    console.log(`    - Color: ${color}`);
    console.log(`    - Priority: ${component.priority}\n`);
  });
  
  // Demo category icons
  console.log('📁 Category Icons:');
  EXAMPLE_CATEGORIES.forEach(category => {
    const Icon = getCategoryIcon(category);
    
    console.log(`  ${category}:`);
    console.log(`    - Icon: ${Icon.name || 'Lucide Icon'}`);
    console.log(`    - Size: 18px (fixed)`);
    console.log(`    - Color: #374151 (fixed)\n`);
  });
  
  console.log('✨ Features:');
  console.log('  - Professional Lucide React icons');
  console.log('  - Contextually appropriate icon selection');
  console.log('  - Dynamic sizing based on priority');
  console.log('  - Consistent color scheme');
  console.log('  - Fallback to Box icon for unmapped components');
  console.log('  - Category-specific icons for better organization');
  
  return {
    componentIcons: EXAMPLE_COMPONENTS.map(comp => ({
      ...comp,
      icon: getLucideIcon(comp.type),
      size: getIconSize(comp.priority),
      color: getIconColor(comp.priority)
    })),
    categoryIcons: EXAMPLE_CATEGORIES.map(cat => ({
      category: cat,
      icon: getCategoryIcon(cat),
      size: 18,
      color: '#374151'
    }))
  };
};

export default generateIconDemo;
