import { E_ALREADY_LOCKED, Mutex, tryAcquire } from 'async-mutex';
import { BROWSER, getMessage } from '../shared';
import { testInjectionUri } from '../shared/background';
import { type ConnectMsg } from './msgs';

// Shared exports
export const TIMEOUT_MS = 5_000;

class Popup {
    private popupId: number | undefined;
    private tabId: number | undefined;
    /**
     * Used to ensure `tryConnecting` fires a message only once.
     * @implNote Once acquired, this mutex is never released: should never be treated as blocking.
     */
    private readonly readyMutex: Mutex;

    constructor() {
        this.readyMutex = new Mutex();
    }

    /**
     * If the popup has been created and the content script injected,
     * tells the popup how to listen to the content script.
     */
    async tryConnecting(): Promise<void> {
        if (this.popupId != null && this.tabId != null) {
            try {
                // If acquired, never release to run this function only once
                tryAcquire(this.readyMutex);
            }
            catch (e) {
                if (e === E_ALREADY_LOCKED) {
                    // Connection already established
                    return;
                }
            }

            // Tell popup to connect to tab
            console.log(getMessage('bg_connecting', []));

            const msg: ConnectMsg = {
                type: 'connection',
                tabId: this.tabId
            };

            chrome.tabs.sendMessage(this.popupId, msg);
        }
    }

    /**
     * Allows the inspected tab to connect,
     * allowing document changes to be communicated
     * @param tabId The tab ID of the injected tab
     * @param popupId The tab ID of the popup
     */
    initializeTabBroker(tabId: number): void {
        const self = this;

        // Waiting for document listener to initialize
        async function MSG_BROKER(
            _msg: Readonly<any>,
            sender: Readonly<browser.runtime.MessageSender>
        ): Promise<void> {
            if (sender.id === chrome.runtime.id && sender.tab?.id === tabId) {
                chrome.runtime.onMessage.removeListener(MSG_BROKER);
                clearTimeout(TIMEOUT);

                console.log(
                    getMessage('bg_script_initialized', [tabId.toString()])
                );

                self.tabId = tabId;

                await self.tryConnecting();
            }
        }

        // Ensuring garbage collection after fixed timeout
        const TIMEOUT = setTimeout(() => {
            chrome.runtime.onMessage.removeListener(MSG_BROKER);

            console.error(
                getMessage(
                    'bg_script_timeout',
                    [tabId.toString(), TIMEOUT_MS.toString()]
                )
            );
        }, TIMEOUT_MS);

        chrome.runtime.onMessage.addListener(MSG_BROKER);

        // Injecting document listener into tab
        chrome.scripting.executeScript({
            target: {
                tabId,
                // allFrames: true
            },
            injectImmediately: true,
            files: ['content/index.js'],
            world: chrome.scripting.ExecutionWorld.ISOLATED
        });
    }

    /**
     * Allows the inspector popup to connect,
     * allowing document changes to be
     * communicated to the content script
     */
    async initializePopupBroker(): Promise<void> {
        const self = this;

        function onWindowCreated(popupId: number): void {
            // Waiting for popup to initialize
            async function MSG_BROKER(
                _msg: Readonly<any>,
                sender: Readonly<browser.runtime.MessageSender>
            ): Promise<void> {
                if (
                    sender.id === chrome.runtime.id &&
                    sender.tab?.id === popupId
                ) {
                    chrome.runtime.onMessage.removeListener(MSG_BROKER);
                    clearTimeout(TIMEOUT);

                    console.log(
                        getMessage('bg_popup_initialized', [popupId.toString()])
                    );

                    self.popupId = popupId;

                    await self.tryConnecting();
                }
            }

            chrome.runtime.onMessage.addListener(MSG_BROKER);

            // Ensuring garbage collection after fixed timeout
            const TIMEOUT = setTimeout(() => {
                chrome.runtime.onMessage.removeListener(MSG_BROKER);

                console.error(
                    getMessage(
                        'bg_popup_timeout',
                        [popupId.toString(), TIMEOUT_MS.toString()]
                    )
                );
            }, TIMEOUT_MS);
        }

        // Opening popup
        if (chrome.windows) {
            // Chrome and Firefox
            chrome.windows.create(
                {
                    url: chrome.runtime.getURL('popup.html'),
                    type: 'popup'
                },
                (popup) => {
                    if (popup) {
                        onWindowCreated(popup.tabs![0].id!);
                    }
                }
            );
        }
        else {
            // Firefox for Android
            chrome.tabs.create(
                {
                    url: chrome.runtime.getURL('popup.html')
                },
                (tab) => {
                    if (tab) {
                        onWindowCreated(tab.id!);
                    }
                }
            );
        }
    }

    /**
     * Initializes the popup to inspect the given tab's document source
     * @param tab The tab to inspect
     */
    static async tryCreatingPopup(tab: browser.tabs.Tab): Promise<void> {
        if (
            tab.id != null &&
            tab.url != null &&
            (await testInjectionUri(tab.url))
        ) {
            const popup = new Popup();

            popup.initializePopupBroker();
            popup.initializeTabBroker(tab.id);
        }
    }

    /**
     * Creates a document source inspector popup
     * in a new tab when the extension icon is clicked
     */
    static registerPopup(): void {
        const action = BROWSER === 'chrome'
            ? chrome.action
            : browser.browserAction;

        action.onClicked.addListener(Popup.tryCreatingPopup);
    }
}

export default Popup.registerPopup;
