import HtmlWebpackPlugin from 'html-webpack-plugin'
import { type Tap } from 'tapable';
import type { Compiler, WebpackPluginInstance } from 'webpack';

interface HtmlBannerWebpackPluginArgs {
    /**
     * Specifies the banner
     */
    banner: string;

    /**
     * If true, defers formatting to the user.
     * Otherwise, formats the banner as a block comment.
     * @default false
     */
    raw?: boolean;
}

export default class HtmlBannerWebpackPlugin implements WebpackPluginInstance {
    private readonly plugin: Tap = { name: 'html-license-webpack-plugin' };
    private readonly banner: string;

    constructor(args: HtmlBannerWebpackPluginArgs) {
        if (args.raw === true) {
            this.banner = args.banner;
        } else {
            const safeBanner = args.banner.replaceAll('-->', '-- >');
            this.banner = `<!--\n${safeBanner}\n-->\n`;
        }
    }

    apply(compiler: Compiler) {
        compiler.hooks.compilation.tap(this.plugin.name, (compilation) => {
            // beforeEmit needed to supersede minimization, see:
            // https://github.com/jantimon/html-webpack-plugin?tab=readme-ov-file#events
            HtmlWebpackPlugin.getCompilationHooks(
                compilation
            ).beforeEmit.tapAsync(this.plugin.name, (data, cb) => {
                // Prepending banner
                data.html = `${this.banner}${data.html}`;
                // Telling Webpack to move on
                cb(null, data);
            });
        });
    }
}
