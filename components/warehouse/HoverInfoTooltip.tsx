// @ts-nocheck
'use client';

import React from 'react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';

const HoverInfoTooltip = ({ tooltip }) => {
  if (!tooltip || !tooltip.content) {
    return null;
  }

  const {
    top,
    left,
    content,
    variant = 'occupied'
  } = tooltip;

  return createPortal(
    <div
      className="hover-info-tooltip"
      style={{ top, left }}
      data-variant={variant}
    >
      {content}
    </div>,
    document.body
  );
};

HoverInfoTooltip.propTypes = {
  tooltip: PropTypes.shape({
    top: PropTypes.number,
    left: PropTypes.number,
    content: PropTypes.node,
    variant: PropTypes.oneOf(['occupied', 'empty'])
  })
};

HoverInfoTooltip.defaultProps = {
  tooltip: null
};

export default HoverInfoTooltip;

