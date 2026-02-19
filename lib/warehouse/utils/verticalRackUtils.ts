// @ts-nocheck
export const countFromCompactLocation = (rawLocation) => {
  if (!rawLocation || typeof rawLocation !== 'string') {
    return null;
  }

  const match = rawLocation.match(/\+(\d+)/);
  if (!match) {
    return null;
  }

  const extra = parseInt(match[1], 10);
  if (Number.isNaN(extra) || extra < 0) {
    return null;
  }

  return {
    base: rawLocation.slice(0, rawLocation.indexOf('+')).trim() || rawLocation,
    extra
  };
};

export const getVerticalRackLevelCount = (item) => {
  if (!item) {
    return 0;
  }

  const mappingKeys = new Set();

  const recordMapping = (levelId, locationId) => {
    const normalizedLevel = levelId ? String(levelId).trim().toUpperCase() : '';
    const normalizedLocation = locationId ? String(locationId).trim().toUpperCase() : '';

    if (!normalizedLevel && !normalizedLocation) {
      return;
    }

    const key = `${normalizedLevel}|${normalizedLocation}`;
    mappingKeys.add(key);
  };

  const recordLocation = (levelId, locationId) => {
    const normalizedLevel = levelId ? String(levelId).trim() : '';
    const normalizedLocation = locationId ? String(locationId).trim() : '';

    if (!normalizedLevel && !normalizedLocation) {
      return;
    }

    const compactInfo = countFromCompactLocation(normalizedLocation);
    if (compactInfo) {
      const baseLevel = normalizedLevel || 'L1';
      const baseLocation = compactInfo.base;
      recordMapping(baseLevel, baseLocation);

      for (let index = 1; index <= compactInfo.extra; index += 1) {
        const derivedLevel = normalizedLevel ? `${normalizedLevel}-${index + 1}` : `L${index + 1}`;
        const derivedLocation = `${baseLocation}-${index + 1}`;
        recordMapping(derivedLevel, derivedLocation);
      }
      return;
    }

    recordMapping(normalizedLevel, normalizedLocation);
  };

  const processLevelArrays = (levelIds = [], locationIds = []) => {
    const maxLength = Math.max(levelIds.length, locationIds.length);
    for (let index = 0; index < maxLength; index += 1) {
      recordLocation(levelIds[index], locationIds[index]);
    }
  };

  const processMappings = (mappings = []) => {
    mappings.forEach((mapping) => {
      if (!mapping) return;
      recordLocation(mapping.levelId ?? mapping.level, mapping.locationId ?? mapping.locId);
    });
  };

  const processContent = (content = {}) => {
    if (!content) return;

    if (Array.isArray(content.levelLocationMappings) && content.levelLocationMappings.length > 0) {
      processMappings(content.levelLocationMappings);
    }

    const hasLevelArrays = Array.isArray(content.levelIds) || Array.isArray(content.locationIds);
    if (hasLevelArrays) {
      processLevelArrays(content.levelIds || [], content.locationIds || []);
    }

    if (content.isMultiLocation) {
      if (Array.isArray(content.locationIds) && content.locationIds.length > 0 && !hasLevelArrays) {
        content.locationIds.forEach((locationId, index) => {
          const derivedLevel = Array.isArray(content.tags) ? content.tags[index] : undefined;
          recordLocation(derivedLevel, locationId);
        });
      } else if (content.primaryLocationId && !hasLevelArrays) {
        recordLocation(content.primaryLocationId, content.primaryLocationId);
      }
    } else if (content.locationId || content.uniqueId) {
      recordLocation(content.levelId, content.locationId || content.uniqueId);
    }
  };

  if (item.compartmentContents && typeof item.compartmentContents === 'object') {
    Object.values(item.compartmentContents).forEach((content) => {
      processContent(content);
    });
  }

  if (mappingKeys.size === 0) {
    processMappings(item.levelLocationMappings);
  }

  if (mappingKeys.size === 0) {
    const hasLevelArrays = Array.isArray(item.levelIds) || Array.isArray(item.locationIds);
    if (hasLevelArrays) {
      processLevelArrays(item.levelIds || [], item.locationIds || []);
    }
  }

  if (mappingKeys.size === 0 && typeof item.locationId === 'string') {
    const trimmed = item.locationId.trim();
    if (trimmed) {
      const plusIndex = trimmed.indexOf('+');
      if (plusIndex !== -1) {
        const base = trimmed.slice(0, plusIndex);
        const extra = parseInt(trimmed.slice(plusIndex + 1), 10);
        recordLocation('L1', base);
        if (!Number.isNaN(extra) && extra > 0) {
          for (let index = 1; index <= extra; index += 1) {
            recordLocation(`L${index + 1}`, `${base}-${index}`);
          }
        }
      } else {
        recordLocation('L1', trimmed);
      }
    }
  }

  return mappingKeys.size;
};

export const inferVerticalRackLevelCount = (item) => {
  const computed = getVerticalRackLevelCount(item);
  if (computed > 0) {
    return computed;
  }

  const locationId = item && typeof item.locationId === 'string' ? item.locationId.trim() : '';
  const compactInfo = countFromCompactLocation(locationId);
  if (compactInfo) {
    return compactInfo.extra + 1;
  }

  return 0;
};
