"""
MAGK Excel Desktop Client - Main Entry Point

A PyQt 6.x desktop application for natural language workflow building.
This is the main entry point that initializes and runs the chat interface.
"""

import sys
import os
from PyQt6.QtWidgets import QApplication
from PyQt6.QtCore import Qt
from PyQt6.QtGui import QIcon

# Add current directory to path for imports
sys.path.insert(0, os.path.dirname(__file__))

from ui.chat_window import ChatWindow


def main():
    """
    Main application entry point.
    
    Initializes PyQt application and displays the chat window.
    """
    # Create QApplication instance
    app = QApplication(sys.argv)
    
    # Set application properties
    app.setApplicationName("MAGK Excel")
    app.setApplicationDisplayName("MAGK Excel - Chat Interface")
    app.setApplicationVersion("1.0.0")
    app.setOrganizationName("MAGK Team")
    
    # Enable high DPI support
    app.setAttribute(Qt.ApplicationAttribute.AA_EnableHighDpiScaling)
    app.setAttribute(Qt.ApplicationAttribute.AA_UseHighDpiPixmaps)
    
    # Create and show main window
    chat_window = ChatWindow()
    chat_window.show()
    
    # Start event loop
    return app.exec()


if __name__ == "__main__":
    sys.exit(main())