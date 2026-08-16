import type { BrowserName } from '../../../webpack/env';

/**
 * `true` when the extension is run in production mode, `false` otherwise
 */
export const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * The browser name this extension was built for.
 * Helps designate browser-specific behavior.
 */
export const BROWSER = process.env.BROWSER as BrowserName;
