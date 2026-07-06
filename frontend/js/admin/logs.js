const token = localStorage.getItem('token')

let allLogs = []

// =====================
// LOAD LOGS
// =====================

async function loadLogs() {
    const container = document.getElementById('logsContainer')
    try {
        const res = await fetch('/api/logs', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await res.json()

        if (!res.ok) {
            container.innerHTML = `<div class="table-row" style="color:#aaa;">${data.error || 'Failed to load logs.'}</div>`
            return
        }

        allLogs = data
        renderStats(allLogs)
        renderLogs(allLogs)
    } catch (error) {
        container.innerHTML = '<div class="table-row" style="color:#aaa;">Failed to load logs.</div>'
    }
}

// =====================
// RENDER STATS
// =====================

function renderStats(logs) {
    const total = logs.length
    const statusUpdates = logs.filter(l => l.action === 'status_update').length
    const transfers = logs.filter(l => l.action === 'transfer').length

    document.getElementById('statTotal').textContent = total
    document.getElementById('statStatusUpdates').textContent = statusUpdates
    document.getElementById('statTransfers').textContent = transfers
}

// =====================
// RENDER TABLE
// =====================

function renderLogs(logs) {
    const container = document.getElementById('logsContainer')

    if (logs.length === 0) {
        container.innerHTML = '<div class="table-row" style="color:#aaa;">No logs found.</div>'
        return
    }

    container.innerHTML = logs.map(l => `
        <div class="table-row">
          <div class="date-time">${formatDateTime(l.created_at)}</div>
          <div><div class="eq-name">${l.equipment_name || ''}</div><div class="eq-unit">Unit: ${l.unit_code || ''}</div></div>
          <div class="user-cell"><div class="user-name">${l.user_name || 'System'}</div><div class="user-email">${l.user_email || ''}</div></div>
          <div class="action-text">${formatAction(l.action)}</div>
          <div class="change-text"><span class="from">${l.status_before || '-'}</span><span class="arrow">→</span><span class="to">${l.status_after || '-'}</span></div>
          <div class="change-text"><span class="from">${l.condition_before || '-'}</span><span class="arrow">→</span><span class="to">${l.condition_after || '-'}</span></div>
          <div class="notes-text">${l.notes || ''}</div>
        </div>
    `).join('')
}

// =====================
// HELPERS
// =====================

function formatAction(action) {
    const map = {
        checkout: 'Checkout',
        return_scan: 'Return Scan',
        admin_confirm_return: 'Return Confirmation',
        cancel: 'Cancel',
        status_update: 'Status Update',
        transfer: 'Transfer'
    }
    return map[action] || action
}

function formatDateTime(value) {
    if (!value) return '—'
    const clean = value.replace(' ', 'T').slice(0, 19)
    const [datePart, timePart] = clean.split('T')
    const [yyyy, mo, dd] = datePart.split('-')
    const [hh, mm] = timePart.split(':')
    return `${dd}/${mo}/${yyyy} ${hh}:${mm}`
}

// =====================
// FILTERS
// =====================

let currentAction = 'all'
let dateFrom = null
let dateTo = null

function applyFilters() {
    const search = document.getElementById('searchInput').value.trim().toLowerCase()

    let filtered = allLogs

    if (currentAction !== 'all') {
        filtered = filtered.filter(l => l.action === currentAction)
    }

    if (dateFrom) {
        const start = new Date(dateFrom)
        start.setHours(0, 0, 0, 0)
        filtered = filtered.filter(l => new Date(l.created_at) >= start)
    }

    if (dateTo) {
        const end = new Date(dateTo)
        end.setHours(23, 59, 59, 999)
        filtered = filtered.filter(l => new Date(l.created_at) <= end)
    }

    if (search) {
        filtered = filtered.filter(l => {
            return (l.equipment_name || '').toLowerCase().includes(search) ||
                (l.unit_code || '').toLowerCase().includes(search) ||
                (l.user_name || '').toLowerCase().includes(search) ||
                (l.user_email || '').toLowerCase().includes(search)
        })
    }

    renderLogs(filtered)
}

document.getElementById('searchInput').addEventListener('input', applyFilters)

// =====================
// ACTION FILTER DROPDOWN
// =====================

const actionFilterBtn = document.getElementById('actionFilterBtn')
const actionFilterMenu = document.getElementById('actionFilterMenu')
const dateFilterBtn = document.getElementById('dateFilterBtn')
const dateFilterMenu = document.getElementById('dateFilterMenu')

actionFilterBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    dateFilterMenu.classList.remove('open')
    actionFilterMenu.classList.toggle('open')
})

actionFilterMenu.querySelectorAll('.dropdown-item-custom').forEach(item => {
    item.addEventListener('click', () => {
        currentAction = item.dataset.action

        actionFilterMenu.querySelectorAll('.dropdown-item-custom').forEach(i => i.classList.remove('active'))
        item.classList.add('active')

        document.getElementById('actionFilterLabel').textContent = item.textContent
        actionFilterMenu.classList.remove('open')
        applyFilters()
    })
})

// =====================
// DATE RANGE FILTER DROPDOWN
// =====================

dateFilterBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    actionFilterMenu.classList.remove('open')
    dateFilterMenu.classList.toggle('open')
})

// Prevent clicks inside the date dropdown (e.g. date pickers) from closing it
dateFilterMenu.addEventListener('click', (e) => {
    e.stopPropagation()
})

document.getElementById('dateApplyBtn').addEventListener('click', () => {
    dateFrom = document.getElementById('dateFrom').value || null
    dateTo = document.getElementById('dateTo').value || null

    document.getElementById('dateFilterLabel').textContent =
        (dateFrom || dateTo) ? `${dateFrom || '...'} → ${dateTo || '...'}` : 'Date Range'

    dateFilterMenu.classList.remove('open')
    applyFilters()
})

document.getElementById('dateClearBtn').addEventListener('click', () => {
    document.getElementById('dateFrom').value = ''
    document.getElementById('dateTo').value = ''
    dateFrom = null
    dateTo = null

    document.getElementById('dateFilterLabel').textContent = 'Date Range'
    dateFilterMenu.classList.remove('open')
    applyFilters()
})

// Close dropdowns when clicking outside
document.addEventListener('click', () => {
    actionFilterMenu.classList.remove('open')
    dateFilterMenu.classList.remove('open')
})

// =====================
// INIT
// =====================

loadLogs()
