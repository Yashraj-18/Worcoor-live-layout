// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { getZoneDescription } from '../../lib/warehouse/utils/locationUtils';

const SearchPanel = ({ items, onSelectItem, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSearchResults([]);
      return;
    }

    const term = searchTerm.toLowerCase();
    const results = items.filter(item => {
      return (
        item.name.toLowerCase().includes(term) ||
        item.locationCode?.toLowerCase().includes(term) ||
        item.type.toLowerCase().includes(term) ||
        (item.inventoryData?.inventory || []).some(inv => 
          inv.sku.toLowerCase().includes(term)
        )
      );
    }).slice(0, 10); // Limit to 10 results

    setSearchResults(results);
    setSelectedIndex(-1);
  }, [searchTerm, items]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, searchResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && searchResults[selectedIndex]) {
        handleSelectItem(searchResults[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleSelectItem = (item) => {
    onSelectItem(item);
    onClose();
  };

  const getMatchReason = (item, term) => {
    const lowerTerm = term.toLowerCase();
    
    if (item.name.toLowerCase().includes(lowerTerm)) return 'Name match';
    if (item.locationCode?.toLowerCase().includes(lowerTerm)) return 'Location match';
    if (item.type.toLowerCase().includes(lowerTerm)) return 'Type match';
    
    const skuMatch = (item.inventoryData?.inventory || []).find(inv => 
      inv.sku.toLowerCase().includes(lowerTerm)
    );
    if (skuMatch) return `SKU match: ${skuMatch.sku}`;
    
    return 'Match found';
  };

  const panelStyle = {
    position: 'fixed',
    top: '20%',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'white',
    border: '1px solid #ddd',
    borderRadius: '8px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
    zIndex: 3000,
    width: '500px',
    maxHeight: '400px',
    overflow: 'hidden'
  };

  const headerStyle = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  };

  const inputStyle = {
    flex: 1,
    padding: '0.5rem',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    outline: 'none'
  };

  const resultsStyle = {
    maxHeight: '300px',
    overflow: 'auto'
  };

  const resultItemStyle = (isSelected) => ({
    padding: '0.75rem 1rem',
    borderBottom: '1px solid #f0f0f0',
    cursor: 'pointer',
    backgroundColor: isSelected ? '#e3f2fd' : 'white',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  });

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <span style={{ fontSize: '1.2rem' }}>🔍</span>
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search locations, items, or SKUs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          style={inputStyle}
        />
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
            fontSize: '16px'
          }}
        >
          ✕
        </button>
      </div>

      <div style={resultsStyle}>
        {searchTerm.trim() === '' ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🏭</div>
            <div>Start typing to search locations, items, or SKUs</div>
            <div style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
              Use ↑↓ to navigate, Enter to select, Esc to close
            </div>
          </div>
        ) : searchResults.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>❌</div>
            <div>No results found for "{searchTerm}"</div>
            <div style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
              Try searching by location code, item name, or SKU
            </div>
          </div>
        ) : (
          searchResults.map((item, index) => (
            <div
              key={item.id}
              style={resultItemStyle(index === selectedIndex)}
              onClick={() => handleSelectItem(item)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                  {item.name}
                  {item.locationCode && (
                    <span style={{ 
                      marginLeft: '0.5rem',
                      backgroundColor: '#e3f2fd',
                      color: '#1976d2',
                      padding: '2px 6px',
                      borderRadius: '12px',
                      fontSize: '0.8rem'
                    }}>
                      {item.locationCode}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#666' }}>
                  {getZoneDescription(item.locationCode?.charAt(0))} • {getMatchReason(item, searchTerm)}
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#666' }}>
                <div>{item.type.replace('_', ' ')}</div>
                {item.inventoryData && (
                  <div style={{ color: '#4CAF50', fontWeight: 'bold' }}>
                    {Math.round(item.inventoryData.utilization * 100)}% full
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {searchResults.length > 0 && (
        <div style={{ 
          padding: '0.5rem 1rem', 
          background: '#f8f9fa', 
          fontSize: '0.8rem', 
          color: '#666',
          borderTop: '1px solid #e0e0e0'
        }}>
          {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
        </div>
      )}
    </div>
  );
};

export default SearchPanel;
