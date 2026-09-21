import { disableReactDevTools } from '@fvilers/disable-react-devtools';
import { E_TIMEOUT } from 'async-mutex';
import React from 'react';
import { generateRoot, getMessage, IS_PRODUCTION } from '../shared';
import { PopupManager } from './stateManager';

// Must run before React is used
if (IS_PRODUCTION) {
    disableReactDevTools();
}

// CSS
import './index.css';

// Connecting to tab
const root = generateRoot();
const popupManager = new PopupManager();

await popupManager.connect();

// Creating asynchronous rendering loop
const RENDER_INTERVAL_MS = 250;
const render = async () => {
    try {
        const states = await popupManager.getNodeTreeStates(
            RENDER_INTERVAL_MS
        );

        root.render(
            <PopupManager.Popup rootId={states.rootId} nodes={states.nodes} />
        );
    }
    catch (err) {
        if (err === E_TIMEOUT) {
            console.warn(getMessage('renderer_timeout', []));
        } else {
            throw err;
        }
    }
};
const renderIntervalId = setInterval(render, RENDER_INTERVAL_MS);

// Defining destructor
const unmount = root.unmount.bind(root);

root.unmount = () => {
    clearInterval(renderIntervalId);
    unmount();
};

await render();
