import path from 'node:path';
import webpack from 'webpack';
import WebpackDevServer from 'webpack-dev-server';
import config from './webpack.config';

const OUTPUT_DIR = process.env.OUTPUT_DIR!;
const WEBPACK_PORT = process.env.WEBPACK_PORT!;

const compiler = webpack(config);

// Enabling server-side (and disabling client-side) hot reloading
const server = new WebpackDevServer(
    {
        hot: true,
        liveReload: false,
        client: false,
        webSocketServer: false,
        bonjour: false,
        static: {
            directory: path.resolve(process.cwd(), OUTPUT_DIR)
        },
        devMiddleware: {
            writeToDisk: true
        },
        port: WEBPACK_PORT
    },
    compiler
);

// Starting server (await blocks program termination)
await server.start();
