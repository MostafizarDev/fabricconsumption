# FabricConsumption — Formula Master
## Phase 01 Reference

This document records the calculation rules currently supported by the project and the source workbook. The uploaded **CONSUMPTION FORMULA.xlsx** is the primary reference for the existing consumption formulas. Existing website behavior is preserved during Phase 01; formula migration/expansion belongs to Phase 02.

## 1. Unit constants

| Unit | Divider / conversion |
|---|---:|
| CM fabric area → kg | 10,000,000 |
| Inch fabric area → kg | 1,550,000 |
| 1 inch | 2.54 cm |
| 1 yard | 0.9144 m |
| 1 dozen | 12 pcs |
| 1 ligne | 0.635 mm |

## 2. Consumption workbook formulas

### T-Shirt Fabric Consumption — CM
Source worksheet: **Consumption**

`(((BodyLength + BodyAllowance) + (SleeveLength + SleeveAllowance)) × (HalfChest + ChestAllowance) × 2 × GSM × Qty) / 10,000,000 × (1 + Wastage)`

Workbook example formula:
`=(((D3+D4+12)*(D5+6)*2*D6*D7)/10000000)*(1+D8)`

### T-Shirt Fabric Consumption — Inch
`(((BodyLength + BodyAllowance) + (SleeveLength + SleeveAllowance)) × (HalfChest + ChestAllowance) × 2 × GSM × Qty) / 1,550,000 × (1 + Wastage)`

### Polo / Collar — CM
`((CollarLength × (CollarWidth + allowance) × GSM × Qty) / 10,000,000) × (1 + Wastage)`

Workbook example:
`=((G3*(G4+3)*G5*G6/10000000)*(1+G7))`

### Cuff — CM
`((CuffLength + allowance) × (CuffWidth + allowance) × GSM × Qty) / 10,000,000 × (1 + Wastage)`

Workbook example:
`=((J3+4)*(J4+2)*J5*J6/10000000)*(1+J7)`

### T-Shirt Fabric Consumption — Inch
`(((BodyLength + allowance) × (SleeveLength + allowance) × 2 × (HalfChest + allowance) × GSM × Qty) / 1,550,000) × (1 + Wastage)`

Workbook example:
`=(((D15+D16+12)*(D17+6)*2*D18*D19)/1550000)*(1+D20)`

### Collar / Pocket style calculation — Inch
`((Length + allowance) × (Width + allowance) × GSM × Qty) / 1,550,000 × (1 + Wastage)`

Workbook example:
`=((G15+3)*(G16+3)*G17*G18/1550000)*(1+G19)`

### Cuff — Inch
`((CuffLength + allowance) × (CuffWidth + allowance) × GSM × Qty) / 1,550,000 × (1 + Wastage)`

Workbook example:
`=((J15+4)*(J16+2)*J17*J18/1550000)*(1+J19)`

### Pant Fabric Consumption — Inch
`(((InseamLength + FrontRise + WaistbandHeight + allowances) × (HalfThigh + allowance) × 4 × GSM × Qty) / 1,550,000) × (1 + Wastage)`

Workbook example:
`=((D27+D28+6)+D29+3)*(D30+3)*4*D31*D32/1550000*(1+D33)`

### Pant Fabric Consumption — CM
`(((InseamLength + FrontRise + WaistbandHeight + allowances) × (HalfThigh + allowance) × 4 × GSM × Qty) / 10,000,000) × (1 + Wastage)`

Workbook example:
`=((D39+D40+6)+D41+3)*(D42+3)*4*D43*D44/10000000*(1+D45)`

### Dia-based consumption
Workbook example:
`PER PCS = Dia × Length × GSM / 1,550,000 / Quantity`

Workbook example:
`PER DOZEN = PerPiece × 12 × (1 + Wastage)`

> Important: the workbook contains practical fixed allowances inside some example formulas (for example +12, +6, +3, +4, +2). These values must not be silently generalized or removed. Phase 02 will expose/structure allowance inputs only after the workbook and current website behavior are reconciled.

## 3. Converter workbook formulas

- Inch → CM: `inch × 2.54`
- CM → Inch: `cm / 2.54`
- Meter → Yard: `meter / 0.9144`
- Yard → Meter: `yard × 0.9144`
- Meter → KG: `meter × width × GSM / 1000`
- KG → Meter: `(kg × 1000) / (GSM × width)`
- Ligne: `mm / 0.635`

## 4. Booking Sheet formulas

The workbook's booking section uses marker dimensions, allowances, GSM and pieces per marker.

### Net marker kg
`=(MarkerLength + CuttingAllowanceLength) × (MarkerWidth + CuttingAllowanceWidth) × GSM / 1550 / 1000`

### Net consumption per dozen
`=(MarkerLength + CuttingAllowanceLength) × (MarkerWidth + CuttingAllowanceWidth) × GSM × 12 / 1550 / 1000 / PiecesPerMarker`

### Final consumption after fabric/cutting %
`=NetConsumptionPerDozen + (NetConsumptionPerDozen × FabricCuttingPercent)`

## 5. Knit Fabric Price

The workbook contains:
- Fabric Weight (kg)
- GSM
- Fabric Width (meter)
- Price per kg
- Fabric Length (meter)
- Price of 1 meter

Workbook formulas:
- Fabric Length: `=ROUND((WeightKg × 1000) / GSM × WidthMeter, 2)`
- Price per meter: `=(FabricLength × WeightKg) / PricePerKg`

## 6. Design rule for Phase 02

Consumption is **component-based and optional**.

A garment may have:
- Body
- Sleeve
- Collar
- Cuff
- Pocket
- Half-moon
- Pant / other components

A component that is not present in the garment must not participate in the total calculation.

The existing website already follows this optional-component idea for Knit Garments; Phase 02 will make it more systematic without losing the existing capability.

## 7. Validation rule

Phase 01 introduces common input validation and formatting, but does not silently change the workbook's mathematical assumptions. Any formula that conflicts between workbook and current website will be explicitly reconciled before Phase 02 migration.
