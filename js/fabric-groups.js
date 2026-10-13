// ============================================
// FABRIC GROUPS - Knit consumption group manager
// Stores each user's custom component groups in this browser.
// Calculation integration is handled separately from this UI layer.
// ============================================
(function () {
    'use strict';

    const STORAGE_KEY = 'fc-knit-fabric-groups-v1';
    const COMPONENTS = [
        { id: 'body', label: 'Body', checkbox: 'ck-body' },
        { id: 'collar', label: 'Collar', checkbox: 'ck-collar' },
        { id: 'cuff', label: 'Cuff', checkbox: 'ck-cuff' },
        { id: 'pocket', label: 'Pocket', checkbox: 'ck-pocket' },
        { id: 'halfmoon', label: 'Half-moon', checkbox: 'ck-halfmoon' }
    ];

    let groups = loadGroups();
    let editingId = null;
    let latestTotalsData = { qty: 0, components: {} };

    function loadGroups() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            if (!Array.isArray(saved)) return [];
            return saved.filter(group =>
                group &&
                typeof group.id === 'string' &&
                typeof group.name === 'string' &&
                Array.isArray(group.components)
            ).map(group => ({
                id: group.id,
                name: group.name.slice(0, 50),
                components: COMPONENTS.map(item => item.id).filter(id => group.components.includes(id))
            }));
        } catch (error) {
            return [];
        }
    }

    function saveGroups() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
            return true;
        } catch (error) {
            showError('Could not save groups in this browser. Check your browser storage settings.');
            return false;
        }
    }

    function el(id) {
        return document.getElementById(id);
    }

    function assignedToOtherGroup(componentId, exceptGroupId) {
        return groups.some(group => group.id !== exceptGroupId && group.components.includes(componentId));
    }

    function selectedComponentIds() {
        return COMPONENTS.filter(item => {
            const input = document.querySelector('[data-group-component="' + item.id + '"]');
            return input && input.checked;
        }).map(item => item.id);
    }

    function showError(message) {
        const error = el('kg-group-error');
        if (!error) return;
        error.textContent = message;
        error.hidden = !message;
    }

    function clearEditor() {
        editingId = null;
        el('kg-group-name').value = '';
        el('kg-group-editor-title').textContent = 'Create a group';
        el('kg-group-save').textContent = 'Create Group';
        el('kg-group-cancel').hidden = true;
        showError('');
        renderComponentChoices([]);
    }

    function renderComponentChoices(selectedIds) {
        const container = el('kg-group-components');
        if (!container) return;
        container.replaceChildren();

        COMPONENTS.forEach(component => {
            const assignedElsewhere = assignedToOtherGroup(component.id, editingId);
            const label = document.createElement('label');
            label.className = 'kg-group-component-option' + (assignedElsewhere ? ' is-assigned' : '');

            const input = document.createElement('input');
            input.type = 'checkbox';
            input.dataset.groupComponent = component.id;
            input.checked = selectedIds.includes(component.id);
            input.disabled = assignedElsewhere;

            const text = document.createElement('span');
            text.className = 'kg-group-component-name';
            text.textContent = component.label;

            const status = document.createElement('span');
            status.className = 'kg-group-component-status';
            status.textContent = assignedElsewhere ? 'In another group' : '';

            label.append(input, text, status);
            container.appendChild(label);
        });
    }

    function renderGroups() {
        const list = el('kg-saved-groups-list');
        const count = el('kg-group-count');
        if (!list || !count) return;
        list.replaceChildren();
        count.textContent = groups.length + (groups.length === 1 ? ' group' : ' groups');

        if (!groups.length) {
            const empty = document.createElement('div');
            empty.className = 'kg-groups-empty';
            empty.textContent = 'No custom groups yet. Create one above, for example Main Fabric or Rib Fabric.';
            list.appendChild(empty);
            return;
        }

        groups.forEach(group => {
            const card = document.createElement('article');
            card.className = 'kg-saved-group';

            const info = document.createElement('div');
            info.className = 'kg-saved-group-info';

            const title = document.createElement('h4');
            title.textContent = group.name;

            const members = document.createElement('p');
            members.textContent = group.components.map(id => COMPONENTS.find(item => item.id === id)?.label || id).join(' + ');

            info.append(title, members);

            const actions = document.createElement('div');
            actions.className = 'kg-saved-group-actions';

            const edit = document.createElement('button');
            edit.type = 'button';
            edit.className = 'kg-group-edit-btn';
            edit.textContent = 'Edit';
            edit.setAttribute('aria-label', 'Edit ' + group.name);
            edit.addEventListener('click', () => beginEdit(group.id));

            const remove = document.createElement('button');
            remove.type = 'button';
            remove.className = 'kg-group-delete-btn';
            remove.textContent = 'Delete';
            remove.setAttribute('aria-label', 'Delete ' + group.name);
            remove.addEventListener('click', () => deleteGroup(group.id));

            actions.append(edit, remove);
            card.append(info, actions);
            list.appendChild(card);
        });
    }

    function beginEdit(groupId) {
        const group = groups.find(item => item.id === groupId);
        if (!group) return;
        editingId = group.id;
        el('kg-group-name').value = group.name;
        el('kg-group-editor-title').textContent = 'Edit group';
        el('kg-group-save').textContent = 'Save Changes';
        el('kg-group-cancel').hidden = false;
        showError('');
        renderComponentChoices(group.components);
        el('kg-group-name').focus();
    }

    function saveGroup() {
        const name = el('kg-group-name').value.trim();
        const components = selectedComponentIds();

        if (!name) {
            showError('Please enter a group name.');
            el('kg-group-name').focus();
            return;
        }
        if (!components.length) {
            showError('Select at least one component for this group.');
            return;
        }
        if (groups.some(group => group.id !== editingId && group.name.toLowerCase() === name.toLowerCase())) {
            showError('A group with this name already exists. Please use a different name.');
            return;
        }
        if (components.some(id => assignedToOtherGroup(id, editingId))) {
            showError('A component can belong to only one group. Remove it from the other group first.');
            return;
        }

        if (editingId) {
            groups = groups.map(group => group.id === editingId ? { ...group, name, components } : group);
        } else {
            groups.push({ id: 'kg-group-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7), name, components });
        }

        if (!saveGroups()) return;
        clearEditor();
        renderGroups();
        renderGroupTotals(latestTotalsData);
    }

    function deleteGroup(groupId) {
        groups = groups.filter(group => group.id !== groupId);
        if (!saveGroups()) {
            groups = loadGroups();
            return;
        }
        if (editingId === groupId) clearEditor();
        renderGroups();
        renderComponentChoices(selectedComponentIds());
        renderGroupTotals(latestTotalsData);
    }

    function openDialog() {
        const dialog = el('kg-groups-dialog');
        if (!dialog) return;
        clearEditor();
        renderGroups();
        if (typeof dialog.showModal === 'function') {
            dialog.showModal();
        } else {
            dialog.setAttribute('open', '');
        }
    }

    function closeDialog() {
        const dialog = el('kg-groups-dialog');
        if (!dialog) return;
        if (typeof dialog.close === 'function' && dialog.open) dialog.close();
        else dialog.removeAttribute('open');
    }


    function renderGroupTotals(data) {
        if (data) latestTotalsData = data;
        data = latestTotalsData;
        const section = el('kg-group-totals');
        const list = el('kg-group-total-list');
        const count = el('kg-group-total-count');
        if (!section || !list || !count) return;
        list.replaceChildren();
        // Keep the totals panel and gear visible even when there are no groups,
        // so users can always create their first group.
        section.hidden = false;
        count.textContent = groups.length + (groups.length === 1 ? ' group' : ' groups');
        if (!groups.length) {
            const empty = document.createElement('div');
            empty.className = 'kg-group-totals-empty';
            empty.textContent = 'No fabric groups yet. Click the gear icon to create your first group.';
            list.appendChild(empty);
            return;
        }
        const components = data && data.components ? data.components : {};
        const qty = Math.max(0, Number(data && data.qty) || 0);
        const fmt = value => (Number.isFinite(value) ? value : 0).toFixed(3);
        groups.forEach(group => {
            const beforeDz = group.components.reduce((sum, id) => sum + (Number(components[id] && components[id].beforeDz) || 0), 0);
            const afterDz = group.components.reduce((sum, id) => sum + (Number(components[id] && components[id].afterDz) || 0), 0);
            const perPiece = afterDz / 12;
            const orderKg = perPiece * qty;
            const card = document.createElement('article'); card.className = 'kg-group-total-card';
            const head = document.createElement('div'); head.className = 'kg-group-total-card-head';
            const info = document.createElement('div');
            const title = document.createElement('h4'); title.textContent = group.name;
            const members = document.createElement('p'); members.className = 'kg-group-total-members';
            members.textContent = group.components.map(id => COMPONENTS.find(item => item.id === id)?.label || id).join(' + ');
            info.append(title, members);
            const order = document.createElement('strong'); order.className = 'kg-group-total-kg'; order.textContent = fmt(orderKg) + ' kg';
            head.append(info, order);
            const details = document.createElement('button');
            details.type = 'button';
            details.className = 'kg-group-total-details-btn';
            details.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10l5 5 5-5"></path></svg>';
            details.setAttribute('aria-label', 'Show details for ' + group.name);
            details.title = 'Show details';
            details.setAttribute('aria-expanded', 'false');
            const metrics = document.createElement('div');
            metrics.className = 'kg-group-total-metrics';
            metrics.hidden = true;
            details.addEventListener('click', () => {
                const expanded = details.getAttribute('aria-expanded') === 'true';
                details.setAttribute('aria-expanded', String(!expanded));
                metrics.hidden = expanded;
                details.innerHTML = expanded ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10l5 5 5-5"></path></svg>' : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 14l5-5 5 5"></path></svg>';
                details.setAttribute('aria-label', (expanded ? 'Show' : 'Hide') + ' details for ' + group.name);
                details.title = expanded ? 'Show details' : 'Hide details';
            });
            [['Before wastage',fmt(beforeDz)+' kg/dz'],['After wastage',fmt(afterDz)+' kg/dz'],['Per piece',fmt(perPiece)+' kg/pcs'],['Order quantity',String(qty)+' pcs']].forEach(([labelText,valueText]) => {
                const metric=document.createElement('div'); metric.className='kg-group-total-metric';
                const label=document.createElement('span'); label.textContent=labelText;
                const value=document.createElement('strong'); value.textContent=valueText;
                metric.append(label,value); metrics.appendChild(metric);
            });
            head.appendChild(details);
            card.append(head,metrics); list.appendChild(card);
        });
    }
    window.updateKnitGroupTotals = renderGroupTotals;

    function initFabricGroups() {
        const open = el('kg-manage-groups');
        const close = el('kg-groups-close');
        const done = el('kg-groups-done');
        const save = el('kg-group-save');
        const cancel = el('kg-group-cancel');
        const dialog = el('kg-groups-dialog');

        if (!open || !dialog || open.dataset.groupsReady === 'true') return;
        open.dataset.groupsReady = 'true';

        open.addEventListener('click', openDialog);
        close?.addEventListener('click', closeDialog);
        done?.addEventListener('click', closeDialog);
        save?.addEventListener('click', saveGroup);
        cancel?.addEventListener('click', clearEditor);
        el('kg-group-name')?.addEventListener('keydown', event => {
            if (event.key === 'Enter') {
                event.preventDefault();
                saveGroup();
            }
        });

        dialog.addEventListener('click', event => {
            if (event.target === dialog) closeDialog();
        });
        renderComponentChoices([]);
        renderGroups();
        renderGroupTotals({ qty: 0, components: {} });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFabricGroups);
    } else {
        initFabricGroups();
    }
})();
