const token = localStorage.getItem('token')

new ListController({
    searchInputSelector: '.search-bar',
    dropdownSelector: '.filter-select',
    itemSelector: '.table-row',
    searchFields: ['.user-name', '.eq-name'],
    filterCallback: (row, value) => {
        const status = row.getAttribute('data-status')
        return status === value
    }
})

document.addEventListener('DOMContentLoaded', () => {
    loadAllReservations()
})

async function loadAllReservations() {
    try {
        const res = await fetch('/api/reservation/reservations', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })

        if (res.status === 401) {
            localStorage.removeItem('token')
            window.location.replace('../../loginOrRegister.html')
            return
        }

        if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`)
        }

        const data = await res.json()
        const { reservationsData } = data

        renderReservationsTable(reservationsData)
        updateStatistics(reservationsData)
        
    } catch (error) {
        console.error('Error fetching reservations:', error)
    }
}

function renderReservationsTable(reservations) {
    const tableWrap = document.querySelector('.table-wrap')
    if (!tableWrap) return

    tableWrap.innerHTML = `
        <div class="table-header">
          <span style="text-align: center;">Reservation ID</span>
          <span style="padding-left: 20px;">Equipment</span>
          <span style="padding-left: 20px;">User</span>
          <span>Start date</span>
          <span>End Date</span>
          <span>Status</span>
        </div>
    `

    if (!reservations || reservations.length === 0) {
        tableWrap.insertAdjacentHTML('beforeend', `
            <div class="table-row" style="grid-template-columns: 1fr; justify-content: center; padding: 20px; color: #888;">
                No reservations found.
            </div>
        `)
        return
    }

    reservations.forEach(r => {
        const rowHtml = `
            <div class="table-row" data-status="${r.status ? r.status.toLowerCase() : ''}">
                <span style="display: flex; justify-content: center; align-items: center;">${r.reservation_id}</span>
                <div>
                    <div class="eq-name" style="padding-left: 20px;">${r.equipment_name || 'N/A'}</div>
                    <div class="eq-unit" style="padding-left: 20px;">Unit: ${r.qr_code || 'N/A'}</div>
                </div>
                <div>
                    <div class="user-name" style="padding-left: 20px;">${r.full_name || 'N/A'}</div>
                    <div class="user-email" style="padding-left: 20px;">${r.email || 'N/A'}</div>
                </div>
                <div class="date-time">${formatTableDate(r.start_time)}</div>
                <div class="date-time">${formatTableDate(r.end_time)}</div>
                <span>${getStatusBadge(r.status)}</span>
            </div>
        `
        tableWrap.insertAdjacentHTML('beforeend', rowHtml)
    });
}

function getStatusBadge(status) {
    if (!status) return '<span>N/A</span>'
    
    switch (status.toLowerCase()) {
        case 'approved':
            return '<span class="badge-approved">Approved</span>'
        case 'active':
            return '<span class="badge-active">Active</span>'
        case 'pending_return':
            return '<span class="badge-pending">Pending Return</span>'
        case 'overdue':
            return '<span class="badge-overdue">Overdue</span>'
        case 'completed':
            return '<span class="badge-completed">Completed</span>'
        case 'cancelled':
            return '<span class="badge-cancelled">Cancelled</span>'
        default:
            return `<span>${status}</span>`
    }
}

function formatTableDate(isoString) {
    if (!isoString) return 'N/A'
    const date = new Date(isoString)
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${hours}:${minutes}<br>${day}/${month}/${year}`
}

function updateStatistics(reservations) {
    let total = reservations.length
    let active = 0
    let overdue = 0
    let cancelled = 0
    let completed = 0

    reservations.forEach(r => {
        const status = r.status ? r.status.toLowerCase() : ''

        if (status === 'active') {
            active++
        } else if (status === 'overdue') {
            overdue++
        } else if (status === 'cancelled') {
            cancelled++
        } else if (status === 'completed') {
            completed++
        }
    })

    setStatValue('Total', total);
    setStatValue('Active', active);
    setStatValue('Overdue', overdue);
    setStatValue('Cancelled', cancelled);
    setStatValue('Completed', completed);
}

function setStatValue(label, value) {
    const cards = document.querySelectorAll('.stat-card')

    cards.forEach(card => {
        const labelEl = card.querySelector('.stat-label')
        if (labelEl && labelEl.textContent.trim().toLowerCase() === label.toLowerCase()) {
            const valueEl = card.querySelector('.stat-value')
            if (valueEl) {
                valueEl.textContent = value
            }
        }
    })
}