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

export function getMessage(i18nKey: 'ext_name', args: []): string;
export function getMessage(i18nKey: 'ext_description', args: []): string;
export function getMessage(i18nKey: 'ext_author', args: []): string;
export function getMessage(i18nKey: 'script_disconnected', args: []): string;
export function getMessage(i18nKey: 'script_connected', args: []): string;
export function getMessage(i18nKey: 'popup_disconnected', args: []): string;
export function getMessage(i18nKey: 'bg_connecting', args: []): string;
export function getMessage(i18nKey: 'bg_registered', args: []): string;
export function getMessage(i18nKey: 'bg_script_initialized', args: [string]): string;
export function getMessage(i18nKey: 'bg_popup_initialized', args: [string]): string;
export function getMessage(i18nKey: 'bg_script_timeout', args: [string, string]): string;
export function getMessage(i18nKey: 'bg_popup_timeout', args: [string, string]): string;
export function getMessage(i18nKey: 'renderer_unknown', args: [string]): string;
export function getMessage(i18nKey: 'script_char_mutation', args: [string]): string;
export function getMessage(i18nKey: 'script_invalid_attr', args: [string]): string;
export function getMessage(i18nKey: 'script_missing_attr', args: []): string;
export function getMessage(i18nKey: 'script_caution', args: []): string;
export function getMessage(i18nKey: 'script_missing_node', args: []): string;
export function getMessage(i18nKey: 'script_unsupported_node', args: [string, string]): string;
export function getMessage(i18nKey: 'script_unimplemented_node', args: [string, string]): string;
export function getMessage(i18nKey: 'script_ready', args: []): string;
export function getMessage(i18nKey: 'renderer_timeout', args: []): string;
export function getMessage(i18nKey: 'popup_connected', args: [string]): string;
export function getMessage(i18nKey: 'popup_sibling_missing', args: [string]): string;
export function getMessage(i18nKey: 'popup_invalid_msg', args: []): string;
export function getMessage(i18nKey: 'popup_root_missing', args: [string]): string;
export function getMessage(i18nKey: 'popup_root_sibling_missing', args: [string]): string;
export function getMessage(i18nKey: 'popup_missing_node', args: [string]): string;
export function getMessage(i18nKey: 'popup_hanging_attr', args: []): string;
export function getMessage(i18nKey: 'popup_node_removed', args: [string]): string;
export function getMessage(i18nKey: 'popup_unsupported_node', args: [string]): string;
export function getMessage(i18nKey: 'popup_invalid_update', args: []): string;
export function getMessage(i18nKey: 'popup_validation_failed', args: []): string;
/**
 * Returns a message in the user's localization
 * @param i18nKey The `messages.json` key
 * @param args The substitution arguments
 */
export function getMessage(
    i18nKey: keyof typeof import('../../../_locales/en/messages.json'),
    args: string[]
): string {
    let msg = chrome.i18n.getMessage(i18nKey);

    for (let i = 0; i < args.length; i++) {
        msg = msg.replaceAll(`{${i}}`, args[i]);
    }

    return msg;
}
