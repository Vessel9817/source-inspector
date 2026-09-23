import assert from 'node:assert';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { mockBrowser, unmockBrowser } from '.';
import * as background from '../../../src/pages/shared/background';

// Be VERY intentional about importing from outside src/ and test/
import { ALLOWED_BROWSERS } from '../../../webpack/validators';

describe('background commons', () => {
    for (const BROWSER of ALLOWED_BROWSERS) {
        describe(BROWSER, () => {
            describe('testInjectionUri', () => {
                beforeEach(() => {
                    mockBrowser(BROWSER);
                });

                it('passes with HTTP URLs', async () => {
                    assert.strictEqual(
                        await background.testInjectionUri('http://example.com'),
                        true
                    );
                });

                it('passes with HTTPS URLs', async () => {
                    assert.strictEqual(
                        await background.testInjectionUri('https://example.com'),
                        true
                    );
                });

                it('fails with insufficient incognito mode permission', async () => {
                    globalThis.chrome.extension = {
                        ...globalThis.chrome.extension,
                        inIncognitoContext: true
                    };
                    globalThis.browser.extension.isAllowedIncognitoAccess = () => Promise.resolve(false);

                    assert.strictEqual(
                        await background.testInjectionUri('https://example.com'),
                        false
                    );
                });

                it('passes with sufficient incognito mode permission', async () => {
                    globalThis.chrome.extension = {
                        ...globalThis.chrome.extension,
                        inIncognitoContext: true
                    };
                    globalThis.browser.extension.isAllowedIncognitoAccess = () => Promise.resolve(true);

                    assert.strictEqual(
                        await background.testInjectionUri('https://example.com'),
                        true
                    );
                });

                it('fails with insufficient file access permission', async () => {
                    globalThis.browser.extension.isAllowedFileSchemeAccess = () => Promise.resolve(false);

                    assert.strictEqual(
                        await background.testInjectionUri('file:///C:/test.html'),
                        false
                    );
                });

                it('passes with sufficient file access permission', async () => {
                    globalThis.browser.extension.isAllowedFileSchemeAccess = () => Promise.resolve(true);

                    assert.strictEqual(
                        await background.testInjectionUri('file:///C:/test.html'),
                        true
                    );
                });

                afterEach(() => {
                    unmockBrowser();
                });
            });
        });
    }
});
