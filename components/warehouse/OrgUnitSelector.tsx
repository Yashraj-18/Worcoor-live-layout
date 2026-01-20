'use client';

import React, { useState } from 'react';
import '@/styles/warehouse/OrgUnitSelector.css';
import showMessage from '@/lib/warehouse/utils/showMessage';

const OrgUnitSelector = ({ isVisible, onClose, onSave }) => {
  const [selectedStatus, setSelectedStatus] = useState('');

  const statusOptions = [
    { id: 'operational', name: 'Save as Operational', description: 'Ready for live operations' },
    { id: 'draft', name: 'Save as Draft', description: 'Work in progress - not ready for operations' }
  ];

  const handleSave = () => {
    if (!selectedStatus) {
      showMessage.warning('Please select a save option (Operational or Draft).');
      return;
    }

    const selectedStatusObj = statusOptions.find(status => status.id === selectedStatus);

    onSave({
      status: selectedStatusObj
    });

    // Reset form
    setSelectedStatus('');
  };

  const handleCancel = () => {
    setSelectedStatus('');
    onClose();
  };

  if (!isVisible) return null;

  const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    backdropFilter: 'blur(4px)'
  };

  const modalStyle = {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    width: '480px',
    maxWidth: '90vw',
    maxHeight: '80vh',
    overflow: 'auto',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    fontFamily: 'Arial, sans-serif'
  };

  const headerStyle = {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '20px',
    color: '#1f2937',
    textAlign: 'center'
  };

  const sectionStyle = {
    marginBottom: '24px'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '8px'
  };

  const selectStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: '#ffffff',
    color: '#1f2937',
    outline: 'none',
    transition: 'border-color 0.2s ease'
  };

  const buttonContainerStyle = {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '24px'
  };

  const buttonStyle = {
    padding: '10px 20px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: 'none'
  };

  const cancelButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: '1px solid #d1d5db'
  };

  const saveButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#2563eb',
    color: '#ffffff'
  };

  const disabledButtonStyle = {
    ...saveButtonStyle,
    backgroundColor: '#9ca3af',
    cursor: 'not-allowed'
  };

  return (
    <div style={modalOverlayStyle} onClick={handleCancel}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          💾 Select Save Option
        </div>

        <div style={{
          fontSize: '14px',
          color: '#6b7280',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          Choose how you want to save this warehouse layout
        </div>

        <div style={sectionStyle}>
          <label style={labelStyle}>
            Save Option *
          </label>
          <select
            style={selectStyle}
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="">Select save option...</option>
            {statusOptions.map(status => (
              <option key={status.id} value={status.id}>
                {status.name} - {status.description}
              </option>
            ))}
          </select>
        </div>

        {selectedStatus && (
          <div style={{
            backgroundColor: '#f0f9ff',
            border: '1px solid #0ea5e9',
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '16px'
          }}>
            <div style={{ fontSize: '12px', color: '#0369a1', fontWeight: '500' }}>
              Layout will be saved as:
            </div>
            <div style={{ fontSize: '14px', color: '#0c4a6e', fontWeight: '600', marginTop: '4px' }}>
              {statusOptions.find(s => s.id === selectedStatus)?.name}
            </div>
            <div style={{ fontSize: '12px', color: '#0369a1', marginTop: '4px' }}>
              {statusOptions.find(s => s.id === selectedStatus)?.description}
            </div>
          </div>
        )}

        <div style={buttonContainerStyle}>
          <button
            style={cancelButtonStyle}
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            style={!selectedStatus ? disabledButtonStyle : saveButtonStyle}
            onClick={handleSave}
            disabled={!selectedStatus}
          >
            Save Layout
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrgUnitSelector;

