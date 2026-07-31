import assert from 'node:assert';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import fs from 'node:fs/promises';
import path from 'node:path';
import { type Tap } from 'tapable';
import TerserPlugin from 'terser-webpack-plugin';
import webpack, {
    type AssetInfo,
    type Compiler,
    type WebpackPluginInstance
} from 'webpack';
import sources from 'webpack-sources';

type BrowserName = 'chrome' | 'firefox';

const __dirname = import.meta.dirname;
const PROJECT_ROOT = path.join(__dirname, '..');
const LICENSE = (await fs.readFile(path.join(PROJECT_ROOT, 'LICENSE'))).toString();

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
assert.ok(NODE_ENV != null, 'NODE_ENV must be specified');

const IS_DEV_MODE = NODE_ENV !== 'production';

type Manifest =
    | chrome.runtime.Manifest
    | browser._manifest.WebExtensionManifest;

type SourceAndMap = sources.SourceAndMap & { map: Object };

// source and updateHash methods remain unimplemented
class Source extends sources.Source {
    sourceAndMap(options?: sources.MapOptions): SourceAndMap {
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

        this.source.updateHash = (hash: sources.HashLike) => {
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
            const safeBanner = args.banner.replaceAll('-->', '-- >');
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
    // Extensions cannot use eval
    devtool: IS_DEV_MODE
        ? 'hidden-cheap-module-source-map'
        : 'hidden-source-map',
    optimization: IS_DEV_MODE
        ? undefined
        : {
              minimize: true,
              minimizer: [
                  new TerserPlugin({
                      extractComments: false,
                      minimizerOptions: {
                          sourceMap: true
                      }
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
        path: OUTPUT_ABS_DIR,
        clean: true,
        publicPath: '/',
        iife: true
    },
    resolve: {
        extensions: [
            ...STATIC_FILE_EXTS,
            'ts',
            'tsx', // TS/TSX must come before JS/JSX
            'js',
            'jsx',
            'css'
        ].map((extension) => `.${extension}`)
    },
    module: {
        rules: [
            {
                test: new RegExp(
                    String.raw`\.(?:${STATIC_FILE_EXTS.join('|')})$`
                ),
                type: 'asset/resource',
                exclude: /node_modules/
            },
            {
                // https://www.npmjs.com/package/style-loader#recommend
                test: /\.(css|scss|sass)$/,
                exclude: /node_modules/,
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
                            sourceMap: true,
                            modules: {
                                namedExport: true
                            }
                        }
                    },
                    {
                        loader: 'postcss-loader',
                        options: {
                            sourceMap: true
                        }
                    },
                    {
                        loader: 'sass-loader',
                        options: {
                            sourceMap: true
                        }
                    }
                ]
            },
            {
                test: /\.(ts|tsx)$/,
                type: 'javascript/esm',
                exclude: /node_modules/,
                use: [
                    {
                        // https://www.npmjs.com/package/ts-loader#devtool--sourcemaps
                        loader: 'ts-loader',
                        options: {
                            transpileOnly: IS_DEV_MODE
                        }
                    }
                ]
            },
            {
                test: /\.html$/,
                exclude: /node_modules/,
                loader: 'html-loader'
            }
        ]
    },
    plugins: [
        new webpack.ProgressPlugin(),

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
            chunks: ['popup'],
            minify: 'auto'
        }),

        // Generating manifest files
        GenerateFilePlugin.generateManifestPlugin({
            filename: 'manifest.json',
            manifest,
            tabs: IS_DEV_MODE ? 2 : undefined
        }),

        // Embedding license information
        new webpack.BannerPlugin({
            include: [/\.(?:js|css)$/i],
            entryOnly: false,
            stage: Infinity, // Needed to prevent minimization
            banner: LICENSE
        }),
        new HtmlBannerWebpackPlugin({ banner: LICENSE }),

        // Adding source map references
        new webpack.BannerPlugin({
            include: [/\.(?:js|css)$/i],
            entryOnly: false,
            stage: Infinity, // Needed to prevent minimization
            raw: true,
            footer: true,
            banner(data): string {
                // Webpack seems inconsistent with forward and backward slashes in paths
                const relPath = data.filename.replaceAll('\\', '/');

                return `/*# sourceMappingURL=/${relPath}.map */`;
            }
        })
    ].filter(Boolean),
    infrastructureLogging: {
        level: 'info'
    }
};

export default config;
