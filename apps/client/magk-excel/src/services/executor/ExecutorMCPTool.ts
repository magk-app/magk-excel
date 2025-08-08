/**
 * Executor MCP Tool
 * Runs LLM-generated TypeScript in a sandboxed subprocess (Deno preferred).
 */

import os from 'os';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import vm from 'vm';
import { createRequire } from 'module';
import { TextDecoder, TextEncoder } from 'util';
// Get runner path relative to project root
function getRunnerPath(): string {
  // Try to find the project root by looking for package.json
  let currentPath = process.cwd();
  while (currentPath !== path.dirname(currentPath)) {
    if (fs.existsSync(path.join(currentPath, 'package.json'))) {
      // Found package.json, assume this is project root
      const runnerPath = path.join(currentPath, 'electron', 'executor', 'sandbox_runner.ts');
      if (fs.existsSync(runnerPath)) {
        return runnerPath;
      }
    }
    currentPath = path.dirname(currentPath);
  }
  
  // Fallback: use __dirname if available (CommonJS/Jest)
  if (typeof __dirname !== 'undefined') {
    return path.join(__dirname, '../../../electron/executor/sandbox_runner.ts');
  }
  
  // Last resort: relative to cwd
  return path.join(process.cwd(), 'electron/executor/sandbox_runner.ts');
}

export interface MCPToolRequest {
  name: string;
  arguments: Record<string, any>;
}

export interface MCPToolResponse {
  content: Array<{
    type: 'text' | 'resource';
    text?: string;
    resource?: {
      uri: string;
      mimeType: string;
      text?: string;
    };
  }>;
  isError?: boolean;
}

interface RunTsArgs {
  code: string;
  inputs?: Record<string, unknown>;
  readPaths?: string[];
  writePaths?: string[];
  timeoutMs?: number;
  memoryMb?: number;
  libraries?: string[];
  allowNet?: boolean;
}

export class ExecutorMCPTool {
  /** Tool definitions exposed to the LLM for discovery */
  static getToolDefinitions() {
    return [
      {
        name: 'run_ts',
        description:
          'Execute TypeScript code in a sandbox. Provide a single async function export named main(ctx). ExcelJS is supported. Default writable output folder: Downloads/MAGK-Excel.',
        inputSchema: {
          type: 'object',
          properties: {
            code: { type: 'string', description: 'A complete TS module exporting async function main(ctx)' },
            inputs: { type: 'object', description: 'Arbitrary JSON inputs provided as ctx.inputs' },
            filePathMap: { type: 'object', description: 'Optional filename to absolute path mapping for reading uploaded files' },
            readPaths: { type: 'array', items: { type: 'string' }, description: 'Absolute paths allowed for read access' },
            writePaths: { type: 'array', items: { type: 'string' }, description: 'Absolute paths allowed for write access' },
            timeoutMs: { type: 'number', description: 'CPU time limit in milliseconds (default 3000)' },
            memoryMb: { type: 'number', description: 'Memory limit in MB (default 256)' },
            libraries: { type: 'array', items: { type: 'string' }, description: 'Optional npm libraries (e.g., ["exceljs"])' },
            allowNet: { type: 'boolean', description: 'Allow network to fetch npm deps on cold start (defaults to auto if libraries present)' }
          },
          required: ['code']
        }
      }
    ];
  }

  async handleToolCall(request: MCPToolRequest): Promise<MCPToolResponse> {
    try {
      if (request.name !== 'run_ts') {
        return {
          content: [
            { type: 'text', text: `❌ Unknown executor operation: ${request.name}. Use run_ts.` }
          ],
          isError: true
        };
      }

      const args = request.arguments as RunTsArgs;
      if (!args.code || typeof args.code !== 'string') {
        return { content: [{ type: 'text', text: '❌ Missing "code" string.' }], isError: true };
      }

      // Validate that code exports an async main(ctx)
      if (!exportsAsyncMain(args.code)) {
        return {
          content: [{ type: 'text', text: '❌ Please export an async function named "main"' }],
          isError: true
        };
      }

      const result = await this.execute(args);
      return {
        content: [
          { type: 'text', text: JSON.stringify(result, null, 2) }
        ]
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: 'text', text: `❌ Executor error: ${message}` }],
        isError: true
      };
    }
  }

  private async execute(args: RunTsArgs): Promise<unknown> {
    // Prefer Deno runner if available, otherwise fallback to Node runner
    const denoCmd = process.platform === 'win32' ? 'deno.exe' : 'deno';
    const denoPath = resolveOnPATH(denoCmd);
    if (denoPath) {
      return this.executeWithDeno(args, denoPath);
    }
    return this.executeWithNode(args);
  }

  private async executeWithDeno(args: RunTsArgs, denoPath: string): Promise<unknown> {
    const tmpDir = os.tmpdir();
    const codePath = path.join(tmpDir, `code_${Date.now()}_${Math.random().toString(36).slice(2)}.ts`);
    const outPath = path.join(tmpDir, `out_${Date.now()}_${Math.random().toString(36).slice(2)}.json`);

    // Write user code to temp file
    fs.writeFileSync(codePath, args.code, 'utf-8');

    // Locate runner script
    const runnerPath = getRunnerPath();

    const defaultDownloadsPath = getDefaultDownloadsPath();
    const allowRead = new Set<string>([os.tmpdir().replace(/\\/g, '/')]);
    (args.readPaths || []).forEach((p) => allowRead.add(p));
    const allowWrite = new Set<string>([
      os.tmpdir().replace(/\\/g, '/'),
      defaultDownloadsPath.replace(/\\/g, '/')
    ]);
    (args.writePaths || []).forEach((p) => allowWrite.add(p));

    const cpuLimitMs = Math.max(100, Math.min(args.timeoutMs ?? 3000, 10000));
    const memMb = Math.max(64, Math.min(args.memoryMb ?? 256, 1024));

    const denoArgs = [
      'run',
      '--quiet',
      '--no-lock',
      '--unstable',
      `--cpu-time-limit=${Math.ceil(cpuLimitMs / 1000)}`,
      `--memory-limit=${memMb}`,
      `--allow-read=${Array.from(allowRead).join(',')}`,
      `--allow-write=${Array.from(allowWrite).join(',')}`,
      runnerPath,
      pathToFileURLSafe(codePath),
      outPath
    ];

    // Enhanced network access configuration for ExcelJS and other npm dependencies
    const hasNpmImports = /from\s+['"]npm:/.test(args.code) || /import.*npm:/.test(args.code);
    const hasLibraries = args.libraries && args.libraries.length > 0;
    const needsNet = args.allowNet === true || hasLibraries || hasNpmImports;
    
    if (needsNet) {
      // Allow access to npm registries and common CDNs for dependency resolution
      denoArgs.splice(1, 0, '--allow-net=registry.npmjs.org,cdn.jsdelivr.net,esm.sh,cdn.skypack.dev,unpkg.com');
    }

    const mergedInputs = mergeInputsWithFileMap(args.inputs || {}, args as any);
    const env = { ...process.env, EXECUTOR_INPUTS_JSON: JSON.stringify(mergedInputs), DENO_DIR: path.join(os.tmpdir(), '.deno_cache') } as NodeJS.ProcessEnv;

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];
    const child = spawn(denoPath, denoArgs, { stdio: ['ignore', 'pipe', 'pipe'], env });

    const exitCode: number = await new Promise((resolve) => {
      child.stdout.on('data', (d) => stdoutChunks.push(Buffer.from(d)));
      child.stderr.on('data', (d) => stderrChunks.push(Buffer.from(d)));
      child.on('close', (code) => resolve(code ?? -1));
    });

    if (exitCode !== 0) {
      const err = Buffer.concat(stderrChunks).toString() || 'Unknown Deno error';
      throw new Error(`Deno runner failed (${exitCode}): ${err}`);
    }

    try {
      const outRaw = fs.readFileSync(outPath, 'utf-8');
      return JSON.parse(outRaw);
    } catch (e) {
      const errText = Buffer.concat(stderrChunks).toString();
      const outText = Buffer.concat(stdoutChunks).toString();
      throw new Error(`Failed to read output: ${(e as Error).message}. stderr=${errText} stdout=${outText}`);
    } finally {
      safeUnlink(codePath);
      safeUnlink(outPath);
    }
  }

  private async executeWithNode(args: RunTsArgs): Promise<unknown> {
    const tmpDir = os.tmpdir();
    const outPath = path.join(tmpDir, `out_${Date.now()}_${Math.random().toString(36).slice(2)}.json`);

    try {
      // Transform to CommonJS style executed in a VM
      const transformed = transformForNodeCJS(args.code);
      const script = new vm.Script(transformed, { filename: 'user-code.cjs' });
      const sandbox: any = {
        module: { exports: {} },
        exports: {},
        require: undefined as any,
        console,
        process,
        Buffer,
        TextDecoder,
        TextEncoder,
        setTimeout,
        clearTimeout,
      };
      const localRequire = (globalThis as any).require ? (globalThis as any).require : createRequire(path.join(process.cwd(), 'index.js'));
      sandbox.require = localRequire;
      const context = vm.createContext(sandbox);
      script.runInContext(context, { timeout: Math.max(50, Math.min(args.timeoutMs ?? 3000, 10000)) });

      const mainFn = sandbox.module.exports.main;
      if (typeof mainFn !== 'function') {
        return { ok: false, error: 'Module must export async function main(ctx)' };
      }

      const defaultDownloadsPath = getDefaultDownloadsPath();
      const inputs = mergeInputsWithFileMap(args.inputs || {}, args as any);
      const filePathMap: Record<string, string> = (inputs as any)._filePathMap || {};
      const ctx = buildExecutionContextNode(defaultDownloadsPath, filePathMap);
      (ctx as any).inputs = inputs;

      try {
        const result = await Promise.resolve(mainFn(ctx));
        const ok = { ok: true, result };
        fs.writeFileSync(outPath, JSON.stringify(ok));
        return ok;
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        const fail = { ok: false, error: message };
        fs.writeFileSync(outPath, JSON.stringify(fail));
        return fail;
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (/Cannot find module/.test(message) || /Failed to resolve module/.test(message)) {
        throw new Error(`Module import failed: ${message}`);
      }
      throw e;
    } finally {
      safeUnlink(outPath);
    }
  }
}

export const executorMCPTool = new ExecutorMCPTool();

function resolveOnPATH(cmd: string): string | null {
  const PATH = process.env.PATH || '';
  const dirs = PATH.split(path.delimiter);
  for (const d of dirs) {
    const full = path.join(d, cmd);
    if (fs.existsSync(full)) return full;
  }
  return null;
}

function pathToFileURLSafe(p: string): string {
  let resolved = path.resolve(p);
  if (process.platform === 'win32') {
    resolved = resolved.replace(/\\/g, '/');
    if (!resolved.startsWith('/')) resolved = '/' + resolved;
    return `file://${resolved}`;
  }
  return `file://${resolved}`;
}

function safeUnlink(p: string) {
  try { fs.unlinkSync(p); } catch {}
}

function getDefaultDownloadsPath(): string {
  const home = process.env.USERPROFILE || process.env.HOME || '';
  if (!home) {
    return path.join(os.tmpdir(), 'MAGK-Excel');
  }
  const dl = path.join(home, 'Downloads', 'MAGK-Excel');
  try {
    if (!fs.existsSync(dl)) {
      fs.mkdirSync(dl, { recursive: true });
    }
  } catch {}
  return dl;
}

function exportsAsyncMain(code: string): boolean {
  // Quick check for an async exported main function
  const asyncExport = /export\s+async\s+function\s+main\s*\(/.test(code) || /module\.exports\s*=\s*\{\s*main\s*:\s*async\s*\(/.test(code);
  return asyncExport;
}

function mergeInputsWithFileMap(inputs: Record<string, unknown>, args: { filePathMap?: Record<string, string> }): Record<string, unknown> {
  const map = args.filePathMap || {};
  return { ...inputs, _filePathMap: map };
}

function transformForNode(source: string): string {
  let code = source;
  // Replace Deno-style npm specifiers with Node package name
  code = code.replace(/from\s+['"]npm:exceljs@[^'"]+['"]/g, "from 'exceljs'");
  code = code.replace(/from\s+['"]npm:exceljs['"]/g, "from 'exceljs'");
  // Very basic TypeScript annotation stripping (handles ': any' and simple param annotations)
  code = code.replace(/:\s*any\b/g, '');
  code = code.replace(/:\s*(string|number|boolean|unknown|object|never|void)\b/g, '');
  // Remove generic angle annotations in simple cases, e.g., Array<string>
  code = code.replace(/<\s*[A-Za-z0-9_\[\]\|\s,]+\s*>/g, '');
  return code;
}

function transformForNodeCJS(source: string): string {
  let code = transformForNode(source);
  // Convert simple ESM default imports to CommonJS require
  code = code.replace(/import\s+([A-Za-z0-9_]+)\s+from\s+['\"]([^'\"]+)['\"];?/g, 'const $1 = require("$2");');
  // Convert simple ESM named imports to CommonJS require destructuring
  code = code.replace(/import\s+\{\s*([^}]+)\s*\}\s+from\s+['\"]([^'\"]+)['\"];?/g, 'const { $1 } = require("$2");');
  // Convert export async function main(...) to module.exports.main = async function main(...)
  code = code.replace(/export\s+async\s+function\s+main\s*\(/, 'module.exports.main = async function main(');
  // Remove any remaining top-level 'export ' keywords for other declarations
  code = code.replace(/\bexport\s+/g, '');
  return code;
}

function buildExecutionContextNode(defaultDownloadsPath: string, filePathMap: Record<string, string>) {
  const toPosix = (p: string) => p.replace(/\\\\/g, '/');
  const outputDir = defaultDownloadsPath;
  const ensureDir = (dir: string) => { try { fs.mkdirSync(dir, { recursive: true }); } catch {} };
  ensureDir(outputDir);
  const files = {
    getPath: (filename: string) => {
      if (filePathMap[filename]) return filePathMap[filename];
      const candidates = [path.join(os.tmpdir(), filename), path.join(outputDir, filename), filename];
      for (const c of candidates) { if (fs.existsSync(c)) return c; }
      return filename;
    },
    listMapped: () => Object.keys(filePathMap),
    getMapping: () => filePathMap,
    exists: (filename: string) => fs.existsSync(files.getPath(filename)),
    read: async (filename: string) => {
      const resolved = files.getPath(filename);
      const data = fs.readFileSync(resolved);
      return new Uint8Array(data);
    },
    write: async (filename: string, data: Uint8Array | string) => {
      const full = path.join(outputDir, filename);
      ensureDir(path.dirname(full));
      if (typeof data === 'string') {
        fs.writeFileSync(full, data, 'utf-8');
      } else {
        fs.writeFileSync(full, Buffer.from(data));
      }
      return toPosix(full);
    },
    createOutputPath: (filename: string) => path.join(outputDir, filename)
  };

  const excel = {
    MIME_TYPES: { XLSX: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
    generateOutputName: (base: string, ext: string = 'xlsx') => {
      const safe = String(base).replace(/\s+/g, '_');
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      return `${safe}_${stamp}.${ext}`;
    },
    getFileType: (filename: string) => {
      const lower = filename.toLowerCase();
      if (lower.endsWith('.xlsx')) return 'xlsx';
      if (lower.endsWith('.xls')) return 'xls';
      return 'unknown';
    }
  };

  const ctx = {
    env: { platform: process.platform, arch: process.arch },
    paths: { output: outputDir, temp: os.tmpdir(), downloads: outputDir },
    files,
    excel,
    log: {
      info: (...args: any[]) => console.log('[executor]', ...args),
      error: (...args: any[]) => console.error('[executor]', ...args)
    }
  };
  return ctx;
}


