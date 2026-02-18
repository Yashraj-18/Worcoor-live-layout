# Storage Rack Status-Based Border Colors - Test Guide

## Overview
This test demonstrates the capacity-based border color system for individual compartments in Horizontal and Vertical Storage Racks.

## Test Scenario: 7×7 Storage Rack with Mixed Capacity Status

### Test Setup

#### 1. Create a Horizontal Storage Rack
- Size: 7 rows × 7 columns (420×420px)
- Total Compartments: 49

#### 2. Apply Test Data to Compartments

Add the following test data to demonstrate all status colors:

```javascript
// Test compartment data structure
const testCompartmentData = {
  // Row 1 - Full Capacity (Green borders)
  "0-0": { locationId: "LOC-001", capacityStatus: "full" },
  "0-1": { locationId: "LOC-002", capacityStatus: "full" },
  "0-2": { locationId: "LOC-003", capacityStatus: "full" },
  "0-3": { locationId: "LOC-004", capacityStatus: "full" },
  "0-4": { locationId: "LOC-005", capacityStatus: "full" },
  "0-5": { locationId: "LOC-006", capacityStatus: "full" },
  "0-6": { locationId: "LOC-007", capacityStatus: "full" },
  
  // Row 2 - Partially Used (Orange borders)
  "1-0": { locationId: "LOC-008", capacityStatus: "partial" },
  "1-1": { locationId: "LOC-009", capacityStatus: "partial" },
  "1-2": { locationId: "LOC-010", capacityStatus: "partial" },
  "1-3": { locationId: "LOC-011", capacityStatus: "partial" },
  "1-4": { locationId: "LOC-012", capacityStatus: "partial" },
  "1-5": { locationId: "LOC-013", capacityStatus: "partial" },
  "1-6": { locationId: "LOC-014", capacityStatus: "partial" },
  
  // Row 3 - Empty (Red borders)
  "2-0": { locationId: "LOC-015", capacityStatus: "empty" },
  "2-1": { locationId: "LOC-016", capacityStatus: "empty" },
  "2-2": { locationId: "LOC-017", capacityStatus: "empty" },
  "2-3": { locationId: "LOC-018", capacityStatus: "empty" },
  "2-4": { locationId: "LOC-019", capacityStatus: "empty" },
  "2-5": { locationId: "LOC-020", capacityStatus: "empty" },
  "2-6": { locationId: "LOC-021", capacityStatus: "empty" },
  
  // Row 4 - Unknown/No Backend Data (Black borders)
  "3-0": { locationId: "LOC-022", capacityStatus: "unknown" },
  "3-1": { locationId: "LOC-023", capacityStatus: "unknown" },
  "3-2": { locationId: "LOC-024", capacityStatus: "unknown" },
  "3-3": { locationId: "LOC-025" }, // No capacityStatus = defaults to black
  "3-4": { locationId: "LOC-026" }, // No capacityStatus = defaults to black
  "3-5": { locationId: "LOC-027" }, // No capacityStatus = defaults to black
  "3-6": { locationId: "LOC-028" }, // No capacityStatus = defaults to black
  
  // Row 5 - Mixed Status (Demonstrates all colors together)
  "4-0": { locationId: "LOC-029", capacityStatus: "full" },
  "4-1": { locationId: "LOC-030", capacityStatus: "partial" },
  "4-2": { locationId: "LOC-031", capacityStatus: "empty" },
  "4-3": { locationId: "LOC-032" }, // No status = black
  "4-4": { locationId: "LOC-033", capacityStatus: "full" },
  "4-5": { locationId: "LOC-034", capacityStatus: "partial" },
  "4-6": { locationId: "LOC-035", capacityStatus: "empty" },
  
  // Row 6 - Vacant Compartments (Thin black borders)
  // No data = shows "+" symbol with 1px black border
  
  // Row 7 - Vacant Compartments (Thin black borders)
  // No data = shows "+" symbol with 1px black border
};
```

### Expected Visual Results

#### Border Colors by Status:

| Status | Border Style | Color Code | Visual |
|--------|-------------|------------|---------|
| **Full Capacity** | 2px solid | #4CAF50 | 🟢 Green |
| **Partially Used** | 2px solid | #FF9800 | 🟠 Orange |
| **Empty** | 2px solid | #F44336 | 🔴 Red |
| **Unknown/No Data** | 2px solid | #000000 | ⚫ Black (thick) |
| **Vacant** | 1px solid | #000000 | ⚫ Black (thin) |

#### Visual Layout:

```
Row 1: [🟢][🟢][🟢][🟢][🟢][🟢][🟢]  ← All Full (Green)
Row 2: [🟠][🟠][🟠][🟠][🟠][🟠][🟠]  ← All Partial (Orange)
Row 3: [🔴][🔴][🔴][🔴][🔴][🔴][🔴]  ← All Empty (Red)
Row 4: [⚫][⚫][⚫][⚫][⚫][⚫][⚫]  ← No Backend Data (Black thick)
Row 5: [🟢][🟠][🔴][⚫][🟢][🟠][🔴]  ← Mixed Status
Row 6: [+][+][+][+][+][+][+]  ← Vacant (Black thin)
Row 7: [+][+][+][+][+][+][+]  ← Vacant (Black thin)
```

## How to Apply Test Data

### Method 1: Manual Testing (Layout Builder)

1. **Create Storage Rack:**
   - Drag "Horizontal Storage Rack" from component panel
   - Resize to 7×7 (420×420px)

2. **Assign Location IDs:**
   - Click each compartment
   - Assign location IDs as per test data above

3. **Simulate Backend Data:**
   - Open browser console
   - Run the following script:

```javascript
// Find the storage rack item
const rackId = 'YOUR_RACK_ID_HERE'; // Replace with actual rack ID

// Get current items
const items = JSON.parse(localStorage.getItem('warehouseItems') || '[]');
const rack = items.find(item => item.id === rackId);

if (rack && rack.compartmentContents) {
  // Apply test capacity statuses
  Object.keys(rack.compartmentContents).forEach(compartmentId => {
    const [row, col] = compartmentId.split('-').map(Number);
    
    // Apply status based on row
    if (row === 0) rack.compartmentContents[compartmentId].capacityStatus = 'full';
    else if (row === 1) rack.compartmentContents[compartmentId].capacityStatus = 'partial';
    else if (row === 2) rack.compartmentContents[compartmentId].capacityStatus = 'empty';
    else if (row === 3) rack.compartmentContents[compartmentId].capacityStatus = 'unknown';
    else if (row === 4) {
      // Mixed status for row 5
      if (col === 0 || col === 4) rack.compartmentContents[compartmentId].capacityStatus = 'full';
      else if (col === 1 || col === 5) rack.compartmentContents[compartmentId].capacityStatus = 'partial';
      else if (col === 2 || col === 6) rack.compartmentContents[compartmentId].capacityStatus = 'empty';
      else rack.compartmentContents[compartmentId].capacityStatus = 'unknown';
    }
  });
  
  // Save back to localStorage
  localStorage.setItem('warehouseItems', JSON.stringify(items));
  
  // Reload page to see changes
  window.location.reload();
}
```

### Method 2: Programmatic Testing (Component Test)

Create a test component file:

```typescript
// StorageRackStatusTest.tsx
import React from 'react';

const StorageRackStatusTest = () => {
  const testRack = {
    id: 'test-rack-1',
    type: 'sku_holder',
    name: 'Horizontal Storage Rack',
    x: 100,
    y: 100,
    width: 420,
    height: 420,
    skuGrid: true,
    showCompartments: true,
    compartmentContents: {
      // Full capacity row (Green)
      "0-0": { locationId: "LOC-001", capacityStatus: "full" },
      "0-1": { locationId: "LOC-002", capacityStatus: "full" },
      "0-2": { locationId: "LOC-003", capacityStatus: "full" },
      "0-3": { locationId: "LOC-004", capacityStatus: "full" },
      "0-4": { locationId: "LOC-005", capacityStatus: "full" },
      "0-5": { locationId: "LOC-006", capacityStatus: "full" },
      "0-6": { locationId: "LOC-007", capacityStatus: "full" },
      
      // Partial capacity row (Orange)
      "1-0": { locationId: "LOC-008", capacityStatus: "partial" },
      "1-1": { locationId: "LOC-009", capacityStatus: "partial" },
      "1-2": { locationId: "LOC-010", capacityStatus: "partial" },
      "1-3": { locationId: "LOC-011", capacityStatus: "partial" },
      "1-4": { locationId: "LOC-012", capacityStatus: "partial" },
      "1-5": { locationId: "LOC-013", capacityStatus: "partial" },
      "1-6": { locationId: "LOC-014", capacityStatus: "partial" },
      
      // Empty row (Red)
      "2-0": { locationId: "LOC-015", capacityStatus: "empty" },
      "2-1": { locationId: "LOC-016", capacityStatus: "empty" },
      "2-2": { locationId: "LOC-017", capacityStatus: "empty" },
      "2-3": { locationId: "LOC-018", capacityStatus: "empty" },
      "2-4": { locationId: "LOC-019", capacityStatus: "empty" },
      "2-5": { locationId: "LOC-020", capacityStatus: "empty" },
      "2-6": { locationId: "LOC-021", capacityStatus: "empty" },
      
      // Unknown/No data row (Black)
      "3-0": { locationId: "LOC-022", capacityStatus: "unknown" },
      "3-1": { locationId: "LOC-023", capacityStatus: "unknown" },
      "3-2": { locationId: "LOC-024", capacityStatus: "unknown" },
      "3-3": { locationId: "LOC-025" },
      "3-4": { locationId: "LOC-026" },
      "3-5": { locationId: "LOC-027" },
      "3-6": { locationId: "LOC-028" },
      
      // Mixed status row
      "4-0": { locationId: "LOC-029", capacityStatus: "full" },
      "4-1": { locationId: "LOC-030", capacityStatus: "partial" },
      "4-2": { locationId: "LOC-031", capacityStatus: "empty" },
      "4-3": { locationId: "LOC-032" },
      "4-4": { locationId: "LOC-033", capacityStatus: "full" },
      "4-5": { locationId: "LOC-034", capacityStatus: "partial" },
      "4-6": { locationId: "LOC-035", capacityStatus: "empty" },
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Storage Rack Status-Based Border Colors Test</h2>
      <p>This test demonstrates capacity-based border colors on individual compartments.</p>
      
      <div style={{ marginTop: '20px' }}>
        <h3>Legend:</h3>
        <ul>
          <li>🟢 <strong>Green (2px):</strong> Full Capacity</li>
          <li>🟠 <strong>Orange (2px):</strong> Partially Used</li>
          <li>🔴 <strong>Red (2px):</strong> Empty</li>
          <li>⚫ <strong>Black Thick (2px):</strong> No Backend Data</li>
          <li>⚫ <strong>Black Thin (1px):</strong> Vacant Compartment</li>
        </ul>
      </div>
      
      {/* Render the test rack here with WarehouseItem component */}
    </div>
  );
};

export default StorageRackStatusTest;
```

## Verification Checklist

- [ ] **Row 1 (Full):** All 7 compartments show GREEN borders (2px)
- [ ] **Row 2 (Partial):** All 7 compartments show ORANGE borders (2px)
- [ ] **Row 3 (Empty):** All 7 compartments show RED borders (2px)
- [ ] **Row 4 (Unknown):** All 7 compartments show BLACK thick borders (2px)
- [ ] **Row 5 (Mixed):** Shows mix of Green, Orange, Red, and Black borders
- [ ] **Row 6 (Vacant):** All 7 compartments show BLACK thin borders (1px) with "+"
- [ ] **Row 7 (Vacant):** All 7 compartments show BLACK thin borders (1px) with "+"

## Test for Vertical Storage Rack

Repeat the same test with a Vertical Storage Rack:
- Create "Vertical Storage Rack" instead
- Apply same test data structure
- Verify same border color behavior
- Test with L1, L2, L3 location ID format

## Backend Integration Test

Once backend is integrated, verify:
1. Capacity data flows correctly to `compartmentData.capacityStatus`
2. Border colors update automatically when capacity changes
3. Real-time updates work correctly
4. All 4 status types (full, partial, empty, unknown) render correctly

## Notes

- Border colors are defined in: `lib/warehouse/config/componentStatusColor.ts`
- Compartment rendering logic: `components/warehouse/WarehouseItem.tsx` (line ~541-549)
- To change colors, update `CAPACITY_BORDER_COLORS` in `componentStatusColor.ts`
