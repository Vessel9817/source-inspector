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
        extension: {
            isAllowedFileSchemeAccess: (...args) => Promise.resolve(false),
            isAllowedIncognitoAccess: (...args) => Promise.resolve(false)
        }
    } as typeof browser;
    globalThis.chrome = {
        extension: {
            inIncognitoContext: false
        },
        i18n: {
            getMessage
        },
        runtime: {
            getURL: (path) => {
                return browserName === 'chrome'
                    ? `chrome-extension://${id}/${path}`
                    : `moz-extension://${id}/${path}`
            },
            id,
            onConnect: {
                addListener: (...args) => {},
                removeListener: (...args) => {}
            },
            onMessage: {
                addListener: (...args) => {},
                removeListener: (...args) => {}
            },
            sendMessage: (...args) => {}
        },
        scripting: {
            executeScript: (...args) => {}
        },
        tabs: {
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
            sendMessage: (...args) => {}
        },
        windows: {
            create: (...args) => {}
        }
    } as typeof chrome;

    // Version-specific extension APIs
    if (browserName === 'chrome') {
        // MV3
        globalThis.chrome = {
            ...globalThis.chrome,
            action: {
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
            browserAction: {
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
    globalThis.window = {
        addEventListener: (...args: Parameters<Window['addEventListener']>) => {},
        removeEventListener: (...args: Parameters<Window['removeEventListener']>) => {}
    } as Window & typeof globalThis;

    const MutationObserver = Object.create({});

    MutationObserver.constructor = (callback: MutationCallback) => {
        return {
            disconnect: () => {},
            observe: (...args: Parameters<MutationObserver['observe']>) => {}
        };
    };

    globalThis.MutationObserver = MutationObserver;

    const Node = Object.create({});

    Node.ELEMENT_NODE = 1;
    Node.ATTRIBUTE_NODE = 2;
    Node.TEXT_NODE = 3;
    Node.CDATA_SECTION_NODE = 4;
    Node.ENTITY_REFERENCE_NODE = 5;
    Node.ENTITY_NODE = 6;
    Node.PROCESSING_INSTRUCTION_NODE = 7;
    Node.COMMENT_NODE = 8;
    Node.DOCUMENT_NODE = 9;
    Node.DOCUMENT_TYPE_NODE = 10;
    Node.DOCUMENT_FRAGMENT_NODE = 11;
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
