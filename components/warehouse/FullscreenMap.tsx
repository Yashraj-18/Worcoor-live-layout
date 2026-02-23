// @ts-nocheck
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import SavedLayoutRenderer, { getLayoutItemKey } from './SavedLayoutRenderer';
import { inferVerticalRackLevelCount } from '@/lib/warehouse/utils/verticalRackUtils';
import summarizeStorageComponents from '@/lib/warehouse/utils/layoutComponentSummary';
import locationDataService from '@/lib/warehouse/services/locationDataService';
import LocationDetailsPanel from './LocationDetailsPanel';
import WarehouseOverviewPanel from './WarehouseOverviewPanel';
import layoutComponentsMock from '@/lib/warehouse/data/layoutComponentsMock.json';

const renderDemoLayout = (demoData) => (
  <svg width="100%" height="100%" viewBox="0 0 700 320" className="fullscreen-warehouse-svg">
    <rect width="700" height="320" fill="#ffffff" stroke="#dee2e6" strokeWidth="2" rx="8" />

    {/* Render zones */}
    {demoData.zones && demoData.zones.map((zone, index) => (
      <g key={index}>
        <rect
          x={zone.x}
          y={zone.y}
          width={zone.width}
          height={zone.height}
          fill={zone.color}
          stroke="#333"
          strokeWidth="2"
          opacity="0.7"
          rx="4"
        />

        {(() => {
          const getFullscreenZoneLabel = () => {
            if (zone.label && zone.label.trim()) return zone.label.trim();
            if (zone.name && zone.name.trim()) return zone.name.trim();
            if (zone.id && zone.id.trim()) return zone.id.trim();

            const typeLabels = {
              storage: 'ZONE',
              receiving: 'RCV',
              dispatch: 'DSP',
              office: 'OFF',
              overflow: 'OVF'
            };

            const prefix = typeLabels[zone.type] || 'ZONE';
            return `${prefix}-${String(index + 1).padStart(2, '0')}`;
          };

          const label = getFullscreenZoneLabel();
          if (!label) return null;

          const fontSize = Math.min(Math.max(zone.width / 12, 10), 16);
          let labelColor = '#2c3e50';
          let bgColor = 'rgba(52, 152, 219, 0.15)';
          let borderColor = '#3498db';

          if (zone.type === 'receiving') {
            labelColor = '#e67e22';
            bgColor = 'rgba(230, 126, 34, 0.15)';
            borderColor = '#f39c12';
          } else if (zone.type === 'dispatch') {
            labelColor = '#8e44ad';
            bgColor = 'rgba(142, 68, 173, 0.15)';
            borderColor = '#9b59b6';
          } else if (zone.type === 'office') {
            labelColor = '#27ae60';
            bgColor = 'rgba(39, 174, 96, 0.15)';
            borderColor = '#2ecc71';
          }

          return (
            <g>
              <rect
                x={zone.x + zone.width / 2 - Math.max(label.length * fontSize * 0.35, 25)}
                y={zone.y + zone.height + 8}
                width={Math.max(label.length * fontSize * 0.7, 50)}
                height={fontSize + 8}
                fill={bgColor}
                stroke={borderColor}
                strokeWidth="1.5"
                rx="4"
              />
              <text
                x={zone.x + zone.width / 2}
                y={zone.y + zone.height + fontSize + 12}
                textAnchor="middle"
                fontSize={fontSize}
                fontWeight="600"
                fill={labelColor}
              >
                {label}
              </text>
            </g>
          );
        })()}
      </g>
    ))}

    {/* Render equipment */}
    {demoData.equipment && demoData.equipment.map((equipment, index) => (
      <circle
        key={index}
        cx={equipment.x}
        cy={equipment.y}
        r="8"
        fill={equipment.status === 'active' ? '#28a745' : '#dc3545'}
        stroke="#333"
        strokeWidth="1"
      />
    ))}
  </svg>
);

const FullscreenMap = () => {
  const [mapData, setMapData] = useState<any>(null);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [operationalData, setOperationalData] = useState({});
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [highlightedItems, setHighlightedItems] = useState([]);
  const [filteredKeys, setFilteredKeys] = useState([]);
  const [highlightedCompartmentsMap, setHighlightedCompartmentsMap] = useState({});
  
  // Enhanced dropdown search states
  const [selectedLocationTag, setSelectedLocationTag] = useState('');
  const [selectedSku, setSelectedSku] = useState('');
  const [selectedAsset, setSelectedAsset] = useState('');
  const [availableLocationTags, setAvailableLocationTags] = useState([]);
  const [availableSkus, setAvailableSkus] = useState([]);
  const [availableAssets, setAvailableAssets] = useState([]);
  const [dropdownSearchActive, setDropdownSearchActive] = useState(false);

  const storageSummaries = useMemo(() => {
    if (!mapData) {
      return [];
    }

    if (Array.isArray(mapData.storageSummaries) && mapData.storageSummaries.length > 0) {
      return mapData.storageSummaries;
    }

    if (mapData.layoutData && Array.isArray(mapData.layoutData.items)) {
      return summarizeStorageComponents(mapData.layoutData.items);
    }

    if (Array.isArray(mapData.layoutItems) && mapData.layoutItems.length > 0) {
      return summarizeStorageComponents(mapData.layoutItems);
    }

    return [];
  }, [mapData]);

  const sidebarData = useMemo(() => {
    if (!mapData) {
      return { type: 'none' };
    }

    const { isCustomLayout, layoutData, demoData } = mapData;

    if (!isCustomLayout && demoData) {
      return {
        type: 'demo',
        zones: Array.isArray(demoData.zones) ? demoData.zones : [],
        equipment: Array.isArray(demoData.equipment) ? demoData.equipment : []
      };
    }

    if (isCustomLayout && layoutData && Array.isArray(layoutData.items)) {
      const typeMap = {
        storage_unit: 'Storage Unit',
        spare_unit: 'Spare Unit',
        sku_holder: 'Horizontal Storage',
        vertical_sku_holder: 'Vertical Storage',
        square_boundary: 'Square Boundary',
        solid_boundary: 'Solid Boundary',
        dotted_boundary: 'Dotted Boundary'
      };

      const counts = layoutData.items.reduce((acc, item) => {
        if (item.type === 'square_boundary') {
          return acc;
        }
        const typeName = typeMap[item.type] || (item.type ? item.type.replace(/_/g, ' ') : 'Component');
        acc[typeName] = (acc[typeName] || 0) + 1;
        return acc;
      }, {});

      const componentCounts = Object.entries(counts).sort(([, countA], [, countB]) => countB - countA);

      return {
        type: 'custom',
        componentCounts
      };
    }

    return { type: 'none' };
  }, [mapData]);

  const shouldShowDemoLegend = useMemo(() => {
    if (!mapData) {
      return false;
    }

    return !mapData.isCustomLayout && Array.isArray(mapData.demoData?.zones) && mapData.demoData.zones.length > 0;
  }, [mapData]);

  const sidebarContent = useMemo(() => {
    // Don't show any sidebar content - only show operational info panel when item is clicked
    return null;
  }, []);

  useEffect(() => {
    // Get map data from URL hash
    const hash = window.location.hash;
    if (hash.startsWith('#fullscreen-map=')) {
      try {
        const encodedData = hash.replace('#fullscreen-map=', '');
        const decodedData = decodeURIComponent(encodedData);
        const parsedData = JSON.parse(decodedData);
        setMapData(parsedData);
        
        // Generate operational data for each item
        const layoutItems = parsedData.layoutData?.items || parsedData.layoutItems || [];

        if (layoutItems.length > 0) {
          const opData = generateOperationalData(layoutItems);
          setOperationalData(opData);

          // Extract dropdown options from operational data
          extractDropdownOptions(layoutItems, opData);
        }
      } catch (err) {
        setError('Failed to load map data');
        console.error('Error parsing map data:', err);
      }
    } else {
      setError('No map data provided');
    }
  }, []);

  const generateOperationalData = (items) => {
    const data = {};

    items.forEach((item, index) => {
      const itemId = `item-${index}`;
      
      // Extract locationId from various possible sources
      let locationId = item.locationId || 
                       item.locationData?.location_id ||
                       item.properties?.locationId ||
                       item.data?.locationId;
      
      // For storage racks with compartments, try to get locationId from first compartment
      if (!locationId && item.compartmentContents) {
        const compartments = Object.values(item.compartmentContents);
        if (compartments.length > 0) {
          const firstCompartment = compartments[0];
          locationId = firstCompartment.locationId || firstCompartment.uniqueId;
        }
      }

      // Fetch real data from the service if locationId exists
      const realLocationData = locationId ? locationDataService.getLocationById(locationId) : null;
      
      if (locationId) {
        console.log(`FullscreenMap - Item ${index}: locationId=${locationId}, realData=`, realLocationData);
      }

      if (item.compartmentContents) {
        const contents = Object.values(item.compartmentContents || {});
        const skus = {};
        contents.forEach((content, idx) => {
          const skuKey = content.uniqueId || content.locationId || `sku-${idx}`;
          skus[skuKey] = {
            sku: content.sku || content.locationId || content.uniqueId,
            quantity: content.quantity || 0,
            category: content.category || item.category || null,
            brand: content.brand || null,
            uniqueId: content.uniqueId || content.locationId
          };
        });

        data[itemId] = {
          type: 'storage',
          utilization: item.utilization || null,
          capacity: item.capacity || null,
          location: {
            zone: item.zoneId || item.locationTag || item.locationId || 'ZONE-UNKNOWN',
            aisle: item.aisle || null,
            position: item.position || null
          },
          skus,
          alerts: [],
          activity: [],
          equipment: [],
          // Add real location data if available
          realData: realLocationData
        };
        return;
      }

      data[itemId] = {
        type: 'zone',
        zoneId: item.locationId || item.locationTag || item.label || item.name || `ZONE-${index + 1}`,
        occupancy: item.occupancy || null,
        throughput: item.throughput || null,
        location: {
          floor: item.floor || null,
          sector: item.sector || item.type || null,
          dock: item.dock || null
        },
        alerts: [],
        activity: [],
        equipment: [],
        // Add real location data if available
        realData: realLocationData
      };
    });

    return data;
  };

  const handleItemClick = (item, index) => {
    if (!mapData || !mapData.layoutData || !Array.isArray(mapData.layoutData.items)) {
      return;
    }

    const itemId = `item-${index}`;
    let opData = operationalData[itemId];
    
    // If a specific compartment was clicked, fetch its real data
    if (item.selectedCompartment) {
      const compartmentLocationId = item.selectedCompartment.locationId || item.selectedCompartment.uniqueId;
      const compartmentRealData = compartmentLocationId ? locationDataService.getLocationById(compartmentLocationId) : null;
      
      console.log('FullscreenMap - Compartment clicked:', {
        compartmentId: item.selectedCompartmentId,
        locationId: compartmentLocationId,
        realData: compartmentRealData
      });
      
      // Create modified opData with compartment-specific real data
      opData = {
        ...opData,
        realData: compartmentRealData
      };
    }

    setSelectedItem({ ...item, id: itemId, operationalData: opData });
    setShowInfoPanel(true);
  };

  // Generate realistic alerts
  const generateAlerts = () => {
    const alerts = [];
    const alertTypes = [
      'Low stock warning - Below reorder point',
      'Temperature deviation detected',
      'Overdue inventory check',
      'High demand item - Consider restocking',
      'Slow moving inventory',
      'Expiry date approaching',
      'Damage reported - Inspection required'
    ];
    
    if (Math.random() > 0.7) { // 30% chance of alerts
      const alertCount = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < alertCount; i++) {
        alerts.push(alertTypes[Math.floor(Math.random() * alertTypes.length)]);
      }
    }
    return alerts;
  };

  // Extract dropdown options from data
  const extractDropdownOptions = (items, opData) => {
    const locationTags = new Set();
    const skus = new Set();
    const assets = new Set();

    // Create a lookup map from location_id to sku_name (case-insensitive)
    const locationToSkuMap = {};
    if (layoutComponentsMock?.locations) {
      layoutComponentsMock.locations.forEach(loc => {
        if (loc.location_id && loc.sku_name) {
          // Store both original case and uppercase version for matching
          locationToSkuMap[loc.location_id] = loc.sku_name;
          locationToSkuMap[loc.location_id.toUpperCase()] = loc.sku_name;
          locationToSkuMap[loc.location_id.toLowerCase()] = loc.sku_name;
        }
      });
    }

    const addLocation = (value) => {
      if (!value) return;
      const normalized = typeof value === 'string' ? value.trim() : String(value).trim();
      if (normalized) {
        locationTags.add(normalized);
      }
    };

    const addSku = (value) => {
      if (!value) return;
      const normalized = typeof value === 'string' ? value.trim() : String(value).trim();
      if (normalized) {
        // Handle comma-separated location IDs (e.g., "LOC-007,LOC-008")
        if (normalized.includes(',')) {
          const locationIds = normalized.split(',').map(id => id.trim());
          locationIds.forEach(locId => {
            const skuName = locationToSkuMap[locId];
            if (skuName) {
              skus.add(skuName);
            }
          });
        } else {
          // Single location ID - map it to SKU name
          const skuName = locationToSkuMap[normalized];
          if (skuName) {
            skus.add(skuName);
          } else if (!normalized.startsWith('LOC-') && !normalized.startsWith('Loc-') && !normalized.startsWith('loc-')) {
            // If it's not a location ID pattern, add it as-is (might be actual SKU)
            skus.add(normalized);
          }
        }
      }
    };

    const collectLocationsFromContent = (content = {}) => {
      if (!content) return;

      // Collect all location IDs from content
      addLocation(content.locationId);
      addLocation(content.primaryLocationId);

      if (Array.isArray(content.locationIds)) {
        content.locationIds.forEach(addLocation);
      }

      if (Array.isArray(content.levelLocationMappings)) {
        content.levelLocationMappings.forEach((mapping) => {
          addLocation(mapping?.locationId || mapping?.locId);
          // Also extract SKU from location ID in mapping
          addSku(mapping?.locationId || mapping?.locId);
        });
      }

      if (Array.isArray(content.levelIds) && Array.isArray(content.locationIds)) {
        content.locationIds.forEach(locId => {
          addLocation(locId);
          addSku(locId); // Also add as SKU to map to name
        });
      }

      // Add SKU data from all content fields
      addSku(content.sku);
      addSku(content.uniqueId);
      addSku(content.primarySku);
      addSku(content.locationId); // Location ID can map to SKU name
      addSku(content.primaryLocationId); // Primary location ID can map to SKU name
      
      // Handle locationIds array
      if (Array.isArray(content.locationIds)) {
        content.locationIds.forEach(addSku);
      }
    };

    const collectLocationsFromItem = (item = {}, itemOpData = null) => {
      if (item?.type === 'square_boundary') {
        return;
      }

      addLocation(item.locationId);
      addLocation(item.locationCode);
      addLocation(item.locationTag);
      addLocation(item.primaryLocationId);

      addSku(item.skuId);
      addSku(item.sku);
      addSku(item.locationId); // Extract SKU from location ID
      addSku(item.primaryLocationId); // Extract SKU from primary location

      if (Array.isArray(item.locationIds)) {
        item.locationIds.forEach(locId => {
          addLocation(locId);
          addSku(locId); // Extract SKU from each location ID
        });
      }

      // Extract from item-level levelLocationMappings (vertical racks)
      if (Array.isArray(item.levelLocationMappings)) {
        item.levelLocationMappings.forEach((mapping) => {
          const locId = mapping?.locationId || mapping?.locId;
          addLocation(locId);
          addSku(locId); // Extract SKU from each level's location ID
        });
      }

      if (item.compartmentContents) {
        Object.values(item.compartmentContents).forEach((content) => {
          collectLocationsFromContent(content);
        });
      }

      if (itemOpData && itemOpData.location) {
        Object.values(itemOpData.location).forEach(addLocation);
      }

      if (itemOpData && itemOpData.skus) {
        Object.values(itemOpData.skus).forEach((skuData) => {
          addSku(skuData?.sku);
          addSku(skuData?.uniqueId);
        });
      }
    };

    items.forEach((item, index) => {
      const itemId = `item-${index}`;
      const itemOpData = opData[itemId];

      collectLocationsFromItem(item, itemOpData);

      if (item.type && item.type !== 'square_boundary') {
        assets.add(item.type.toUpperCase().replace(/_/g, ' '));
      }
      if (item.name && item.type !== 'square_boundary') {
        assets.add(item.name);
      }
      if (itemOpData) {
        if (itemOpData.zoneId) assets.add(itemOpData.zoneId);
        if (Array.isArray(itemOpData.equipment)) {
          itemOpData.equipment.forEach((eq) => assets.add(eq));
        }
      }
    });

    setAvailableLocationTags(Array.from(locationTags).sort());
    setAvailableSkus(Array.from(skus).sort());
    setAvailableAssets(Array.from(assets).sort());
  };
  
  // Enhanced search functionality with dropdown filters only - matching WarehouseMapView approach
  const performSearch = useCallback(() => {
    // Check if dropdown search is active
    const hasDropdownFilters = selectedLocationTag || selectedSku || selectedAsset;
    
    if (!hasDropdownFilters) {
      setSearchResults([]);
      setHighlightedItems([]);
      setFilteredKeys([]);
      setHighlightedCompartmentsMap({});
      setDropdownSearchActive(false);
      return;
    }

    const results = [];
    const highlighted = [];
    const compartmentMap = {};
    setDropdownSearchActive(hasDropdownFilters);

    if (mapData && mapData.layoutData && mapData.layoutData.items) {
      const typeMap = {
        'Storage Unit': 'storage_unit',
        'Spare Unit': 'spare_unit',
        'Horizontal Storage': 'sku_holder',
        'Vertical Storage': 'vertical_sku_holder',
        'Square Boundary': 'square_boundary',
        'Solid Boundary': 'solid_boundary',
        'Dotted Boundary': 'dotted_boundary'
      };

      // Create reverse lookup: SKU name -> location IDs (with all case variations)
      const skuNameToLocationIds = {};
      if (layoutComponentsMock?.locations) {
        layoutComponentsMock.locations.forEach(loc => {
          if (loc.sku_name && loc.location_id) {
            if (!skuNameToLocationIds[loc.sku_name]) {
              skuNameToLocationIds[loc.sku_name] = [];
            }
            // Add all case variations of the location ID
            skuNameToLocationIds[loc.sku_name].push(loc.location_id);
            skuNameToLocationIds[loc.sku_name].push(loc.location_id.toUpperCase());
            skuNameToLocationIds[loc.sku_name].push(loc.location_id.toLowerCase());
          }
        });
      }

      mapData.layoutData.items.forEach((item, index) => {
        const itemId = `item-${index}`;
        const itemKey = getLayoutItemKey(item) || itemId;
        let matchesFilters = true;

        const locationCompartmentMatches = [];
        const skuCompartmentMatches = [];

        // Check location tag filter
        if (selectedLocationTag) {
          const itemLevelMatch = [item.locationId, item.locationCode, item.locationTag, item.primaryLocationId]
            .some((value) => typeof value === 'string' && value.trim() === selectedLocationTag);

          // Check item-level locationIds array
          let itemLocationIdsMatch = false;
          if (Array.isArray(item.locationIds)) {
            itemLocationIdsMatch = item.locationIds.includes(selectedLocationTag);
          }

          // Check item-level levelLocationMappings (vertical racks)
          let itemLevelMappingsMatch = false;
          if (Array.isArray(item.levelLocationMappings)) {
            itemLevelMappingsMatch = item.levelLocationMappings.some(mapping => 
              (mapping?.locationId === selectedLocationTag || mapping?.locId === selectedLocationTag)
            );
          }

          if (item.compartmentContents) {
            Object.entries(item.compartmentContents).forEach(([compartmentId, content]) => {
              if (!content) return;

              const matches = (
                content.locationId === selectedLocationTag ||
                content.uniqueId === selectedLocationTag ||
                content.primaryLocationId === selectedLocationTag ||
                (Array.isArray(content.locationIds) && content.locationIds.includes(selectedLocationTag)) ||
                (Array.isArray(content.levelLocationMappings) && content.levelLocationMappings.some(mapping =>
                  mapping?.locationId === selectedLocationTag || mapping?.locId === selectedLocationTag
                ))
              );

              if (matches) {
                locationCompartmentMatches.push(compartmentId);
              }
            });
          }

          const hasLocationMatch = itemLevelMatch || itemLocationIdsMatch || itemLevelMappingsMatch || locationCompartmentMatches.length > 0;
          matchesFilters = matchesFilters && hasLocationMatch;
        }

        // Check SKU filter
        if (selectedSku) {
          // Get location IDs that have this SKU name
          const locationIdsForSku = skuNameToLocationIds[selectedSku] || [];
          
          let itemLevelSkuMatch = false;
          itemLevelSkuMatch = [item.sku, item.skuId, item.locationId]
            .some((value) => typeof value === 'string' && (value.trim() === selectedSku || locationIdsForSku.includes(value.trim())));

          // Check item-level locationIds array
          let itemLocationIdsSkuMatch = false;
          if (Array.isArray(item.locationIds)) {
            itemLocationIdsSkuMatch = item.locationIds.some(locId => locationIdsForSku.includes(locId));
          }

          // Check item-level levelLocationMappings (vertical racks)
          let itemLevelMappingsSkuMatch = false;
          if (Array.isArray(item.levelLocationMappings)) {
            itemLevelMappingsSkuMatch = item.levelLocationMappings.some(mapping => {
              const locId = mapping?.locationId || mapping?.locId;
              return locId && locationIdsForSku.includes(locId);
            });
          }

          if (item.compartmentContents) {
            Object.entries(item.compartmentContents).forEach(([compartmentId, content]) => {
              if (!content) return;

              // Check all possible SKU/location fields
              const matches = (
                content.sku === selectedSku ||
                content.uniqueId === selectedSku ||
                content.primarySku === selectedSku ||
                content.locationId === selectedSku ||
                locationIdsForSku.includes(content.sku) ||
                locationIdsForSku.includes(content.uniqueId) ||
                locationIdsForSku.includes(content.locationId) ||
                locationIdsForSku.includes(content.primaryLocationId) ||
                (Array.isArray(content.locationIds) && content.locationIds.some(locId => locationIdsForSku.includes(locId))) ||
                (Array.isArray(content.levelLocationMappings) && content.levelLocationMappings.some(mapping => {
                  const locId = mapping?.locationId || mapping?.locId;
                  return locId && locationIdsForSku.includes(locId);
                }))
              );

              if (matches) {
                skuCompartmentMatches.push(compartmentId);
              }
            });
          }

          const hasSkuMatch = itemLevelSkuMatch || itemLocationIdsSkuMatch || itemLevelMappingsSkuMatch || skuCompartmentMatches.length > 0;
          matchesFilters = matchesFilters && hasSkuMatch;
        }

        // Check asset filter
        if (selectedAsset) {
          const itemType = typeMap[selectedAsset] || selectedAsset.toLowerCase().replace(/ /g, '_');
          const assetMatches = item.type === itemType;
          matchesFilters = matchesFilters && assetMatches;
        }

        if (!matchesFilters) {
          return;
        }

        // Add to highlighted items
        highlighted.push(itemKey);

        // Track which compartments to highlight
        let compartmentHighlights = [];
        if (locationCompartmentMatches.length && skuCompartmentMatches.length) {
          // If both filters active, only highlight compartments that match both
          compartmentHighlights = locationCompartmentMatches.filter((id) => skuCompartmentMatches.includes(id));
        } else if (locationCompartmentMatches.length) {
          compartmentHighlights = locationCompartmentMatches;
        } else if (skuCompartmentMatches.length) {
          compartmentHighlights = skuCompartmentMatches;
        }

        if (compartmentHighlights.length) {
          compartmentMap[itemKey] = Array.from(new Set(compartmentHighlights));
        }

        // Create result entry
        const opData = operationalData[itemId];
        let title = item.name || item.label || item.type || 'Item';
        let subtitle = '';

        if (opData) {
          if (opData.type === 'storage') {
            title = `Location: ${opData.unitId}`;
            subtitle = `Zone ${opData.location.zone}, Aisle ${opData.location.aisle}, Position ${opData.location.position}`;
          } else if (opData.type === 'zone') {
            title = `Zone: ${opData.zoneId}`;
            subtitle = `Throughput: ${opData.throughput} items/hr`;
          }
        } else {
          // Fallback when no operational data
          if (item.locationId) subtitle = `Location: ${item.locationId}`;
          else if (item.locationTag) subtitle = `Tag: ${item.locationTag}`;
        }

        results.push({
          id: itemKey,
          type: 'location',
          title: title,
          subtitle: subtitle,
          item: item,
          opData: opData
        });
      });
    }

    const uniqueHighlighted = Array.from(new Set(highlighted));

    setSearchResults(results);
    setHighlightedItems(uniqueHighlighted);
    setFilteredKeys(uniqueHighlighted);
    setHighlightedCompartmentsMap(compartmentMap);
  }, [selectedLocationTag, selectedSku, selectedAsset, mapData, operationalData]);

  useEffect(() => {
    performSearch();
  }, [performSearch]);

  // Dropdown filter handlers
  const handleLocationTagChange = (e) => {
    const value = e.target.value;
    setSelectedLocationTag(value);
  };
  
  const handleSkuChange = (e) => {
    const value = e.target.value;
    setSelectedSku(value);
  };
  
  const handleAssetChange = (e) => {
    const value = e.target.value;
    setSelectedAsset(value);
  };

  const clearSearch = () => {
    setSelectedLocationTag('');
    setSelectedSku('');
    setSelectedAsset('');
    setSearchResults([]);
    setHighlightedItems([]);
    setFilteredKeys([]);
    setHighlightedCompartmentsMap({});
    setDropdownSearchActive(false);
  };

  // Helper function to render custom layout
  const renderCustomLayout = (items) => {
    if (!items || items.length === 0) {
      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'transparent'
          }}
        />
      );
    }

    // Calculate ultra-tight bounds; prefer square boundary when available
    const boundaryItem = items.find((item) => item.type === 'square_boundary');

    let minX;
    let minY;
    let maxX;
    let maxY;

    if (boundaryItem && boundaryItem.width != null && boundaryItem.height != null) {
      minX = boundaryItem.x;
      minY = boundaryItem.y;
      maxX = boundaryItem.x + boundaryItem.width;
      maxY = boundaryItem.y + boundaryItem.height;
    } else {
      const xs = items.map((item) => item.x);
      const ys = items.map((item) => item.y);
      const xMaxes = items.map((item) => item.x + (item.width || 0));
      const yMaxes = items.map((item) => item.y + (item.height || 0));

      minX = xs.length ? Math.min(...xs) : 0;
      minY = ys.length ? Math.min(...ys) : 0;
      maxX = xMaxes.length ? Math.max(...xMaxes) : 0;
      maxY = yMaxes.length ? Math.max(...yMaxes) : 0;
    }

    const contentWidth = Math.max(maxX - minX, 1);
    const contentHeight = Math.max(maxY - minY, 1);

    // Provide comfortable breathing room around the layout
    const strokeAllowance = boundaryItem ? Math.max(boundaryItem.borderWidth || 4, 4) : 0;
    const basePadding = 200 + strokeAllowance;
    const zoomOutFactor = 2.4; // Zoom out while keeping the full boundary visible

    const baseWidth = contentWidth + (basePadding * 2);
    const baseHeight = contentHeight + (basePadding * 2);

    const viewBoxWidth = baseWidth * zoomOutFactor;
    const viewBoxHeight = baseHeight * zoomOutFactor;

    const centerX = minX + contentWidth / 2;
    const centerY = minY + contentHeight / 2;

    const viewBoxX = centerX - viewBoxWidth / 2;
    const viewBoxY = centerY - viewBoxHeight / 2;

    const handleMouseDown = () => {};
    const handleMouseMove = () => {};
    const handleMouseUp = () => {};
    const handleWheel = () => {};

    return (
      <svg 
        ref={(node) => {
          if (node) {
            node.style.transform = 'none';
          }
        }}
        width="100%" 
        height="100%" 
        viewBox={`${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`}
        className="fullscreen-warehouse-svg"
        preserveAspectRatio="xMidYMid meet"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* Background */}
        <rect 
          x={viewBoxX} 
          y={viewBoxY} 
          width={viewBoxWidth} 
          height={viewBoxHeight} 
          fill="#ffffff" 
          stroke="#dee2e6" 
          strokeWidth="2" 
          rx="8"
        />
        
        {/* Grid pattern */}
        <defs>
          <pattern id="fullscreen-grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#e0e0e0" strokeWidth="1" opacity="0.3"/>
          </pattern>
        </defs>
        <rect 
          x={viewBoxX} 
          y={viewBoxY} 
          width={viewBoxWidth} 
          height={viewBoxHeight} 
          fill="url(#fullscreen-grid)" 
        />

        {/* Render warehouse items */}
        {items.map((item, index) => {
          const itemId = `item-${index}`;
          const opData = operationalData[itemId];
          const isInteractive = opData && (opData.type === 'storage' || opData.type === 'zone');

          const fillColor = item.fill || getItemBackgroundColor(item.type, opData);
          const fillOpacity = typeof item.fillOpacity === 'number' ? item.fillOpacity : 0.8;
          const strokeColor = item.borderColor || getItemBorderColor(item.type, opData);
          const strokeWidth = item.borderWidth != null ? item.borderWidth : 2;
          const strokeDasharray = item.borderStyle === 'dotted' ? '6 4' : undefined;
          const cornerRadius = item.cornerRadius != null ? item.cornerRadius : 4;

          if (item.displayAsLabel) {
            return (
              <g key={item.id || index}>
                <text
                  x={item.x}
                  y={item.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={item.fontSize || 14}
                  fontWeight={item.fontWeight || '600'}
                  fill={item.textColor || '#333333'}
                >
                  {item.text}
                </text>
              </g>
            );
          }

          return (
            <g key={item.id || index}>
              {/* Main item rectangle */}
              <rect
                x={item.x}
                y={item.y}
                width={item.width}
                height={item.height}
                fill={fillColor}
                fillOpacity={fillOpacity}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                rx={cornerRadius}
                style={{ cursor: isInteractive ? 'pointer' : 'default' }}
                onClick={isInteractive ? () => handleItemClick(item, index) : undefined}
              />

              {/* Vertical storage rack level count */}
              {item.type === 'vertical_sku_holder' && (() => {
                const totalLevels = inferVerticalRackLevelCount(item);
                if (!totalLevels) {
                  return null;
                }

                return (
                  <text
                    x={item.x + item.width / 2}
                    y={item.y + item.height / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={Math.max(Math.min(item.width / 4.5, 14), 9)}
                    fontWeight="bold"
                    fill="#111111"
                    style={{ pointerEvents: 'none' }}
                  >
                    {`${totalLevels} Level${totalLevels > 1 ? 's' : ''}`}
                  </text>
                );
              })()}

              {/* Optional internal grid */}
              {item.grid && item.width && item.height && (() => {
                const { rows, cols, padding = 0, gap = 0, fill: cellFill = '#FFFFFF', stroke: cellStroke = '#B0BEC5' } = item.grid;
                const effectiveWidth = item.width - padding * 2 - gap * (cols - 1);
                const effectiveHeight = item.height - padding * 2 - gap * (rows - 1);
                const cellWidth = cols > 0 ? effectiveWidth / cols : 0;
                const cellHeight = rows > 0 ? effectiveHeight / rows : 0;

                if (cellWidth <= 0 || cellHeight <= 0) {
                  return null;
                }

                const cells = [];
                for (let row = 0; row < rows; row++) {
                  for (let col = 0; col < cols; col++) {
                    const cellX = item.x + padding + col * (cellWidth + gap);
                    const cellY = item.y + padding + row * (cellHeight + gap);
                    cells.push(
                      <rect
                        key={`${item.id}-cell-${row}-${col}`}
                        x={cellX}
                        y={cellY}
                        width={cellWidth}
                        height={cellHeight}
                        fill={cellFill}
                        stroke={cellStroke}
                        strokeWidth="0.75"
                        rx={Math.min(cellWidth, cellHeight) * 0.1}
                      />
                    );
                  }
                }

                return <g>{cells}</g>;
              })()}

              {/* Embedded text lines */}
              {item.textLines && item.textLines.length > 0 && (
                <g>
                  {item.textLines.map((line, lineIndex) => {
                    const totalLines = item.textLines.length;
                    const fontSize = item.textSize || 14;
                    const verticalSpacing = fontSize + 4;
                    const textStartY = item.y + (item.height / 2) - ((totalLines - 1) * verticalSpacing) / 2;
                    return (
                      <text
                        key={`${item.id}-line-${lineIndex}`}
                        x={item.x + item.width / 2}
                        y={textStartY + lineIndex * verticalSpacing}
                        textAnchor="middle"
                        fontSize={fontSize}
                        fontWeight={item.fontWeight || '600'}
                        fill={item.textColor || '#204051'}
                        style={{ pointerEvents: 'none' }}
                      >
                        {line}
                      </text>
                    );
                  })}
                </g>
              )}

              {/* Operational status indicator */}
              {opData && opData.status && (
                <circle
                  cx={item.x + item.width - 8}
                  cy={item.y + 8}
                  r="4"
                  fill={getStatusColor(opData.status)}
                  stroke="white"
                  strokeWidth="1"
                />
              )}
              
              {/* Utilization bar for storage items */}
              {opData && opData.type === 'storage' && item.width > 40 && (
                <g>
                  <rect
                    x={item.x + 5}
                    y={item.y + item.height - 12}
                    width={item.width - 10}
                    height="4"
                    fill="#e0e0e0"
                    rx="2"
                  />
                  <rect
                    x={item.x + 5}
                    y={item.y + item.height - 12}
                    width={(item.width - 10) * (opData.utilization / 100)}
                    height="4"
                    fill={getUtilizationColor(opData.utilization)}
                    rx="2"
                  />
                </g>
              )}
              
              {/* Alert indicator */}
              {opData && opData.alerts && opData.alerts.length > 0 && (
                <text
                  x={item.x + 8}
                  y={item.y + 16}
                  fontSize="12"
                  fill="#ff6b35"
                  fontWeight="bold"
                >
                  ⚠
                </text>
              )}
              
              {/* Item label */}
              {item.width > 60 && item.height > 30 && !item.disableAutoLabel && (
                <text
                  x={item.x + item.width / 2}
                  y={item.y + item.height / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="12"
                  fill="#333"
                  fontWeight="bold"
                  style={{ pointerEvents: 'none' }}
                >
                  {getItemLabel(item)}
                </text>
              )}
              
              {/* Real-time metrics display for storage units */}
              {opData && opData.type === 'storage' && item.width > 60 && item.height > 40 && (
                <g>
                  {/* Unit ID */}
                  <text
                    x={item.x + 5}
                    y={item.y + 15}
                    fontSize="9"
                    fill="#333"
                    fontWeight="bold"
                    style={{ pointerEvents: 'none' }}
                  >
                    {opData.unitId}
                  </text>
                  
                  {/* Capacity info */}
                  <text
                    x={item.x + item.width / 2}
                    y={item.y + item.height / 2 + 15}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="10"
                    fill="#666"
                    fontWeight="bold"
                    style={{ pointerEvents: 'none' }}
                  >
                    {opData.occupied}/{opData.capacity}
                  </text>
                  
                  {/* Location info */}
                  <text
                    x={item.x + item.width / 2}
                    y={item.y + item.height / 2 + 28}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="8"
                    fill="#888"
                    style={{ pointerEvents: 'none' }}
                  >
                    {opData.location.zone}-{opData.location.aisle}-{opData.location.position}
                  </text>
                </g>
              )}

              {/* Zone metrics for larger zones */}
              {opData && opData.type === 'zone' && item.width > 100 && item.height > 60 && (
                <g>
                  {/* Zone ID */}
                  <text
                    x={item.x + 8}
                    y={item.y + 18}
                    fontSize="11"
                    fill="#333"
                    fontWeight="bold"
                    style={{ pointerEvents: 'none' }}
                  >
                    {opData.zoneId}
                  </text>
                  
                  {/* Throughput */}
                  <text
                    x={item.x + 8}
                    y={item.y + 35}
                    fontSize="9"
                    fill="#666"
                    style={{ pointerEvents: 'none' }}
                  >
                    {opData.throughput} items/hr
                  </text>
                  
                  {/* Workers */}
                  <text
                    x={item.x + 8}
                    y={item.y + 48}
                    fontSize="9"
                    fill="#666"
                    style={{ pointerEvents: 'none' }}
                  >
                    👥 {opData.activeWorkers} workers
                  </text>
                  
                  {/* Efficiency */}
                  <text
                    x={item.x + item.width - 8}
                    y={item.y + 18}
                    textAnchor="end"
                    fontSize="9"
                    fill={parseFloat(opData.metrics.efficiency) > 90 ? "#28a745" : "#ffc107"}
                    fontWeight="bold"
                    style={{ pointerEvents: 'none' }}
                  >
                    {opData.metrics.efficiency}
                  </text>
                </g>
              )}
              
              {/* Fixed info icon for ALL interactive items */}
              {isInteractive && (
                <g>
                  <circle
                    cx={item.x + item.width - 12}
                    cy={item.y + 12}
                    r="10"
                    fill="rgba(0, 123, 255, 0.9)"
                    stroke="white"
                    strokeWidth="2"
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleItemClick(item, index)}
                  />
                  <text
                    x={item.x + item.width - 12}
                    y={item.y + 12}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="12"
                    fill="white"
                    fontWeight="bold"
                    style={{ pointerEvents: 'none' }}
                  >
                    ℹ
                  </text>
                </g>
              )}

              {/* Priority indicator for high-priority items */}
              {opData && opData.metrics && opData.metrics.priority === 'High' && (
                <rect
                  x={item.x + 2}
                  y={item.y + 2}
                  width="6"
                  height="6"
                  fill="#dc3545"
                  rx="1"
                />
              )}
            </g>
          );
        })}
        
        {/* Optimization indicator */}
        <text x={viewBoxX + 20} y={viewBoxY + viewBoxHeight - 20} fontSize="14" fill="#28a745" fontWeight="bold">
          ✓ Ultra-tight optimized layout - Fullscreen view
        </text>
      </svg>
    );
  };

  // Helper function to render operational info
  const renderOperationalInfo = (item) => {
    const opData = item.operationalData;
    if (!opData) return <p>No operational data available</p>;

    // Check if we have real data from the mock JSON
    const realData = opData.realData;

    return (
      <div className="operational-details">
        {/* Real Data Section - Show if available */}
        {realData && (
          <>
            <div className="info-section" style={{ background: 'linear-gradient(135deg, #e3f2fd, #bbdefb)', border: '2px solid #2196F3' }}>
              <h4 style={{ color: '#1565C0' }}>📍 Real Location Data</h4>
              <div className="status-grid">
                <div className="status-item">
                  <span className="label">Location ID:</span>
                  <span className="status-value" style={{ fontWeight: 'bold', color: '#1565C0' }}>{realData.location_id}</span>
                </div>
                <div className="status-item">
                  <span className="label">Physical Location:</span>
                  <span className="status-value">{realData.location || 'N/A'}</span>
                </div>
                <div className="status-item">
                  <span className="label">Storage Type:</span>
                  <span className="status-value">{realData.parent_resource || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="info-section" style={{ background: 'linear-gradient(135deg, #f3e5f5, #e1bee7)', border: '2px solid #9C27B0' }}>
              <h4 style={{ color: '#6A1B9A' }}>📦 SKU Information</h4>
              <div className="status-grid">
                <div className="status-item">
                  <span className="label">SKU Instance ID:</span>
                  <span className="status-value">{realData.sku_instance_id || 'N/A'}</span>
                </div>
                <div className="status-item">
                  <span className="label">SKU Code:</span>
                  <span className="status-value">{realData.sku_code || 'N/A'}</span>
                </div>
                <div className="status-item">
                  <span className="label">Product Name:</span>
                  <span className="status-value" style={{ fontWeight: 'bold', fontSize: '1.05em' }}>{realData.sku_name || 'N/A'}</span>
                </div>
                <div className="status-item">
                  <span className="label">Brand / Vendor:</span>
                  <span className="status-value">{realData.sku_brand_vendor || 'N/A'}</span>
                </div>
                <div className="status-item">
                  <span className="label">Procurement Date:</span>
                  <span className="status-value">
                    {realData.sku_procured_date 
                      ? new Date(realData.sku_procured_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div className="info-section" style={{ 
              background: realData.available_quantity > 0 
                ? 'linear-gradient(135deg, #e8f5e9, #c8e6c9)' 
                : 'linear-gradient(135deg, #ffebee, #ffcdd2)',
              border: realData.available_quantity > 0 ? '2px solid #4CAF50' : '2px solid #F44336'
            }}>
              <h4 style={{ color: realData.available_quantity > 0 ? '#2E7D32' : '#C62828' }}>📊 Inventory Status</h4>
              <div className="status-grid">
                <div className="status-item">
                  <span className="label">Available Quantity:</span>
                  <span className="status-value" style={{ 
                    fontSize: '1.5em', 
                    fontWeight: 'bold',
                    color: realData.available_quantity > 0 ? '#2E7D32' : '#C62828'
                  }}>
                    {realData.available_quantity || 0} units
                  </span>
                </div>
                <div className="status-item">
                  <span className="label">Stock Status:</span>
                  <span className="status-value">
                    {realData.available_quantity > 100 
                      ? '✅ Well Stocked' 
                      : realData.available_quantity > 50 
                      ? '⚠️ Moderate Stock' 
                      : realData.available_quantity > 0 
                      ? '🔴 Low Stock' 
                      : '❌ Out of Stock'}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Unit/Zone Identification */}
        <div className="info-section">
          <h4>Unit Information</h4>
          <div className="status-grid">
            <div className="status-item">
              <span className="label">Unit ID:</span>
              <span className="status-value">{opData.unitId || opData.zoneId}</span>
            </div>
            <div className="status-item">
              <span className="label">Location:</span>
              <span className="status-value">
                {opData.location.zone ? `${opData.location.zone}-${opData.location.aisle}-${opData.location.position}` : 
                 `${opData.location.building}, Floor ${opData.location.floor}, ${opData.location.sector}`}
              </span>
            </div>
            <div className="status-item">
              <span className="label">Status:</span>
              <span className={`status-value ${opData.status}`}>{opData.status}</span>
            </div>
            <div className="status-item">
              <span className="label">Availability:</span>
              <span className={`status-value ${opData.availability}`}>{opData.availability}</span>
            </div>
          </div>
        </div>

        {/* Real-time Metrics */}
        <div className="info-section">
          <h4>Performance Metrics</h4>
          <div className="metrics-grid">
            {opData.metrics && (
              <>
                {opData.type === 'storage' && (
                  <>
                    <div className="metric-item">
                      <span className="metric-label">Daily Throughput:</span>
                      <span className="metric-value">{opData.metrics.dailyThroughput} items</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Avg Pick Time:</span>
                      <span className="metric-value">{opData.metrics.avgPickTime}</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Accuracy:</span>
                      <span className="metric-value">{opData.metrics.accuracy}</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Priority:</span>
                      <span className={`metric-value priority-${opData.metrics.priority.toLowerCase()}`}>
                        {opData.metrics.priority}
                      </span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Access Frequency:</span>
                      <span className="metric-value">{opData.metrics.accessFrequency}/day</span>
                    </div>
                  </>
                )}
                {opData.type === 'zone' && (
                  <>
                    <div className="metric-item">
                      <span className="metric-label">Daily Volume:</span>
                      <span className="metric-value">{opData.metrics.dailyVolume} items</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Process Time:</span>
                      <span className="metric-value">{opData.metrics.avgProcessTime}</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Efficiency:</span>
                      <span className="metric-value">{opData.metrics.efficiency}</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Error Rate:</span>
                      <span className="metric-value">{opData.metrics.errorRate}</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Peak Hours:</span>
                      <span className="metric-value">{opData.metrics.peakHours}</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Cost per Unit:</span>
                      <span className="metric-value">{opData.metrics.costPerUnit}</span>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Capacity Section */}
        {opData.type === 'storage' && (
          <div className="info-section">
            <h4>Capacity</h4>
            <div className="capacity-info">
              <div className="capacity-bar">
                <div 
                  className="capacity-fill" 
                  style={{ width: `${(opData.occupied / opData.capacity) * 100}%` }}
                ></div>
              </div>
              <div className="capacity-text">
                {opData.occupied} / {opData.capacity} units ({Math.round((opData.occupied / opData.capacity) * 100)}% full)
              </div>
            </div>
          </div>
        )}

        {/* Detailed SKU Information */}
        {opData.skus && Object.keys(opData.skus).length > 0 && (
          <div className="info-section">
            <h4>SKU Inventory ({Object.keys(opData.skus).length} items)</h4>
            <div className="sku-list">
              {Object.values(opData.skus).slice(0, 5).map((sku, index) => (
                <div key={index} className="sku-item enhanced">
                  <div className="sku-header">
                    <span className="sku-id">{sku.uniqueId}</span>
                    <span className={`sku-status ${sku.status}`}>{sku.status}</span>
                  </div>
                  <div className="sku-description">
                    <strong>{sku.description}</strong>
                  </div>
                  <div className="sku-details-grid">
                    <div className="sku-detail">
                      <span className="detail-label">Quantity:</span>
                      <span className="detail-value">{sku.quantity}</span>
                    </div>
                    <div className="sku-detail">
                      <span className="detail-label">Reserved:</span>
                      <span className="detail-value">{sku.reservedQty}</span>
                    </div>
                    <div className="sku-detail">
                      <span className="detail-label">Value:</span>
                      <span className="detail-value">{sku.value}</span>
                    </div>
                    <div className="sku-detail">
                      <span className="detail-label">Weight:</span>
                      <span className="detail-value">{sku.weight}</span>
                    </div>
                    <div className="sku-detail">
                      <span className="detail-label">Location:</span>
                      <span className="detail-value">Shelf {sku.location.shelf}-{sku.location.compartment}</span>
                    </div>
                    <div className="sku-detail">
                      <span className="detail-label">Supplier:</span>
                      <span className="detail-value">{sku.supplier}</span>
                    </div>
                  </div>
                  {sku.expiryDate && (
                    <div className="sku-expiry">
                      <span className="expiry-label">Expires:</span>
                      <span className="expiry-date">{new Date(sku.expiryDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="sku-batch">
                    <span className="batch-label">Batch:</span>
                    <span className="batch-number">{sku.batchNumber}</span>
                  </div>
                </div>
              ))}
              {Object.keys(opData.skus).length > 5 && (
                <div className="sku-more">
                  <strong>+{Object.keys(opData.skus).length - 5} more SKUs</strong>
                  <br />
                  <small>Click for complete inventory list</small>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Zone Information */}
        {opData.type === 'zone' && (
          <div className="info-section">
            <h4>Zone Operations</h4>
            <div className="zone-info">
              <div className="zone-metric">
                <span className="label">Throughput:</span>
                <span className="value">{opData.throughput} items/hour</span>
              </div>
              <div className="zone-metric">
                <span className="label">Active Workers:</span>
                <span className="value">{opData.activeWorkers}</span>
              </div>
              <div className="zone-metric">
                <span className="label">Equipment:</span>
                <span className="value">{opData.equipment.join(', ')}</span>
              </div>
              <div className="zone-metric">
                <span className="label">Last Activity:</span>
                <span className="value">{new Date(opData.lastActivity).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Alerts */}
        {opData.alerts && opData.alerts.length > 0 && (
          <div className="info-section alerts">
            <h4>Alerts</h4>
            <div className="alert-list">
              {opData.alerts.map((alert, index) => (
                <div key={index} className="alert-item">
                  ⚠ {alert}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Temperature (if applicable) */}
        {opData.temperature && (
          <div className="info-section">
            <h4>Environmental</h4>
            <div className="env-info">
              <span className="label">Temperature:</span>
              <span className="value">{opData.temperature}</span>
            </div>
          </div>
        )}

        {/* Last Updated */}
        <div className="info-section">
          <div className="last-updated">
            Last updated: {new Date(opData.lastUpdated).toLocaleString()}
          </div>
        </div>
      </div>
    );
  };

  const getItemDisplayName = (item) => {
    if (item.name) return item.name;
    const typeNames = {
      'sku_holder': 'Horizontal Storage Rack',
      'vertical_sku_holder': 'Vertical Storage Rack',
      'storage_unit': 'Storage Unit',
      'storage_zone': 'Storage Zone',
      'receiving_zone': 'Receiving Zone',
      'dispatch_zone': 'Dispatch Zone',
      'office_zone': 'Office Zone',
      'square_boundary': 'Warehouse Boundary'
    };
    return typeNames[item.type] || item.type?.replace('_', ' ').toUpperCase() || 'Warehouse Item';
  };

  if (error) {
    return (
      <div className="fullscreen-error">
        <h1>Error Loading Map</h1>
        <p>{error}</p>
        <button onClick={() => window.close()}>Close Window</button>
      </div>
    );
  }

  if (!mapData) {
    return (
      <div className="fullscreen-map-container">
        <div className="error-message">
          <h2>Map Data Not Found</h2>
          <p>{error || 'No map data was provided.'}</p>
          <p>Please return to the dashboard and select a warehouse map to view.</p>
        </div>
      </div>
    );
  }

  const { unit, isCustomLayout, layoutData, demoData } = mapData;
  const isEmptyCustomLayout = isCustomLayout && layoutData && Array.isArray(layoutData.items) && layoutData.items.length === 0;

  return (
    <div className="fullscreen-map-container">
      <div className="fullscreen-map-header">
        <div className="fullscreen-map-title">
          <h1>{unit.name}</h1>
          <span className={`status-badge ${unit.status.toLowerCase()}`}>
            {unit.status}
          </span>
        </div>
        
        {/* Enhanced Dropdown Search Filters - Moved to Header */}
        <div className="fullscreen-search-inline">
          <div className="search-dropdown-filters">
            <div className="dropdown-filter">
              <label>📍 Location Tag:</label>
              <select 
                value={selectedLocationTag} 
                onChange={handleLocationTagChange}
                className="search-dropdown"
              >
                <option value="">All Locations</option>
                {availableLocationTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>
            
            <div className="dropdown-filter">
              <label>📦 SKU:</label>
              <select 
                value={selectedSku} 
                onChange={handleSkuChange}
                className="search-dropdown"
              >
                <option value="">All SKUs</option>
                {availableSkus.map(sku => (
                  <option key={sku} value={sku}>{sku}</option>
                ))}
              </select>
            </div>
            
            <div className="dropdown-filter">
              <label>🏭 Asset:</label>
              <select 
                value={selectedAsset} 
                onChange={handleAssetChange}
                className="search-dropdown"
              >
                <option value="">All Assets</option>
                {availableAssets.map(asset => (
                  <option key={asset} value={asset}>{asset}</option>
                ))}
              </select>
            </div>
            
            {/* Clear button only shows when filters are active */}
            {(selectedLocationTag || selectedSku || selectedAsset) && (
              <div className="dropdown-filter">
                <label>&nbsp;</label>
                <button className="search-clear-btn-dropdown" onClick={clearSearch}>
                  Clear All
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="fullscreen-map-controls">
          <button 
            className="fullscreen-control-btn"
            onClick={() => window.print()}
            title="Print Map"
          >
            🖨️
          </button>
          <button 
            className="fullscreen-control-btn"
            onClick={() => window.close()}
            title="Close Window"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Search Results - Moved outside header */}
      <div className="fullscreen-search-results">
        {searchResults.length > 0 && (
          <div className="search-results">
            <div className="search-results-header">
              <span>Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="search-results-list">
              {searchResults.slice(0, 5).map((result, index) => (
                <div key={index} className="search-result-item">
                  <div className="search-result-icon">
                    {result.type === 'location' ? '📍' : '📦'}
                  </div>
                  <div className="search-result-content">
                    <div className="search-result-title">{result.title}</div>
                    <div className="search-result-subtitle">{result.subtitle}</div>
                  </div>
                </div>
              ))}
              {searchResults.length > 5 && (
                <div className="search-result-more">
                  +{searchResults.length - 5} more results
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="fullscreen-map-content">
        <div
          className="demo-map-body demo-map-body-fullscreen"
          style={{ display: 'flex', flexDirection: 'row', gap: '20px', alignItems: 'stretch', flex: 1 }}
        >
          <div className="demo-map-canvas" style={{ flex: 1 }}>
            <div className="map-display-area">
              {isCustomLayout && layoutData && Array.isArray(layoutData.items) ? (
                <div className="fullscreen-custom-layout">
                  {layoutData.items.length === 0 ? (
                    <div className="empty-layout-message">
                      <h3>No components found in this layout</h3>
                      <p>The saved layout does not contain any items to display.</p>
                    </div>
                  ) : (
                    <SavedLayoutRenderer
                      items={layoutData.items}
                      metadata={{
                        name: layoutData.name || unit?.name,
                        timestamp: layoutData.timestamp
                      }}
                      width="100%"
                      height="100%"
                      background="transparent"
                      showLabels={false}
                      showMetadata={false}
                      highlightedKeys={highlightedItems}
                      filteredKeys={filteredKeys}
                      highlightedCompartmentsMap={highlightedCompartmentsMap}
                      padding={140}
                      allowUpscale
                      fitMode="cover"
                      stageBackground="transparent"
                      stageBorder="none"
                      stageShadow="none"
                      stageBorderRadius="0px"
                      onItemClick={handleItemClick}
                    />
                  )}
                </div>
              ) : demoData ? (
                <div className="fullscreen-demo-layout">
                  {renderDemoLayout(demoData)}
                </div>
              ) : (
                <div className="fullscreen-no-data">
                  <h2>No map data available</h2>
                  <p>This warehouse unit doesn't have map data configured.</p>
                </div>
              )}
            </div>
          </div>

          <div
            className="demo-map-sidebar fullscreen-sidebar"
            style={{ width: '300px', flexShrink: 0, overflowY: 'auto', height: '100%' }}
          >
            {sidebarContent}

            {showInfoPanel && selectedItem && (
              <LocationDetailsPanel
                selectedItem={selectedItem}
                unitId={
                  savedLayouts.find(l => l.id === selectedUnitForDemo)?.orgUnit?.id ??
                  savedLayouts.find(l => l.id === selectedUnitForDemo)?.unitId ??
                  selectedUnitForDemo
                }
                onClose={() => setShowInfoPanel(false)}
                isEmbedded={true}
              />
            )} 

            {/* Show Warehouse Overview Panel by default (no component selected) */}
            {!showInfoPanel && (
              <WarehouseOverviewPanel 
                layoutData={{
                  items: mapData?.layoutData?.items || [],
                  name: mapData?.name
                }} 
              />
            )}
          </div>
        </div>
      </div>

      {!isEmptyCustomLayout && (
        <div className="fullscreen-map-footer">
          <div className="map-info">
            <span>Created: {layoutData ? new Date(layoutData.timestamp).toLocaleDateString() : 'N/A'}</span>
            <span>Items: {unit.items || 0}</span>
            <span>Zones: {unit.zones || 0}</span>
            {unit.temperature && <span>Temperature: {unit.temperature}</span>}
          </div>
          {!mapData?.isCustomLayout && shouldShowDemoLegend && (
            <div className="demo-map-legend fullscreen-legend">
              <div className="legend-item">
                <div className="legend-color active"></div>
                <span>Active Equipment</span>
              </div>
              <div className="legend-item">
                <div className="legend-color offline"></div>
                <span>Offline Equipment</span>
              </div>
              <div className="legend-item">
                <div className="legend-color zone"></div>
                <span>Storage Zones</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Helper functions for item styling
const getItemBackgroundColor = (type, opData) => {
  const colors = {
    'square_boundary': 'rgba(38, 50, 56, 0.05)',
    'solid_boundary': 'rgba(96, 125, 139, 0.1)',
    'dotted_boundary': 'rgba(144, 164, 174, 0.1)',
    'sku_holder': 'transparent',
    'vertical_sku_holder': 'transparent',
    'storage_unit': '#4CAF50',
    'storage_zone': '#9C27B0',
    'receiving_zone': '#ffa726',
    'dispatch_zone': '#66bb6a',
    'office_zone': '#5c6bc0',
    'transit_zone': '#bdbdbd'
  };
  
  let baseColor = colors[type] || '#f5f5f5';
  
  // Modify color based on operational status
  if (opData && opData.status === 'maintenance') {
    baseColor = '#ffecb3'; // Light amber for maintenance
  } else if (opData && opData.availability === 'maintenance') {
    baseColor = '#ffcdd2'; // Light red for unavailable
  }
  
  return baseColor;
};

const getItemBorderColor = (type, opData) => {
  const colors = {
    'square_boundary': '#263238',
    'solid_boundary': '#607D8B',
    'dotted_boundary': '#90A4AE',
    'sku_holder': 'transparent',
    'vertical_sku_holder': 'transparent',
    'storage_unit': '#388E3C',
    'storage_zone': '#9C27B0',
    'receiving_zone': '#ff9800',
    'dispatch_zone': '#4caf50',
    'office_zone': '#3f51b5',
    'transit_zone': '#9e9e9e'
  };
  return colors[type] || '#ccc';
};

const getStatusColor = (status) => {
  const colors = {
    'operational': '#28a745',
    'maintenance': '#ffc107',
    'offline': '#dc3545',
    'active': '#28a745',
    'good': '#28a745',
    'needs_attention': '#ffc107'
  };
  return colors[status] || '#6c757d';
};

const getUtilizationColor = (utilization) => {
  if (utilization >= 90) return '#dc3545'; // Red for high utilization
  if (utilization >= 75) return '#ffc107'; // Yellow for medium-high
  if (utilization >= 50) return '#28a745'; // Green for good utilization
  return '#17a2b8'; // Blue for low utilization
};

const getItemLabel = (item) => {
  if (item.type === 'vertical_sku_holder') {
    const levelCount = inferVerticalRackLevelCount(item);
    if (levelCount) {
      return `${levelCount} Level${levelCount > 1 ? 's' : ''}`;
    }
  }

  if (item.name) return item.name;
  if (item.type === 'square_boundary') return 'Warehouse';
  if (item.type === 'storage_zone') return 'Storage';
  if (item.type === 'processing_area') return 'Processing';
  if (item.type === 'receiving_zone') return 'Receiving';
  if (item.type === 'dispatch_zone') return 'Dispatch';
  return item.type?.replace('_', ' ').toUpperCase() || 'Item';
};

export default FullscreenMap;

