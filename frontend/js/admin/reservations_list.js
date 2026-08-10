const token = localStorage.getItem('token')
if (!token) {
    alert('Login to see contents!') 
    window.location.replace('../../loginOrRegister.html')
}

let currentPage = 1
const limit = 10
let currentSearch = ''
let currentFilter = 'all'

new ListController({
    searchInputSelector: '.search-bar',
    dropdownSelector: '.filter-select',
    onApply: ({ search, filter }) => {
        currentSearch = search;
        currentFilter = filter;
        loadAllReservations(1); 
    }
})

document.addEventListener('DOMContentLoaded', () => {
    loadAllReservations()
})

async function loadAllReservations(page = 1) {
    currentPage = page
    try {
        const queryParams = new URLSearchParams({
            page: page,
            limit: limit,
            search: currentSearch,
            status: currentFilter
        })

        const res = await fetch(`/api/reservation/reservations?${queryParams.toString()}`, {
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
        const { reservations, pagination } = data

        renderReservationsTable(reservations)
        renderPaginationControls(pagination)
        
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
          <span>Start / End</span>
          <span>Timeline</span>
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
                <div class="date-time">
                    ${formatTableDate(r.start_time)}
                    <span style="color:#aaa;font-size:0.8em;display:block;text-align:center;">to</span>
                    ${formatTableDate(r.end_time)}
                </div>
                <div class="timeline-cell">${buildTimeline(r)}</div>
                <span>${getStatusBadge(r.status)}</span>
            </div>
        `
        tableWrap.insertAdjacentHTML('beforeend', rowHtml)
    })
}

function renderPaginationControls(pagination) {
    const container = document.getElementById('pagination-controls')
    if (!container) return

    const { currentPage, totalPages } = pagination

    if (totalPages <= 1) {
        container.innerHTML = ''
        return
    }

    const range = new Set()
    range.add(1)
    range.add(totalPages)

    let left = currentPage - 1
    let right = currentPage + 1

    if (currentPage <= 2) {
        left = 1
        right = Math.min(3, totalPages)
    } else if (currentPage >= totalPages - 1) {
        left = Math.max(1, totalPages - 2)
        right = totalPages
    }

    for (let i = left; i <= right; i++) {
        if (i >= 1 && i <= totalPages) {
            range.add(i)
        }
    }

    const sortedRange = Array.from(range).sort((a, b) => a - b)

    const paginatedPages = []
    let lastValue = null

    for (const page of sortedRange) {
        if (lastValue != null) {
            if (page - lastValue === 2) {
                paginatedPages.push(lastValue + 1)
            } else if (page - lastValue > 2) {
                paginatedPages.push('...')
            }
        }
        paginatedPages.push(page)
        lastValue = page
    }

    let innerHTML = ''

    innerHTML += `
        <button class="pag-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">
            &laquo;
        </button>
    `

    paginatedPages.forEach(page => {
        if (page === '...') {
            innerHTML += `<span>...</span>`
        } else {
            innerHTML += `
                <button class="pag-btn ${currentPage === page ? 'active' : ''}" onclick="changePage(${page})">
                    ${page}
                </button>
            `;
        }
    })

    innerHTML += `
        <button class="pag-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">
            &raquo;
        </button>
    `

    container.innerHTML = innerHTML
    
}

window.changePage = function(page) {
    loadAllReservations(page)

    const searchBar = document.querySelector('.search-bar')
    if (searchBar) {
        const searchContainer = searchBar.closest('.d-flex')
        if (searchContainer) {
            searchContainer.scrollIntoView({
                behavior: 'smooth',
                block: 'start' 
            })
        }
    }
}

function buildTimeline(r) {
    const tlRow = (dotCls, label, timestamp) => {
        if (timestamp) {
            return `<div class="tl-row"><span class="tl-dot ${dotCls}"></span><span><strong>${label}</strong> ${formatTableDate(timestamp)}</span></div>`
        }
        return `<div class="tl-row tl-row--empty"><span class="tl-dot tl-dot--empty"></span><span>${label}</span></div>`
    }

    if (r.status === 'cancelled') {
        return [
            tlRow('tl-dot--req',    'Requested', r.created_at),
            tlRow('tl-dot--cancel', 'Cancelled', r.cancelled_at),
        ].join('')
    }

    return [
        tlRow('tl-dot--req',  'Requested',       r.created_at),
        tlRow('tl-dot--pick', r.checkout_time    ? 'Pickup'          : 'Not picked up yet', r.checkout_time),
        tlRow('tl-dot--scan', r.return_scan_time ? 'Return scan'     : 'Not returned yet',  r.return_scan_time),
        tlRow('tl-dot--ret',  r.return_time      ? 'Return approved' : 'Not confirmed yet', r.return_time),
    ].join('')
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
    // DB stores naive Helsinki timestamps — parse as local to avoid browser timezone shift
    const clean = isoString.replace(' ', 'T').slice(0, 19)
    const [datePart, timePart] = clean.split('T')
    const [year, month, day] = datePart.split('-')
    const [hours, minutes] = timePart.split(':')
    return `${day}/${month}/${year} ${hours}:${minutes}`
}

