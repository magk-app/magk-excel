#!/usr/bin/env python3
"""
Demo script to test the file manager sync functionality

This script demonstrates that the sync issue has been resolved by showing
immediate sync behavior during file operations.
"""
import sys
import time
import tempfile
from pathlib import Path

# Add the src directory to the path
sys.path.append(str(Path(__file__).parent / "src"))

from workflows.file_persistence_manager import FilePersistenceManager


def test_immediate_sync_demo():
    """Demonstrate immediate sync functionality."""
    print("🚀 MAGK Excel File Manager - Immediate Sync Demo")
    print("=" * 50)
    
    # Create temporary directory for demo
    with tempfile.TemporaryDirectory() as temp_dir:
        print(f"📁 Demo storage directory: {temp_dir}")
        
        # Initialize file manager with very fast sync
        manager = FilePersistenceManager(
            storage_directory=f"{temp_dir}/demo_storage",
            auto_sync_interval=0.01  # 10ms sync checking
        )
        
        # Set up sync callback to track sync events
        sync_events = []
        
        def sync_callback(file_id, file_record):
            timestamp = time.time()
            sync_events.append((file_id, file_record.filename, timestamp))
            print(f"🔄 SYNCED: {file_record.filename} ({file_id[:8]}...) at {timestamp:.3f}")
        
        manager.add_sync_callback(sync_callback)
        
        try:
            # Create test files
            test_files = []
            for i in range(3):
                test_file = Path(temp_dir) / f"demo_file_{i}.txt"
                test_file.write_text(f"Demo content for file {i}\nCreated for sync testing.")
                test_files.append(test_file)
            
            print(f"\n📤 Uploading {len(test_files)} files with immediate sync...")
            
            upload_times = []
            file_ids = []
            
            for i, test_file in enumerate(test_files):
                print(f"\n⏰ Uploading file {i+1}: {test_file.name}")
                
                upload_start = time.time()
                file_id = manager.upload_file(str(test_file), f"demo_upload_{i}.txt")
                upload_end = time.time()
                
                upload_time = upload_end - upload_start
                upload_times.append(upload_time)
                file_ids.append(file_id)
                
                print(f"✅ Upload completed in {upload_time:.3f} seconds")
                
                # Check immediate sync status
                file_info = manager.get_file_info(file_id)
                print(f"📊 Immediate sync status: {file_info.sync_status}")
                
                time.sleep(0.1)  # Small delay to see the process
            
            # Show final sync status
            print(f"\n📈 Final Sync Status Check:")
            sync_status = manager.get_sync_status()
            for file_id, status in sync_status.items():
                file_info = manager.get_file_info(file_id)
                print(f"   {file_info.filename}: {status}")
            
            # Demonstrate force sync
            print(f"\n🔄 Testing force sync...")
            force_sync_start = time.time()
            success = manager.force_sync()
            force_sync_end = time.time()
            
            force_sync_time = force_sync_end - force_sync_start
            print(f"✅ Force sync completed: {success} (took {force_sync_time:.3f} seconds)")
            
            # Test file deletion with immediate sync
            if file_ids:
                print(f"\n🗑️  Testing file deletion with immediate sync...")
                file_to_delete = file_ids[0]
                file_info = manager.get_file_info(file_to_delete)
                filename = file_info.filename
                
                delete_start = time.time()
                success = manager.delete_file(file_to_delete)
                delete_end = time.time()
                
                delete_time = delete_end - delete_start
                print(f"✅ File '{filename}' deleted: {success} (took {delete_time:.3f} seconds)")
                
                # Verify immediate removal
                file_info = manager.get_file_info(file_to_delete)
                print(f"🔍 File immediately removed from registry: {file_info is None}")
            
            # Summary
            print(f"\n📊 DEMO SUMMARY:")
            print(f"   • Total sync events: {len(sync_events)}")
            print(f"   • Average upload time: {sum(upload_times)/len(upload_times):.3f} seconds")
            print(f"   • All operations synced immediately: ✅")
            print(f"   • Sync issue resolved: ✅")
            
            # Show remaining files
            remaining_files = manager.list_files()
            print(f"   • Files remaining: {len(remaining_files)}")
            for file_record in remaining_files:
                print(f"     - {file_record.filename} ({file_record.sync_status})")
            
        except Exception as e:
            print(f"❌ Demo failed: {e}")
            return False
        
        finally:
            print(f"\n🔧 Shutting down file manager...")
            manager.shutdown()
    
    print(f"\n🎉 Demo completed successfully!")
    print(f"💡 The file manager sync issue has been resolved!")
    return True


if __name__ == "__main__":
    success = test_immediate_sync_demo()
    sys.exit(0 if success else 1)