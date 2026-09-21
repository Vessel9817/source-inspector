import assert from 'node:assert';
import { mock, type MockModuleContext, type TestContext } from 'node:test';

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
