# MAGK Excel - Desktop Application

Modern desktop application built with high-star open-source libraries for Excel workflow automation.

## Tech Stack

- **Desktop Framework + Vite**: Lightning-fast development with hot reload
- **React 18 + TypeScript**: Modern frontend with type safety
- **@nlux/react**: Zero-dependency chat UI component (⭐ 20k stars)
- **Shadcn UI**: Tailwind-based components (⭐ 66k stars)  
- **Zustand**: Minimal state management (⭐ 40k stars)
- **React Flow**: Workflow visualization (⭐ 25k stars)

## Quick Setup

### Windows

Run the automated setup script:
```cmd
setup-windows.bat
```

Or manually:
```cmd
rmdir /s /q node_modules
del package-lock.json
npm install
npm run dev
```

### Linux/macOS/WSL

Run the automated setup script:
```bash
chmod +x setup-linux.sh
./setup-linux.sh
```

Or manually:
```bash
rm -rf node_modules
rm -f package-lock.json
npm install
npm run dev
```

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Preview production build
npm run preview
```

## Platform Notes

- **Cross-platform compatibility**: Node modules need to be installed on the target platform
- **Windows users**: Use Command Prompt or PowerShell (not WSL) for best compatibility
- **Linux/macOS users**: Scripts work in any Unix shell (bash, zsh, etc.)

## Project Structure

```
src/
├── components/          # React components
├── lib/                # Utilities (Shadcn UI helpers)
├── App.tsx             # Main React app
└── main.tsx            # React entry point

electron/
├── main.ts             # Main process
└── preload.ts          # Preload script
```

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default {
  // other rules...
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
  },
}
```

- Replace `plugin:@typescript-eslint/recommended` to `plugin:@typescript-eslint/recommended-type-checked` or `plugin:@typescript-eslint/strict-type-checked`
- Optionally add `plugin:@typescript-eslint/stylistic-type-checked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and add `plugin:react/recommended` & `plugin:react/jsx-runtime` to the `extends` list
