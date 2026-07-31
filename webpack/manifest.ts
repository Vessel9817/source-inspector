import path from 'node:path';
import {
    BROWSER,
    NODE_ENV,
    OUTPUT_ABS_DIR,
    PACKAGE_AUTHOR,
    PACKAGE_DESCRIPTION,
    PACKAGE_NAME,
    PACKAGE_URL,
    PACKAGE_VERSION,
    PROJECT_ROOT
} from './env';

export type Manifest =
    | chrome.runtime.Manifest
    | browser._manifest.WebExtensionManifest;

// Collecting icons
const VALID_SIZES = ['16', '32', '48', '128'];
const RELATIVE_ICON_PATHS = [
    ...new Map<string, [string, string]>(
        VALID_SIZES.map((size) => [
            size,
            [
                `${NODE_ENV}-icon-${size}.png`, // Input
                path.join('icons', `icon-${size}.png`) // Output
            ]
        ])
    ).entries()
];

// Generating manifest file
const MANIFEST_ICON_PATHS: { [size: string]: string } = {};

RELATIVE_ICON_PATHS.forEach(([size, [inputPath, outputPath]]) => {
    MANIFEST_ICON_PATHS[size] = outputPath;
});

// Chrome and Firefox disagree on the use of `author`
const manifestBase: Omit<
    browser._manifest.ManifestBase,
    'manifest_version' | 'author'
> = {
    name: PACKAGE_NAME,
    description: PACKAGE_DESCRIPTION,
    version: PACKAGE_VERSION,
    homepage_url: PACKAGE_URL
};
let manifest: Manifest;

switch (BROWSER) {
    case 'chrome': {
        let _manifest: chrome.runtime.Manifest = {
            ...manifestBase,
            manifest_version: 3,
            icons: MANIFEST_ICON_PATHS,
            permissions: ['scripting', 'activeTab'],
            incognito: 'split', // We don't store data, so this is an unnecessary security improvement
            offline_enabled: true,
            background: {
                service_worker: path.join('background', 'index.js')
            },
            action: {
                default_icon: MANIFEST_ICON_PATHS
            }
        };

        manifest = _manifest;
        break;
    }
    case 'firefox': {
        let _manifest: browser._manifest.WebExtensionManifest = {
            ...manifestBase,
            manifest_version: 2,
            icons: MANIFEST_ICON_PATHS,
            permissions: ['scripting', 'activeTab'],
            incognito: 'spanning', // Split config isn't available in MV2
            background: {
                scripts: [path.join('background', 'index.js')],
                persistent: false
            },
            browser_action: {
                default_icon: MANIFEST_ICON_PATHS
            },
            developer: {
                name: PACKAGE_AUTHOR,
                url: PACKAGE_URL
            }
        };
        manifest = _manifest;
        break;
    }
}

export const MANIFEST = manifest;
export const ICON_PATH_MAPPINGS = RELATIVE_ICON_PATHS.map(
    ([k, [inputPath, outputPath]]) => [
        path.join(
            PROJECT_ROOT,
            'src',
            'assets',
            'icons',
            inputPath
        ),
        path.join(OUTPUT_ABS_DIR, outputPath)
    ]
);
