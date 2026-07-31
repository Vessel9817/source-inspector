import assert from 'node:assert';
import path from 'node:path';

type BrowserName = 'chrome' | 'firefox';

const __dirname = import.meta.dirname;
export const PROJECT_ROOT = path.join(__dirname, '..');

// Non-secret env vars are defined in nodemon config
const OUTPUT_DIR = process.env.OUTPUT_DIR!;
export const NODE_ENV = process.env.NODE_ENV;
export const BROWSER: BrowserName = process.env.BROWSER as BrowserName;
export const OUTPUT_ABS_DIR = path.join(PROJECT_ROOT, OUTPUT_DIR);
export const PACKAGE_NAME = process.env.PACKAGE_NAME!;
export const PACKAGE_DESCRIPTION = process.env.PACKAGE_DESCRIPTION;
export const PACKAGE_VERSION = process.env.PACKAGE_VERSION!;
export const PACKAGE_AUTHOR = process.env.PACKAGE_AUTHOR;
export const PACKAGE_URL = process.env.PACKAGE_URL;

// Verifying node env
assert.ok(NODE_ENV != null, 'NODE_ENV must be specified');

export const IS_DEV_MODE = NODE_ENV !== 'production';
