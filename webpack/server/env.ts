import path from 'node:path';
import * as validators from '../validators';

/* Non-secret env vars, defined in nodemon config */

validators.string(process.env.OUTPUT_DIR);
const outputDir = path.normalize(process.env.OUTPUT_DIR);
export const OUTPUT_DIR = outputDir;

validators.string(process.env.WEBPACK_PORT);
const webpackPort = Number.parseInt(process.env.WEBPACK_PORT);
validators.port(webpackPort);
export const WEBPACK_PORT = webpackPort;
