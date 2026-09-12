import type webpack from 'webpack';
import { LICENSE } from '../assets/license';
import {
    CreateHtmlSourceMapWebpackPlugin,
    HtmlBannerWebpackPlugin
} from '../plugins';

export const output: NonNullable<webpack.Configuration['output']>['html'] = {
    meta: {
        charset: 'UTF-8',
        viewport: 'width=device-width, initial-scale=1'
    },
    // inject: 'body'
};

export const plugins: webpack.Configuration['plugins'] = [
    // Manually creating (unlinked) source map
    new CreateHtmlSourceMapWebpackPlugin(),

    // Embedding license information after minimization
    new HtmlBannerWebpackPlugin({
        banner: LICENSE,
        sourceMap: true
    }),
];
