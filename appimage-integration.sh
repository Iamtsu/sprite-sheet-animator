#!/bin/bash
# Sprite Animation Editor AppImage Integration Script
# Integrates or removes the AppImage with/from Linux desktop environments
#
# Usage:
#   ./appimage-integration.sh install    - Install and integrate with desktop
#   ./appimage-integration.sh uninstall  - Remove integration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="Sprite Animation Editor"
APP_ID="sprite-animation-editor"
APPIMAGE_NAME="Sprite Animation Editor-1.0.0.AppImage"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APPIMAGE_PATH="$SCRIPT_DIR/dist/$APPIMAGE_NAME"

# Installation directories
INSTALL_DIR="$HOME/.local/bin"
APPLICATIONS_DIR="$HOME/.local/share/applications"
ICONS_DIR="$HOME/.local/share/icons/hicolor/512x512/apps"

# Function to show usage
show_usage() {
    echo -e "${BLUE}Usage:${NC}"
    echo "  $0 install    - Install and integrate AppImage with desktop"
    echo "  $0 uninstall  - Remove AppImage integration"
    echo ""
}

# Function to install
install_appimage() {
    echo -e "${GREEN}=== Sprite Animation Editor AppImage Installer ===${NC}"
    echo ""

    # Check if AppImage exists
    if [ ! -f "$APPIMAGE_PATH" ]; then
        echo -e "${RED}Error: AppImage not found at $APPIMAGE_PATH${NC}"
        echo "Please build the AppImage first using: npm run build:linux"
        exit 1
    fi

    # Check if AppImage is executable
    if [ ! -x "$APPIMAGE_PATH" ]; then
        echo -e "${YELLOW}Making AppImage executable...${NC}"
        chmod +x "$APPIMAGE_PATH"
    fi

    echo "Installing $APP_NAME..."
    echo ""

    # Create directories if they don't exist
    mkdir -p "$INSTALL_DIR"
    mkdir -p "$APPLICATIONS_DIR"
    mkdir -p "$ICONS_DIR"

    # Copy AppImage to local bin
    echo -e "${YELLOW}[1/4]${NC} Copying AppImage to $INSTALL_DIR..."
    cp "$APPIMAGE_PATH" "$INSTALL_DIR/$APP_ID.AppImage"
    chmod +x "$INSTALL_DIR/$APP_ID.AppImage"

    # Copy icon
    echo -e "${YELLOW}[2/4]${NC} Installing application icon..."
    if [ -f "$SCRIPT_DIR/resources/icon.png" ]; then
        cp "$SCRIPT_DIR/resources/icon.png" "$ICONS_DIR/$APP_ID.png"
    else
        echo -e "${YELLOW}Warning: Icon not found, using default${NC}"
    fi

    # Create .desktop file
    echo -e "${YELLOW}[3/4]${NC} Creating desktop entry..."
    cat > "$APPLICATIONS_DIR/$APP_ID.desktop" << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=$APP_NAME
Comment=A visual editor for creating sprite sheet animations
Exec=$INSTALL_DIR/$APP_ID.AppImage %F
Icon=$APP_ID
Terminal=false
Categories=Graphics;2DGraphics;RasterGraphics;
MimeType=image/png;image/jpeg;image/gif;image/webp;
Keywords=sprite;animation;editor;pixel;art;
StartupNotify=true
StartupWMClass=sprite-animation-editor
EOF

    chmod +x "$APPLICATIONS_DIR/$APP_ID.desktop"

    # Update desktop database
    echo -e "${YELLOW}[4/4]${NC} Updating desktop database..."
    if command -v update-desktop-database &> /dev/null; then
        update-desktop-database "$APPLICATIONS_DIR" 2>/dev/null || true
    fi

    # Update icon cache
    if command -v gtk-update-icon-cache &> /dev/null; then
        gtk-update-icon-cache -f -t "$HOME/.local/share/icons/hicolor" 2>/dev/null || true
    fi

    echo ""
    echo -e "${GREEN}✓ Installation complete!${NC}"
    echo ""
    echo "The application has been installed to: $INSTALL_DIR/$APP_ID.AppImage"
    echo "You can now launch it from your application menu or run: $APP_ID.AppImage"
    echo ""
    echo -e "${YELLOW}Optional:${NC} Add $INSTALL_DIR to your PATH to run from anywhere:"
    echo "  echo 'export PATH=\"\$HOME/.local/bin:\$PATH\"' >> ~/.bashrc"
    echo "  source ~/.bashrc"
    echo ""
    echo "To uninstall, run: $0 uninstall"
}

# Function to uninstall
uninstall_appimage() {
    echo -e "${GREEN}=== Sprite Animation Editor AppImage Uninstaller ===${NC}"
    echo ""

    # Check if installed
    if [ ! -f "$INSTALL_DIR/$APP_ID.AppImage" ] && [ ! -f "$APPLICATIONS_DIR/$APP_ID.desktop" ]; then
        echo -e "${YELLOW}$APP_NAME does not appear to be installed.${NC}"
        exit 0
    fi

    echo "Uninstalling $APP_NAME..."
    echo ""

    # Remove AppImage
    if [ -f "$INSTALL_DIR/$APP_ID.AppImage" ]; then
        echo -e "${YELLOW}[1/4]${NC} Removing AppImage..."
        rm -f "$INSTALL_DIR/$APP_ID.AppImage"
    else
        echo -e "${YELLOW}[1/4]${NC} AppImage not found (skipping)"
    fi

    # Remove desktop file
    if [ -f "$APPLICATIONS_DIR/$APP_ID.desktop" ]; then
        echo -e "${YELLOW}[2/4]${NC} Removing desktop entry..."
        rm -f "$APPLICATIONS_DIR/$APP_ID.desktop"
    else
        echo -e "${YELLOW}[2/4]${NC} Desktop entry not found (skipping)"
    fi

    # Remove icon
    if [ -f "$ICONS_DIR/$APP_ID.png" ]; then
        echo -e "${YELLOW}[3/4]${NC} Removing application icon..."
        rm -f "$ICONS_DIR/$APP_ID.png"
    else
        echo -e "${YELLOW}[3/4]${NC} Icon not found (skipping)"
    fi

    # Update desktop database
    echo -e "${YELLOW}[4/4]${NC} Updating desktop database..."
    if command -v update-desktop-database &> /dev/null; then
        update-desktop-database "$APPLICATIONS_DIR" 2>/dev/null || true
    fi

    # Update icon cache
    if command -v gtk-update-icon-cache &> /dev/null; then
        gtk-update-icon-cache -f -t "$HOME/.local/share/icons/hicolor" 2>/dev/null || true
    fi

    echo ""
    echo -e "${GREEN}✓ Uninstallation complete!${NC}"
    echo ""
    echo "$APP_NAME has been removed from your system."
}

# Main script logic
case "${1:-}" in
    install)
        install_appimage
        ;;
    uninstall)
        uninstall_appimage
        ;;
    *)
        echo -e "${RED}Error: Invalid or missing parameter${NC}"
        echo ""
        show_usage
        exit 1
        ;;
esac
