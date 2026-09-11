import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import config from '../../nodemon/chrome/nodemon.prod.json';

const localesDir = new URL('../../_locales/', import.meta.url);
const defaultLocale = config.env.DEFAULT_LOCALE;

function messageKeys(locale: string): string[] {
    const file = new URL(`${locale}/messages.json`, localesDir);
    return Object.keys(JSON.parse(readFileSync(file, 'utf8'))).sort();
}

describe('locale messages', () => {
    const defaultKeys = messageKeys(defaultLocale);
    const locales = readdirSync(localesDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort();

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
