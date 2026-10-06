// ============================================
// MY FORMULAS.JS - Save/Load Custom Formulas
// User can save their own formulas for future reference
// Data stored in browser's localStorage
// ============================================

// Load all saved formulas from localStorage and display
function loadMyFormulas() {
    let formulas = [];
    try {
        formulas = JSON.parse(localStorage.getItem('fc_formulas') || '[]');
    } catch(e) {
        console.error('Error loading formulas:', e);
    }
    
    const list = document.getElementById('mf-list');
    if (!list) return;
    
    list.innerHTML = '';
    
    if (formulas.length === 0) {
        list.innerHTML = `
            <div style="text-align: center; padding: 30px; color: #94a3b8; background: #f8fafc; border-radius: 10px;">
                📭 No saved formulas yet.<br>
                <span style="font-size: 12px;">Add your first formula using the form above!</span>
            </div>
        `;
        return;
    }
    
    formulas.forEach((f, i) => {
        const card = document.createElement('div');
        card.className = 'my-formula-card';
        card.innerHTML = `
            <div style="flex: 1;">
                <div class="mf-name">
                    <span style="background: #0ea5e9; color: white; padding: 2px 8px; border-radius: 12px; font-size: 10px; margin-right: 8px;">#${i + 1}</span>
                    📘 ${escapeHtml(f.name)}
                </div>
                <div class="mf-formula">${escapeHtml(f.formula)}</div>
                <div style="font-size: 10px; color: #94a3b8; margin-top: 6px;">
                    Saved: ${f.date ? f.date : new Date().toLocaleDateString()}
                </div>
            </div>
            <button class="mf-del" onclick="deleteFormula(${i})" title="Delete formula">🗑️</button>
        `;
        list.appendChild(card);
    });
}

// Save a new formula to localStorage
function saveMyFormula() {
    const nameInput = document.getElementById('mf-name');
    const formulaInput = document.getElementById('mf-formula');
    
    const name = nameInput?.value.trim();
    const formula = formulaInput?.value.trim();
    
    if (!name || !formula) {
        showToast('⚠️ Please enter both formula name and description.', 'error');
        return;
    }
    
    let formulas = [];
    try {
        formulas = JSON.parse(localStorage.getItem('fc_formulas') || '[]');
    } catch(e) {}
    
    // Check for duplicate name
    const duplicate = formulas.find(f => f.name.toLowerCase() === name.toLowerCase());
    if (duplicate) {
        if (!confirm(`⚠️ A formula named "${name}" already exists.\nDo you want to save it anyway?`)) {
            return;
        }
    }
    
    formulas.push({ 
        name: name, 
        formula: formula,
        date: new Date().toLocaleString()
    });
    
    localStorage.setItem('fc_formulas', JSON.stringify(formulas));
    
    // Clear inputs
    if (nameInput) nameInput.value = '';
    if (formulaInput) formulaInput.value = '';
    
    loadMyFormulas();
    showToast('✅ Formula saved successfully!', 'success');
}

// Delete a formula by index
function deleteFormula(index) {
    let formulas = [];
    try {
        formulas = JSON.parse(localStorage.getItem('fc_formulas') || '[]');
    } catch(e) {}
    
    if (index >= 0 && index < formulas.length) {
        const formulaName = formulas[index].name;
        if (confirm(`🗑️ Are you sure you want to delete "${formulaName}"?`)) {
            formulas.splice(index, 1);
            localStorage.setItem('fc_formulas', JSON.stringify(formulas));
            loadMyFormulas();
            showToast(`🗑️ Deleted formula: "${formulaName}"`, 'success');
        }
    }
}

// Delete all formulas
function deleteAllFormulas() {
    if (confirm('⚠️ Are you sure you want to delete ALL saved formulas? This action cannot be undone!')) {
        localStorage.removeItem('fc_formulas');
        loadMyFormulas();
        showToast('🗑️ All formulas deleted!', 'success');
    }
}

// Export formulas to JSON file
function exportFormulas() {
    let formulas = [];
    try {
        formulas = JSON.parse(localStorage.getItem('fc_formulas') || '[]');
    } catch(e) {}
    
    if (formulas.length === 0) {
        showToast('📭 No formulas to export!', 'error');
        return;
    }
    
    const dataStr = JSON.stringify(formulas, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `my_formulas_${new Date().toISOString().slice(0, 19)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('📥 Formulas exported successfully!', 'success');
}

// Import formulas from JSON file
function importFormulas(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedFormulas = JSON.parse(e.target.result);
            if (!Array.isArray(importedFormulas)) {
                throw new Error('Invalid format');
            }
            
            let existingFormulas = [];
            try {
                existingFormulas = JSON.parse(localStorage.getItem('fc_formulas') || '[]');
            } catch(e) {}
            
            const mergedFormulas = [...existingFormulas, ...importedFormulas];
            localStorage.setItem('fc_formulas', JSON.stringify(mergedFormulas));
            
            loadMyFormulas();
            showToast(`📥 Imported ${importedFormulas.length} formulas!`, 'success');
        } catch(err) {
            showToast('❌ Invalid file format!', 'error');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

// Show toast notification
function showToast(message, type = 'info') {
    let toast = document.getElementById('custom-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'custom-toast';
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #1e293b;
            color: white;
            padding: 10px 20px;
            border-radius: 8px;
            font-size: 13px;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s;
            pointer-events: none;
        `;
        document.body.appendChild(toast);
    }
    
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        info: '#0ea5e9'
    };
    
    toast.style.backgroundColor = colors[type] || '#1e293b';
    toast.textContent = message;
    toast.style.opacity = '1';
    
    setTimeout(() => {
        toast.style.opacity = '0';
    }, 3000);
}

// Escape HTML to prevent XSS
function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ========== PRELOAD SOME EXAMPLE FORMULAS ==========
function loadExampleFormulas() {
    let formulas = [];
    try {
        formulas = JSON.parse(localStorage.getItem('fc_formulas') || '[]');
    } catch(e) {}
    
    if (formulas.length === 0) {
        const examples = [
            { name: 'T-Shirt (CM/Dz kg)', formula: '(BL+SL) × HC × 2 × GSM × 12 / 10,000,000', date: new Date().toLocaleString() },
            { name: 'Knit Pant (CM/Dz kg)', formula: '(IL+CFR+WBW) × HTC × 4 × GSM × 12 / 10,000,000', date: new Date().toLocaleString() },
            { name: 'Woven Body (yds/Dz)', formula: 'BL × HC × 2 × 12 / (FabricWidth × 36 × 2.54)', date: new Date().toLocaleString() },
            { name: 'Collar (CM/Dz kg)', formula: 'CL × CW × GSM × 12 / 10,000,000', date: new Date().toLocaleString() }
        ];
        localStorage.setItem('fc_formulas', JSON.stringify(examples));
        loadMyFormulas();
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    const saveBtn = document.getElementById('btn-save-formula');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveMyFormula);
    }
    
    const deleteAllBtn = document.getElementById('btn-delete-all');
    if (deleteAllBtn) {
        deleteAllBtn.addEventListener('click', deleteAllFormulas);
    }
    
    const exportBtn = document.getElementById('btn-export-formulas');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportFormulas);
    }
    
    const importBtn = document.getElementById('btn-import-formulas');
    if (importBtn) {
        importBtn.addEventListener('change', importFormulas);
    }
    
    // Load example formulas if empty (optional - comment out if not needed)
    // loadExampleFormulas();
    
    loadMyFormulas();
});

// Make functions global for HTML onclick
window.saveMyFormula = saveMyFormula;
window.deleteFormula = deleteFormula;
window.deleteAllFormulas = deleteAllFormulas;
window.exportFormulas = exportFormulas;
window.importFormulas = importFormulas;