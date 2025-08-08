"""
MAGK Excel Server - File Sync API

Server-side components for handling file synchronization and persistence.
This complements the client-side file manager to ensure end-to-end sync.
"""
from chalice import Chalice, Response
import json
import time
from typing import Dict, Any

app = Chalice(app_name='magk-excel-server')

# In-memory store for demo (would be replaced with actual database)
file_registry = {}
sync_events = []


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return {
        'status': 'healthy',
        'timestamp': time.time(),
        'service': 'magk-excel-server'
    }


@app.route('/sync/status', methods=['GET'])
def get_sync_status():
    """Get overall sync status."""
    return {
        'total_files': len(file_registry),
        'total_sync_events': len(sync_events),
        'last_sync': sync_events[-1]['timestamp'] if sync_events else None,
        'status': 'synced'
    }


@app.route('/sync/file/{file_id}', methods=['POST'])
def sync_file(file_id: str):
    """Sync a specific file with immediate processing."""
    try:
        request_data = app.current_request.json_body
        
        # Record sync event immediately
        sync_event = {
            'file_id': file_id,
            'timestamp': time.time(),
            'operation': request_data.get('operation', 'upload'),
            'filename': request_data.get('filename', 'unknown'),
            'file_size': request_data.get('file_size', 0)
        }
        
        sync_events.append(sync_event)
        
        # Update file registry immediately
        if sync_event['operation'] == 'upload':
            file_registry[file_id] = {
                'file_id': file_id,
                'filename': sync_event['filename'],
                'upload_time': sync_event['timestamp'],
                'file_size': sync_event['file_size'],
                'sync_status': 'synced'
            }
        elif sync_event['operation'] == 'delete':
            file_registry.pop(file_id, None)
        
        return {
            'success': True,
            'file_id': file_id,
            'sync_time': sync_event['timestamp'],
            'message': f"File {sync_event['operation']} synced immediately"
        }
        
    except Exception as e:
        return Response(
            body={'error': str(e), 'success': False},
            status_code=500,
            headers={'Content-Type': 'application/json'}
        )


@app.route('/files', methods=['GET'])
def list_files():
    """List all synced files."""
    return {
        'files': list(file_registry.values()),
        'count': len(file_registry),
        'timestamp': time.time()
    }


@app.route('/files/{file_id}', methods=['GET'])
def get_file_info(file_id: str):
    """Get information about a specific file."""
    file_info = file_registry.get(file_id)
    
    if file_info:
        return file_info
    else:
        return Response(
            body={'error': 'File not found', 'file_id': file_id},
            status_code=404,
            headers={'Content-Type': 'application/json'}
        )


@app.route('/sync/force', methods=['POST'])
def force_sync():
    """Force a complete sync of all data."""
    try:
        sync_start = time.time()
        
        # In a real implementation, this would sync with external storage
        # For demo, we just validate our in-memory data
        valid_files = len(file_registry)
        
        sync_end = time.time()
        sync_duration = sync_end - sync_start
        
        sync_event = {
            'file_id': 'force_sync',
            'timestamp': sync_end,
            'operation': 'force_sync',
            'filename': 'all_files',
            'file_size': valid_files
        }
        sync_events.append(sync_event)
        
        return {
            'success': True,
            'sync_duration': sync_duration,
            'files_synced': valid_files,
            'timestamp': sync_end,
            'message': 'Force sync completed immediately'
        }
        
    except Exception as e:
        return Response(
            body={'error': str(e), 'success': False},
            status_code=500,
            headers={'Content-Type': 'application/json'}
        )