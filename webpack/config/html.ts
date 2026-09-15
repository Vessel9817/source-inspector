import type webpack from 'webpack';
import { LICENSE } from '../assets/license';
import {
    CreateHtmlSourceMapWebpackPlugin,
    HtmlBannerWebpackPlugin
} from '../plugins';
import { filenameTemplate } from './output';

/**
 * @experimental To be released as stable in Webpack 6
 */
export const native = true;

const template = filenameTemplate('.html');

export const output: webpack.Configuration['output'] = {
    html: {
        meta: {
            charset: 'UTF-8',
            viewport: 'width=device-width, initial-scale=1'
        },
    },
    htmlFilename: template,
    htmlChunkFilename: template
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
