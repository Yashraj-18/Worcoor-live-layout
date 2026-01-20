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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000
  };

  const modalStyle = {
    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.98) 0%, rgba(15, 23, 42, 0.98) 100%)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    borderRadius: '16px',
    padding: '0',
    width: '500px',
    maxWidth: '90vw',
    maxHeight: '80vh',
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(59, 130, 246, 0.2)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  };

  const headerStyle = {
    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.8) 100%)',
    borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
    padding: '20px 24px',
    fontSize: '1.125rem',
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: '-0.02em'
  };

  const sectionStyle = {
    marginBottom: '24px',
    padding: '0 24px'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.8125rem',
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  };

  const selectStyle = {
    width: '100%',
    padding: '0.75rem 1rem',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    borderRadius: '8px',
    fontSize: '0.875rem',
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    color: '#ffffff',
    outline: 'none',
    transition: 'all 0.2s ease'
  };

  const buttonContainerStyle = {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    padding: '16px 24px',
    borderTop: '1px solid rgba(59, 130, 246, 0.2)',
    background: 'rgba(15, 23, 42, 0.5)',
    margin: '0'
  };

  const buttonStyle = {
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: 'none'
  };

  const cancelButtonStyle = {
    ...buttonStyle,
    background: 'rgba(30, 41, 59, 0.6)',
    color: '#cbd5e1',
    border: '1px solid rgba(59, 130, 246, 0.2)'
  };

  const saveButtonStyle = {
    ...buttonStyle,
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    color: '#ffffff',
    border: '1px solid rgba(59, 130, 246, 0.5)',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)'
  };

  const disabledButtonStyle = {
    ...saveButtonStyle,
    background: 'rgba(100, 116, 139, 0.3)',
    border: '1px solid rgba(100, 116, 139, 0.3)',
    cursor: 'not-allowed',
    boxShadow: 'none'
  };

  return (
    <div style={modalOverlayStyle} onClick={handleCancel}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          💾 Select Save Option
        </div>

        <div style={{
          fontSize: '0.9375rem',
          color: '#94a3b8',
          padding: '20px 24px 0',
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
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '8px',
            padding: '16px',
            margin: '0 24px 24px',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Layout will be saved as:
            </div>
            <div style={{ fontSize: '0.9375rem', color: '#ffffff', fontWeight: '700', marginTop: '8px' }}>
              {statusOptions.find(s => s.id === selectedStatus)?.name}
            </div>
            <div style={{ fontSize: '0.8125rem', color: '#cbd5e1', marginTop: '4px' }}>
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

