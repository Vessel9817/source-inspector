# source-inspector

[![License][license-image]](LICENSE)

Note: This extension currently only supports desktop devices using Chromium
derivatives or Firefox, such as Edge or Tor. We aim to support all the
currently stable [node types][node-types].

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

## Privacy and Security

See our [privacy policy](PRIVACY.md)

For more technical readers with a knowledge of browser extensions, the built
manifest files show the following:

- We use MV3 in Chromium builds, preventing extension detection via
  [timing attack][timing-attack].
- We do not have any web accessible resources. If we did, we'd use
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

There are also some additional security features we have implemented:

- The content script is injected in an isolated world and never modifies the DOM.
  This prevents detection while still allowing access to the DOM.
- Code is wrapped in an IIFE to restrict external access of internal members.
- All messages are validated to ensure that
  [compromised renderers][compromised-renderers] have
  [limited scope][compromised-renderers-more].

The only possible means of detecting this extension could be a timing attack
on the inspected website, which is beyond the skill set of this repository's
owner. If you're able to present a proof-of-concept or potential patches,
please feel free to do so. For now, this remains only an unproven theory without
supporting evidence.

Finally, for transparency's sake, yes, the initial commit added _a lot_. That's
because this project had been in the works for a while. This was a rich
opportunity to learn about React and more technical (X)HTML.
And in learning about React through this project, there were a few migrations
to get the nesting of diverse component states functional and implemented to
reasonable and modern coding standards.

## Building

In order to use this extension, you must first build it from source.

- Download the source code
- Open your IDE or terminal to the root of the project
- Run `npm install` to install dependencies
- To build the extension, start a development server:
  - For users, run `npm run start:<browser>:prod` to run in production mode,
    where `<browser>` is `chrome` (port 8081) or `firefox` (port 8083).
    This will create a folder `dist/<browser>/prod` containing the built extension.
  - For developers, run `npm run start:<browser>:dev`, to run in development
    mode, where `<browser>` is `chrome` (port 8080) or `firefox` (port 8082).
    This will create a folder `dist/<browser>/dev` containing the built extension.
- Optionally, when the server says that webpack has compiled successfully,
  you can stop the server. (Ctrl+C, or Command+C on Mac)
  It's only necessary to keep it running if you plan on making changes
  to the source code and having them be patched in live. Though, in
  Chromium-based browsers, you will still be required to reload the extension
  manually.

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
- Select the built extension folder

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
- [XML declarations][xml-declarations]
  are not included in inspected output due to the lack of Firefox DOM APIs
  necessary to easily regenerate one. For more information, see the
  [xmlVersion][xmlVersion], [xmlEncoding][xmlEncoding] and
  [xmlstandalone][xmlstandalone] document properties. To contribute a fix, see:
  [#43](https://github.com/Anonymous-Humanoid/source-inspector/issues/43)
- We can't currently catch every attribute event. Because `MutationObserver`s
  run at the microtask level, and because attribute `MutationRecord`s don't
  include the new attribute value, we don't yet have a way to get the values
  of attributes every time they're updated, only most times.
  <!--
  This could potentially be fixed by polling existing elements,
  but that gets expensive quickly
  -->
- This extension is subject to the same restrictions as any extension. That
  means that protected URLs, such as `chrome://`, `edge://`,
  `chrome-extension://` and `about://`, cannot be inspected. Ironically, this
  means that you can't inspect the extension's own source code.
- Due to how browsers render XML documents that don't have attached stylesheets,
  XML is only partially supported. If the XML document is styled, then it
  should be fully supported. However, many modern browsers may add some
  boilerplate to the rendered document to say that there's no stylesheet.
  Because of how this extension works and the restrictions we apply to it for
  the user's sake, this will be included in the inspected source. In other
  words, if you can see it, so can this extension.
  <!-- Not applicable to us, as we expose no web accessible resources -->
  <!-- - In Chrome, a website could send a GET request to
      `chrome-extension://<YOUR_ID_HERE>/manifest.json`. If it's successful, you
      have our extension installed.
      [See this working demo][timing-attack].
  -->
  <!-- Not applicable to us, because we make zero network requests -->
  <!-- - In Firefox, by clicking the extension button and activating the inspector,
      the website can look at its
      [origin header](https://bugzilla.mozilla.org/show_bug.cgi?id=1405971)
      and determine that you're trying to use our extension.
  -->

## Contribution

For a list of planned features and fixes, see the [TODOs](TODO.md)

## Credits

- My own [extension boilerplate](https://github.com/Anonymous-Humanoid/chromium-extension-boilerplate)
- [Code review icons](https://www.flaticon.com/free-icons/code-review) created
  by Freepik - Flaticon

[node-types]: https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType
[devtools]: https://developer.chrome.com/docs/devtools
[debugger]: https://developer.chrome.com/docs/extensions/reference/api/debugger
[timing-attack]: https://browserleaks.com/chrome
[use_dynamic_url]: https://developer.chrome.com/docs/extensions/reference/manifest/web-accessible-resources
[compromised-renderers]: https://chromium.googlesource.com/chromium/src/+/refs/heads/main/docs/security/compromised-renderers.md#Messaging
[compromised-renderers-more]: https://issuetracker.google.com/issues/311491887
[xml-declarations]: https://www.w3.org/TR/2006/REC-xml11-20060816/#NT-XMLDecl
[xmlVersion]: https://developer.mozilla.org/en-US/docs/Web/API/Document/xmlVersion
[xmlEncoding]: https://developer.mozilla.org/en-US/docs/Web/API/Document/xmlEncoding
[xmlstandalone]: https://developer.mozilla.org/en-US/docs/Web/API/Document#document.xmlstandalone
[license-image]: https://img.shields.io/npm/l/markdownlint.svg
