import { disableReactDevTools } from '@fvilers/disable-react-devtools';
import React from 'react';
import { generateRoot, IS_PRODUCTION } from '../shared';
import Options from './options';

// Must run before React is used
if (IS_PRODUCTION) {
    disableReactDevTools();
}

// CSS
import './index.css';

const root = generateRoot();

root.render(
    <Options />
);
