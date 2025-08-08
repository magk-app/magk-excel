# Developer Test Panel

A comprehensive testing interface component integrated into the MAGK Excel application for easy access to all development tests.

## Features

### 🎯 Categorized Test Organization
- **Chat Tests**: API flow, streaming, completion, session management
- **Excel Tests**: MCP functionality, path resolution, file operations
- **MCP Tests**: Server integration, communication, debugging tools
- **Workflow Tests**: Creation, execution, state management
- **Persistence Tests**: File storage, upload functionality

### 🔍 Search & Filter
- Real-time search across test names and descriptions
- Category filtering with test counts
- Expandable/collapsible test categories

### 📊 Test Status Monitoring
- Visual status indicators (idle, running, success, error)
- Live statistics dashboard
- Test execution history

### ⚙️ Development Mode Integration
- Auto-detects `NODE_ENV === 'development'`
- Manual toggle with persistent localStorage setting
- Only shows in development environments

## Usage

### Accessing the Panel

#### Via UI Button
1. Look for the "Dev Tests" button in the chat header (development mode only)
2. Click to open the test panel

#### Via Keyboard Shortcut
- **Ctrl+Shift+T** (Windows/Linux)
- **Cmd+Shift+T** (Mac)

### Running Tests

1. **Browse Categories**: Click category headers to expand/collapse
2. **Search Tests**: Use the search bar to find specific tests
3. **Filter by Category**: Click category filter buttons
4. **Execute Tests**: Click the external link icon next to any test
5. **Monitor Status**: Watch real-time status updates in the panel

### Development Mode

The panel includes a development mode toggle that:
- Controls visibility of the test panel
- Persists setting in localStorage
- Shows current mode status with badge

## Test File Structure

Each test is configured with:

```typescript
interface TestFile {
  id: string;           // Unique identifier
  name: string;         // Display name
  description: string;  // Detailed description
  type: 'html' | 'js'; // File type
  category: string;     // Organizational category
  path: string;         // Relative path from app root
  status?: string;      // Current execution status
  lastRun?: Date;       // Last execution timestamp
}
```

## Integration

### In ChatInterface
```tsx
import { useDeveloperTestPanel } from './DeveloperTestPanel';

export function ChatInterface() {
  const developerTestPanel = useDeveloperTestPanel();
  
  return (
    <div>
      {/* Other components */}
      
      {/* Add to header */}
      <ChatHeader 
        onToggleDevTestPanel={developerTestPanel.toggle}
        // ... other props
      />
      
      {/* Add panel */}
      <developerTestPanel.DeveloperTestPanel />
    </div>
  );
}
```

### Custom Usage
```tsx
import { DeveloperTestPanel, useDeveloperTestPanel } from './DeveloperTestPanel';

// Hook-based approach
function MyComponent() {
  const testPanel = useDeveloperTestPanel();
  
  return (
    <>
      <button onClick={testPanel.show}>Open Tests</button>
      <testPanel.DeveloperTestPanel />
    </>
  );
}

// Direct component usage
function MyComponent() {
  const [showPanel, setShowPanel] = useState(false);
  
  return (
    <DeveloperTestPanel 
      isVisible={showPanel}
      onToggle={() => setShowPanel(!showPanel)}
    />
  );
}
```

## Customization

### Adding New Tests
Edit the `TEST_FILES` array in `DeveloperTestPanel.tsx`:

```typescript
const TEST_FILES: TestFile[] = [
  // ... existing tests
  {
    id: 'my-new-test',
    name: 'My New Test',
    description: 'Description of what this test does',
    type: 'html',
    category: 'custom',
    path: 'testing/my-new-test.html'
  }
];
```

### Adding New Categories
Edit the `TEST_CATEGORIES` object:

```typescript
const TEST_CATEGORIES: Record<string, TestCategory> = {
  // ... existing categories
  custom: {
    id: 'custom',
    name: 'Custom Tests',
    description: 'My custom test category',
    icon: <MyIcon className="w-4 h-4" />,
    color: 'text-blue-500',
    expanded: true
  }
};
```

## Styling

The component uses Tailwind CSS and shadcn/ui components:
- **Card**: Main panel container
- **Button**: Action buttons and toggles
- **Input**: Search functionality  
- **Badge**: Status indicators and counts
- **Switch**: Development mode toggle
- **Tooltip**: Help text and status info

## Keyboard Accessibility

- **Tab Navigation**: Full keyboard navigation support
- **Enter/Space**: Activate buttons and toggles
- **Ctrl+Shift+T**: Global shortcut to toggle panel
- **Escape**: Close panel when focused

## Performance Considerations

- **Memoized Filters**: Efficient test filtering and grouping
- **Lazy Rendering**: Categories render on-demand
- **Local Storage**: Persistent settings without server calls
- **Event Cleanup**: Proper keyboard listener management

## Browser Compatibility

- **Modern Browsers**: Chrome 88+, Firefox 85+, Safari 14+
- **Popup Handling**: Requires popup permissions for test execution
- **Local Storage**: Uses localStorage for settings persistence

## Troubleshooting

### Panel Not Visible
1. Check if in development mode
2. Verify `NODE_ENV` environment variable
3. Check localStorage 'developer-mode' setting

### Tests Not Opening
1. Allow popups in browser settings
2. Check network connectivity
3. Verify test file paths exist

### Keyboard Shortcut Not Working
1. Check if another extension is using Ctrl+Shift+T
2. Ensure panel component is rendered
3. Verify development mode is enabled

## Security Notes

- Test panel only shows in development mode
- External test files open in new windows/tabs
- No sensitive data stored in localStorage
- Proper input sanitization for search terms