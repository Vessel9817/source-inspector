import path from 'node:path';
import { PathDataChunk, type AssetInfo, type PathData } from 'webpack';

type TemplatePathFn<T extends PathData = PathData> = (
    pathData: T,
    assetInfo?: AssetInfo
) => string;

export function filenameTemplate(ext: string): TemplatePathFn<PathDataChunk> {
    return (pathData) => {
        let filename: string;

        if (pathData.filename) {
            // Initial chunk
            // https://webpack.js.org/concepts/under-the-hood/#chunks

            const dirname = path.dirname(pathData.filename);

            filename = path.basename(pathData.filename);
            // Files should not start with underscore: reserved by Chrome
            filename = path.join(dirname, filename.replace(/^_+/g, '') + ext);
        }
        else {
            // Non-initial chunk

            // Files should not start with underscore: reserved by Chrome
            filename = pathData.chunk.id?.toString().replace(/^_+/g, '') + ext;
        }

        return filename;
    }
}
