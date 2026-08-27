import { mock, type MockModuleContext, type TestContext } from 'node:test';

export function mockEnv(
    exports: Partial<typeof import('../../../src/pages/shared')>,
    t?: TestContext
): MockModuleContext {
    return (t ? t.mock : mock).module(
        import.meta.resolve('../../../src/pages/shared'),
        { exports }
    );
}

export async function load<T>(path: Readonly<string>): Promise<T> {
    // Query string invalidates module cache
    return await import(`${path}?${crypto.randomUUID()}`);
}
