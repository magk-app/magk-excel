"""
File Persistence Manager with Immediate Sync

This module handles file upload and persistence with immediate syncing to ensure
data consistency and real-time updates as reported in issue #4.
"""
import os
import hashlib
import json
import threading
import time
from pathlib import Path
from typing import Dict, List, Optional, Callable
from dataclasses import dataclass, asdict
from datetime import datetime


@dataclass
class FileRecord:
    """Represents a file in the persistence manager."""
    file_id: str
    filename: str
    file_path: str
    file_hash: str
    upload_time: datetime
    sync_status: str = "synced"
    file_size: int = 0


class FilePersistenceManager:
    """
    Manages file persistence with immediate sync capabilities.
    
    Addresses the sync issue where file uploads don't update immediately.
    """
    
    def __init__(self, storage_directory: str = "storage", auto_sync_interval: float = 0.1):
        """
        Initialize the file persistence manager.
        
        Args:
            storage_directory: Directory to store files
            auto_sync_interval: Interval for automatic sync checks (seconds)
        """
        self.storage_directory = Path(storage_directory)
        self.storage_directory.mkdir(exist_ok=True)
        
        self.metadata_file = self.storage_directory / "file_metadata.json"
        self.auto_sync_interval = auto_sync_interval
        
        # File registry for tracking uploads and sync status
        self._file_registry: Dict[str, FileRecord] = {}
        self._sync_lock = threading.RLock()
        self._sync_callbacks: List[Callable[[str, FileRecord], None]] = []
        
        # Load existing metadata
        self._load_metadata()
        
        # Start background sync monitor
        self._sync_monitor_active = True
        self._sync_thread = threading.Thread(target=self._sync_monitor, daemon=True)
        self._sync_thread.start()
    
    def add_sync_callback(self, callback: Callable[[str, FileRecord], None]):
        """Add a callback to be called when files are synced."""
        self._sync_callbacks.append(callback)
    
    def upload_file(self, file_path: str, filename: Optional[str] = None) -> str:
        """
        Upload a file with immediate sync.
        
        Args:
            file_path: Path to the source file
            filename: Optional custom filename
            
        Returns:
            file_id: Unique identifier for the uploaded file
            
        Raises:
            FileNotFoundError: If source file doesn't exist
            IOError: If file operations fail
        """
        source_path = Path(file_path)
        if not source_path.exists():
            raise FileNotFoundError(f"Source file not found: {file_path}")
        
        # Generate unique file ID
        file_id = self._generate_file_id(file_path)
        
        # Use provided filename or extract from path
        if filename is None:
            filename = source_path.name
        
        # Calculate destination path
        dest_path = self.storage_directory / f"{file_id}_{filename}"
        
        # Calculate file hash for integrity checking
        file_hash = self._calculate_file_hash(source_path)
        file_size = source_path.stat().st_size
        
        with self._sync_lock:
            try:
                # Copy file to storage
                import shutil
                shutil.copy2(source_path, dest_path)
                
                # Create file record
                file_record = FileRecord(
                    file_id=file_id,
                    filename=filename,
                    file_path=str(dest_path),
                    file_hash=file_hash,
                    upload_time=datetime.now(),
                    sync_status="synced",  # Immediate sync
                    file_size=file_size
                )
                
                # Update registry
                self._file_registry[file_id] = file_record
                
                # Immediate sync to persistent storage
                self._sync_metadata_immediate()
                
                # Notify sync callbacks immediately
                for callback in self._sync_callbacks:
                    try:
                        callback(file_id, file_record)
                    except Exception as e:
                        print(f"Sync callback error: {e}")
                
                print(f"File uploaded and synced immediately: {filename} ({file_id})")
                return file_id
                
            except Exception as e:
                # Clean up on failure
                if dest_path.exists():
                    dest_path.unlink()
                raise IOError(f"Failed to upload file: {e}")
    
    def get_file_info(self, file_id: str) -> Optional[FileRecord]:
        """Get file information by ID."""
        with self._sync_lock:
            return self._file_registry.get(file_id)
    
    def list_files(self) -> List[FileRecord]:
        """List all files in the registry."""
        with self._sync_lock:
            return list(self._file_registry.values())
    
    def delete_file(self, file_id: str) -> bool:
        """
        Delete a file with immediate sync.
        
        Args:
            file_id: ID of the file to delete
            
        Returns:
            True if file was deleted, False if not found
        """
        with self._sync_lock:
            file_record = self._file_registry.get(file_id)
            if not file_record:
                return False
            
            try:
                # Remove physical file
                file_path = Path(file_record.file_path)
                if file_path.exists():
                    file_path.unlink()
                
                # Remove from registry
                del self._file_registry[file_id]
                
                # Immediate sync
                self._sync_metadata_immediate()
                
                print(f"File deleted and synced immediately: {file_record.filename} ({file_id})")
                return True
                
            except Exception as e:
                print(f"Failed to delete file: {e}")
                return False
    
    def force_sync(self) -> bool:
        """Force an immediate sync of all data."""
        try:
            with self._sync_lock:
                self._sync_metadata_immediate()
                print("Forced sync completed successfully")
                return True
        except Exception as e:
            print(f"Force sync failed: {e}")
            return False
    
    def get_sync_status(self) -> Dict[str, str]:
        """Get sync status for all files."""
        with self._sync_lock:
            return {file_id: record.sync_status for file_id, record in self._file_registry.items()}
    
    def _generate_file_id(self, file_path: str) -> str:
        """Generate a unique file ID based on path and timestamp."""
        timestamp = str(time.time())
        content = f"{file_path}_{timestamp}"
        return hashlib.md5(content.encode()).hexdigest()[:12]
    
    def _calculate_file_hash(self, file_path: Path) -> str:
        """Calculate SHA-256 hash of file content."""
        hash_sha256 = hashlib.sha256()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_sha256.update(chunk)
        return hash_sha256.hexdigest()
    
    def _load_metadata(self):
        """Load file metadata from persistent storage."""
        if not self.metadata_file.exists():
            return
        
        try:
            with open(self.metadata_file, 'r') as f:
                data = json.load(f)
                
            for file_id, record_data in data.items():
                # Convert datetime string back to datetime object
                record_data['upload_time'] = datetime.fromisoformat(record_data['upload_time'])
                self._file_registry[file_id] = FileRecord(**record_data)
                
        except Exception as e:
            print(f"Failed to load metadata: {e}")
    
    def _sync_metadata_immediate(self):
        """Immediately sync metadata to persistent storage."""
        try:
            # Convert records to serializable format
            data = {}
            for file_id, record in self._file_registry.items():
                record_dict = asdict(record)
                record_dict['upload_time'] = record.upload_time.isoformat()
                data[file_id] = record_dict
            
            # Write immediately with atomic operation
            temp_file = self.metadata_file.with_suffix('.tmp')
            with open(temp_file, 'w') as f:
                json.dump(data, f, indent=2)
            
            # Atomic rename for consistency
            temp_file.replace(self.metadata_file)
            
        except Exception as e:
            print(f"Failed to sync metadata: {e}")
            raise
    
    def _sync_monitor(self):
        """Background thread to monitor and ensure sync consistency."""
        while self._sync_monitor_active:
            try:
                time.sleep(self.auto_sync_interval)
                
                # Check for any files that might be out of sync
                with self._sync_lock:
                    needs_sync = False
                    for file_id, record in self._file_registry.items():
                        file_path = Path(record.file_path)
                        if file_path.exists():
                            # Verify file integrity
                            current_hash = self._calculate_file_hash(file_path)
                            if current_hash != record.file_hash:
                                print(f"File integrity issue detected: {record.filename}")
                                record.sync_status = "needs_sync"
                                needs_sync = True
                        else:
                            print(f"Missing file detected: {record.filename}")
                            record.sync_status = "missing"
                            needs_sync = True
                    
                    if needs_sync:
                        self._sync_metadata_immediate()
                        
            except Exception as e:
                print(f"Sync monitor error: {e}")
    
    def shutdown(self):
        """Shutdown the file persistence manager."""
        self._sync_monitor_active = False
        if self._sync_thread.is_alive():
            self._sync_thread.join(timeout=1.0)
        
        # Final sync
        with self._sync_lock:
            self._sync_metadata_immediate()