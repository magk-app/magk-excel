# MAGK Excel Installation Guide 🚀

Complete setup instructions for getting MAGK Excel running on your system.

---

## 📋 System Requirements

### Minimum Requirements
- **Operating System**: Windows 10, macOS 10.14, or Linux (Ubuntu 18.04+)
- **Memory (RAM)**: 4 GB minimum, 8 GB recommended
- **Storage**: 2 GB available disk space
- **Node.js**: Version 18.0 or higher
- **Python**: Version 3.9 or higher (for backend services)

### Recommended for Optimal Performance
- **Memory**: 16 GB RAM for large dataset processing
- **CPU**: Multi-core processor (4+ cores recommended)
- **Storage**: SSD for faster file operations
- **Network**: Stable internet connection for MCP server integration

---

## ⚡ Quick Installation (5 Minutes)

### Option 1: Pre-built Executables (Easiest)
1. **Download** the latest release from [GitHub Releases](https://github.com/your-org/magk-excel/releases)
2. **Install** the appropriate version for your OS:
   - **Windows**: `MAGK-Excel-Setup.exe`
   - **macOS**: `MAGK-Excel.dmg` 
   - **Linux**: `MAGK-Excel.AppImage`
3. **Launch** the application - it will auto-configure MCP servers
4. **Start automating** - open the Chat tab for AI guidance

### Option 2: Package Managers
```bash
# Windows (Chocolatey)
choco install magk-excel

# macOS (Homebrew)
brew install --cask magk-excel

# Linux (Snap)
sudo snap install magk-excel
```

---

## 🛠️ Developer Installation (Full Setup)

### Step 1: Clone Repository
```bash
git clone https://github.com/your-org/magk-excel.git
cd magk-excel
```

### Step 2: Install Dependencies
```bash
# Install all workspace dependencies
npm install

# Verify installation
npm run verify
```

### Step 3: Start Development Servers
```bash
# Terminal 1 - Frontend React app
npm run dev:client

# Terminal 2 - Node.js workflow engine  
npm run dev:engine

# Terminal 3 - Python extraction server
npm run dev:server
```

### Step 4: Access Application
- **Frontend**: http://localhost:5173
- **Workflow Engine**: http://localhost:8000
- **Python Server**: http://localhost:8080

---

## 📦 Platform-Specific Instructions

### Windows Setup
```bash
# Install Node.js from nodejs.org or use Chocolatey
choco install nodejs python3

# Clone and install
git clone https://github.com/your-org/magk-excel.git
cd magk-excel
npm install
npm run setup:windows

# Run application
npm run electron:dev
```

### macOS Setup  
```bash
# Install prerequisites with Homebrew
brew install node python3

# Clone and install
git clone https://github.com/your-org/magk-excel.git
cd magk-excel
npm install
npm run setup:macos

# Run application
npm run electron:dev
```

### Linux Setup
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nodejs npm python3 python3-pip

# RHEL/CentOS/Fedora
sudo dnf install nodejs npm python3 python3-pip

# Clone and install
git clone https://github.com/your-org/magk-excel.git
cd magk-excel
npm install
npm run setup:linux

# Run application
npm run electron:dev
```

---

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:
```bash
# Backend URLs
REACT_APP_WORKFLOW_ENGINE_URL=http://localhost:8000
REACT_APP_PYTHON_SERVER_URL=http://localhost:8080

# Feature flags
REACT_APP_ENABLE_DEBUG=true
REACT_APP_ENABLE_SMITHERY=true

# Optional: API Keys for external services
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
```

### MCP Server Configuration
The application automatically configures these MCP servers:
- **Excel Server**: Excel file processing
- **Executor Server**: Workflow execution
- **Persistent Server**: Data storage
- **Filesystem Server**: File operations

To add custom servers, edit `mcp-config.json`:
```json
{
  "servers": {
    "custom-server": {
      "command": "python",
      "args": ["path/to/your/server.py"],
      "type": "stdio"
    }
  }
}
```

---

## 🧪 Verify Installation

### Quick Health Check
```bash
# Run all verification tests
npm run verify

# Test individual components
npm run test:frontend
npm run test:backend
npm run test:integration
```

### Manual Verification Steps
1. **Launch application** - Should open without errors
2. **Check MCP tab** - All default servers should be enabled
3. **Test Chat** - AI assistant should respond
4. **Create workflow** - Workflow builder should work
5. **Upload file** - File processing should complete
6. **Export Excel** - Download should generate correctly

---

## 🔍 Troubleshooting

### Common Issues

#### "Node.js not found" Error
**Solution**: Install Node.js 18+ from [nodejs.org](https://nodejs.org)
```bash
# Verify installation
node --version  # Should show v18.0.0 or higher
npm --version   # Should show 8.0.0 or higher
```

#### "Python not found" Error  
**Solution**: Install Python 3.9+ from [python.org](https://python.org)
```bash
# Verify installation
python3 --version  # Should show 3.9.0 or higher
pip3 --version     # Should show pip version
```

#### MCP Servers Not Starting
**Solution**: Check server configurations and dependencies
```bash
# Reset MCP configuration
npm run mcp:reset

# Reinstall MCP dependencies
npm run mcp:install

# Check server status
npm run mcp:status
```

#### Electron App Won't Launch
**Solution**: Rebuild Electron dependencies
```bash
# Clean and rebuild
npm run clean
npm run rebuild:electron
npm run electron:dev
```

#### Port Already in Use Errors
**Solution**: Change ports in configuration or stop conflicting services
```bash
# Check what's using the ports
lsof -i :5173  # Frontend
lsof -i :8000  # Workflow engine  
lsof -i :8080  # Python server

# Kill processes if needed
kill -9 <PID>
```

#### File Upload Not Working
**Solution**: Check file permissions and disk space
```bash
# Check disk space
df -h

# Check upload directory permissions
ls -la uploads/
```

### Performance Issues

#### Slow Workflow Execution
1. **Check available memory**: Close unused applications
2. **Reduce parallel workflows**: Limit concurrent executions
3. **Enable caching**: Set `ENABLE_CACHING=true` in .env
4. **Optimize data**: Process smaller datasets first

#### High Memory Usage
1. **Monitor usage**: Check Task Manager/Activity Monitor
2. **Clear cache**: Use "Clear Cache" in settings
3. **Restart services**: `npm run restart:all`
4. **Update dependencies**: `npm update`

---

## 🆙 Updates and Maintenance

### Automatic Updates
The application checks for updates automatically:
1. **Notification appears** when update is available
2. **Click "Update"** to download and install
3. **Restart application** to apply changes

### Manual Updates
```bash
# Update from source
git pull origin main
npm install
npm run build
```

### Database Maintenance
```bash
# Clear old workflow data (keeps recent workflows)
npm run cleanup:workflows

# Clear all temporary files
npm run cleanup:temp

# Optimize database
npm run db:optimize
```

---

## 🚀 Post-Installation Setup

### First Run Configuration
1. **Welcome screen** - Choose setup mode (Basic/Advanced)
2. **API keys** - Configure external service integrations
3. **File paths** - Set default download/upload directories  
4. **Performance** - Select optimization settings
5. **Privacy** - Configure telemetry preferences

### Recommended First Steps
1. **Take the tour** - Interactive walkthrough of features
2. **Create test workflow** - Use the getting started template
3. **Upload sample file** - Test file processing capabilities
4. **Join community** - Discord server for help and tips
5. **Read documentation** - This guide and user manual

---

## 📞 Getting Help

### Built-in Help
- **Chat Assistant**: Ask questions directly in the app
- **Documentation**: Access via the "Docs" tab
- **Debug Console**: Check for detailed error messages
- **Health Check**: System diagnostic tools

### Community Support
- **Discord**: [discord.gg/magk-excel](https://discord.gg/magk-excel)
- **GitHub Issues**: Report bugs and request features
- **Community Forum**: Questions and discussions
- **Stack Overflow**: Tag questions with `magk-excel`

### Professional Support
- **Priority Support**: Available for business users
- **Custom Integration**: Development services available
- **Training**: Team training and workshops
- **Consulting**: Workflow optimization services

---

## 🎉 You're Ready!

Congratulations! MAGK Excel is now installed and ready to transform your data processing workflows.

### Next Steps:
1. **Open the Documentation tab** for complete usage instructions
2. **Start with the Chat tab** for AI-powered guidance  
3. **Explore the Workflow Builder** to create your first automation
4. **Join our community** to connect with other users
5. **Share your workflows** to help others automate their tasks

### Quick Tips:
- **Use Ctrl+/** for keyboard shortcuts
- **Right-click** for context menus in most areas
- **Drag and drop** files directly onto the application
- **Ask the AI** whenever you're stuck or need guidance

**Welcome to the future of workflow automation!** 🚀

---

*Need immediate help? Just open the Chat tab and ask "How do I get started?" - the AI assistant is always ready to help!*