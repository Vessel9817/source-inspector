import webpack from 'webpack';
import { LICENSE } from '../assets/license';
import { IS_DEV_MODE } from '../env';
import { filenameTemplate } from './output';

/**
 * @experimental To be released as stable in Webpack 6
 */
export const native = true;

export const resolveExts = ['.css', '.sass', '.scss'];

export const parsers: NonNullable<webpack.ModuleOptions['parser']> = {
    css: {
        exportType: IS_DEV_MODE ? 'style' : 'link'
    }
};

const template = filenameTemplate('.css');

export const output: webpack.Configuration['output'] = {
    cssFilename: template,
    cssChunkFilename: template
};

export const plugins: NonNullable<webpack.Configuration['plugins']> = [
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
