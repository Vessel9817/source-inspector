import { program } from 'commander';
import './commands';

program
    .name('Extension developer CLI')
    .parse(process.argv);
