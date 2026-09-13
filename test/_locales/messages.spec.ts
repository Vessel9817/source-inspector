import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { describe, it } from 'node:test';

const localesDir = new URL('../../_locales/', import.meta.url);

async function messageKeys(locale: string): Promise<string[]> {
    const file = new URL(`${locale}/messages.json`, localesDir);
    return Object.keys(JSON.parse(await fs.readFile(file, 'utf8'))).sort();
}

describe('locale messages', async () => {
    const locales = (await fs.readdir(localesDir, { withFileTypes: true }))
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort();

    // Doesn't have to be the actual default locale
    const defaultLocale = locales.pop();

    await it('exist', () => {
        assert.ok(typeof defaultLocale === 'string', 'Missing locales');
    });

    const defaultKeys = await messageKeys(defaultLocale as string);

    for (const locale of locales) {
        it(`${locale} has the same top-level keys as ${defaultLocale}`, async () => {
            assert.deepEqual(
                await messageKeys(locale),
                defaultKeys,
                `${locale}/messages.json must have the same top-level keys as ${defaultLocale}/messages.json`
            );
        });
    }
});
