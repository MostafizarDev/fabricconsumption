# Phase 02 — Consumption

## Scope
Consumption is the core product area. The rebuild keeps the existing workbook/body-block calculations as the Basic method and adds explicit Marker and Panel/Pattern Area methods.

## Basic — Knit
Existing project formula is preserved:
- CM divider: 10,000,000
- Inch divider: 1,550,000
- Body uses body length + allowance, sleeve length + allowance when Sleeve is enabled, half chest + allowance, ×2, GSM.
- Optional components: Collar, Cuff, Pocket, Half-moon.
- Wastage is applied to the combined consumption.
- Quantity controls total order kg; per-dozen and per-piece remain visible.

Phase 02 additionally supports optional shrinkage as an allowance factor. The value is zero by default so existing calculations are unchanged unless the user enters shrinkage.

## Component model
The garment is not assumed to have every component. Sleeve, collar, cuff, pocket and half-moon can be present or absent. The total is the sum of only selected components.

## Marker method — Knit/Pant
Inputs: marker length, usable marker width, garments in marker, GSM, shrinkage allowance, cutting/marker wastage, order quantity.
The marker method uses marker area and garments-per-marker to estimate kg per garment/dozen. It is intended for production-marker data.

## Panel method — Knit/Pant
Knit panel method: panel length, panel width, panel quantity, panel GSM, wastage, shrinkage allowance.
Panel area is summed first, then converted to fabric weight using GSM. Separate GSM per panel allows body fabric, rib and contrast components to be represented without forcing one GSM across the garment.
For pant, the panel-area mode accepts total panel area per garment when the detailed panel list is not available.

## Pattern-area method — Woven
Inputs: pattern area per garment, usable/cuttable width, expected marker efficiency, allowance, shrinkage allowance, order quantity.
This is an estimate before a final CAD marker. The final marker should take precedence for production booking.

## Woven marker method
Inputs: marker length in metres, garments in marker, end-loss/allowance, shrinkage allowance, order quantity.
Outputs: consumption per piece in metres/yards, per dozen, and total order quantity.

## Shrinkage
Shrinkage is treated as an optional consumption allowance in this phase. Actual fabric dimensional change should be based on test data, and length/width shrinkage can differ. Pattern compensation is a separate concept from a generic consumption allowance.

## Width
Usable/cuttable width is exposed in marker and pattern-area methods. Full roll width should not be substituted blindly for cuttable width.

## GSM
The existing Converter already contains GSM-related tools. Consumption methods use finished fabric GSM as the weight input.

## Validation
The Phase 02 engine continues to use common Phase 01 validation and live calculation. Empty/incomplete inputs return a clear dash rather than silently presenting a false zero.

## Reference basis
The method design was checked against the project's CONSUMPTION FORMULA.xlsx, the project's existing consumption JavaScript/UI, TextileNotes woven marker and pattern-area consumption, TextileNotes knit panel consumption, Textile School compounded allowance model, and TextileNotes shrinkage/dimensional-change guidance.
External references are guidance for the new methods; they do not replace the project's existing Excel formulas.