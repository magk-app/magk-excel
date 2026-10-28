import fs from 'node:fs'
import path from 'node:path'

export function resolveWithin(baseDir: string, ...segments: string[]): string {
  const resolvedBaseDir = path.resolve(baseDir)
  const resolvedPath = path.resolve(baseDir, ...segments)

  if (!resolvedPath.startsWith(`${resolvedBaseDir}${path.sep}`)) {
    throw new Error('Path escapes allowed directory')
  }

  return resolvedPath
}

export function resolveDirWithin(baseDir: string, subDir?: string): string {
  const resolvedBaseDir = path.resolve(baseDir)
  const resolvedPath = path.resolve(baseDir, subDir ?? '')

  if (resolvedPath !== resolvedBaseDir && !resolvedPath.startsWith(`${resolvedBaseDir}${path.sep}`)) {
    throw new Error('Path escapes allowed directory')
  }

  return resolvedPath
}

export function isPathWithinRoots(filePath: string, roots: string[]): boolean {
  let resolvedFilePath: string
  try {
    resolvedFilePath = fs.realpathSync(filePath)
  } catch {
    return false
  }

  return roots.some(root => {
    try {
      const resolvedRoot = fs.realpathSync(root)
      return resolvedFilePath.startsWith(`${resolvedRoot}${path.sep}`)
    } catch {
      return false
    }
  })
}
