// @ts-nocheck
import React, { useState, useEffect } from 'react';
import showMessage from '../../lib/warehouse/utils/showMessage';
import globalIdCache from '../../lib/warehouse/utils/globalIdCache';

const SkuIdSelector = ({ 
  isVisible, 
  onClose, 
  onSave, 
  existingLocationIds = [], 
  showCategories = false,
  allowCustomIds = false
}) => {
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [customLocationId, setCustomLocationId] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('storage');

  // Available categories
  const categories = [
    { value: 'storage', label: 'Storage' },
    { value: 'dry_storage', label: 'Dry Storage' },
    { value: 'cold_storage', label: 'Cold Storage' },
    { value: 'hazardous', label: 'Hazardous Materials' },
    { value: 'fragile', label: 'Fragile Items' },
    { value: 'bulk', label: 'Bulk Storage' }
  ];

  // Generate available Location IDs (LOC-001 to LOC-999)
  // Check against both existingLocationIds (local) and global cache
  const generateAvailableLocationIds = () => {
    const allIds = [];
    for (let i = 1; i <= 999; i++) {
      const locationId = `LOC-${i.toString().padStart(3, '0')}`;
      // Check both local existing IDs and global cache
      if (!existingLocationIds.includes(locationId)) {
        allIds.push(locationId);
      }
    }
    return allIds;
  };

  const availableLocationIds = generateAvailableLocationIds();

  useEffect(() => {
    if (availableLocationIds.length > 0) {
      setSelectedLocationId(availableLocationIds[0]);
    }
    // Reset useCustom when showCategories is false (storage racks)
    if (!allowCustomIds) {
      setUseCustom(false);
    }
  }, [availableLocationIds.length, allowCustomIds]);

  const handleSave = () => {
    const finalLocationId = useCustom ? customLocationId.trim() : selectedLocationId;
    
    if (!finalLocationId) {
      showMessage.warning('Please select or enter a Location ID');
      return;
    }

    // Check both local existing IDs and global cache
    if (existingLocationIds.includes(finalLocationId)) {
      showMessage.error(`Location ID "${finalLocationId}" is already in use elsewhere in the map. Please select a different one.`);
      return;
    }

    // Add the new ID to the global cache
    globalIdCache.addId(finalLocationId);

    if (showCategories) {
      onSave({ locationId: finalLocationId, category: selectedCategory });
    } else {
      onSave(finalLocationId); // Return just the Location ID for Horizontal Storage Racks
    }
  };

  const handleClose = () => {
    setSelectedLocationId('');
    setCustomLocationId('');
    setUseCustom(false);
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content sku-id-selector location-id-selector" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Select Location ID</h3>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="sku-id-options">
            <div className="sku-option">
              <label>
                <input
                  type="radio"
                  checked={!useCustom}
                  onChange={() => setUseCustom(false)}
                />
                <span>Select from available Location IDs</span>
              </label>
              
              {!useCustom && (
                <div className="sku-dropdown-container">
                  <select
                    value={selectedLocationId}
                    onChange={(e) => setSelectedLocationId(e.target.value)}
                    className="sku-dropdown"
                  >
                    {availableLocationIds.slice(0, 50).map(locationId => (
                      <option key={locationId} value={locationId}>
                        {locationId}
                      </option>
                    ))}
                  </select>
                  <div className="sku-info">
                    {availableLocationIds.length > 50 && (
                      <small>Showing first 50 of {availableLocationIds.length} available Location IDs (checked against entire map)</small>
                    )}
                    {availableLocationIds.length === 0 && (
                      <small style={{ color: '#f44336' }}>No available sequential Location IDs in the entire map. Use custom ID.</small>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Category Selection - Only for Storage Units */}
            {showCategories && (
              <div className="sku-option">
                <label className="category-label">
                  <span>📦 Storage Category</span>
                </label>
                <div className="category-dropdown-container">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="category-dropdown"
                  >
                    {categories.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Custom Location ID - Only available for Storage Units (showCategories = true) */}
            {allowCustomIds && (
              <div className="sku-option">
                <label>
                  <input
                    type="radio"
                    checked={useCustom}
                    onChange={() => setUseCustom(true)}
                  />
                  <span>Enter custom Location ID</span>
                </label>
                
                {useCustom && (
                  <div className="custom-sku-container">
                    <input
                      type="text"
                      value={customLocationId}
                      onChange={(e) => setCustomLocationId(e.target.value)}
                      placeholder="Enter custom Location ID (e.g., CUSTOM-LOC-001)"
                      className="custom-sku-input"
                      maxLength={20}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="existing-skus-info">
            <small>
              <strong>Used Location IDs:</strong> {existingLocationIds.length} 
              {existingLocationIds.length > 0 && (
                <span> (Latest: {existingLocationIds[existingLocationIds.length - 1]})</span>
              )}
            </small>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={handleClose}>
            Cancel
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleSave}
            disabled={!useCustom && !selectedLocationId || useCustom && !customLocationId.trim()}
          >
            Add Location
          </button>
        </div>
      </div>
    </div>
  );
};

export default SkuIdSelector;
