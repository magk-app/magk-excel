# MAGK Excel Desktop Client

A PyQt 6.x desktop application for natural language workflow building. This client provides a professional chat interface that allows users to create data extraction workflows through conversation.

## 🚀 Features

- **Natural Language Interface**: Describe your data extraction needs in plain English
- **Multi-Source Support**: Extract data from web pages, PDF files, and Excel spreadsheets
- **Real-time Chat**: Interactive conversation with AI assistant
- **Workflow Building**: Automatically constructs WorkflowConfig objects from conversation
- **Professional UI**: Modern PyQt 6.x interface optimized for business use
- **Backend Integration**: Seamless communication with serverless AWS backend

## 📋 Requirements

- Python 3.10+
- PyQt 6.x
- Internet connection (for backend communication)

## 🛠️ Installation

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Set up Environment** (optional):
   ```bash
   cp .env.example .env
   # Edit .env with your backend API URL
   ```

## 🏃 Running the Application

### GUI Application
```bash
python src/main.py
```

### Console Demo (No PyQt Required)
```bash
python demo_console.py
```

### Run Tests
```bash
python test_functionality.py
python test_structure.py
```

## 🎯 Usage Examples

### Web Data Extraction
```
User: I want to extract product data from an e-commerce site
Assistant: I can help you extract data from websites! Please provide the URL...
User: The URL is https://store.com/products
Assistant: Great! What specific data would you like to extract?
User: I need the products table with prices and names
Assistant: Perfect! I'll execute the workflow...
```

### PDF Processing
```
User: I have a PDF file with financial data
Assistant: I can help you extract data from PDF documents! Please provide the file path...
User: The file is /path/to/report.pdf
User: I need the financial summary table
Assistant: I'll process your PDF and extract the financial summary...
```

### Excel Operations
```
User: I want to work with an Excel spreadsheet
Assistant: I can help you process Excel files! What operations would you like to perform?
User: Process the sales data in quarterly_report.xlsx
Assistant: I'll help you process your Excel data...
```

## 🏗️ Architecture

### Components

- **`src/main.py`**: Application entry point
- **`src/ui/chat_window.py`**: Main chat interface (PyQt 6.x)
- **`src/api/backend_client.py`**: HTTP client for backend communication
- **`src/workflows/config_builder.py`**: Workflow configuration builder

### Data Flow

1. User types message in chat interface
2. Message processed by WorkflowConfigBuilder
3. AI response requested from backend
4. Response displayed in chat
5. When complete, workflow executed via backend API

## 🧪 Testing

### Test Driven Development (TDD)

This project was built using TDD principles:

1. **Comprehensive Test Suite**: `tests/test_chat_window.py`
2. **Functionality Tests**: `test_functionality.py`  
3. **Structure Tests**: `test_structure.py`

### Test Categories

- **GUI Component Tests**: Window creation, layout, interactions
- **Message Functionality**: Sending, display, validation
- **Backend Integration**: API communication, error handling
- **Workflow Building**: Config extraction, validation
- **Error Scenarios**: Network failures, malformed data

### Running Tests

```bash
# Run all functionality tests
python test_functionality.py

# Run structure verification
python test_structure.py

# Run PyQt tests (requires PyQt installation)
pytest tests/test_chat_window.py -v
```

## 🔧 Configuration

### Environment Variables

Create `.env` file based on `.env.example`:

```
BACKEND_API_URL=https://your-api-gateway-url/api
API_TIMEOUT=30
API_MAX_RETRIES=3
LOG_LEVEL=INFO
WINDOW_WIDTH=900
WINDOW_HEIGHT=700
```

### Backend Integration

The client communicates with the MAGK Excel serverless backend:

- **Endpoint**: `POST /execute-workflow`
- **Request**: WorkflowConfig JSON
- **Response**: `{"outputUrl": "https://s3.../output.xlsx"}`

## 🎨 UI Features

### Professional Styling
- Modern flat design with rounded corners
- Consistent color scheme (blues and grays)
- Professional typography (Segoe UI)
- Responsive layouts

### Chat Interface
- Scrollable message history
- Timestamp display
- Message type indicators (User/Assistant/Error)
- Auto-scroll to latest messages

### User Experience
- Enter key sends messages
- Input validation
- Loading states during API calls
- Error handling with user-friendly messages

## 🚧 Development

### Project Structure
```
apps/client/
├── src/
│   ├── main.py              # Application entry point
│   ├── ui/
│   │   └── chat_window.py   # Main chat interface
│   ├── api/
│   │   └── backend_client.py # HTTP client
│   └── workflows/
│       └── config_builder.py # WorkflowConfig construction
├── tests/
│   └── test_chat_window.py  # Comprehensive test suite
├── demo_console.py          # Console demo
├── test_functionality.py    # Functionality tests
├── test_structure.py       # Structure verification
├── requirements.txt        # Dependencies
└── README.md              # This file
```

### Adding Features

1. **New UI Components**: Add to `src/ui/`
2. **API Extensions**: Extend `backend_client.py`
3. **Workflow Logic**: Enhance `config_builder.py`
4. **Tests**: Update `tests/test_chat_window.py`

## 📝 Story 2.1 Acceptance Criteria

✅ **AC 1**: Basic desktop GUI window is created  
✅ **AC 2**: User can send messages  
✅ **AC 3**: Conversation is displayed  
✅ **AC 4**: AI can ask clarifying questions  

## 🎯 Demo Readiness

This application is **demo-ready** with:

- Professional appearance suitable for business presentations
- Comprehensive error handling
- Real backend integration
- Working conversation flow
- Simulated AI responses for development/testing

## 🔮 Future Enhancements

- File upload support
- Conversation history persistence
- Custom workflow templates
- Advanced error recovery
- Multi-language support
- Dark/light theme toggle

## 📞 Support

For issues or questions:
1. Check the test output for diagnostics
2. Verify backend connectivity
3. Review log files for errors
4. Consult the comprehensive test suite for expected behavior

---

**Built with TDD principles and ready for enterprise demo presentations! 🚀**