// @ts-nocheck
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, Package, Archive, X, Loader2, PackageOpen } from 'lucide-react';
import { locationTagService } from '@/src/services/locationTags';
import type { LocationTag } from '@/src/services/locationTags';
import { skuService } from '@/src/services/skus';
import type { Sku } from '@/src/services/skus';
import { assetService } from '@/src/services/assets'; // ✅ Added
import type { Asset } from '@/src/services/assets';   // ✅ Added
import { useLocationSocket } from '@/hooks/useLocationSocket';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SelectedItem {
  name?: string;
  label?: string;
  type?: string;
  locationTagId?: string;
  locationId?: string;
  [key: string]: unknown;
}

interface LocationDetailsPanelProps {
  selectedItem: SelectedItem;
  unitId: string | null | undefined;
  onClose: () => void;
  isEmbedded?: boolean;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

const fmt = (dateStr?: string | null) =>
  dateStr
    ? new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
      })
    : 'N/A';

// ─── Component ────────────────────────────────────────────────────────────────

const LocationDetailsPanel: React.FC<LocationDetailsPanelProps> = ({
  selectedItem,
  unitId,
  onClose,
  isEmbedded = false,
}) => {
  const locationTagId = selectedItem?.locationTagId ?? null;

  const [locationTag, setLocationTag] = useState<LocationTag | null>(null);
  const [skus, setSkus]               = useState<Sku[]>([]);
  const [assets, setAssets]           = useState<Asset[]>([]); // ✅ Added
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const [liveCurrentItems, setLiveCurrentItems]     = useState<number | null>(null);
  const [liveUtilizationPct, setLiveUtilizationPct] = useState<number | null>(null);

  // ── Initial data fetch via REST ───────────────────────────────────────────

  useEffect(() => {
    if (!locationTagId || !unitId) {
      setLocationTag(null);
      setSkus([]);
      setAssets([]);           // ✅ Reset assets too
      setLiveCurrentItems(null);
      setLiveUtilizationPct(null);
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setLiveCurrentItems(null);
      setLiveUtilizationPct(null);

      try {
        // ✅ Fetch location tags, SKUs, and assets in parallel
        const [allTags, skuResponse, assetResponse] = await Promise.all([
          locationTagService.listByUnit(unitId),
          skuService.list({ locationTagId, limit: 100 }),
          assetService.list({ locationTagId, limit: 100 }), // ✅ Added
        ]);

        if (cancelled) return;

        const tag = allTags.find((t) => t.id === locationTagId) ?? null;
        setLocationTag(tag);
        setSkus(skuResponse.items);
        setAssets(assetResponse.items); // ✅ Added

        if (!tag) {
          console.warn('LocationDetailsPanel: tag not found for id:', locationTagId);
        }
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [locationTagId, unitId]);

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
    setLiveCurrentItems(data.current_items);
    setLiveUtilizationPct(data.utilization_percentage);
    refreshSkus();
  }, [refreshSkus]);

  const handleInventoryChanged = useCallback((data) => {
    setLiveCurrentItems(data.current_items);
    setLiveUtilizationPct(data.utilization_percentage);
    refreshSkus();
  }, [refreshSkus]);

  useLocationSocket({
    unitId,
    locationTagId,
    onLocationUpdated: handleLocationUpdated,
    onInventoryChanged: handleInventoryChanged,
  });

  // ── Derived display values ────────────────────────────────────────────────

  const displayCurrentItems   = liveCurrentItems   ?? locationTag?.currentItems          ?? 0;
  const displayUtilizationPct = liveUtilizationPct ?? locationTag?.utilizationPercentage ?? 0;
  const isLive                = liveCurrentItems !== null;

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
              }}>LIVE</span>
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

        {/* Compartment Info Banner */}
        {selectedItem?.selectedCompartmentId && (
          <div style={{
            ...sectionStyle,
            background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
            borderColor: '#60a5fa', marginBottom: '1rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Package size={16} style={{ color: '#60a5fa' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0' }}>Compartment Selected</span>
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
            <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}><PackageOpen size={32} /></div>
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

        {/* No locationTagId */}
        {!loading && !error && !locationTagId && !selectedItem?.selectedCompartmentId && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
            <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}><PackageOpen size={32} /></div>
            <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>No Location Tag Assigned</div>
            <div style={{ fontSize: '0.85rem' }}>This component has no location tag linked to it.</div>
          </div>
        )}

        {/* Tag not found */}
        {!loading && !error && locationTagId && !locationTag && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
            <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}><PackageOpen size={32} /></div>
            <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Tag Not Found</div>
            <div style={{ fontSize: '0.85rem', wordBreak: 'break-all' }}>ID: {locationTagId}</div>
          </div>
        )}

        {/* ── Real data ── */}
        {!loading && !error && locationTag && (
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
                  <div style={valueStyle}>{locationTag.capacity}</div>
                </div>
                <div>
                  <div style={labelStyle}>Current Items {isLive && <span style={{ color: '#22c55e' }}>●</span>}</div>
                  <div style={{ ...valueStyle, color: isLive ? '#22c55e' : '#e2e8f0' }}>{displayCurrentItems}</div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={labelStyle}>Utilization {isLive && <span style={{ color: '#22c55e' }}>●</span>}</div>
                  <div style={{
                    ...valueStyle,
                    color: displayUtilizationPct > 90 ? '#ef4444'
                         : displayUtilizationPct > 70 ? '#f59e0b'
                         : '#22c55e',
                  }}>
                    {displayUtilizationPct.toFixed(1)}%
                  </div>
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
                        <div style={labelStyle}>Unit</div>
                        <div style={valueStyle}>{sku.skuUnit}</div>
                      </div>
                      <div>
                        <div style={labelStyle}>Quantity</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: sku.quantity > 0 ? '#22c55e' : '#ef4444' }}>
                          {sku.quantity}
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

            {/* ✅ Asset Section — now fully wired */}
            <div style={sectionStyle}>
              <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Archive size={16} /> Asset Information
                <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400 }}>
                  {assets.length} Asset{assets.length !== 1 ? 's' : ''}
                </span>
              </h4>

              {assets.length === 0 ? (
                <div style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', padding: '0.5rem 0' }}>
                  No assets assigned to this location
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
                        <div style={labelStyle}>Asset ID</div>
                        <div style={valueStyle}>{asset.assetId ?? '—'}</div>
                      </div>
                      <div>
                        <div style={labelStyle}>Asset Type</div>
                        <div style={valueStyle}>{asset.assetType}</div>
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
        )}
      </div>
    </div>
  );
};

export default LocationDetailsPanel;