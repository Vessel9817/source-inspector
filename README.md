# source-inspector

[![License][license-image]](LICENSE)
[![CI][ci-badge]][ci-workflow]

## Motivation

If you're a developer who ever needs to debug something within their browser,
DevTools is probably the most popular debugger, as it's shipped with Chrome.
It's a great resource, as are the many open-source alternatives. However, these
debuggers all rely on the browser's native debugger. Some very smart people have
figured out ways to detect when a debugger has been attached to their site,
whether through [DevTools][devtools] or through [browser.debugger][debugger].

Enter `source-inspector`. We attempt to circumvent detection, so that you can
safely view the live HTML source of even the sketchiest websites. This tool is
intended to let you inspect the source of any website live, whether it's
written in pure HTML or XHTML.

## Support

This extension currently only supports desktop devices using Chromium
or Firefox and derivatives, such as Edge or Tor. We aim to support all the
currently stable [node types][node-types]. The remaining node types are a
secondary priority, as their obsoletion from modern browsers impedes testing.

## Privacy and Security

See our [privacy policy](PRIVACY.md)

For more technical readers with a knowledge of browser extensions, the built
manifest files show the following:

- We do not have any web accessible resources. If we did, we'd incorporate
  [`use_dynamic_url`][use_dynamic_url] to prevent extension detection.
- Running the extension in normal or incognito mode uses separate processes and
  separate memory. This means the extension in one mode cannot communicate
  with- or access any data from- the other. In other words, our extension
  respects incognito mode. However, as MV2 doesn't support this feature,
  this only applies to Chromium builds.
- This extension uses minimal permissions for security purposes.
- DevTools or any external debugger is not used. We wrote ours from scratch
  using plain JavaScript inspection and messaging.
- We don't use any host permissions. Instead, we only perform anything on the
  active tab upon user initiation.
- Although it would be nice, this extension does not use elevated permissions
  that would allow it to self-inspect.

There are also some additional security features we have implemented:

- The content script is injected in an isolated world and never modifies the DOM.
  This prevents detection while still allowing access to the DOM.
- Code is wrapped in an IIFE to restrict external access of internal members.
- All messages are validated to ensure that
  [compromised renderers][compromised-renderers] have
  [limited scope][compromised-renderers-more].
- We make zero network requests, superseding an [origin header][origin-bug]
  bug in Firefox that could allow for detection.
- We use MV3, superseding a [timing attack][timing-attack] with Chromium
  (excluding Brave) that would allow extension detection

## Building

In order to use this extension, you must first build it from source.

- Clone this repository
- Open your IDE or terminal to the root of the project
- Run `npm i` to install dependencies
- Run `npm run build -- <browser> <mode>`, where:
  - `<browser>` is `chrome` or `firefox`
  - `<mode>` is `dev` or `prod`

You should now have an installable extension.

## Installing

This extension is not available on any browser web store, such as the Chrome
or Firefox web store. It's recommended that you pin the extension after
installation for quick and easy access, but it's not required.

### Chromium (Chrome, Edge, etc)

- In the address bar, type `chrome://extensions` and hit enter
- If it's not already enabled, click the `Developer mode` toggle
- Click the `Load unpacked` button
- Select the built extension folder

### Firefox (Firefox, Tor, etc)

- In the address bar, type `about:addons` and hit enter
- If it's not already enabled, click the `Developer mode` toggle
- Click the `Load Temporary Add-on` button
- Select the built extension `manifest.json` file

## Changing Permissions

- Right click the extension icon in the extension toolbar
- Click `Manage extension`
- Find the extension and click `Details`

This is the extension details page.
From here, you can toggle the extension's permissions to:

- Run in incognito/private mode
- Run in local files (i.e, `file://`)

and possibly more, depending on your browser.

## How It Works

If you want evidence towards our claim of being "undetectable", or you're
curious about the project's inner workings, this is the section for you.

This extension is divided into three parts:

### Popup

When you click on the extension icon, the popup is the source inspection tab
that opens.

### Background

This is the internal event handler for any protected extension functions, such
as opening the popup. It also passes events between the popup and content
script.

### Content Script

This is a script that's "injected" into the page you're attempting to inspect.
Basically, it's run alongside the page and has access to the page's source.
If our extension wasn't trying to be undetectable, we could use this to modify
the page, such as with ad blocking.

<!-- ### Source Inspection Flow -->

## Design Flaws

Below are some caveats this extension has that don't have immediate fixes:

- Obsolete node types are either ignored or replaced by modern browsers,
  which makes it particularly difficult for us to support them.
  For instance, try the [entity reference test](./test/entity_reference_test.xhtml)
  in your browser. If you're using a modern browser, everything should be
  valid HTML. But if you view the page source, the doctype differs, because
  the page uses deprecated XHTML features.
- [XML declarations][xml-declarations] aren't completely accurate, as in order
  to use properties that aren't deprecated or obsolete, we estimate some values
  based on similar, standardized properties.
- Deprecated HTML properties make certain information not cross-browser compatible.
  For instance, [Document.xmlStandalone][xmlStandalone], which we use for
  [XML declarations][xml-declarations], is unavailable in Firefox.
- We can't currently catch every attribute event. Because `MutationObserver`s
  run at the microtask level, and because attribute `MutationRecord`s don't
  include the new attribute value, we don't yet have a way to get the values
  of attributes every time they're updated, only most times.
- This extension is subject to the same restrictions as any extension. That
  means that protected URLs, such as `chrome://`, `edge://`,
  `chrome-extension://` and `about://`, cannot be inspected. Ironically, this
  means that this extension can't inspect its own inspector.
- This extension is unable to view the original source, as it reconstructs the
  source from what's visible. Browsers render non-(X)HTML documents and XML
  documents without attached stylesheets as (X)HTML. In other words, this
  extension sees what you see.

## Contribution

For a list of planned features and fixes, see the [TODOs](TODO.md).
If your planned contribution isn't included there, feel free to open
an issue or pull request. If anything doesn't follow W3 standards,
WHATWG standards or the HTML Living Standard, please let us know how we can
better adhere to code.

Similar to the `build` script, we offer a web server for iterative development
via hot-reloading. It can be started by running
`npm run start:<browser>:<mode>`. Though it will attempt to reload on changes it
can't hot-reload, you can trigger manual reloading by typing `rs` and hitting
enter in the terminal. It will not reload the underlying Nodemon process, so
stopping and starting the process will be necessary to update Nodemon
and its dependencies.

## Attribution

- [Extension boilerplate][boilerplate]
- [Code review icons][flaticon] created by Freepik - Flaticon
- The community members involved in contribution and translation

[ci-badge]: https://github.com/Vessel9817/source-inspector/actions/workflows/ci.yml/badge.svg
[ci-workflow]: https://github.com/Vessel9817/source-inspector/actions/workflows/ci.yml
[node-types]: https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType
[devtools]: https://developer.chrome.com/docs/devtools
[debugger]: https://developer.chrome.com/docs/extensions/reference/api/debugger
[timing-attack]: https://browserleaks.com/chrome#timing-attack-for-web-accessible-resources
[use_dynamic_url]: https://developer.chrome.com/docs/extensions/reference/manifest/web-accessible-resources
[origin-bug]: https://bugzilla.mozilla.org/show_bug.cgi?id=1405971
[compromised-renderers]: https://chromium.googlesource.com/chromium/src/+/refs/heads/main/docs/security/compromised-renderers.md#Messaging
[compromised-renderers-more]: https://issuetracker.google.com/issues/311491887
[xml-declarations]: https://www.w3.org/TR/2006/REC-xml11-20060816/#NT-XMLDecl
[xmlstandalone]: https://developer.mozilla.org/en-US/docs/Web/API/Document#document.xmlstandalone
[boilerplate]: https://github.com/Anonymous-Humanoid/chromium-extension-boilerplate
[flaticon]: https://www.flaticon.com/free-icons/code-review
[license-image]: https://img.shields.io/npm/l/markdownlint.svg
