import path from 'node:path';
import sources from 'webpack-sources';
import { type Tap } from 'tapable';
import type {
    AssetInfo,
    Compiler,
    WebpackPluginInstance
} from 'webpack';
import { type Manifest } from '../manifest';
import { Source } from './sources';

interface GenerateFilePluginArgs {
    filename: string;
    content: string;
    assetInfo?: AssetInfo;
}

type GenerateManifestArgs = Omit<GenerateFilePluginArgs, 'content'> & {
    manifest: Manifest;
    tabs?: number;
};

export default class GenerateFilePlugin implements WebpackPluginInstance {
    private readonly plugin: Tap = { name: 'GenerateFilePlugin' };
    private readonly filepath: string;
    private readonly source: Source;
    private readonly assetInfo: AssetInfo | undefined;

    constructor(args: GenerateFilePluginArgs) {
        this.filepath = args.filename;
        this.source = new Source();
        this.source.source = () => args.content;
        this.assetInfo = args.assetInfo;
    }

    public apply(compiler: Compiler) {
        compiler.hooks.compilation.tap(this.plugin.name, (compilation) => {
            compilation.emitAsset(this.filepath, this.source, {
                ...this.assetInfo,
                sourceFilename: path.basename(this.filepath)
            });
        });

        this.source.updateHash = (hash: sources.HashLike) => {
            compiler.hooks.compilation.tap(this.plugin.name, (compilation) => {
                compilation.updateAsset(this.filepath, this.source, {
                    ...this.assetInfo,
                    contenthash: hash.digest().toString(),
                    sourceFilename: path.basename(this.filepath)
                });
            });
        };
    }

    /**
     * Creates a Webpack plugin to generate a manifest file
     * @param relBuildDirPath The path to the manifest file to generate
     * @param manifest The JSON object which with to populate the manifest file
     * @returns A Webpack plugin to execute this function
     */
    public static generateManifestPlugin(
        args: GenerateManifestArgs
    ): GenerateFilePlugin {
        return new GenerateFilePlugin({
            filename: args.filename,
            content: GenerateFilePlugin.stringifyManifest(
                args.manifest,
                args.tabs
            ),
            assetInfo: args.assetInfo
        });
    }

    private static stringifyManifest(
        manifest: Manifest,
        tabs?: number
    ): string {
        const replacer = (key: string, value: any) => {
            // Manifest requires forward slashes
            return typeof value === 'string'
                ? value.replaceAll('\\', '/')
                : value;
        };

        return JSON.stringify(manifest, replacer, tabs);
    }
}
