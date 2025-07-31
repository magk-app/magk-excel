#!/bin/bash
# Setup script for MAGK Excel Server Development Environment

set -e

echo "🚀 Setting up MAGK Excel Server development environment..."

# Check Python version
python_version=$(python3 --version 2>&1 | grep -oP '\d+\.\d+' | head -1)
required_version="3.10"

echo "📋 Python version check..."
if python3 -c "import sys; exit(0 if sys.version_info >= (3, 10) else 1)"; then
    echo "✅ Python $python_version is compatible (requires >= $required_version)"
else
    echo "❌ Python $python_version is not compatible (requires >= $required_version)"
    exit 1
fi

# Create virtual environment
echo "🔧 Creating virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "✅ Virtual environment created"
else
    echo "✅ Virtual environment already exists"
fi

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "📦 Upgrading pip..."
python -m pip install --upgrade pip

# Install dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt

echo "🧪 Running basic validation..."
python -c "
import sys
print(f'✅ Python: {sys.version}')

try:
    import pytest
    print('✅ pytest available')
except ImportError:
    print('❌ pytest not available')

try:
    import chalice
    print('✅ chalice available') 
except ImportError:
    print('❌ chalice not available')

try:
    import selenium
    print('✅ selenium available')
except ImportError:
    print('❌ selenium not available')
"

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To activate the environment in the future:"
echo "  cd apps/server"
echo "  source venv/bin/activate"
echo ""
echo "To run tests:"
echo "  pytest tests/ -v"
echo ""
echo "To start development server:"
echo "  chalice local"
echo ""
echo "To deploy to AWS:"
echo "  chalice deploy --stage dev"