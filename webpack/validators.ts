import assert from 'node:assert';
import semver from 'semver';

const ALLOWED_BROWSERS = ['chrome', 'firefox'] as const;
const ALLOWED_ENVS = ['development', 'production'] as const;
const MAX_PORT = 65535;

export type BrowserName = typeof ALLOWED_BROWSERS[number];
export type NodeEnv = typeof ALLOWED_ENVS[number];

export function browser(name: unknown): asserts name is BrowserName {
    string(name);
    assert.ok(
        (ALLOWED_BROWSERS as readonly string[]).includes(name),
        `Expected browser name to be one of ${JSON.stringify(ALLOWED_BROWSERS)}, got: ${name}`
    );
}

export function nodeEnv(env: unknown): asserts env is NodeEnv {
    string(env);
    assert.ok(
        (ALLOWED_ENVS as readonly string[]).includes(env),
        `Expected Node environment to be one of ${JSON.stringify(ALLOWED_ENVS)}, got: ${env}`
    );
}

export function version(v: unknown): asserts v is string {
    string(v);
    assert.ok(
        semver.valid(v) !== null,
        `Expected semver-compliant version, got: ${v}`
    );
}

export function port(num: unknown): asserts num is number {
    assert.ok(
        typeof num === 'number',
        `Port must be a number, got: ${typeof num}`
    );
    assert.ok(
        num >= 0,
        `Port must be at least 1, or 0 for dynamic assignment, got: ${num}`
    );
    assert.ok(
        num <= MAX_PORT,
        `Port must be at most ${MAX_PORT}, got: ${num}`
    );
}

export function string(x: unknown): asserts x is string {
    assert.ok(
        typeof x === 'string',
        `Value must be a string, got: ${typeof x}`
    );
}

export function optional<T>(
    x: unknown,
    validator: (y: unknown) => asserts y is T
): asserts x is T | undefined {
    if (x !== undefined) {
        validator(x);
    }
}
