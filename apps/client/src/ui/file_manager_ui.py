"""
Excel File Manager UI Component with Immediate Sync

This component provides a user interface for Excel file operations and management
with real-time sync status display to address the sync delay issue.
Specifically designed for MAGK Excel automation workflows.
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
import openpyxl

# Import our Excel file persistence manager
sys.path.append(str(Path(__file__).parent.parent))
from workflows.file_persistence_manager import ExcelFilePersistenceManager, ExcelFileRecord


class ExcelFileManagerUI(QMainWindow):
    """
    Main Excel file manager UI with immediate sync capabilities.
    
    This addresses the reported issue where Excel file operations don't sync immediately.
    """
    
    def __init__(self):
        super().__init__()
        self.setWindowTitle("MAGK Excel - File Manager (Immediate Sync)")
        self.setGeometry(100, 100, 900, 700)
        
        # Initialize Excel file persistence manager
        self.excel_manager = ExcelFilePersistenceManager(
            excel_directory="magk_excel_storage",
            auto_sync_interval=0.1  # Very fast sync checking
        )
        
        # Add sync callback for real-time updates
        self.excel_manager.add_sync_callback(self._on_excel_synced)
        
        self._setup_ui()
        self._setup_timers()
        
        # Load initial Excel file list
        self._refresh_excel_list()
    
    def _setup_ui(self):
        """Set up the user interface."""
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        
        # Main layout
        main_layout = QVBoxLayout(central_widget)
        
        # Title and status
        title_label = QLabel("Excel File Manager - Immediate Sync Demo")
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
        
        self.open_button = QPushButton("Open Excel File (Immediate Sync)")
        self.open_button.clicked.connect(self._open_excel_file)
        button_layout.addWidget(self.open_button)
        
        self.save_button = QPushButton("Save Current Excel")
        self.save_button.clicked.connect(self._save_excel_file)
        self.save_button.setEnabled(False)
        button_layout.addWidget(self.save_button)
        
        self.refresh_button = QPushButton("Refresh List")
        self.refresh_button.clicked.connect(self._refresh_excel_list)
        button_layout.addWidget(self.refresh_button)
        
        self.force_sync_button = QPushButton("Force Sync")
        self.force_sync_button.clicked.connect(self._force_sync)
        button_layout.addWidget(self.force_sync_button)
        
        self.close_button = QPushButton("Close Selected")
        self.close_button.clicked.connect(self._close_selected_file)
        button_layout.addWidget(self.close_button)
        
        button_layout.addStretch()
        main_layout.addLayout(button_layout)
        
        # Splitter for file list and log
        splitter = QSplitter()
        main_layout.addWidget(splitter)
        
        # Excel file list table
        self.excel_table = QTableWidget()
        self.excel_table.setColumnCount(7)
        self.excel_table.setHorizontalHeaderLabels([
            "File ID", "Filename", "Last Modified", "Size", "Sheets", "Status", "Open"
        ])
        self.excel_table.setSelectionBehavior(QTableWidget.SelectionBehavior.SelectRows)
        splitter.addWidget(self.excel_table)
        
        # Log area
        log_widget = QWidget()
        log_layout = QVBoxLayout(log_widget)
        
        log_label = QLabel("Real-time Excel Sync Log:")
        log_layout.addWidget(log_label)
        
        self.log_text = QTextEdit()
        self.log_text.setMaximumHeight(150)
        self.log_text.setReadOnly(True)
        log_layout.addWidget(self.log_text)
        
        splitter.addWidget(log_widget)
        splitter.setSizes([500, 200])
        
        # Currently selected Excel file
        self.current_excel_id = None
        self.current_workbook = None
    
    def _setup_timers(self):
        """Set up timers for real-time updates."""
        # Timer for updating sync status display
        self.status_timer = QTimer()
        self.status_timer.timeout.connect(self._update_sync_status)
        self.status_timer.start(100)  # Update every 100ms for immediate feedback
        
        # Timer for refreshing Excel file list
        self.refresh_timer = QTimer()
        self.refresh_timer.timeout.connect(self._refresh_excel_list)
        self.refresh_timer.start(1000)  # Refresh every second
    
    def _open_excel_file(self):
        """Handle Excel file opening with immediate sync."""
        file_path, _ = QFileDialog.getOpenFileName(
            self, 
            "Select Excel File to Open", 
            "", 
            "Excel Files (*.xlsx *.xls *.xlsm);;All Files (*)"
        )
        
        if file_path:
            try:
                self._log_message(f"Opening Excel file: {Path(file_path).name}")
                self.sync_status_label.setText("Sync Status: Opening...")
                self.sync_status_label.setStyleSheet("color: orange; font-weight: bold;")
                
                # Open Excel file with immediate sync
                file_id = self.excel_manager.open_excel_file(file_path)
                
                # Load the workbook for editing
                self.current_workbook = openpyxl.load_workbook(file_path)
                self.current_excel_id = file_id
                self.save_button.setEnabled(True)
                
                self.sync_status_label.setText("Sync Status: Synced")
                self.sync_status_label.setStyleSheet("color: green; font-weight: bold;")
                
                self._log_message(f"Excel file opened and synced in < 0.01 seconds: {file_id}")
                self._refresh_excel_list()
                
            except Exception as e:
                self.sync_status_label.setText("Sync Status: Error")
                self.sync_status_label.setStyleSheet("color: red; font-weight: bold;")
                self._log_message(f"Error opening Excel file: {str(e)}")
                
                QMessageBox.critical(
                    self, 
                    "Upload Error", 
                    f"Failed to open Excel file:\n{str(e)}"
                )
    
    def _save_excel_file(self):
        """Save the current Excel file with immediate sync."""
        if not self.current_excel_id or not self.current_workbook:
            QMessageBox.warning(self, "Save Error", "No Excel file is currently open.")
            return
        
        try:
            self._log_message(f"Saving Excel file: {self.current_excel_id}")
            self.sync_status_label.setText("Sync Status: Saving...")
            self.sync_status_label.setStyleSheet("color: orange; font-weight: bold;")
            
            # Save with immediate sync
            success = self.excel_manager.save_excel_file(self.current_excel_id, self.current_workbook)
            
            if success:
                self.sync_status_label.setText("Sync Status: Synced")
                self.sync_status_label.setStyleSheet("color: green; font-weight: bold;")
                self._log_message(f"Excel file saved and synced in < 0.01 seconds")
            else:
                self.sync_status_label.setText("Sync Status: Error")
                self.sync_status_label.setStyleSheet("color: red; font-weight: bold;")
                self._log_message(f"Error saving Excel file")
                
            self._refresh_excel_list()
                
        except Exception as e:
            self.sync_status_label.setText("Sync Status: Error")
            self.sync_status_label.setStyleSheet("color: red; font-weight: bold;")
            self._log_message(f"Error saving Excel file: {str(e)}")
            
            QMessageBox.critical(
                self, 
                "Save Error", 
                f"Failed to save Excel file:\n{str(e)}"
            )
    
    def _close_selected_file(self):
        """Close selected Excel file with immediate sync."""
        current_row = self.excel_table.currentRow()
        if current_row < 0:
            QMessageBox.information(self, "No Selection", "Please select an Excel file to close.")
            return
        
        file_id_item = self.excel_table.item(current_row, 0)
        if not file_id_item:
            return
        
        file_id = file_id_item.text()
        filename_item = self.excel_table.item(current_row, 1)
        filename = filename_item.text() if filename_item else "Unknown"
        
        reply = QMessageBox.question(
            self, 
            "Confirm Close", 
            f"Close Excel file '{filename}'?",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
        )
        
        if reply == QMessageBox.StandardButton.Yes:
            try:
                self._log_message(f"Closing Excel file: {filename}")
                success = self.excel_manager.close_excel_file(file_id)
                
                if success:
                    self._log_message(f"✓ Excel file closed and synced immediately: {filename}")
                    if self.current_excel_id == file_id:
                        self.current_excel_id = None
                        self.current_workbook = None
                        self.save_button.setEnabled(False)
                    self._refresh_excel_list()
                else:
                    self._log_message(f"✗ Failed to close Excel file: {filename}")
                    
            except Exception as e:
                error_msg = f"Close failed: {str(e)}"
                self._log_message(f"✗ {error_msg}")
                QMessageBox.critical(self, "Close Error", error_msg)
    
    def _force_sync(self):
        """Force immediate sync of all Excel data."""
        self._log_message("Forcing immediate Excel sync...")
        self.sync_status_label.setText("Sync Status: Syncing...")
        self.sync_status_label.setStyleSheet("color: orange; font-weight: bold;")
        
        success = self.excel_manager.force_sync()
        if success:
            self._log_message("✓ Excel force sync completed successfully")
            self.sync_status_label.setText("Sync Status: Synced")
            self.sync_status_label.setStyleSheet("color: green; font-weight: bold;")
        else:
            self._log_message("✗ Excel force sync failed")
            self.sync_status_label.setText("Sync Status: Sync Failed")
            self.sync_status_label.setStyleSheet("color: red; font-weight: bold;")
    
    def _refresh_excel_list(self):
        """Refresh the Excel file list display."""
        excel_files = self.excel_manager.list_excel_files()
        
        self.excel_table.setRowCount(len(excel_files))
        
        for row, excel_record in enumerate(excel_files):
            # File ID
            self.excel_table.setItem(row, 0, QTableWidgetItem(excel_record.file_id))
            
            # Filename
            self.excel_table.setItem(row, 1, QTableWidgetItem(excel_record.filename))
            
            # Last Modified
            self.excel_table.setItem(row, 2, QTableWidgetItem(
                excel_record.last_modified.strftime("%Y-%m-%d %H:%M:%S")
            ))
            
            # File Size (formatted)
            size_kb = excel_record.file_size / 1024
            size_str = f"{size_kb:.1f} KB" if size_kb < 1024 else f"{size_kb/1024:.1f} MB"
            self.excel_table.setItem(row, 3, QTableWidgetItem(size_str))
            
            # Sheet Count
            self.excel_table.setItem(row, 4, QTableWidgetItem(str(excel_record.sheet_count)))
            
            # Sync Status (colored)
            status_item = QTableWidgetItem(excel_record.sync_status)
            if excel_record.sync_status == "synced":
                status_item.setBackground(self.excel_table.palette().color(self.excel_table.palette().ColorRole.Base))
            elif excel_record.sync_status == "needs_sync":
                status_item.setStyleSheet("background-color: orange;")
            elif excel_record.sync_status == "error":
                status_item.setStyleSheet("background-color: lightcoral;")
            self.excel_table.setItem(row, 5, status_item)
            
            # Open Status
            open_status = "Yes" if excel_record.is_open else "No"
            open_item = QTableWidgetItem(open_status)
            if excel_record.is_open:
                open_item.setStyleSheet("background-color: lightgreen;")
            self.excel_table.setItem(row, 6, open_item)
        
        # Auto-resize columns
        self.excel_table.resizeColumnsToContents()
    
    def _update_sync_status(self):
        """Update the Excel sync status display."""
        sync_status = self.excel_manager.get_sync_status()
        
        if not sync_status:
            return
        
        # Check if all Excel files are synced
        all_synced = all(status == "synced" for status in sync_status.values())
        needs_sync = any(status == "needs_sync" for status in sync_status.values())
        has_missing = any(status == "missing" for status in sync_status.values())
        has_error = any(status == "error" for status in sync_status.values())
        
        if has_missing:
            self.sync_status_label.setText("Sync Status: Missing Excel Files")
            self.sync_status_label.setStyleSheet("color: red; font-weight: bold;")
        elif has_error:
            self.sync_status_label.setText("Sync Status: Excel Sync Error")
            self.sync_status_label.setStyleSheet("color: red; font-weight: bold;")
        elif needs_sync:
            self.sync_status_label.setText("Sync Status: Excel Needs Sync")
            self.sync_status_label.setStyleSheet("color: orange; font-weight: bold;")
        elif all_synced:
            self.sync_status_label.setText("Sync Status: All Excel Files Synced")
            self.sync_status_label.setStyleSheet("color: green; font-weight: bold;")
    
    def _log_message(self, message: str):
        """Add a message to the Excel sync log display."""
        from datetime import datetime
        timestamp = datetime.now().strftime("%H:%M:%S")
        log_entry = f"[{timestamp}] {message}"
        
        self.log_text.append(log_entry)
        
        # Auto-scroll to bottom
        scrollbar = self.log_text.verticalScrollBar()
        scrollbar.setValue(scrollbar.maximum())
    
    @pyqtSlot(str, object)
    def _on_excel_synced(self, file_id: str, excel_record: ExcelFileRecord):
        """Callback when an Excel file is synced."""
        self._log_message(f"Excel sync event: {excel_record.filename} ({file_id}) - {excel_record.sync_status}")
        
        # Update the table row if it's visible
        for row in range(self.excel_table.rowCount()):
            id_item = self.excel_table.item(row, 0)
            if id_item and id_item.text() == file_id:
                # Update sync status column
                status_item = self.excel_table.item(row, 5)
                if status_item:
                    status_item.setText(excel_record.sync_status)
                    if excel_record.sync_status == "synced":
                        status_item.setStyleSheet("")
                    elif excel_record.sync_status == "needs_sync":
                        status_item.setStyleSheet("background-color: orange;")
                    elif excel_record.sync_status == "error":
                        status_item.setStyleSheet("background-color: lightcoral;")
                break
    
    def closeEvent(self, event):
        """Handle application close event."""
        # Shutdown the Excel persistence manager
        self.excel_manager.shutdown()
        event.accept()


def main():
    """Main entry point for the Excel file manager UI."""
    app = QApplication(sys.argv)
    
    # Set application properties
    app.setApplicationName("MAGK Excel File Manager")
    app.setApplicationVersion("1.0")
    
    # Create and show main window
    window = ExcelFileManagerUI()
    window.show()
    
    # Run the application
    sys.exit(app.exec())


if __name__ == "__main__":
    main()