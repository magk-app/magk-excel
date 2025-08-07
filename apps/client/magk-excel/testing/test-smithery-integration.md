# Smithery MCP Server Integration Test Guide

## What Was Fixed

1. **Install buttons are no longer grayed out** - You can now install/connect to ANY Smithery server
2. **Proper handling of hosted vs local servers**:
   - **Hosted servers** (most common): Run on Smithery's infrastructure, accessed via HTTPS
   - **Local servers**: Would require Smithery CLI (we show a note about this)

## How to Test the Integration

### Step 1: Configure Your Smithery API Key
1. Run the app: `npm run dev`
2. Open the MCP server browser
3. You'll see a prompt to configure your API key
4. Get your key from: https://smithery.ai/settings/tokens
5. Enter it in the dialog

### Step 2: Install a Smithery Server
1. Browse the available servers
2. Click "Connect" on any server (e.g., `@modelcontextprotocol/server-github`)
3. If the server needs configuration (like API tokens), enter them
4. Click "Install Server"

### Step 3: Verify in Chat Interface
1. Go to the chat interface
2. The console will show: `🔍 ChatInterface: Current enabled servers: [array including your Smithery server]`
3. Try a command related to your installed server:
   - For GitHub server: "List my recent GitHub repositories"
   - For web scraper: "Scrape the content from https://example.com"
   - For Google search: "Search Google for recent AI news"

## How It Works

### Connection Flow
```
User selects Smithery server
    ↓
Builds connection URL: https://server.smithery.ai/{serverName}/mcp?api_key=xxx
    ↓
Tests connection via StreamableHTTPClientTransport
    ↓
Saves to MCP manager (stored in .smithery.json)
    ↓
Server appears in enabledServers list
    ↓
Chat interface includes it in mcpServers data
    ↓
Backend AI selects appropriate tools for user queries
```

### Debug Information
- Check console for detailed logs:
  - `🔍 Getting server details for: [name]`
  - `🔗 Building connection URL for [name]`
  - `🧪 Testing connection to [url]`
  - `📦 Final install result: {success, connectionUrl}`
  - `🔍 ChatInterface: Current enabled servers: [array]`

## Common Issues & Solutions

1. **"No API key available"**: Make sure you've configured your Smithery API key
2. **Connection timeout**: The server might be down or your API key might be invalid
3. **Tools not showing in chat**: Refresh the page after installation

## Next Steps

The integration is now complete! You can:
1. Install any Smithery MCP server
2. Use them in your chat interface
3. The AI will intelligently select appropriate tools based on your queries