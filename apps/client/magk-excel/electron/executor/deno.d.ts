// Deno type declarations for sandbox_runner.ts
// This file provides minimal type definitions for Deno APIs used in the sandbox

declare namespace Deno {
  interface ImportMeta {
    main: boolean;
    url: string;
  }

  const args: string[];
  
  function exit(code?: number): never;
  
  function readFile(path: string | URL): Promise<Uint8Array>;
  function writeFile(path: string | URL, data: Uint8Array): Promise<void>;
  function writeTextFile(path: string | URL, data: string): Promise<void>;
  
  function stat(path: string | URL): Promise<FileInfo>;
  function statSync(path: string | URL): FileInfo;
  
  function mkdir(path: string | URL, options?: { recursive?: boolean }): Promise<void>;
  function mkdirSync(path: string | URL, options?: { recursive?: boolean }): void;
  
  function cwd(): string;
  
  interface FileInfo {
    isFile: boolean;
    isDirectory: boolean;
    size: number;
    mtime: Date | null;
  }

  namespace env {
    function get(key: string): string | undefined;
  }

  namespace build {
    const os: string;
  }
}

// Import meta is accessed via import.meta syntax, not as a const
// TypeScript understands import.meta natively in ES modules