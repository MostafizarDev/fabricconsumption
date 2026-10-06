// ============================================
// APP-INIT.JS - Initialize All Calculations & Event Listeners
// This file handles the main app startup and global functions
// ============================================

// ========== INITIALIZE APP ==========
function initApp() {
    console.log('🚀 Fabrics Consumption App Initialized');
    
    // Set default units
    if (typeof setKnitUnit === 'function') {
        setKnitUnit('cm');
    }
    if (typeof setPantUnit === 'function') {
        setPantUnit('cm');
    }
    
    // Initialize all calculations
    runAllCalculations();
    
    // Setup tab navigation
    setupTabNavigation();
    
    // Setup input listeners for all pages
    setupGlobalInputListeners();
    
    // Setup calculate buttons
    setupCalculateButtons();
    
    // Setup PDF buttons
    setupPdfButtons();
    
    // Setup unit toggle buttons
    setupUnitButtons();
}

// Run all calculations on page load
function runAllCalculations() {
    // Knit Garments
    if (typeof calcKnitGarments === 'function') {
        calcKnitGarments();
    }
    
    // Knit Pant
    if (typeof calcKnitPant === 'function') {
        calcKnitPant();
    }
    
    // Woven Shirt
    if (typeof calcWoven === 'function') {
        calcWoven();
    }
    
    // Booking Sheet
    if (typeof calcBooking === 'function') {
        calcBooking();
    }
    if (typeof calculateAllBookingRows === 'function') {
        calculateAllBookingRows();
    }
    
    // Knit Price
    if (typeof calcKnitPrice === 'function') {
        calcKnitPrice();
    }
    
    // Zipper
    if (typeof calcZipper === 'function') {
        calcZipper();
    }
    
    // Trims
    if (typeof calcThread === 'function') {
        calcThread();
    }
    if (typeof calcButton === 'function') {
        calcButton();
    }
    if (typeof calcInterlining === 'function') {
        calcInterlining();
    }
    
    // FOB
    if (typeof calcFOB === 'function') {
        calcFOB();
    }
    
    // Size Ratio
    if (typeof calcSizeRatio === 'function') {
        calcSizeRatio();
    }
    
    // Converter
    if (typeof calcKgToMeter === 'function') {
        calcKgToMeter();
    }
    
    // My Formulas
    if (typeof loadMyFormulas === 'function') {
        loadMyFormulas();
    }
}

// Setup tab navigation
function setupTabNavigation() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
            const pageId = this.getAttribute('data-page');
            if (pageId && typeof showPage === 'function') {
                showPage(pageId, this);
            }
        });
    });
}

// Setup calculate buttons for all pages
function setupCalculateButtons() {
    // Knit Garments
    const knitCalcBtn = document.getElementById('btn-calc-knit');
    if (knitCalcBtn && typeof calcKnitGarments === 'function') {
        knitCalcBtn.addEventListener('click', calcKnitGarments);
    }
    
    // Knit Pant
    const pantCalcBtn = document.getElementById('btn-calc-knitpant');
    if (pantCalcBtn && typeof calcKnitPant === 'function') {
        pantCalcBtn.addEventListener('click', calcKnitPant);
    }
    
    // Woven Shirt
    const wovenCalcBtn = document.getElementById('btn-calc-woven');
    if (wovenCalcBtn && typeof calcWoven === 'function') {
        wovenCalcBtn.addEventListener('click', calcWoven);
    }
    
    // Booking Sheet
    const bookingCalcBtn = document.getElementById('btn-calc-booking');
    if (bookingCalcBtn && typeof calcBooking === 'function') {
        bookingCalcBtn.addEventListener('click', calcBooking);
    }
    
    // Knit Price
    const priceCalcBtn = document.getElementById('btn-calc-knitprice');
    if (priceCalcBtn && typeof calcKnitPrice === 'function') {
        priceCalcBtn.addEventListener('click', calcKnitPrice);
    }
    
    // Zipper
    const zipperCalcBtn = document.getElementById('btn-calc-zipper');
    if (zipperCalcBtn && typeof calcZipper === 'function') {
        zipperCalcBtn.addEventListener('click', calcZipper);
    }
    
    // Thread
    const threadCalcBtn = document.getElementById('btn-calc-thread');
    if (threadCalcBtn && typeof calcThread === 'function') {
        threadCalcBtn.addEventListener('click', calcThread);
    }
    
    // Button
    const buttonCalcBtn = document.getElementById('btn-calc-button');
    if (buttonCalcBtn && typeof calcButton === 'function') {
        buttonCalcBtn.addEventListener('click', calcButton);
    }
    
    // Interlining
    const interliningCalcBtn = document.getElementById('btn-calc-interlining');
    if (interliningCalcBtn && typeof calcInterlining === 'function') {
        interliningCalcBtn.addEventListener('click', calcInterlining);
    }
    
    // FOB
    const fobCalcBtn = document.getElementById('btn-calc-fob');
    if (fobCalcBtn && typeof calcFOB === 'function') {
        fobCalcBtn.addEventListener('click', calcFOB);
    }
    
    // Size Ratio
    const ratioCalcBtn = document.getElementById('btn-calc-sizeratio');
    if (ratioCalcBtn && typeof calcSizeRatio === 'function') {
        ratioCalcBtn.addEventListener('click', calcSizeRatio);
    }
}

// Setup PDF download buttons
function setupPdfButtons() {
    const knitPdfBtn = document.getElementById('btn-pdf-knit');
    if (knitPdfBtn && typeof downloadKnitReport === 'function') {
        knitPdfBtn.addEventListener('click', downloadKnitReport);
    }
    
    const pantPdfBtn = document.getElementById('btn-pdf-knitpant');
    if (pantPdfBtn && typeof downloadKnitPantReport === 'function') {
        pantPdfBtn.addEventListener('click', downloadKnitPantReport);
    }
    
    const wovenPdfBtn = document.getElementById('btn-pdf-woven');
    if (wovenPdfBtn && typeof downloadWovenReport === 'function') {
        wovenPdfBtn.addEventListener('click', downloadWovenReport);
    }
    
    const bookingPdfBtn = document.getElementById('btn-pdf-booking');
    if (bookingPdfBtn && typeof downloadBookingReport === 'function') {
        bookingPdfBtn.addEventListener('click', downloadBookingReport);
    }
    
    const pricePdfBtn = document.getElementById('btn-pdf-knitprice');
    if (pricePdfBtn && typeof downloadKnitPriceReport === 'function') {
        pricePdfBtn.addEventListener('click', downloadKnitPriceReport);
    }
    
    const zipperPdfBtn = document.getElementById('btn-pdf-zipper');
    if (zipperPdfBtn && typeof downloadZipperReport === 'function') {
        zipperPdfBtn.addEventListener('click', downloadZipperReport);
    }
    
    const fobPdfBtn = document.getElementById('btn-pdf-fob');
    if (fobPdfBtn && typeof downloadFOBReport === 'function') {
        fobPdfBtn.addEventListener('click', downloadFOBReport);
    }
}

// Setup unit toggle buttons
function setupUnitButtons() {
    // Knit Garments unit buttons
    const knitUnitBtns = document.querySelectorAll('#page-knit .unit-bar .u-btn');
    knitUnitBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const unit = this.getAttribute('data-unit');
            if (unit && typeof setKnitUnit === 'function') {
                setKnitUnit(unit);
                knitUnitBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                if (typeof updateKnitTotals === 'function') updateKnitTotals();
                if (typeof calcKnitGarments === 'function') calcKnitGarments();
            }
        });
    });
    
    // Knit Pant unit buttons
    const pantUnitBtns = document.querySelectorAll('#page-knitpant .unit-bar .u-btn');
    pantUnitBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const unit = this.getAttribute('data-unit');
            if (unit && typeof setPantUnit === 'function') {
                setPantUnit(unit);
                pantUnitBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                if (typeof updatePantTotals === 'function') updatePantTotals();
                if (typeof calcKnitPant === 'function') calcKnitPant();
            }
        });
    });
}

// Setup global input listeners for real-time updates
function setupGlobalInputListeners() {
    // Knit Garments inputs
    setupKnitGarmentsListeners();
    
    // Knit Pant inputs
    setupKnitPantListeners();
    
    // Woven Shirt inputs
    setupWovenListeners();
    
    // Booking Sheet inputs
    setupBookingListeners();
    
    // Knit Price inputs
    setupKnitPriceListeners();
    
    // Zipper inputs
    setupZipperListeners();
    
    // Trims inputs
    setupTrimsListeners();
    
    // FOB inputs
    setupFOBListeners();
    
    // Size Ratio inputs
    setupSizeRatioListeners();
}

function setupKnitGarmentsListeners() {
    const knitInputs = [
        'kg-bl', 'kg-bla', 'kg-sl', 'kg-sla', 'kg-hc', 'kg-hca', 'kg-bgsm',
        'kg-cl', 'kg-cla', 'kg-cw', 'kg-cwa', 'kg-cgsm',
        'kg-cul', 'kg-cula', 'kg-cuw', 'kg-cuwa', 'kg-cugsm',
        'kg-pl', 'kg-pla', 'kg-pw', 'kg-pwa', 'kg-pgsm', 'kg-pqty',
        'kg-hml', 'kg-hmla', 'kg-hmw', 'kg-hmwa', 'kg-hmgsm',
        'kg-waste', 'kg-qty'
    ];
    
    knitInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', function() {
                if (typeof updateKnitTotals === 'function') updateKnitTotals();
            });
        }
    });
    
    // Checkbox listeners
    const checkboxes = ['ck-collar', 'ck-cuff', 'ck-pocket', 'ck-halfmoon'];
    checkboxes.forEach(id => {
        const cb = document.getElementById(id);
        if (cb) {
            cb.addEventListener('change', function() {
                if (typeof toggleOptPanels === 'function') toggleOptPanels();
            });
        }
    });
}

function setupKnitPantListeners() {
    const pantInputs = ['kp-il', 'kp-ila', 'kp-cfr', 'kp-cfra', 'kp-wbw', 'kp-wbwa', 'kp-htc', 'kp-htca', 'kp-gsm', 'kp-waste'];
    pantInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', function() {
                if (typeof updatePantTotals === 'function') updatePantTotals();
            });
        }
    });
}

function setupWovenListeners() {
    const wovenInputs = ['ws-bl', 'ws-bla', 'ws-hc', 'ws-hca', 'ws-sl', 'ws-sla', 'ws-ah', 'ws-aha', 'ws-fw'];
    wovenInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', function() {
                if (typeof updateWovenTotals === 'function') updateWovenTotals();
            });
        }
    });
}

function setupBookingListeners() {
    const bookingInputs = ['bs-ml', 'bs-cla', 'bs-mw', 'bs-cwa', 'bs-gsm', 'bs-pcs', 'bs-cwp'];
    bookingInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', function() {
                if (typeof updateBooking === 'function') updateBooking();
            });
        }
    });
}

function setupKnitPriceListeners() {
    const priceInputs = ['kfp-w', 'kfp-gsm', 'kfp-wid', 'kfp-pkg'];
    priceInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', function() {
                if (typeof updateKnitPrice === 'function') updateKnitPrice();
            });
        }
    });
}

function setupZipperListeners() {
    const zipperInputs = ['zp-bl', 'zp-fnd', 'zp-hn', 'zp-shr'];
    zipperInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', function() {
                if (typeof updateZipper === 'function') updateZipper();
            });
        }
    });
}

function setupTrimsListeners() {
    const threadInputs = ['th-seam', 'th-layer', 'th-spi', 'th-tps'];
    threadInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', function() {
                if (typeof updateThread === 'function') updateThread();
            });
        }
    });
    
    const buttonInputs = ['bt-pp', 'bt-ex'];
    buttonInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', function() {
                if (typeof updateButton === 'function') updateButton();
            });
        }
    });
    
    const interliningInputs = ['il-len', 'il-wid', 'il-qty'];
    interliningInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', function() {
                if (typeof updateInterlining === 'function') updateInterlining();
            });
        }
    });
}

function setupFOBListeners() {
    const fobInputs = ['fob-fab', 'fob-tr', 'fob-cm', 'fob-acc', 'fob-oh', 'fob-pr', 'fob-fr', 'fob-ins'];
    fobInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', function() {
                if (typeof updateFOB === 'function') updateFOB();
            });
        }
    });
}

function setupSizeRatioListeners() {
    const ratioInputs = ['sr-total', 'sr-r1', 'sr-r2', 'sr-r3', 'sr-r4', 'sr-r5'];
    ratioInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', function() {
                if (typeof updateSizeRatio === 'function') updateSizeRatio();
            });
        }
    });
}

// ========== START APP ==========
// Wait for DOM and all scripts to load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
