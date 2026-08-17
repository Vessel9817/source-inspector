import { program } from 'commander';
import fs from 'node:fs/promises';
import path from 'node:path';
import sanitizeFilename from 'sanitize-filename';
import webpack from 'webpack';
import { showError } from './utils';

const PROJECT_ROOT = path.join(import.meta.dirname, '..', '..');

async function build(
    browser: string,
    mode: string
): Promise<webpack.Stats | undefined> {
    // Loading env vars
    browser = sanitizeFilename(browser);
    mode = sanitizeFilename(mode);

    const file = path.join(
        PROJECT_ROOT,
        'nodemon',
        browser,
        `nodemon.${mode}.json`
    );

    const nodemonConfig = JSON.parse((await fs.readFile(file)).toString());
    const envVars = nodemonConfig.env as Record<string, string | number | boolean | null>;

    for (const [name, value] of Object.entries(envVars)) {
        process.env[name] = value?.toString();
    }

    // Building project
    const { default: webpackConfig } = await import('../webpack.config');
    const compiler = webpack(webpackConfig);

    return await new Promise((resolve, reject) => {
        compiler.run((err, res) => {
            if (err) {
                reject(err);
                return;
            }

            resolve(res);
        });
    });
}

async function buildAction(browser: string, mode: string): Promise<void> {
    try {
        await build(browser, mode);
    }
    catch (err) {
        showError(err);
    }
}

program
    .command('build')
    .description('Build the extension')
    .argument('<browser>', 'The browser to build for.')
    .argument('<mode>', 'The mode to build in.')
    .action(buildAction);
