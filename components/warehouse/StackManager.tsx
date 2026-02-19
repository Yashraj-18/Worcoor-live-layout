// @ts-nocheck
'use client';

import React, { useState } from 'react';

const StackManager = ({ stack, onClose, onUpdateStack, onDeleteLayer }) => {
  const [editingLayer, setEditingLayer] = useState(null);
  const [newSku, setNewSku] = useState('');
  const [newQuantity, setNewQuantity] = useState('');

  if (!stack || !stack.layers) return null;

  const handleAddSku = (layerIndex) => {
    if (newSku.trim() && newQuantity) {
      const updatedStack = { ...stack };
      if (!updatedStack.layers[layerIndex].skus) {
        updatedStack.layers[layerIndex].skus = [];
      }
      updatedStack.layers[layerIndex].skus.push({
        id: Date.now().toString(),
        sku: newSku.trim(),
        quantity: parseInt(newQuantity),
        dateAdded: new Date().toISOString()
      });
      onUpdateStack(updatedStack);
      setNewSku('');
      setNewQuantity('');
      setEditingLayer(null);
    }
  };

  const handleRemoveSku = (layerIndex, skuId) => {
    const updatedStack = { ...stack };
    updatedStack.layers[layerIndex].skus = updatedStack.layers[layerIndex].skus.filter(
      sku => sku.id !== skuId
    );
    onUpdateStack(updatedStack);
  };

  const handleUpdateLayerName = (layerIndex, newName) => {
    const updatedStack = { ...stack };
    updatedStack.layers[layerIndex].name = newName;
    onUpdateStack(updatedStack);
  };

  const modalStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000
  };

  const contentStyle = {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '2rem',
    maxWidth: '600px',
    maxHeight: '80vh',
    overflow: 'auto',
    width: '90%'
  };

  return (
    <div style={modalStyle} onClick={onClose}>
      <div style={contentStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, color: '#333' }}>📚 Stack Manager</h2>
          <button 
            onClick={onClose}
            style={{ 
              background: 'none', 
              border: 'none', 
              fontSize: '1.5rem', 
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ marginBottom: '1rem', color: '#666' }}>
          <strong>Base Item:</strong> {stack.name} ({stack.layers.length} layers)
        </div>

        {stack.layers.map((layer, layerIndex) => (
          <div key={layerIndex} style={{ 
            border: '1px solid #e0e0e0', 
            borderRadius: '6px', 
            padding: '1rem', 
            marginBottom: '1rem',
            backgroundColor: layerIndex === 0 ? '#f8f9fa' : 'white'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <input
                type="text"
                value={layer.name}
                onChange={(e) => handleUpdateLayerName(layerIndex, e.target.value)}
                style={{ 
                  border: 'none', 
                  background: 'transparent', 
                  fontSize: '1rem', 
                  fontWeight: 'bold',
                  color: '#333',
                  width: '60%'
                }}
              />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <span style={{ 
                  backgroundColor: layerIndex === 0 ? '#4CAF50' : '#2196F3', 
                  color: 'white', 
                  padding: '2px 8px', 
                  borderRadius: '12px', 
                  fontSize: '0.8rem' 
                }}>
                  {layerIndex === 0 ? 'Base' : `Layer ${layerIndex}`}
                </span>
                {layerIndex > 0 && (
                  <button
                    onClick={() => onDeleteLayer(layerIndex)}
                    style={{ 
                      background: '#f44336', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '4px', 
                      padding: '2px 6px', 
                      cursor: 'pointer',
                      fontSize: '0.8rem'
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>

            {/* SKUs for this layer */}
            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#555' }}>SKUs:</h4>
              {layer.skus && layer.skus.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {layer.skus.map((sku) => (
                    <div key={sku.id} style={{ 
                      backgroundColor: '#e3f2fd', 
                      padding: '0.5rem', 
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.9rem'
                    }}>
                      <span><strong>{sku.sku}</strong> (Qty: {sku.quantity})</span>
                      <button
                        onClick={() => handleRemoveSku(layerIndex, sku.id)}
                        style={{ 
                          background: '#f44336', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '50%', 
                          width: '20px', 
                          height: '20px', 
                          cursor: 'pointer',
                          fontSize: '0.7rem'
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: '#999', fontStyle: 'italic' }}>No SKUs assigned</div>
              )}
            </div>

            {/* Add SKU form */}
            {editingLayer === layerIndex ? (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="SKU Code"
                  value={newSku}
                  onChange={(e) => setNewSku(e.target.value)}
                  style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', flex: 1 }}
                />
                <input
                  type="number"
                  placeholder="Qty"
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(e.target.value)}
                  style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', width: '80px' }}
                />
                <button
                  onClick={() => handleAddSku(layerIndex)}
                  style={{ 
                    backgroundColor: '#4CAF50', 
                    color: 'white', 
                    border: 'none', 
                    padding: '0.5rem 1rem', 
                    borderRadius: '4px', 
                    cursor: 'pointer' 
                  }}
                >
                  Add
                </button>
                <button
                  onClick={() => setEditingLayer(null)}
                  style={{ 
                    backgroundColor: '#999', 
                    color: 'white', 
                    border: 'none', 
                    padding: '0.5rem 1rem', 
                    borderRadius: '4px', 
                    cursor: 'pointer' 
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingLayer(layerIndex)}
                style={{ 
                  backgroundColor: '#2196F3', 
                  color: 'white', 
                  border: 'none', 
                  padding: '0.5rem 1rem', 
                  borderRadius: '4px', 
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                + Add SKU
              </button>
            )}
          </div>
        ))}

        <div style={{ textAlign: 'right', marginTop: '1.5rem' }}>
          <button
            onClick={onClose}
            style={{ 
              backgroundColor: '#2196F3', 
              color: 'white', 
              border: 'none', 
              padding: '0.75rem 1.5rem', 
              borderRadius: '4px', 
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default StackManager;

