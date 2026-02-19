// @ts-nocheck
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import '../styles/MultiLocationSelector.css';
import showMessage from '../../lib/warehouse/utils/showMessage';
import globalIdCache from '../../lib/warehouse/utils/globalIdCache';

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
  initialLevelIds = []
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
    const options = [];
    for (let index = 1; index <= MAX_LOCATION_INDEX; index += 1) {
      const candidate = `LOC-${index.toString().padStart(3, '0')}`;
      const normalized = normalizeLocationId(candidate);
      // Check both blockedLocationIds and global cache
      if (!blockedLocationIds.has(normalized)) {
        options.push(candidate);
      }
      if (options.length >= 150) {
        break;
      }
    }
    return options;
  }, [blockedLocationIds]);

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
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content multi-location-selector" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h3>
            {isVerticalStorageRack ? 'Assign Levels to Location IDs' : 'Location ID Selection'}
            {isVerticalStorageRack && (
              <span style={{ color: '#FF5722', fontSize: '0.9em' }}> (Vertical Storage Rack)</span>
            )}
          </h3>
          <button className="modal-close" onClick={handleClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {isVerticalStorageRack && (
            <div
              style={{
                backgroundColor: '#fff3e0',
                padding: '12px',
                borderRadius: '6px',
                marginBottom: '16px',
                border: '1px solid #ff9800'
              }}
            >
              <div style={{ fontWeight: 'bold', color: '#e65100', marginBottom: '4px' }}>
                📐 Vertical Storage Rack - Level & Location Mapping
              </div>
              <div style={{ fontSize: '0.9em', color: '#bf360c' }}>
                Select a level (L1, L2, L3...) and assign a unique Location ID to it.
              </div>
            </div>
          )}

          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '12px', color: '#333' }}>
              Attach Level to Location ID
            </div>
            <div
              style={{
                display: 'flex',
                gap: '12px',
                flexWrap: 'nowrap',
                alignItems: 'center'
              }}
            >
              <select
                value={selectedLevelId}
                onChange={(event) => setSelectedLevelId(event.target.value)}
                style={{
                  flex: '0 0 140px',
                  padding: '8px 12px',
                  border: '1px solid #8bc34a',
                  borderRadius: '4px',
                  fontSize: '0.9em',
                  backgroundColor: 'white'
                }}
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
                style={{
                  flex: '0 0 200px',
                  minWidth: '160px',
                  padding: '8px 12px',
                  border: '1px solid #00796b',
                  borderRadius: '4px',
                  fontSize: '0.9em',
                  backgroundColor: 'white'
                }}
                disabled={availableLocationOptions.length === 0}
              >
                {availableLocationOptions.length === 0 ? (
                  <option value="">No LOC IDs available</option>
                ) : (
                  availableLocationOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))
                )}
              </select>

              <button
                type="button"
                onClick={handleAttachMapping}
                className="btn btn-primary"
                style={{ padding: '8px 16px' }}
                disabled={!selectedLevelId || !locationSelectValue}
              >
                Attach Pair
              </button>
            </div>
            {currentLocationWarning && (
              <div style={{ color: '#c62828', fontSize: '0.8em', marginTop: '8px' }}>{currentLocationWarning}</div>
            )}
            {!currentLocationWarning && locationSelectValue && (
              <div style={{ color: '#388e3c', fontSize: '0.8em', marginTop: '8px' }}>
                Selected ID ready to attach: {locationSelectValue}
              </div>
            )}
          </div>

          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '12px', color: '#333' }}>
              Attached Level / Location Pairs
            </div>
            {attachedMappings.length === 0 ? (
              <div style={{ fontSize: '0.85em', color: '#666' }}>
                No mappings added yet. Select a level, enter a Location ID, and click "Attach Pair".
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {attachedMappings.map((mapping, index) => {
                  const normalizedLocation = normalizeLocationId(mapping.locationId);
                  const isDuplicate = normalizedLocation && (attachedLocationCounts.get(normalizedLocation) || 0) > 1;
                  const conflictsExternally = normalizedLocation && externalLocationSet.has(normalizedLocation);

                  return (
                    <div
                      key={mapping.levelId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        padding: '10px 14px',
                        borderRadius: '6px',
                        border: '1px solid #c5e1a5',
                        backgroundColor: '#f9fff2'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1b5e20' }}>
                        <span style={{ fontWeight: 600 }}>{index + 1}.</span>
                        <span style={{ fontWeight: 600 }}>L{mapping.levelId.replace(/[^0-9]/g, '') || mapping.levelId}</span>
                        <span style={{ color: '#388e3c', fontSize: '0.9em' }}>→</span>
                        <span style={{ fontWeight: 600, color: '#01579b' }}>{mapping.locationId || 'Not set'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveMapping(mapping.levelId)}
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px' }}
                      >
                        Remove
                      </button>
                      {(isDuplicate || conflictsExternally || !normalizedLocation) && (
                        <div style={{ flexBasis: '100%', fontSize: '0.75em', color: '#c62828' }}>
                          {!normalizedLocation && 'Provide a Location ID for this level.'}
                          {normalizedLocation && conflictsExternally && `Location ID ${normalizedLocation} is already used elsewhere.`}
                          {normalizedLocation && !conflictsExternally && isDuplicate && `Location ID ${normalizedLocation} is assigned to multiple levels.`}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={handleClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={attachedMappings.length === 0}
          >
            Save Level Mappings
          </button>
        </div>
      </div>
    </div>
  );
};

export default MultiLocationSelector;
