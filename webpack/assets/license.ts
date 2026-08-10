import fs from 'node:fs/promises';
import path from 'node:path';
import { PROJECT_ROOT } from '../env';

export const LICENSE = (await fs.readFile(path.join(PROJECT_ROOT, 'LICENSE'))).toString().trim();
