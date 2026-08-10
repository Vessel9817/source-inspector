import { program } from 'commander';
import './build';

program
    .name('Extension developer CLI')
    .parse(process.argv);
