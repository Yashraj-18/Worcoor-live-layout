// @ts-nocheck
'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import WarehouseTooltip, { TooltipData, useWarehouseTooltip } from './WarehouseTooltip';

interface TooltipContextType {
  showTooltip: (id: string, content: React.ReactNode, event: React.MouseEvent | MouseEvent, variant?: 'item' | 'compartment', priority?: number) => void;
  hideTooltip: (id?: string) => void;
  updateTooltipPosition: (event: React.MouseEvent | MouseEvent) => void;
  isVisible: boolean;
}

const TooltipContext = createContext<TooltipContextType | null>(null);

export const TooltipProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const tooltipHook = useWarehouseTooltip();

  const contextValue: TooltipContextType = {
    showTooltip: tooltipHook.showTooltip,
    hideTooltip: tooltipHook.hideTooltip,
    updateTooltipPosition: tooltipHook.updateTooltipPosition,
    isVisible: tooltipHook.isVisible
  };

  return (
    <TooltipContext.Provider value={contextValue}>
      {children}
      {tooltipHook.activeTooltip && (
        <WarehouseTooltip
          tooltip={tooltipHook.activeTooltip}
          onClose={() => tooltipHook.hideTooltip()}
        />
      )}
    </TooltipContext.Provider>
  );
};

export const useTooltip = (): TooltipContextType => {
  const context = useContext(TooltipContext);
  if (!context) {
    throw new Error('useTooltip must be used within a TooltipProvider');
  }
  return context;
};

export default TooltipProvider;
