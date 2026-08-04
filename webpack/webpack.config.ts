import CopyWebpackPlugin from 'copy-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import fs from 'node:fs/promises';
import path from 'node:path';
import TerserPlugin from 'terser-webpack-plugin';
import webpack from 'webpack';
import {
    IS_DEV_MODE,
    OUTPUT_ABS_DIR,
    PROJECT_ROOT
} from './env';
import {
    ICON_PATH_MAPPINGS,
    MANIFEST
} from './assets/manifest';
import {
    GenerateFilePlugin,
    HtmlBannerWebpackPlugin,
    CreateHtmlSourceMapWebpackPlugin
} from './plugins';

const LICENSE = (await fs.readFile(path.join(PROJECT_ROOT, 'LICENSE'))).toString().trim();

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
                test: /\.tsx?$/,
                type: 'javascript/esm',
                exclude: /node_modules/,
                use: [
                    {
                        // https://www.npmjs.com/package/ts-loader#devtool--sourcemaps
                        loader: 'ts-loader',
                        options: {
                            transpileOnly: IS_DEV_MODE
                        }
                    },
                    'source-map-loader'
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
        new CopyWebpackPlugin({ patterns: ICON_PATH_MAPPINGS }),

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
        new CreateHtmlSourceMapWebpackPlugin(),
        
        // Generating manifest files
        GenerateFilePlugin.generateManifestPlugin({
            manifest: MANIFEST,
            indents: IS_DEV_MODE ? 2 : undefined
        }),

        // Embedding license information after minimization
        new webpack.BannerPlugin({
            include: [/\.(?:js|css)$/i],
            stage: webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE,
            banner: LICENSE
        }),
        new HtmlBannerWebpackPlugin({
            banner: LICENSE,
            sourceMap: true
        }),

        // Adding source map references after minimization
        new webpack.BannerPlugin({
            include: [/\.(?:js|css)$/i],
            stage: webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE,
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
