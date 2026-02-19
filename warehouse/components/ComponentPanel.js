// import React, { useState } from 'react';
// import { useDrag } from 'react-dnd';
// import { DRAG_TYPES, WAREHOUSE_COMPONENTS } from '../../lib/warehouse/constants/warehouseComponents';

// const DraggableComponent = ({ component }) => {
//   const [{ isDragging }, drag] = useDrag({
//     type: DRAG_TYPES.COMPONENT,
//     item: {
//       ...component,
//       // Ensure all required properties are included
//       type: component.type,
//       name: component.name,
//       icon: component.icon,
//       color: component.color,
//       defaultSize: component.defaultSize || { width: 50, height: 50 },
//       description: component.description,
//       drawingTool: component.drawingTool || false,
//       priority: component.priority || 'medium'
//     },
//     collect: (monitor) => ({
//       isDragging: monitor.isDragging(),
//     }),
//     canDrag: () => true,
//     end: (item, monitor) => {
//       // Reset any visual states after drag ends
//       if (!monitor.didDrop()) {
//         // Handle failed drop if needed
//         console.log('Drop failed for:', item.name);
//       } else {
//         console.log('Successfully dropped:', item.name, item.type);
//       }
//     }
//   });

//   return (
//     <div
//       ref={drag}
//       className={`component-item ${isDragging ? 'dragging' : ''} ${component.drawingTool ? 'drawing-tool' : ''}`}
//       data-priority={component.priority || 'medium'}
//       data-type={component.type}
//       style={{
//         backgroundColor: component.color,
//         opacity: isDragging ? 0.7 : 1
//       }}
//       title={`${component.description}${component.priority ? ` (${component.priority} priority)` : ''}\nDrag to canvas to add`}
//     >
//       {/* Icon Display - Handle both emoji and image icons */}
//       <div className="component-icon" style={{
//         position: 'absolute',
//         top: '4px',
//         left: '50%',
//         transform: 'translateX(-50%)',
//         fontSize: '16px',
//         display: 'flex',
//         alignItems: 'center',
//         justifyContent: 'center',
//         width: '20px',
//         height: '20px'
//       }}>
//         {component.icon && component.icon.startsWith('/') ? (
//           <img
//             src={component.icon}
//             alt={component.name}
//             style={{
//               width: '100%',
//               height: '100%',
//               objectFit: 'contain',
//               borderRadius: '2px'
//             }}
//             onError={(e) => {
//               console.error('Failed to load component icon:', component.icon);
//               // Fallback to emoji
//               e.target.style.display = 'none';
//               const fallback = document.createElement('span');
//               if (component.icon === '/assets/images/icons/fire-exit.jpg') {
//                 fallback.textContent = '🚪';
//               } else if (component.icon === '/assets/images/icons/office-space.png') {
//                 fallback.textContent = '🏢';
//               } else {
//                 fallback.textContent = '📦';
//               }
//               fallback.style.fontSize = '16px';
//               e.target.parentNode.appendChild(fallback);
//             }}
//             onLoad={() => {
//               // Successfully loaded
//             }}
//           />
//         ) : (
//           <span>{component.icon || '📦'}</span>
//         )}
//       </div>
      
//       <div className="component-name" style={{
//         color: 'white',
//         fontWeight: '600',
//         fontSize: '11px',
//         textAlign: 'center',
//         lineHeight: '1.3',
//         textShadow: '0 1px 2px rgba(0,0,0,0.5)',
//         padding: '6px 4px',
//         wordWrap: 'break-word',
//         overflow: 'hidden',
//         display: '-webkit-box',
//         WebkitLineClamp: '2',
//         WebkitBoxOrient: 'vertical',
//         alignItems: 'center',
//         justifyContent: 'center',
//         height: 'calc(100% - 20px)',
//         maxHeight: '100%',
//         paddingTop: '20px' // Make room for icon
//       }}>{component.name}</div>
//                 </div>
//   );
// };

// const ComponentCategory = ({ category, isExpanded, onToggle }) => {
//   // Sort components by priority (high -> medium -> low)
//   const sortedItems = [...(category.components || [])].sort((a, b) => {
//     const priorityOrder = { high: 0, medium: 1, low: 2 };
//     return (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1);
//   });

//   return (
//     <div className="component-category" data-category={category.category}>
//       <div 
//         className="category-header" 
//         onClick={onToggle}
//         style={{ cursor: 'pointer' }}
//       >
//         <span className="category-toggle">
//           {isExpanded ? '▼' : '▶'}
//         </span>
//         <span className="category-title">{category.category}</span>
//         <span className="category-count">({(category.components || []).length})</span>
//               </div>
//       {isExpanded && (
//         <div className="category-items animate-fade-in">
//           {sortedItems.map((component, index) => (
//             <DraggableComponent key={index} component={component} />
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// const ComponentPanel = () => {
//   const [expandedCategories, setExpandedCategories] = useState({
//     'Storage & Inventory': false,
//     'Operations': false,
//     'Facilities': false,
//     'Multi-Level Facilities': false,
//     'Advanced Shapes': false,
//     'Structure & Layout': false,
//     'Traffic & Flow': false,
//     'Utilities & Safety': false,
//     'Shapes': false,
//     'Layout Boundaries': true,
//     'Zone Types': true,
//     'Unit Types': true
//   });
  
//   const [searchTerm, setSearchTerm] = useState('');
//   const [filteredComponents, setFilteredComponents] = useState(WAREHOUSE_COMPONENTS);

//   const toggleCategory = (categoryName) => {
//     setExpandedCategories(prev => ({
//       ...prev,
//       [categoryName]: !prev[categoryName]
//     }));
//   };

//   const expandAll = () => {
//     const allExpanded = {};
//     WAREHOUSE_COMPONENTS.forEach(cat => {
//       allExpanded[cat.category] = true;
//     });
//     setExpandedCategories(allExpanded);
//   };

//   const collapseAll = () => {
//     const allCollapsed = {};
//     WAREHOUSE_COMPONENTS.forEach(cat => {
//       allCollapsed[cat.category] = false;
//     });
//     setExpandedCategories(allCollapsed);
//   };
  
//   // Filter components based on search term
//   const handleSearch = (term) => {
//     setSearchTerm(term);
//     if (!term.trim()) {
//       setFilteredComponents(WAREHOUSE_COMPONENTS);
//       return;
//     }
    
//     const filtered = WAREHOUSE_COMPONENTS.map(category => ({
//       ...category,
//       components: category.components ? category.components.filter(item => 
//         item.name.toLowerCase().includes(term.toLowerCase()) ||
//         item.description.toLowerCase().includes(term.toLowerCase()) ||
//         item.type.toLowerCase().includes(term.toLowerCase())
//       ) : []
//     })).filter(category => category.components && category.components.length > 0);
    
//     setFilteredComponents(filtered);
    
//     // Auto-expand categories with search results
//     if (term.trim()) {
//       const expandedForSearch = {};
//       filtered.forEach(cat => {
//         expandedForSearch[cat.category] = true;
//       });
//       setExpandedCategories(expandedForSearch);
//     }
//   };

//   return (
//     <div className="component-panel animate-slide-right">
//       <div className="panel-header">
//         <h3>🏭 Components</h3>
//         <div className="search-container">
//           <input
//             type="text"
//             placeholder="🔍 Search components..."
//             value={searchTerm}
//             onChange={(e) => handleSearch(e.target.value)}
//             className="component-search"
//           />
//         </div>
//       </div>
      
//       <div className="categories-container">
//         {filteredComponents.length === 0 && searchTerm ? (
//           <div className="no-results">
//             <div className="no-results-icon">🔍</div>
//             <div className="no-results-text">No components found</div>
//             <div className="no-results-hint">Try a different search term</div>
//           </div>
//         ) : filteredComponents.length === 0 ? (
//           <div className="no-results">
//             <div className="no-results-icon">📦</div>
//             <div className="no-results-text">No components available</div>
//             <div className="no-results-hint">Components will be added step by step</div>
//           </div>
//         ) : (
//           filteredComponents.map((category, index) => (
//             <ComponentCategory
//               key={index}
//               category={category}
//               isExpanded={expandedCategories[category.category]}
//               onToggle={() => toggleCategory(category.category)}
//             />
//           ))
//         )}
//       </div>
//     </div>
//   );
// };

// export default ComponentPanel;
