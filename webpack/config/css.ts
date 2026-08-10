import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import webpack from 'webpack';
import { LICENSE } from '../assets/license';
import { IS_DEV_MODE } from '../env';

export const resolveExts = ['.css'];

export const moduleRules = [
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
                    modules: 'global'
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
    }
];

export const plugins = [
    // https://www.npmjs.com/package/style-loader#recommend
    !IS_DEV_MODE && new MiniCssExtractPlugin(),

    // Embedding license information after minimization
    new webpack.BannerPlugin({
        include: [/\.css$/i],
        stage: webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE,
        banner: LICENSE
    }),

    // Adding source map references after minimization
    new webpack.BannerPlugin({
        include: [/\.css$/i],
        stage: webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE,
        raw: true,
        footer: true,
        banner(data): string {
            // Webpack seems inconsistent with forward and backward slashes in Windows paths
            const relPath = data.filename.replaceAll('\\', '/');

            return `/*# sourceMappingURL=/${relPath}.map */`;
        }
    })
].filter(Boolean);
