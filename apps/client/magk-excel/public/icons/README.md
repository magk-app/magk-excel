# MAGK Excel Icon Requirements

This directory contains all icon assets for the MAGK Excel application.

## Required Icon Files

### Desktop Application Icons
- `icon.ico` - Windows desktop icon (256x256, 48x48, 32x32, 16x16)
- `icon.icns` - macOS desktop icon (1024x1024, 512x512, 256x256, 128x128, 64x64, 32x32, 16x16)
- `icon.png` - Linux desktop icon (512x512)

### Web Browser Icons
- `favicon.svg` - Scalable vector favicon
- `favicon-16x16.png` - Small favicon (16x16)
- `favicon-32x32.png` - Standard favicon (32x32)
- `apple-touch-icon.png` - iOS Safari icon (180x180)

## Icon Specifications

### Design Guidelines
- **Primary Color**: Use MAGK brand colors
- **Style**: Modern, clean, professional
- **Format**: Vector-based design recommended for scalability
- **Background**: Transparent or solid brand color
- **Text**: "MAGK" or "MAGK Excel" if including text

### Technical Requirements

#### Windows (.ico)
- Multiple sizes: 16x16, 32x32, 48x48, 256x256
- 32-bit color depth
- Transparent background support

#### macOS (.icns)
- Multiple sizes: 16x16, 32x32, 64x64, 128x128, 256x256, 512x512, 1024x1024
- PNG format for each size
- Transparent background

#### Linux (.png)
- Single 512x512 PNG file
- Transparent background
- High quality for scaling

#### Web Icons
- SVG for scalability
- PNG fallbacks for older browsers
- Apple touch icon for iOS devices

## Tools for Icon Creation

### Recommended Tools
1. **Figma/Sketch** - Design the icon
2. **ImageMagick** - Convert between formats
3. **Icon Composer** (macOS) - Create .icns files
4. **Online converters** - For quick format conversion

### Conversion Commands
```bash
# Convert PNG to ICO (Windows)
convert icon.png -resize 256x256 icon.ico

# Convert PNG to ICNS (macOS)
iconutil -c icns icon.iconset

# Create multiple PNG sizes
convert icon.png -resize 16x16 favicon-16x16.png
convert icon.png -resize 32x32 favicon-32x32.png
convert icon.png -resize 180x180 apple-touch-icon.png
```

## File Structure
```
public/icons/
├── icon.ico          # Windows desktop icon
├── icon.icns         # macOS desktop icon
├── icon.png          # Linux desktop icon
├── favicon.svg       # Web favicon (vector)
├── favicon-16x16.png # Small web favicon
├── favicon-32x32.png # Standard web favicon
├── apple-touch-icon.png # iOS touch icon
└── README.md         # This file
```

## Testing
After adding icons:
1. Run `npm run build:win` to test Windows build
2. Run `npm run build:mac` to test macOS build
3. Run `npm run dev` to test web favicon
4. Check desktop shortcut icons after installation
