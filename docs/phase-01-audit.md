# FabricConsumption — Phase 01 Audit

## Scope
Only the repository `MostafizarDev/fabricconsumption` is in scope.

## Current architecture observed
- Single `index.html` containing the tool pages.
- One shared stylesheet at `css/style.css`.
- Individual calculator modules under `js/`.
- `js/utils.js` provides shared DOM/value/PDF/toast helpers.
- `js/app-init.js` wires navigation, calculators, buttons, unit toggles and input listeners.
- No framework dependency is required; the project is browser-native HTML/CSS/JavaScript.

## Existing tools found in the current UI
- Knit Garments
- Knit Pant
- Woven Shirt
- Booking Sheet
- Knit Fabric Price
- Zipper
- Trims
- FOB Costing
- Size Ratio
- Converter
- My Formulas

## Important existing Consumption behavior
The current Knit Garments page already supports optional components:
- Main Body
- Collar
- Cuff
- Pocket
- Half-moon

This behavior is preserved. Phase 02 will make the component model more systematic rather than removing the existing flexibility.

## Phase 01 foundation changes
- Added `css/foundation.css` as a non-destructive design-system layer.
- Added `js/foundation.js` for common foundation behavior.
- Added grouped tool navigation without profession-specific tabs.
- Added responsive sidebar/mobile drawer behavior.
- Added theme persistence using localStorage.
- Added global tool search.
- Added common numeric validation feedback.
- Added a common calculation registry namespace: `window.FC`.
- Added common number formatting and unit constants.
- Added live-calculation orchestration for existing calculator functions.
- Added `docs/formula-master.md` to preserve workbook-based formula assumptions.
- Updated page metadata/title for the new product direction.

## Compatibility approach
Existing calculator files remain in place in Phase 01. Their formulas are not silently rewritten. The new foundation layer sits above the existing modules so Phase 02 can migrate calculations into the common engine one tool at a time and test them against the workbook.

## Known next-step work
Phase 02 will focus on Consumption:
- Knit
- Knit Pant
- Woven
- optional components
- marker method
- panel method
- GSM
- wastage
- shrinkage
- width
- live calculation
- component-level result breakdown

No Phase 02 formula migration is claimed as complete in Phase 01.
