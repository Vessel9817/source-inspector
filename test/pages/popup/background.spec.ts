import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { load, mockEnv } from '../shared';

// Be VERY intentional about importing from outside src/ and test/
import { ALLOWED_BROWSERS } from '../../../webpack/validators';

describe('popup background script', () => {
    for (const BROWSER of ALLOWED_BROWSERS) {
        describe(BROWSER, () => {
            it('closes connection on timeout', async (t) => {
                // Mockups
                const actionListener = {
                    onClicked: {
                        addListener: (listener: (tab: browser.tabs.Tab, info?: browser.action.OnClickData) => Promise<void>) => {
                            const tab = {
                                id: 1,
                                url: 'https://example.com'
                            } as browser.tabs.Tab;

                            listener(tab).then(() => {
                                t.mock.timers.runAll();
                                assert.equal(cleanup.mock.callCount(), 1);
                            });
                        }
                    } as typeof browser.action.onClicked
                };

                globalThis.chrome = {
                    extension: {
                        inIncognitoContext: false
                    } as typeof chrome.extension,
                    i18n: {
                        getMessage: (...args) => ''
                    } as typeof chrome.i18n,
                    runtime: {
                        getURL: (...args) => '',
                        onMessage: {
                            addListener: (...args) => {},
                            removeListener: (...args) => {}
                        }
                    } as typeof chrome.runtime,
                    scripting: {
                        executeScript: (...args) => {}
                    } as typeof chrome.scripting,
                    windows: {
                        create: () => {}
                    } as typeof chrome.windows
                } as typeof chrome;

                if (BROWSER === 'chrome') {
                    globalThis.chrome.action = actionListener as typeof chrome.action;
                }
                else {
                    globalThis.browser = {
                        browserAction: actionListener as typeof browser.browserAction
                    } as typeof browser;
                }

                const cleanup = t.mock.method(globalThis.chrome.runtime.onMessage, 'removeListener');

                t.mock.timers.enable({ apis: ['setTimeout'], now: Date.now() });

                // Test
                mockEnv({ BROWSER }, t);

                const { default: registerPopup } = await load<typeof import('../../../src/pages/popup/background')>('../../../src/pages/popup/background');

                registerPopup();
            });

            afterEach(() => {
                Reflect.deleteProperty(globalThis, 'chrome');
                Reflect.deleteProperty(globalThis, 'browser');
            });
        });
    }
});
