import registerPopup from '../popup/background';
import { getMessage } from '../shared';

class Background {
    /**
     * Registers all the background worker dependencies
     */
    static register(): void {
        registerPopup();

        console.log(getMessage('bg_registered', []));
    }
}

// Running background entry point
Background.register();
