/**
 * If the extension has permissions to inject into
 * the given URI, returns `true`, otherwise `false`
 * @param uri The URI to test
 * @returns
 */
export async function testInjectionUri(uri: string): Promise<boolean> {
    if (chrome.extension.inIncognitoContext) {
        // Some Firefox distros seem to return undefined instead of true
        if (true === (await chrome.extension.isAllowedIncognitoAccess())) {
            return false;
        }
    }

    // Note: Chrome and Firefox also allow injections into ftp:// URIs,
    // and Firefox into wss:// and ws:// URIs
    // Some Firefox distros seem to return undefined instead of true
    if (
        /^file:\/\//i.test(uri) &&
        false !== (await chrome.extension.isAllowedFileSchemeAccess())
    ) {
        return true;
    }

    // Not possible to detect if a page is our own
    // extension without external messaging
    // Manifest requirements: "optional_permissions": [ "tabs", "management" ]
    return /^https?:\/\//i.test(uri);
}

/**
 * Returns the active tab ID, or `undefined` if none
 * @returns The last active tab ID
 */
export async function getActiveTabId(): Promise<number | undefined> {
    const [tab] = await chrome.tabs.query({
        active: true,
        lastFocusedWindow: true
    });

    return tab.id;
}
