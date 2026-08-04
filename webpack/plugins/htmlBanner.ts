import HtmlWebpackPlugin from 'html-webpack-plugin'
import { type Tap } from 'tapable';
import type { Compiler, WebpackPluginInstance } from 'webpack';

interface HtmlBannerWebpackPluginArgs {
    /**
     * The text to be appended to the file
     */
    banner: string;

    /**
     * If `true`, banner will be placed at the end of the output.
     * @default false
     */
    footer?: boolean;

    /**
     * If `true`, defers formatting to the user.
     * Otherwise, formats the banner as a block comment.
     * @default false
     */
    raw?: boolean;
}

export default class HtmlBannerWebpackPlugin implements WebpackPluginInstance {
    private readonly plugin: Tap = { name: 'html-banner-webpack-plugin' };
    private readonly options: HtmlBannerWebpackPluginArgs;

    constructor(options: HtmlBannerWebpackPluginArgs) {
        this.options = {
            ...options,
            footer: options.footer ?? false
        };

        if (!options.raw) {
            const safeBanner = options.banner.replaceAll('-->', '-- >');
            this.options.banner = `<!--\n${safeBanner}\n-->`;
        }
    }

    apply(compiler: Compiler) {
        compiler.hooks.compilation.tap(this.plugin, (compilation) => {
            // beforeEmit needed to supersede minimization, see:
            // https://github.com/jantimon/html-webpack-plugin?tab=readme-ov-file#events
            HtmlWebpackPlugin.getCompilationHooks(
                compilation
            ).beforeEmit.tapAsync(this.plugin, (data, cb) => {
                if (this.options.footer) {
                    const banner = '\n' + this.options.banner;

                    data.html += banner;
                }
                else {
                    data.html = `${this.options.banner}\n${data.html}`;
                }

                // Telling Webpack to move on
                cb(null, data);
            });
        });
    }
}
