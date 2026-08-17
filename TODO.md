# TODOs

## Functional Priorities

- Add dropdown functionality to all nodes with children
- When elements are added (e.g, through script or DevTools),
  children and text should be processed
- Fix duplicate attribute names when adding a second or more attributes
  to an element using DevTool's "Edit as HTML" function
  (possible race condition)
- Add documentation where it's missing or necessary (e.g, @param or @template)
- Finish supporting all applicable node types
  - Character data mutations
  - Nested document nodes:
    - Correlate elements with frames via the [`frameId`][getFrameId]
    - Correlate frames with documents via the [`documentId`][getDocumentId]
      (i.e, if a new page loads, a new document will replace the old in the frame)
    - As a fallback, see: [window.parent][nested-iframes]
  - Shadow roots, see:
    [`chrome.dom.openOrClosedShadowRoot`][openOrClosedShadowRoot]
    and [WhatWG/DOM#1287][shadow-root-observing]

## Technical Priorities

- Write `README.md`
  - How it Works section
    - Source Inspection Flow
- [Encrypt messages][encrypt-msgs]
- Rethink debug view (possibly a test-id field?)
- Conform to a11y standards
  - Add the ability to select and navigate between elements in the inspector
  - Add a light mode toggle
- Add an [error boundary][error-boundary]
  for improved debugging UX. See also: [createRoot options][createRoot]
- Migrate `ChildManager` to a [reducer][reducer] for increased maintainability
- Tell the user when a protected page cannot be inspected
- Adhere to recommended Webpack chunk size limits (see production build output)

## Backlog Priorities

- [Validate][validate-a11y] sample inspector pages
- Configure React source map generation
  (`React.createElement` statements are ugly)
- Integrate pre-commit
- Add tests
- If project scope allows it, add an options page to allow the content script
  to be automatically reinjected on page or tab (re)load

[getFrameId]: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/getFrameId
[getDocumentId]: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/getDocumentId
[nested-iframes]: https://stackoverflow.com/questions/26010355/is-there-a-way-to-uniquely-identify-an-iframe-that-the-content-script-runs-in-fo
[openOrClosedShadowRoot]: https://developer.chrome.com/docs/extensions/reference/api/dom?hl=en#method-openOrClosedShadowRoot
[shadow-root-observing]: https://github.com/whatwg/dom/issues/1287
[encrypt-msgs]: https://github.com/Anonymous-Humanoid/source-inspector/issues/45
[error-boundary]: https://react.dev/link/error-boundaries
[createRoot]: https://react.dev/reference/react-dom/client/createRoot#parameters
[reducer]: https://react.dev/learn/extracting-state-logic-into-a-reducer
[validate-a11y]: https://validator.w3.org
