import React from 'react';
import { createRoot } from 'react-dom/client';
import Options from './options';

// CSS
import './index.scss';

const container = document.getElementById('app-container');

if (container != null) {
    const root = createRoot(container);

    root.render(
        <Options />
    );
}
else {
    // Shouldn't occur
    throw new Error('App container missing');
}
