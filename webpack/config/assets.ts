import CopyWebpackPlugin from 'copy-webpack-plugin';
import path from 'node:path';
import { ICON_PATH_MAPPINGS, MANIFEST } from '../assets/manifest';
import { IS_DEV_MODE, OUTPUT_ABS_DIR, PROJECT_ROOT } from '../env';
import { GenerateFilePlugin } from '../plugins';

export const resolveExts = [
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.eot',
    '.otf',
    '.svg',
    '.ttf',
    '.woff',
    '.woff2'
];

export const moduleRules = [
    {
        test: new RegExp(
            String.raw`\.(?:${resolveExts.map((ext) => RegExp.escape(ext)).join('|')})$`
        ),
        type: 'asset/resource',
        exclude: /node_modules/
    }
];

export const plugins = [
    // Packaging icons and translations
    new CopyWebpackPlugin({
        patterns: [
            ...ICON_PATH_MAPPINGS,
            {
                from: path.join(PROJECT_ROOT, '_locales'),
                to: path.join(OUTPUT_ABS_DIR, '_locales')
            }
        ]
    }),

    // Generating manifest files
    GenerateFilePlugin.generateManifestPlugin({
        manifest: MANIFEST,
        indents: IS_DEV_MODE ? 2 : undefined
    }),
];
