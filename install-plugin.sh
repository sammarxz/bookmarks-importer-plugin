#!/bin/bash

# Script para instalar o plugin Bookmarks Importer no Obsidian

echo "🔨 Building plugin..."
npm run build-plugin

if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    
    # Verificar se a pasta dist existe e contém os arquivos necessários
    if [ -f "dist/main.js" ] && [ -f "dist/manifest.json" ] && [ -f "dist/styles.css" ]; then
        echo "📁 Files ready in dist/ folder:"
        ls -la dist/
        echo ""
        echo "📋 To install in Obsidian:"
        echo "1. Copy the entire 'dist' folder contents"
        echo "2. Paste into: ~/.obsidian/plugins/bookmarks-importer/"
        echo "   (or your vault's .obsidian/plugins/bookmarks-importer/ folder)"
        echo "3. Restart Obsidian and enable the plugin"
        echo ""
        echo "💡 The dist/ folder contains all files needed for production:"
        echo "   - main.js (compiled plugin code)"
        echo "   - manifest.json (plugin metadata)"
        echo "   - styles.css (plugin styles)"
    else
        echo "❌ Error: Missing files in dist/ folder"
        exit 1
    fi
else
    echo "❌ Build failed!"
    exit 1
fi