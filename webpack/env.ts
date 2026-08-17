import path from 'node:path';
import * as validators from './validators';
import sanitizePath from 'path-sanitizer';

export const PROJECT_ROOT = path.join(import.meta.dirname, '..');

/* Non-secret env vars, defined in nodemon config */

let outputDir = process.env.OUTPUT_DIR!;
validators.string(outputDir);
outputDir = sanitizePath(outputDir);
export const OUTPUT_ABS_DIR = path.join(PROJECT_ROOT, outputDir);

export const NODE_ENV = process.env.NODE_ENV;
validators.nodeEnv(NODE_ENV);

// Required when _locales folder is bundled
export const DEFAULT_LOCALE = process.env.DEFAULT_LOCALE!;
validators.string(DEFAULT_LOCALE);

export const PACKAGE_VERSION = process.env.PACKAGE_VERSION!;
validators.version(PACKAGE_VERSION);

export const PACKAGE_URL = process.env.PACKAGE_URL;
validators.optional(PACKAGE_URL, validators.string); // No-op

export const BROWSER = process.env.BROWSER;
validators.browser(BROWSER);

export const IS_DEV_MODE = NODE_ENV !== 'production';
