import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const localesDir = new URL('../../_locales/', import.meta.url);

function messageKeys(locale: string): string[] {
    const file = new URL(`${locale}/messages.json`, localesDir);
    return Object.keys(JSON.parse(readFileSync(file, 'utf8'))).sort();
}

describe('locale messages', async () => {
    const locales = readdirSync(localesDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort();

    // Doesn't have to be the actual default locale
    const defaultLocale = locales.pop();

    await it('exist', () => {
        assert.ok(typeof defaultLocale === 'string', 'Missing locales');
    });

    const defaultKeys = messageKeys(defaultLocale as string);

    for (const locale of locales) {
        it(`${locale} has the same top-level keys as ${defaultLocale}`, () => {
            assert.deepEqual(
                messageKeys(locale),
                defaultKeys,
                `${locale}/messages.json must have the same top-level keys as ${defaultLocale}/messages.json`
            );
        });
    }
});
