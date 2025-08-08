// Deno sandbox runner for Excel processing
// Usage: deno run ... sandbox_runner.ts <file:///tmp/code.ts> <out.json>
// Provides rich context with ExcelJS support and file management utilities

/// <reference path="./deno.d.ts" />

// deno-lint-ignore-file no-explicit-any

// @ts-ignore - Deno-specific check
if (typeof Deno !== 'undefined' && (import.meta as any).main) {
  const [, , userModuleUrl, outPath] = Deno.args;
  if (!userModuleUrl || !outPath) {
    console.error('Usage: sandbox_runner.ts <module_url> <out_path>');
    Deno.exit(2);
  }

  // The user code may import ExcelJS or other whitelisted npm packages via npm: specifiers.

  try {
    const mod = await import(userModuleUrl);
    const fn: ((ctx: any) => Promise<any>) | undefined = mod.main;
    if (typeof fn !== 'function') {
      throw new Error('Module must export async function main(ctx)');
    }

    let inputs: any = {};
    try {
      const raw = Deno.env.get('EXECUTOR_INPUTS_JSON') || '{}';
      inputs = JSON.parse(raw);
    } catch {
      inputs = {};
    }

    // Expose a rich context with inputs, paths, and file utilities
    const defaultDownloads = getDefaultDownloadsPath();
    
    // Get any file path mappings from the environment or inputs
    const filePathMap = inputs?._filePathMap || {};
    
    const ctx = { 
      inputs, 
      paths: { 
        output: defaultDownloads,
        temp: Deno.env.get('TMPDIR') || '/tmp',
        downloads: defaultDownloads
      },
      files: {
        // Provide file path mapping from uploaded files
        getPath: (filename: string) => {
          // Check if we have a mapping for this filename
          if (filePathMap[filename]) {
            return filePathMap[filename];
          }
          
          // Try to find the file in common locations
          const possiblePaths = [
            `${Deno.env.get('TMPDIR') || '/tmp'}/${filename}`,
            `${defaultDownloads}/${filename}`,
            filename // If it's already a full path
          ];
          
          for (const p of possiblePaths) {
            try {
              if (Deno.statSync(p)) {
                return p;
              }
            } catch {
              // File doesn't exist at this path, continue
            }
          }
          
          return filename; // Fallback to original name
        },
        
        // List available mapped files
        listMapped: () => Object.keys(filePathMap),
        
        // Get file mapping
        getMapping: () => filePathMap
      }
    } as any;
    const result = await fn(ctx);
    await Deno.writeTextFile(outPath, JSON.stringify({ ok: true, result }));
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await Deno.writeTextFile(outPath, JSON.stringify({ ok: false, error: message }));
    console.error(message);
    Deno.exit(1);
  }
}

function getDefaultDownloadsPath(): string {
  try {
    const home = Deno.env.get('USERPROFILE') || Deno.env.get('HOME') || '';
    if (home) {
      const dl = `${home.replace(/\\/g, '/')}/Downloads/MAGK-Excel`;
      try { 
        Deno.mkdirSync(dl, { recursive: true }); 
        return dl;
      } catch (dirError) {
        console.warn(`Failed to create downloads directory: ${dirError}`);
      }
    }
    
    // Fallback to temp directory
    const tempDir = Deno.env.get('TMPDIR') || Deno.env.get('TMP') || '/tmp';
    const fallbackPath = `${tempDir}/MAGK-Excel`;
    try {
      Deno.mkdirSync(fallbackPath, { recursive: true });
      return fallbackPath;
    } catch {
      return tempDir; // Last resort
    }
  } catch {
    return '/tmp';
  }
}

function isAbsolutePath(path: string): boolean {
  if (!path) return false;
  // Unix absolute path
  if (path.startsWith('/')) return true;
  // Windows absolute path (C:\\ or \\\\)
  if (path.match(/^[A-Za-z]:[/\\]/) || path.startsWith('\\\\\\\\')) return true;
  return false;
}


