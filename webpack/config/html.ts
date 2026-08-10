import HtmlWebpackPlugin from 'html-webpack-plugin';
import path from 'node:path';
import { LICENSE } from '../assets/license';
import { PROJECT_ROOT } from '../env';
import {
    CreateHtmlSourceMapWebpackPlugin,
    HtmlBannerWebpackPlugin
} from '../plugins';

export const moduleRules = [
    {
        test: /\.html$/,
        exclude: /node_modules/,
        loader: 'html-loader'
    }
];

export const plugins = [
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

    // Manually creating (unlinked) source map
    new CreateHtmlSourceMapWebpackPlugin(),

    // Embedding license information after minimization
    new HtmlBannerWebpackPlugin({
        banner: LICENSE,
        sourceMap: true
    }),
];
