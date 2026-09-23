import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { load, mockBrowser, mockEnv, unmockBrowser } from '../shared';

// Be VERY intentional about importing from outside src/ and test/
import { ALLOWED_BROWSERS } from '../../../webpack/validators';

describe('popup background script', () => {
    for (const BROWSER of ALLOWED_BROWSERS) {
        describe(BROWSER, () => {
            beforeEach(() => {
                mockBrowser(BROWSER);
            });

            it('closes connection on timeout', async (t) => {
                // Mockups
                function addListener(
                    listener: (
                        tab: browser.tabs.Tab,
                        info?: browser.action.OnClickData
                    ) => Promise<void>
                ): void {
                    const tab = {
                        id: 1,
                        url: 'https://example.com'
                    } as browser.tabs.Tab;

                    listener(tab).then(() => {
                        t.mock.timers.runAll();
                        assert.equal(cleanup.mock.callCount(), 1);
                    });
                };

                if (BROWSER === 'chrome') {
                    globalThis.chrome.action.onClicked.addListener = addListener;
                }
                else {
                    globalThis.browser.browserAction.onClicked.addListener = addListener;
                }

                const cleanup = t.mock.method(globalThis.chrome.runtime.onMessage, 'removeListener');

                t.mock.timers.enable({ apis: ['setTimeout'], now: Date.now() });
                mockEnv({ BROWSER }, t);

                // Test
                const { default: registerPopup } = await load<typeof import('../../../src/pages/popup/background')>('../../../src/pages/popup/background');

                registerPopup();
            });

            afterEach(() => {
                unmockBrowser();
            });
        });
    }
});
