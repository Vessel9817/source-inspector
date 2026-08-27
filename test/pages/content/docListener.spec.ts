import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { load } from '../shared';

describe('content script', () => {
    beforeEach(() => {
        const node = Object.create({});

        node.ELEMENT_NODE = 1;
        node.ATTRIBUTE_NODE = 2;
        node.TEXT_NODE = 3;
        node.CDATA_SECTION_NODE = 4;
        node.ENTITY_REFERENCE_NODE = 5;
        node.ENTITY_NODE = 6;
        node.PROCESSING_INSTRUCTION_NODE = 7;
        node.COMMENT_NODE = 8;
        node.DOCUMENT_NODE = 9;
        node.DOCUMENT_TYPE_NODE = 10;
        node.DOCUMENT_FRAGMENT_NODE = 11;
        node.NOTATION_NODE = 12;
        globalThis.Node = node;
    });

    it('closes connection on timeout', async (t) => {
        // Mockups
        globalThis.chrome = {
            i18n: {
                getMessage: (...args) => ''
            } as typeof chrome.i18n,
            runtime: {
                onConnect: {
                    addListener: (...args) => {},
                    removeListener: (...args) => {}
                },
                sendMessage: (...args) => {}
            } as typeof chrome.runtime,
        } as typeof chrome;

        const cleanup = t.mock.method(globalThis.chrome.runtime.onConnect, 'removeListener');

        t.mock.timers.enable({ apis: ['setTimeout'], now: Date.now() });

        await load<typeof import('../../../src/pages/content/docListener')>('../../../src/pages/content/docListener');
        t.mock.timers.runAll();

        assert.equal(cleanup.mock.callCount(), 1);
    });

    afterEach(() => {
        Reflect.deleteProperty(globalThis, 'chrome');
        Reflect.deleteProperty(globalThis, 'window');
        Reflect.deleteProperty(globalThis, 'MutationObserver');
        Reflect.deleteProperty(globalThis, 'Node');
    });
});
