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
    private readonly banner: string;
    private readonly footer: boolean;

    constructor(options: HtmlBannerWebpackPluginArgs) {
        this.footer = options.footer ?? false;

        if (options.raw === true) {
            this.banner = options.banner;
        } else {
            const safeBanner = options.banner.replaceAll('-->', '-- >');
            this.banner = `<!--\n${safeBanner}\n-->`;
        }
    }

    apply(compiler: Compiler) {
        compiler.hooks.compilation.tap(this.plugin, (compilation) => {
            // beforeEmit needed to supersede minimization, see:
            // https://github.com/jantimon/html-webpack-plugin?tab=readme-ov-file#events
            HtmlWebpackPlugin.getCompilationHooks(
                compilation
            ).beforeEmit.tapAsync(this.plugin, (data, cb) => {
                if (this.footer) {
                    data.html += '\n' + this.banner;
                }
                else {
                    data.html = `${this.banner}\n${data.html}`;
                }

                // Telling Webpack to move on
                cb(null, data);
            });
        });
    }
}
