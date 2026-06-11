const token = localStorage.getItem('token')

let allTypes = []

// =====================
// LOAD & RENDER TYPES
// =====================

async function loadEquipments() {
    const res = await fetch('/api/equipment/types')
    const data = await res.json()
    allTypes = data
    renderEquipments(data)
}

function renderEquipments(types) {
    const container = document.getElementById('equipmentList')
    if (types.length === 0) {
        container.innerHTML = '<p class="text-muted">No equipment found.</p>'
        return
    }
    container.innerHTML = types.map(t => renderCard(t)).join('')
}

function renderCard(t) {
    const image = t.image_url
    const statusBadge = parseInt(t.available_count) > 0
        ? `<span class="badge-available me-2">Available</span>`
        : `<span class="badge-broken me-2">Unavailable</span>`

    return `
    <div class="eq-card" id="card-${t.id}">
      <div class="eq-card-header">
        <img class="eq-img" src="${image}" alt="${t.name}" onclick='openDetailModal(${JSON.stringify(t)})' style="cursor:pointer;" />
        <div class="eq-info">
          <div class="name" onclick='openDetailModal(${JSON.stringify(t)})' style="cursor:pointer;">${t.name}</div>
          <div class="meta">${t.subcategory || ''} · ${formatCategory(t.category)}</div>
        </div>
        <div class="eq-units">
          <div class="label">Available Units</div>
          <div class="count">${t.available_count}/${t.total_units}</div>
        </div>
        ${statusBadge}
        <div class="eq-actions">
          <button class="btn-edit" onclick='openTypeModal(${JSON.stringify(t)})'>Edit</button>
          <button class="btn-expand" onclick="toggleUnits(this, ${t.id})"><i class="bi bi-chevron-down"></i></button>
        </div>
      </div>
      <div class="units-table" style="display:none">
        <div class="units-table-title">
          Individual Units
          <button class="btn-add-unit" onclick="openUnitModal(null, ${t.id})"><i class="bi bi-plus-lg"></i> Add Unit</button>
        </div>
        <div class="units-header">
          <span>Serial Number</span><span>Status</span><span>Condition</span><span>Location</span><span>Actions</span>
        </div>
        <div id="units-${t.id}"></div>
      </div>
    </div>`
}

// =====================
// TOGGLE + LOAD UNITS
// =====================

async function toggleUnits(btn, typeId) {
    const card = btn.closest('.eq-card')
    const table = card.querySelector('.units-table')
    const isOpen = btn.classList.contains('open')

    if (isOpen) {
        btn.classList.remove('open')
        table.style.display = 'none'
    } else {
        btn.classList.add('open')
        table.style.display = 'block'
        await loadUnits(typeId)
    }
}

let unitsCache = {}

async function loadUnits(typeId) {
    const res = await fetch(`/api/equipment/types/${typeId}/units`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    if (!res.ok) {
        console.error(data.error)
        return
    }
    unitsCache[typeId] = data
    renderUnits(typeId, data)
}

function renderUnits(typeId, units) {
    const container = document.getElementById(`units-${typeId}`)
    if (units.length === 0) {
        container.innerHTML = '<div class="units-row" style="color:#aaa;grid-column:1/-1">No units yet.</div>'
        return
    }
    container.innerHTML = units.map(u => `
        <div class="units-row">
          <span class="unit-id">${u.qr_code}</span>
          <span><span class="badge-${badgeClass(u.status)}">${formatStatus(u.status)}</span></span>
          <span>${formatCondition(u.condition)}</span>
          <span class="unit-location">${u.location || ''}</span>
          <div class="unit-actions">
            <button class="icon-edit" onclick="openUnitModal(${u.id}, ${typeId})"><i class="bi bi-pencil"></i></button>
            <button class="icon-delete" onclick="deleteUnit(${u.id}, ${typeId})"><i class="bi bi-trash"></i></button>
          </div>
        </div>
    `).join('')
}

// =====================
// HELPERS
// =====================

function formatCategory(cat) {
    const map = {
        vr_ar: 'VR/AR', robotics: 'Robotics', audio_video: 'Audio/Video',
        laboratory: 'Laboratory', computing: 'Computing', iot_embedded: 'IoT/Embedded'
    }
    return map[cat] || cat
}

function formatStatus(s) {
    const map = {
        available: 'Available', checked_out: 'In Use', pending_return: 'Pending Return',
        maintenance: 'Maintenance', broken: 'Broken', lost: 'Lost'
    }
    return map[s] || s
}

function formatCondition(c) {
    const map = {
        good: 'Good', scratched: 'Scratched', missing_parts: 'Missing Parts',
        malfunction: 'Malfunction', damaged: 'Damaged'
    }
    return map[c] || c
}

function badgeClass(status) {
    const map = {
        available: 'available', checked_out: 'inuse', pending_return: 'pending',
        maintenance: 'pending', broken: 'broken', lost: 'broken'
    }
    return map[status] || 'available'
}

// =====================
// SEARCH & FILTER
// =====================

function populateSubcategoryFilter() {
    const category = document.getElementById('categoryFilter').value
    const subSelect = document.getElementById('subcategoryFilter')
    const current = subSelect.value
    subSelect.innerHTML = '<option value="">All Subcategories</option>'

    const subs = category && subcategories[category]
        ? subcategories[category]
        : [...new Set(Object.values(subcategories).flat())].sort()

    subs.forEach(sub => {
        const opt = document.createElement('option')
        opt.value = sub
        opt.textContent = sub
        subSelect.appendChild(opt)
    })

    if (subs.includes(current)) subSelect.value = current
}

function applyFilters() {
    const search = document.getElementById('searchInput').value.trim().toLowerCase()
    const category = document.getElementById('categoryFilter').value
    const subcategory = document.getElementById('subcategoryFilter').value

    const filtered = allTypes.filter(t => {
        const matchesSearch = !search ||
            t.name.toLowerCase().includes(search) ||
            formatCategory(t.category).toLowerCase().includes(search) ||
            (t.subcategory || '').toLowerCase().includes(search)

        const matchesCategory = !category || t.category === category
        const matchesSubcategory = !subcategory || t.subcategory === subcategory

        return matchesSearch && matchesCategory && matchesSubcategory
    })

    renderEquipments(filtered)
}

document.getElementById('searchInput').addEventListener('input', applyFilters)
document.getElementById('categoryFilter').addEventListener('change', () => {
    populateSubcategoryFilter()
    applyFilters()
})
document.getElementById('subcategoryFilter').addEventListener('change', applyFilters)

// =====================
// INIT
// =====================

populateSubcategoryFilter()
loadEquipments()

// Add types
function openTypeModal(type = null) {
    document.getElementById('typeId').value = type ? type.id : ''
    document.getElementById('typeName').value = type ? type.name : ''
    document.getElementById('typeCategory').value = type ? type.category : ''
    document.getElementById('typeDescription').value = type ? type.description || '' : ''
    document.getElementById('typeModalTitle').textContent = type ? 'Edit Equipment' : 'Add Equipment'

    updateSubcategory()
    if (type) document.getElementById('typeSubcategory').value = type.subcategory || ''

    const preview = document.getElementById('typeImagePreview')
    if (type && type.image_url) {
        preview.src = type.image_url
        preview.style.display = 'block'
    } else {
        preview.src = ''
        preview.style.display = 'none'
    }

    document.getElementById('typeModal').classList.add('open')
}

function closeTypeModal() {
    document.getElementById('typeModal').classList.remove('open')
    document.getElementById('typeImage').value = ''
}
async function saveType() {
    const id = document.getElementById('typeId').value
    const formData = new FormData()
    formData.append('name', document.getElementById('typeName').value)
    formData.append('category', document.getElementById('typeCategory').value)
    formData.append('subcategory', document.getElementById('typeSubcategory').value)
    formData.append('description', document.getElementById('typeDescription').value)

    const imageFile = document.getElementById('typeImage').files[0]
    if (imageFile) formData.append('image', imageFile)

    const url = id ? `/api/equipment/types/${id}` : '/api/equipment/types'
    const method = id ? 'PUT' : 'POST'

    const res = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    })

    if (res.ok) {
        closeTypeModal()
        loadEquipments()
    } else {
        const data = await res.json()
        alert(data.error)
    }
}
function previewImage(input) {
    const preview = document.getElementById('typeImagePreview')
    if (input.files && input.files[0]) {
        preview.src = URL.createObjectURL(input.files[0])
        preview.style.display = 'block'
    }
}
// View equipement type details
async function openDetailModal(t) {
    document.getElementById('detailImage').src = t.image_url
    document.getElementById('detailName').textContent = t.name
    document.getElementById('detailMeta').textContent = `${t.subcategory || ''} · ${formatCategory(t.category)}`
    document.getElementById('detailCount').textContent = `${t.available_count}/${t.total_units}`
    document.getElementById('detailDescription').textContent = t.description || ''
    document.getElementById('detailTotalUnits').textContent = `${t.total_units} total`
    document.getElementById('detailUnits').innerHTML = '<p style="color:#aaa;font-size:13px;">Loading...</p>'

    document.getElementById('detailModal').classList.add('open')

    const res = await fetch(`/api/equipment/types/${t.id}/units`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    const units = await res.json()

    if (!res.ok || units.length === 0) {
        document.getElementById('detailUnits').innerHTML = '<p style="color:#aaa;font-size:13px;padding:10px;">No units yet.</p>'
        return
    }

    document.getElementById('detailUnits').innerHTML = units.map(u => `
        <div class="units-row" style="grid-template-columns:1.2fr 1fr 1fr 1.2fr;">
          <span class="unit-id">${u.qr_code}</span>
          <span><span class="badge-${badgeClass(u.status)}">${formatStatus(u.status)}</span></span>
          <span>${formatCondition(u.condition)}</span>
          <span class="unit-location">${u.location || ''}</span>
        </div>
    `).join('')
}

function closeDetailModal() {
    document.getElementById('detailModal').classList.remove('open')
}

// =====================
// UNIT MODAL
// =====================

function openUnitModal(unitId = null, typeId) {
    const unit = unitId ? unitsCache[typeId]?.find(u => u.id === unitId) : null

    document.getElementById('unitId').value = unit ? unit.id : ''
    document.getElementById('unitTypeId').value = typeId
    document.getElementById('unitQrCode').value = unit ? unit.qr_code : ''
    document.getElementById('unitLocation').value = unit ? unit.location || '' : ''
    document.getElementById('unitCondition').value = unit ? unit.condition : 'good'
    document.getElementById('unitStatus').value = unit ? unit.status : 'available'
    document.getElementById('unitModalTitle').textContent = unit ? 'Edit Unit' : 'Add Unit'

    syncStatusWithCondition()

    document.getElementById('qrPreviewWrap').style.display = 'none'

    document.getElementById('unitModal').classList.add('open')
}

function closeUnitModal() {
    document.getElementById('unitModal').classList.remove('open')
}

function syncStatusWithCondition() {
    const condition = document.getElementById('unitCondition').value
    const statusSelect = document.getElementById('unitStatus')
    const availableOption = statusSelect.querySelector('option[value="available"]')
    const badConditions = ['damaged', 'malfunction', 'missing_parts']

    if (badConditions.includes(condition)) {
        availableOption.disabled = true
        if (statusSelect.value === 'available') {
            statusSelect.value = 'maintenance'
        }
    } else {
        availableOption.disabled = false
    }
}

async function saveUnit() {
    const id = document.getElementById('unitId').value
    const typeId = document.getElementById('unitTypeId').value

    const payload = {
        type_id: typeId,
        qr_code: document.getElementById('unitQrCode').value,
        location: document.getElementById('unitLocation').value,
        condition: document.getElementById('unitCondition').value,
        status: document.getElementById('unitStatus').value
    }

    if (!payload.qr_code || !payload.location) {
        alert('Please fill in all required fields.')
        return
    }

    const url = id ? `/api/equipment/units/${id}` : '/api/equipment/units'
    const method = id ? 'PUT' : 'POST'

    const res = await fetch(url, {
        method,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })

    const data = await res.json()
    if (res.ok) {
        closeUnitModal()
        await loadUnits(typeId)
        await loadEquipments()
    } else {
        alert(data.error)
    }
}

async function deleteUnit(unitId, typeId) {
    if (!confirm('Delete this unit?')) return

    const res = await fetch(`/api/equipment/units/${unitId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    })

    if (res.ok) {
        await loadUnits(typeId)
        await loadEquipments()
    } else {
        const data = await res.json()
        alert(data.error)
    }
}

// =====================
// QR CODE
// =====================

function generateQR() {
    const typeId = document.getElementById('unitTypeId').value
    const random = Math.floor(100 + Math.random() * 900)
    const code = `MERAS-T${typeId}-${random}`
    document.getElementById('unitQrCode').value = code

    const url = `${window.location.origin}/scan?code=${code}`
    const canvas = document.getElementById('qrCanvas')
    QRCode.toCanvas(canvas, url, { width: 180 }, (error) => {
        if (error) console.error(error)
    })
    document.getElementById('qrPreviewWrap').style.display = 'block'
}

function downloadQR() {
    const canvas = document.getElementById('qrCanvas')
    const link = document.createElement('a')
    link.download = `${document.getElementById('unitQrCode').value}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
}