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

export function getMessage(
    messageName: 'ext_name',
    substitutions: []
): string;
export function getMessage(
    messageName: 'ext_description',
    substitutions: []
): string;
export function getMessage(
    messageName: 'ext_author',
    substitutions: []
): string;
export function getMessage(
    messageName: 'script_disconnected',
    substitutions: []
): string;
export function getMessage(
    messageName: 'script_connected',
    substitutions: []
): string;
export function getMessage(
    messageName: 'popup_disconnected',
    substitutions: []
): string;
export function getMessage(
    messageName: 'bg_connecting',
    substitutions: []
): string;
export function getMessage(
    messageName: 'bg_registered',
    substitutions: []
): string;
export function getMessage(
    messageName: 'bg_script_initialized',
    substitutions: [string]
): string;
export function getMessage(
    messageName: 'bg_popup_initialized',
    substitutions: [string]
): string;
export function getMessage(
    messageName: 'bg_script_timeout',
    substitutions: [string, string]
): string;
export function getMessage(
    messageName: 'bg_popup_timeout',
    substitutions: [string, string]
): string;
export function getMessage(
    messageName: 'renderer_unknown',
    substitutions: [string]
): string;
export function getMessage(
    messageName: 'script_char_mutation',
    substitutions: [string]
): string;
export function getMessage(
    messageName: 'script_invalid_attr',
    substitutions: [string]
): string;
export function getMessage(
    messageName: 'script_missing_attr',
    substitutions: []
): string;
export function getMessage(
    messageName: 'script_caution',
    substitutions: []
): string;
export function getMessage(
    messageName: 'script_missing_node',
    substitutions: []
): string;
export function getMessage(
    messageName: 'script_unsupported_node',
    substitutions: [string, string]
): string;
export function getMessage(
    messageName: 'script_unimplemented_node',
    substitutions: [string, string]
): string;
export function getMessage(
    messageName: 'script_ready',
    substitutions: []
): string;
export function getMessage(
    messageName: 'renderer_timeout',
    substitutions: []
): string;
export function getMessage(
    messageName: 'popup_connected',
    substitutions: [string]
): string;
export function getMessage(
    messageName: 'popup_sibling_missing',
    substitutions: [string]
): string;
export function getMessage(
    messageName: 'popup_invalid_msg',
    substitutions: []
): string;
export function getMessage(
    messageName: 'popup_root_missing',
    substitutions: [string]
): string;
export function getMessage(
    messageName: 'popup_root_sibling_missing',
    substitutions: [string]
): string;
export function getMessage(
    messageName: 'popup_missing_node',
    substitutions: [string]
): string;
export function getMessage(
    messageName: 'popup_hanging_attr',
    substitutions: []
): string;
export function getMessage(
    messageName: 'popup_node_removed',
    substitutions: [string]
): string;
export function getMessage(
    messageName: 'popup_unsupported_node',
    substitutions: [string]
): string;
export function getMessage(
    messageName: 'popup_invalid_update',
    substitutions: []
): string;
export function getMessage(
    messageName: 'popup_validation_failed',
    substitutions: []
): string;
/**
 * Returns a message in the user's localization
 * @param messageName The `messages.json` key
 * @param substitutions The substitution arguments
 */
export function getMessage(
    messageName: keyof typeof import('../../../_locales/en/messages.json'),
    substitutions: string[]
): string {
    return chrome.i18n.getMessage(messageName, substitutions);
}
