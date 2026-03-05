// // @ts-nocheck
// import React, { useState, useEffect } from 'react';
// import showMessage from '../../lib/warehouse/utils/showMessage';
// import globalIdCache from '../../lib/warehouse/utils/globalIdCache';

// const SkuIdSelector = ({ 
//   isVisible, 
//   onClose, 
//   onSave, 
//   existingLocationIds = []
// }) => {
//   const [selectedLocationId, setSelectedLocationId] = useState('');

//   const handleSave = () => {
//     if (!selectedLocationId) {
//       showMessage.warning('Please select a Location ID');
//       return;
//     }

//     // Check both local existing IDs and global cache
//     if (existingLocationIds.includes(selectedLocationId)) {
//       showMessage.error(`Location ID "${selectedLocationId}" is already in use elsewhere in the map. Please select a different one.`);
//       return;
//     }

//     // Add the new ID to the global cache
//     globalIdCache.addId(selectedLocationId);

//     onSave(selectedLocationId);
//   };

//   const handleClose = () => {
//     setSelectedLocationId('');
//     onClose();
//   };

//   if (!isVisible) return null;

//   return (
//     <div className="modal-overlay" onClick={handleClose}>
//       <div className="modal-content sku-id-selector location-id-selector" onClick={(e) => e.stopPropagation()}>
//         <div className="modal-header">
//           <h3>Select Location ID</h3>
//           <button className="modal-close" onClick={handleClose}>×</button>
//         </div>
        
//         <div className="modal-body">
//           <div className="sku-id-options">
//             {/* Location ID selection will be implemented here */}
//             <p>Please select a Location ID from the available options.</p>
//           </div>
//         </div>

//         <div className="modal-footer">
//           <button className="btn btn-secondary" onClick={handleClose}>
//             Cancel
//           </button>
//           <button 
//             className="btn btn-primary" 
//             onClick={handleSave}
//             disabled={!selectedLocationId}
//           >
//             Add Location
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SkuIdSelector;
