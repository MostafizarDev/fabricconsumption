// ============================================
// CONVERTER.JS - Complete Garments Industry Unit Converter
// Includes: Length, Weight, Area, Temperature, Fabric, Button, Yarn Count, etc.
// ============================================

// ========== INITIALIZE ALL CONVERTERS ==========
function initConverters() {
    // 1. LENGTH CONVERTERS
    initLengthConverters();
    
    // 2. WEIGHT CONVERTERS
    initWeightConverters();
    
    // 3. FABRIC SPECIFIC CONVERTERS
    initFabricConverters();
    
    // 4. GSM & FABRIC WEIGHT CONVERTERS
    initGSMConverters();
    
    // 5. BUTTON & ACCESSORIES CONVERTERS
    initButtonConverters();
    
    // 6. YARN COUNT CONVERTERS (Tex, Denier, Ne, Nm)
    initYarnCountConverters();
    
    // 7. TEMPERATURE CONVERTERS (Celsius ↔ Fahrenheit)
    initTemperatureConverters();
    
    // 8. FABRIC CONSUMPTION CONVERTERS
    initFabricConsumptionConverters();
    
    // 9. SEWING THREAD CONVERTERS
    initThreadConverters();
    
    // 10. SPEED & PRODUCTION CONVERTERS
    initProductionConverters();
}

// ========== 1. LENGTH CONVERTERS ==========
function initLengthConverters() {
    // CM ↔ Inch
    const cmInput = el('cv-cm');
    const inchInput = el('cv-inch');
    if (cmInput && inchInput) {
        cmInput.addEventListener('input', () => {
            inchInput.value = (cmInput.value / 2.54).toFixed(3);
        });
        inchInput.addEventListener('input', () => {
            cmInput.value = (inchInput.value * 2.54).toFixed(3);
        });
    }
    
    // Meter ↔ Yard
    const meterInput = el('cv-m');
    const yardInput = el('cv-yd');
    if (meterInput && yardInput) {
        meterInput.addEventListener('input', () => {
            yardInput.value = (meterInput.value * 1.09361).toFixed(3);
        });
        yardInput.addEventListener('input', () => {
            meterInput.value = (yardInput.value / 1.09361).toFixed(3);
        });
    }
    
    // Meter ↔ Feet
    const meterFeetInput = el('cv-m-ft');
    const feetInput = el('cv-ft');
    if (meterFeetInput && feetInput) {
        meterFeetInput.addEventListener('input', () => {
            feetInput.value = (meterFeetInput.value * 3.28084).toFixed(3);
        });
        feetInput.addEventListener('input', () => {
            meterFeetInput.value = (feetInput.value / 3.28084).toFixed(3);
        });
    }
    
    // Inch ↔ Centimeter (additional)
    const inchCmInput = el('cv-inch-cm');
    const cmInchInput = el('cv-cm-inch');
    if (inchCmInput && cmInchInput) {
        inchCmInput.addEventListener('input', () => {
            cmInchInput.value = (inchCmInput.value * 2.54).toFixed(2);
        });
        cmInchInput.addEventListener('input', () => {
            inchCmInput.value = (cmInchInput.value / 2.54).toFixed(2);
        });
    }
}

// ========== 2. WEIGHT CONVERTERS ==========
function initWeightConverters() {
    // KG ↔ Gram
    const kgInput = el('cv-kg-g');
    const gramInput = el('cv-g');
    if (kgInput && gramInput) {
        kgInput.addEventListener('input', () => {
            gramInput.value = (kgInput.value * 1000).toFixed(0);
        });
        gramInput.addEventListener('input', () => {
            kgInput.value = (gramInput.value / 1000).toFixed(3);
        });
    }
    
    // KG ↔ Pound (lb)
    const kgLbInput = el('cv-kg-lb');
    const lbInput = el('cv-lb');
    if (kgLbInput && lbInput) {
        kgLbInput.addEventListener('input', () => {
            lbInput.value = (kgLbInput.value * 2.20462).toFixed(3);
        });
        lbInput.addEventListener('input', () => {
            kgLbInput.value = (lbInput.value / 2.20462).toFixed(3);
        });
    }
    
    // Pound ↔ Ounce
    const lbOzInput = el('cv-lb-oz');
    const ozLbInput = el('cv-oz-lb');
    if (lbOzInput && ozLbInput) {
        lbOzInput.addEventListener('input', () => {
            ozLbInput.value = (lbOzInput.value * 16).toFixed(2);
        });
        ozLbInput.addEventListener('input', () => {
            lbOzInput.value = (ozLbInput.value / 16).toFixed(3);
        });
    }
}

// ========== 3. FABRIC SPECIFIC CONVERTERS ==========
function initFabricConverters() {
    // kg to Meter (Fabric) - Main
    const kgInput = el('cv-kg');
    const gsm2Input = el('cv-gsm2');
    const widInput = el('cv-wid');
    if (kgInput && gsm2Input && widInput) {
        [kgInput, gsm2Input, widInput].forEach(inp => {
            inp.addEventListener('input', calcKgToMeter);
        });
    }
    
    // Meter to kg (Fabric) - Reverse
    const meterInput = el('cv-m-kg');
    const gsmMeterInput = el('cv-gsm-m');
    const widthMeterInput = el('cv-width-m');
    if (meterInput && gsmMeterInput && widthMeterInput) {
        [meterInput, gsmMeterInput, widthMeterInput].forEach(inp => {
            inp.addEventListener('input', calcMeterToKg);
        });
    }
    
    // Yard to kg (Fabric)
    const yardKgInput = el('cv-yd-kg');
    const gsmYdInput = el('cv-gsm-yd');
    const widthYdInput = el('cv-width-yd');
    if (yardKgInput && gsmYdInput && widthYdInput) {
        [yardKgInput, gsmYdInput, widthYdInput].forEach(inp => {
            inp.addEventListener('input', calcYardToKg);
        });
    }
}

function calcKgToMeter() {
    const kg = v('cv-kg');
    const gsm = v('cv-gsm2');
    const width = v('cv-wid');
    
    if (gsm && width && kg && gsm > 0 && width > 0) {
        const meter = (kg * 1000) / (gsm * width);
        set('cv-kg-res', meter.toFixed(2) + ' m');
        set('cv-kg-res-yd', (meter * 1.09361).toFixed(2) + ' yd');
    } else {
        set('cv-kg-res', '—');
        set('cv-kg-res-yd', '—');
    }
}

function calcMeterToKg() {
    const meter = v('cv-m-kg');
    const gsm = v('cv-gsm-m');
    const width = v('cv-width-m');
    
    if (gsm && width && meter && gsm > 0 && width > 0) {
        const kg = (meter * gsm * width) / 1000;
        set('cv-m-kg-res', kg.toFixed(3) + ' kg');
    } else {
        set('cv-m-kg-res', '—');
    }
}

function calcYardToKg() {
    const yard = v('cv-yd-kg');
    const gsm = v('cv-gsm-yd');
    const width = v('cv-width-yd');
    
    if (gsm && width && yard && gsm > 0 && width > 0) {
        // Convert yard to meter first
        const meter = yard * 0.9144;
        const kg = (meter * gsm * width) / 1000;
        set('cv-yd-kg-res', kg.toFixed(3) + ' kg');
    } else {
        set('cv-yd-kg-res', '—');
    }
}

// ========== 4. GSM & FABRIC WEIGHT CONVERTERS ==========
function initGSMConverters() {
    // GSM ↔ OZ/yd²
    const gsmInput = el('cv-gsm');
    const ozInput = el('cv-oz');
    if (gsmInput && ozInput) {
        gsmInput.addEventListener('input', () => {
            ozInput.value = (gsmInput.value / 33.9057).toFixed(3);
        });
        ozInput.addEventListener('input', () => {
            gsmInput.value = (ozInput.value * 33.9057).toFixed(2);
        });
    }
    
    // GSM ↔ kg/yard
    const gsmKgYdInput = el('cv-gsm-kgyd');
    const kgYdInput = el('cv-kgyd');
    const widthKgYd = el('cv-width-kgyd');
    if (gsmKgYdInput && kgYdInput && widthKgYd) {
        gsmKgYdInput.addEventListener('input', () => {
            const width = parseFloat(widthKgYd.value) || 1;
            const kgPerYd = (gsmKgYdInput.value * width * 0.9144) / 1000;
            kgYdInput.value = kgPerYd.toFixed(4);
        });
        kgYdInput.addEventListener('input', () => {
            const width = parseFloat(widthKgYd.value) || 1;
            const gsm = (kgYdInput.value * 1000) / (width * 0.9144);
            gsmKgYdInput.value = gsm.toFixed(0);
        });
    }
    
    // OZ/yd² ↔ kg/yard
    const ozKgYdInput = el('cv-oz-kgyd');
    const kgYdOzInput = el('cv-kgyd-oz');
    const widthOzYd = el('cv-width-ozyd');
    if (ozKgYdInput && kgYdOzInput && widthOzYd) {
        ozKgYdInput.addEventListener('input', () => {
            const width = parseFloat(widthOzYd.value) || 1;
            const gsm = ozKgYdInput.value * 33.9057;
            const kgPerYd = (gsm * width * 0.9144) / 1000;
            kgYdOzInput.value = kgPerYd.toFixed(4);
        });
    }
}

// ========== 5. BUTTON & ACCESSORIES CONVERTERS ==========
function initButtonConverters() {
    // mm ↔ Ligne (Button)
    const mmInput = el('cv-btmm');
    if (mmInput) {
        mmInput.addEventListener('input', () => {
            const ligne = mmInput.value / 0.635;
            set('cv-btln', ligne.toFixed(1) + ' L');
        });
    }
    
    // Ligne ↔ mm (Reverse)
    const ligneInput = el('cv-btln-in');
    if (ligneInput) {
        ligneInput.addEventListener('input', () => {
            const mm = ligneInput.value * 0.635;
            set('cv-btmm-out', mm.toFixed(2) + ' mm');
        });
    }
    
    // Button Size Chart (Common sizes)
    updateButtonSizeChart();
}

function updateButtonSizeChart() {
    const commonSizes = [
        { ligne: 14, mm: 8.9, name: 'Shirt Button' },
        { ligne: 16, mm: 10.2, name: 'Shirt Button' },
        { ligne: 18, mm: 11.4, name: 'Shirt/Pant Button' },
        { ligne: 20, mm: 12.7, name: 'Pant Button' },
        { ligne: 22, mm: 14.0, name: 'Jacket Button' },
        { ligne: 24, mm: 15.2, name: 'Jacket/ Coat Button' },
        { ligne: 28, mm: 17.8, name: 'Winter Coat Button' },
        { ligne: 32, mm: 20.3, name: 'Heavy Coat Button' },
        { ligne: 36, mm: 22.9, name: 'Blazer Button' },
        { ligne: 40, mm: 25.4, name: 'Overcoat Button' }
    ];
    
    const chartContainer = el('button-chart');
    if (chartContainer) {
        let html = '<table style="width:100%; font-size:11px; border-collapse:collapse">';
        html += '<tr style="background:#f8fafc"><th>Ligne (L)</th><th>mm</th><th>Common Use</th></tr>';
        commonSizes.forEach(size => {
            html += `<tr><td>${size.ligne} L</td><td>${size.mm} mm</td><td>${size.name}</td></tr>`;
        });
        html += '</table>';
        chartContainer.innerHTML = html;
    }
}

// ========== 6. YARN COUNT CONVERTERS ==========
function initYarnCountConverters() {
    // Tex ↔ Denier
    const texInput = el('cv-tex');
    const denierInput = el('cv-denier');
    if (texInput && denierInput) {
        texInput.addEventListener('input', () => {
            denierInput.value = (texInput.value * 9).toFixed(1);
        });
        denierInput.addEventListener('input', () => {
            texInput.value = (denierInput.value / 9).toFixed(1);
        });
    }
    
    // Ne (Cotton Count) ↔ Tex
    const neInput = el('cv-ne');
    const texNeInput = el('cv-tex-ne');
    if (neInput && texNeInput) {
        neInput.addEventListener('input', () => {
            if (neInput.value > 0) {
                texNeInput.value = (590.5 / neInput.value).toFixed(1);
            } else {
                texNeInput.value = '';
            }
        });
        texNeInput.addEventListener('input', () => {
            if (texNeInput.value > 0) {
                neInput.value = (590.5 / texNeInput.value).toFixed(1);
            } else {
                neInput.value = '';
            }
        });
    }
    
    // Nm (Metric Count) ↔ Tex
    const nmInput = el('cv-nm');
    const texNmInput = el('cv-tex-nm');
    if (nmInput && texNmInput) {
        nmInput.addEventListener('input', () => {
            if (nmInput.value > 0) {
                texNmInput.value = (1000 / nmInput.value).toFixed(1);
            } else {
                texNmInput.value = '';
            }
        });
        texNmInput.addEventListener('input', () => {
            if (texNmInput.value > 0) {
                nmInput.value = (1000 / texNmInput.value).toFixed(1);
            } else {
                nmInput.value = '';
            }
        });
    }
    
    // Denier ↔ Ne
    const denierNeInput = el('cv-denier-ne');
    const neDenierInput = el('cv-ne-denier');
    if (denierNeInput && neDenierInput) {
        denierNeInput.addEventListener('input', () => {
            if (denierNeInput.value > 0) {
                neDenierInput.value = (5315 / denierNeInput.value).toFixed(1);
            }
        });
        neDenierInput.addEventListener('input', () => {
            if (neDenierInput.value > 0) {
                denierNeInput.value = (5315 / neDenierInput.value).toFixed(0);
            }
        });
    }
}

// ========== 7. TEMPERATURE CONVERTERS ==========
function initTemperatureConverters() {
    // Celsius ↔ Fahrenheit
    const celsiusInput = el('cv-celsius');
    const fahrenheitInput = el('cv-fahrenheit');
    if (celsiusInput && fahrenheitInput) {
        celsiusInput.addEventListener('input', () => {
            fahrenheitInput.value = (celsiusInput.value * 9/5 + 32).toFixed(1);
        });
        fahrenheitInput.addEventListener('input', () => {
            celsiusInput.value = ((fahrenheitInput.value - 32) * 5/9).toFixed(1);
        });
    }
}

// ========== 8. FABRIC CONSUMPTION CONVERTERS ==========
function initFabricConsumptionConverters() {
    // kg/dz ↔ kg/pc
    const kgDzInput = el('cv-kgdz');
    const kgPcInput = el('cv-kgpc');
    if (kgDzInput && kgPcInput) {
        kgDzInput.addEventListener('input', () => {
            kgPcInput.value = (kgDzInput.value / 12).toFixed(4);
        });
        kgPcInput.addEventListener('input', () => {
            kgDzInput.value = (kgPcInput.value * 12).toFixed(3);
        });
    }
    
    // yards/dz ↔ yards/pc
    const ydsDzInput = el('cv-ydsdz');
    const ydsPcInput = el('cv-ydspc');
    if (ydsDzInput && ydsPcInput) {
        ydsDzInput.addEventListener('input', () => {
            ydsPcInput.value = (ydsDzInput.value / 12).toFixed(4);
        });
        ydsPcInput.addEventListener('input', () => {
            ydsDzInput.value = (ydsPcInput.value * 12).toFixed(3);
        });
    }
}

// ========== 9. SEWING THREAD CONVERTERS ==========
function initThreadConverters() {
    // Thread Count (meters) ↔ Cone Weight
    const threadMeterInput = el('cv-thread-m');
    const threadKgInput = el('cv-thread-kg');
    const threadCountInput = el('cv-thread-count');
    
    if (threadMeterInput && threadKgInput && threadCountInput) {
        threadMeterInput.addEventListener('input', () => {
            const count = parseFloat(threadCountInput.value) || 40;
            // Thread consumption calculation
            if (threadMeterInput.value > 0) {
                const kg = threadMeterInput.value / (count * 1000);
                threadKgInput.value = kg.toFixed(3);
            }
        });
        threadKgInput.addEventListener('input', () => {
            const count = parseFloat(threadCountInput.value) || 40;
            if (threadKgInput.value > 0) {
                const meters = threadKgInput.value * count * 1000;
                threadMeterInput.value = meters.toFixed(0);
            }
        });
    }
}

// ========== 10. SPEED & PRODUCTION CONVERTERS ==========
function initProductionConverters() {
    // RPM ↔ SPO (Stitches Per Minute)
    const rpmInput = el('cv-rpm');
    const spoInput = el('cv-spo');
    if (rpmInput && spoInput) {
        rpmInput.addEventListener('input', () => {
            spoInput.value = (rpmInput.value * 1).toFixed(0);
        });
        spoInput.addEventListener('input', () => {
            rpmInput.value = (spoInput.value * 1).toFixed(0);
        });
    }
    
    // Machine Speed (cm/s) ↔ m/min
    const cmpsInput = el('cv-cmps');
    const mpminInput = el('cv-mpmin');
    if (cmpsInput && mpminInput) {
        cmpsInput.addEventListener('input', () => {
            mpminInput.value = (cmpsInput.value * 0.6).toFixed(2);
        });
        mpminInput.addEventListener('input', () => {
            cmpsInput.value = (mpminInput.value / 0.6).toFixed(2);
        });
    }
}

// ========== HELPER FUNCTIONS ==========
function v(id) {
    return parseFloat(document.getElementById(id)?.value) || 0;
}

function set(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function el(id) {
    return document.getElementById(id);
}

// ========== EXPORT FUNCTIONS ==========
window.calcKgToMeter = calcKgToMeter;
window.calcMeterToKg = calcMeterToKg;
window.calcYardToKg = calcYardToKg;
