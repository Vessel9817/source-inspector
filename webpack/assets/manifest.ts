import { type Pattern } from 'copy-webpack-plugin';
import path from 'node:path';
import {
    BROWSER,
    DEFAULT_LOCALE,
    NODE_ENV,
    OUTPUT_ABS_DIR,
    PACKAGE_URL,
    PACKAGE_VERSION,
    PROJECT_ROOT
} from '../env';

export type Manifest =
    | chrome.runtime.Manifest
    | browser._manifest.WebExtensionManifest;

type Optional<T> = {
    [P in keyof T]?: undefined extends T[P] ? T[P] : never;
}

// Chrome and Firefox disagree on the use of certain properties
type SharedManifestProps = Optional<Omit<
    chrome.runtime.ManifestV3 & browser._manifest.WebExtensionManifest,
        | 'author'
        | 'content_security_policy'
>>

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

const MANIFEST_ICON_PATHS: { [size: string]: string } = {};

RELATIVE_ICON_PATHS.forEach(([size, [inputPath, outputPath]]) => {
    MANIFEST_ICON_PATHS[size] = outputPath;
});

// Chrome and Firefox disagree on the use of `author`
const manifestBase: Omit<
    browser._manifest.ManifestBase,
    'manifest_version' | 'author'
> = {
    name: '__MSG_ext_name__',
    description: '__MSG_ext_description__',
    version: PACKAGE_VERSION,
    homepage_url: PACKAGE_URL
};
const shared: SharedManifestProps = {
    icons: MANIFEST_ICON_PATHS,
    default_locale: DEFAULT_LOCALE,
    permissions: ['scripting', 'activeTab']
};

// Generating manifest file
let manifest: Manifest;

switch (BROWSER) {
    case 'chrome': {
        let _manifest: chrome.runtime.Manifest = {
            ...manifestBase,
            ...shared,
            manifest_version: 3,
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
            ...shared,
            manifest_version: 2,
            incognito: 'spanning', // Split config isn't available in MV2
            background: {
                scripts: [path.join('background', 'index.js')],
                persistent: false
            },
            browser_action: {
                default_icon: MANIFEST_ICON_PATHS
            },
            developer: {
                name: '__MSG_ext_author__',
                url: PACKAGE_URL
            },
        };
        manifest = _manifest;
        break;
    }
    default: {
        // Shouldn't happen
        throw new Error(`Unsupported browser: ${BROWSER}`);
    }
}

export const MANIFEST = manifest;
export const ICON_PATH_MAPPINGS: Pattern[] = RELATIVE_ICON_PATHS.map(
    ([k, [inputPath, outputPath]]) => {
        return {
            from: path.join(
                PROJECT_ROOT,
                'src',
                'assets',
                'icons',
                inputPath
            ),
            to: path.join(OUTPUT_ABS_DIR, outputPath)
        };
    }
);
