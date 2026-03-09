// @ts-nocheck
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, Package, Archive, X, Loader2, PackageOpen } from 'lucide-react';
import { locationTagService } from '@/src/services/locationTags';
import type { LocationTag } from '@/src/services/locationTags';
import { skuService } from '@/src/services/skus';
import type { Sku } from '@/src/services/skus';
import { assetService } from '@/src/services/assets';
import type { Asset } from '@/src/services/assets';
import { useLocationSocket } from '@/hooks/useLocationSocket';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LevelLocationMapping {
  locationId?: string;
  locId?: string;
  levelId?: string;
  level?: string;
}

interface CompartmentContent {
  levelLocationMappings?: LevelLocationMapping[];
  locationIds?: string[];
  levelIds?: string[];
  [key: string]: unknown;
}

interface SelectedItem {
  name?: string;
  label?: string;
  type?: string;
  locationTagId?: string;  // real DB UUID  ← primary key we use
  locationId?: string;     // display label only (e.g. "RACK-A-004")
  // Multi-level support
  selectedCompartmentId?: string;
  selectedCompartmentRow?: number;
  selectedCompartmentCol?: number;
  selectedCompartment?: CompartmentContent;
  levelLocationMappings?: LevelLocationMapping[];
  locationIds?: string[];
  levelIds?: string[];
  compartmentContents?: Record<string, CompartmentContent>;
  // Multi-location support (storage units with multiple tags)
  locationData?: {
    isMultiLocation?: boolean;
    locationIds?: string[];
    primaryLocationId?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface LocationDetailsPanelProps {
  selectedItem: SelectedItem;
  unitId: string | null | undefined;  // pass selectedUnitForDemo from WarehouseMapView
  onClose: () => void;
  isEmbedded?: boolean;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

const fmt = (dateStr?: string | null) =>
  dateStr
    ? new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
    : 'N/A';

// ─── Component ────────────────────────────────────────────────────────────────

const LocationDetailsPanel: React.FC<LocationDetailsPanelProps> = ({
  selectedItem,
  unitId,
  onClose,
  isEmbedded = false,
}) => {
  // 🔍 DEBUG: Log selectedItem data to understand structure
  console.log('🔍 LocationDetailsPanel - selectedItem:', selectedItem);
  console.log('🔍 selectedItem keys:', Object.keys(selectedItem || {}));
  console.log('🔍 levelLocationMappings:', selectedItem?.levelLocationMappings);
  console.log('🔍 locationIds:', selectedItem?.locationIds);
  console.log('🔍 levelIds:', selectedItem?.levelIds);
  console.log('🔍 compartmentContents:', selectedItem?.compartmentContents);
  console.log('🔍 locationData (multi-location support):', selectedItem?.locationData);

  const locationTagId = selectedItem?.locationTagId ?? null;

  const [locationTag, setLocationTag] = useState<LocationTag | null>(null);
  const [skus, setSkus] = useState<Sku[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Multi-level state
  const [isMultiLevel, setIsMultiLevel] = useState(false);
  const [levelsData, setLevelsData] = useState<any[]>([]);

  // Multi-location state (for storage units with multiple tags)
  const [isMultiLocation, setIsMultiLocation] = useState(false);
  const [multiLocationData, setMultiLocationData] = useState<any[]>([]);

  // Live values pushed by WebSocket (override REST snapshot when received)
  const [liveCurrentItems, setLiveCurrentItems] = useState<number | null>(null);
  const [liveUtilizationPct, setLiveUtilizationPct] = useState<number | null>(null);

  // ── Multi-level and multi-location detection logic ───────────────────────────────────

  const detectMultiLevels = useCallback((item: SelectedItem) => {
    console.log('🔍 Detecting multi-level for item:', item);

    // Check for compartment-specific multi-level
    if (item.selectedCompartment?.levelLocationMappings && item.selectedCompartment.levelLocationMappings.length > 0) {
      console.log('✅ Found multi-level in selectedCompartment.levelLocationMappings');
      return {
        isMultiLevel: true,
        levels: item.selectedCompartment.levelLocationMappings
      };
    }

    // Check for compartment contents
    if (item.compartmentContents) {
      const compartments = Object.values(item.compartmentContents);
      const firstCompartment = compartments[0];
      if (firstCompartment?.levelLocationMappings && firstCompartment.levelLocationMappings.length > 0) {
        console.log('✅ Found multi-level in compartmentContents');
        return {
          isMultiLevel: true,
          levels: firstCompartment.levelLocationMappings
        };
      }
    }

    console.log('❌ No multi-level detected');
    return { isMultiLevel: false, levels: [] };
  }, []);

  // ── Multi-location detection logic ─────────────────────────────────────────--

  const detectMultiLocation = useCallback((item: SelectedItem) => {
    console.log('🔍 Detecting multi-location for item:', item);

    // Check for storage units with multiple location tags
    if (item.locationData?.isMultiLocation && item.locationData.locationIds && item.locationData.locationIds.length > 1) {
      console.log('✅ Found multi-location storage unit:', item.locationData.locationIds);
      return {
        isMultiLocation: true,
        locationIds: item.locationData.locationIds
      };
    }

    // Also check for direct locationIds array (fallback)
    if (item.locationIds && item.locationIds.length > 1) {
      console.log('✅ Found multi-location via locationIds:', item.locationIds);
      return {
        isMultiLocation: true,
        locationIds: item.locationIds
      };
    }

    console.log('❌ No multi-location detected');
    return { isMultiLocation: false, locationIds: [] };
  }, []);

  // ── Initial data fetch via REST ───────────────────────────────────────────

  useEffect(() => {
    if (!unitId) {
      setLocationTag(null);
      setSkus([]);
      setLevelsData([]);
      setMultiLocationData([]);
      setLiveCurrentItems(null);
      setLiveUtilizationPct(null);
      return;
    }

    let cancelled = false;
    const multiLevelInfo = detectMultiLevels(selectedItem);
    const multiLocationInfo = detectMultiLocation(selectedItem);
    console.log('🔍 Multi-level detection result:', multiLevelInfo);
    console.log('🔍 Multi-location detection result:', multiLocationInfo);

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setLiveCurrentItems(null);
      setLiveUtilizationPct(null);

      try {
        if (multiLevelInfo.isMultiLevel) {
          // Handle multi-level fetching (existing logic)
          console.log('🚀 Fetching multi-level data for levels:', multiLevelInfo.levels);

          const locationTagIds = multiLevelInfo.levels
            .map((level: LevelLocationMapping) => level.locationId || level.locId)
            .filter((id: string | undefined): id is string => Boolean(id));

          console.log('🔍 Multi-level location IDs found:', locationTagIds);

          if (locationTagIds.length === 0) {
            console.warn('⚠️ No valid location tag IDs found for multi-level item');
            setIsMultiLevel(false);
            setLevelsData([]);
            return;
          }

          // Fetch all location tags in parallel
          const allTags = await locationTagService.listByUnit(unitId);
          const matchedTags = allTags.filter(tag =>
            locationTagIds.includes(tag.locationTagName)
          );

          console.log('🔍 Matched tags:', matchedTags.map(t => ({ id: t.id, name: t.locationTagName })));

          // Fetch SKUs and Assets for all levels using matched UUIDs
          const fetchPromises = multiLevelInfo.levels.map(async (level: LevelLocationMapping, idx: number) => {
            const locationCode = level.locationId || level.locId || '';
            const matchedTag = matchedTags.find(tag => tag.locationTagName === locationCode);

            if (!matchedTag) {
              console.log(`⚠️ No matching tag found for location code: ${locationCode}`);
              return { skus: [], assets: [], levelIndex: idx };
            }

            try {
              const [skuResult, assetResult] = await Promise.all([
                skuService.list({ locationTagId: matchedTag.id, limit: 100 }),
                assetService.list({ locationTagId: matchedTag.id, limit: 100 })
              ]);
              console.log('✅ Successfully fetched SKUs and Assets for location:', matchedTag.id);
              return { skus: skuResult.items, assets: assetResult.items, levelIndex: idx };
            } catch (err) {
              console.error(`❌ Failed to fetch data for location ${matchedTag.id}:`, err);
              return { skus: [], assets: [], levelIndex: idx };
            }
          });

          const fetchResponses = await Promise.allSettled(fetchPromises);
          const validResponses = fetchResponses.map((result) => {
            if (result.status === 'fulfilled') {
              return result.value;
            } else {
              console.error(`❌ Data fetch failed:`, result.reason);
              return { skus: [], assets: [], levelIndex: 0 };
            }
          });

          const newLevelsData = multiLevelInfo.levels.map((level: LevelLocationMapping, idx: number) => {
            const locationCode = level.locationId || level.locId || '';
            const matchedTag = matchedTags.find(tag => tag.locationTagName === locationCode);
            const responseData = validResponses.find(resp => resp.levelIndex === idx);

            if (!matchedTag) {
              console.warn(`⚠️ No matching tag found for level ${idx} with code: ${locationCode}`);
            }

            return {
              locationTag: matchedTag || null,
              skus: responseData?.skus || [],
              assets: responseData?.assets || [],
              levelInfo: {
                levelId: level.levelId || level.level || `L${idx + 1}`,
                locationId: locationCode,
                levelIndex: idx
              },
              isActive: selectedItem.selectedCompartmentId ?
                (locationCode === selectedItem.selectedCompartmentId) : false
            };
          });

          console.log('✅ Multi-level data assembled:', newLevelsData.map(d => ({
            level: d.levelInfo.levelId,
            locationId: d.levelInfo.locationId,
            hasTag: !!d.locationTag,
            tagId: d.locationTag?.id || 'none',
            skuCount: d.skus.length,
            assetCount: d.assets.length
          })));

          setLevelsData(newLevelsData);
          setIsMultiLevel(true);
          setLocationTag(null); // Clear single-level data
          setSkus([]);
          setIsMultiLocation(false);
          setMultiLocationData([]);
        } else if (multiLocationInfo.isMultiLocation) {
          // Handle multi-location fetching (storage units with multiple tags)
          console.log('🚀 Fetching multi-location data for location IDs:', multiLocationInfo.locationIds);

          const locationTagCodes = multiLocationInfo.locationIds;
          console.log('🔍 Multi-location location codes found:', locationTagCodes);

          if (locationTagCodes.length === 0) {
            console.warn('⚠️ No valid location tag codes found for multi-location item');
            setIsMultiLocation(false);
            setMultiLocationData([]);
            return;
          }

          // Fetch all location tags in parallel
          const allTags = await locationTagService.listByUnit(unitId);
          const matchedTags = allTags.filter(tag =>
            locationTagCodes.includes(tag.locationTagName)
          );

          console.log('🔍 Matched tags for multi-location:', matchedTags.map(t => ({ id: t.id, name: t.locationTagName })));

          // Fetch SKUs and Assets for all location tags using matched UUIDs
          const fetchPromises = locationTagCodes.map(async (locationCode: string, idx: number) => {
            const matchedTag = matchedTags.find(tag => tag.locationTagName === locationCode);

            if (!matchedTag) {
              console.log(`⚠️ No matching tag found for location code: ${locationCode}`);
              return { skus: [], assets: [], locationIndex: idx };
            }

            try {
              const [skuResult, assetResult] = await Promise.all([
                skuService.list({ locationTagId: matchedTag.id, limit: 100 }),
                assetService.list({ locationTagId: matchedTag.id, limit: 100 })
              ]);
              console.log('✅ Successfully fetched data for location:', matchedTag.id);
              return { skus: skuResult.items, assets: assetResult.items, locationIndex: idx };
            } catch (err) {
              console.error(`❌ Failed to fetch data for location ${matchedTag.id}:`, err);
              return { skus: [], assets: [], locationIndex: idx };
            }
          });

          const fetchResponses = await Promise.allSettled(fetchPromises);
          const validResponses = fetchResponses.map((result) => {
            if (result.status === 'fulfilled') {
              return result.value;
            } else {
              console.error(`❌ Data fetch failed:`, result.reason);
              return { skus: [], assets: [], locationIndex: 0 };
            }
          });

          // Set multi-location data
          const newMultiLocationData = locationTagCodes.map((locationCode: string, idx: number) => {
            const matchedTag = matchedTags.find(tag => tag.locationTagName === locationCode);
            const responseData = validResponses.find(resp => resp.locationIndex === idx);

            if (!matchedTag) {
              console.warn(`⚠️ No matching tag found for location ${idx} with code: ${locationCode}`);
            }

            return {
              locationTag: matchedTag || null,
              skus: responseData?.skus || [],
              assets: responseData?.assets || [],
              locationInfo: {
                locationCode: locationCode,
                locationIndex: idx,
                isPrimary: locationCode === selectedItem?.locationData?.primaryLocationId
              }
            };
          });

          console.log('✅ Multi-location data assembled:', newMultiLocationData.map(d => ({
            locationCode: d.locationInfo.locationCode,
            hasTag: !!d.locationTag,
            tagId: d.locationTag?.id || 'none',
            skuCount: d.skus.length,
            assetCount: d.assets.length,
            isPrimary: d.locationInfo.isPrimary
          })));

          setMultiLocationData(newMultiLocationData);
          setIsMultiLocation(true);
          setLocationTag(null); // Clear single-level data
          setSkus([]);
          setIsMultiLevel(false);
          setLevelsData([]);
        } else {
          // Handle single-level (existing logic)
          if (!locationTagId) {
            setLocationTag(null);
            setSkus([]);
            return;
          }

          const [allTags, skuResponse, assetResponse] = await Promise.all([
            locationTagService.listByUnit(unitId),
            skuService.list({ locationTagId, limit: 100 }),
            assetService.list({ locationTagId, limit: 100 }),
          ]);

          if (cancelled) return;

          const tag = allTags.find((t) => t.id === locationTagId) ?? null;
          setLocationTag(tag);
          setSkus(skuResponse.items);
          setAssets(assetResponse.items);
          setIsMultiLevel(false);
          setLevelsData([]);
          setIsMultiLocation(false);
          setMultiLocationData([]);
        }

        if (!multiLevelInfo.isMultiLevel && !multiLocationInfo.isMultiLocation && !selectedItem?.locationTagId) {
          console.warn('LocationDetailsPanel: tag not found');
        }
      } catch (err) {
        console.error('Data fetch error:', err);
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [selectedItem, unitId, detectMultiLevels, detectMultiLocation, locationTagId]);

  // ── WebSocket: live updates ───────────────────────────────────────────────

  const refreshSkus = useCallback(async () => {
    if (!locationTagId) return;
    try {
      const skuResponse = await skuService.list({ locationTagId, limit: 100 });
      setSkus(skuResponse.items);
    } catch (err) {
      console.error('Failed to refresh SKUs:', err);
    }
  }, [locationTagId]);

  const handleLocationUpdated = useCallback((data) => {
    console.log('🔄 location:updated', data);
    setLiveCurrentItems(data.current_items);
    setLiveUtilizationPct(data.utilization_percentage);
    refreshSkus(); // re-fetch SKU list so quantities update too
  }, [refreshSkus]);

  const handleInventoryChanged = useCallback((data) => {
    console.log('🔄 inventory:changed', data);
    setLiveCurrentItems(data.current_items);
    setLiveUtilizationPct(data.utilization_percentage);
    refreshSkus(); // re-fetch SKU list so quantities update too
  }, [refreshSkus]);

  useLocationSocket({
    unitId,
    locationTagId,
    onLocationUpdated: handleLocationUpdated,
    onInventoryChanged: handleInventoryChanged,
  });

  // ── Derived display values (socket overrides REST snapshot) ───────────────

  const displayCurrentItems = liveCurrentItems ?? locationTag?.currentItems ?? 0;
  const displayUtilizationPct = liveUtilizationPct ?? locationTag?.utilizationPercentage ?? 0;
  const isLive = liveCurrentItems !== null;

  // ── Styles ────────────────────────────────────────────────────────────────

  const panelStyle: React.CSSProperties = isEmbedded
    ? {
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      backgroundColor: 'hsl(218.4 36.23% 13.53%)', borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      background: 'linear-gradient(135deg, hsl(218.4 36.23% 13.53%), hsl(217.5 54.33% 5.85%))',
    }
    : {
      position: 'fixed', top: '80px', right: '20px', width: '380px', maxHeight: '85vh',
      backgroundColor: 'hsl(218.4 36.23% 13.53%)', border: '1px solid hsl(215.3 25.1% 26.1%)',
      borderRadius: 'var(--radius-2xl)',
      boxShadow: '0 10px 40px -10px rgba(0,0,0,.15), 0 20px 25px -5px rgba(0,0,0,.1)',
      zIndex: 1000, overflow: 'hidden', backdropFilter: 'blur(20px)',
      background: 'linear-gradient(135deg, hsl(218.4 36.23% 13.53%), hsl(217.5 54.33% 5.85%))',
    };

  const headerStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, hsl(222.2 47% 11%) 0%, hsl(222.2 32.6% 18.55%) 100%)',
    color: 'white', padding: 'var(--spacing-5)',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    position: 'relative', overflow: 'hidden', flexShrink: 0,
  };

  const contentStyle: React.CSSProperties = isEmbedded
    ? { padding: '1rem', overflow: 'auto', flex: 1, minHeight: 0 }
    : { padding: '1rem', maxHeight: 'calc(80vh - 80px)', overflow: 'auto' };

  const sectionStyle: React.CSSProperties = {
    marginBottom: '1.25rem', padding: '0.75rem',
    background: 'linear-gradient(135deg, hsl(215.3 25.1% 26.1%), hsl(215.3 25.1% 18.55%))',
    borderRadius: 'var(--radius-lg)', border: '1px solid hsl(215.3 25.1% 32.6%)',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500,
    marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.5px',
  };

  const valueStyle: React.CSSProperties = {
    fontSize: '0.95rem', color: '#e2e8f0', fontWeight: 600, marginBottom: '0.5rem',
  };

  const displayName =
    selectedItem?.name || selectedItem?.label || selectedItem?.locationId || selectedItem?.type || 'Component';

  // ── Render ────────────────────────────────────────────────────────────────

  if (!selectedItem) return null;

  return (
    <div style={panelStyle} className="animate-slide-up">

      {/* ── Header ── */}
      <div style={headerStyle}>
        <div>
          <div style={{ fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin size={20} />
            Location Details
            {isLive && (
              <span style={{
                fontSize: '0.65rem', background: '#22c55e', color: 'white',
                padding: '2px 6px', borderRadius: '999px', fontWeight: 600, marginLeft: 4,
              }}>
                LIVE
              </span>
            )}
            {isMultiLevel && (
              <span style={{
                fontSize: '0.65rem', background: '#667eea', color: 'white',
                padding: '2px 6px', borderRadius: '999px', fontWeight: 600, marginLeft: 4,
              }}>
                {levelsData.length} LEVELS
              </span>
            )}
            {isMultiLocation && (
              <span style={{
                fontSize: '0.65rem', background: '#f59e0b', color: 'white',
                padding: '2px 6px', borderRadius: '999px', fontWeight: 600, marginLeft: 4,
              }}>
                {multiLocationData.length} LOCATIONS
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>{displayName}</div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%',
            width: 28, height: 28, color: 'white', cursor: 'pointer', fontSize: 16,
            transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.3)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
        >
          <X size={16} />
        </button>
      </div>

      {/* ── Body ── */}
      <div style={contentStyle}>

        {/* Compartment Info Banner - shown when a specific compartment is clicked */}
        {selectedItem?.selectedCompartmentId && (
          <div style={{
            ...sectionStyle,
            background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
            borderColor: '#60a5fa',
            marginBottom: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Package size={16} style={{ color: '#60a5fa' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0' }}>
                Compartment Selected
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem' }}>
              <div>
                <div style={{ ...labelStyle, marginBottom: '0.15rem' }}>Rack</div>
                <div style={{ color: '#e2e8f0', fontWeight: 500 }}>
                  {selectedItem.type?.replace(/_/g, ' ').toUpperCase() || 'Storage Rack'}
                </div>
              </div>
              <div>
                <div style={{ ...labelStyle, marginBottom: '0.15rem' }}>Position</div>
                <div style={{ color: '#e2e8f0', fontWeight: 500 }}>
                  Row {(selectedItem.selectedCompartmentRow || 0) + 1}, Col {(selectedItem.selectedCompartmentCol || 0) + 1}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No Data Available */}
        {selectedItem?.selectedCompartmentId && !locationTagId && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
            <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
              <PackageOpen size={32} />
            </div>
            <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>No Data Available</div>
            <div style={{ fontSize: '0.85rem' }}>This compartment does not have a location tag assigned.</div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
            <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
              <Loader2 size={32} className="animate-spin" />
            </div>
            <div>Loading location data...</div>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#f87171' }}>
            <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Failed to load data</div>
            <div style={{ fontSize: '0.85rem' }}>{error}</div>
          </div>
        )}

        {/* No locationTagId on the component (but NOT a compartment - compartments have their own message above) */}
        {!loading && !error && !locationTagId && !selectedItem?.selectedCompartmentId && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
            <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
              <PackageOpen size={32} />
            </div>
            <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>No Location Tag Assigned</div>
            <div style={{ fontSize: '0.85rem' }}>This component has no location tag linked to it.</div>
          </div>
        )}

        {/* locationTagId present but not found in unit's tags */}
        {!loading && !error && locationTagId && !locationTag && !isMultiLevel && !isMultiLocation && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
            <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
              <PackageOpen size={32} />
            </div>
            <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Tag Not Found</div>
            <div style={{ fontSize: '0.85rem', wordBreak: 'break-all' }}>ID: {locationTagId}</div>
          </div>
        )}

        {/* ── Real data ── */}
        {!loading && !error && (
          <>
            {isMultiLevel ? (
              // Multi-level display
              levelsData.map((levelData, index) => (
                <div key={levelData.levelInfo.locationId} style={{ marginBottom: '2rem' }}>
                  {/* Level Header */}
                  <div style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <Package size={18} />
                    {levelData.levelInfo.levelId}: {levelData.locationTag?.locationTagName || 'Unknown Location'}
                  </div>

                  {levelData.locationTag ? (
                    <>
                      {/* Location Tag Info for this level */}
                      <div style={sectionStyle}>
                        <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: '#60a5fa' }}>
                          📍 {levelData.levelInfo.levelId} Location Details
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                          <div style={{ gridColumn: '1 / -1' }}>
                            <div style={labelStyle}>Location Tag Name</div>
                            <div style={{ ...valueStyle, fontSize: '1rem', color: '#60a5fa' }}>
                              {levelData.locationTag.locationTagName}
                            </div>
                          </div>
                          <div>
                            <div style={labelStyle}>Capacity</div>
                            <div style={valueStyle}>{levelData.locationTag.capacity} {levelData.locationTag.unitOfMeasurement || 'units'}</div>
                          </div>
                          {levelData.locationTag.length && (
                            <div style={{ gridColumn: '1 / -1' }}>
                              <div style={labelStyle}>Dimensions (L × B × H)</div>
                              <div style={valueStyle}>
                                {levelData.locationTag.length} × {levelData.locationTag.breadth} × {levelData.locationTag.height} {levelData.locationTag.unitOfMeasurement}
                              </div>
                            </div>
                          )}
                          <div style={{ gridColumn: '1 / -1' }}>
                            <div style={labelStyle}>Created At</div>
                            <div style={valueStyle}>{fmt(levelData.locationTag.createdAt)}</div>
                          </div>
                        </div>
                      </div>

                      {/* SKU Info for this level */}
                      <div style={sectionStyle}>
                        <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: '#60a5fa' }}>
                          📦 {levelData.levelInfo.levelId} SKU Information
                          <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400 }}>
                            {levelData.skus.length} SKU{levelData.skus.length !== 1 ? 's' : ''}
                          </span>
                        </h4>
                        {levelData.skus.length === 0 ? (
                          <div style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', padding: '0.5rem 0' }}>
                            No SKUs assigned to {levelData.levelInfo.levelId}
                          </div>
                        ) : (
                          levelData.skus.map((sku) => (
                            <div key={sku.id} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid hsl(215.3 25.1% 32.6%)' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div style={{ gridColumn: '1 / -1' }}>
                                  <div style={labelStyle}>SKU Name</div>
                                  <div style={{ ...valueStyle, fontSize: '1rem', color: '#60a5fa' }}>{sku.skuName}</div>
                                </div>
                                <div>
                                  <div style={labelStyle}>Quantity</div>
                                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: sku.quantity > 0 ? '#22c55e' : '#ef4444' }}>
                                    {sku.quantity} {sku.skuUnit}
                                  </div>
                                </div>
                                <div>
                                  <div style={labelStyle}>Category</div>
                                  <div style={valueStyle}>{sku.skuCategory}</div>
                                </div>
                                <div>
                                  <div style={labelStyle}>Effective Date</div>
                                  <div style={valueStyle}>{fmt(sku.effectiveDate)}</div>
                                </div>
                                <div>
                                  <div style={labelStyle}>Expiry Date</div>
                                  <div style={valueStyle}>{fmt(sku.expiryDate)}</div>
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                  <div style={labelStyle}>Created At</div>
                                  <div style={valueStyle}>{fmt(sku.createdAt)}</div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Asset Info for this level */}
                      <div style={sectionStyle}>
                        <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: '#60a5fa' }}>
                          <Package size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} />
                          {levelData.levelInfo.levelId} Asset Information
                          <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400 }}>
                            {levelData.assets.length} Asset{levelData.assets.length !== 1 ? 's' : ''}
                          </span>
                        </h4>
                        {levelData.assets.length === 0 ? (
                          <div style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', padding: '0.5rem 0' }}>
                            No Asset data linked to {levelData.levelInfo.levelId}
                          </div>
                        ) : (
                          levelData.assets.map((asset) => (
                            <div key={asset.id} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid hsl(215.3 25.1% 32.6%)' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div style={{ gridColumn: '1 / -1' }}>
                                  <div style={labelStyle}>Asset Name</div>
                                  <div style={{ ...valueStyle, fontSize: '1rem', color: '#60a5fa' }}>{asset.assetName}</div>
                                </div>
                                <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                  <div>
                                    <div style={labelStyle}>Asset Type</div>
                                    <div style={valueStyle}>{asset.assetType || 'N/A'}</div>
                                  </div>
                                  <div>
                                    <div style={labelStyle}>Status</div>
                                    <div style={valueStyle}>{asset.status || 'Active'}</div>
                                  </div>
                                  <div>
                                    <div style={labelStyle}>Asset ID</div>
                                    <div style={{ ...valueStyle, fontSize: '0.85rem' }}>{asset.id}</div>
                                  </div>
                                  <div>
                                    <div style={labelStyle}>Created</div>
                                    <div style={valueStyle}>{fmt(asset.createdAt)}</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                      <PackageOpen size={32} />
                      <div style={{ fontWeight: 600, marginBottom: '0.5rem', marginTop: '1rem' }}>
                        {levelData.levelInfo.levelId} - No Location Tag Found
                      </div>
                      <div style={{ fontSize: '0.85rem' }}>
                        Location ID: {levelData.levelInfo.locationId}
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : isMultiLocation ? (
              // Multi-location display (storage units with multiple tags)
              multiLocationData.map((locationData, index) => (
                <div key={locationData.locationInfo.locationCode} style={{ marginBottom: '2rem' }}>
                  {/* Location Header */}
                  <div style={{
                    background: locationData.locationInfo.isPrimary
                      ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                      : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    color: 'white',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <MapPin size={18} />
                    {locationData.locationInfo.locationCode}: {locationData.locationTag?.locationTagName || 'Unknown Location'}
                    {locationData.locationInfo.isPrimary && (
                      <span style={{
                        fontSize: '0.65rem', background: 'rgba(255,255,255,0.3)', color: 'white',
                        padding: '2px 6px', borderRadius: '999px', fontWeight: 600, marginLeft: 'auto',
                      }}>
                        PRIMARY
                      </span>
                    )}
                  </div>

                  {locationData.locationTag ? (
                    <>
                      {/* Location Tag Info for this location */}
                      <div style={sectionStyle}>
                        <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: '#60a5fa' }}>
                          📍 {locationData.locationInfo.locationCode} Location Details
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                          <div style={{ gridColumn: '1 / -1' }}>
                            <div style={labelStyle}>Location Tag Name</div>
                            <div style={{ ...valueStyle, fontSize: '1rem', color: '#60a5fa' }}>
                              {locationData.locationTag.locationTagName}
                            </div>
                          </div>
                          <div>
                            <div style={labelStyle}>Capacity</div>
                            <div style={valueStyle}>{locationData.locationTag.capacity} {locationData.locationTag.unitOfMeasurement || 'units'}</div>
                          </div>
                          {locationData.locationTag.length && (
                            <div style={{ gridColumn: '1 / -1' }}>
                              <div style={labelStyle}>Dimensions (L × B × H)</div>
                              <div style={valueStyle}>
                                {locationData.locationTag.length} × {locationData.locationTag.breadth} × {locationData.locationTag.height} {locationData.locationTag.unitOfMeasurement}
                              </div>
                            </div>
                          )}
                          <div style={{ gridColumn: '1 / -1' }}>
                            <div style={labelStyle}>Created At</div>
                            <div style={valueStyle}>{fmt(locationData.locationTag.createdAt)}</div>
                          </div>
                        </div>
                      </div>

                      {/* SKU Info for this location */}
                      <div style={sectionStyle}>
                        <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: '#60a5fa' }}>
                          📦 {locationData.locationInfo.locationCode} SKU Information
                          <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400 }}>
                            {locationData.skus.length} SKU{locationData.skus.length !== 1 ? 's' : ''}
                          </span>
                        </h4>
                        {locationData.skus.length === 0 ? (
                          <div style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', padding: '0.5rem 0' }}>
                            No SKUs assigned to {locationData.locationInfo.locationCode}
                          </div>
                        ) : (
                          locationData.skus.map((sku) => (
                            <div key={sku.id} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid hsl(215.3 25.1% 32.6%)' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div style={{ gridColumn: '1 / -1' }}>
                                  <div style={labelStyle}>SKU Name</div>
                                  <div style={{ ...valueStyle, fontSize: '1rem', color: '#60a5fa' }}>{sku.skuName}</div>
                                </div>
                                <div>
                                  <div style={labelStyle}>Quantity</div>
                                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: sku.quantity > 0 ? '#22c55e' : '#ef4444' }}>
                                    {sku.quantity} {sku.skuUnit}
                                  </div>
                                </div>
                                <div>
                                  <div style={labelStyle}>Category</div>
                                  <div style={valueStyle}>{sku.skuCategory}</div>
                                </div>
                                <div>
                                  <div style={labelStyle}>Effective Date</div>
                                  <div style={valueStyle}>{fmt(sku.effectiveDate)}</div>
                                </div>
                                <div>
                                  <div style={labelStyle}>Expiry Date</div>
                                  <div style={valueStyle}>{fmt(sku.expiryDate)}</div>
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                  <div style={labelStyle}>Created At</div>
                                  <div style={valueStyle}>{fmt(sku.createdAt)}</div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Asset Info for this location */}
                      <div style={sectionStyle}>
                        <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: '#60a5fa' }}>
                          <Package size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} />
                          {locationData.locationInfo.locationCode} Asset Information
                          <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400 }}>
                            {locationData.assets.length} Asset{locationData.assets.length !== 1 ? 's' : ''}
                          </span>
                        </h4>
                        {locationData.assets.length === 0 ? (
                          <div style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', padding: '0.5rem 0' }}>
                            No Asset data linked to {locationData.locationInfo.locationCode}
                          </div>
                        ) : (
                          locationData.assets.map((asset) => (
                            <div key={asset.id} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid hsl(215.3 25.1% 32.6%)' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div style={{ gridColumn: '1 / -1' }}>
                                  <div style={labelStyle}>Asset Name</div>
                                  <div style={{ ...valueStyle, fontSize: '1rem', color: '#60a5fa' }}>{asset.assetName}</div>
                                </div>
                                <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                  <div>
                                    <div style={labelStyle}>Asset Type</div>
                                    <div style={valueStyle}>{asset.assetType || 'N/A'}</div>
                                  </div>
                                  <div>
                                    <div style={labelStyle}>Status</div>
                                    <div style={valueStyle}>{asset.status || 'Active'}</div>
                                  </div>
                                  <div>
                                    <div style={labelStyle}>Asset ID</div>
                                    <div style={{ ...valueStyle, fontSize: '0.85rem' }}>{asset.id}</div>
                                  </div>
                                  <div>
                                    <div style={labelStyle}>Created</div>
                                    <div style={valueStyle}>{fmt(asset.createdAt)}</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                      <PackageOpen size={32} />
                      <div style={{ fontWeight: 600, marginBottom: '0.5rem', marginTop: '1rem' }}>
                        {locationData.locationInfo.locationCode} - No Location Tag Found
                      </div>
                      <div style={{ fontSize: '0.85rem' }}>
                        Location Code: {locationData.locationInfo.locationCode}
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              // Single-level display (existing logic)
              locationTag && (
                <>
                  {/* Location Tag Section */}
                  <div style={sectionStyle}>
                    <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <MapPin size={16} /> Location Tag Information
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>

                      <div style={{ gridColumn: '1 / -1' }}>
                        <div style={labelStyle}>Location Tag Name</div>
                        <div style={{ ...valueStyle, fontSize: '1rem', color: '#60a5fa' }}>{locationTag.locationTagName}</div>
                      </div>

                      <div>
                        <div style={labelStyle}>Capacity</div>
                        <div style={valueStyle}>{locationTag.capacity} {locationTag.unitOfMeasurement || 'units'}</div>
                      </div>

                      {locationTag.length && (
                        <div style={{ gridColumn: '1 / -1' }}>
                          <div style={labelStyle}>Dimensions (L × B × H)</div>
                          <div style={valueStyle}>
                            {locationTag.length} × {locationTag.breadth} × {locationTag.height} {locationTag.unitOfMeasurement}
                          </div>
                        </div>
                      )}

                      <div style={{ gridColumn: '1 / -1' }}>
                        <div style={labelStyle}>Created At</div>
                        <div style={valueStyle}>{fmt(locationTag.createdAt)}</div>
                      </div>

                    </div>
                  </div>

                  {/* SKU Section */}
                  <div style={sectionStyle}>
                    <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Package size={16} /> SKU Information
                      <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400 }}>
                        {skus.length} SKU{skus.length !== 1 ? 's' : ''}
                      </span>
                    </h4>

                    {skus.length === 0 ? (
                      <div style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', padding: '0.5rem 0' }}>
                        No SKUs assigned to this location
                      </div>
                    ) : (
                      skus.map((sku, idx) => (
                        <div
                          key={sku.id}
                          style={{
                            marginBottom: idx < skus.length - 1 ? '1rem' : 0,
                            paddingBottom: idx < skus.length - 1 ? '1rem' : 0,
                            borderBottom: idx < skus.length - 1 ? '1px solid hsl(215.3 25.1% 32.6%)' : 'none',
                          }}
                        >
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div style={{ gridColumn: '1 / -1' }}>
                              <div style={labelStyle}>SKU Name</div>
                              <div style={{ ...valueStyle, fontSize: '1rem', color: '#60a5fa' }}>{sku.skuName}</div>
                            </div>
                            <div>
                              <div style={labelStyle}>Category</div>
                              <div style={valueStyle}>{sku.skuCategory}</div>
                            </div>
                            <div>
                              <div style={labelStyle}>Quantity</div>
                              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: sku.quantity > 0 ? '#22c55e' : '#ef4444' }}>
                                {sku.quantity} {sku.skuUnit}
                              </div>
                            </div>
                            <div>
                              <div style={labelStyle}>Effective Date</div>
                              <div style={valueStyle}>{fmt(sku.effectiveDate)}</div>
                            </div>
                            <div>
                              <div style={labelStyle}>Expiry Date</div>
                              <div style={valueStyle}>{fmt(sku.expiryDate)}</div>
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                              <div style={labelStyle}>Created At</div>
                              <div style={valueStyle}>{fmt(sku.createdAt)}</div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Asset Section */}
                  <div style={sectionStyle}>
                    <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Archive size={16} /> Asset Information
                      <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400 }}>
                        {assets.length} Asset{assets.length !== 1 ? 's' : ''}
                      </span>
                    </h4>

                    {assets.length === 0 ? (
                      <div style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', padding: '0.5rem 0' }}>
                        Asset data not linked to this location tag
                      </div>
                    ) : (
                      assets.map((asset, idx) => (
                        <div
                          key={asset.id}
                          style={{
                            marginBottom: idx < assets.length - 1 ? '1rem' : 0,
                            paddingBottom: idx < assets.length - 1 ? '1rem' : 0,
                            borderBottom: idx < assets.length - 1 ? '1px solid hsl(215.3 25.1% 32.6%)' : 'none',
                          }}
                        >
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div style={{ gridColumn: '1 / -1' }}>
                              <div style={labelStyle}>Asset Name</div>
                              <div style={{ ...valueStyle, fontSize: '1rem', color: '#60a5fa' }}>{asset.assetName}</div>
                            </div>
                            <div>
                              <div style={labelStyle}>Type</div>
                              <div style={valueStyle}>{asset.assetType}</div>
                            </div>
                            <div>
                              <div style={labelStyle}>Asset ID</div>
                              <div style={valueStyle}>{asset.assetId || 'N/A'}</div>
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                              <div style={labelStyle}>Created At</div>
                              <div style={valueStyle}>{fmt(asset.createdAt)}</div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default LocationDetailsPanel;
