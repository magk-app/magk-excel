#!/usr/bin/env python3
"""
MAGK Excel Client Application

Main entry point for the MAGK Excel desktop client with file manager functionality.
This addresses the sync issue reported in bug #4.
"""
import sys
import os
from pathlib import Path

# Add src directory to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

def main():
    """Main entry point for the MAGK Excel client."""
    try:
        # Import and run the file manager UI
        from ui.file_manager_ui import main as run_file_manager
        
        print("🚀 Starting MAGK Excel Client with Immediate Sync File Manager")
        print("   This version resolves the file sync delay issue.")
        print()
        
        # Run the file manager UI
        run_file_manager()
        
    except ImportError as e:
        print(f"❌ Failed to import required modules: {e}")
        print("   Make sure PyQt6 is installed: pip install PyQt6")
        sys.exit(1)
    
    except Exception as e:
        print(f"❌ Application error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()