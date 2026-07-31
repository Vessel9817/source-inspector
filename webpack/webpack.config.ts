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
import {
    IS_DEV_MODE,
    OUTPUT_ABS_DIR,
    PROJECT_ROOT
} from './env';
import {
    type Manifest,
    MANIFEST,
    ICON_PATH_MAPPINGS
} from './manifest';

const LICENSE = (await fs.readFile(path.join(PROJECT_ROOT, 'LICENSE'))).toString();

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
    /**
     * Specifies the banner
     */
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
        ...ICON_PATH_MAPPINGS.map(([inputPath, outputPath]) => {
            return new CopyWebpackPlugin({
                patterns: [
                    {
                        from: inputPath,
                        to: outputPath
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
            manifest: MANIFEST,
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
