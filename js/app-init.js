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

    // Replace UI emoji symbols with consistent premium SVG icons
    initPremiumIcons();
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


// ========== PREMIUM SVG ICON SYSTEM ==========
// Uses Lucide SVG icons with one consistent stroke style.
// Emoji icons in the UI are replaced automatically by semantic SVG icons.
function initPremiumIcons() {
    if (!window.lucide || typeof window.lucide.createIcons !== 'function') {
        return;
    }

    const iconMap = {
        '🧵': 'spool',
        '👕': 'shirt',
        '👔': 'shirt',
        '👖': 'shirt',
        '🧣': 'shirt',
        '🧤': 'hand',
        '🪡': 'pocket-knife',
        '🌙': 'moon',
        '📋': 'clipboard-list',
        '💰': 'circle-dollar-sign',
        '💵': 'badge-dollar-sign',
        '🔱': 'split',
        '📐': 'ruler-dimension-line',
        '🔄': 'arrow-left-right',
        '📚': 'library',
        '📏': 'ruler',
        '📊': 'chart-bar',
        '⚖️': 'weight',
        '🌡️': 'thermometer',
        '📦': 'package',
        '🔘': 'circle-dot',
        '⚙️': 'settings',
        '⚠️': 'triangle-alert',
        '🟡': 'circle',
        '📄': 'file-text',
        '🎯': 'target',
        '✅': 'check',
        '❌': 'x',
        '➕': 'circle-plus',
        '📈': 'chart-line',
        '📝': 'notebook-pen',
        '📖': 'book-open',
        '🔧': 'wrench',
        '🛠️': 'tool-case',
        '📎': 'paperclip',
        '🔍': 'search',
        '🔎': 'search',
        '💡': 'lightbulb',
        '🚀': 'rocket'
    };

    const emojiPattern = /🧵|👕|👔|👖|🧣|🧤|🪡|🌙|📋|💰|💵|🔱|📐|🔄|📚|📏|📊|⚖️|🌡️|📦|🔘|⚙️|⚠️|🟡|📄|🎯|✅|❌|➕|📈|📝|📖|🔧|🛠️|📎|🔍|🔎|💡|🚀/gu;

    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode(node) {
                const parent = node.parentElement;
                if (!parent) return NodeFilter.FILTER_REJECT;

                const tag = parent.tagName;
                if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA'].includes(tag)) {
                    return NodeFilter.FILTER_REJECT;
                }

                emojiPattern.lastIndex = 0;
                return emojiPattern.test(node.nodeValue)
                    ? NodeFilter.FILTER_ACCEPT
                    : NodeFilter.FILTER_REJECT;
            }
        }
    );

    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);

    textNodes.forEach(node => {
        const fragment = document.createDocumentFragment();
        const text = node.nodeValue;
        let lastIndex = 0;
        let match;

        emojiPattern.lastIndex = 0;

        while ((match = emojiPattern.exec(text)) !== null) {
            if (match.index > lastIndex) {
                fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
            }

            if (match[0] === '🧣') {
                const collarSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                collarSvg.setAttribute('viewBox', '0 0 24 24');
                collarSvg.setAttribute('aria-hidden', 'true');
                collarSvg.classList.add('fc-svg-icon', 'fc-collar-icon');
                collarSvg.innerHTML = `
                    <path d="M5.2 7.2C6.2 4.2 9.3 3 12 3s5.8 1.2 6.8 4.2"></path>
                    <path d="M5.2 7.2 2.8 12.8c-.5 1.2-.2 2.5.7 3.4l5.9 5.2 3.1-6.2"></path>
                    <path d="M18.8 7.2 21.2 12.8c.5 1.2.2 2.5-.7 3.4l-5.9 5.2-3.1-6.2"></path>
                    <path d="M5.2 7.2 12 12.8l6.8-5.6"></path>
                    <path d="M10.1 15.2h3.8l1.1 2.4h-6l1.1-2.4Z"></path>
                `;
                collarSvg.setAttribute('fill', 'none');
                collarSvg.setAttribute('stroke', 'currentColor');
                collarSvg.setAttribute('stroke-width', '1.9');
                collarSvg.setAttribute('stroke-linecap', 'round');
                collarSvg.setAttribute('stroke-linejoin', 'round');
                fragment.appendChild(collarSvg);
            } else if (match[0] === '🪡') {
                const pocketSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                pocketSvg.setAttribute('viewBox', '0 0 24 24');
                pocketSvg.setAttribute('aria-hidden', 'true');
                pocketSvg.classList.add('fc-svg-icon', 'fc-pocket-icon');
                pocketSvg.innerHTML = `
                    <path d="M5 4.5h14v12.2l-4.2 4.2H9.2L5 16.7V4.5Z"></path>
                `;
                pocketSvg.setAttribute('fill', 'none');
                pocketSvg.setAttribute('stroke', 'currentColor');
                pocketSvg.setAttribute('stroke-width', '2');
                pocketSvg.setAttribute('stroke-linecap', 'round');
                pocketSvg.setAttribute('stroke-linejoin', 'round');
                fragment.appendChild(pocketSvg);
            } else {
                const icon = document.createElement('i');
                icon.setAttribute('data-lucide', iconMap[match[0]]);
                icon.setAttribute('aria-hidden', 'true');
                icon.className = 'fc-svg-icon';
                fragment.appendChild(icon);
            }

            lastIndex = match.index + match[0].length;
        }

        if (lastIndex < text.length) {
            fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
        }

        node.parentNode.replaceChild(fragment, node);
    });

    if (!document.getElementById('fc-premium-icon-style')) {
        const style = document.createElement('style');
        style.id = 'fc-premium-icon-style';
        style.textContent = `
            .fc-svg-icon {
                width: 1em;
                height: 1em;
                min-width: 1em;
                display: inline-block;
                vertical-align: -0.16em;
                stroke-width: 2;
                color: currentColor;
                margin-right: 0.18em;
            }

            .fc-pocket-icon {
                stroke-width: 2.1;
            }

            .tab-btn .fc-pocket-icon {
                width: 15px;
                height: 15px;
                min-width: 15px;
                vertical-align: -0.18em;
                margin-right: 4px;
            }

            .tab-btn .fc-svg-icon {
                width: 15px;
                height: 15px;
                min-width: 15px;
                vertical-align: -0.18em;
                margin-right: 4px;
            }

            .page-title > .fc-svg-icon {
                width: 22px;
                height: 22px;
                min-width: 22px;
                vertical-align: -0.2em;
                margin-right: 5px;
                stroke-width: 1.9;
            }

            .panel-title > .fc-svg-icon,
            .opt-title > .fc-svg-icon,
            .fn-title > .fc-svg-icon {
                width: 18px;
                height: 18px;
                min-width: 18px;
                stroke-width: 1.9;
            }

            .check-row .fc-svg-icon {
                width: 15px;
                height: 15px;
                min-width: 15px;
                vertical-align: -0.18em;
            }

            .calc-btn .fc-svg-icon {
                width: 16px;
                height: 16px;
                min-width: 16px;
            }

            .r-row .fc-svg-icon {
                width: 15px;
                height: 15px;
                min-width: 15px;
                vertical-align: -0.17em;
            }
        `;
        document.head.appendChild(style);
    }

    window.lucide.createIcons({
        attrs: {
            'stroke-width': 2,
            'stroke': 'currentColor'
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
