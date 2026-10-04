#!/bin/bash

# Deployment Script für mxster.celox.io PWA
# Usage: ./deploy.sh

set -e  # Exit on error

APP_NAME="mxster"
VPS_HOST="root@69.62.121.168"
VPS_ROOT="/var/www/html/$APP_NAME"

echo "🚀 Deploying mxster.celox.io PWA..."

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

    # Backup audio directory if exists
    if [ -d \"$VPS_ROOT/audio\" ]; then
        echo \"💾 Backing up audio directory...\"
        sudo mv $VPS_ROOT/audio /tmp/audio-backup-$$
    fi

    # Remove old files (but keep audio)
    sudo rm -rf $VPS_ROOT/*

    # Copy new files
    sudo cp -r /tmp/$APP_NAME-deploy/* $VPS_ROOT/

    # Restore audio directory
    if [ -d \"/tmp/audio-backup-$$\" ]; then
        echo \"♻️ Restoring audio directory...\"
        sudo mv /tmp/audio-backup-$$ $VPS_ROOT/audio
    fi

    # Set correct permissions
    sudo chown -R www-data:www-data $VPS_ROOT
    sudo chmod -R 755 $VPS_ROOT

    # Cleanup temp files
    rm -rf /tmp/$APP_NAME-deploy
"

echo "✅ Deployment complete!"
echo ""
echo "ℹ️  nginx vHost: /etc/nginx/sites-available/mxster.celox.io (root $VPS_ROOT, audio/ wird nie angefasst)"
echo "🌐 Live: https://mxster.celox.io"
