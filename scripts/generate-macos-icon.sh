#!/bin/bash
# Script to generate macOS .icns file from PNG
# Usage: ./scripts/generate-macos-icon.sh

set -e

echo "🎨 Generating macOS icon (.icns) from logo.png..."

# Check if logo.png exists
if [ ! -f "public/icons/logo.png" ]; then
    echo "❌ Error: public/icons/logo.png not found!"
    exit 1
fi

# Check if running on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "✅ Running on macOS - using native iconutil"
    
    # Create iconset directory
    mkdir -p logo.iconset
    
    # Generate all required icon sizes using sips (macOS built-in tool)
    sips -z 16 16     public/icons/logo.png --out logo.iconset/icon_16x16.png
    sips -z 32 32     public/icons/logo.png --out logo.iconset/icon_16x16@2x.png
    sips -z 32 32     public/icons/logo.png --out logo.iconset/icon_32x32.png
    sips -z 64 64     public/icons/logo.png --out logo.iconset/icon_32x32@2x.png
    sips -z 128 128   public/icons/logo.png --out logo.iconset/icon_128x128.png
    sips -z 256 256   public/icons/logo.png --out logo.iconset/icon_128x128@2x.png
    sips -z 256 256   public/icons/logo.png --out logo.iconset/icon_256x256.png
    sips -z 512 512   public/icons/logo.png --out logo.iconset/icon_256x256@2x.png
    sips -z 512 512   public/icons/logo.png --out logo.iconset/icon_512x512.png
    sips -z 1024 1024 public/icons/logo.png --out logo.iconset/icon_512x512@2x.png
    
    # Convert to .icns using iconutil (macOS built-in tool)
    iconutil -c icns logo.iconset -o public/icons/logo.icns
    
    # Cleanup
    rm -rf logo.iconset
    
    echo "✅ Successfully generated public/icons/logo.icns"
    
elif command -v magick &> /dev/null || command -v convert &> /dev/null; then
    echo "✅ Using ImageMagick"
    
    # Determine ImageMagick command (newer versions use 'magick', older use 'convert')
    if command -v magick &> /dev/null; then
        MAGICK_CMD="magick"
    else
        MAGICK_CMD="convert"
    fi
    
    # Create iconset directory
    mkdir -p logo.iconset
    
    # Generate all required icon sizes
    $MAGICK_CMD public/icons/logo.png -resize 16x16 logo.iconset/icon_16x16.png
    $MAGICK_CMD public/icons/logo.png -resize 32x32 logo.iconset/icon_16x16@2x.png
    $MAGICK_CMD public/icons/logo.png -resize 32x32 logo.iconset/icon_32x32.png
    $MAGICK_CMD public/icons/logo.png -resize 64x64 logo.iconset/icon_32x32@2x.png
    $MAGICK_CMD public/icons/logo.png -resize 128x128 logo.iconset/icon_128x128.png
    $MAGICK_CMD public/icons/logo.png -resize 256x256 logo.iconset/icon_128x128@2x.png
    $MAGICK_CMD public/icons/logo.png -resize 256x256 logo.iconset/icon_256x256.png
    $MAGICK_CMD public/icons/logo.png -resize 512x512 logo.iconset/icon_256x256@2x.png
    $MAGICK_CMD public/icons/logo.png -resize 512x512 logo.iconset/icon_512x512.png
    $MAGICK_CMD public/icons/logo.png -resize 1024x1024 logo.iconset/icon_512x512@2x.png
    
    # Create multi-resolution .icns file
    $MAGICK_CMD logo.iconset/icon_*.png public/icons/logo.icns
    
    # Cleanup
    rm -rf logo.iconset
    
    echo "✅ Successfully generated public/icons/logo.icns"
    
else
    echo "❌ Error: Neither macOS iconutil nor ImageMagick found!"
    echo ""
    echo "Options:"
    echo "1. On macOS: iconutil is built-in, no installation needed"
    echo "2. On Linux/Windows: Install ImageMagick"
    echo "   - Ubuntu/Debian: sudo apt-get install imagemagick"
    echo "   - macOS: brew install imagemagick"
    echo "   - Windows: Download from https://imagemagick.org/"
    echo ""
    echo "3. Use online converter: https://cloudconvert.com/png-to-icns"
    echo "   Upload public/icons/logo.png and download as logo.icns"
    exit 1
fi

echo ""
echo "🎉 Icon generation complete!"
echo "📁 Location: public/icons/logo.icns"

