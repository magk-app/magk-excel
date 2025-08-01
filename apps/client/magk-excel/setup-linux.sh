#!/bin/bash

echo "Installing dependencies for Linux..."

# Remove existing node_modules and lock file
rm -rf node_modules
rm -f package-lock.json

echo "Installing packages..."
npm install

echo "Testing Vite..."
npx vite --version

echo "Setup complete! Now you can run:"
echo "npm run dev"