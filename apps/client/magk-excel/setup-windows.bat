@echo off
echo Installing dependencies for Windows...
del /q /s node_modules 2>nul
rmdir /s /q node_modules 2>nul
del package-lock.json 2>nul

echo Installing packages...
npm install

echo Testing Vite...
npx vite --version

echo Setup complete! Now you can run:
echo npm run dev
pause