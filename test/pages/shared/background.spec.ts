import assert from 'node:assert';
import { describe, it } from 'node:test';
import * as background from '../../../src/pages/shared/background';

describe('background commons', () => {
    describe('testInjectionUri', () => {
        it('passes with HTTP URLs', async () => {
            globalThis.chrome = {
                extension: {
                    inIncognitoContext: false
                } as typeof chrome.extension
            } as typeof chrome;

            assert.strictEqual(
                await background.testInjectionUri('http://example.com'),
                true
            );
        });

        it('passes with HTTPS URLs', async () => {
            globalThis.chrome = {
                extension: {
                    inIncognitoContext: false
                } as typeof chrome.extension
            } as typeof chrome;

            assert.strictEqual(
                await background.testInjectionUri('https://example.com'),
                true
            );
        });

        it('fails with insufficient incognito mode permission', async () => {
            globalThis.chrome = {
                extension: {
                    inIncognitoContext: true
                } as typeof chrome.extension
            } as typeof chrome;
            globalThis.browser = {
                extension: {
                    isAllowedIncognitoAccess: () => Promise.resolve(false)
                } as typeof browser.extension
            } as typeof browser;

            assert.strictEqual(
                await background.testInjectionUri('https://example.com'),
                false
            );
        });

        it('passes with sufficient incognito mode permission', async () => {
            globalThis.chrome = {
                extension: {
                    inIncognitoContext: true
                } as typeof chrome.extension
            } as typeof chrome;
            globalThis.browser = {
                extension: {
                    isAllowedIncognitoAccess: () => Promise.resolve(true)
                } as typeof browser.extension
            } as typeof browser;

            assert.strictEqual(
                await background.testInjectionUri('https://example.com'),
                true
            );
        });

        it('fails with insufficient file access permission', async () => {
            globalThis.chrome = {
                extension: {
                    inIncognitoContext: false
                } as typeof chrome.extension
            } as typeof chrome;
            globalThis.browser = {
                extension: {
                    isAllowedFileSchemeAccess: () => Promise.resolve(false)
                } as typeof browser.extension
            } as typeof browser;

            assert.strictEqual(
                await background.testInjectionUri('file:///C:/test.html'),
                false
            );
        });

        it('passes with sufficient file access permission', async () => {
            globalThis.chrome = {
                extension: {
                    inIncognitoContext: false
                } as typeof chrome.extension
            } as typeof chrome;
            globalThis.browser = {
                extension: {
                    isAllowedFileSchemeAccess: () => Promise.resolve(true)
                } as typeof browser.extension
            } as typeof browser;

            assert.strictEqual(
                await background.testInjectionUri('file:///C:/test.html'),
                true
            );
        });
    });
});
