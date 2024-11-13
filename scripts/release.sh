#!/bin/bash

# Exit on error
set -e

# Function to check last command status
check_status() {
    if [ $? -ne 0 ]; then
        echo "Error: $1 failed"
        exit 1
    fi
}

# Prompt for new version
echo "Enter new version:"
read VERSION

if [ -z "$VERSION" ]; then
    echo "Error: Version cannot be empty"
    exit 1
fi

# Bump version using hatch
echo "Bumping version to $VERSION..."
hatch version $VERSION
check_status "Version bump"

# Clean up
echo "Cleaning..."
jlpm clean:all
check_status "Clean"

if [ -d "dist" ]; then
    echo "Removing dist directory..."
    rm -rf dist
    check_status "Dist directory removal"
fi

# Build
echo "Building package..."
python -m build
check_status "Build"

# Ask about upload
echo "Upload to PyPI? (y/N):"
read UPLOAD

if [ "$UPLOAD" = "y" ] || [ "$UPLOAD" = "Y" ]; then
    echo "Uploading to PyPI..."
    twine upload dist/*
    check_status "PyPI upload"
fi

echo "Done!"
