/**
 * Tests whether the extension has permission to inject into the given URI
 * @param uri The URI to test
 * @returns `true` if the extension has sufficient permissions, `false` otherwise
 */
export async function testInjectionUri(uri: string): Promise<boolean> {
    if (chrome.extension.inIncognitoContext) {
        if (!await browser.extension.isAllowedIncognitoAccess()) {
            return false;
        }
    }

    // Note: Chrome and Firefox also allow injections into ftp:// URIs,
    // and Firefox into wss:// and ws:// URIs
    if (
        /^file:\/\//i.test(uri) &&
        await browser.extension.isAllowedFileSchemeAccess()
    ) {
        return true;
    }

    // Not possible to detect if a page is our own
    // extension without external messaging.
    // Manifest requirements: "optional_permissions": [ "tabs", "management" ]
    return /^https?:\/\//i.test(uri);
}
