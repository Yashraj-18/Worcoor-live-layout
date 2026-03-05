// @ts-nocheck
'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface TooltipPosition {
  top: number;
  left: number;
}

export interface TooltipData {
  id: string;
  content: React.ReactNode;
  position: TooltipPosition;
  variant?: 'item' | 'compartment';
  priority?: number;
}

interface WarehouseTooltipProps {
  tooltip: TooltipData | null;
  onClose?: () => void;
  className?: string;
}

const WarehouseTooltip: React.FC<WarehouseTooltipProps> = ({ 
  tooltip, 
  onClose,
  className = '' 
}) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [isAdjusted, setIsAdjusted] = useState(false);

  // Adjust tooltip position to stay within viewport
  useEffect(() => {
    if (!tooltip || !tooltipRef.current || isAdjusted) return;

    const tooltipElement = tooltipRef.current;
    const rect = tooltipElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let adjustedPosition = { ...tooltip.position };
    let needsAdjustment = false;

    // Check horizontal bounds
    if (rect.right > viewportWidth) {
      adjustedPosition.left = viewportWidth - rect.width - 10;
      needsAdjustment = true;
    }
    if (rect.left < 10) {
      adjustedPosition.left = 10;
      needsAdjustment = true;
    }

    // Check vertical bounds
    if (rect.bottom > viewportHeight) {
      adjustedPosition.top = viewportHeight - rect.height - 10;
      needsAdjustment = true;
    }
    if (rect.top < 10) {
      adjustedPosition.top = 10;
      needsAdjustment = true;
    }

    if (needsAdjustment) {
      setIsAdjusted(true);
    }
  }, [tooltip, isAdjusted]);

  // Close tooltip on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!tooltip || !tooltip.content) {
    return null;
  }

  const variantClasses = {
    item: 'warehouse-tooltip--item',
    compartment: 'warehouse-tooltip--compartment'
  };

  const tooltipClasses = [
    'warehouse-tooltip',
    variantClasses[tooltip.variant] || variantClasses.item,
    className
  ].filter(Boolean).join(' ');

  return createPortal(
    <div
      ref={tooltipRef}
      className={tooltipClasses}
      style={{
        top: isAdjusted ? tooltip.position.top : tooltip.position.top,
        left: isAdjusted ? tooltip.position.left : tooltip.position.left,
        zIndex: 9999
      }}
      role="tooltip"
      aria-live="polite"
    >
      <div className="warehouse-tooltip__content">
        {tooltip.content}
      </div>
      <button 
        className="warehouse-tooltip__close"
        onClick={onClose}
        aria-label="Close tooltip"
      >
        ×
      </button>
    </div>,
    document.body
  );
};

// Tooltip Provider Hook
export const useWarehouseTooltip = () => {
  const [activeTooltip, setActiveTooltip] = useState<TooltipData | null>(null);

  const showTooltip = useCallback((
    id: string,
    content: React.ReactNode,
    event: React.MouseEvent | MouseEvent,
    variant: 'item' | 'compartment' = 'item',
    priority: number = 0
  ) => {
    const position = getTooltipPosition(event);
    
    setActiveTooltip(prev => {
      // Only replace if higher priority or no existing tooltip
      if (!prev || priority > (prev.priority || 0)) {
        return {
          id,
          content,
          position,
          variant,
          priority
        };
      }
      return prev;
    });
  }, []);

  const hideTooltip = useCallback((id?: string) => {
    setActiveTooltip(prev => {
      // Only hide if matching ID or no ID provided
      if (!id || !prev || prev.id === id) {
        return null;
      }
      return prev;
    });
  }, []);

  const updateTooltipPosition = useCallback((event: React.MouseEvent | MouseEvent) => {
    if (activeTooltip) {
      const position = getTooltipPosition(event);
      setActiveTooltip(prev => prev ? { ...prev, position } : null);
    }
  }, [activeTooltip]);

  return {
    activeTooltip,
    showTooltip,
    hideTooltip,
    updateTooltipPosition,
    isVisible: Boolean(activeTooltip)
  };
};

// Utility functions for tooltip styling
export const getContrastColorForHex = (hexColor: any) => {
  if (!hexColor || typeof hexColor !== 'string') {
    return '#FFFFFF';
  }

  let hex = hexColor.replace('#', '').trim();

  if (hex.length === 3) {
    hex = hex.split('').map((char) => char + char).join('');
  }

  if (hex.length !== 6 || /[^0-9a-f]/i.test(hex)) {
    return '#FFFFFF';
  }

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.6 ? '#000000' : '#FFFFFF';
};

export const adjustHexColor = (hexColor: string, amount: number = 0) => {
  if (!hexColor || typeof hexColor !== 'string') {
    return '#475569';
  }

  let hex = hexColor.replace('#', '').trim();

  if (hex.length === 3) {
    hex = hex.split('').map((char) => char + char).join('');
  }

  if (hex.length !== 6 || /[^0-9a-f]/i.test(hex)) {
    return '#475569';
  }

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const adjustChannelValue = (channel: number) => {
    if (amount >= 0) {
      return clampChannel(Math.round(channel + (255 - channel) * amount));
    }
    return clampChannel(Math.round(channel * (1 + amount)));
  };

  const nextR = adjustChannelValue(r);
  const nextG = adjustChannelValue(g);
  const nextB = adjustChannelValue(b);

  return `#${nextR.toString(16).padStart(2, '0')}${nextG.toString(16).padStart(2, '0')}${nextB.toString(16).padStart(2, '0')}`;
};

export const toTitleCase = (value: any) => {
  if (!value || typeof value !== 'string') {
    return '';
  }
  return value
    .split(/\s|_/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
};

const clampChannel = (value: number) => Math.max(0, Math.min(255, value));

// Helper function to calculate tooltip position
const getTooltipPosition = (event: React.MouseEvent | MouseEvent): TooltipPosition => {
  const nativeEvent = 'nativeEvent' in event ? event.nativeEvent : event;
  
  const pageX = typeof nativeEvent.pageX === 'number' ? nativeEvent.pageX : 
    (typeof nativeEvent.clientX === 'number' && typeof window !== 'undefined' && window.scrollX !== undefined
      ? nativeEvent.clientX + window.scrollX
      : 0);
  
  const pageY = typeof nativeEvent.pageY === 'number' ? nativeEvent.pageY :
    (typeof nativeEvent.clientY === 'number' && typeof window !== 'undefined' && window.scrollY !== undefined
      ? nativeEvent.clientY + window.scrollY
      : 0);

  // Offset tooltip slightly from cursor
  const offset = 15;
  
  return {
    top: pageY + offset,
    left: pageX + offset
  };
};

export default WarehouseTooltip;
