import registerPopup from '../popup/background';

class Background {
    /**
     * Registers all the background worker dependencies
     */
    static register() {
        registerPopup();

        console.log(chrome.i18n.getMessage('bg_registered'));
    }
}

// Running background entry point
Background.register();
