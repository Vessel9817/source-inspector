import sources from 'webpack-sources';

type SourceAndMap = sources.SourceAndMap & { map: Object };

// source and updateHash methods remain unimplemented
export class Source extends sources.Source {
    sourceAndMap(options?: sources.MapOptions): SourceAndMap {
        let out = {
            ...super.sourceAndMap(options)
        } as SourceAndMap;

        out.map = out.map ?? {};

        return out;
    }
}
