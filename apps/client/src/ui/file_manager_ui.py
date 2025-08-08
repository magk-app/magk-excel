"""
File Manager UI Component with Immediate Sync

This component provides a user interface for file upload and management
with real-time sync status display to address the sync delay issue.
"""
import sys
import os
from pathlib import Path
from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QVBoxLayout, QHBoxLayout, QWidget,
    QPushButton, QFileDialog, QTableWidget, QTableWidgetItem,
    QLabel, QProgressBar, QMessageBox, QTextEdit, QSplitter
)
from PyQt6.QtCore import QTimer, pyqtSignal, QThread, pyqtSlot
from PyQt6.QtGui import QFont
from typing import Optional

# Import our file persistence manager
sys.path.append(str(Path(__file__).parent.parent))
from workflows.file_persistence_manager import FilePersistenceManager, FileRecord


class FileManagerUI(QMainWindow):
    """
    Main file manager UI with immediate sync capabilities.
    
    This addresses the reported issue where file uploads don't sync immediately.
    """
    
    def __init__(self):
        super().__init__()
        self.setWindowTitle("MAGK Excel - File Manager (Immediate Sync)")
        self.setGeometry(100, 100, 800, 600)
        
        # Initialize file persistence manager
        self.file_manager = FilePersistenceManager(
            storage_directory="magk_storage",
            auto_sync_interval=0.1  # Very fast sync checking
        )
        
        # Add sync callback for real-time updates
        self.file_manager.add_sync_callback(self._on_file_synced)
        
        self._setup_ui()
        self._setup_timers()
        
        # Load initial file list
        self._refresh_file_list()
    
    def _setup_ui(self):
        """Set up the user interface."""
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        
        # Main layout
        main_layout = QVBoxLayout(central_widget)
        
        # Title and status
        title_label = QLabel("File Manager - Immediate Sync Demo")
        title_font = QFont()
        title_font.setPointSize(16)
        title_font.setBold(True)
        title_label.setFont(title_font)
        main_layout.addWidget(title_label)
        
        # Sync status indicator
        self.sync_status_label = QLabel("Sync Status: Ready")
        self.sync_status_label.setStyleSheet("color: green; font-weight: bold;")
        main_layout.addWidget(self.sync_status_label)
        
        # Control buttons
        button_layout = QHBoxLayout()
        
        self.upload_button = QPushButton("Upload File (Immediate Sync)")
        self.upload_button.clicked.connect(self._upload_file)
        button_layout.addWidget(self.upload_button)
        
        self.refresh_button = QPushButton("Refresh List")
        self.refresh_button.clicked.connect(self._refresh_file_list)
        button_layout.addWidget(self.refresh_button)
        
        self.force_sync_button = QPushButton("Force Sync")
        self.force_sync_button.clicked.connect(self._force_sync)
        button_layout.addWidget(self.force_sync_button)
        
        self.delete_button = QPushButton("Delete Selected")
        self.delete_button.clicked.connect(self._delete_selected_file)
        button_layout.addWidget(self.delete_button)
        
        button_layout.addStretch()
        main_layout.addLayout(button_layout)
        
        # Splitter for file list and log
        splitter = QSplitter()
        main_layout.addWidget(splitter)
        
        # File list table
        self.file_table = QTableWidget()
        self.file_table.setColumnCount(6)
        self.file_table.setHorizontalHeaderLabels([
            "File ID", "Filename", "Upload Time", "Size", "Sync Status", "File Hash"
        ])
        self.file_table.setSelectionBehavior(QTableWidget.SelectionBehavior.SelectRows)
        splitter.addWidget(self.file_table)
        
        # Log area
        log_widget = QWidget()
        log_layout = QVBoxLayout(log_widget)
        
        log_label = QLabel("Real-time Sync Log:")
        log_layout.addWidget(log_label)
        
        self.log_text = QTextEdit()
        self.log_text.setMaximumHeight(150)
        self.log_text.setReadOnly(True)
        log_layout.addWidget(self.log_text)
        
        splitter.addWidget(log_widget)
        splitter.setSizes([400, 200])
    
    def _setup_timers(self):
        """Set up timers for real-time updates."""
        # Timer for updating sync status display
        self.status_timer = QTimer()
        self.status_timer.timeout.connect(self._update_sync_status)
        self.status_timer.start(100)  # Update every 100ms for immediate feedback
        
        # Timer for refreshing file list
        self.refresh_timer = QTimer()
        self.refresh_timer.timeout.connect(self._refresh_file_list)
        self.refresh_timer.start(1000)  # Refresh every second
    
    def _upload_file(self):
        """Handle file upload with immediate sync."""
        file_path, _ = QFileDialog.getOpenFileName(
            self, 
            "Select File to Upload", 
            "", 
            "All Files (*)"
        )
        
        if file_path:
            try:
                self._log_message(f"Uploading file: {Path(file_path).name}")
                self.sync_status_label.setText("Sync Status: Uploading...")
                self.sync_status_label.setStyleSheet("color: orange; font-weight: bold;")
                
                # Upload with immediate sync
                file_id = self.file_manager.upload_file(file_path)
                
                self._log_message(f"✓ File uploaded and synced immediately: {file_id}")
                self.sync_status_label.setText("Sync Status: Synced")
                self.sync_status_label.setStyleSheet("color: green; font-weight: bold;")
                
                # Immediate refresh
                self._refresh_file_list()
                
            except Exception as e:
                error_msg = f"Upload failed: {str(e)}"
                self._log_message(f"✗ {error_msg}")
                QMessageBox.critical(self, "Upload Error", error_msg)
                self.sync_status_label.setText("Sync Status: Error")
                self.sync_status_label.setStyleSheet("color: red; font-weight: bold;")
    
    def _delete_selected_file(self):
        """Delete selected file with immediate sync."""
        current_row = self.file_table.currentRow()
        if current_row < 0:
            QMessageBox.information(self, "No Selection", "Please select a file to delete.")
            return
        
        file_id_item = self.file_table.item(current_row, 0)
        if not file_id_item:
            return
        
        file_id = file_id_item.text()
        filename_item = self.file_table.item(current_row, 1)
        filename = filename_item.text() if filename_item else "Unknown"
        
        reply = QMessageBox.question(
            self, 
            "Confirm Delete", 
            f"Delete file '{filename}'?",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
        )
        
        if reply == QMessageBox.StandardButton.Yes:
            try:
                self._log_message(f"Deleting file: {filename}")
                success = self.file_manager.delete_file(file_id)
                
                if success:
                    self._log_message(f"✓ File deleted and synced immediately: {filename}")
                    self._refresh_file_list()
                else:
                    self._log_message(f"✗ Failed to delete file: {filename}")
                    
            except Exception as e:
                error_msg = f"Delete failed: {str(e)}"
                self._log_message(f"✗ {error_msg}")
                QMessageBox.critical(self, "Delete Error", error_msg)
    
    def _force_sync(self):
        """Force immediate sync of all data."""
        self._log_message("Forcing immediate sync...")
        self.sync_status_label.setText("Sync Status: Syncing...")
        self.sync_status_label.setStyleSheet("color: orange; font-weight: bold;")
        
        success = self.file_manager.force_sync()
        if success:
            self._log_message("✓ Force sync completed successfully")
            self.sync_status_label.setText("Sync Status: Synced")
            self.sync_status_label.setStyleSheet("color: green; font-weight: bold;")
        else:
            self._log_message("✗ Force sync failed")
            self.sync_status_label.setText("Sync Status: Sync Failed")
            self.sync_status_label.setStyleSheet("color: red; font-weight: bold;")
    
    def _refresh_file_list(self):
        """Refresh the file list display."""
        files = self.file_manager.list_files()
        
        self.file_table.setRowCount(len(files))
        
        for row, file_record in enumerate(files):
            # File ID
            self.file_table.setItem(row, 0, QTableWidgetItem(file_record.file_id))
            
            # Filename
            self.file_table.setItem(row, 1, QTableWidgetItem(file_record.filename))
            
            # Upload time
            upload_time_str = file_record.upload_time.strftime("%Y-%m-%d %H:%M:%S")
            self.file_table.setItem(row, 2, QTableWidgetItem(upload_time_str))
            
            # File size
            size_str = self._format_file_size(file_record.file_size)
            self.file_table.setItem(row, 3, QTableWidgetItem(size_str))
            
            # Sync status
            status_item = QTableWidgetItem(file_record.sync_status)
            if file_record.sync_status == "synced":
                status_item.setBackground(status_item.background().color().lighter(150))
            elif file_record.sync_status == "needs_sync":
                status_item.setBackground(status_item.background().color().darker(110))
            self.file_table.setItem(row, 4, status_item)
            
            # File hash (truncated)
            hash_display = file_record.file_hash[:12] + "..." if len(file_record.file_hash) > 12 else file_record.file_hash
            self.file_table.setItem(row, 5, QTableWidgetItem(hash_display))
        
        # Resize columns to content
        self.file_table.resizeColumnsToContents()
    
    def _update_sync_status(self):
        """Update the sync status display."""
        sync_status = self.file_manager.get_sync_status()
        
        if not sync_status:
            return
        
        # Check if all files are synced
        all_synced = all(status == "synced" for status in sync_status.values())
        needs_sync = any(status == "needs_sync" for status in sync_status.values())
        has_missing = any(status == "missing" for status in sync_status.values())
        
        if has_missing:
            self.sync_status_label.setText("Sync Status: Missing Files")
            self.sync_status_label.setStyleSheet("color: red; font-weight: bold;")
        elif needs_sync:
            self.sync_status_label.setText("Sync Status: Needs Sync")
            self.sync_status_label.setStyleSheet("color: orange; font-weight: bold;")
        elif all_synced:
            self.sync_status_label.setText("Sync Status: All Synced")
            self.sync_status_label.setStyleSheet("color: green; font-weight: bold;")
    
    def _format_file_size(self, size_bytes: int) -> str:
        """Format file size in human-readable format."""
        if size_bytes == 0:
            return "0 B"
        
        units = ["B", "KB", "MB", "GB"]
        size = float(size_bytes)
        unit_index = 0
        
        while size >= 1024 and unit_index < len(units) - 1:
            size /= 1024
            unit_index += 1
        
        return f"{size:.1f} {units[unit_index]}"
    
    def _log_message(self, message: str):
        """Add a message to the log display."""
        from datetime import datetime
        timestamp = datetime.now().strftime("%H:%M:%S")
        log_entry = f"[{timestamp}] {message}"
        
        self.log_text.append(log_entry)
        
        # Auto-scroll to bottom
        scrollbar = self.log_text.verticalScrollBar()
        scrollbar.setValue(scrollbar.maximum())
    
    @pyqtSlot(str, object)
    def _on_file_synced(self, file_id: str, file_record: FileRecord):
        """Callback when a file is synced."""
        self._log_message(f"🔄 Sync callback: {file_record.filename} ({file_id})")
    
    def closeEvent(self, event):
        """Clean up when closing the application."""
        self._log_message("Shutting down file manager...")
        self.file_manager.shutdown()
        event.accept()


def main():
    """Main entry point for the file manager UI."""
    app = QApplication(sys.argv)
    
    # Set application properties
    app.setApplicationName("MAGK Excel File Manager")
    app.setApplicationVersion("1.0")
    
    # Create and show main window
    window = FileManagerUI()
    window.show()
    
    # Run the application
    sys.exit(app.exec())


if __name__ == "__main__":
    main()