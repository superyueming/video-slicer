#!/bin/bash

# Script to push v1.2.0 tag to GitHub and trigger automatic build

set -e

echo "=========================================="
echo "Pushing v1.2.0 Tag to GitHub"
echo "=========================================="

cd /home/ubuntu/video-slicer-web

# Check if tag exists
if ! git tag -l | grep -q "^v1.2.0$"; then
    echo "Creating tag v1.2.0..."
    git tag v1.2.0
fi

echo ""
echo "Tag v1.2.0 exists. Ready to push."
echo ""
echo "To push the tag and trigger GitHub Actions build:"
echo ""
echo "  git push origin v1.2.0"
echo ""
echo "This will trigger the build workflow at:"
echo "  https://github.com/superyueming/video-slicer/actions"
echo ""
echo "The workflow will:"
echo "  1. Build the Windows installer (.exe)"
echo "  2. Create a GitHub Release"
echo "  3. Upload the installer as a release asset"
echo ""
echo "Build time: approximately 10-15 minutes"
echo ""
echo "After the build completes, you can download the installer from:"
echo "  https://github.com/superyueming/video-slicer/releases/tag/v1.2.0"
echo ""
