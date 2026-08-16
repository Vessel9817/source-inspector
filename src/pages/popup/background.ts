import { testInjectionUri } from '../shared/background';
import { type ConnectMsg } from './msgs';

// Shared exports
export const TIMEOUT_MS = 5_000;

class Popup {
    #popupId: number | undefined;
    #tabId: number | undefined;

    #tryConnecting(): void {
        if (this.#popupId != null && this.#tabId != null) {
            console.log(chrome.i18n.getMessage('bg_connecting'));

            const msg: ConnectMsg = {
                type: 'connection',
                tabId: this.#tabId
            };

            chrome.tabs.sendMessage(this.#popupId, msg);
        }
    }

    /**
     * Allows the inspected tab to connect,
     * allowing document changes to be communicated
     * @param tabId
     * @param popupId
     */
    #initializeTabBroker(tabId: number): void {
        const self = this;

        // Waiting for document listener to initialize
        async function MSG_BROKER(
            _msg: Readonly<any>,
            sender: Readonly<chrome.runtime.MessageSender>
        ): Promise<void> {
            if (sender.id === chrome.runtime.id && sender.tab?.id === tabId) {
                chrome.runtime.onMessage.removeListener(MSG_BROKER);
                clearTimeout(TIMEOUT);

                console.log(
                    chrome.i18n.getMessage('bg_script_initialized')
                        .replaceAll('{0}', tabId.toString())
                );

                self.#tabId = tabId;

                self.#tryConnecting();
            }
        }

        // Ensuring garbage collection after fixed timeout
        const TIMEOUT = setTimeout(() => {
            chrome.runtime.onMessage.removeListener(MSG_BROKER);

            console.error(
                chrome.i18n.getMessage('bg_script_timeout')
                    .replaceAll('{0}', tabId.toString())
                    .replaceAll('{1}', TIMEOUT_MS.toString())
            );
        }, TIMEOUT_MS);

        chrome.runtime.onMessage.addListener(MSG_BROKER);

        // Injecting document listener into tab
        chrome.scripting.executeScript({
            target: {
                tabId
                // allFrames: true
            },
            files: ['content/docListener.js'],
            world: 'ISOLATED'
        });
    }

    /**
     * Allows the inspector popup to connect,
     * allowing document changes to be
     * communicated to the inspected tab
     */
    async #initializePopupBroker(): Promise<void> {
        const self = this;

        function onWindowCreated(tabId: number): void {
            // Waiting for popup to initialize
            async function MSG_BROKER(
                _msg: Readonly<any>,
                sender: Readonly<chrome.runtime.MessageSender>
            ): Promise<void> {
                if (
                    sender.id === chrome.runtime.id &&
                    sender.tab?.id === tabId
                ) {
                    chrome.runtime.onMessage.removeListener(MSG_BROKER);
                    clearTimeout(TIMEOUT);

                    console.log(
                        chrome.i18n.getMessage('bg_script_initialized')
                            .replaceAll('{0}', tabId.toString())
                    );

                    self.#popupId = tabId;

                    self.#tryConnecting();
                }
            }

            chrome.runtime.onMessage.addListener(MSG_BROKER);

            // Ensuring garbage collection after fixed timeout
            const TIMEOUT = setTimeout(() => {
                chrome.runtime.onMessage.removeListener(MSG_BROKER);

                console.error(
                    chrome.i18n.getMessage('bg_popup_timeout')
                        .replaceAll('{0}', tabId.toString())
                        .replaceAll('{1}', TIMEOUT_MS.toString())
                );
            }, TIMEOUT_MS);
        }

        // Opening popup (requires extension split to run in incognito)
        chrome.windows.create(
            {
                url: chrome.runtime.getURL('popup/index.html'),
                type: 'popup'
            },
            (popup) => {
                onWindowCreated(popup!.tabs![0].id!);
            }
        );
    }

    /**
     * Initializes the popup to inspect the given tab's document source
     * @param tab
     */
    static async tryCreatingPopup(tab: chrome.tabs.Tab): Promise<void> {
        if (
            tab.id != null &&
            tab.url != null &&
            (await testInjectionUri(tab.url))
        ) {
            const popup = new Popup();

            popup.#initializePopupBroker();
            popup.#initializeTabBroker(tab.id);
        }
    }

    /**
     * Creates a document source inspector popup
     * in a new tab when the extension icon is clicked
     */
    static registerPopup(): void {
        (chrome.action ?? browser.browserAction).onClicked.addListener(
            Popup.tryCreatingPopup
        );
    }
}

export default Popup.registerPopup;
