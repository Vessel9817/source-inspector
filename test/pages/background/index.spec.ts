import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { load } from '../shared';

describe('background script', () => {
    it('registers background scripts', async (t) => {
        // Mockups
        let calls = 0;

        t.mock.module(
            import.meta.resolve('../../../src/pages/popup/background'),
            {
                exports: {
                    default: t.mock.fn(
                        () => {
                            calls++;
                        }
                    )
                }
            }
        );

        globalThis.chrome = {
            i18n: {
                getMessage: (...args) => ''
            } as typeof chrome.i18n,
        } as typeof chrome;

        // Test
        await load('../../../src/pages/background');
        assert.equal(calls, 1);
    });
});
