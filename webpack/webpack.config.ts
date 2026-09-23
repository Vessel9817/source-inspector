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
    experiments: {
        html: config.html.native, 
        css: config.css.native,
        //futureDefaults: true // For testing in preparation for next major Webpack version
    },
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
        content: {
            import: [
                path.join(
                    PROJECT_ROOT,
                    'src',
                    'pages',
                    'content',
                    'index.ts'
                )
            ],
            filename: path.join('content', 'index.js'),
            html: false
        },
        popup: {
            import: path.join(
                PROJECT_ROOT,
                'src',
                'pages',
                'popup',
                'index.tsx'
            ),
            html: {
                title: 'Inspector'
            }
        },
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
            filename: path.join('background', 'index.js'),
            html: false
        },
        options: {
            import: path.join(
                PROJECT_ROOT,
                'src',
                'pages',
                'options',
                'index.tsx'
            ),
            html: {
                title: 'Options'
            }
        }
    },
    output: {
        path: OUTPUT_ABS_DIR,
        clean: true,
        publicPath: '/',
        iife: true,
        ...config.js.output,
        ...config.css.output,
        ...config.html.output,
    },
    resolve: {
        extensions: [
            ...config.assets.resolveExts,
            ...config.js.resolveExts,
            ...config.css.resolveExts,
        ]
    },
    module: {
        parser: {
            ...config.css.parsers
        },
        rules: [
            ...config.assets.moduleRules,
            ...config.js.moduleRules,
        ]
    },
    plugins: [
        new webpack.ProgressPlugin(),
        ...config.assets.plugins,
        ...config.css.plugins,
        ...config.js.plugins,
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
