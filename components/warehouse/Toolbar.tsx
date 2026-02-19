// @ts-nocheck
'use client';

import React from 'react';
import showMessage from '@/lib/warehouse/utils/showMessage';

const Toolbar = ({ onSave, onLoad, onClear, onExport, itemCount, stackMode, onToggleStackMode, onSearch, onToggleDashboard, zoomLevel, onZoomIn, onZoomOut, onZoomReset, onZoomFit }) => {
  const handleSave = () => {
    onSave();
  };

  const handleLoad = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target.result);
            onLoad(data);
          } catch (error) {
            showMessage.error('Error loading file: Invalid JSON format');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear the entire warehouse layout?')) {
      onClear();
    }
  };

  const handleExport = () => {
    onExport();
  };

  return (
    <div className="toolbar animate-slide-up">
      <div style={{ display: 'flex', gap: 'var(--spacing-4)', alignItems: 'center' }}>
        <button className="btn btn-primary" onClick={handleSave}>
          💾 Save Layout
        </button>
        
        <button className="btn btn-secondary" onClick={handleLoad}>
          📁 Load Layout
        </button>
        
        <button className="btn btn-secondary" onClick={handleExport}>
          📤 Export PNG
        </button>

        <button className="btn btn-secondary" onClick={onSearch}>
          🔍 Search
        </button>

        <button className="btn btn-secondary" onClick={onToggleDashboard}>
          📊 Dashboard
        </button>

        {/* Zoom Controls */}
        <div style={{ 
          marginLeft: 'var(--spacing-8)', 
          display: 'flex', 
          alignItems: 'center', 
          gap: 'var(--spacing-2)', 
          border: '1px solid var(--gray-300)', 
          borderRadius: 'var(--radius-lg)', 
          padding: 'var(--spacing-2)',
          background: 'linear-gradient(135deg, var(--gray-50), white)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <button 
            className="btn btn-secondary"
            onClick={onZoomOut}
            style={{ 
              padding: 'var(--spacing-2) var(--spacing-3)', 
              fontSize: 'var(--font-size-sm)',
              minWidth: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Zoom Out"
          >
            🔍−
          </button>
          
          <span style={{ 
            minWidth: '60px', 
            textAlign: 'center', 
            fontSize: 'var(--font-size-xs)', 
            color: 'var(--gray-600)',
            fontWeight: '700',
            padding: 'var(--spacing-1)'
          }}>
            {Math.round(zoomLevel * 100)}%
          </span>
          
          <button 
            className="btn btn-secondary"
            onClick={onZoomIn}
            style={{ 
              padding: 'var(--spacing-2) var(--spacing-3)', 
              fontSize: 'var(--font-size-sm)',
              minWidth: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Zoom In"
          >
            🔍+
          </button>
          
          <button 
            className="btn btn-secondary"
            onClick={onZoomReset}
            style={{ 
              padding: 'var(--spacing-2) var(--spacing-3)', 
              fontSize: 'var(--font-size-xs)',
              minWidth: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Reset Zoom"
          >
            1:1
          </button>
          
          <button 
            className="btn btn-secondary"
            onClick={onZoomFit}
            style={{ 
              padding: 'var(--spacing-2) var(--spacing-3)', 
              fontSize: 'var(--font-size-xs)',
              minWidth: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Fit to Screen"
          >
            📐
          </button>
        </div>
        
        <button className="btn btn-danger" onClick={handleClear}>
          🗑️ Clear All
        </button>

        <div style={{ 
          marginLeft: 'var(--spacing-8)', 
          display: 'flex', 
          alignItems: 'center', 
          gap: 'var(--spacing-3)',
          padding: 'var(--spacing-2)',
          background: 'linear-gradient(135deg, var(--gray-50), white)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--gray-300)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <button 
            className={`btn ${stackMode === 'enabled' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={onToggleStackMode}
            style={{
              backgroundColor: stackMode === 'enabled' ? '#4CAF50' : '#f5f5f5',
              color: stackMode === 'enabled' ? 'white' : '#333'
            }}
          >
            📚 Stack Mode {stackMode === 'enabled' ? 'ON' : 'OFF'}
          </button>
          {stackMode === 'enabled' && (
            <span style={{ fontSize: '0.8rem', color: '#666' }}>
              Drag onto items to stack
            </span>
          )}
        </div>
      </div>
      
      <div style={{ 
        marginLeft: 'auto', 
        display: 'flex', 
        alignItems: 'center', 
        gap: 'var(--spacing-6)',
        color: 'var(--gray-600)',
        fontSize: 'var(--font-size-sm)',
        fontWeight: '500'
      }}>
        <span>Items: {itemCount}</span>
        <span>Zoom: {Math.round(zoomLevel * 100)}% (10%-500%)</span>
      </div>
    </div>
  );
};

export default Toolbar;

