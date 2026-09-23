import assert from 'node:assert';
import { mock, type MockModuleContext, type TestContext } from 'node:test';
import { type BrowserName } from '../../../webpack/validators';

// Doesn't actually need to be the default locale
const defaultLocale = {
    ...await import('../../../_locales/en/messages.json'),
    $schema: undefined // Ignore
} as Record<string, { placeholders?: object } | undefined>;

/**
 * Asserts that the i18n message exists
 * and has the appropriate number of substitution arguments
 * @param messageName The message key
 * @param substitutions The text to substitute
 * @returns A blank message
 */
const getMessage: typeof import('../../../src/pages/shared')['getMessage'] = (messageName, substitutions) => {
    assert.ok(
        messageName in defaultLocale,
        `Locale message for key "${messageName}" missing`
    );

    const msg = defaultLocale[messageName];
    const expectedSubs = Object.keys(msg?.placeholders ?? {}).length;

    assert.ok(
        substitutions.length === expectedSubs,
        `Locale message for key ${messageName} has ${expectedSubs}, got: ${substitutions.length}`
    );

    return '';
};

export function mockEnv(
    exports?: Partial<typeof import('../../../src/pages/shared')>,
    t?: TestContext
): MockModuleContext {
    return (t ? t.mock : mock).module(
        import.meta.resolve('../../../src/pages/shared'),
        {
            exports: {
                getMessage,
                ...exports
            }
        }
    );
}

export async function load<T>(path: Readonly<string>): Promise<T> {
    // Query string invalidates module cache
    return await import(`${path}?${crypto.randomUUID()}`);
}

/**
 * Mocks extension globals with no-op APIs and dummy values.
 * @implNote APIs and objects are partial. Any new APIs used should be added.
 * @see {@link unmockBrowser}
 */
export function mockBrowser(browserName: BrowserName): void {
    const id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

    // General extension APIs
    globalThis.browser = {
        /**
         * Minimum Chrome version: 4
         * Minimum Firefox version: 45
         */
        extension: {
            /**
             * Minimum Chrome version: 12
             * Minimum Firefox version: *48
             */
            isAllowedFileSchemeAccess: (...args) => Promise.resolve(false),
            /**
             * Minimum Chrome version: 12
             * Minimum Firefox version: 48
             */
            isAllowedIncognitoAccess: (...args) => Promise.resolve(false)
        }
    } as typeof browser;
    globalThis.chrome = {
        /**
         * Minimum Chrome version: 4
         * Minimum Firefox version: 45
         */
        extension: {
            /**
             * Minimum Chrome version: 7
             * Minimum Firefox version: 45
             */
            inIncognitoContext: false
        },
        /**
         * Minimum Chrome version: 17
         * Minimum Firefox version: 45
         */
        i18n: {
            /**
             * Minimum Chrome version: 17
             * Minimum Firefox version: *45
             */
            getMessage
        },
        /**
         * Minimum Chrome version: 22
         * Minimum Firefox version: 45
         */
        runtime: {
            /**
             * Minimum Chrome version: 22
             * Minimum Firefox version: 45
             */
            getURL: (path) => {
                return browserName === 'chrome'
                    ? `chrome-extension://${id}/${path}`
                    : `moz-extension://${id}/${path}`
            },
            /**
             * Minimum Chrome version: 22
             * Minimum Firefox version: 45
             */
            id,
            /**
             * Minimum Chrome version: 26
             * Minimum Firefox version: 45
             */
            onConnect: {
                addListener: (...args) => {},
                removeListener: (...args) => {}
            },
            /**
             * Minimum Chrome version: 26
             * Minimum Firefox version: 45
             */
            onMessage: {
                addListener: (...args) => {},
                removeListener: (...args) => {}
            },
            /**
             * Minimum Chrome version: 26
             * Minimum Firefox version: 45
             */
            sendMessage: (...args) => {}
        },
        /**
         * Minimum Chrome version: *88
         * Minimum Firefox version: 45
         */
        scripting: {
            /**
             * Minimum Chrome version: 102
             * Minimum Firefox version: 102
             */
            ExecutionWorld: {
                /**
                 * Minimum Chrome version: 102
                 * Minimum Firefox version: 102
                 */
                ISOLATED: 'isolated' as const,
            } as any,
            /**
             * Minimum Chrome version: *102
             * Minimum Firefox version: *102
             */
            executeScript: (...args) => {},
        },
        /**
         * Minimum Chrome version: 4
         * Minimum Firefox version: 45
         */
        tabs: {
            /**
             * Minimum Chrome version: *5
             * Minimum Firefox version: *45
             */
            connect: (...args) => {
                return {
                    disconnect: () => {},
                    onDisconnect: {
                        addListener: () => {}
                    },
                    onMessage: {
                        addListener: () => {}
                    }
                } as unknown;
            },
            /**
             * Minimum Chrome version: 20
             * Minimum Firefox version: 45
             */
            sendMessage: (...args) => {}
        },
        /**
         * Minimum Chrome version: 4
         * Minimum Firefox version: 45
         */
        windows: {
            /**
             * Minimum Chrome version: *5
             * Minimum Firefox version: *52
             */
            create: (...args) => {}
        }
    } as typeof chrome;

    // Browser- or version-specific extension APIs
    if (browserName === 'chrome') {
        // MV3
        globalThis.chrome = {
            ...globalThis.chrome,
            /**
             * Minimum Chrome version: 88
             */
            action: {
                /**
                 * Minimum Chrome version: 88
                 */
                onClicked: {
                    addListener: (...args) => {}
                }
            } as typeof chrome.action
        };
    }
    else {
        // MV2
        globalThis.browser = {
            ...globalThis.browser,
            /**
             * Minimum Firefox version: 45
             */
            browserAction: {
                /**
                 * Minimum Firefox version: 45
                 */
                onClicked: {
                    addListener: (...args) => {}
                }
            }
        } as typeof browser;
    }
}

/**
 * Deletes the mocked extension globals.
 * @see {@link mockBrowser}
 */
export function unmockBrowser(): void {
    Reflect.deleteProperty(globalThis, 'browser');
    Reflect.deleteProperty(globalThis, 'chrome');
}

/**
 * Mocks DOM globals with no-op APIs and dummy values.
 * @implNote APIs and objects are partial. Any new APIs used should be added.
 * @see {@link unmockDOM}
 */
export function mockDOM(): void {
    /**
     * Minimum Chrome version: 1
     * Minimum Firefox version: 1
     */
    globalThis.window = {
        /**
         * Minimum Chrome version: 1
         * Minimum Firefox version: 1
         */
        addEventListener: (...args: Parameters<Window['addEventListener']>) => {},
        /**
         * Minimum Chrome version: 1
         * Minimum Firefox version: 1
         */
        removeEventListener: (...args: Parameters<Window['removeEventListener']>) => {}
    } as Window & typeof globalThis;

    /**
     * Minimum Chrome version: 26
     * Minimum Firefox version: 14
     */
    const MutationObserver = Object.create({});

    /**
     * Minimum Chrome version: 26*
     * Minimum Firefox version: 14*
     */
    MutationObserver.constructor = (callback: MutationCallback) => {
        return {
            /**
             * Minimum Chrome version: 18
             * Minimum Firefox version: 14
             */
            disconnect: () => {},
            /**
             * Minimum Chrome version: 18*
             * Minimum Firefox version: 14*
             */
            observe: (...args: Parameters<MutationObserver['observe']>) => {}
        };
    };

    globalThis.MutationObserver = MutationObserver;

    /**
     * Minimum Chrome version: 1
     * Minimum Firefox version: 1
     */
    const Node = Object.create({});

    /**
     * Minimum Chrome version: 1
     * Minimum Firefox version: 1
     */
    Node.ELEMENT_NODE = 1;
    /**
     * Minimum Chrome version: 1
     * Minimum Firefox version: 1
     */
    Node.ATTRIBUTE_NODE = 2;
    /**
     * Minimum Chrome version: 1
     * Minimum Firefox version: 1
     */
    Node.TEXT_NODE = 3;
    /**
     * Minimum Chrome version: 1
     * Minimum Firefox version: 1
     */
    Node.CDATA_SECTION_NODE = 4;
    /**
     * Minimum Chrome version: 1
     * Minimum Firefox version: 1
     */
    Node.ENTITY_REFERENCE_NODE = 5;
    /**
     * Minimum Chrome version: 1
     * Minimum Firefox version: 1
     */
    Node.ENTITY_NODE = 6;
    /**
     * Minimum Chrome version: 1
     * Minimum Firefox version: 1
     */
    Node.PROCESSING_INSTRUCTION_NODE = 7;
    /**
     * Minimum Chrome version: 1
     * Minimum Firefox version: 1
     */
    Node.COMMENT_NODE = 8;
    /**
     * Minimum Chrome version: 1
     * Minimum Firefox version: 1
     */
    Node.DOCUMENT_NODE = 9;
    /**
     * Minimum Chrome version: 1
     * Minimum Firefox version: 1
     */
    Node.DOCUMENT_TYPE_NODE = 10;
    /**
     * Minimum Chrome version: 1
     * Minimum Firefox version: 1
     */
    Node.DOCUMENT_FRAGMENT_NODE = 11;
    /**
     * Minimum Chrome version: 1
     * Minimum Firefox version: 1
     */
    Node.NOTATION_NODE = 12;
    globalThis.Node = Node;
}

/**
 * Deletes the mocked DOM globals.
 * @see {@link mockDOM}
 */
export function unmockDOM(): void {
    Reflect.deleteProperty(globalThis, 'window');
    Reflect.deleteProperty(globalThis, 'MutationObserver');
    Reflect.deleteProperty(globalThis, 'Node');
}
