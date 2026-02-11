const GRID_SIZE = 60;

const COMPONENT_CONFIG = {
  storage_unit: {
    label: 'Storage Unit',
    color: '#4CAF50',
    type: 'single',
    maxPerCompartment: 1
  },
  spare_unit: {
    label: 'Spare Unit',
    color: '#8D6E63',
    type: 'single',
    maxPerCompartment: 1
  },
  sku_holder: {
    label: 'Horizontal Storage Rack',
    color: 'transparent',
    type: 'rack',
    maxPerCompartment: 1
  },
  vertical_sku_holder: {
    label: 'Vertical Storage Rack',
    color: 'transparent',
    type: 'rack',
    maxPerCompartment: 1
  }
};

const normalizeValue = (value: any): string => {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string') {
    return value.trim();
  }

  return String(value).trim();
};

const addIdentifier = (set: Set<string>, value: any) => {
  const normalized = normalizeValue(value);
  if (normalized) {
    set.add(normalized);
  }
};

const collectBaseIdentifiers = (item: any, locations: Set<string>, skus: Set<string>) => {
  addIdentifier(locations, item.locationId);
  addIdentifier(locations, item.primaryLocationId);
  addIdentifier(locations, item.locationCode);

  if (Array.isArray(item.locationIds)) {
    item.locationIds.forEach((id: any) => addIdentifier(locations, id));
  }

  if (Array.isArray(item.levelLocationMappings)) {
    item.levelLocationMappings.forEach((mapping: any) => addIdentifier(locations, mapping?.locationId));
  }

  addIdentifier(skus, item.sku);
  addIdentifier(skus, item.primarySku);

  if (item.inventoryData) {
    const { inventory, skuData, primaryLocationId } = item.inventoryData;
    addIdentifier(locations, primaryLocationId);

    if (Array.isArray(inventory)) {
      inventory.forEach((entry) => {
        addIdentifier(skus, entry?.sku || entry?.id || entry?.name);
        addIdentifier(locations, entry?.locationId || entry?.location);
      });
    }

    if (Array.isArray(skuData)) {
      skuData.forEach((entry) => addIdentifier(skus, entry?.sku || entry?.id));
    }
  }
};

const collectCompartmentData = (content: any, locations: Set<string>, skus: Set<string>) => {
  if (!content || typeof content !== 'object') {
    return;
  }

  if (content.isMultiLocation && Array.isArray(content.locationIds)) {
    content.locationIds.forEach((id: any) => addIdentifier(locations, id));
  } else {
    addIdentifier(locations, content.locationId || content.uniqueId);
  }

  if (Array.isArray(content.levelLocationMappings)) {
    content.levelLocationMappings.forEach((mapping: any) => addIdentifier(locations, mapping?.locationId));
  }

  addIdentifier(skus, content.sku);
  addIdentifier(skus, content.primarySku);

  if (Array.isArray(content.skuList)) {
    content.skuList.forEach((sku: any) => addIdentifier(skus, sku));
  }
};

const deriveItemMetrics = (item: any, index: number, typeIndexMap: Record<string, number>) => {
  const config = (COMPONENT_CONFIG as Record<string, any>)[item.type];
  if (!config) {
    return null;
  }

  const locations = new Set<string>();
  const skus = new Set<string>();

  collectBaseIdentifiers(item, locations, skus);

  let maxCapacity = 0;
  let usedCapacity = 0;

  if (config.type === 'rack') {
    const width = Number(item.width) || GRID_SIZE;
    const height = Number(item.height) || GRID_SIZE;

    const cols = Math.max(1, Math.round(width / GRID_SIZE));
    const rows = Math.max(1, Math.round(height / GRID_SIZE));
    const compartments = cols * rows;

    const maxPerCompartment = item.maxSKUsPerCompartment || config.maxPerCompartment || 1;
    maxCapacity = compartments * maxPerCompartment;

    if (item.compartmentContents && typeof item.compartmentContents === 'object') {
      Object.values(item.compartmentContents).forEach((content: any) => {
        collectCompartmentData(content, locations, skus);

        let quantity = 1;

        if (typeof (content as any)?.quantity === 'number' && (content as any).quantity > 0) {
          quantity = (content as any).quantity;
        } else if (Array.isArray((content as any)?.locationIds)) {
          quantity = Math.max(1, (content as any).locationIds.length);
        } else if (Array.isArray((content as any)?.levelLocationMappings)) {
          quantity = Math.max(1, (content as any).levelLocationMappings.length);
        }

        usedCapacity += quantity;
      });
    }

    usedCapacity = Math.min(maxCapacity, usedCapacity);
  } else {
    maxCapacity = 1;

    const hasInventoryData = item.inventoryData && typeof item.inventoryData === 'object';
    if (hasInventoryData) {
      const { inventory, utilization } = item.inventoryData;
      if (Array.isArray(inventory) && inventory.length > 0) {
        usedCapacity = 1;
      } else if (typeof utilization === 'number' && utilization > 0) {
        usedCapacity = 1;
      }
    }

    if (!usedCapacity) {
      const hasIdentifier = normalizeValue(item.locationId) || normalizeValue(item.primaryLocationId) || normalizeValue(item.sku);
      if (hasIdentifier) {
        usedCapacity = 1;
      }
    }
  }

  const availableCapacity = Math.max(0, maxCapacity - usedCapacity);

  const orderIndex = (typeIndexMap[item.type] || 0) + 1;
  typeIndexMap[item.type] = orderIndex;

  const nameCandidate = normalizeValue(item.name) || normalizeValue(item.label);
  const fallbackTitle = `${config.label} ${orderIndex}`;
  const title = nameCandidate || fallbackTitle;

  const primaryLocation = Array.from(locations).find(Boolean) || '';

  return {
    id: item.id || `component-${index}`,
    type: item.type,
    label: config.label,
    color: config.color,
    title,
    subtitle: primaryLocation,
    maxCapacity,
    usedCapacity,
    availableCapacity,
    locationIds: Array.from(locations).filter(Boolean),
    skus: Array.from(skus).filter(Boolean)
  };
};

export const summarizeStorageComponents = (items: any[] = []): any[] => {
  const summaries: any[] = [];
  const typeIndexMap: Record<string, number> = {};

  items.forEach((item, index) => {
    const metrics = deriveItemMetrics(item, index, typeIndexMap);
    if (!metrics) {
      return;
    }

    summaries.push(metrics);
  });

  return summaries.sort((a, b) => a.label.localeCompare(b.label) || a.title.localeCompare(b.title));
};

export default summarizeStorageComponents;
