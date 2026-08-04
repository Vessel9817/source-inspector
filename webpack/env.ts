import assert from 'node:assert';
import path from 'node:path';

type BrowserName = 'chrome' | 'firefox';

const __dirname = import.meta.dirname;
export const PROJECT_ROOT = path.join(__dirname, '..');

// Non-secret env vars are defined in nodemon config
const OUTPUT_DIR = process.env.OUTPUT_DIR!;
export const NODE_ENV = process.env.NODE_ENV;
export const BROWSER: BrowserName = process.env.BROWSER as BrowserName;
export const DEFAULT_LOCALE = process.env.DEFAULT_LOCALE!;
export const OUTPUT_ABS_DIR = path.join(PROJECT_ROOT, OUTPUT_DIR);
export const PACKAGE_VERSION = process.env.PACKAGE_VERSION!;
export const PACKAGE_URL = process.env.PACKAGE_URL;

// Verifying node env
assert.ok(NODE_ENV != null, 'NODE_ENV must be specified');

export const IS_DEV_MODE = NODE_ENV !== 'production';
