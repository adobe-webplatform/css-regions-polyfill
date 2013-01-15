CSS Regions Polyfill Feature Support
=====

A lot of effort was put into building the current polyfill to support the basic use cases for CSS Regions.
Some features require refinement, others are not yet implemented.

The CSS Regions polyfill is meant to illustrate the functionality of CSS Regions in browsers that don't yet support
them. Keep in mind that the polyfill cannot match the peformance or the full scope of features natively
implemented in the browser.

Your feedback, suggestions and contributions are welcome.


What works
---
- CSS `flow-into` and `flow-from` properties;
- CSS Object Model:
  - `document.getNamedFlows()`;
  - `NamedFlow` interface;
  - `NamedFlow.overset` property;
  - `NamedFlow.firstEmptyRegionIndex` property;
  - `NamedFlow.getRegions()` method;
  - `NamedFlow.getContent()` method;
  - `regionlayoutupdate` event on `NamedFlow`;
  - `Region.regionOverset` property;
- content reflow due to viewport resize;

What kind of works:
---
- CSS Object Model:
    - `NamedFlow.getRegionsByContent()`;
    This is almost next to impossible to implement it correctly for all possible scenarios in JavaScript. The current
    implementation might work for some use cases and not for others.

What doesn't work
---
- content reflow due to media queries;
- content reflow due to DOM changes;
- content reflow due to viewport orientation change;
- nested named flows;
- loading styles from cross-domain linked stylesheets;
- CSS `region-break-*` properties;
- CSS `region-overset` property;
- CSS region styling with `@region`;
- CSS Object Model:
  - `Region.getRegionFlowRanges()` method;
  - `Region.getComputedRegionStyle()` method;
