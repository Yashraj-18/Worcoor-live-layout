# Component Images Directory

This directory contains images used to enhance visualization in the warehouse layout builder.

## Directory Structure

```
assets/images/
├── components/          # Component-specific images
│   ├── fire-exit/       # Fire exit images
│   ├── storage/         # Storage unit/rack images
│   ├── safety/          # Safety feature images
│   └── zones/           # Zone and area images
├── icons/              # Icon images for component panel
│   ├── svg/            # SVG icons
│   ├── png/            # PNG icons
│   └── optimized/      # Optimized icon versions
└── textures/           # Background textures and patterns
    ├── floors/         # Floor textures
    ├── walls/          # Wall textures
    └── patterns/       # Pattern overlays
```

## Usage Guidelines

### Component Panel Images
- **Format**: PNG or SVG
- **Size**: 32x32px for icons, 64x64px for thumbnails
- **Purpose**: Enhanced visual representation in component palette

### Canvas Images
- **Format**: PNG with transparency
- **Size**: Scalable (vector preferred) or high-resolution raster
- **Purpose**: In-canvas component visualization

### File Naming Convention
- **Icons**: `{component-type}-icon.{ext}` (e.g., `fire-exit-icon.svg`)
- **Textures**: `{texture-name}-{size}.{ext}` (e.g., `concrete-floor-512.png`)
- **Components**: `{component-name}-{variant}.{ext}` (e.g., `storage-unit-blue.png`)

## Supported Image Formats

### Recommended
- **SVG**: Vector graphics, scalable, lightweight
- **PNG**: Raster with transparency support
- **WebP**: Modern format with good compression

### File Size Guidelines
- **Icons**: < 10KB
- **Component Images**: < 50KB
- **Textures**: < 200KB

## Integration Points

### Component Panel
Images will be referenced in `warehouseComponents.ts`:
```typescript
{
  type: COMPONENT_TYPES.FIRE_EXIT_MARKING,
  name: "Fire Exit Marking",
  icon: "/assets/images/icons/svg/fire-exit-icon.svg",
  thumbnail: "/assets/images/components/fire-exit/fire-exit-thumbnail.png",
  // ...
}
```

### Canvas Rendering
Images will be loaded in `WarehouseItem.js`:
```javascript
<img 
  src={`/assets/images/components/${componentType}/${imageName}`}
  alt={componentName}
  style={imageStyles}
/>
```

## Image Categories

### Safety Components
- Fire exits
- Emergency routes
- Safety equipment
- Warning signs

### Storage Components
- Storage units
- Racks and shelves
- Containers
- Specialized storage

### Facility Components
- Office areas
- Common areas
- Equipment
- Infrastructure

### Textures
- Floor types (concrete, epoxy, carpet)
- Wall types (drywall, brick, metal)
- Surface patterns
- Material representations

## Performance Considerations

- Use optimized image formats
- Implement lazy loading for large image sets
- Consider image sprites for small icons
- Cache images for better performance
- Use responsive image sizing

## Browser Compatibility

All images should work across modern browsers:
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Maintenance

- Regular image optimization
- Consistent naming conventions
- Proper file organization
- Documentation updates
- Performance monitoring
