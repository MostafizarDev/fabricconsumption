// ============================================
// BOOKING SHEET.JS - Marker Based Consumption (Excel Style)
// Formula: NetCon(kg) = GSM × (MarkerLen + CutAllowLen) × (MarkerWid + CutAllowWid) / 1,550,000
// ============================================

let bookingRows = 2;

function updateBooking() {
    calcBooking();
}

function calcBooking() {
    const ML = v('bs-ml');
    const CLA = v('bs-cla');
    const MW = v('bs-mw');
    const CWA = v('bs-cwa');
    const GSM = v('bs-gsm');
    const PCS = v('bs-pcs') || 1;
    const CWP = v('bs-cwp') || 0;
    
    const effL = ML + CLA;
    const effW = MW + CWA;
    const netCon = (effL * effW * GSM) / 1550000;
    const conDz = (netCon / PCS) * 12;
    const finalCon = conDz * (1 + CWP / 100);
    
    set('bs-effl', effL.toFixed(2) + '"');
    set('bs-effw', effW.toFixed(2) + '"');
    set('bs-net', netCon.toFixed(4) + ' kg');
    set('bs-dz', conDz.toFixed(3) + ' kg/dz');
    set('bs-final', finalCon.toFixed(3) + ' kg/dz');
}

function calcBookingRow(rowId) {
    const ML = v(`bs-ml-${rowId}`);
    const CLA = v(`bs-cla-${rowId}`);
    const MW = v(`bs-mw-${rowId}`);
    const CWA = v(`bs-cwa-${rowId}`);
    const GSM = v(`bs-gsm-${rowId}`);
    const PCS = v(`bs-pcs-${rowId}`) || 1;
    const CWP = v(`bs-cwp-${rowId}`) || 0;
    
    const effL = ML + CLA;
    const effW = MW + CWA;
    const netCon = (effL * effW * GSM) / 1550000;
    const conDz = (netCon / PCS) * 12;
    const finalCon = conDz * (1 + CWP / 100);
    
    const resultSpan = document.querySelector(`.bs-result-${rowId}`);
    if (resultSpan) {
        resultSpan.innerHTML = finalCon.toFixed(3);
    }
    return finalCon;
}

function calculateAllBookingRows() {
    let total = 0;
    for (let i = 1; i <= bookingRows; i++) {
        const rowResult = calcBookingRow(i);
        if (!isNaN(rowResult)) total += rowResult;
    }
    const totalSpan = document.getElementById('booking-total');
    if (totalSpan) {
        totalSpan.innerHTML = total.toFixed(3) + ' kg/dz';
    }
}

function addBookingRow() {
    bookingRows++;
    const tbody = document.getElementById('booking-table-body');
    if (!tbody) return;
    
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td><input class="inp-plain" id="bs-parts-${bookingRows}" value="PART ${bookingRows}" style="width:70px"></td>
        <td><input class="inp-plain" id="bs-fabric-${bookingRows}" value="FABRIC" style="width:80px"></td>
        <td><input class="inp-plain" id="bs-ml-${bookingRows}" value="30" step="0.01" style="width:70px"></td>
        <td><input class="inp-plain" id="bs-cla-${bookingRows}" value="2" style="width:50px"></td>
        <td><input class="inp-plain" id="bs-mw-${bookingRows}" value="60" style="width:70px"></td>
        <td><input class="inp-plain" id="bs-cwa-${bookingRows}" value="2" style="width:50px"></td>
        <td><input class="inp-plain" id="bs-gsm-${bookingRows}" value="280" style="width:70px"></td>
        <td><input class="inp-plain" id="bs-pcs-${bookingRows}" value="10" style="width:50px"></td>
        <td><input class="inp-plain" id="bs-cwp-${bookingRows}" value="6" style="width:50px"></td>
        <td class="bs-result-${bookingRows}" style="color:#0ea5e9; font-weight:700; text-align:center">—</td>
        <td><button onclick="deleteBookingRow(this)" style="background:#ef4444; color:white; border:none; border-radius:4px; padding:4px 8px; cursor:pointer">✖</button></td>
    `;
    tbody.appendChild(newRow);
    
    const inputs = [`bs-ml-${bookingRows}`, `bs-cla-${bookingRows}`, `bs-mw-${bookingRows}`, `bs-cwa-${bookingRows}`, `bs-gsm-${bookingRows}`, `bs-pcs-${bookingRows}`, `bs-cwp-${bookingRows}`];
    inputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) input.addEventListener('input', () => calculateAllBookingRows());
    });
    calculateAllBookingRows();
}

function deleteBookingRow(btn) {
    const row = btn.closest('tr');
    if (row) row.remove();
    calculateAllBookingRows();
}

function downloadBookingReport() {
    const ML = v('bs-ml');
    const CLA = v('bs-cla');
    const MW = v('bs-mw');
    const CWA = v('bs-cwa');
    const GSM = v('bs-gsm');
    const PCS = v('bs-pcs') || 1;
    const CWP = v('bs-cwp') || 0;
    
    const effL = ML + CLA;
    const effW = MW + CWA;
    const netCon = (effL * effW * GSM) / 1550000;
    const conDz = (netCon / PCS) * 12;
    const finalCon = conDz * (1 + CWP / 100);
    
    // Get multiple rows data
    let multipleRowsHtml = '';
    let grandTotal = 0;
    for (let i = 1; i <= bookingRows; i++) {
        const parts = document.getElementById(`bs-parts-${i}`)?.value || '-';
        const fabric = document.getElementById(`bs-fabric-${i}`)?.value || '-';
        const ml = v(`bs-ml-${i}`);
        const cla = v(`bs-cla-${i}`);
        const mw = v(`bs-mw-${i}`);
        const cwa = v(`bs-cwa-${i}`);
        const gsm = v(`bs-gsm-${i}`);
        const pcs = v(`bs-pcs-${i}`) || 1;
        const cwp = v(`bs-cwp-${i}`) || 0;
        
        const eL = ml + cla;
        const eW = mw + cwa;
        const net = (eL * eW * gsm) / 1550000;
        const consDz = (net / pcs) * 12;
        const final = consDz * (1 + cwp / 100);
        grandTotal += final;
        
        multipleRowsHtml += `
            <tr>
                <td>${parts}</td><td>${fabric}</td><td>${ml}</td><td>${cla}</td><td>${mw}</td><td>${cwa}</td><td>${gsm}</td><td>${pcs}</td><td>${cwp}%</td><td><strong>${final.toFixed(3)}</strong></td>
            </tr>
        `;
    }
    
    const reportHtml = `
        <div class="header">
            <h1>📋 Booking Sheet Report</h1>
            <div class="date">Generated: ${new Date().toLocaleString()}</div>
        </div>
        
        <div class="box">
            <div>Single Marker Calculation</div>
            <div class="box-value">${finalCon.toFixed(3)} kg/dz</div>
            <div>per dozen (with ${CWP}% cutting waste)</div>
        </div>
        
        <h3>📏 Single Marker Details</h3>
        <table style="width:100%">${['th','Parameter','Value','th','Marker Length',ML+'"','th','Cut Allow Length',CLA+'"','tr','th','Marker Width',MW+'"','th','Cut Allow Width',CWA+'"','tr','th','Effective Length',effL.toFixed(2)+'"','th','Effective Width',effW.toFixed(2)+'"','tr','th','GSM',GSM,'th','Pcs in Marker',PCS].map((v,i)=>i%4===0?'<tr>':'<td>'+v+'</td>').join('')}</table>
        
        <h3>📊 Multiple Parts / Styles</h3>
        <table style="width:100%; border-collapse:collapse">
            <thead><tr><th>Parts</th><th>Fabric</th><th>ML</th><th>CutL</th><th>MW</th><th>CutW</th><th>GSM</th><th>Pcs</th><th>Cut%</th><th>Cons/Dz</th></tr></thead>
            <tbody>${multipleRowsHtml}</tbody>
            <tfoot><tr style="background:#dbeafe; font-weight:bold"><td colspan="9">GRAND TOTAL</td><td>${grandTotal.toFixed(3)} kg/dz</td></tr></tfoot>
        </table>
        
        <div class="footer">© 2026 Mostafizar Rahman | TG: @mostafizarfiz</div>
    `;
    
    generatePDF('Booking Sheet Report', reportHtml);
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    const mainInputs = ['bs-ml', 'bs-cla', 'bs-mw', 'bs-cwa', 'bs-gsm', 'bs-pcs', 'bs-cwp'];
    mainInputs.forEach(id => {
        const input = el(id);
        if (input) input.addEventListener('input', updateBooking);
    });
    
    const calcBtn = el('btn-calc-booking');
    if (calcBtn) calcBtn.addEventListener('click', calcBooking);
    
    const pdfBtn = el('btn-pdf-booking');
    if (pdfBtn) pdfBtn.addEventListener('click', downloadBookingReport);
    
    const addRowBtn = el('btn-add-booking-row');
    if (addRowBtn) addRowBtn.addEventListener('click', addBookingRow);
    
    for (let i = 1; i <= 2; i++) {
        const inputs = [`bs-ml-${i}`, `bs-cla-${i}`, `bs-mw-${i}`, `bs-cwa-${i}`, `bs-gsm-${i}`, `bs-pcs-${i}`, `bs-cwp-${i}`];
        inputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) input.addEventListener('input', () => calculateAllBookingRows());
        });
    }
    
    calcBooking();
    calculateAllBookingRows();
});