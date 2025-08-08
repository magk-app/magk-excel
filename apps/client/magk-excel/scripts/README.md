# Build Test Scripts

This directory contains platform-specific build test scripts for the MAGK Excel application.

## Available Scripts

### Windows (`test-win-build.bat`)
Tests the Windows build process and verifies all components are working correctly.

**Usage:**
```bash
npm run test:win
```

**What it tests:**
- ✅ Node.js and npm versions
- ✅ Dependency installation
- ✅ Test suite execution
- ✅ Application build
- ✅ Electron main process compilation
- ✅ Frontend build verification
- ✅ App launch test

### macOS (`test-mac-build.sh`)
Tests the macOS build process and creates distributable packages.

**Usage:**
```bash
npm run test:mac
```

**What it tests:**
- ✅ macOS environment verification
- ✅ Node.js and npm versions
- ✅ Dependency installation
- ✅ Test suite execution
- ✅ Application build
- ✅ macOS package creation (.dmg, .zip)
- ✅ Build artifact verification

## Build Commands

### Quick Development
```bash
# Build and run without packaging
npm run build:simple
npm start
```

### Platform-Specific Builds
```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux

# All platforms
npm run build:all
```

## Troubleshooting

### Windows Issues
- **Permission errors**: Use `npm run build:simple` instead
- **Code signing failures**: Run as Administrator or use portable builds
- **Cache issues**: Clear electron-builder cache

### macOS Issues
- **Xcode tools missing**: Run `xcode-select --install`
- **Code signing**: Set up Apple Developer account and certificates
- **Architecture issues**: Ensure building for correct architecture (x64/arm64)

### Linux Issues
- **Missing dependencies**: Install build essentials and GTK libraries
- **AppImage issues**: Ensure FUSE is installed and enabled

## Output Locations

- **Development build**: `dist/` and `dist-electron/`
- **Windows packages**: `release/[version]/MAGK-Excel-Windows-[version]-x64.*`
- **macOS packages**: `release/[version]/MAGK-Excel-Mac-[version]-[arch].*`
- **Linux packages**: `release/[version]/MAGK-Excel-Linux-[version]-x64.*`

## CI/CD Integration

These scripts can be used in CI/CD pipelines:

```yaml
# GitHub Actions example
- name: Test Windows Build
  run: npm run test:win
  if: matrix.os == 'windows-latest'

- name: Test macOS Build
  run: npm run test:mac
  if: matrix.os == 'macos-latest'
```
