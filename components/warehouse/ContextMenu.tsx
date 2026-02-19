// @ts-nocheck
'use client';

import React, { useEffect, useRef } from 'react';
import { COMPONENT_TYPES } from '@/lib/warehouse/constants/warehouseComponents';

const ContextMenu = ({ x, y, onClose, onAddLayerAbove, onAddLayerBelow, onManageStack, hasStack, canStack, item, onLockToggle, onDelete }) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const menuStyle = {
    position: 'fixed',
    top: y,
    left: x,
    backgroundColor: 'white',
    border: '1px solid #ddd',
    borderRadius: '6px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    zIndex: 1000,
    minWidth: '180px',
    padding: '4px 0'
  };

  const menuItemStyle = {
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    borderBottom: '1px solid #f0f0f0',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  const disabledStyle = {
    ...menuItemStyle,
    color: '#999',
    cursor: 'not-allowed',
    backgroundColor: '#f8f8f8'
  };

  const handleItemClick = (action) => {
    action();
    onClose();
  };

  const STACK_OPTION_BLOCKED_TYPES = new Set([
    COMPONENT_TYPES.SKU_HOLDER,
    COMPONENT_TYPES.VERTICAL_SKU_HOLDER,
    COMPONENT_TYPES.STORAGE_UNIT,
    COMPONENT_TYPES.SPARE_UNIT
  ]);

  const hideStackOptions = item && STACK_OPTION_BLOCKED_TYPES.has(item.type);
  const showEnabledStackOptions = !hideStackOptions && canStack;
  const showDisabledStackOptions = !hideStackOptions && !canStack;

  return (
    <div ref={menuRef} style={menuStyle}>
      {showEnabledStackOptions && (
        <>
          <div 
            style={menuItemStyle}
            onClick={() => handleItemClick(onAddLayerAbove)}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f8ff'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            <span>⬆️</span> Add Layer Above
          </div>
          <div 
            style={menuItemStyle}
            onClick={() => handleItemClick(onAddLayerBelow)}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f8ff'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            <span>⬇️</span> Add Layer Below
          </div>
        </>
      )}
      {showDisabledStackOptions && (
        <>
          <div style={disabledStyle}>
            <span>⬆️</span> Add Layer Above
          </div>
          <div style={disabledStyle}>
            <span>⬇️</span> Add Layer Below
          </div>
        </>
      )}
      
      {hasStack && !hideStackOptions && (
        <div 
          style={menuItemStyle}
          onClick={() => handleItemClick(onManageStack)}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f8ff'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
        >
          <span>📚</span> Manage Stack
        </div>
      )}
      
      {/* Lock/Unlock options for Floor Plan Components */}
      {item && (item.isBoundary || item.type === 'square_boundary') && (
        <>
          <div style={{ ...menuItemStyle, borderTop: '1px solid #e0e0e0', marginTop: '4px', paddingTop: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: '#666', fontWeight: 'bold' }}>Floor Plan Options</span>
          </div>
          <div 
            style={menuItemStyle}
            onClick={() => handleItemClick(() => onLockToggle && onLockToggle(item.id, 'position', !item.isPositionLocked))}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f8ff'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            <span>{item.isPositionLocked ? '🔓' : '🔒'}</span> 
            {item.isPositionLocked ? 'Unlock Position' : 'Lock Position'}
          </div>
          <div 
            style={menuItemStyle}
            onClick={() => handleItemClick(() => onLockToggle && onLockToggle(item.id, 'size', !item.isSizeLocked))}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f8ff'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            <span>{item.isSizeLocked ? '📏' : '📐'}</span> 
            {item.isSizeLocked ? 'Unlock Size' : 'Lock Size'}
          </div>
        </>
      )}
      
      {/* Delete Option */}
      {onDelete && (
        <div 
          style={{
            ...menuItemStyle,
            borderTop: '1px solid #e0e0e0',
            marginTop: '4px',
            paddingTop: '8px',
            color: '#f44336',
            fontWeight: '500'
          }}
          onClick={() => handleItemClick(onDelete)}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#ffebee'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
        >
          <span>🗑️</span> Delete Item
        </div>
      )}
      
      {!hideStackOptions && (
        <div style={{ ...menuItemStyle, borderBottom: 'none', color: '#666', fontSize: '0.8rem' }}>
          {canStack ? 'Right-click for stack options' : 'This component cannot be stacked'}
        </div>
      )}
    </div>
  );
};

export default ContextMenu;

