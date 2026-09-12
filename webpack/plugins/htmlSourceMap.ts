import { type Tap } from 'tapable';
import webpack, { type Compiler, type WebpackPluginInstance } from 'webpack';
import { createSourceMapSource } from './genFile';

export default class CreateHtmlSourceMapWebpackPlugin implements WebpackPluginInstance {
    private readonly plugin: Tap = { name: 'html-create-source-map-webpack-plugin' };

    apply(compiler: Compiler) {
        compiler.hooks.compilation.tap(this.plugin, (compilation) => {
            // beforeEmit needed to supersede minimization, see:
            // https://github.com/jantimon/html-webpack-plugin?tab=readme-ov-file#events
            webpack.html.HtmlModulesPlugin.getCompilationHooks(
                compilation
            ).transformHtml.tap(this.plugin, (html, ctx) => {
                compilation.emitAsset(
                    `${ctx.outputName}.map`,
                    createSourceMapSource({
                        content: html,
                        target: ctx.outputName
                    }),
                    { sourceFilename: ctx.outputName }
                );

                // Telling Webpack to move on
                return html
            });
        });
    }
}
