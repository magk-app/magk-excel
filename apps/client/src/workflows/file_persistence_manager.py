"""
Excel File Persistence Manager with Immediate Sync

This module handles Excel file operations and persistence with immediate syncing 
to ensure data consistency and real-time updates as reported in issue #4.
Specifically designed for MAGK Excel automation workflows.
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
import openpyxl
from openpyxl import Workbook


@dataclass
class ExcelFileRecord:
    """Represents an Excel file in the persistence manager."""
    file_id: str
    filename: str
    file_path: str
    file_hash: str
    last_modified: datetime
    sync_status: str = "synced"
    file_size: int = 0
    sheet_count: int = 0
    is_open: bool = False


class ExcelFilePersistenceManager:
    """
    Manages Excel file persistence with immediate sync capabilities.
    
    Addresses the sync issue where Excel file operations don't update immediately.
    Specifically designed for MAGK Excel automation workflows.
    """
    
    def __init__(self, excel_directory: str = "excel_files", auto_sync_interval: float = 0.1):
        """
        Initialize the Excel file persistence manager.
        
        Args:
            excel_directory: Directory to store Excel files
            auto_sync_interval: Interval for automatic sync checks (seconds)
        """
        self.excel_directory = Path(excel_directory)
        self.excel_directory.mkdir(exist_ok=True)
        
        self.metadata_file = self.excel_directory / "excel_metadata.json"
        self.auto_sync_interval = auto_sync_interval
        
        # Excel file registry for tracking files and sync status
        self._excel_registry: Dict[str, ExcelFileRecord] = {}
        self._sync_lock = threading.RLock()
        self._sync_callbacks: List[Callable[[str, ExcelFileRecord], None]] = []
        
        # Load existing metadata
        self._load_metadata()
        
        # Start background sync monitor
        self._sync_monitor_active = True
        self._sync_thread = threading.Thread(target=self._sync_monitor, daemon=True)
        self._sync_thread.start()
    
    def add_sync_callback(self, callback: Callable[[str, ExcelFileRecord], None]):
        """Add a callback to be called when Excel files are synced."""
        self._sync_callbacks.append(callback)
    
    def open_excel_file(self, file_path: str) -> str:
        """
        Open an Excel file with immediate sync tracking.
        
        Args:
            file_path: Path to the Excel file (.xlsx, .xls)
            
        Returns:
            file_id: Unique identifier for the opened file
            
        Raises:
            FileNotFoundError: If Excel file doesn't exist
            ValueError: If file is not a valid Excel format
            IOError: If file operations fail
        """
        source_path = Path(file_path)
        if not source_path.exists():
            raise FileNotFoundError(f"Excel file not found: {file_path}")
        
        # Validate Excel file format
        valid_extensions = {'.xlsx', '.xls', '.xlsm'}
        if source_path.suffix.lower() not in valid_extensions:
            raise ValueError(f"Invalid Excel file format. Expected: {valid_extensions}")
        
        # Generate unique file ID
        file_id = self._generate_file_id(file_path)
        
        # Calculate file hash for integrity checking
        file_hash = self._calculate_file_hash(source_path)
        file_size = source_path.stat().st_size
        
        with self._sync_lock:
            try:
                # Load Excel file to get metadata
                workbook = openpyxl.load_workbook(source_path, read_only=True)
                sheet_count = len(workbook.worksheets)
                workbook.close()
                
                # Create Excel file record
                excel_record = ExcelFileRecord(
                    file_id=file_id,
                    filename=source_path.name,
                    file_path=str(source_path),
                    file_hash=file_hash,
                    last_modified=datetime.now(),
                    sync_status="synced",  # Immediate sync
                    file_size=file_size,
                    sheet_count=sheet_count,
                    is_open=True
                )
                
                # Update registry
                self._excel_registry[file_id] = excel_record
                
                # Immediate sync to persistent storage
                self._sync_metadata_immediate()
                
                # Notify sync callbacks immediately
                for callback in self._sync_callbacks:
                    try:
                        callback(file_id, excel_record)
                    except Exception as e:
                        print(f"Sync callback error: {e}")
                
                print(f"Excel file opened and synced immediately: {source_path.name} ({file_id})")
                return file_id
                
            except Exception as e:
                raise IOError(f"Failed to open Excel file: {e}")
    
    def save_excel_file(self, file_id: str, workbook: Workbook, save_path: Optional[str] = None) -> bool:
        """
        Save an Excel workbook with immediate sync.
        
        Args:
            file_id: ID of the Excel file
            workbook: openpyxl Workbook object to save
            save_path: Optional custom save path
            
        Returns:
            bool: True if save was successful
        """
        with self._sync_lock:
            excel_record = self._excel_registry.get(file_id)
            if not excel_record:
                raise ValueError(f"Excel file not found: {file_id}")
            
            # Determine save path
            if save_path:
                target_path = Path(save_path)
            else:
                target_path = Path(excel_record.file_path)
            
            try:
                # Save the workbook immediately
                workbook.save(target_path)
                
                # Update record with new metadata
                excel_record.last_modified = datetime.now()
                excel_record.file_hash = self._calculate_file_hash(target_path)
                excel_record.file_size = target_path.stat().st_size
                excel_record.sheet_count = len(workbook.worksheets)
                excel_record.sync_status = "synced"
                
                # Immediate sync to persistent storage
                self._sync_metadata_immediate()
                
                # Notify sync callbacks immediately
                for callback in self._sync_callbacks:
                    try:
                        callback(file_id, excel_record)
                    except Exception as e:
                        print(f"Sync callback error: {e}")
                
                print(f"Excel file saved and synced immediately: {excel_record.filename}")
                return True
                
            except Exception as e:
                excel_record.sync_status = "error"
                print(f"Failed to save Excel file: {e}")
                return False
    
    def get_excel_info(self, file_id: str) -> Optional[ExcelFileRecord]:
        """Get Excel file information by ID."""
        with self._sync_lock:
            return self._excel_registry.get(file_id)
    
    def list_excel_files(self) -> List[ExcelFileRecord]:
        """List all Excel files in the registry."""
        with self._sync_lock:
            return list(self._excel_registry.values())
    
    def close_excel_file(self, file_id: str) -> bool:
        """
        Close an Excel file with immediate sync.
        
        Args:
            file_id: ID of the Excel file to close
            
        Returns:
            True if file was closed, False if not found
        """
        with self._sync_lock:
            excel_record = self._excel_registry.get(file_id)
            if not excel_record:
                return False
            
            try:
                # Mark as closed
                excel_record.is_open = False
                excel_record.last_modified = datetime.now()
                excel_record.sync_status = "synced"
                
                # Immediate sync
                self._sync_metadata_immediate()
                
                # Notify callbacks
                for callback in self._sync_callbacks:
                    try:
                        callback(file_id, excel_record)
                    except Exception as e:
                        print(f"Sync callback error: {e}")
                
                print(f"Excel file closed and synced immediately: {excel_record.filename} ({file_id})")
                return True
                
            except Exception as e:
                print(f"Failed to close Excel file: {e}")
                return False
    
    def remove_excel_file(self, file_id: str) -> bool:
        """
        Remove an Excel file from tracking (but don't delete the physical file).
        
        Args:
            file_id: ID of the Excel file to remove from tracking
            
        Returns:
            True if file was removed, False if not found
        """
        with self._sync_lock:
            excel_record = self._excel_registry.get(file_id)
            if not excel_record:
                return False
            
            try:
                # Remove from registry
                del self._excel_registry[file_id]
                
                # Immediate sync
                self._sync_metadata_immediate()
                
                print(f"Excel file removed from tracking and synced immediately: {excel_record.filename} ({file_id})")
                return True
                
            except Exception as e:
                print(f"Failed to remove Excel file: {e}")
                return False
    
    def force_sync(self) -> bool:
        """Force an immediate sync of all Excel file data."""
        try:
            with self._sync_lock:
                self._sync_metadata_immediate()
                print("Excel files forced sync completed successfully")
                return True
        except Exception as e:
            print(f"Excel files force sync failed: {e}")
            return False
    
    def get_sync_status(self) -> Dict[str, str]:
        """Get sync status for all Excel files."""
        with self._sync_lock:
            return {file_id: record.sync_status for file_id, record in self._excel_registry.items()}
    
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
        """Load Excel file metadata from persistent storage."""
        if not self.metadata_file.exists():
            return
        
        try:
            with open(self.metadata_file, 'r') as f:
                data = json.load(f)
                
            for file_id, record_data in data.items():
                # Convert datetime string back to datetime object
                record_data['last_modified'] = datetime.fromisoformat(record_data['last_modified'])
                self._excel_registry[file_id] = ExcelFileRecord(**record_data)
                
        except Exception as e:
            print(f"Failed to load Excel metadata: {e}")
    
    def _sync_metadata_immediate(self):
        """Immediately sync Excel metadata to persistent storage."""
        try:
            # Convert records to serializable format
            data = {}
            for file_id, record in self._excel_registry.items():
                record_dict = asdict(record)
                record_dict['last_modified'] = record.last_modified.isoformat()
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
        """Background thread to monitor and ensure Excel file sync consistency."""
        while self._sync_monitor_active:
            try:
                time.sleep(self.auto_sync_interval)
                
                # Check for any Excel files that might be out of sync
                with self._sync_lock:
                    needs_sync = False
                    for file_id, record in self._excel_registry.items():
                        file_path = Path(record.file_path)
                        if file_path.exists():
                            # Verify file integrity
                            current_hash = self._calculate_file_hash(file_path)
                            if current_hash != record.file_hash:
                                print(f"Excel file integrity issue detected: {record.filename}")
                                record.sync_status = "needs_sync"
                                record.last_modified = datetime.now()
                                needs_sync = True
                        else:
                            print(f"Missing Excel file detected: {record.filename}")
                            record.sync_status = "missing"
                            needs_sync = True
                    
                    if needs_sync:
                        self._sync_metadata_immediate()
                        
            except Exception as e:
                print(f"Excel sync monitor error: {e}")
    
    def shutdown(self):
        """Shutdown the Excel file persistence manager."""
        self._sync_monitor_active = False
        if self._sync_thread.is_alive():
            self._sync_thread.join(timeout=1.0)
        
        # Final sync
        with self._sync_lock:
            self._sync_metadata_immediate()