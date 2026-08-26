// Be VERY intentional about importing from outside src/
import type { BrowserName } from '../../../webpack/validators';

/**
 * Used to differentiate between multi-environment configurations
 */
export const NODE_ENV = process.env.NODE_ENV;

/**
 * `true` when the extension is run in production mode, `false` otherwise
 */
export const IS_PRODUCTION = NODE_ENV === 'production';

/**
 * The browser name this extension was built for.
 * Helps designate browser-specific behavior.
 */
export const BROWSER = process.env.BROWSER as BrowserName;
