# FabricConsumption Architecture

## UI direction
- Original top navigation is the primary desktop and mobile navigation.
- No permanent sidebar.
- Light theme is the default; dark theme is optional.
- Calculator-first layout: inputs, calculation controls, and result cards stay visually compact.
- Mobile uses a horizontally scrollable sticky tool bar and touch-friendly controls.

## JavaScript structure

```
js/
├── core/
│   ├── app-init.js
│   ├── foundation.js
│   └── utils.js
├── consumption/
│   ├── consumption-engine.js
│   ├── knit-garments.js
│   ├── knit-pant.js
│   └── woven-shirt.js
├── production/
│   ├── booking-sheet.js
│   ├── size-ratio.js
│   ├── trims.js
│   └── zipper.js
├── costing/
│   ├── knit-price.js
│   └── fob.js
└── tools/
    ├── converter.js
    └── my-formulas.js
```

## Product rule
Consumption is the core workflow. Future production and costing modules should reuse shared calculation/data patterns instead of creating role-specific tool areas.

## Mobile rule
Do not build a separate mobile calculator. Keep the same calculation engine and responsive UI so the web app can later share its calculation/data layer with a mobile application.

## Phase 02 safety
The Phase 02 consumption formulas are preserved. This cleanup changes navigation, responsive presentation, and file organization; it does not intentionally change the consumption formulas.
