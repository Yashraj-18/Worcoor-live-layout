'use client';

import React, { useState, useEffect } from 'react';
import locationDataService from '@/lib/warehouse/services/locationDataService';
import { MapPin, Package, Building, TrendingUp, X, Archive, Factory, ShieldCheck, UsersRound, Coffee, Loader2, PackageOpen } from 'lucide-react';

// Type definitions
interface LocationMapping {
  locationId?: string;
  locId?: string;
  levelId?: string;
  level?: string;
}

interface CompartmentInfo {
  levelId?: string;
  locationId?: string;
  row?: number;
  col?: number;
}

interface CompartmentData {
  locationId?: string;
  uniqueId?: string;
  levelLocationMappings?: LocationMapping[];
  locationIds?: string[];
  levelIds?: string[];
  [key: string]: any;
}

interface SelectedItem {
  name?: string;
  label?: string;
  locationId?: string;
  type?: string;
  selectedCompartment?: CompartmentData;
  selectedCompartmentId?: string;
  selectedCompartmentRow?: number;
  selectedCompartmentCol?: number;
  compartmentContents?: Record<string, CompartmentData>;
  levelLocationMappings?: LocationMapping[];
  locationIds?: string[];
  levelIds?: string[];
  locationData?: {
    location_id?: string;
  };
  properties?: {
    locationId?: string;
  };
  data?: {
    locationId?: string;
  };
  [key: string]: any;
}

interface LocationData {
  location_id: string;
  sku_instance_id?: string;
  sku_name?: string;
  sku_category?: string;
  parent_resource?: string;
  sku_unit?: string;
  available_quantity?: number;
  sku_procured_date?: string;
  sku_expiry_date?: string;
  created_at?: string;
  location_tag_name?: string;
  location?: string;
  capacity?: number;
  location_created_at?: string;
  unit_id?: string;
  asset_id?: string;
  asset_name?: string;
  asset_type?: string;
  asset_created_at?: string;
  compartmentInfo?: CompartmentInfo;
  [key: string]: any;
}

interface LocationDetailsPanelProps {
  selectedItem: SelectedItem;
  onClose: () => void;
  isEmbedded?: boolean;
}

/**
 * LocationDetailsPanel - Displays detailed information about a selected warehouse component
 * Fetches data from layoutComponentsMock.json based on the component's locationId
 */
const LocationDetailsPanel: React.FC<LocationDetailsPanelProps> = ({ selectedItem, onClose, isEmbedded = false }) => {
  const [locationDataList, setLocationDataList] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedItem) {
      setLocationDataList([]);
      return;
    }

    setLoading(true);
    
    // Debug: Log the entire selectedItem structure
    console.log('=== LocationDetailsPanel - Full selectedItem ===');
    console.log('selectedItem:', JSON.stringify(selectedItem, null, 2));
    console.log('Has compartmentContents:', !!selectedItem.compartmentContents);
    console.log('Has levelLocationMappings:', !!selectedItem.levelLocationMappings);
    console.log('Has locationIds:', !!selectedItem.locationIds);
    console.log('Has levelIds:', !!selectedItem.levelIds);
    if (selectedItem.compartmentContents) {
      const compartments = Object.values(selectedItem.compartmentContents);
      console.log('Number of compartments:', compartments.length);
      console.log('First compartment:', JSON.stringify(compartments[0], null, 2));
    }
    console.log('=======================================');
    
    // Check if a specific compartment was clicked
    if (selectedItem.selectedCompartment) {
      console.log('LocationDetailsPanel - Specific compartment clicked:', {
        compartmentId: selectedItem.selectedCompartmentId,
        row: selectedItem.selectedCompartmentRow,
        col: selectedItem.selectedCompartmentCol,
        compartmentData: selectedItem.selectedCompartment
      });
      
      const compartment = selectedItem.selectedCompartment as CompartmentData;
      const allLocationData: LocationData[] = [];
      
      // Check if this compartment has multiple levels (levelLocationMappings)
      if (compartment.levelLocationMappings && Array.isArray(compartment.levelLocationMappings)) {
        console.log('LocationDetailsPanel - Compartment has multiple levels:', compartment.levelLocationMappings.length);
        compartment.levelLocationMappings.forEach((mapping: LocationMapping, idx: number) => {
          const locationId = mapping.locationId || mapping.locId;
          const levelId = mapping.levelId || mapping.level;
          console.log(`LocationDetailsPanel - Level ${idx}:`, { levelId, locationId, mapping });
          if (locationId) {
            const data = locationDataService.getLocationById(locationId);
            console.log(`LocationDetailsPanel - Fetched data for ${locationId}:`, data);
            if (data) {
              allLocationData.push({ 
                ...data, 
                compartmentInfo: { 
                  levelId, 
                  locationId,
                  row: idx + 1,
                  col: 1
                } 
              });
            }
          }
        });
        setLocationDataList(allLocationData);
      }
      // Check if compartment has locationIds array (alternative format)
      else if (compartment.locationIds && Array.isArray(compartment.locationIds)) {
        console.log('LocationDetailsPanel - Compartment has locationIds array:', compartment.locationIds.length);
        compartment.locationIds.forEach((locationId: string, idx: number) => {
          const levelId = compartment.levelIds && compartment.levelIds[idx] ? compartment.levelIds[idx] : `L${idx + 1}`;
          console.log(`LocationDetailsPanel - Level ${idx}:`, { levelId, locationId });
          if (locationId) {
            const data = locationDataService.getLocationById(locationId);
            console.log(`LocationDetailsPanel - Fetched data for ${locationId}:`, data);
            if (data) {
              allLocationData.push({ 
                ...data, 
                compartmentInfo: { 
                  levelId, 
                  locationId,
                  row: idx + 1,
                  col: 1
                } 
              });
            }
          }
        });
        setLocationDataList(allLocationData);
      }
      // Single location in compartment
      else {
        const locationId = compartment.locationId || compartment.uniqueId;
        if (locationId) {
          const data = locationDataService.getLocationById(locationId);
          setLocationDataList(data ? [{ ...data, compartmentInfo: compartment }] : []);
        } else {
          setLocationDataList([]);
        }
      }
    }
    // For storage racks with compartments or level mappings - show ALL locations
    else if (selectedItem.compartmentContents || selectedItem.levelLocationMappings || selectedItem.levelIds || selectedItem.locationIds) {
      const allLocationData: LocationData[] = [];
      
      // Check for compartmentContents first (could contain levelLocationMappings for vertical racks)
      if (selectedItem.compartmentContents) {
        const compartments = Object.values(selectedItem.compartmentContents);
        console.log('LocationDetailsPanel - Checking compartmentContents:', compartments.length);
        
        // Check if any compartment has levelLocationMappings (vertical rack)
        const firstCompartment = compartments[0];
        if (firstCompartment && firstCompartment.levelLocationMappings && Array.isArray(firstCompartment.levelLocationMappings)) {
          console.log('LocationDetailsPanel - Vertical rack with levelLocationMappings in compartment:', firstCompartment.levelLocationMappings.length);
          firstCompartment.levelLocationMappings.forEach((mapping: LocationMapping, idx: number) => {
            const locationId = mapping.locationId || mapping.locId;
            const levelId = mapping.levelId || mapping.level;
            console.log(`LocationDetailsPanel - Level ${idx}:`, { levelId, locationId, mapping });
            if (locationId) {
              const data = locationDataService.getLocationById(locationId);
              console.log(`LocationDetailsPanel - Fetched data for ${locationId}:`, data);
              if (data) {
                allLocationData.push({ 
                  ...data, 
                  compartmentInfo: { 
                    levelId, 
                    locationId,
                    row: idx + 1,
                    col: 1
                  } 
                });
              }
            }
          });
        }
        // Check if compartment has locationIds array (alternative vertical rack format)
        else if (firstCompartment && firstCompartment.locationIds && Array.isArray(firstCompartment.locationIds)) {
          console.log('LocationDetailsPanel - Vertical rack with locationIds in compartment:', firstCompartment.locationIds.length);
          firstCompartment.locationIds.forEach((locationId: string, idx: number) => {
            const levelId = firstCompartment.levelIds && firstCompartment.levelIds[idx] ? firstCompartment.levelIds[idx] : `L${idx + 1}`;
            console.log(`LocationDetailsPanel - Level ${idx}:`, { levelId, locationId });
            if (locationId) {
              const data = locationDataService.getLocationById(locationId);
              console.log(`LocationDetailsPanel - Fetched data for ${locationId}:`, data);
              if (data) {
                allLocationData.push({ 
                  ...data, 
                  compartmentInfo: { 
                    levelId, 
                    locationId,
                    row: idx + 1,
                    col: 1
                  } 
                });
              }
            }
          });
        }
        // Regular compartments (horizontal racks or single location per compartment)
        else {
          console.log('LocationDetailsPanel - Regular compartments (horizontal rack)');
          compartments.forEach((compartment: CompartmentData, idx: number) => {
            const locationId = compartment.locationId || compartment.uniqueId;
            console.log(`LocationDetailsPanel - Compartment ${idx}:`, { locationId, compartment });
            if (locationId) {
              const data = locationDataService.getLocationById(locationId);
              console.log(`LocationDetailsPanel - Fetched data for ${locationId}:`, data);
              if (data) {
                allLocationData.push({ ...data, compartmentInfo: compartment });
              }
            }
          });
        }
      }
      // Check for levelLocationMappings at item level (direct on item)
      else if (selectedItem.levelLocationMappings && Array.isArray(selectedItem.levelLocationMappings)) {
        console.log('LocationDetailsPanel - Vertical rack with levelLocationMappings on item:', selectedItem.levelLocationMappings.length);
        selectedItem.levelLocationMappings.forEach((mapping: LocationMapping, idx: number) => {
          const locationId = mapping.locationId || mapping.locId;
          const levelId = mapping.levelId || mapping.level;
          console.log(`LocationDetailsPanel - Level ${idx}:`, { levelId, locationId, mapping });
          if (locationId) {
            const data = locationDataService.getLocationById(locationId);
            console.log(`LocationDetailsPanel - Fetched data for ${locationId}:`, data);
            if (data) {
              allLocationData.push({ 
                ...data, 
                compartmentInfo: { 
                  levelId, 
                  locationId,
                  row: idx + 1,
                  col: 1
                } 
              });
            }
          }
        });
      }
      // Check for levelIds/locationIds arrays at item level
      else if (selectedItem.locationIds && Array.isArray(selectedItem.locationIds)) {
        console.log('LocationDetailsPanel - Vertical rack with locationIds array on item:', selectedItem.locationIds.length);
        selectedItem.locationIds.forEach((locationId: string, idx: number) => {
          const levelId = selectedItem.levelIds && selectedItem.levelIds[idx] ? selectedItem.levelIds[idx] : `L${idx + 1}`;
          console.log(`LocationDetailsPanel - Level ${idx}:`, { levelId, locationId });
          if (locationId) {
            const data = locationDataService.getLocationById(locationId);
            console.log(`LocationDetailsPanel - Fetched data for ${locationId}:`, data);
            if (data) {
              allLocationData.push({ 
                ...data, 
                compartmentInfo: { 
                  levelId, 
                  locationId,
                  row: idx + 1,
                  col: 1
                } 
              });
            }
          }
        });
      }
      
      console.log('LocationDetailsPanel - Total location data items:', allLocationData.length);
      setLocationDataList(allLocationData);
    }
    // For single items (Storage Unit, Spare Unit)
    else {
      const locationId = selectedItem.locationId || 
                         selectedItem.locationData?.location_id ||
                         selectedItem.properties?.locationId ||
                         selectedItem.data?.locationId;
      
      if (locationId) {
        const data = locationDataService.getLocationById(locationId);
        setLocationDataList(data ? [data] : []);
      } else {
        setLocationDataList([]);
      }
    }

    console.log('LocationDetailsPanel - Selected Item:', selectedItem);
    
    setLoading(false);
  }, [selectedItem]);

  if (!selectedItem) return null;

  const panelStyle: React.CSSProperties = isEmbedded ? {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    backgroundColor: 'hsl(218.4 36.23% 13.53%)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    background: 'linear-gradient(135deg, hsl(218.4 36.23% 13.53%), hsl(217.5 54.33% 5.85%))'
  } : {
    position: 'fixed' as const,
    top: '80px',
    right: '20px',
    width: '380px',
    maxHeight: '85vh',
    backgroundColor: 'hsl(218.4 36.23% 13.53%)',
    border: '1px solid hsl(215.3 25.1% 26.1%)',
    borderRadius: 'var(--radius-2xl)',
    boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    zIndex: 1000,
    overflow: 'hidden',
    backdropFilter: 'blur(20px)',
    background: 'linear-gradient(135deg, hsl(218.4 36.23% 13.53%), hsl(217.5 54.33% 5.85%))'
  };

  const headerStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, hsl(222.2 47% 11%) 0%, hsl(222.2 32.6% 18.55%) 100%)',
    color: 'white',
    padding: 'var(--spacing-5)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative' as const,
    overflow: 'hidden',
    flexShrink: 0
  };

  const contentStyle = isEmbedded ? {
    padding: '1rem',
    overflow: 'auto',
    flex: 1,
    minHeight: 0
  } : {
    padding: '1rem',
    maxHeight: 'calc(80vh - 80px)',
    overflow: 'auto'
  };

  const sectionStyle = {
    marginBottom: '1.25rem',
    padding: '0.75rem',
    background: 'linear-gradient(135deg, hsl(215.3 25.1% 26.1%), hsl(215.3 25.1% 18.55%))',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid hsl(215.3 25.1% 32.6%)'
  };

  const labelStyle = {
    fontSize: '0.75rem',
    color: '#94a3b8',
    fontWeight: '500',
    marginBottom: '0.25rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  };

  const valueStyle = {
    fontSize: '0.95rem',
    color: '#e2e8f0',
    fontWeight: '600',
    marginBottom: '0.5rem'
  };

  const getComponentDisplayName = () => {
    return selectedItem.name || 
           selectedItem.label || 
           selectedItem.locationId || 
           selectedItem.type || 
           'Component';
  };

  return (
    <div style={panelStyle} className="animate-slide-up">
      <div style={headerStyle}>
        <div>
          <div style={{ fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin size={20} />
            Location Details
          </div>
          <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
            {getComponentDisplayName()}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '16px',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
        >
          <X size={16} />
        </button>
      </div>

      <div style={contentStyle}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
            <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
              <Loader2 size={32} className="animate-spin" />
            </div>
            <div>Loading location data...</div>
          </div>
        )}

        {!loading && locationDataList.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
            <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
              <PackageOpen size={32} />
            </div>
            <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>No Data Available</div>
            <div style={{ fontSize: '0.85rem' }}>
              {selectedItem.locationId 
                ? `No data found for Location ID: ${selectedItem.locationId}`
                : 'This component does not have a Location ID assigned'}
            </div>
          </div>
        )}

        {!loading && locationDataList.length > 0 && (
          <>
            {locationDataList.map((locationData, index) => (
              <div key={locationData.location_id || index} style={{ marginBottom: index < locationDataList.length - 1 ? '1.5rem' : '0', paddingBottom: index < locationDataList.length - 1 ? '1.5rem' : '0', borderBottom: index < locationDataList.length - 1 ? '2px solid #e0e0e0' : 'none' }}>
                {locationDataList.length > 1 && (
                  <div style={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    fontWeight: 'bold',
                    fontSize: '0.9rem'
                  }}>
                    {locationData.compartmentInfo?.levelId 
                      ? `${locationData.compartmentInfo.levelId}: ${locationData.location_id}`
                      : locationData.compartmentInfo 
                      ? `Level ${locationData.compartmentInfo.row || index + 1} - Position ${locationData.compartmentInfo.col || index + 1}` 
                      : `Item ${index + 1}`}
                  </div>
                )}
                {renderLocationData(locationData, sectionStyle, labelStyle, valueStyle)}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

const renderLocationData = (locationData: LocationData, sectionStyle: React.CSSProperties, labelStyle: React.CSSProperties, valueStyle: React.CSSProperties) => {
  return (
          <>
            {/* SKU Information */}
            <div style={sectionStyle}>
              <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Package size={16} />
                SKU Information
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <div style={labelStyle}>ID</div>
                  <div style={valueStyle}>{locationData.sku_instance_id || 'N/A'}</div>
                </div>
                <div>
                  <div style={labelStyle}>Organization Id</div>
                  <div style={valueStyle}>ORG-001</div>
                </div>
                <div>
                  <div style={labelStyle}>Sku Name</div>
                  <div style={{
                    ...valueStyle,
                    fontSize: '1rem',
                    color: '#60a5fa',
                    gridColumn: '1 / -1'
                  }}>
                    {locationData.sku_name || 'N/A'}
                  </div>
                </div>
                <div>
                  <div style={labelStyle}>Sku Category</div>
                  <div style={valueStyle}>{locationData.sku_category || locationData.parent_resource || 'N/A'}</div>
                </div>
                <div>
                  <div style={labelStyle}>Sku Unit</div>
                  <div style={valueStyle}>{locationData.sku_unit || 'Pieces'}</div>
                </div>
                <div>
                  <div style={labelStyle}>Quantity</div>
                  <div style={{
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    color: (locationData.available_quantity || 0) > 0 ? '#22c55e' : '#ef4444'
                  }}>
                    {locationData.available_quantity || 0}
                  </div>
                </div>
                <div>
                  <div style={labelStyle}>Effective Date</div>
                  <div style={valueStyle}>
                    {locationData.sku_procured_date 
                      ? new Date(locationData.sku_procured_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })
                      : 'N/A'}
                  </div>
                </div>
                <div>
                  <div style={labelStyle}>Expiry Date</div>
                  <div style={valueStyle}>
                    {locationData.sku_expiry_date 
                      ? new Date(locationData.sku_expiry_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })
                      : 'N/A'}
                  </div>
                </div>
                <div>
                  <div style={labelStyle}>Location Tag Id</div>
                  <div style={valueStyle}>{locationData.location_id || 'N/A'}</div>
                </div>
                <div>
                  <div style={labelStyle}>Created At</div>
                  <div style={valueStyle}>
                    {locationData.created_at 
                      ? new Date(locationData.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })
                      : locationData.sku_procured_date
                      ? new Date(locationData.sku_procured_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })
                      : 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {/* Location Tag Information */}
            <div style={sectionStyle}>
              <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={16} />
                Location Tag Information
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <div style={labelStyle}>Id</div>
                  <div style={valueStyle}>{locationData.location_id || 'N/A'}</div>
                </div>
                <div>
                  <div style={labelStyle}>Organization Id</div>
                  <div style={valueStyle}>ORG-001</div>
                </div>
                <div>
                  <div style={labelStyle}>Location Tag Name</div>
                  <div style={{
                    ...valueStyle,
                    fontSize: '1rem',
                    color: '#60a5fa',
                    gridColumn: '1 / -1'
                  }}>
                    {locationData.location_tag_name || locationData.location || 'N/A'}
                  </div>
                </div>
                <div>
                  <div style={labelStyle}>Capacity</div>
                  <div style={valueStyle}>{locationData.capacity || locationData.available_quantity || 0}</div>
                </div>
                <div>
                  <div style={labelStyle}>Created At</div>
                  <div style={valueStyle}>
                    {locationData.location_created_at 
                      ? new Date(locationData.location_created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })
                      : locationData.sku_procured_date
                      ? new Date(locationData.sku_procured_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })
                      : 'N/A'}
                  </div>
                </div>
                <div>
                  <div style={labelStyle}>Unit Id</div>
                  <div style={valueStyle}>{locationData.unit_id || 'U1'}</div>
                </div>
              </div>
            </div>

            {/* Asset Information */}
            <div style={sectionStyle}>
              <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Archive size={16} />
                Asset Information
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <div style={labelStyle}>Id</div>
                  <div style={valueStyle}>{locationData.asset_id || locationData.sku_instance_id || 'N/A'}</div>
                </div>
                <div>
                  <div style={labelStyle}>Organization Id</div>
                  <div style={valueStyle}>ORG-001</div>
                </div>
                <div>
                  <div style={labelStyle}>Asset Name</div>
                  <div style={{
                    ...valueStyle,
                    fontSize: '1rem',
                    color: '#60a5fa',
                    gridColumn: '1 / -1'
                  }}>
                    {locationData.asset_name || locationData.sku_name || 'N/A'}
                  </div>
                </div>
                <div>
                  <div style={labelStyle}>Asset Type</div>
                  <div style={valueStyle}>{locationData.asset_type || locationData.parent_resource || 'N/A'}</div>
                </div>
                <div>
                  <div style={labelStyle}>Location Tag Id</div>
                  <div style={valueStyle}>{locationData.location_id || 'N/A'}</div>
                </div>
                <div>
                  <div style={labelStyle}>Created At</div>
                  <div style={valueStyle}>
                    {locationData.asset_created_at 
                      ? new Date(locationData.asset_created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })
                      : locationData.sku_procured_date
                      ? new Date(locationData.sku_procured_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })
                      : 'N/A'}
                  </div>
                </div>
              </div>
            </div>

          </>
  );
};

export default LocationDetailsPanel;

