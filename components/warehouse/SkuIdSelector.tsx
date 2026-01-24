'use client';

import React, { useState, useEffect } from 'react';
import showMessage from '@/lib/warehouse/utils/showMessage';
import globalIdCache from '@/lib/warehouse/utils/globalIdCache';

interface SkuIdSelectorProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (skuId: string | { locationId: string; category: string }) => void;
  existingLocationIds?: string[];
  showCategories?: boolean;
  allowCustomIds?: boolean;
}

const SkuIdSelector: React.FC<SkuIdSelectorProps> = ({ 
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

  // Generate available Location IDs (LOC-001 to LOC-999)
  // Check against both existingLocationIds (local) and global cache
  const generateAvailableLocationIds = () => {
    const allIds = [];
    for (let i = 1; i <= 999; i++) {
      const locationId = `LOC-${i.toString().padStart(3, '0')}`;
      // Check both local existing IDs and global cache
      if (!existingLocationIds.includes(locationId) && !globalIdCache.isIdInUse(locationId)) {
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
    if (existingLocationIds.includes(finalLocationId) || globalIdCache.isIdInUse(finalLocationId)) {
      showMessage.error(`Location ID "${finalLocationId}" is already in use elsewhere in the map. Please select a different one.`);
      return;
    }

    // Add the new ID to the global cache
    globalIdCache.addId(finalLocationId);

    // Always return just the Location ID
    onSave(finalLocationId);
  };

  const handleClose = () => {
    setSelectedLocationId('');
    setCustomLocationId('');
    setUseCustom(false);
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 animate-pure-fade flex items-center justify-center p-4" onClick={handleClose}>
      <div className="bg-background border border-border rounded-lg shadow-lg w-full max-w-lg animate-pure-fade" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-lg font-semibold leading-none tracking-tight text-foreground">Select Location ID</h3>
          <button 
            onClick={handleClose}
            className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="sr-only">Close</span>
          </button>
        </div>
        
        {/* Body */}
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            {/* Sequential Location ID Option */}
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer group">
                <input
                  type="radio"
                  checked={!useCustom}
                  onChange={() => setUseCustom(false)}
                  className="h-4 w-4 border-input text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                />
                <span className="text-sm font-medium text-foreground group-hover:text-foreground/80 transition-colors">Select from available Location IDs</span>
              </label>
              
              {!useCustom && (
                <div className="ml-7 space-y-2">
                  <select
                    value={selectedLocationId}
                    onChange={(e) => setSelectedLocationId(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 hover:border-input/80"
                  >
                    {availableLocationIds.slice(0, 50).map(locationId => (
                      <option key={locationId} value={locationId}>
                        {locationId}
                      </option>
                    ))}
                  </select>
                  {availableLocationIds.length > 50 && (
                    <p className="text-xs text-muted-foreground">Showing first 50 of {availableLocationIds.length} available Location IDs (checked against entire map)</p>
                  )}
                  {availableLocationIds.length === 0 && (
                    <p className="text-xs text-destructive">No available sequential Location IDs in the entire map. Use custom ID.</p>
                  )}
                </div>
              )}
            </div>

            {/* Custom Location ID - Only available for Storage Units */}
            {allowCustomIds && (
              <div className="space-y-3 pt-2">
                <label className="flex items-center space-x-3 cursor-pointer group">
                  <input
                    type="radio"
                    checked={useCustom}
                    onChange={() => setUseCustom(true)}
                    className="h-4 w-4 border-input text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-foreground group-hover:text-foreground/80 transition-colors">Enter custom Location ID</span>
                </label>
                
                {useCustom && (
                  <div className="ml-7">
                    <input
                      type="text"
                      value={customLocationId}
                      onChange={(e) => setCustomLocationId(e.target.value)}
                      placeholder="Enter custom Location ID (e.g., CUSTOM-LOC-001)"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 hover:border-input/80"
                      maxLength={20}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="rounded-md bg-muted/50 p-3 border border-border">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Used Location IDs:</span> {existingLocationIds.length}
              {existingLocationIds.length > 0 && (
                <span> (Latest: <span className="font-medium text-foreground">{existingLocationIds[existingLocationIds.length - 1]}</span>)</span>
              )}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-6 border-t border-border">
          <button 
            onClick={handleClose}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 ease-out focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 active:scale-95 bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm hover:shadow-md h-10 px-4 py-2"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={!useCustom && !selectedLocationId || useCustom && !customLocationId.trim()}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 ease-out focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 active:scale-95 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md h-10 px-4 py-2 mt-2 sm:mt-0"
          >
            Add Location
          </button>
        </div>
      </div>
    </div>
  );
};

export default SkuIdSelector;

