#!/usr/bin/env python3
"""
Test deployment package size for Lambda compatibility
"""

import os
import sys
import tempfile
import zipfile
from pathlib import Path

def calculate_package_size():
    """Calculate the size of the deployment package."""
    
    # Get the current directory
    current_dir = Path(__file__).parent
    
    # Create a temporary directory for the package
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        
        # Files to include in the package
        include_files = [
            'app.py',
            'chalicelib/',
            '.chalice/requirements.txt'
        ]
        
        # Create the package
        package_path = temp_path / 'deployment_package.zip'
        
        with zipfile.ZipFile(package_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for item in include_files:
                item_path = current_dir / item
                if item_path.exists():
                    if item_path.is_file():
                        zipf.write(item_path, item.name)
                    elif item_path.is_dir():
                        for root, dirs, files in os.walk(item_path):
                            for file in files:
                                file_path = Path(root) / file
                                arc_name = file_path.relative_to(current_dir)
                                zipf.write(file_path, arc_name)
        
        # Calculate size
        size_bytes = package_path.stat().st_size
        size_mb = size_bytes / (1024 * 1024)
        
        print(f"Deployment package size: {size_mb:.2f} MB ({size_bytes:,} bytes)")
        
        if size_mb > 50:
            print("❌ Package is too large for Lambda (max 50 MB)")
            return False
        else:
            print("✅ Package size is within Lambda limits")
            return True

if __name__ == "__main__":
    print("Testing deployment package size...")
    success = calculate_package_size()
    sys.exit(0 if success else 1) 