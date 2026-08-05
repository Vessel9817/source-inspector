# TODOs

## Functional Priorities

- Support [boolean attributes][bool-attrs]
- [Add void element support][void-element-issue]
- Add dropdown functionality to all nodes with children
- When elements are added (e.g, through script or DevTools),
  children and text should be processed
- Fix duplicate attribute names when adding a second or more attributes
  to an element using DevTool's "Edit as HTML" function
  (possible race condition)
- Add documentation where it's missing or necessary (e.g, @param or @template)
- Finish supporting all applicable node types
  - Character data mutations
  - Nested document nodes (see: [SO](https://stackoverflow.com/questions/26010355/is-there-a-way-to-uniquely-identify-an-iframe-that-the-content-script-runs-in-fo))
  - Shadow roots, see:
    [`chrome.dom.openOrClosedShadowRoot`](https://developer.chrome.com/docs/extensions/reference/api/dom?hl=en#method-openOrClosedShadowRoot)
  conform to a11y standards

## Technical Priorities

- Write `README.md`
  - How it Works section
    - Source Inspection Flow
- Add env var validation
- [Encrypt messages](https://github.com/Anonymous-Humanoid/source-inspector/issues/45)
- Rethink debug view (possibly a test-id field?)
- For a11y purposes, add the ability
  to select and navigate between elements in the inspector
- Add an [error boundary](https://react.dev/link/error-boundaries)
  for improved debugging UX. See also:
  [createRoot options](https://react.dev/reference/react-dom/client/createRoot#parameters)
- Migrate ChildManager to a
  [reducer](https://react.dev/learn/extracting-state-logic-into-a-reducer)
  for increased maintainability
- Add a light mode toggle
- Tell the user when a protected page cannot be inspected
- Adhere to recommended Webpack chunk size limits

## Backlog Priorities

- [Validate](https://validator.w3.org) sample inspector pages
- Configure React source map generation
  (`React.createElement` statements are ugly)
- Integrate pre-commit
- Add tests
- If project scope allows it, add an options page to allow the content script
  to be automatically reinjected on page or tab (re)load

[bool-attrs]: https://developer.mozilla.org/en-US/docs/Glossary/Boolean/HTML
[void-element-issue]: https://github.com/Anonymous-Humanoid/source-inspector/issues/44
