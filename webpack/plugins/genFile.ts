import { type Tap } from 'tapable';
import type {
    AssetInfo,
    Compiler,
    WebpackPluginInstance
} from 'webpack';
import sources from 'webpack-sources';
import { type Manifest } from '../manifest';
import { Source } from './sources';

interface GenerateFilePluginArgs {
    target: string;
    content: string;
    assetInfo?: AssetInfo;
}

interface InternalGenerateFilePluginArgs extends GenerateFilePluginArgs {
    source: Source;
}

type GenerateManifestArgs = Omit<GenerateFilePluginArgs, 'content' | 'target'> & {
    /**
     * The manifest, in JSON
     */
    manifest: Manifest;

    /**
     * How much to indent the manifest
     */
    indents?: number;

    /**
     * @default 'manifest.json'
     */
    target?: string;
};

export default class GenerateFilePlugin implements WebpackPluginInstance {
    private readonly plugin: Tap = { name: 'GenerateFilePlugin' };
    private readonly options: InternalGenerateFilePluginArgs;

    constructor(options: GenerateFilePluginArgs) {
        this.options = {
            ...options,
            source: new Source()
        };
        this.options.source.source = () => options.content;
    }

    public apply(compiler: Compiler) {
        compiler.hooks.compilation.tap(this.plugin, (compilation) => {
            compilation.emitAsset(
                this.options.target,
                this.options.source,
                this.options.assetInfo
            );
        });

        this.options.source.updateHash = (hash: sources.HashLike) => {
            compiler.hooks.compilation.tap(this.plugin, (compilation) => {
                compilation.updateAsset(
                    this.options.target,
                    this.options.source,
                    {
                        contenthash: hash.digest().toString(),
                        ...this.options.assetInfo
                    }
                );
            });
        };
    }

    /**
     * Creates a Webpack plugin to generate a manifest file
     * @param options Plugin configuration options
     * @returns A Webpack plugin to execute this function
     */
    public static generateManifestPlugin(
        options: GenerateManifestArgs
    ): GenerateFilePlugin {
        return new GenerateFilePlugin({
            target: options.target ?? 'manifest.json',
            content: GenerateFilePlugin.stringifyManifest(
                options.manifest,
                options.indents
            ),
            assetInfo: options.assetInfo
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
