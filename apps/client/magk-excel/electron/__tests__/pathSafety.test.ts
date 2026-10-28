import fs from 'fs';
import os from 'os';
import path from 'path';
import { isPathWithinRoots, resolveDirWithin, resolveWithin } from '../pathSafety';

describe('path safety helpers', () => {
  let baseDir: string;
  let outsideDir: string;

  beforeEach(() => {
    baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'magk-path-safety-'));
    outsideDir = fs.mkdtempSync(path.join(os.tmpdir(), 'magk-path-outside-'));
    fs.mkdirSync(path.join(baseDir, 'excel'));
    fs.writeFileSync(path.join(baseDir, 'excel', 'a.xlsx'), 'workbook');
    fs.writeFileSync(path.join(outsideDir, 'outside.txt'), 'outside');
  });

  afterEach(() => {
    fs.rmSync(baseDir, { recursive: true, force: true });
    fs.rmSync(outsideDir, { recursive: true, force: true });
  });

  it('rejects traversal and paths outside the base directory', () => {
    expect(() => resolveWithin(baseDir, '../../x.txt')).toThrow('Path escapes allowed directory');
    expect(() => resolveDirWithin(baseDir, '../..')).toThrow('Path escapes allowed directory');
    expect(() => resolveWithin(baseDir, path.join(outsideDir, 'outside.txt'))).toThrow('Path escapes allowed directory');
    expect(() => resolveWithin(baseDir, `${baseDir}-evil`, 'x')).toThrow('Path escapes allowed directory');
  });

  it('allows legitimate files and absolute paths inside the base directory', () => {
    const expectedPath = path.join(baseDir, 'excel', 'a.xlsx');

    expect(resolveWithin(baseDir, 'excel', 'a.xlsx')).toBe(expectedPath);
    expect(resolveWithin(baseDir, expectedPath)).toBe(expectedPath);
  });

  it('allows the base directory when resolving a directory', () => {
    expect(resolveDirWithin(baseDir)).toBe(path.resolve(baseDir));
    expect(resolveDirWithin(baseDir, '.')).toBe(path.resolve(baseDir));
  });

  it('resolves real paths before checking root membership', () => {
    const symlinkPath = path.join(baseDir, 'excel', 'outside-link.txt');
    fs.symlinkSync(path.join(outsideDir, 'outside.txt'), symlinkPath);

    expect(isPathWithinRoots(path.join(baseDir, 'excel', 'a.xlsx'), [baseDir])).toBe(true);
    expect(isPathWithinRoots(symlinkPath, [baseDir])).toBe(false);
    expect(isPathWithinRoots(path.join(baseDir, 'missing.txt'), [baseDir])).toBe(false);
    expect(isPathWithinRoots(path.join(outsideDir, 'outside.txt'), [path.join(baseDir, 'missing-root')])).toBe(false);
  });
});
