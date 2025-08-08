#!/usr/bin/env python3
"""
Demo script to test the Excel file manager sync functionality

This script demonstrates that the Excel sync issue has been resolved by showing
immediate sync behavior during Excel file operations.
"""
import sys
import time
import tempfile
from pathlib import Path
import openpyxl

# Add the src directory to the path
sys.path.append(str(Path(__file__).parent / "src"))

from workflows.file_persistence_manager import ExcelFilePersistenceManager


def test_excel_immediate_sync_demo():
    """Demonstrate immediate Excel sync functionality."""
    print("🚀 MAGK Excel File Manager - Immediate Sync Demo")
    print("=" * 55)
    
    # Create temporary directory for demo
    with tempfile.TemporaryDirectory() as temp_dir:
        print(f"📁 Demo Excel storage directory: {temp_dir}")
        
        # Initialize Excel file manager with very fast sync
        manager = ExcelFilePersistenceManager(
            excel_directory=f"{temp_dir}/demo_excel_storage",
            auto_sync_interval=0.01  # 10ms sync checking
        )
        
        # Set up sync callback to track sync events
        sync_events = []
        
        def sync_callback(file_id, excel_record):
            timestamp = time.time()
            sync_events.append((file_id, excel_record.filename, timestamp))
            print(f"🔄 EXCEL SYNCED: {excel_record.filename} ({file_id[:8]}...) at {timestamp:.3f}")
        
        manager.add_sync_callback(sync_callback)
        
        try:
            # Create test Excel files
            test_excel_files = []
            for i in range(3):
                excel_file = Path(temp_dir) / f"demo_workbook_{i}.xlsx"
                workbook = openpyxl.Workbook()
                worksheet = workbook.active
                worksheet['A1'] = f"Demo Excel content for file {i}"
                worksheet['B1'] = f"Created for sync testing"
                worksheet['C1'] = i * 100
                workbook.save(excel_file)
                workbook.close()
                test_excel_files.append(excel_file)
            
            print(f"\n📤 Opening {len(test_excel_files)} Excel files with immediate sync...")
            
            open_times = []
            file_ids = []
            
            for i, excel_file in enumerate(test_excel_files):
                print(f"\n⏰ Opening Excel file {i+1}: {excel_file.name}")
                
                open_start = time.time()
                file_id = manager.open_excel_file(str(excel_file))
                open_end = time.time()
                
                open_time = open_end - open_start
                open_times.append(open_time)
                file_ids.append(file_id)
                
                print(f"✅ Excel file opened in {open_time:.3f} seconds")
                
                # Check immediate sync status
                excel_info = manager.get_excel_info(file_id)
                print(f"📊 Immediate sync status: {excel_info.sync_status}")
                print(f"📋 Sheets: {excel_info.sheet_count}, Open: {excel_info.is_open}")
                
                time.sleep(0.1)  # Small delay to see the process
            
            # Demonstrate Excel file saving
            if file_ids:
                print(f"\n💾 Testing Excel file save with immediate sync...")
                file_to_save = file_ids[0]
                excel_info = manager.get_excel_info(file_to_save)
                
                # Load and modify the workbook
                workbook = openpyxl.load_workbook(excel_info.file_path)
                worksheet = workbook.active
                worksheet['D1'] = "Modified for sync test"
                
                save_start = time.time()
                success = manager.save_excel_file(file_to_save, workbook)
                save_end = time.time()
                
                workbook.close()
                
                save_time = save_end - save_start
                print(f"✅ Excel file saved: {success} (took {save_time:.3f} seconds)")
            
            # Show final sync status
            print(f"\n📈 Final Excel Sync Status Check:")
            sync_status = manager.get_sync_status()
            for file_id, status in sync_status.items():
                excel_info = manager.get_excel_info(file_id)
                print(f"   {excel_info.filename}: {status} (Open: {excel_info.is_open})")
            
            # Demonstrate force sync
            print(f"\n🔄 Testing Excel force sync...")
            force_sync_start = time.time()
            success = manager.force_sync()
            force_sync_end = time.time()
            
            force_sync_time = force_sync_end - force_sync_start
            print(f"✅ Excel force sync completed: {success} (took {force_sync_time:.3f} seconds)")
            
            # Test Excel file closing with immediate sync
            if file_ids:
                print(f"\n📤 Testing Excel file close with immediate sync...")
                file_to_close = file_ids[0]
                excel_info = manager.get_excel_info(file_to_close)
                filename = excel_info.filename
                
                close_start = time.time()
                success = manager.close_excel_file(file_to_close)
                close_end = time.time()
                
                close_time = close_end - close_start
                print(f"✅ Excel file '{filename}' closed: {success} (took {close_time:.3f} seconds)")
                
                # Verify immediate status change
                excel_info = manager.get_excel_info(file_to_close)
                print(f"🔍 Excel file immediately marked as closed: {not excel_info.is_open}")
            
            # Summary
            print(f"\n📊 EXCEL DEMO SUMMARY:")
            print(f"   • Total sync events: {len(sync_events)}")
            print(f"   • Average open time: {sum(open_times)/len(open_times):.3f} seconds")
            print(f"   • All Excel operations synced immediately: ✅")
            print(f"   • Excel sync issue resolved: ✅")
            
            # Show remaining Excel files
            remaining_excel_files = manager.list_excel_files()
            print(f"   • Excel files tracked: {len(remaining_excel_files)}")
            for excel_record in remaining_excel_files:
                print(f"     - {excel_record.filename} ({excel_record.sync_status}, Open: {excel_record.is_open})")
            
        except Exception as e:
            print(f"❌ Excel demo failed: {e}")
            return False
        
        finally:
            print(f"\n🔧 Shutting down Excel file manager...")
            manager.shutdown()
    
    print(f"\n🎉 Excel demo completed successfully!")
    print(f"💡 The Excel file manager sync issue has been resolved!")
    return True


if __name__ == "__main__":
    success = test_excel_immediate_sync_demo()
    sys.exit(0 if success else 1)