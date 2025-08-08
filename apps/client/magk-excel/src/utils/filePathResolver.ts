/**
 * File Path Resolution Utilities
 * Centralizes file path resolution logic for debugging and consistency
 */

export interface FilePathMapping {
  [friendlyName: string]: string; // absolute path
}

export interface FilePathResolutionResult {
  success: boolean;
  resolvedPath: string;
  originalPath: string;
  method: 'exact_match' | 'fuzzy_match' | 'file_system_search' | 'fallback';
  error?: string;
}

export class FilePathResolver {
  /**
   * Resolve a file path using various strategies
   */
  static resolvePath(
    inputPath: string, 
    fileMapping?: FilePathMapping,
    fallbackDirectory?: string
  ): FilePathResolutionResult {
    const originalPath = inputPath;

    // Strategy 1: Return absolute paths as-is
    if (this.isAbsolute(inputPath)) {
      return {
        success: true,
        resolvedPath: inputPath,
        originalPath,
        method: 'exact_match'
      };
    }

    // Strategy 2: Check file mapping (exact match)
    if (fileMapping && fileMapping[inputPath]) {
      return {
        success: true,
        resolvedPath: fileMapping[inputPath],
        originalPath,
        method: 'exact_match'
      };
    }

    // Strategy 3: Fuzzy match in file mapping
    if (fileMapping) {
      for (const [friendlyName, absolutePath] of Object.entries(fileMapping)) {
        if (friendlyName.includes(inputPath) || inputPath.includes(friendlyName)) {
          return {
            success: true,
            resolvedPath: absolutePath,
            originalPath,
            method: 'fuzzy_match'
          };
        }
      }
    }

    // Strategy 4: Search in common directories (browser environment can't do this)
    if (typeof process !== 'undefined' && process.env) {
      const searchPaths = [
        process.env.TMPDIR || '/tmp',
        process.env.HOME ? `${process.env.HOME}/Downloads/MAGK-Excel` : '',
        process.env.USERPROFILE ? `${process.env.USERPROFILE}\\Downloads\\MAGK-Excel` : '',
        process.cwd(),
        fallbackDirectory
      ].filter(Boolean);

      for (const dir of searchPaths) {
        const fullPath = this.joinPath(dir!, inputPath);
        if (this.fileExists(fullPath)) {
          return {
            success: true,
            resolvedPath: fullPath,
            originalPath,
            method: 'file_system_search'
          };
        }
      }
    }

    // Strategy 5: Fallback to input or fallback directory
    const fallbackPath = fallbackDirectory 
      ? this.joinPath(fallbackDirectory, inputPath)
      : inputPath;

    return {
      success: false,
      resolvedPath: fallbackPath,
      originalPath,
      method: 'fallback',
      error: 'File not found in any location'
    };
  }

  /**
   * Create a diagnostic report for file path resolution
   */
  static createDiagnosticReport(
    inputPaths: string[],
    fileMapping?: FilePathMapping,
    fallbackDirectory?: string
  ): {
    summary: {
      total: number;
      resolved: number;
      failed: number;
    };
    results: FilePathResolutionResult[];
  } {
    const results = inputPaths.map(path => 
      this.resolvePath(path, fileMapping, fallbackDirectory)
    );

    const resolved = results.filter(r => r.success).length;
    const failed = results.length - resolved;

    return {
      summary: {
        total: results.length,
        resolved,
        failed
      },
      results
    };
  }

  /**
   * Validate file mapping integrity
   */
  static validateFileMapping(fileMapping: FilePathMapping): {
    valid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    for (const [friendlyName, absolutePath] of Object.entries(fileMapping)) {
      if (!friendlyName || friendlyName.trim() === '') {
        issues.push('Empty friendly name found');
      }

      if (!absolutePath || absolutePath.trim() === '') {
        issues.push(`Empty path for file: ${friendlyName}`);
      }

      if (!this.isAbsolute(absolutePath)) {
        issues.push(`Non-absolute path for file ${friendlyName}: ${absolutePath}`);
      }

      if (typeof process !== 'undefined' && !this.fileExists(absolutePath)) {
        issues.push(`File does not exist: ${friendlyName} -> ${absolutePath}`);
      }
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  // Utility methods
  private static isAbsolute(path: string): boolean {
    if (typeof process !== 'undefined' && process.platform === 'win32') {
      return /^[a-zA-Z]:[\\\/]/.test(path) || path.startsWith('\\\\');
    }
    return path.startsWith('/');
  }

  private static joinPath(dir: string, file: string): string {
    if (typeof process !== 'undefined' && process.platform === 'win32') {
      return dir.endsWith('\\') ? `${dir}${file}` : `${dir}\\${file}`;
    }
    return dir.endsWith('/') ? `${dir}${file}` : `${dir}/${file}`;
  }

  private static fileExists(path: string): boolean {
    if (typeof process === 'undefined') return false;
    
    try {
      // @ts-expect-error Node.js require in renderer process
      const fs = require('fs');
      return fs.existsSync(path);
    } catch {
      return false;
    }
  }
}

// Export for debugging
export function debugFilePathResolution(
  inputPaths: string[],
  fileMapping?: FilePathMapping,
  fallbackDirectory?: string
): void {
  console.group('🔍 File Path Resolution Debug');
  
  console.log('📋 Input Configuration:');
  console.log('- Input paths:', inputPaths);
  console.log('- File mapping:', fileMapping);
  console.log('- Fallback directory:', fallbackDirectory);
  
  if (fileMapping) {
    const validation = FilePathResolver.validateFileMapping(fileMapping);
    console.log('🔧 File Mapping Validation:', validation);
  }

  const report = FilePathResolver.createDiagnosticReport(
    inputPaths,
    fileMapping,
    fallbackDirectory
  );

  console.log('📊 Resolution Summary:', report.summary);
  console.log('📝 Detailed Results:');
  report.results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} [${index}] ${result.originalPath} -> ${result.resolvedPath} (${result.method})`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  console.groupEnd();
}