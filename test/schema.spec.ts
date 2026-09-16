import Ajv, { type AnySchemaObject } from 'ajv';
import addFormats from 'ajv-formats';
import { parse as parseJsonc } from 'jsonc-parser';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parse as parseYaml } from 'yaml';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const ignoredDirectories = new Set(['.git', 'dist', 'node_modules']);
const supportedExtensions = new Set(['.json', '.jsonc', '.yaml', '.yml']);

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
    const ext = path.extname(file);

    return ext === '.json'
        ? JSON.parse(contents)
        : ext === '.jsonc'
            ? parseJsonc(contents)
            : parseYaml(contents);
}

/**
 * Parses file metadata to determine its schema definition
 * @param file The file path
 * @param doc The parsed file contents
 * @returns The file's schema URI reference, if any
 */
async function schemaReference(
    file: string,
    doc: unknown
): Promise<string | undefined> {
    if (typeof doc !== 'object' || doc === null || Array.isArray(doc)) {
        return;
    }

    const ext = path.extname(file);
    let ref: unknown;

    if (/^\.ya?ml$/.test(ext)) {
        // Schema declaration must be the first line and follow strict spacing requirements
        const header = (await fs.readFile(file, 'utf8')).trimStart().split('\n')[0];

        if (header) {
            ref = /^# yaml-language-server: \$schema=(?<$schema>.+)$/.exec(header)?.groups?.$schema;
        }
    }
    else {
        ref = (doc as Record<string, unknown>).$schema;
    }

    return typeof ref === 'string' ? ref : undefined;
}

/**
 * Loads a schema by its URI
 * @param uri The schema URI
 * @returns The schema object
 */
async function loadSchema(uri: string): Promise<AnySchemaObject> {
    if (uri.startsWith('file:')) {
        return await readDocument(fileURLToPath(uri)) as Promise<AnySchemaObject>;
    }

    const response = await fetch(uri);

    assert.ok(
        response.ok,
        `Unable to load schema ${uri}: ${response.status} ${response.statusText}`
    );

    return await response.json() as Promise<AnySchemaObject>;
}

describe('schema', async () => {
    const documents: { doc: any, file: string, ref: string }[] = [];

    for (const file of await sourceFiles(projectRoot)) {
        const doc = await readDocument(file);
        const ref = await schemaReference(file, doc);

        if (ref) {
            documents.push({ doc, file, ref });
        }
    }

    await it('is defined in a source file', () => {
        assert.notEqual(
            documents.length, 0,
            'No source files with a top-level $schema were found'
        );
    });

    for (const { doc, file, ref } of documents) {
        it(`validates ${path.relative(projectRoot, file).replaceAll('\\', '/')}`, async () => {
            const schemaUri = new URL(ref, pathToFileURL(file)).href;
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
                validate(doc),
                `${path.relative(projectRoot, file)} does not match ${ref}:\n${ajv.errorsText(validate.errors, { separator: '\n' })}`
            );
        });
    }
});
