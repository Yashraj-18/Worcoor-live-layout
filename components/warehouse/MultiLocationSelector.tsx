// @ts-nocheck
'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import '@/styles/warehouse/MultiLocationSelector.css';
import showMessage from '@/lib/warehouse/utils/showMessage';
import globalIdCache from '@/lib/warehouse/utils/globalIdCache';

const MAX_LEVEL_COUNT = 999;
const MAX_LOCATION_INDEX = 9999;
const ALL_LEVEL_IDS = Array.from({ length: MAX_LEVEL_COUNT }, (_, index) => `L${index + 1}`);

const normalizeLevelId = (value) => (value ? value.toString().trim().toUpperCase() : '');
const normalizeLocationId = (value) => (value ? value.toString().trim().toUpperCase() : '');

const parseInitialMappings = (initialMappings, fallbackLevelIds = []) => {
  const mappings = [];

  const upsert = (levelId, locationId) => {
    const normalizedLevel = normalizeLevelId(levelId);
    if (!normalizedLevel) return;

    const normalizedLocation = normalizeLocationId(locationId);
    const existingIndex = mappings.findIndex((entry) => entry.levelId === normalizedLevel);
    const next = { levelId: normalizedLevel, locationId: normalizedLocation };

    if (existingIndex >= 0) {
      mappings[existingIndex] = next;
    } else {
      mappings.push(next);
    }
  };

  if (Array.isArray(initialMappings)) {
    initialMappings.forEach((entry) => {
      if (!entry) return;
      if (typeof entry === 'string') {
        upsert(entry, '');
      } else if (typeof entry === 'object') {
        upsert(entry.levelId ?? entry.level, entry.locationId ?? entry.locId ?? '');
      }
    });
  } else if (initialMappings && typeof initialMappings === 'object') {
    if (Array.isArray(initialMappings.levelLocationMappings)) {
      initialMappings.levelLocationMappings.forEach((entry) => {
        if (!entry) return;
        upsert(entry.levelId ?? entry.level, entry.locationId ?? entry.locId ?? '');
      });
    } else if (Array.isArray(initialMappings.levelIds) && Array.isArray(initialMappings.locationIds)) {
      initialMappings.levelIds.forEach((levelId, index) => {
        upsert(levelId, initialMappings.locationIds[index] ?? '');
      });
    } else if (Array.isArray(initialMappings.locationIds)) {
      initialMappings.locationIds.forEach((locationId, index) => {
        upsert(fallbackLevelIds[index], locationId ?? '');
      });
    }
  }

  if (mappings.length === 0 && Array.isArray(fallbackLevelIds)) {
    fallbackLevelIds.forEach((levelId) => {
      const normalizedLevel = normalizeLevelId(levelId);
      if (normalizedLevel) {
        upsert(normalizedLevel, '');
      }
    });
  }

  return mappings;
};

const MultiLocationSelector = ({
  isVisible,
  onClose,
  onSave,
  existingLocationIds = [],
  itemType = '',
  initialMappings = [],
  initialLevelIds = [],
  locationTags = [],
  isLoadingLocationTags = false
}) => {
  const [selectedLevelId, setSelectedLevelId] = useState('');
  const [locationSelectValue, setLocationSelectValue] = useState('');
  const [attachedMappings, setAttachedMappings] = useState([]);

  const isVerticalStorageRack = itemType === 'vertical_sku_holder';

  const parsedInitialMappings = useMemo(
    () => parseInitialMappings(initialMappings, initialLevelIds),
    [initialMappings, initialLevelIds]
  );

  const externalLocationSet = useMemo(() => {
    const initialSet = new Set();
    parsedInitialMappings.forEach((mapping) => {
      const normalized = normalizeLocationId(mapping.locationId);
      if (normalized) {
        initialSet.add(normalized);
      }
    });

    return existingLocationIds.reduce((set, id) => {
      const normalized = normalizeLocationId(id);
      if (normalized && !initialSet.has(normalized)) {
        set.add(normalized);
      }
      return set;
    }, new Set());
  }, [existingLocationIds, parsedInitialMappings]);

  const wasVisibleRef = useRef(false);

  useEffect(() => {
    if (isVisible && !wasVisibleRef.current) {
      setAttachedMappings(parsedInitialMappings);
    }

    if (!isVisible && wasVisibleRef.current) {
      setAttachedMappings([]);
      setSelectedLevelId('');
      setLocationSelectValue('');
    }

    wasVisibleRef.current = isVisible;
  }, [isVisible, parsedInitialMappings]);

  const usedLevelIds = useMemo(() => new Set(attachedMappings.map((mapping) => mapping.levelId)), [attachedMappings]);

  const availableLevelIds = useMemo(
    () => ALL_LEVEL_IDS.filter((levelId) => !usedLevelIds.has(levelId)),
    [usedLevelIds]
  );

  const attachedLocationCounts = useMemo(() => {
    const counts = new Map();
    attachedMappings.forEach((mapping) => {
      const normalized = normalizeLocationId(mapping.locationId);
      if (!normalized) return;
      counts.set(normalized, (counts.get(normalized) || 0) + 1);
    });
    return counts;
  }, [attachedMappings]);

  const blockedLocationIds = useMemo(() => {
    const set = new Set(externalLocationSet);
    attachedMappings.forEach((mapping) => {
      const normalized = normalizeLocationId(mapping.locationId);
      if (normalized) {
        set.add(normalized);
      }
    });
    return set;
  }, [externalLocationSet, attachedMappings]);

  const availableLocationOptions = useMemo(() => {
    if (isLoadingLocationTags) return [];

    const options = locationTags
      .filter((tag) => {
        const normalized = normalizeLocationId(tag.locationTagName);
        return !blockedLocationIds.has(normalized);
      })
      .map((tag) => tag.locationTagName);

    return options;
  }, [blockedLocationIds, locationTags, isLoadingLocationTags]);

  const suggestedLocationId = availableLocationOptions[0] || '';

  useEffect(() => {
    if (!isVisible) return;
    if (!selectedLevelId || usedLevelIds.has(selectedLevelId)) {
      setSelectedLevelId(availableLevelIds[0] || '');
    }
  }, [isVisible, selectedLevelId, usedLevelIds, availableLevelIds]);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    if (availableLevelIds.length > 0 && (!selectedLevelId || usedLevelIds.has(selectedLevelId))) {
      setSelectedLevelId(availableLevelIds[0]);
    }

    if (suggestedLocationId) {
      if (!locationSelectValue || externalLocationSet.has(normalizeLocationId(locationSelectValue))) {
        setLocationSelectValue(suggestedLocationId);
      }
    } else if (locationSelectValue) {
      setLocationSelectValue('');
    }
  }, [
    isVisible,
    availableLevelIds,
    selectedLevelId,
    usedLevelIds,
    locationSelectValue,
    externalLocationSet,
    suggestedLocationId
  ]);

  const handleLocationSelectChange = useCallback((event) => {
    setLocationSelectValue(event.target.value);
  }, []);

  const handleAttachMapping = useCallback(() => {
    const levelId = normalizeLevelId(selectedLevelId);
    const locationId = normalizeLocationId(locationSelectValue);

    if (!levelId) {
      showMessage.warning('Select a level before attaching a Location ID.');
      return;
    }

    if (!locationId) {
      showMessage.warning('Enter a Location ID to attach to the selected level.');
      return;
    }

    if (usedLevelIds.has(levelId)) {
      showMessage.warning(`${levelId} already has an attached Location ID.`);
      return;
    }

    // Check against both external set and global cache
    if (externalLocationSet.has(locationId) || attachedLocationCounts.get(locationId)) {
      showMessage.error(`Location ID ${locationId} is already in use elsewhere in the map. Choose another ID.`);
      return;
    }

    setAttachedMappings((prev) => [...prev, { levelId, locationId }]);
    setLocationSelectValue('');
  }, [
    selectedLevelId,
    locationSelectValue,
    usedLevelIds,
    externalLocationSet,
    attachedLocationCounts
  ]);

  const handleMappingLocationChange = useCallback((levelId, value) => {
    const nextValue = normalizeLocationId(value);
    setAttachedMappings((prev) =>
      prev.map((mapping) =>
        mapping.levelId === levelId ? { ...mapping, locationId: nextValue } : mapping
      )
    );
  }, []);

  const handleRemoveMapping = useCallback((levelId) => {
    setAttachedMappings((prev) => prev.filter((mapping) => mapping.levelId !== levelId));
  }, []);

  const handleSave = useCallback(() => {
    if (attachedMappings.length === 0) {
      showMessage.warning('Attach at least one level/location pair before saving.');
      return;
    }

    const normalizedMappings = [];
    const seenLocationIds = new Set();

    for (const mapping of attachedMappings) {
      const levelId = normalizeLevelId(mapping.levelId);
      const locationId = normalizeLocationId(mapping.locationId);

      if (!levelId) {
        showMessage.error('One of the mappings has an invalid level.');
        return;
      }

      if (!locationId) {
        showMessage.warning(`Provide a Location ID for ${levelId}.`);
        return;
      }

      // Check against both external set and global cache
      if (externalLocationSet.has(locationId)) {
        showMessage.error(`Location ID ${locationId} is already used elsewhere in the map.`);
        return;
      }

      if (seenLocationIds.has(locationId)) {
        showMessage.error(`Location ID ${locationId} is assigned to multiple levels.`);
        return;
      }

      seenLocationIds.add(locationId);
      normalizedMappings.push({ levelId, locationId });
    }

    normalizedMappings.sort((a, b) => {
      const aIndex = parseInt(a.levelId.replace(/[^0-9]/g, ''), 10) || 0;
      const bIndex = parseInt(b.levelId.replace(/[^0-9]/g, ''), 10) || 0;
      return aIndex - bIndex;
    });

    const levelIds = normalizedMappings.map((mapping) => mapping.levelId);
    const locationIds = normalizedMappings.map((mapping) => mapping.locationId);
    const primaryLocationId = locationIds[0] || '';

    // Add all location IDs to the global cache
    locationIds.forEach(id => {
      if (id) {
        globalIdCache.addId(id);
      }
    });

    onSave({
      isMultiple: true,
      levelLocationMappings: normalizedMappings,
      levelIds,
      locationIds,
      primaryLocationId,
      tags: levelIds,
      category: 'storage'
    });
  }, [attachedMappings, externalLocationSet, onSave]);

  const handleClose = useCallback(() => {
    setSelectedLevelId('');
    setLocationSelectValue('');
    setAttachedMappings([]);
    onClose();
  }, [onClose]);

  if (!isVisible) {
    return null;
  }

  const currentLocationWarning = (() => {
    const normalized = normalizeLocationId(locationSelectValue);
    if (!normalized) return '';
    if (externalLocationSet.has(normalized)) {
      return `Location ID ${normalized} is already used elsewhere.`;
    }
    if (attachedLocationCounts.get(normalized)) {
      return `Location ID ${normalized} is already attached to another level.`;
    }
    return '';
  })();

  return (
    <div className="fixed inset-0 z-50 bg-black/80 animate-pure-fade flex items-center justify-center p-4" onClick={handleClose}>
      <div className="bg-background border border-border rounded-lg shadow-lg w-full max-w-2xl animate-pure-fade max-h-[90vh] overflow-hidden flex flex-col" onClick={(event) => event.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h3 className="text-lg font-semibold leading-none tracking-tight">
              {isVerticalStorageRack ? 'Assign Levels to Location IDs' : 'Location ID Selection'}
            </h3>
            {isVerticalStorageRack && (
              <span className="text-sm text-orange-500 dark:text-orange-400 font-medium mt-1 inline-block">Vertical Storage Rack</span>
            )}
          </div>
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
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {isVerticalStorageRack && (
            <div className="rounded-md bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 p-4">
              <div className="font-semibold text-orange-900 dark:text-orange-100 mb-1 flex items-center gap-2">
                <span>📐</span>
                <span>Vertical Storage Rack - Level & Location Mapping</span>
              </div>
              <p className="text-sm text-orange-800 dark:text-orange-200">
                Select a level (L1, L2, L3...) and assign a unique Location ID to it.
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-3 block">
                Attach Level to Location ID
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={selectedLevelId}
                  onChange={(event) => setSelectedLevelId(event.target.value)}
                  className="flex h-10 w-full sm:w-40 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 hover:border-input/80"
                  disabled={availableLevelIds.length === 0}
                >
                  {availableLevelIds.length === 0 ? (
                    <option value="">All levels attached</option>
                  ) : (
                    availableLevelIds.slice(0, 50).map((levelId) => (
                      <option key={levelId} value={levelId}>
                        {levelId}
                      </option>
                    ))
                  )}
                </select>

                <select
                  value={locationSelectValue}
                  onChange={handleLocationSelectChange}
                  className="flex h-10 w-full sm:flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 hover:border-input/80"
                  disabled={availableLocationOptions.length === 0}
                >
                  {isLoadingLocationTags ? (
                    <option value="">Loading location tags...</option>
                  ) : availableLocationOptions.length === 0 ? (
                    <option value="">No available location tags</option>
                  ) : (
                    locationTags
                      .filter(tag => availableLocationOptions.includes(tag.locationTagName))
                      .map((tag) => (
                        <option key={tag.id} value={tag.locationTagName}>
                          {tag.locationTagName}
                        </option>
                      ))
                  )}
                </select>

                <button
                  type="button"
                  onClick={handleAttachMapping}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 ease-out focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 active:scale-95 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md h-10 px-4 py-2"
                  disabled={!selectedLevelId || !locationSelectValue}
                >
                  Attach Pair
                </button>
              </div>
              {currentLocationWarning && (
                <p className="text-xs text-destructive mt-2">{currentLocationWarning}</p>
              )}
              {!currentLocationWarning && locationSelectValue && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                  Selected ID ready to attach: {locationSelectValue}
                </p>
              )}
              {isLoadingLocationTags && (
                <p className="text-xs text-muted-foreground mt-2">
                  Loading location tags from backend...
                </p>
              )}
              {!isLoadingLocationTags && locationTags.length === 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  No location tags found for this organizational unit.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground block">
              Attached Level / Location Pairs
            </label>
            {attachedMappings.length === 0 ? (
              <div className="rounded-md bg-muted/50 p-4 border border-border">
                <p className="text-sm text-muted-foreground">
                  No mappings added yet. Select a level, enter a Location ID, and click "Attach Pair".
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {attachedMappings.map((mapping, index) => {
                  const normalizedLocation = normalizeLocationId(mapping.locationId);
                  const isDuplicate = normalizedLocation && (attachedLocationCounts.get(normalizedLocation) || 0) > 1;
                  const conflictsExternally = normalizedLocation && externalLocationSet.has(normalizedLocation);

                  return (
                    <div
                      key={mapping.levelId}
                      className="rounded-md border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20 p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 text-sm">
                          <span className="font-semibold text-foreground">{index + 1}.</span>
                          <span className="font-semibold text-green-700 dark:text-green-300">L{mapping.levelId.replace(/[^0-9]/g, '') || mapping.levelId}</span>
                          <span className="text-muted-foreground">→</span>
                          <span className="font-semibold text-blue-700 dark:text-blue-300">{mapping.locationId || 'Not set'}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveMapping(mapping.levelId)}
                          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 ease-out focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 active:scale-95 bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm hover:shadow-md h-8 px-3 py-1"
                        >
                          Remove
                        </button>
                      </div>
                      {(isDuplicate || conflictsExternally || !normalizedLocation) && (
                        <p className="text-xs text-destructive mt-2">
                          {!normalizedLocation && 'Provide a Location ID for this level.'}
                          {normalizedLocation && conflictsExternally && `Location ID ${normalizedLocation} is already used elsewhere.`}
                          {normalizedLocation && !conflictsExternally && isDuplicate && `Location ID ${normalizedLocation} is assigned to multiple levels.`}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
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
            disabled={attachedMappings.length === 0}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 ease-out focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 active:scale-95 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md h-10 px-4 py-2 mt-2 sm:mt-0"
          >
            Save Level Mappings
          </button>
        </div>
      </div>
    </div>
  );
};

export default MultiLocationSelector;

