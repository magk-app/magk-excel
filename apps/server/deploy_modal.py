#!/usr/bin/env python3
"""
Deployment script for MAGK Excel FastAPI application on Modal.

This script helps deploy the FastAPI application to Modal.com
and provides utilities for managing the deployment.
"""

import subprocess
import sys
import os
from pathlib import Path

def run_command(command, description):
    """Run a command and handle errors."""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        if result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed:")
        print(f"Error: {e.stderr}")
        return False

def check_modal_installation():
    """Check if Modal is installed."""
    try:
        subprocess.run("modal --version", shell=True, check=True, capture_output=True)
        return True
    except subprocess.CalledProcessError:
        return False

def setup_modal():
    """Set up Modal CLI and authentication."""
    if not check_modal_installation():
        print("📦 Installing Modal...")
        if not run_command("pip install modal", "Installing Modal"):
            return False
    
    print("🔑 Setting up Modal authentication...")
    print("Please run 'modal setup' to authenticate with Modal if you haven't already.")
    return True

def create_secrets():
    """Create necessary secrets in Modal."""
    print("🔐 Creating secrets in Modal...")
    print("You need to create the following secret in Modal:")
    print("1. aws-credentials: Your AWS credentials for Bedrock access")
    print("\nTo create secrets, run:")
    print("modal secret create aws-credentials")
    print("Then add your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY")

def deploy_app():
    """Deploy the FastAPI app to Modal."""
    script_path = Path(__file__).parent / "modal_app.py"
    
    if not script_path.exists():
        print(f"❌ modal_app.py not found at {script_path}")
        return False
    
    print("🚀 Deploying FastAPI app to Modal...")
    return run_command(f"modal deploy {script_path}", "Deploying to Modal")

def serve_locally():
    """Serve the app locally for testing."""
    script_path = Path(__file__).parent / "modal_app.py"
    
    if not script_path.exists():
        print(f"❌ modal_app.py not found at {script_path}")
        return False
    
    print("🧪 Starting local Modal development server...")
    print("The app will be available at the URLs shown below.")
    print("Press Ctrl+C to stop the server.")
    
    try:
        subprocess.run(f"modal serve {script_path}", shell=True, check=True)
    except KeyboardInterrupt:
        print("\n🛑 Local server stopped")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Local server failed: {e}")
        return False

def show_usage():
    """Show usage information."""
    print("""
🚀 MAGK Excel Modal Deployment Script

Usage:
    python deploy_modal.py [command]

Commands:
    setup     - Set up Modal CLI and authentication
    secrets   - Show instructions for creating secrets
    deploy    - Deploy the app to Modal
    serve     - Run the app locally for testing
    help      - Show this help message

Examples:
    python deploy_modal.py setup     # First time setup
    python deploy_modal.py secrets   # Configure secrets
    python deploy_modal.py deploy    # Deploy to production
    python deploy_modal.py serve     # Test locally

After deployment, your API will be available at:
- GET /health - Health check
- GET / - API documentation
- POST /extract-tables - Extract tables from PDF
- POST /extract-specific-table - Extract specific table with prompt
""")

def main():
    """Main deployment function."""
    if len(sys.argv) < 2:
        show_usage()
        return
    
    command = sys.argv[1].lower()
    
    if command == "setup":
        setup_modal()
    elif command == "secrets":
        create_secrets()
    elif command == "deploy":
        if setup_modal():
            deploy_app()
    elif command == "serve":
        if setup_modal():
            serve_locally()
    elif command in ["help", "-h", "--help"]:
        show_usage()
    else:
        print(f"Unknown command: {command}")
        show_usage()

if __name__ == "__main__":
    main()