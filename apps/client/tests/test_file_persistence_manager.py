"""
Test suite for File Persistence Manager

Tests the immediate sync functionality to ensure the reported sync delay issue is resolved.
"""
import pytest
import tempfile
import time
import threading
from pathlib import Path
from unittest.mock import Mock

import sys
sys.path.append(str(Path(__file__).parent.parent / "src"))

from workflows.file_persistence_manager import FilePersistenceManager, FileRecord


class TestFilePersistenceManager:
    """Test cases for the file persistence manager with immediate sync."""
    
    def setup_method(self):
        """Set up test environment before each test."""
        self.temp_dir = tempfile.mkdtemp()
        self.storage_dir = Path(self.temp_dir) / "test_storage"
        self.manager = FilePersistenceManager(
            storage_directory=str(self.storage_dir),
            auto_sync_interval=0.05  # Fast sync for testing
        )
        
        # Create a test file
        self.test_file = Path(self.temp_dir) / "test_file.txt"
        self.test_file.write_text("Test content for immediate sync verification")
    
    def teardown_method(self):
        """Clean up after each test."""
        self.manager.shutdown()
        
        # Clean up temp directory
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)
    
    def test_immediate_sync_on_upload(self):
        """Test that file upload syncs immediately without delay."""
        # Set up sync callback to track sync events
        sync_events = []
        
        def sync_callback(file_id, file_record):
            sync_events.append((file_id, file_record, time.time()))
        
        self.manager.add_sync_callback(sync_callback)
        
        # Record upload time
        upload_start = time.time()
        
        # Upload file
        file_id = self.manager.upload_file(str(self.test_file), "immediate_sync_test.txt")
        
        upload_end = time.time()
        
        # Verify immediate sync
        assert file_id is not None
        assert len(sync_events) > 0, "Sync callback should be called immediately"
        
        # Check sync happened during upload
        sync_time = sync_events[0][2]
        assert upload_start <= sync_time <= upload_end + 0.1, "Sync should happen immediately during upload"
        
        # Verify file info is immediately available
        file_info = self.manager.get_file_info(file_id)
        assert file_info is not None
        assert file_info.sync_status == "synced"
        assert file_info.filename == "immediate_sync_test.txt"
    
    def test_sync_status_tracking(self):
        """Test that sync status is properly tracked and reported."""
        # Upload a file
        file_id = self.manager.upload_file(str(self.test_file))
        
        # Check sync status immediately
        sync_status = self.manager.get_sync_status()
        assert file_id in sync_status
        assert sync_status[file_id] == "synced"
        
        # Verify individual file status
        file_info = self.manager.get_file_info(file_id)
        assert file_info.sync_status == "synced"
    
    def test_multiple_file_immediate_sync(self):
        """Test immediate sync with multiple files uploaded quickly."""
        sync_events = []
        
        def sync_callback(file_id, file_record):
            sync_events.append((file_id, file_record.filename, time.time()))
        
        self.manager.add_sync_callback(sync_callback)
        
        # Create multiple test files
        test_files = []
        for i in range(3):
            test_file = Path(self.temp_dir) / f"test_file_{i}.txt"
            test_file.write_text(f"Content for file {i}")
            test_files.append(test_file)
        
        # Upload files rapidly
        upload_start = time.time()
        file_ids = []
        
        for i, test_file in enumerate(test_files):
            file_id = self.manager.upload_file(str(test_file), f"rapid_upload_{i}.txt")
            file_ids.append(file_id)
        
        upload_end = time.time()
        
        # Allow small buffer for async callbacks
        time.sleep(0.1)
        
        # Verify all files synced immediately
        assert len(sync_events) == 3, "All files should trigger sync callbacks"
        assert len(file_ids) == 3, "All files should be uploaded"
        
        # Check all sync events happened during upload timeframe
        for file_id, filename, sync_time in sync_events:
            assert upload_start <= sync_time <= upload_end + 0.2, f"File {filename} should sync immediately"
        
        # Verify all files are in synced state
        sync_status = self.manager.get_sync_status()
        for file_id in file_ids:
            assert sync_status[file_id] == "synced"
    
    def test_delete_immediate_sync(self):
        """Test that file deletion syncs immediately."""
        # Upload a file first
        file_id = self.manager.upload_file(str(self.test_file))
        assert self.manager.get_file_info(file_id) is not None
        
        # Delete the file
        delete_start = time.time()
        success = self.manager.delete_file(file_id)
        delete_end = time.time()
        
        assert success, "File deletion should succeed"
        
        # Verify immediate removal from registry
        file_info = self.manager.get_file_info(file_id)
        assert file_info is None, "File should be immediately removed from registry"
        
        # Verify not in sync status
        sync_status = self.manager.get_sync_status()
        assert file_id not in sync_status, "Deleted file should not be in sync status"
    
    def test_force_sync_functionality(self):
        """Test that force sync works immediately."""
        # Upload a file
        file_id = self.manager.upload_file(str(self.test_file))
        
        # Force sync
        sync_start = time.time()
        success = self.manager.force_sync()
        sync_end = time.time()
        
        assert success, "Force sync should succeed"
        assert sync_end - sync_start < 0.5, "Force sync should complete quickly"
        
        # Verify file still synced
        file_info = self.manager.get_file_info(file_id)
        assert file_info.sync_status == "synced"
    
    def test_concurrent_upload_sync_safety(self):
        """Test that concurrent uploads maintain sync integrity."""
        sync_events = []
        sync_lock = threading.Lock()
        
        def sync_callback(file_id, file_record):
            with sync_lock:
                sync_events.append((file_id, file_record.filename))
        
        self.manager.add_sync_callback(sync_callback)
        
        # Create multiple test files
        test_files = []
        for i in range(5):
            test_file = Path(self.temp_dir) / f"concurrent_test_{i}.txt"
            test_file.write_text(f"Concurrent content {i}")
            test_files.append(test_file)
        
        # Upload files concurrently
        threads = []
        results = [None] * len(test_files)
        
        def upload_file(index, file_path):
            try:
                file_id = self.manager.upload_file(str(file_path), f"concurrent_{index}.txt")
                results[index] = file_id
            except Exception as e:
                results[index] = f"Error: {e}"
        
        # Start concurrent uploads
        for i, test_file in enumerate(test_files):
            thread = threading.Thread(target=upload_file, args=(i, test_file))
            threads.append(thread)
            thread.start()
        
        # Wait for all uploads to complete
        for thread in threads:
            thread.join(timeout=5.0)
        
        # Allow time for all sync callbacks
        time.sleep(0.2)
        
        # Verify all uploads succeeded
        for i, result in enumerate(results):
            assert isinstance(result, str) and not result.startswith("Error"), f"Upload {i} should succeed: {result}"
        
        # Verify all files are synced
        sync_status = self.manager.get_sync_status()
        for file_id in results:
            if file_id and not file_id.startswith("Error"):
                assert sync_status.get(file_id) == "synced", f"File {file_id} should be synced"
        
        # Verify sync events were recorded
        assert len(sync_events) == 5, "All uploads should trigger sync events"
    
    def test_metadata_persistence_immediate(self):
        """Test that metadata is persisted immediately after operations."""
        # Upload a file
        file_id = self.manager.upload_file(str(self.test_file), "persistence_test.txt")
        
        # Check that metadata file exists immediately
        metadata_file = self.storage_dir / "file_metadata.json"
        assert metadata_file.exists(), "Metadata file should exist immediately after upload"
        
        # Create new manager instance to test persistence
        new_manager = FilePersistenceManager(storage_directory=str(self.storage_dir))
        
        try:
            # Verify file is loaded from metadata
            file_info = new_manager.get_file_info(file_id)
            assert file_info is not None, "File should be loaded from persistent metadata"
            assert file_info.filename == "persistence_test.txt"
            assert file_info.sync_status == "synced"
        finally:
            new_manager.shutdown()
    
    def test_no_sync_delay_regression(self):
        """Regression test to ensure sync delays don't reoccur."""
        # This test specifically addresses the original issue
        
        sync_times = []
        
        def sync_callback(file_id, file_record):
            sync_times.append(time.time())
        
        self.manager.add_sync_callback(sync_callback)
        
        # Upload file and measure sync timing
        upload_start = time.time()
        file_id = self.manager.upload_file(str(self.test_file), "no_delay_test.txt")
        upload_end = time.time()
        
        # Wait a short time for any async operations
        time.sleep(0.05)
        
        # Verify sync happened immediately
        assert len(sync_times) > 0, "Sync should happen immediately"
        sync_time = sync_times[0]
        
        # Sync should happen within upload timeframe + small buffer
        sync_delay = sync_time - upload_start
        assert sync_delay < 0.1, f"Sync delay ({sync_delay:.3f}s) should be minimal (< 0.1s)"
        
        # File should be immediately available and synced
        file_info = self.manager.get_file_info(file_id)
        assert file_info is not None
        assert file_info.sync_status == "synced"
        
        print(f"✓ Sync completed in {sync_delay:.3f} seconds - Issue resolved!")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])