const token = localStorage.getItem('token')
let requests = []

document.addEventListener("DOMContentLoaded", () => {
    initDashboard()
})

async function initDashboard() {
    returnRequests = await fetchReturnRequests()
    renderLeftPanel(returnRequests)
    setupClickListeners()
}

async function fetchReturnRequests() {
    try {
        const res = await fetch('/api/reservation/return-requests', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json' ,
                'Authorization': `Bearer ${token}`
            }
        })

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await res.json()
        return data.requestsData || []

    } catch (error) {
        console.error('Error loading return requests:', error)
        return []
    }
}

function renderLeftPanel(requests) {
    const leftPanel = document.getElementById('leftPanel')
    if (!leftPanel) return

    leftPanel.innerHTML = '<div class="panel-title">Return Requests</div>'

    if (!requests || requests.length === 0) {
        leftPanel.insertAdjacentHTML('beforeend', '<div class="eq-meta" style="padding: 15px;">No pending return requests.</div>')
        return
    }

    requests.forEach((item, index) => {
        const activeClass = index === 0 ? 'active' : ''

        const eqName = item.equipment_name || `Equipment Type #${item.type_id}`
        const unitName = item.qr_code || `Unit #${item.unit_id}`
        const userName = item.full_name || `User ID: ${item.user_id}`

        const cardHtml = `
            <div class="request-card ${activeClass}" data-index="${index}">
                <div class="eq-name">${eqName}</div>
                <div class="eq-meta">Unit: ${unitName}</div>
                <div class="eq-meta">${userName}</div>
            </div>
        `;

        leftPanel.insertAdjacentHTML('beforeend', cardHtml)
    })

    if (requests.length > 0) {
        updateRightPanel(0)
    }
}

function setupClickListeners() {
    const leftPanel = document.getElementById('leftPanel')
    if (!leftPanel) return

    leftPanel.addEventListener('click', (e) => {
        const card = e.target.closest('.request-card')
        if (!card) return

        document.querySelectorAll('.request-card').forEach(c => c.classList.remove('active'))
    
        card.classList.add('active')

        const index = parseInt(card.getAttribute('data-index'), 10)

        updateRightPanel(index)
    })
}

function updateRightPanel(index) {
    const r = returnRequests[index];
    if (!r) return;

    document.getElementById('detailName').textContent     = r.equipment_name || `Equipment #${r.type_id}`;
    document.getElementById('detailId').textContent       = r.reservation_id;
    document.getElementById('detailUnit').textContent     = r.qr_code || r.unit_id;
    document.getElementById('detailUser').textContent     = r.full_name || r.user_id;
    document.getElementById('detailEmail').textContent    = r.email || 'No email provided';
    document.getElementById('detailLocation').textContent = r.location || 'Linnanmaa Kirjasto';

    document.getElementById('detailStart').innerHTML      = formatDate(r.start_time);
    document.getElementById('detailEnd').innerHTML        = formatDate(r.end_time);
    document.getElementById('detailReturn').innerHTML     = formatDate(r.return_time);
}

function formatDate(isoString) {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${hours}:${minutes} &nbsp; ${day}/${month}/${year}`;
}