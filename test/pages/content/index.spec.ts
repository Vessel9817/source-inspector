import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { updateAttributeCache } from '../../../src/pages/content/attributeCache';
import { load, mockBrowser, mockDOM, mockEnv, unmockBrowser, unmockDOM } from '../shared';

// Be VERY intentional about importing from outside src/ and test/
import { ALLOWED_BROWSERS } from '../../../webpack/validators';

describe('content script', () => {
    beforeEach(() => {
        mockDOM();
    });

    it('reuses an id when the browser replaces an attribute node', () => {
        const cache = [{ id: 'old-id', attrName: 'data-test' }];

        const entry = updateAttributeCache(cache, 'new-id', 'DATA-TEST');

        assert.equal(entry.id, 'new-id');
        assert.deepEqual(cache, [{ id: 'new-id', attrName: 'data-test' }]);
    });

    it('tracks renamed attributes without adding a duplicate entry', () => {
        const cache = [{ id: 'attribute-id', attrName: 'data-old' }];

        const entry = updateAttributeCache(cache, 'attribute-id', 'data-new');

        assert.equal(entry.attrName, 'data-new');
        assert.deepEqual(cache, [{ id: 'attribute-id', attrName: 'data-new' }]);
    });

    for (const BROWSER of ALLOWED_BROWSERS) {
        describe(BROWSER, () => {
            beforeEach(() => {
                mockBrowser(BROWSER);
            });

            it('closes connection on timeout', async (t) => {
                // Mockups
                const cleanup = t.mock.method(globalThis.chrome.runtime.onConnect, 'removeListener');

                t.mock.timers.enable({ apis: ['setTimeout'], now: Date.now() });
                mockEnv({ BROWSER: BROWSER }, t);
                
                // Test
                await load<typeof import('../../../src/pages/content')>('../../../src/pages/content');
                t.mock.timers.runAll();

                assert.equal(cleanup.mock.callCount(), 1);
            });

            afterEach(() => {
                unmockBrowser();
            })
        });
    }

    afterEach(() => {
        unmockDOM();
    });
});
