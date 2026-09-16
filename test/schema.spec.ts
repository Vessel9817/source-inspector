import Ajv, { type AnySchemaObject } from 'ajv';
import addFormats from 'ajv-formats';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parse as parseYaml } from 'yaml';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const ignoredDirectories = new Set(['.git', 'dist', 'node_modules']);
const supportedExtensions = new Set(['.json', '.yaml', '.yml']);

// Matches SchemaStore defaults
// https://github.com/SchemaStore/schemastore/blob/060c6eedbfcebcace35336d273099f90d1e6d3c5/cli.js#L512-L531
const unknownKeywords = [
    'allowTrailingCommas',
    'defaultSnippets',
    'markdownDescription',
    'enumDescriptions',
    'markdownEnumDescriptions',
    'x-taplo',
    'x-taplo-info',
    'x-tombi-toml-version',
    'x-tombi-array-values-order',
    'x-tombi-array-values-order-by',
    'x-tombi-table-keys-order',
    'x-tombi-string-formats',
    'x-tombi-additional-key-label',
    'x-intellij-language-injection',
    'x-intellij-html-description',
    'x-intellij-enum-metadata',
];

async function sourceFiles(directory: string): Promise<string[]> {
    const files: string[] = [];

    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
        if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;

        const entryPath = path.join(directory, entry.name);

        if (entry.isDirectory()) {
            files.push(...(await sourceFiles(entryPath)));
        }
        else if (entry.isFile() && supportedExtensions.has(path.extname(entry.name))) {
            files.push(entryPath);
        }
    }

    return files;
}

async function readDocument(file: string): Promise<unknown> {
    const contents = await fs.readFile(file, 'utf8');
    return path.extname(file) === '.json'
        ? JSON.parse(contents)
        : parseYaml(contents);
}

function schemaReference(document: unknown): string | undefined {
    if (typeof document !== 'object' || document === null || Array.isArray(document)) {
        return;
    }

    const reference = (document as Record<string, unknown>).$schema;

    return typeof reference === 'string' ? reference : undefined;
}

async function loadSchema(uri: string): Promise<AnySchemaObject> {
    if (uri.startsWith('file:')) {
        return readDocument(fileURLToPath(uri)) as Promise<AnySchemaObject>;
    }

    const response = await fetch(uri);

    assert.ok(
        response.ok,
        `Unable to load schema ${uri}: ${response.status} ${response.statusText}`
    );

    return response.json() as Promise<AnySchemaObject>;
}

describe('schema-backed source files', async () => {
    const documents = [];

    for (const file of await sourceFiles(projectRoot)) {
        const document = await readDocument(file);
        const reference = schemaReference(document);

        if (reference) {
            documents.push({ document, file, reference });
        }
    }

    await it('exists', () => {
        assert.notEqual(
            documents.length, 0,
            'No source files with a top-level $schema were found'
        );
    });

    for (const { document, file, reference } of documents) {
        it(`validate ${path.relative(projectRoot, file)}`, async () => {
            const schemaUri = new URL(reference, pathToFileURL(file)).href;
            // Matches non-strict SchemaStore defaults
            // https://github.com/SchemaStore/schemastore/blob/060c6eedbfcebcace35336d273099f90d1e6d3c5/cli.js#L447-L458
            const ajv = new Ajv({
                loadSchema,
                strictTypes: false,
                strictTuples: false,
                allowMatchingProperties: true
            });

            addFormats(ajv);

            for (const keyword of unknownKeywords) {
                ajv.addKeyword(keyword);
            }

            const validate = ajv.getSchema(schemaUri)
                ?? await ajv.compileAsync(await loadSchema(schemaUri));

            assert.ok(
                validate(document),
                `${path.relative(projectRoot, file)} does not match ${reference}:\n${ajv.errorsText(validate.errors, { separator: '\n' })}`
            );
        });
    }
});
