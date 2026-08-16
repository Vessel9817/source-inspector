import path from 'node:path';
import TerserPlugin from 'terser-webpack-plugin';
import webpack from 'webpack';
import * as config from './config';
import {
    IS_DEV_MODE,
    OUTPUT_ABS_DIR,
    PROJECT_ROOT
} from './env';

// Initializing webpack config
const webpackConfig: webpack.Configuration = {
    context: PROJECT_ROOT,
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
        // Content script
        content: {
            import: [
                path.join(
                    PROJECT_ROOT,
                    'src',
                    'pages',
                    'content',
                    'docListener.ts'
                )
            ],
            filename: path.join('content', 'docListener.js')
        },

        // Popup
        popup: {
            import: [
                path.join(PROJECT_ROOT, 'src', 'pages', 'popup', 'index.tsx')
            ],
            // HTMLWebpackPlugin will escape backslashes, which leads to invalid paths
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
            ...config.assets.resolveExts,
            ...config.js.resolveExts,
            ...config.css.resolveExts
        ]
    },
    module: {
        rules: [
            ...config.assets.moduleRules,
            ...config.css.moduleRules,
            ...config.js.moduleRules,
            ...config.html.moduleRules
        ]
    },
    plugins: [
        new webpack.ProgressPlugin(),
        ...config.assets.plugins,
        ...config.js.plugins,
        ...config.css.plugins,
        ...config.html.plugins
    ],
    watchOptions: {
        // https://npmjs.com/package/fork-ts-checker-webpack-plugin#installation
        ignored: ['node_modules']
    },
    infrastructureLogging: {
        level: 'info'
    },
    stats: 'errors-warnings'
};

export default webpackConfig;
