#!/usr/bin/env node

/**
 * Icon Generation Script for MAGK Excel
 * 
 * This script helps generate different icon formats from a source image.
 * Requires ImageMagick to be installed on the system.
 * 
 * Usage:
 *   node scripts/generate-icons.js <source-image>
 * 
 * Example:
 *   node scripts/generate-icons.js ../assets/magk-logo.png
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ICONS_DIR = path.join(__dirname, '../public/icons');

function checkImageMagick() {
  try {
    execSync('convert --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    console.error('❌ ImageMagick not found. Please install ImageMagick first.');
    console.error('   Windows: https://imagemagick.org/script/download.php#windows');
    console.error('   macOS: brew install imagemagick');
    console.error('   Linux: sudo apt-get install imagemagick');
    return false;
  }
}

function createIconsDir() {
  if (!fs.existsSync(ICONS_DIR)) {
    fs.mkdirSync(ICONS_DIR, { recursive: true });
    console.log('✅ Created icons directory');
  }
}

function generateIcons(sourceImage) {
  if (!fs.existsSync(sourceImage)) {
    console.error(`❌ Source image not found: ${sourceImage}`);
    return false;
  }

  console.log(`🔄 Generating icons from: ${sourceImage}`);

  try {
    // Generate Windows ICO (multiple sizes)
    console.log('📱 Generating Windows ICO...');
    execSync(`convert "${sourceImage}" -resize 256x256 -define icon:auto-resize=256,48,32,16 "${path.join(ICONS_DIR, 'icon.ico')}"`);

    // Generate Linux PNG
    console.log('🐧 Generating Linux PNG...');
    execSync(`convert "${sourceImage}" -resize 512x512 "${path.join(ICONS_DIR, 'icon.png')}"`);

    // Generate web favicons
    console.log('🌐 Generating web favicons...');
    execSync(`convert "${sourceImage}" -resize 16x16 "${path.join(ICONS_DIR, 'favicon-16x16.png')}"`);
    execSync(`convert "${sourceImage}" -resize 32x32 "${path.join(ICONS_DIR, 'favicon-32x32.png')}"`);
    execSync(`convert "${sourceImage}" -resize 180x180 "${path.join(ICONS_DIR, 'apple-touch-icon.png')}"`);

    // Copy SVG if source is SVG
    if (sourceImage.toLowerCase().endsWith('.svg')) {
      fs.copyFileSync(sourceImage, path.join(ICONS_DIR, 'favicon.svg'));
      console.log('📄 Copied SVG favicon');
    }

    console.log('✅ All icons generated successfully!');
    console.log('\n📁 Generated files:');
    console.log('  - icon.ico (Windows)');
    console.log('  - icon.png (Linux)');
    console.log('  - favicon-16x16.png (Web)');
    console.log('  - favicon-32x32.png (Web)');
    console.log('  - apple-touch-icon.png (iOS)');
    
    if (sourceImage.toLowerCase().endsWith('.svg')) {
      console.log('  - favicon.svg (Web)');
    }

    console.log('\n⚠️  Note: For macOS .icns file, you need to:');
    console.log('   1. Create an .iconset folder with multiple PNG sizes');
    console.log('   2. Use iconutil -c icns icon.iconset');
    console.log('   3. Or use a macOS-specific tool like Icon Composer');

    return true;
  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
    return false;
  }
}

function main() {
  const sourceImage = process.argv[2];

  if (!sourceImage) {
    console.log('📋 Icon Generation Script for MAGK Excel');
    console.log('');
    console.log('Usage: node scripts/generate-icons.js <source-image>');
    console.log('');
    console.log('Example:');
    console.log('  node scripts/generate-icons.js ../assets/magk-logo.png');
    console.log('  node scripts/generate-icons.js ../assets/magk-logo.svg');
    console.log('');
    console.log('Requirements:');
    console.log('  - ImageMagick must be installed');
    console.log('  - Source image should be at least 512x512 pixels');
    console.log('  - PNG, JPG, or SVG format supported');
    return;
  }

  if (!checkImageMagick()) {
    return;
  }

  createIconsDir();
  generateIcons(sourceImage);
}

// Check if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { generateIcons, checkImageMagick };
