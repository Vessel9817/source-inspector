import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import path from 'node:path';
import webpack from 'webpack';
import { LICENSE } from '../assets/license';
import { PROJECT_ROOT } from '../env';

// TS/TSX must come before JS/JSX
export const resolveExts = ['.ts', '.tsx', '.js', '.jsx'];

export const moduleRules = [
    {
        test: /\.tsx?$/,
        type: 'javascript/esm',
        exclude: /node_modules/,
        use: [
            {
                // https://www.npmjs.com/package/ts-loader#devtool--sourcemaps
                // https://npmjs.com/package/fork-ts-checker-webpack-plugin#installation
                loader: 'ts-loader',
                options: {
                    configFile: path.join(PROJECT_ROOT, 'tsconfig.json'),
                    compilerOptions: {
                        emitDeclarationOnly: false,
                        noEmit: false
                    }
                }
            },
            'source-map-loader'
        ]
    }
];

export const plugins = [
    // https://npmjs.com/package/fork-ts-checker-webpack-plugin#installation
    new ForkTsCheckerWebpackPlugin(),

    // assert polyfill depends on process
    // https://github.com/browserify/commonjs-assert/issues/55#issuecomment-996543717
    new webpack.ProvidePlugin({
        process: 'process/browser'
    }),

    // Embedding license information after minimization
    new webpack.BannerPlugin({
        include: [/\.js$/i],
        stage: webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE,
        banner: LICENSE
    }),

    // Adding source map references after minimization
    new webpack.BannerPlugin({
        include: [/\.js$/i],
        stage: webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE,
        raw: true,
        footer: true,
        banner(data): string {
            // Webpack seems inconsistent with forward and backward slashes in Windows paths
            const relPath = data.filename.replaceAll('\\', '/');

            return `/*# sourceMappingURL=/${relPath}.map */`;
        }
    })
];
