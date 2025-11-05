#!/bin/bash

# Deployment Script für mxster.de PWA
# Usage: ./deploy.sh

set -e  # Exit on error

APP_NAME="mxster"
VPS_HOST="root@mrx3k1.de"
VPS_ROOT="/var/www/html/$APP_NAME"

echo "🚀 Deploying mxster.de PWA..."

# Get project root directory (from scripts/deployment/ to root)
PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PWA_DIR="$PROJECT_ROOT/pwa"

# Step 1: Build production bundle
echo "📦 Building production bundle..."
cd "$PWA_DIR"
npm run build

# Step 2: Create temporary directory on VPS
echo "📁 Creating temporary directory on VPS..."
ssh $VPS_HOST "mkdir -p /tmp/$APP_NAME-deploy"

# Step 3: Upload build files (exclude audio directory)
echo "📤 Uploading build files (excluding audio)..."
rsync -av --exclude='audio/' "$PWA_DIR/dist/" $VPS_HOST:/tmp/$APP_NAME-deploy/

# Step 4: Deploy to production directory
echo "🔄 Moving files to production..."
ssh $VPS_HOST "
    # Create production directory if it doesn't exist
    sudo mkdir -p $VPS_ROOT

    # Remove old files
    sudo rm -rf $VPS_ROOT/*

    # Copy new files
    sudo cp -r /tmp/$APP_NAME-deploy/* $VPS_ROOT/

    # Set correct permissions
    sudo chown -R www-data:www-data $VPS_ROOT
    sudo chmod -R 755 $VPS_ROOT

    # Cleanup temp files
    rm -rf /tmp/$APP_NAME-deploy
"

echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Configure Nginx on VPS (if not done yet):"
echo "   sudo nano /etc/nginx/sites-available/mxster.de"
echo "   sudo ln -s /etc/nginx/sites-available/mxster.de /etc/nginx/sites-enabled/"
echo ""
echo "2. Test Nginx configuration:"
echo "   sudo nginx -t"
echo ""
echo "3. Setup SSL certificate:"
echo "   sudo certbot --nginx -d mxster.de -d www.mxster.de"
echo ""
echo "4. Reload Nginx:"
echo "   sudo systemctl reload nginx"
echo ""
echo "5. Don't forget to add https://mxster.de/callback to Spotify Developer Dashboard!"
echo ""
echo "🌐 Your app should be live at: https://mxster.de"
