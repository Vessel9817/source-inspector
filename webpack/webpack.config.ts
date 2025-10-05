import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import path from 'path';
import { Tap } from 'tapable';
import TerserPlugin from 'terser-webpack-plugin';
import webpack, {
    Compiler,
    Configuration,
    ProgressPlugin,
    WebpackPluginInstance
} from 'webpack';
import {
    Source as _Source,
    SourceAndMap as _SourceAndMap,
    HashLike,
    MapOptions
} from 'webpack-sources';

// Non-secret env vars are defined in nodemon config
const NODE_ENV = process.env.NODE_ENV;
const PROJECT_ROOT = path.join(__dirname, '..');
const OUTPUT_REL_DIR = process.env.OUTPUT_DIR!.replaceAll('\\', '/'); // Safety
const CHROME_DIR_NAME = 'chrome';
const FIREFOX_DIR_NAME = 'firefox';

const OUTPUT_ABS_DIR = path.join(PROJECT_ROOT, OUTPUT_REL_DIR);
const CHROME_ABS_DIR = path.join(PROJECT_ROOT, OUTPUT_REL_DIR, CHROME_DIR_NAME);
const FIREFOX_ABS_DIR = path.join(
    PROJECT_ROOT,
    OUTPUT_REL_DIR,
    FIREFOX_DIR_NAME
);

// Verifying node env
if (NODE_ENV == null) {
    throw new Error('Node environment must be specified');
}

type SourceAndMap = _SourceAndMap & { map: Object };

// source and updateHash methods remain unimplemented
class Source extends _Source {
    sourceAndMap(options?: MapOptions): SourceAndMap {
        let out = {
            ...super.sourceAndMap(options)
        } as SourceAndMap;

        out.map = out.map ?? {};

        return out;
    }
}

class GenerateFilePlugin implements WebpackPluginInstance {
    private readonly plugin: Tap = { name: 'GenerateFilePlugin' };
    private readonly filepath: string;
    private readonly source: Source;

    constructor(filename: string, content: string) {
        this.filepath = filename;
        this.source = new Source();
        this.source.source = () => content;
    }

    public apply(compiler: Compiler) {
        compiler.hooks.compilation.tap(this.plugin, (compilation) => {
            compilation.emitAsset(this.filepath, this.source, {
                sourceFilename: path.basename(this.filepath)
            });
        });
        this.source.updateHash = (hash: HashLike) => {
            compiler.hooks.compilation.tap(this.plugin, (compilation) => {
                compilation.updateAsset(this.filepath, this.source, {
                    contenthash: hash.digest().toString(),
                    sourceFilename: path.basename(this.filepath)
                });
            });
        };
    }

    /**
     * Creates a Webpack plugin to generate a manifest file
     * @param relBuildDirPath The path to the manifest file to generate
     * @param manifest The JSON object which with to populate the manifest file
     * @returns A Webpack plugin to execute this function
     */
    public static generateManifestPlugin(
        filename: string,
        manifest: chrome.runtime.Manifest
    ): GenerateFilePlugin {
        return new GenerateFilePlugin(
            filename,
            GenerateFilePlugin.stringifyManifest(manifest)
        );
    }

    private static stringifyManifest(
        manifest: chrome.runtime.Manifest
    ): string {
        const replacer = (key: string, value: any) => {
            // Manifest requires forward slashes
            return typeof value === 'string'
                ? value.replaceAll('\\', '/')
                : value;
        };
        const space = IS_DEV_MODE ? 4 : undefined; // Setting tabbing for readability

        return JSON.stringify(manifest, replacer, space);
    }
}

const IS_DEV_MODE = process.env.NODE_ENV !== 'production';

// Copying icons
const VALID_SIZES = [16, 32, 48, 128].map((size) => size.toString());
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

const CHROME_MANIFEST: chrome.runtime.ManifestV3 = {
    manifest_version: 3,
    name: process.env.PACKAGE_NAME!,
    description: process.env.PACKAGE_DESCRIPTION!,
    version: '1.0.0',
    homepage_url: 'https://github.com/Anonymous-Humanoid/source-inspector',
    author: {
        email: 'ninth-blast-royal@duck.com'
    },
    minimum_chrome_version: '93',
    permissions: ['scripting', 'activeTab'],
    incognito: 'split',
    background: {
        service_worker: path.join('background', 'index.js')
    },
    action: {
        default_icon: MANIFEST_ICON_PATHS
    },
    icons: MANIFEST_ICON_PATHS
};
// const FIREFOX_MANIFEST: chrome.runtime.ManifestV2 = {};

// Initializing webpack config
const STATIC_FILE_EXTS = [
    'jpg',
    'jpeg',
    'png',
    'gif',
    'eot',
    'otf',
    'svg',
    'ttf',
    'woff',
    'woff2'
];

const SHARED_PLUGINS: Configuration['plugins'] = [
    // Setting up fresh Webpack environment
    new CleanWebpackPlugin({
        verbose: false,
        protectWebpackAssets: false
    }),
    new ProgressPlugin(),

    // Packaging icons
    ...RELATIVE_ICON_PATHS.map(([size, [inputPath, outputPath]]) => {
        return new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.join(
                        PROJECT_ROOT,
                        'src',
                        'assets',
                        'icons',
                        inputPath
                    ),
                    to: path.join(CHROME_ABS_DIR, outputPath)
                }
            ]
        });
    }),

    // Packaging popup entry point
    new HtmlWebpackPlugin({
        template: path.join(
            PROJECT_ROOT,
            'src',
            'pages',
            'popup',
            'index.html'
        ),
        filename: path.join(CHROME_ABS_DIR, 'popup', 'index.html'),
        chunks: ['popup']
    })
];
const BROWSER_PLUGINS: Configuration['plugins'] = [
    // Copying shared files to each browser-specific build directory
    new CopyWebpackPlugin({
        patterns: [
            {
                from: CHROME_ABS_DIR,
                to: FIREFOX_ABS_DIR,
                noErrorOnMissing: true,
                force: false,
                globOptions: {
                    ignore: ['**/manifest.json']
                }
            }
        ]
    }),

    // Generating manifest files
    GenerateFilePlugin.generateManifestPlugin(
        path.join(CHROME_DIR_NAME, 'manifest.json'),
        CHROME_MANIFEST
    )
    // new GenerateFilePlugin.generateManifestPlugin(
    //     path.join(FIREFOX_DIR_NAME, 'manifest.json'),
    //     FIREFOX_MANIFEST
    // )
];

const config: webpack.Configuration = {
    mode: IS_DEV_MODE ? 'development' : 'production',
    devtool: IS_DEV_MODE ? 'cheap-module-source-map' : undefined,
    optimization: IS_DEV_MODE
        ? undefined
        : {
              minimize: true,
              minimizer: [
                  new TerserPlugin({
                      extractComments: false
                  })
              ]
          },
    entry: {
        // Popup
        docListener: {
            import: [
                path.join(
                    PROJECT_ROOT,
                    'src',
                    'pages',
                    'popup',
                    'docListener.ts'
                )
            ],
            filename: path.join(CHROME_DIR_NAME, 'popup', 'docListener.js')
        },
        popup: {
            import: [
                path.join(PROJECT_ROOT, 'src', 'pages', 'popup', 'index.tsx')
            ],
            // HTMLWebpackPlugin requires forward slashes
            filename: path
                .join(CHROME_DIR_NAME, 'popup', 'index.js')
                .replaceAll('\\', '/')
        },

        // Background
        background: {
            import: [
                path.join(
                    PROJECT_ROOT,
                    'src',
                    'pages',
                    'background',
                    'index.ts'
                )
            ],
            filename: path.join(CHROME_DIR_NAME, 'background', 'index.js')
        }
    },
    output: {
        filename: '[name].bundle.js', // Extra clarification that paths change on build
        path: OUTPUT_ABS_DIR,
        clean: true,
        publicPath: process.env.ASSET_PATH
    },
    resolve: {
        extensions: [
            ...STATIC_FILE_EXTS,
            'ts',
            'tsx', // TS/TSX must come before JS/JSX
            'cjs',
            'mjs', // CJS/MJS before JS
            'js',
            'jsx',
            'css'
        ].map((extension) => `.${extension}`)
    },
    module: {
        rules: [
            // Static files
            {
                test: new RegExp('.(' + STATIC_FILE_EXTS.join('|') + ')$'),
                type: 'asset/resource',
                exclude: /node_modules/
            },

            // CSS/SCSS/SASS
            {
                test: /\.(css|scss|sass)$/,
                use: [
                    {
                        loader: 'style-loader'
                    },
                    {
                        loader: 'css-loader'
                    },
                    {
                        loader: 'sass-loader',
                        options: {
                            sourceMap: true
                        }
                    }
                ]
            },

            // HTML
            {
                test: /\.html$/,
                loader: 'html-loader',
                exclude: /node_modules/
            },

            // TS/TSX (must come before JS/JSX)
            {
                test: /\.(ts|tsx)$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: require.resolve('ts-loader'),
                        options: {
                            transpileOnly: IS_DEV_MODE
                        }
                    }
                ]
            },

            // CJS/MJS/JS/JSX
            {
                test: /\.(cjs|mjs|js|jsx)$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'source-map-loader'
                    }
                ]
            }
        ]
    },
    plugins: [...SHARED_PLUGINS, ...BROWSER_PLUGINS].filter(Boolean),
    infrastructureLogging: {
        level: 'info'
    }
};

// Webpack >= 2.0.0 no longer allows custom properties in configuration
export default config;
