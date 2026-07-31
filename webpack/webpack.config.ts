import CopyWebpackPlugin from 'copy-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import fs from 'node:fs';
import path from 'node:path';
import { Tap } from 'tapable';
import TerserPlugin from 'terser-webpack-plugin';
import webpack, {
    AssetInfo,
    BannerPlugin,
    Compiler,
    ProgressPlugin,
    WebpackPluginInstance
} from 'webpack';
import {
    Source as _Source,
    SourceAndMap as _SourceAndMap,
    HashLike,
    MapOptions
} from 'webpack-sources';
const MoveAssetsPlugin = require('move-assets-webpack-plugin');

type BrowserName = 'chrome' | 'firefox';

const PROJECT_ROOT = path.join(__dirname, '..');
const LICENSE = fs.readFileSync(path.join(PROJECT_ROOT, 'LICENSE')).toString();

// Non-secret env vars are defined in nodemon config
const NODE_ENV = process.env.NODE_ENV;
const BROWSER: BrowserName = process.env.BROWSER as BrowserName;
const OUTPUT_DIR = process.env.OUTPUT_DIR!;
const OUTPUT_ABS_DIR = path.join(PROJECT_ROOT, OUTPUT_DIR);
const PACKAGE_NAME = process.env.PACKAGE_NAME!;
const PACKAGE_DESCRIPTION = process.env.PACKAGE_DESCRIPTION;
const PACKAGE_VERSION = process.env.PACKAGE_VERSION!;
const PACKAGE_AUTHOR = process.env.PACKAGE_AUTHOR;
const PACKAGE_URL = process.env.PACKAGE_URL;

// Verifying node env
if (NODE_ENV == null) {
    throw new Error('Node environment must be specified');
}

const IS_DEV_MODE = NODE_ENV !== 'production';

type Manifest =
    | chrome.runtime.Manifest
    | browser._manifest.WebExtensionManifest;

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

interface GenerateFilePluginArgs {
    filename: string;
    content: string;
    assetInfo?: AssetInfo;
}

type GenerateManifestArgs = Omit<GenerateFilePluginArgs, 'content'> & {
    manifest: Manifest;
    tabs?: number;
};

class GenerateFilePlugin implements WebpackPluginInstance {
    private readonly plugin: Tap = { name: 'GenerateFilePlugin' };
    private readonly filepath: string;
    private readonly source: Source;
    private readonly assetInfo: AssetInfo | undefined;

    constructor(args: GenerateFilePluginArgs) {
        this.filepath = args.filename;
        this.source = new Source();
        this.source.source = () => args.content;
        this.assetInfo = args.assetInfo;
    }

    public apply(compiler: Compiler) {
        compiler.hooks.compilation.tap(this.plugin.name, (compilation) => {
            compilation.emitAsset(this.filepath, this.source, {
                ...this.assetInfo,
                sourceFilename: path.basename(this.filepath)
            });
        });

        this.source.updateHash = (hash: HashLike) => {
            compiler.hooks.compilation.tap(this.plugin.name, (compilation) => {
                compilation.updateAsset(this.filepath, this.source, {
                    ...this.assetInfo,
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
        args: GenerateManifestArgs
    ): GenerateFilePlugin {
        return new GenerateFilePlugin({
            filename: args.filename,
            content: GenerateFilePlugin.stringifyManifest(
                args.manifest,
                args.tabs
            ),
            assetInfo: args.assetInfo
        });
    }

    private static stringifyManifest(
        manifest: Manifest,
        tabs?: number
    ): string {
        const replacer = (key: string, value: any) => {
            // Manifest requires forward slashes
            return typeof value === 'string'
                ? value.replaceAll('\\', '/')
                : value;
        };

        return JSON.stringify(manifest, replacer, tabs);
    }
}

interface HtmlBannerWebpackPluginArgs {
    banner: string;

    /**
     * If true, defers formatting to the user.
     * Otherwise, formats the banner as a block comment.
     * @default false
     */
    raw?: boolean;
}

class HtmlBannerWebpackPlugin implements WebpackPluginInstance {
    private readonly plugin: Tap = { name: 'html-license-webpack-plugin' };
    private readonly banner: string;

    constructor(args: HtmlBannerWebpackPluginArgs) {
        if (args.raw === true) {
            this.banner = args.banner;
        } else {
            const safeBanner = args.banner.replaceAll('-->', '--&gt;');
            this.banner = `<!--\n${safeBanner}\n-->\n`;
        }
    }

    apply(compiler: Compiler) {
        compiler.hooks.compilation.tap(this.plugin.name, (compilation) => {
            // beforeEmit needed to supersede minimization, see:
            // https://github.com/jantimon/html-webpack-plugin?tab=readme-ov-file#events
            HtmlWebpackPlugin.getCompilationHooks(
                compilation
            ).beforeEmit.tapAsync(this.plugin.name, (data, cb) => {
                // Prepending banner
                data.html = `${this.banner}${data.html}`;
                // Telling Webpack to move on
                cb(null, data);
            });
        });
    }
}

// Copying icons
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
            filename: path.join('popup', 'docListener.js')
        },
        popup: {
            import: [
                path.join(PROJECT_ROOT, 'src', 'pages', 'popup', 'index.tsx')
            ],
            // HTMLWebpackPlugin requires forward slashes
            filename: path.join('popup', 'index.js').replaceAll('\\', '/')
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
            filename: path.join('background', 'index.js')
        }
    },
    output: {
        filename: '[name].bundle.js', // Extra clarification that paths change on build
        path: OUTPUT_ABS_DIR,
        clean: true,
        publicPath: process.env.ASSET_PATH,
        iife: true
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
            // https://www.npmjs.com/package/style-loader#recommend
            {
                test: /\.(css|scss|sass)$/,
                use: [
                    {
                        loader: IS_DEV_MODE
                            ? 'style-loader'
                            : MiniCssExtractPlugin.loader
                    },
                    {
                        loader: 'css-loader',
                        options: {
                            esModule: true,
                            modules: {
                                namedExport: true
                            }
                        }
                    },
                    {
                        loader: 'postcss-loader'
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
                exclude: /node_modules/,
                loader: 'html-loader'
            },

            // TS/TSX (must come before JS/JSX)
            {
                test: /\.(ts|tsx)$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'ts-loader',
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
                loader: 'source-map-loader'
            }
        ]
    },
    plugins: [
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
                        to: path.join(OUTPUT_ABS_DIR, outputPath)
                    }
                ]
            });
        }),

        // assert polyfill depends on process
        // https://github.com/browserify/commonjs-assert/issues/55#issuecomment-996543717
        new webpack.ProvidePlugin({
            process: 'process/browser'
        }),

        // https://www.npmjs.com/package/style-loader#recommend
        !IS_DEV_MODE && new MiniCssExtractPlugin(),

        // Packaging popup entry point
        new HtmlWebpackPlugin({
            template: path.join(
                PROJECT_ROOT,
                'src',
                'pages',
                'popup',
                'index.html'
            ),
            filename: path.join('popup', 'index.html'),
            chunks: 'all',
            minify: 'auto'
        }),

        // Generating manifest files
        GenerateFilePlugin.generateManifestPlugin({
            filename: 'manifest.json',
            manifest,
            tabs: IS_DEV_MODE ? 2 : undefined
        }),

        // Embedding license information
        // ...in JS
        new BannerPlugin({
            include: [/\.js$/i],
            entryOnly: false,
            stage: Infinity, // Needed to prevent minimization
            raw: true,
            banner(data) {
                const safeLicense = LICENSE.replaceAll('*/', '* /');
                const delimitedLicense = safeLicense.replaceAll('\n', '\n * ');

                return `/**\n * ${delimitedLicense}\n */`;
            }
        }),
        // ...in HTML
        new HtmlBannerWebpackPlugin({ banner: LICENSE }),

        // Moving popup CSS and source map
        !IS_DEV_MODE &&
            new MoveAssetsPlugin({
                clean: true,
                patterns: [
                    {
                        from: path.join(OUTPUT_DIR, 'popup.css'),
                        to: path.join(OUTPUT_DIR, 'popup', 'index.css')
                    },
                    {
                        from: path.join(OUTPUT_DIR, 'popup.css.map'),
                        to: path.join(OUTPUT_DIR, 'popup', 'index.css.map')
                    }
                ]
            })
    ].filter(Boolean),
    infrastructureLogging: {
        level: 'info'
    }
};

export default config;
