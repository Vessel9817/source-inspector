import os from 'node:os';
import path from 'node:path';

/**
 * Normalizes paths with `path.normalize`.
 * On Windows, replaces backslashes with forward slashes for compatibility.
 * @param p The path to normalize
 * @returns A normalized path
 */
export function normalize(p: string): string {
    return path.normalize(
        os.platform() === 'win32'
            ? p.replaceAll('\\', '/')
            : p
    );
}
